<?php

namespace App\Http\Controllers;

use App\Models\Hospital;
use App\Models\EmergencyAppointment;
use App\Services\GoogleMapsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class HospitalController extends Controller
{
    /**
     * Search and rank hospitals by treatment speed.
     */
    public function index(Request $request)
    {
        $lat = $request->input('latitude');
        $lng = $request->input('longitude');
        $severity = $request->input('severity', 'Medium'); // Low, Medium, High
        $specialty = $request->input('specialty');
        $geocodedAddress = null;

        // Geocode manual details if coordinates are missing — always fresh, never cached
        if ($lat === null || $lng === null) {
            $cityInput     = trim($request->input('city', ''));
            $landmarkInput = trim($request->input('landmark', ''));

            if (empty($cityInput) && empty($landmarkInput)) {
                return response()->json([
                    'success' => false,
                    'message' => 'City name is required for manual location search.'
                ], 422);
            }

            $addressDetails = [
                'state'    => $request->input('state'),
                'city'     => $cityInput,
                'landmark' => $landmarkInput,
                'pincode'  => $request->input('pincode')
            ];

            $geoResult = GoogleMapsService::geocode($addressDetails);
            if ($geoResult) {
                if (isset($geoResult['landmark_found']) && $geoResult['landmark_found'] === false) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Landmark not found. Please enter a valid landmark or locality.'
                    ], 422);
                }

                if (!$geoResult['is_india']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'This application currently supports emergency services only within India.'
                    ], 422);
                }
                $lat = $geoResult['latitude'];
                $lng = $geoResult['longitude'];
                $geocodedAddress = $geoResult['formatted_address'] ?? null;
            }
        }

        // Validate India Borders
        if ($lat !== null && $lng !== null) {
            $latVal = floatval($lat);
            $lngVal = floatval($lng);
            if ($latVal < 6.0 || $latVal > 38.0 || $lngVal < 68.0 || $lngVal > 98.0) {
                return response()->json([
                    'success' => false,
                    'message' => 'This application currently supports emergency services only within India.'
                ], 422);
            }
        } else {
            // Default center coordinates fallback (Bangalore, India)
            $lat = 12.9716;
            $lng = 77.5946;
        }

        $hospitals = Hospital::all();

        // 1. Calculate precise road distances for ALL hospitals and attach ETA
        $withDistances = GoogleMapsService::calculateDistances(floatval($lat), floatval($lng), $hospitals);

        // 2. Filter: open hospitals within 100km
        $processed = $withDistances->filter(function ($hosp) {
            return strtolower($hosp->hospital_status) === 'open' && $hosp->distance_km <= 100;
        });

        // 3. Fallback: if nothing within 100km, take the 10 CLOSEST open hospitals
        //    (avoids returning 59 random hospitals ranked by wait time rather than distance)
        if ($processed->isEmpty()) {
            $processed = $withDistances
                ->filter(fn($h) => strtolower($h->hospital_status) === 'open')
                ->sortBy('distance_km')
                ->take(10);
        }


        // 2. Compute a weighted composite score for each hospital.
        //    This ensures that changing the patient's GPS location meaningfully
        //    changes the ranking, rather than always picking the same low-wait hospitals.
        //
        //    Score components (lower is better):
        //      - Total treatment time  = ETA + ER wait           (weight: 40%)
        //      - Distance              = distance_km             (weight: 20%)
        //      - Queue pressure        = queue_count             (weight: 10%)
        //      - Resource penalty      = lack of doctors/beds    (weight: 15%)
        //      - Rating bonus          = inverse of rating       (weight: 15%)

        // First, collect min/max values for normalization
        $allDistances  = $processed->pluck('distance_km');
        $allEtas       = $processed->pluck('eta_minutes');
        $allWaits      = $processed->pluck('er_wait_minutes');
        $allQueues     = $processed->pluck('queue_count');
        $allRatings    = $processed->pluck('rating');
        $allDoctors    = $processed->pluck('available_doctors');
        $allIcu        = $processed->pluck('available_icu_beds');
        $allEmergency  = $processed->pluck('emergency_beds');

        // Fetch logged-in patient's previous completed emergency visits for History Affinity Scoring
        $user = Auth::guard('api')->user();
        $userHistoryHospitals = [];
        if ($user) {
            $userHistoryHospitals = EmergencyAppointment::where('user_id', $user->id)
                ->where('status', 'Completed')
                ->pluck('hospital_name')
                ->filter()
                ->toArray();
        }

        $minDist = $allDistances->min() ?: 0;  $maxDist = $allDistances->max() ?: 1;
        $minWait = $allWaits->min() ?: 0;       $maxWait = $allWaits->max() ?: 1;
        $minEta  = $allEtas->min() ?: 0;        $maxEta  = $allEtas->max() ?: 1;
        $minQueue = $allQueues->min() ?: 0;     $maxQueue = $allQueues->max() ?: 1;
        $minRating = $allRatings->min() ?: 1;   $maxRating = $allRatings->max() ?: 5;
        $maxDoctors = $allDoctors->max() ?: 1;
        $maxIcu = $allIcu->max() ?: 1;
        $maxEmBeds = $allEmergency->max() ?: 1;

        // Normalize helper: returns value between 0 and 1
        $normalize = function ($val, $min, $max) {
            if ($max == $min) return 0;
            return ($val - $min) / ($max - $min);
        };

        $scored = $processed->map(function ($hosp) use ($normalize, $minDist, $maxDist, $minWait, $maxWait, $minEta, $maxEta, $minQueue, $maxQueue, $minRating, $maxRating, $maxDoctors, $maxIcu, $maxEmBeds, $userHistoryHospitals) {
            // Normalized values (0 = best, 1 = worst for cost factors)
            $nTotalTime = $normalize($hosp->eta_minutes + $hosp->er_wait_minutes, $minEta + $minWait, $maxEta + $maxWait);
            $nDist      = $normalize($hosp->distance_km, $minDist, $maxDist);
            $nQueue     = $normalize($hosp->queue_count, $minQueue, $maxQueue);

            // Resource score: higher is better, so invert (1 - normalized)
            $doctorScore = $maxDoctors > 0 ? ($hosp->available_doctors / $maxDoctors) : 0;
            $icuScore    = $maxIcu > 0 ? ($hosp->available_icu_beds / $maxIcu) : 0;
            $emBedScore  = $maxEmBeds > 0 ? ($hosp->emergency_beds / $maxEmBeds) : 0;
            $ambScore    = ($hosp->ambulance_available !== false && (bool)$hosp->ambulance_available) ? 1.0 : 0.0;
            $nResource   = 1 - (($doctorScore * 0.35) + ($icuScore * 0.25) + ($emBedScore * 0.25) + ($ambScore * 0.15));

            // Rating score: higher rating = lower cost
            $nRating = 1 - $normalize($hosp->rating, $minRating, $maxRating);

            // Patient History Affinity Bonus
            $historyVisits = 0;
            if (!empty($userHistoryHospitals)) {
                foreach ($userHistoryHospitals as $prevHospName) {
                    if (strcasecmp(trim($prevHospName), trim($hosp->name)) === 0) {
                        $historyVisits++;
                    }
                }
            }
            $historyBonus = $historyVisits > 0 ? min(0.10, $historyVisits * 0.05) : 0.0;
            $hosp->patient_history_visit_count = $historyVisits;

            // Weighted composite cost (lower = better hospital choice, with patient history bonus reducing cost)
            $cost = ($nTotalTime * 0.30) + ($nDist * 0.20) + ($nQueue * 0.10) + ($nResource * 0.20) + ($nRating * 0.10) - $historyBonus;
            $cost = max(0.0, $cost);

            $hosp->_sort_cost = round($cost, 6);
            return $hosp;
        });

        // Sort by composite cost (ascending = best first)
        $sorted = $scored->sortBy('_sort_cost')->values();

        // 3. Assign recommendation scores based on relative sorted ranks
        $totalCount = $sorted->count();
        $sorted = $sorted->map(function ($hosp, $index) use ($totalCount) {
            if ($index === 0) {
                $score = 99;
            } elseif ($index === 1) {
                $score = 92;
            } elseif ($index === 2) {
                $score = 85;
            } elseif ($index === 3) {
                $score = 78;
            } elseif ($index === 4) {
                $score = 70;
            } else {
                $score = max(30, round(65 - (($index - 4) * 2)));
            }
            $hosp->recommendation_score = $score;
            unset($hosp->_sort_cost); // Clean up internal field
            return $hosp;
        });

        $bestMatch = $sorted->first();

        // Deduplicate by hospital ID, then return top 10
        $seenIds = [];
        $allMatches = $sorted->filter(function ($h) use (&$seenIds) {
            if (in_array($h->id, $seenIds)) return false;
            $seenIds[] = $h->id;
            return true;
        })->take(10)->values();

        // Generate the dynamic explanation text for the top match
        $explanation = "";
        if ($bestMatch) {
            $closest = $sorted->sortBy('distance_km')->first();
            
            $explanation = "{$bestMatch->name} is recommended as the fastest path to emergency treatment. ";
            $explanation .= "While it is {$bestMatch->distance_km} km away (ETA: {$bestMatch->eta_minutes} mins), its ER waiting time is only {$bestMatch->er_wait_minutes} mins, ";
            $explanation .= "meaning you can be seen in approximately " . ($bestMatch->eta_minutes + $bestMatch->er_wait_minutes) . " minutes total. ";
            
            if ($closest && $closest->id !== $bestMatch->id) {
                $explanation .= "In comparison, the physically closest hospital ({$closest->name}) is {$closest->distance_km} km away but has a waiting time of {$closest->er_wait_minutes} mins, ";
                $explanation .= "which would result in a longer wait of " . ($closest->eta_minutes + $closest->er_wait_minutes) . " minutes total before treatment starts. ";
            }
            $explanation .= "This choice is also backed by having {$bestMatch->available_doctors} active doctors and vacant beds in the required department.";
        }

        return response()->json([
            'success' => true,
            'data' => [
                'hospitals' => $allMatches,
                'recommendation_reason' => $explanation,
                'searched_coords' => [
                    'latitude' => $lat,
                    'longitude' => $lng
                ],
                'geocoded_address' => $geocodedAddress
            ]
        ]);
    }
}
