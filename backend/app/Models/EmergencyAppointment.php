<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmergencyAppointment extends Model
{
    protected $fillable = [
        'user_id',
        'patient_name',
        'mobile_number',
        'gps_location',
        'hospital_name',
        'department',
        'appointment_date',
        'appointment_time',
        'priority',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
