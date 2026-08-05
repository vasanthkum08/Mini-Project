<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Responder extends Model
{
    protected $fillable = [
        'user_id',
        'hospital_id',
        'assigned_ambulance',
        'ambulance_status',
        'availability_status',
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'latitude' => 'double',
        'longitude' => 'double',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function hospital()
    {
        return $this->belongsTo(Hospital::class, 'hospital_id');
    }
}
