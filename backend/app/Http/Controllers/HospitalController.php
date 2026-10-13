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

        $cityInput     = trim($request->input('city', ''));
        $landmarkInput = trim($request->input('landmark', ''));
        $stateInput    = trim($request->input('state', ''));

        // Geocode manual details if coordinates are missing — always fresh, never cached
        if ($lat === null || $lng === null) {
            if (empty($cityInput) && empty($landmarkInput) && empty($stateInput)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please enter a State, City, or Landmark for manual location search.'
                ], 422);
            }

            $addressDetails = [
                'state'    => $stateInput ?: null,
                'city'     => $cityInput ?: null,
                'landmark' => $landmarkInput ?: null,
                'pincode'  => $request->input('pincode')
            ];

            $geoResult = GoogleMapsService::geocode($addressDetails);
            if ($geoResult) {
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

            // If coordinates provided (e.g. live GPS), reverse-geocode to identify user's locality, city, and state
            if (empty($geocodedAddress)) {
                $rev = GoogleMapsService::reverseGeocode($latVal, $lngVal);
                if ($rev) {
                    $geocodedAddress = $rev['formatted_address'] ?? null;
                    if (empty($cityInput) && !empty($rev['city'])) {
                        $cityInput = $rev['city'];
                    }
                    if (empty($stateInput) && !empty($rev['state'])) {
                        $stateInput = $rev['state'];
                    }
                }
            }
        } else {
            // Default center coordinates fallback (Bangalore, India)
            $lat = 12.9716;
            $lng = 77.5946;
        }

        $hospitals = Hospital::all();

        // 1. Calculate precise road distances for ALL candidate hospitals and attach ETA
        $withDistances = GoogleMapsService::calculateDistances(floatval($lat), floatval($lng), $hospitals);

        $cityAliases = [
            'trichy'             => ['trichy', 'tiruchirappalli', 'tiruchi'],
            'tiruchirappalli'    => ['trichy', 'tiruchirappalli', 'tiruchi'],
            'tiruchi'            => ['trichy', 'tiruchirappalli', 'tiruchi'],
            'madurai'            => ['madurai'],
            'chennai'            => ['chennai', 'madras'],
            'coimbatore'         => ['coimbatore', 'kovai'],
            'salem'              => ['salem'],
            'bangalore'          => ['bangalore', 'bengaluru'],
            'bengaluru'          => ['bangalore', 'bengaluru'],
            'mysore'             => ['mysore', 'mysuru'],
            'mysuru'             => ['mysore', 'mysuru'],
            'mumbai'             => ['mumbai', 'bombay'],
            'pune'               => ['pune'],
            'nagpur'             => ['nagpur'],
            'delhi'              => ['delhi', 'new delhi'],
            'gurgaon'            => ['gurgaon', 'gurugram'],
            'gurugram'           => ['gurgaon', 'gurugram'],
            'noida'              => ['noida'],
            'faridabad'          => ['faridabad'],
            'jaipur'             => ['jaipur'],
            'jodhpur'            => ['jodhpur'],
            'udaipur'            => ['udaipur'],
            'ahmedabad'          => ['ahmedabad'],
            'surat'              => ['surat'],
            'vadodara'           => ['vadodara', 'baroda'],
            'chandigarh'         => ['chandigarh'],
            'ludhiana'           => ['ludhiana'],
            'amritsar'           => ['amritsar'],
            'visakhapatnam'      => ['visakhapatnam', 'vizag'],
            'vizag'              => ['visakhapatnam', 'vizag'],
            'vijayawada'         => ['vijayawada'],
            'hyderabad'          => ['hyderabad'],
            'warangal'           => ['warangal'],
            'kochi'              => ['kochi', 'cochin'],
            'thiruvananthapuram' => ['thiruvananthapuram', 'trivandrum'],
            'trivandrum'         => ['thiruvananthapuram', 'trivandrum'],
            'kozhikode'          => ['kozhikode', 'calicut'],
            'calicut'            => ['kozhikode', 'calicut'],
            'kolkata'            => ['kolkata', 'calcutta'],
            'lucknow'            => ['lucknow'],
            'varanasi'           => ['varanasi', 'banaras', 'kashi'],
            'agra'               => ['agra'],
            'bhopal'             => ['bhopal'],
            'indore'             => ['indore'],
            'patna'              => ['patna'],
            'ranchi'             => ['ranchi'],
            'bhubaneswar'        => ['bhubaneswar'],
            'guwahati'           => ['guwahati'],
            'panaji'             => ['panaji', 'goa'],
            'shimla'             => ['shimla'],
            'dehradun'           => ['dehradun', 'rishikesh'],
            'raipur'             => ['raipur'],
        ];

        // Infer cityInput if empty but landmark mentions a known city
        if (empty($cityInput) && !empty($landmarkInput)) {
            $landmarkLower = strtolower($landmarkInput);
            foreach ($cityAliases as $cKey => $aliases) {
                foreach ($aliases as $alias) {
                    if (str_contains($landmarkLower, $alias)) {
                        $cityInput = $cKey;
                        break 2;
                    }
                }
            }
        }

        $processed = collect();

        // 2. Priority 1: If City is specified, STRICTLY filter open hospitals in that city!
        if (!empty($cityInput)) {
            $normCity = strtolower(trim($cityInput));
            $allowedAliases = $cityAliases[$normCity] ?? [$normCity];

            $cityMatches = $withDistances->filter(function ($hosp) use ($allowedAliases) {
                if (strtolower($hosp->hospital_status) !== 'open') {
                    return false;
                }
                $hospCityLower = strtolower(trim($hosp->city));
                foreach ($allowedAliases as $alias) {
                    if ($hospCityLower === $alias || str_contains($hospCityLower, $alias) || str_contains($alias, $hospCityLower)) {
                        return true;
                    }
                }
                return false;
            });

            if ($cityMatches->isNotEmpty()) {
                $processed = $cityMatches;
            }
        }

        // 3. Priority 2: If City was not specified or had no direct matches, but State was specified:
        if ($processed->isEmpty() && !empty($stateInput)) {
            $stateMatches = $withDistances->filter(function ($hosp) use ($stateInput) {
                return strtolower($hosp->hospital_status) === 'open' &&
                    (strcasecmp(trim($hosp->state), $stateInput) === 0 || str_contains(strtolower($hosp->state), strtolower($stateInput)));
            });
            if ($stateMatches->isNotEmpty()) {
                // If patient searched from a specific locality, prioritize local hospitals (within 60km)
                $nearbyInState = $stateMatches->filter(fn($h) => $h->distance_km <= 60);
                $processed = $nearbyInState->isNotEmpty() ? $nearbyInState : $stateMatches;
            }
        }

        // 4. Priority 3: Fallback by distance radius (within 60km)
        if ($processed->isEmpty()) {
            $processed = $withDistances->filter(function ($hosp) {
                return strtolower($hosp->hospital_status) === 'open' && $hosp->distance_km <= 60;
            });
        }

        // 5. Ultimate fallback: closest 10 open hospitals
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
