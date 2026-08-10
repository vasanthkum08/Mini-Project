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
    public static function geocode(array $addressDetails): ?array
    {
        // Build a query string from address parts (landmark first for specificity)
        $queryParts = [];
        foreach (['landmark', 'city', 'state', 'pincode'] as $key) {
            if (!empty($addressDetails[$key])) {
                $queryParts[] = trim($addressDetails[$key]);
            }
        }

        $addressString = implode(', ', $queryParts);
        if (empty($addressString)) {
            return null;
        }

        // Always append India for better geocoding accuracy
        if (!str_contains(strtolower($addressString), 'india')) {
            $addressString .= ', India';
        }

        \Log::info('[Geocode] Resolving: ' . $addressString);

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
        // Try the full address first; if that fails, try landmark-only
        $result = self::tryNominatim($addressString);
        if (!$result && count($queryParts) >= 2) {
            $landmarkOnly = $queryParts[0] . ', India';
            $result = self::tryNominatim($landmarkOnly);
        }
        if ($result) {
            \Log::info('[Geocode] Nominatim → ' . $result['formatted_address']);
            return $result;
        }

        // ── Strategy 3: Hardcoded Fallback ───────────────────────────────────
        $result = self::tryFallback($addressString);
        \Log::info('[Geocode] Fallback → ' . $result['formatted_address']);
        return $result;
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
}
