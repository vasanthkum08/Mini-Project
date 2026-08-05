<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hospital extends Model
{
    protected $fillable = [
        'name',
        'state',
        'district',
        'city',
        'address',
        'latitude',
        'longitude',
        'phone',
        'specialties',
        'available_doctors',
        'available_icu_beds',
        'available_general_beds',
        'emergency_beds',
        'er_wait_minutes',
        'queue_count',
        'hospital_status',
        'rating',
        'email',
        'hospital_type',
        'emergency_24_7',
        'ambulance_available',
    ];

    protected $casts = [
        'specialties' => 'array',
        'latitude' => 'double',
        'longitude' => 'double',
        'rating' => 'double',
        'available_doctors' => 'integer',
        'available_icu_beds' => 'integer',
        'available_general_beds' => 'integer',
        'emergency_beds' => 'integer',
        'er_wait_minutes' => 'integer',
        'queue_count' => 'integer',
        'emergency_24_7' => 'boolean',
        'ambulance_available' => 'boolean',
    ];
}
