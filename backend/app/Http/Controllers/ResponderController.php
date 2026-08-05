<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Models\Responder;

class ResponderController extends Controller
{
    /**
     * Get the responder profile for the logged-in user.
     */
    public function getProfile()
    {
        $user = Auth::guard('api')->user();

        $responder = Responder::with('hospital')->where('user_id', $user->id)->first();

        if (!$responder) {
            return response()->json([
                'success' => false,
                'message' => 'No active responder profile details found associated with this account.'
            ], 404);
        }

        // Prepare structured data response
        return response()->json([
            'success' => true,
            'data' => [
                'name' => $user->name,
                'mobile' => $user->mobile,
                'assigned_ambulance' => $responder->assigned_ambulance,
                'ambulance_status' => $responder->ambulance_status,
                'assigned_hospital' => $responder->hospital ? $responder->hospital->name : 'Unassigned',
                'availability_status' => $responder->availability_status,
                'latitude' => $responder->latitude,
                'longitude' => $responder->longitude,
            ]
        ]);
    }

    /**
     * Update responder status values.
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

        return response()->json([
            'success' => true,
            'message' => 'Responder profile and GPS location updated successfully.',
            'data' => [
                'name' => $user->name,
                'mobile' => $user->mobile,
                'assigned_ambulance' => $responder->assigned_ambulance,
                'ambulance_status' => $responder->ambulance_status,
                'assigned_hospital' => $responder->hospital ? $responder->hospital->name : 'Unassigned',
                'availability_status' => $responder->availability_status,
                'latitude' => $responder->latitude,
                'longitude' => $responder->longitude,
            ]
        ]);
    }
}
