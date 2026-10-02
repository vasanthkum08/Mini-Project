<?php

namespace App\Http\Controllers;

use App\Models\EmergencyAppointment;
use App\Models\Notification;
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
            'symptoms' => 'nullable|string',
            'gps_location' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'hospital_id' => 'nullable|integer',
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

        $hospitalId = $request->input('hospital_id');
        $hospitalName = $request->input('hospital_name');

        if (!$hospitalId && $hospitalName) {
            $h = \App\Models\Hospital::where('name', $hospitalName)->first();
            if ($h) {
                $hospitalId = $h->id;
            }
        }

        $appointment = EmergencyAppointment::create([
            'user_id' => $user ? $user->id : null,
            'hospital_id' => $hospitalId,
            'patient_name' => $request->input('patient_name'),
            'mobile_number' => $request->input('mobile_number'),
            'symptoms' => $request->input('symptoms'),
            'gps_location' => $request->input('gps_location'),
            'latitude' => $request->input('latitude'),
            'longitude' => $request->input('longitude'),
            'hospital_name' => $hospitalName,
            'department' => $request->input('department'),
            'appointment_date' => $request->input('appointment_date'),
            'appointment_time' => $request->input('appointment_time'),
            'priority' => $request->input('priority'),
            'status' => 'Pending'
        ]);

        Notification::create([
            'user_id' => $user ? $user->id : null,
            'role' => 'patient',
            'title' => 'Emergency Request Submitted',
            'message' => "Emergency appointment request for {$request->input('patient_name')} booked at {$hospitalName} on {$request->input('appointment_date')} at {$request->input('appointment_time')}.",
            'type' => 'emergency'
        ]);

        return response()->json([
            'success' => true,
            'message' => "Appointment successfully booked at {$hospitalName} on {$request->input('appointment_date')} at {$request->input('appointment_time')}.",
            'data' => $appointment
        ], 201);
    }
}
