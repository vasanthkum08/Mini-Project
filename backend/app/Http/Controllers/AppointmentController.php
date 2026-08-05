<?php

namespace App\Http\Controllers;

use App\Models\EmergencyAppointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AppointmentController extends Controller
{
    /**
     * Store new emergency appointment booking.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'patient_name' => 'required|string|max:255',
            'mobile_number' => 'required|string',
            'gps_location' => 'nullable|string|max:255',
            'hospital_name' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'appointment_date' => 'required|date',
            'appointment_time' => 'required|string',
            'priority' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::guard('api')->user();

        $appointment = EmergencyAppointment::create([
            'user_id' => $user->id,
            'patient_name' => $request->input('patient_name'),
            'mobile_number' => $request->input('mobile_number'),
            'gps_location' => $request->input('gps_location'),
            'hospital_name' => $request->input('hospital_name'),
            'department' => $request->input('department'),
            'appointment_date' => $request->input('appointment_date'),
            'appointment_time' => $request->input('appointment_time'),
            'priority' => $request->input('priority'),
            'status' => 'Pending'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Emergency Appointment Request Submitted Successfully.',
            'data' => $appointment
        ], 201);
    }
}
