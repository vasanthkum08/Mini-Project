<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GoogleMapsService
{
    /**
     * Resolve manual address details into GPS coordinates.
     *
     * Strategy order:
     *   1. Google Maps Geocoding API  (if GOOGLE_MAPS_API_KEY is set)
     *   2. OpenStreetMap Nominatim    (free, no key — handles any address)
     *   3. Hardcoded fallback map     (offline safety net)
     */
    /**
     * Resolve manual address details into GPS coordinates.
     *
     * Strategy:
     *   1. If landmark is specified, resolve specific landmark/locality coordinates.
     *      If landmark cannot be resolved, return landmark_found => false (triggers 422 Landmark Not Found).
     *   2. If no landmark is specified, resolve City + State location using Google, Nominatim, Photon & Fallbacks.
     */
    public static function geocode(array $addressDetails): ?array
    {
        $landmark = !empty($addressDetails['landmark']) ? trim($addressDetails['landmark']) : null;
        $city     = !empty($addressDetails['city']) ? trim($addressDetails['city']) : null;
        $state    = !empty($addressDetails['state']) ? trim($addressDetails['state']) : null;
        $pincode  = !empty($addressDetails['pincode']) ? trim($addressDetails['pincode']) : null;

        // If landmark is explicitly entered by patient, geocode specifically for the landmark/locality
        if (!empty($landmark)) {
            $landmarkResult = self::geocodeLandmark($landmark, $city, $state, $pincode);
            if ($landmarkResult) {
                return $landmarkResult;
            }
            // Landmark entered but could not be resolved to any valid locality/geocoded spot
            return [
                'landmark_found' => false,
                'is_india'       => true,
            ];
        }

        // General address query when no landmark is specified (City + State fallback)
        $queryParts    = array_filter([$city, $state, $pincode]);
        $addressString = implode(', ', $queryParts);
        if (empty($addressString)) {
            return null;
        }

        if (!str_contains(strtolower($addressString), 'india')) {
            $addressString .= ', India';
        }

        \Log::info('[Geocode] Resolving general location: ' . $addressString);

        // ── Strategy 1: Google Maps API ──────────────────────────────────────
        $apiKey = env('GOOGLE_MAPS_API_KEY');
        if ($apiKey) {
            $result = self::tryGoogle($addressString, $apiKey);
            if ($result) {
                \Log::info('[Geocode] Google → ' . $result['formatted_address']);
                return $result;
            }
        }

        // ── Strategy 2: Nominatim (OpenStreetMap) ───────────────────────────
        $result = self::tryNominatim($addressString);
        if ($result) {
            \Log::info('[Geocode] Nominatim → ' . $result['formatted_address']);
            return $result;
        }

        // ── Strategy 3: Photon (Komoot OSM) ──────────────────────────────────
        $result = self::tryPhoton($addressString, null, $city);
        if ($result) {
            \Log::info('[Geocode] Photon → ' . $result['formatted_address']);
            return $result;
        }

        // ── Strategy 4: Fallback Map ──────────────────────────────────────────
        $result = self::tryFallback($addressString);
        \Log::info('[Geocode] Fallback → ' . $result['formatted_address']);
        return $result;
    }

    /**
     * Dedicated dynamic geocoding for specific landmarks and localities.
     */
    private static function geocodeLandmark(string $landmark, ?string $city, ?string $state, ?string $pincode): ?array
    {
        $queryParts = array_filter([$landmark, $city, $state, $pincode]);
        $fullQuery  = implode(', ', $queryParts) . ', India';

        \Log::info('[Geocode Landmark] Resolving landmark: ' . $fullQuery);

        $apiKey = env('GOOGLE_MAPS_API_KEY');

        // 1. Google Maps Geocoding API if key configured
        if ($apiKey) {
            $googleRes = self::tryGoogle($fullQuery, $apiKey);
            if ($googleRes) {
                \Log::info('[Geocode Landmark] Google → ' . $googleRes['formatted_address']);
                return $googleRes;
            }
        }

        // 2. OpenStreetMap Nominatim with targeted landmark queries
        $nominatimQueries = [
            $fullQuery,
            implode(', ', array_filter([$landmark, $city])) . ', India',
            implode(', ', array_filter([$landmark, $city])),
        ];

        foreach ($nominatimQueries as $q) {
            $nomRes = self::tryNominatimLandmark($q, $landmark, $city);
            if ($nomRes) {
                \Log::info('[Geocode Landmark] Nominatim → ' . $nomRes['formatted_address']);
                return $nomRes;
            }
        }

        // 3. Photon Komoot OSM API (exceptional for Indian locality resolution)
        $photonQuery = implode(' ', array_filter([$landmark, $city, $state, 'India']));
        $photonRes   = self::tryPhoton($photonQuery, $landmark, $city);
        if ($photonRes) {
            \Log::info('[Geocode Landmark] Photon → ' . $photonRes['formatted_address']);
            return $photonRes;
        }

        // 4. Fallback offline dictionary match for known landmarks
        $fallbackRes = self::tryFallback(implode(', ', array_filter([$landmark, $city])));
        if ($fallbackRes) {
            $fmtLower      = strtolower($fallbackRes['formatted_address']);
            $landmarkLower = strtolower($landmark);
            if (str_contains($fmtLower, $landmarkLower) || str_contains($landmarkLower, 'kaitari') || str_contains($landmarkLower, 'kaithari')) {
                \Log::info('[Geocode Landmark] Fallback → ' . $fallbackRes['formatted_address']);
                return $fallbackRes;
            }
        }

        return null;
    }

    private static function tryNominatimLandmark(string $query, string $landmark, ?string $city): ?array
    {
        try {
            $res = Http::timeout(6)
                ->withHeaders([
                    'User-Agent' => 'EmergenixAI/1.0 (emergency.healthcare@example.com)',
                    'Accept'     => 'application/json',
                ])
                ->get('https://nominatim.openstreetmap.org/search', [
                    'q'              => $query,
                    'format'         => 'json',
                    'limit'          => 5,
                    'countrycodes'   => 'in',
                    'addressdetails' => 1,
                ]);

            if (!$res->successful()) return null;

            $results = $res->json();
            if (empty($results)) return null;

            $landmarkLower = strtolower(trim($landmark));
            $cityLower     = $city ? strtolower(trim($city)) : '';

            foreach ($results as $top) {
                $lat = floatval($top['lat']);
                $lng = floatval($top['lon']);

                if ($lat < 6.0 || $lat > 38.0 || $lng < 68.0 || $lng > 98.0) {
                    continue;
                }

                $displayName = strtolower($top['display_name'] ?? '');
                $type        = $top['type'] ?? '';
                $class       = $top['class'] ?? '';
                $name        = strtolower($top['name'] ?? '');

                $isLandmarkMatch = str_contains($displayName, $landmarkLower) || str_contains($name, $landmarkLower);
                $isLocalityType  = in_array($type, ['suburb', 'neighbourhood', 'bus_stop', 'residential', 'quarter', 'hamlet', 'village', 'amenity', 'place', 'road']) ||
                                   in_array($class, ['place', 'highway', 'amenity', 'tourism', 'landuse', 'leisure']);

                if ($isLandmarkMatch || $isLocalityType) {
                    if (!empty($cityLower) && $name === $cityLower && !$isLandmarkMatch) {
                        continue;
                    }

                    $addr  = $top['address'] ?? [];
                    $parts = array_filter([
                        $addr['suburb'] ?? $addr['neighbourhood'] ?? $addr['village'] ?? $addr['town'] ?? $top['name'] ?? null,
                        $addr['city']   ?? $addr['county'] ?? null,
                        $addr['state']  ?? null,
                        'India',
                    ]);
                    $displayNameClean = implode(', ', $parts) ?: $top['display_name'];

                    return [
                        'latitude'          => $lat,
                        'longitude'         => $lng,
                        'is_india'          => true,
                        'formatted_address' => $displayNameClean,
                    ];
                }
            }
        } catch (\Exception $e) {
            \Log::warning('[Geocode] Nominatim landmark failed for "' . $query . '": ' . $e->getMessage());
        }
        return null;
    }

    private static function tryPhoton(string $query, ?string $landmark = null, ?string $city = null): ?array
    {
        try {
            $res = Http::timeout(6)->get('https://photon.komoot.io/api/', [
                'q'     => $query,
                'limit' => 5,
            ]);

            if (!$res->successful()) return null;

            $data = $res->json();
            if (empty($data['features'])) return null;

            $landmarkLower = $landmark ? strtolower(trim($landmark)) : null;
            $cityLower     = $city ? strtolower(trim($city)) : null;

            foreach ($data['features'] as $feat) {
                $p      = $feat['properties'] ?? [];
                $coords = $feat['geometry']['coordinates'] ?? [];
                if (count($coords) < 2) continue;

                $lng = floatval($coords[0]);
                $lat = floatval($coords[1]);

                if ($lat < 6.0 || $lat > 38.0 || $lng < 68.0 || $lng > 98.0) {
                    continue;
                }

                $name     = strtolower($p['name'] ?? ($p['street'] ?? ''));
                $street   = strtolower($p['street'] ?? '');
                $featCity = strtolower($p['city'] ?? ($p['county'] ?? ($p['state'] ?? '')));

                $labelParts = array_filter([
                    $p['name'] ?? null,
                    $p['street'] ?? null,
                    $p['city'] ?? $p['county'] ?? null,
                    $p['state'] ?? null,
                    'India',
                ]);
                $label = strtolower(implode(', ', $labelParts));

                // If a landmark was requested, strictly verify landmark string relevance
                if ($landmarkLower) {
                    $hasMatch = str_contains($name, $landmarkLower) ||
                                str_contains($street, $landmarkLower) ||
                                str_contains($label, $landmarkLower);

                    if (!$hasMatch) {
                        // Check significant non-generic words in landmark
                        $stopWords = ['nagar', 'street', 'road', 'stand', 'bus', 'main', 'cross', 'area', 'colony', 'lane', 'center', 'centre', 'park', 'near', 'opp', 'opposite', 'india'];
                        $words     = array_filter(explode(' ', $landmarkLower), function ($w) use ($stopWords) {
                            return strlen($w) >= 3 && !in_array($w, $stopWords);
                        });

                        if (!empty($words)) {
                            $wordMatched = false;
                            foreach ($words as $w) {
                                if (str_contains($name, $w) || str_contains($street, $w) || str_contains($label, $w)) {
                                    $wordMatched = true;
                                    break;
                                }
                            }
                            if (!$wordMatched) {
                                continue; // Skip irrelevant feature when geocoding landmark
                            }
                        } else {
                            continue;
                        }
                    }

                    if ($cityLower && $name === $cityLower && !str_contains($label, $landmarkLower)) {
                        continue;
                    }
                }

                return [
                    'latitude'          => $lat,
                    'longitude'         => $lng,
                    'is_india'          => true,
                    'formatted_address' => ucwords(implode(', ', array_filter([$p['name'] ?? null, $p['street'] ?? null, $p['city'] ?? $p['county'] ?? null, $p['state'] ?? null, 'India']))),
                ];
            }
        } catch (\Exception $e) {
            \Log::warning('[Geocode] Photon failed for "' . $query . '": ' . $e->getMessage());
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Google Maps Geocoding
    // ─────────────────────────────────────────────────────────────────────────
    private static function tryGoogle(string $address, string $apiKey): ?array
    {
        try {
            $res = Http::timeout(5)->get('https://maps.googleapis.com/maps/api/geocode/json', [
                'address' => $address,
                'key'     => $apiKey,
            ]);
            if ($res->successful()) {
                $data = $res->json();
                if ($data['status'] === 'OK' && !empty($data['results'])) {
                    $loc   = $data['results'][0]['geometry']['location'];
                    $india = false;
                    foreach ($data['results'][0]['address_components'] as $c) {
                        if (in_array('country', $c['types']) && $c['short_name'] === 'IN') {
                            $india = true;
                            break;
                        }
                    }
                    return [
                        'latitude'          => floatval($loc['lat']),
                        'longitude'         => floatval($loc['lng']),
                        'is_india'          => $india,
                        'formatted_address' => $data['results'][0]['formatted_address'],
                    ];
                }
            }
        } catch (\Exception $e) {
            \Log::warning('[Geocode] Google failed: ' . $e->getMessage());
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OpenStreetMap Nominatim
    // ─────────────────────────────────────────────────────────────────────────
    private static function tryNominatim(string $query): ?array
    {
        try {
            $res = Http::timeout(7)
                ->withHeaders([
                    'User-Agent' => 'EmergenixAI/1.0 (emergency.healthcare@example.com)',
                    'Accept'     => 'application/json',
                ])
                ->get('https://nominatim.openstreetmap.org/search', [
                    'q'              => $query,
                    'format'         => 'json',
                    'limit'          => 5,
                    'countrycodes'   => 'in',
                    'addressdetails' => 1,
                ]);

            if (!$res->successful()) return null;

            $results = $res->json();
            if (empty($results)) return null;

            // Sort by importance (highest first) and pick the best
            usort($results, fn($a, $b) => ($b['importance'] ?? 0) <=> ($a['importance'] ?? 0));
            $top = $results[0];

            $lat = floatval($top['lat']);
            $lng = floatval($top['lon']);

            // Must be within India's geographical boundaries
            if ($lat < 6.0 || $lat > 38.0 || $lng < 68.0 || $lng > 98.0) {
                return null;
            }

            // Build a clean, readable display name
            $addr  = $top['address'] ?? [];
            $parts = array_filter([
                $addr['suburb']   ?? $addr['neighbourhood'] ?? $addr['village'] ?? $addr['town'] ?? null,
                $addr['city']     ?? $addr['county'] ?? null,
                $addr['state']    ?? null,
                'India',
            ]);
            $displayName = implode(', ', $parts) ?: $top['display_name'];

            return [
                'latitude'          => $lat,
                'longitude'         => $lng,
                'is_india'          => true,
                'formatted_address' => $displayName,
            ];
        } catch (\Exception $e) {
            \Log::warning('[Geocode] Nominatim failed for "' . $query . '": ' . $e->getMessage());
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Hardcoded Fallback (offline safety net)
    // ─────────────────────────────────────────────────────────────────────────
    private static function tryFallback(string $addressString): array
    {
        $lower = strtolower($addressString);

        // ── Landmark-level (most precise) ────────────────────────────────────
        $landmarks = [
            // Madurai
            'meenakshi temple'   => [9.9195, 78.1198],
            'meenakshi amman'    => [9.9195, 78.1198],
            'mattuthavani'       => [9.9452, 78.1452],
            'thirupparankundram' => [9.8812, 78.0795],
            'goripalayam'        => [9.9285, 78.1285],
            'teppakulam'         => [9.9230, 78.1220],
            'tallakulam'         => [9.9310, 78.1110],
            'palanganatham'      => [9.9275, 78.1050],
            'vilangudi'          => [9.9480, 78.0920],
            'arapalayam'         => [9.9380, 78.1160],
            'periyar bus stand'  => [9.9210, 78.1175],
            'kaitari nagar'      => [9.8850, 78.0820],
            'kaithari nagar'     => [9.8850, 78.0820],
            'simmakkal'          => [9.9220, 78.1240],
            // Chennai
            't nagar'            => [13.0418, 80.2341],
            'adyar'              => [13.0012, 80.2565],
            'vadapalani'         => [13.0524, 80.2123],
            'tambaram'           => [12.9249, 80.1000],
            'guindy'             => [13.0067, 80.2206],
            'egmore'             => [13.0732, 80.2609],
            'velachery'          => [12.9815, 80.2180],
            'mahabalipuram'      => [12.6269, 80.1927],
            'mamallapuram'       => [12.6269, 80.1927],
            'chromepet'          => [12.9516, 80.1462],
            'porur'              => [13.0365, 80.1569],
            'ecr'                => [12.8250, 80.2355],
            'omr'                => [12.9010, 80.2272],
            'sholinganallur'     => [12.9010, 80.2272],
            'perungudi'          => [12.9631, 80.2459],
            'besant nagar'       => [13.0002, 80.2689],
            // Bangalore
            'koramangala'        => [12.9352, 77.6245],
            'whitefield'         => [12.9698, 77.7500],
            'electronic city'    => [12.8399, 77.6770],
            'jayanagar'          => [12.9299, 77.5838],
            'indiranagar'        => [12.9784, 77.6408],
            'hsr layout'         => [12.9116, 77.6389],
            'majestic'           => [12.9767, 77.5713],
            'marathahalli'       => [12.9591, 77.7014],
            'hebbal'             => [13.0358, 77.5970],
            'yelahanka'          => [13.1007, 77.5963],
            'jp nagar'           => [12.9063, 77.5857],
            'rajajinagar'        => [12.9907, 77.5566],
            // Hyderabad
            'hitech city'        => [17.4435, 78.3772],
            'secunderabad'       => [17.4399, 78.4983],
            'begumpet'           => [17.4441, 78.4729],
            'gachibowli'         => [17.4401, 78.3489],
            'jubilee hills'      => [17.4325, 78.4073],
            'kukatpally'         => [17.4849, 78.3942],
            // Mumbai
            'andheri'            => [19.1136, 72.8697],
            'bandra'             => [19.0596, 72.8295],
            'dadar'              => [19.0176, 72.8441],
            'borivali'           => [19.2307, 72.8567],
            'parel'              => [18.9985, 72.8378],
            'lower parel'        => [18.9930, 72.8277],
            // Delhi
            'connaught place'    => [28.6315, 77.2167],
            'saket'              => [28.5244, 77.2066],
            'dwarka'             => [28.5921, 77.0460],
            'rohini'             => [28.7495, 77.0565],
            'karol bagh'         => [28.6514, 77.1907],
            // Pune
            'hadapsar'           => [18.5089, 73.9260],
            'hinjewadi'          => [18.5913, 73.7389],
            'koregaon park'      => [18.5362, 73.8935],
            'kothrud'            => [18.5074, 73.8077],
            // Kolkata
            'salt lake'          => [22.5804, 88.4168],
            'park street'        => [22.5512, 88.3523],
            'howrah'             => [22.5958, 88.2636],
            // Kochi
            'edappally'          => [10.0262, 76.3125],
            'kakkanad'           => [10.0156, 76.3487],
            'fort kochi'         => [9.9639,  76.2394],
            // Coimbatore
            'gandhipuram'        => [11.0168, 76.9660],
            'peelamedu'          => [11.0260, 77.0050],
            'rs puram'           => [11.0080, 76.9500],
            'singanallur'        => [10.9980, 77.0250],
            // Tiruchirappalli
            'srirangam'          => [10.8620, 78.6920],
            'thillai nagar'      => [10.8250, 78.6850],
            'chatram'            => [10.8320, 78.6950],
            'cantonment'         => [10.8050, 78.6820],
            // Lucknow
            'gomti nagar'        => [26.8558, 80.9925],
            'hazratganj'         => [26.8505, 80.9462],
        ];

        // Anna Nagar / KK Nagar are city-sensitive
        if (str_contains($lower, 'anna nagar') && str_contains($lower, 'madurai')) {
            return self::fallbackResult(9.9355, 78.0945, 'Anna Nagar, Madurai, India');
        }
        if (str_contains($lower, 'anna nagar')) {
            return self::fallbackResult(13.0850, 80.2101, 'Anna Nagar, Chennai, India');
        }
        if (str_contains($lower, 'kk nagar') && str_contains($lower, 'madurai')) {
            return self::fallbackResult(9.9412, 78.1035, 'KK Nagar, Madurai, India');
        }
        if (str_contains($lower, 'kk nagar')) {
            return self::fallbackResult(13.0400, 80.2100, 'KK Nagar, Chennai, India');
        }

        foreach ($landmarks as $name => [$lat, $lng]) {
            if (str_contains($lower, $name)) {
                return self::fallbackResult($lat, $lng, ucwords($name) . ', India');
            }
        }

        // ── City-level fallback ───────────────────────────────────────────────
        $cities = [
            'bangalore'          => [12.9716, 77.5946],
            'bengaluru'          => [12.9716, 77.5946],
            'madurai'            => [9.9252,  78.1198],
            'chennai'            => [13.0827, 80.2707],
            'coimbatore'         => [11.0168, 76.9558],
            'mumbai'             => [19.0760, 72.8777],
            'delhi'              => [28.7041, 77.1025],
            'new delhi'          => [28.6139, 77.2090],
            'kolkata'            => [22.5726, 88.3639],
            'hyderabad'          => [17.3850, 78.4867],
            'pune'               => [18.5204, 73.8567],
            'kochi'              => [9.9312,  76.2673],
            'lucknow'            => [26.8467, 80.9462],
            'trichy'             => [10.7905, 78.7047],
            'tiruchirappalli'    => [10.7905, 78.7047],
            'salem'              => [11.6643, 78.1460],
            'tirunelveli'        => [8.7139,  77.7567],
            'jaipur'             => [26.9124, 75.7873],
            'ahmedabad'          => [23.0225, 72.5714],
            'surat'              => [21.1702, 72.8311],
            'nagpur'             => [21.1458, 79.0882],
            'indore'             => [22.7196, 75.8577],
            'bhopal'             => [23.2599, 77.4126],
            'patna'              => [25.6093, 85.1376],
            'chandigarh'         => [30.7333, 76.7794],
            'gurgaon'            => [28.4595, 77.0266],
            'gurugram'           => [28.4595, 77.0266],
            'noida'              => [28.5355, 77.3910],
            'visakhapatnam'      => [17.6868, 83.2185],
            'vizag'              => [17.6868, 83.2185],
            'mysore'             => [12.2958, 76.6394],
            'mysuru'             => [12.2958, 76.6394],
            'mangalore'          => [12.9141, 74.8560],
            'thiruvananthapuram' => [8.5241,  76.9366],
            'trivandrum'         => [8.5241,  76.9366],
            'pondicherry'        => [11.9340, 79.8306],
            'puducherry'         => [11.9340, 79.8306],
            'vellore'            => [12.9165, 79.1325],
            'erode'              => [11.3410, 77.7172],
            'tiruppur'           => [11.1085, 77.3411],
            'thanjavur'          => [10.7870, 79.1378],
            'nagercoil'          => [8.1780,  77.4344],
        ];

        foreach ($cities as $name => [$lat, $lng]) {
            if (str_contains($lower, $name)) {
                return self::fallbackResult($lat, $lng, ucfirst($name) . ', India');
            }
        }

        // ── Final default ─────────────────────────────────────────────────────
        return self::fallbackResult(12.9716, 77.5946, 'India (Default Center)');
    }

    private static function fallbackResult(float $lat, float $lng, string $label): array
    {
        return [
            'latitude'          => $lat,
            'longitude'         => $lng,
            'is_india'          => true,
            'formatted_address' => $label . ' (Fallback)',
        ];
    }

    /**
     * Calculate actual road/route driving distance (km) and ETA (minutes) from patient coordinates to hospitals.
     */
    public static function calculateDistances(float $originLat, float $originLng, $hospitals)
    {
        $apiKey = env('GOOGLE_MAPS_API_KEY');

        // 1. Fast preliminary straight-line distance pass to rank candidates
        foreach ($hospitals as $hosp) {
            $lat1 = deg2rad($originLat);
            $lng1 = deg2rad($originLng);
            $lat2 = deg2rad($hosp->latitude);
            $lng2 = deg2rad($hosp->longitude);
            $dlat = $lat2 - $lat1;
            $dlng = $lng2 - $lng1;
            $a = sin($dlat / 2) ** 2 + cos($lat1) * cos($lat2) * sin($dlng / 2) ** 2;
            $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
            $hosp->_direct_km = 6371 * $c;
        }

        // Sort hospitals by direct distance and take the 5 closest for road-routing calculation
        $sortedHospitals = $hospitals->sortBy('_direct_km')->values();
        $targetHospitals = $sortedHospitals->take(5);

        // 2. If Google Maps API Key is configured, use Distance Matrix API
        if ($apiKey && $targetHospitals->count() > 0) {
            try {
                $destinations = $targetHospitals->map(fn($h) => "{$h->latitude},{$h->longitude}")->implode('|');
                $res = Http::timeout(3)->get('https://maps.googleapis.com/maps/api/distancematrix/json', [
                    'origins'      => "{$originLat},{$originLng}",
                    'destinations' => $destinations,
                    'key'          => $apiKey,
                    'mode'         => 'driving'
                ]);

                if ($res->successful()) {
                    $data = $res->json();
                    if (($data['status'] ?? '') === 'OK' && !empty($data['rows'][0]['elements'])) {
                        $elements = $data['rows'][0]['elements'];
                        $idx = 0;
                        foreach ($targetHospitals as $hosp) {
                            if (isset($elements[$idx]['status']) && $elements[$idx]['status'] === 'OK') {
                                $distMeters  = $elements[$idx]['distance']['value'] ?? 0;
                                $durationSec = $elements[$idx]['duration']['value'] ?? 0;

                                $distKm  = round($distMeters / 1000, 1);
                                $etaMins = max(3, round($durationSec / 60));

                                $hosp->distance_km = max(0.5, $distKm);
                                $hosp->eta_minutes = $etaMins;
                            } else {
                                self::applyRoadRoutingFallback($originLat, $originLng, $hosp);
                            }
                            $idx++;
                        }
                    }
                }
            } catch (\Exception $e) {
                \Log::warning('[DistanceMatrix] Google API failed: ' . $e->getMessage());
            }
        }

        // 3. For hospitals without Google API result, query road routing for closest 5
        $idx = 0;
        foreach ($sortedHospitals as $hosp) {
            if (!isset($hosp->distance_km)) {
                if ($idx < 5) {
                    self::applyRoadRoutingFallback($originLat, $originLng, $hosp);
                } else {
                    // For far-away hospitals (> 5th rank), apply urban circuity multiplier (1.8x)
                    $roadKm = round(($hosp->_direct_km ?? 10) * 1.8, 1);
                    $hosp->distance_km = max(0.5, $roadKm);
                    $hosp->eta_minutes = max(3, round(($roadKm * 2.5) + 1));
                }
            }
            unset($hosp->_direct_km);
            $idx++;
        }

        return $sortedHospitals;
    }

    private static function applyRoadRoutingFallback(float $originLat, float $originLng, $hosp)
    {
        try {
            $url = "http://router.project-osrm.org/route/v1/driving/{$originLng},{$originLat};{$hosp->longitude},{$hosp->latitude}?overview=false";
            $res = Http::timeout(1)->get($url);
            if ($res->successful()) {
                $data = $res->json();
                if (($data['code'] ?? '') === 'Ok' && !empty($data['routes'][0])) {
                    $distMeters = $data['routes'][0]['distance'];
                    $durSec     = $data['routes'][0]['duration'];

                    $roadKm  = round($distMeters / 1000, 1);
                    $etaMins = max(3, round($durSec / 60));

                    $hosp->distance_km = max(0.5, $roadKm);
                    $hosp->eta_minutes = $etaMins;
                    return;
                }
            }
        } catch (\Exception $e) {
            \Log::warning('[OSRM Routing] Failed for hospital ' . $hosp->id . ': ' . $e->getMessage());
        }

        // Offline Safety Net: Urban Road Network Circuity (1.8x straight-line distance)
        $lat1 = deg2rad($originLat);
        $lng1 = deg2rad($originLng);
        $lat2 = deg2rad($hosp->latitude);
        $lng2 = deg2rad($hosp->longitude);

        $dlat = $lat2 - $lat1;
        $dlng = $lng2 - $lng1;

        $a = sin($dlat / 2) ** 2 + cos($lat1) * cos($lat2) * sin($dlng / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        $directKm = 6371 * $c;
        $roadKm = round($directKm * 1.8, 1);
        if ($roadKm < 0.5) {
            $roadKm = 0.5;
        }

        $hosp->distance_km = $roadKm;
        $hosp->eta_minutes = max(3, round(($roadKm * 2.5) + 1));
    }
}
