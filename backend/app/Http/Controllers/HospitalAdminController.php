<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Models\Hospital;

class HospitalAdminController extends Controller
{
    /**
     * Get the hospital assigned to the logged-in admin.
     */
    public function getHospital(Request $request)
    {
        $user = Auth::guard('api')->user();
        $requestedId = $request->query('hospital_id');
        $hospitalId = $requestedId ?: $user->hospital_id;

        if (!$hospitalId) {
            $hospital = Hospital::first();
        } else {
            $hospital = Hospital::find($hospitalId);
        }

        if (!$hospital) {
            return response()->json([
                'success' => false,
                'message' => 'The requested hospital record could not be found in the database.'
            ], 404);
        }

        $allHospitals = Hospital::select('id', 'name', 'city', 'state')->get();

        return response()->json([
            'success' => true,
            'data' => $hospital,
            'all_hospitals' => $allHospitals
        ]);
    }

    /**
     * Update hospital status values.
     */
    public function updateHospital(Request $request)
    {
        $user = Auth::guard('api')->user();
        $requestedId = $request->input('hospital_id');
        $hospitalId = $requestedId ?: $user->hospital_id;

        if (!$hospitalId) {
            return response()->json([
                'success' => false,
                'message' => 'No hospital specified or assigned.'
            ], 404);
        }

        $hospital = Hospital::find($hospitalId);

        if (!$hospital) {
            return response()->json([
                'success' => false,
                'message' => 'The specified hospital record could not be found.'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'available_doctors' => 'required|integer|min:0',
            'available_icu_beds' => 'required|integer|min:0',
            'available_general_beds' => 'required|integer|min:0',
            'emergency_beds' => 'required|integer|min:0',
            'er_wait_minutes' => 'required|integer|min:0',
            'queue_count' => 'required|integer|min:0',
            'ambulance_available' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $hospital->update([
            'available_doctors' => $request->input('available_doctors'),
            'available_icu_beds' => $request->input('available_icu_beds'),
            'available_general_beds' => $request->input('available_general_beds'),
            'emergency_beds' => $request->input('emergency_beds'),
            'er_wait_minutes' => $request->input('er_wait_minutes'),
            'queue_count' => $request->input('queue_count'),
            'ambulance_available' => $request->input('ambulance_available'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Hospital operational details updated successfully.',
            'data' => $hospital
        ]);
    }
}
