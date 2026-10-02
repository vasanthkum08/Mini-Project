<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Role;
use App\Models\Responder;
use App\Models\Hospital;
use Illuminate\Support\Facades\Hash;

$responderRole = Role::where('name', 'responder')->first();
$roleId = $responderRole ? $responderRole->id : 3;

$newRespondersData = [
    [
        'name' => 'Paramedic Officer Karthik',
        'email' => 'responder3@emergency.com',
        'mobile' => '9876543203',
        'password' => 'password123',
        'hospital_name' => 'Apollo Speciality Madurai',
        'assigned_ambulance' => 'TN-59-AM-2024',
        'availability_status' => 'Available',
        'ambulance_status' => 'Active',
        'latitude' => 9.9358,
        'longitude' => 78.0948,
    ],
    [
        'name' => 'Emergency Specialist Priya',
        'email' => 'responder4@emergency.com',
        'mobile' => '9876543204',
        'password' => 'password123',
        'hospital_name' => 'Meenakshi Mission Hospital',
        'assigned_ambulance' => 'TN-59-AM-3050',
        'availability_status' => 'Busy',
        'ambulance_status' => 'Active',
        'latitude' => 9.9198,
        'longitude' => 78.1194,
    ],
    [
        'name' => 'Rescue Commander Suresh',
        'email' => 'responder5@emergency.com',
        'mobile' => '9876543205',
        'password' => 'password123',
        'hospital_name' => 'Kauvery Hospital Madurai',
        'assigned_ambulance' => 'TN-59-AM-4112',
        'availability_status' => 'Available',
        'ambulance_status' => 'Active',
        'latitude' => 9.9285,
        'longitude' => 78.1285,
    ],
    [
        'name' => 'Trauma Paramedic Anitha',
        'email' => 'responder6@emergency.com',
        'mobile' => '9876543206',
        'password' => 'password123',
        'hospital_name' => 'Government Rajaji Hospital',
        'assigned_ambulance' => 'TN-59-AM-5500',
        'availability_status' => 'Available',
        'ambulance_status' => 'Active',
        'latitude' => 9.9165,
        'longitude' => 78.1135,
    ],
    [
        'name' => 'Ambulance Officer Rajesh',
        'email' => 'responder7@emergency.com',
        'mobile' => '9876543207',
        'password' => 'password123',
        'hospital_name' => 'Metro Care Hospital',
        'assigned_ambulance' => 'KA-01-AM-7080',
        'availability_status' => 'Offline',
        'ambulance_status' => 'Inactive',
        'latitude' => 12.9790,
        'longitude' => 77.5910,
    ],
];

echo "Adding 5 new Responder records to MySQL...\n";

foreach ($newRespondersData as $data) {
    // 1. Create or get user
    $user = User::where('email', $data['email'])->first();
    if (!$user) {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'mobile' => $data['mobile'],
            'password' => Hash::make($data['password']),
            'role_id' => $roleId,
        ]);
        echo "Created User: {$user->name} ({$user->email})\n";
    } else {
        echo "User already exists: {$user->email}\n";
    }

    // 2. Find hospital by name or fallback to first
    $hospital = Hospital::where('name', 'like', '%' . $data['hospital_name'] . '%')->first();
    if (!$hospital) {
        $hospital = Hospital::first();
    }

    // 3. Create or update responder record for this user
    $responder = Responder::where('user_id', $user->id)->first();
    if (!$responder) {
        $responder = Responder::create([
            'user_id' => $user->id,
            'hospital_id' => $hospital ? $hospital->id : 1,
            'assigned_ambulance' => $data['assigned_ambulance'],
            'availability_status' => $data['availability_status'],
            'ambulance_status' => $data['ambulance_status'],
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
        ]);
        echo "Created Responder ID: {$responder->id} for User ID: {$user->id} assigned to {$hospital?->name}\n";
    } else {
        echo "Responder profile already exists for User ID: {$user->id}\n";
    }
}

echo "\n--- TOTAL RESPONDERS IN MYSQL ---\n";
$allResponders = Responder::with('user', 'hospital')->get();
foreach ($allResponders as $r) {
    echo "Responder ID: {$r->id} | User ID: {$r->user_id} | Name: {$r->user?->name} | Email: {$r->user?->email} | Mobile: {$r->user?->mobile} | Hospital: {$r->hospital?->name} (ID: {$r->hospital_id}) | AmbNo: {$r->assigned_ambulance} | AvailStatus: {$r->availability_status} | AmbStatus: {$r->ambulance_status} | Lat: {$r->latitude} | Lng: {$r->longitude}\n";
}
echo "\nTotal Responders Count: " . $allResponders->count() . "\n";
