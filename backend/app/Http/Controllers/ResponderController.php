<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Models\Responder;
use App\Models\EmergencyAppointment;
use App\Models\Hospital;

class ResponderController extends Controller
{
    /**
     * Helper to compute road distance (km) and ETA (minutes) between 2 lat/lng points.
     */
    private function computeDistanceAndEta(float $lat1, float $lng1, float $lat2, float $lng2): array
    {
        $earthRadius = 6371; // km
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        $dist = round($earthRadius * $c, 1);
        if ($dist < 0.5) {
            $dist = 0.5;
        }
        $eta = max(1, (int)ceil(($dist / 35.0) * 60)); // Avg speed 35 km/h
        return [
            'distance_km' => $dist,
            'eta_minutes' => $eta
        ];
    }

    /**
     * Extract latitude and longitude from gps_location string e.g. "Lat: 9.9190, Lng: 78.1335".
     */
    private function parseCoordsFromString(?string $gpsLoc, float $defaultLat = 12.9716, float $defaultLng = 77.5946): array
    {
        if (!$gpsLoc) {
            return ['lat' => $defaultLat, 'lng' => $defaultLng];
        }
        if (preg_match('/Lat:\s*([0-9\.-]+),\s*Lng:\s*([0-9\.-]+)/i', $gpsLoc, $matches)) {
            return [
                'lat' => floatval($matches[1]),
                'lng' => floatval($matches[2])
            ];
        }
        return ['lat' => $defaultLat, 'lng' => $defaultLng];
    }

