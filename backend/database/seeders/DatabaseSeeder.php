<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Roles
        DB::table('roles')->updateOrInsert(['id' => 1], ['name' => 'patient', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('roles')->updateOrInsert(['id' => 2], ['name' => 'admin', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('roles')->updateOrInsert(['id' => 3], ['name' => 'responder', 'created_at' => now(), 'updated_at' => now()]);

        // 2. Call HospitalSeeder first
        $this->call(HospitalSeeder::class);

        $firstHosp = \App\Models\Hospital::first();
        $firstHospId = $firstHosp ? $firstHosp->id : null;

        // 3. Seed Demo Users
        User::updateOrCreate(
            ['email' => 'patient@emergency.com'],
            [
                'name' => 'John Patient',
                'password' => Hash::make('password'),
                'mobile' => '9876543210',
                'role_id' => 1,
            ]
        );

        $responderUser = User::updateOrCreate(
            ['email' => 'responder@emergency.com'],
            [
                'name' => 'Paramedic Officer Jane',
                'password' => Hash::make('password'),
                'mobile' => '9876543211',
                'role_id' => 3,
            ]
        );

        // Create responder profile
        if ($responderUser) {
            \App\Models\Responder::updateOrCreate(
                ['user_id' => $responderUser->id],
                [
                    'hospital_id' => $firstHospId,
                    'assigned_ambulance' => 'KA-01-ME-9876',
                    'ambulance_status' => 'Active',
                    'availability_status' => 'Available',
                    'latitude' => 12.9716,
                    'longitude' => 77.5946,
                ]
            );
        }

        User::updateOrCreate(
            ['email' => 'admin@emergency.com'],
            [
                'name' => 'Chief Administrator Robert',
                'password' => Hash::make('password'),
                'mobile' => '9876543212',
                'role_id' => 2,
                'hospital_id' => $firstHospId,
            ]
        );

        // Create an admin for every hospital in the database
        $hospitals = \App\Models\Hospital::all();
        foreach ($hospitals as $hosp) {
            User::updateOrCreate(
                ['email' => "admin{$hosp->id}@emergency.com"],
                [
                    'name' => "Admin of " . $hosp->name,
                    'password' => Hash::make('password'),
                    'mobile' => '9' . str_pad($hosp->id, 9, '0', STR_PAD_LEFT),
                    'role_id' => 2,
                    'hospital_id' => $hosp->id,
                ]
            );
        }
    }
}
