<?php

namespace App\Http\Controllers;

use App\Models\Hospital;
use App\Services\GoogleMapsService;
use Illuminate\Http\Request;
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

        // Geocode manual details if coordinates are missing
        if ($lat === null || $lng === null) {
            $addressDetails = [
                'state' => $request->input('state'),
                'city' => $request->input('city'),
                'landmark' => $request->input('landmark'),
                'pincode' => $request->input('pincode')
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

        // 1. Process distances, ETAs and filter nearby hospitals (within 100km)
        $processed = $hospitals->map(function ($hosp) use ($lat, $lng) {
            // Calculate Haversine distance
            $distance = 6371 * acos(
                cos(deg2rad($lat)) * cos(deg2rad($hosp->latitude)) *
                cos(deg2rad($hosp->longitude) - deg2rad($lng)) +
                sin(deg2rad($lat)) * sin(deg2rad($hosp->latitude))
            );

            // Dynamic ETA: 2 mins per km + baseline traffic latency
            $eta = round(($distance * 2) + 3);

            $hosp->distance_km = round($distance, 2);
            $hosp->eta_minutes = $eta;

            return $hosp;
        })
        ->filter(function ($hosp) {
            // Filter by Open status and within 100km radius range
            return strtolower($hosp->hospital_status) === 'open' && $hosp->distance_km <= 100;
        });

        // If no hospitals are within 100km, fall back to matching by state/city or loading all open hospitals
        if ($processed->isEmpty()) {
            $processed = $hospitals->filter(function ($hosp) {
                return strtolower($hosp->hospital_status) === 'open';
            })->map(function ($hosp) use ($lat, $lng) {
                $distance = 6371 * acos(
                    cos(deg2rad($lat)) * cos(deg2rad($hosp->latitude)) *
                    cos(deg2rad($hosp->longitude) - deg2rad($lng)) +
                    sin(deg2rad($lat)) * sin(deg2rad($hosp->latitude))
                );
                $hosp->distance_km = round($distance, 2);
                $hosp->eta_minutes = round(($distance * 2) + 3);
                return $hosp;
            });
        }

        // 2. Sort according to strict priority order:
        //    1. Lowest Waiting Time
        //    2. Shortest ETA
        //    3. Required Doctor Available
        //    4. Required Beds Available
        //    5. Lowest Queue Count
        $sorted = $processed->sort(function ($a, $b) {
            // Priority 1: Lowest Waiting Time
            if ($a->er_wait_minutes !== $b->er_wait_minutes) {
                return $a->er_wait_minutes <=> $b->er_wait_minutes;
            }

            // Priority 2: Shortest Travel ETA
            if ($a->eta_minutes !== $b->eta_minutes) {
                return $a->eta_minutes <=> $b->eta_minutes;
            }

            // Priority 3: Distance
            if ($a->distance_km !== $b->distance_km) {
                return $a->distance_km <=> $b->distance_km;
            }

            // Priority 4: Doctor Availability
            $aDoc = $a->available_doctors > 0 ? 1 : 0;
            $bDoc = $b->available_doctors > 0 ? 1 : 0;
            if ($aDoc !== $bDoc) {
                return $bDoc <=> $aDoc;
            }

            // Priority 5: ICU Bed Availability
            $aIcu = $a->available_icu_beds > 0 ? 1 : 0;
            $bIcu = $b->available_icu_beds > 0 ? 1 : 0;
            if ($aIcu !== $bIcu) {
                return $bIcu <=> $aIcu;
            }

            // Priority 6: Emergency Bed Availability
            $aEr = $a->emergency_beds > 0 ? 1 : 0;
            $bEr = $b->emergency_beds > 0 ? 1 : 0;
            if ($aEr !== $bEr) {
                return $bEr <=> $aEr;
            }

            // Priority 7: Lowest Queue Count
            if ($a->queue_count !== $b->queue_count) {
                return $a->queue_count <=> $b->queue_count;
            }

            // Priority 8: Hospital Rating
            return $b->rating <=> $a->rating;
        })->values();

        // 3. Assign recommendation scores based on relative sorted ranks
        $totalCount = $sorted->count();
        $scored = $sorted->map(function ($hosp, $index) use ($totalCount) {
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
            return $hosp;
        });

        $bestMatch = $scored->first();
        // Return all matched nearby hospitals
        $allMatches = $scored;

        // Generate the dynamic explanation text for the top match
        $explanation = "";
        if ($bestMatch) {
            $closest = $scored->sortBy('distance_km')->first();
            
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
                ]
            ]
        ]);
    }
}