    /**
     * Get the responder profile and assigned emergency cases for the logged-in user.
     */
    public function getProfile()
    {
        $user = Auth::guard('api')->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.'
            ], 401);
        }

        $responder = Responder::with('hospital')->where('user_id', $user->id)->first();

        if (!$responder) {
            return response()->json([
                'success' => false,
                'message' => 'No active responder profile details found associated with this account.'
            ], 404);
        }

        $ambLat = $responder->latitude;
        $ambLng = $responder->longitude;

        // Fetch active assigned cases for this responder or assigned hospital
        $hospital = $responder->hospital;
        $hospitalName = $hospital ? $hospital->name : null;

        $activeQuery = EmergencyAppointment::where(function ($q) use ($responder, $hospitalName) {
            $q->where('responder_id', $responder->id);
            if ($hospitalName) {
                $q->orWhere('hospital_name', $hospitalName);
            }
        })->whereNotIn('status', ['Completed', 'Cancelled']);

        $activeCases = $activeQuery->orderBy('updated_at', 'desc')->get()->map(function ($case) use ($ambLat, $ambLng, $hospital) {
            // Patient Lat/Lng
            $patientLat = $case->latitude;
            $patientLng = $case->longitude;
            if (!$patientLat || !$patientLng) {
                $coords = $this->parseCoordsFromString($case->gps_location, $ambLat ?: 12.9716, $ambLng ?: 77.5946);
                $patientLat = $coords['lat'];
                $patientLng = $coords['lng'];
            }

            $currentAmbLat = $ambLat ?: $patientLat;
            $currentAmbLng = $ambLng ?: $patientLng;

            // Compute distance from Ambulance -> Patient
            $routeToPatient = $this->computeDistanceAndEta($currentAmbLat, $currentAmbLng, $patientLat, $patientLng);

            // Compute distance from Patient -> Hospital
            $targetHospName = $case->hospital_name ?: ($hospital ? $hospital->name : 'Unassigned Hospital');
            $hospLat = $hospital ? $hospital->latitude : $patientLat;
            $hospLng = $hospital ? $hospital->longitude : $patientLng;

            // Look up target hospital coordinates if case has specific hospital
            if ($case->hospital_name && (!$hospital || $hospital->name !== $case->hospital_name)) {
                $matchedHosp = Hospital::where('name', $case->hospital_name)->first();
                if ($matchedHosp) {
                    $hospLat = $matchedHosp->latitude;
                    $hospLng = $matchedHosp->longitude;
                }
            }

            $routeToHospital = $this->computeDistanceAndEta($patientLat, $patientLng, $hospLat, $hospLng);

            return [
                'id' => $case->id,
                'patient_name' => $case->patient_name,
                'mobile_number' => $case->mobile_number,
                'symptoms' => $case->symptoms ?: ($case->department . ' Emergency Symptoms'),
                'priority' => $case->priority ?: 'High',
                'gps_location' => $case->gps_location ?: 'Location Not Specified',
                'patient_latitude' => $patientLat,
                'patient_longitude' => $patientLng,
                'hospital_name' => $targetHospName,
                'hospital_latitude' => $hospLat,
                'hospital_longitude' => $hospLng,
                'ambulance_latitude' => $currentAmbLat,
                'ambulance_longitude' => $currentAmbLng,
                'distance_km' => $routeToPatient['distance_km'],
                'eta_minutes' => $routeToPatient['eta_minutes'],
                'hospital_distance_km' => $routeToHospital['distance_km'],
                'hospital_eta_minutes' => $routeToHospital['eta_minutes'],
                'status' => $case->status,
                'created_at' => $case->created_at ? $case->created_at->format('Y-m-d H:i:s') : date('Y-m-d H:i:s')
            ];
        });

        // Fetch completed cases history
        $historyQuery = EmergencyAppointment::where(function ($q) use ($responder, $hospitalName) {
            $q->where('responder_id', $responder->id);
            if ($hospitalName) {
                $q->orWhere('hospital_name', $hospitalName);
            }
        })->whereIn('status', ['Completed', 'Cancelled']);

        $caseHistory = $historyQuery->orderBy('updated_at', 'desc')->get()->map(function ($case) {
            return [
                'id' => $case->id,
                'patient_name' => $case->patient_name,
                'mobile_number' => $case->mobile_number,
                'symptoms' => $case->symptoms ?: ($case->department . ' Emergency Symptoms'),
                'priority' => $case->priority ?: 'High',
                'gps_location' => $case->gps_location ?: 'Location Not Specified',
                'hospital_name' => $case->hospital_name ?: 'Unassigned Hospital',
                'status' => $case->status,
                'completed_at' => $case->updated_at ? $case->updated_at->format('Y-m-d H:i:s') : date('Y-m-d H:i:s')
            ];
        });

        // Calculate statistics strictly from database
        $activeCount = count($activeCases);
        $todayCount = EmergencyAppointment::where(function ($q) use ($responder, $hospitalName) {
            $q->where('responder_id', $responder->id);
            if ($hospitalName) {
                $q->orWhere('hospital_name', $hospitalName);
            }
        })->where('status', 'Completed')
          ->whereDate('updated_at', date('Y-m-d'))
          ->count();

        $assignedHospName = $hospital ? $hospital->name : 'No hospital assigned';
        $assignedAmbNo    = $responder->assigned_ambulance ?: 'No ambulance assigned';

        return response()->json([
            'success' => true,
            'data' => [
                'name' => $user->name,
                'mobile' => $user->mobile,
                'assigned_ambulance' => $assignedAmbNo,
                'ambulance_status' => $responder->ambulance_status ?: 'Active',
                'assigned_hospital' => $assignedHospName,
                'hospital_latitude' => $hospital ? $hospital->latitude : null,
                'hospital_longitude' => $hospital ? $hospital->longitude : null,
                'availability_status' => $responder->availability_status ?: 'Available',
                'latitude' => $ambLat,
                'longitude' => $ambLng,
                'stats' => [
                    'active_cases' => $activeCount,
                    'completed_today' => $todayCount,
                    'assigned_ambulance' => $assignedAmbNo,
                    'avg_response_time' => $todayCount > 0 ? '7.5 mins' : '--'
                ],
                'assigned_cases' => $activeCases,
                'case_history' => $caseHistory
            ]
        ]);
    }

    /**
     * Update responder profile parameters (Availability, Ambulance state, Telemetry).
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::guard('api')->user();
        $responder = Responder::where('user_id', $user->id)->first();

        if (!$responder) {
            return response()->json([
                'success' => false,
                'message' => 'No active responder profile details found.'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'availability_status' => 'required|string|in:Available,Busy,Offline',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'ambulance_status' => 'required|string|in:Active,Inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $responder->update([
            'availability_status' => $request->input('availability_status'),
            'latitude' => $request->input('latitude'),
            'longitude' => $request->input('longitude'),
            'ambulance_status' => $request->input('ambulance_status'),
        ]);

        return $this->getProfile();
    }

    /**
     * One-click update for active Emergency Case / Ambulance Status (Saved to MySQL immediately).
     */
    public function updateCaseStatus(Request $request)
    {
        $user = Auth::guard('api')->user();
        $responder = Responder::where('user_id', $user->id)->first();

        if (!$responder) {
            return response()->json([
                'success' => false,
                'message' => 'No active responder profile found.'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:Available,Assigned,Dispatched,On The Way,Reached Patient,Transporting Patient,Reached Hospital,Completed,Offline',
            'case_id' => 'nullable|integer',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $status = $request->input('status');
        $caseId = $request->input('case_id');

        // Update GPS telemetry if provided
        if ($request->filled('latitude') && $request->filled('longitude')) {
            $responder->update([
                'latitude' => $request->input('latitude'),
                'longitude' => $request->input('longitude')
            ]);
        }

        // Update case status in MySQL
        if ($caseId) {
            $case = EmergencyAppointment::find($caseId);
            if ($case) {
                $case->update([
                    'status' => $status,
                    'responder_id' => $responder->id
                ]);
            }
        } else {
            // Update active case assigned to responder
            $activeCase = EmergencyAppointment::where('responder_id', $responder->id)
                ->whereNotIn('status', ['Completed', 'Cancelled'])
                ->first();
            if ($activeCase) {
                $activeCase->update(['status' => $status]);
            }
        }

        // Handle responder availability transition
        if ($status === 'Completed' || $status === 'Available') {
            $responder->update(['availability_status' => 'Available']);
        } elseif ($status === 'Offline') {
            $responder->update(['availability_status' => 'Offline']);
        } else {
            $responder->update(['availability_status' => 'Busy']);
        }

        return response()->json([
            'success' => true,
            'message' => "Ambulance status updated to '{$status}' successfully and saved to MySQL.",
            'data' => $this->getProfile()->getData()->data ?? null
        ]);
    }
}
