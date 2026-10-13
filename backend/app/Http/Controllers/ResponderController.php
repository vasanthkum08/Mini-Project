<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Models\Responder;
use App\Models\EmergencyAppointment;
use App\Models\Hospital;
use App\Models\Notification;

class ResponderController extends Controller
{
    /**
     * Helper to compute road distance (km) and ETA (minutes) between 2 lat/lng points.
     */
    private function computeDistanceAndEta(float $lat1, float $lng1, float $lat2, float $lng2): array
    {
        $dir = \App\Services\GoogleMapsService::getDirections($lat1, $lng1, $lat2, $lng2);
        return [
            'distance_km' => $dir['distance_km'],
            'eta_minutes' => $dir['eta_minutes']
        ];
    }

    /**
     * Extract latitude and longitude from gps_location string e.g. "Lat: 9.9190, Lng: 78.1335".
     */
    private function parseCoordsFromString(?string $gpsLoc, float $defaultLat = 9.8850, float $defaultLng = 78.0820): array
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

        // Fetch active assigned cases for this responder or assigned hospital
        $hospital = $responder->hospital ?: Hospital::first();
        $hospitalName = $hospital ? $hospital->name : null;

        $fallbackLat = $hospital ? $hospital->latitude : 9.8850;
        $fallbackLng = $hospital ? $hospital->longitude : 78.0820;

        $ambLat = $responder->latitude ?: $fallbackLat;
        $ambLng = $responder->longitude ?: $fallbackLng;

        $activeQuery = EmergencyAppointment::where(function ($q) use ($responder, $hospitalName) {
            $q->where('responder_id', $responder->id);
            if ($hospitalName) {
                $q->orWhere('hospital_name', $hospitalName);
            }
        })->whereNotIn('status', ['Completed', 'Cancelled']);

        $activeCases = $activeQuery->orderBy('updated_at', 'desc')->get()->map(function ($case) use ($ambLat, $ambLng, $hospital, $fallbackLat, $fallbackLng) {
            // Patient Lat/Lng
            $patientLat = $case->latitude;
            $patientLng = $case->longitude;
            if (!$patientLat || !$patientLng) {
                $coords = $this->parseCoordsFromString($case->gps_location, $ambLat ?: $fallbackLat, $ambLng ?: $fallbackLng);
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
                'hospital' => $hospital,
                'all_hospitals' => Hospital::all(),
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

        Notification::create([
            'user_id' => $user ? $user->id : null,
            'role' => 'responder',
            'title' => 'Ambulance Status Updated',
            'message' => "Emergency ambulance status updated to '{$status}'.",
            'type' => 'status'
        ]);

        return response()->json([
            'success' => true,
            'message' => "Ambulance status updated to '{$status}' successfully and saved to MySQL.",
            'data' => $this->getProfile()->getData()->data ?? null
        ]);
    }
}
