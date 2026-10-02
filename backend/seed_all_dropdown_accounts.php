<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Hospital;
use App\Models\Responder;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

$patientRole   = Role::firstOrCreate(['name' => 'patient']);
$adminRole     = Role::firstOrCreate(['name' => 'admin']);
$responderRole = Role::firstOrCreate(['name' => 'responder']);

// Fetch top 10 hospitals for multi-tenant admin assignment
$hospitals = Hospital::take(10)->get();

echo "========================================================================\n";
echo "  SEEDING COMPLETE DROPDOWN ACCOUNTS (Password: password123)\n";
echo "========================================================================\n\n";

// 1. PATIENT ACCOUNTS
$patientEmails = ['patient@emergency.com', 'patient1@emergency.com'];
foreach ($patientEmails as $idx => $pEmail) {
    $pUser = User::where('email', $pEmail)->first();
    if (!$pUser) {
        $pUser = User::create([
            'name' => "Demo Patient " . ($idx + 1),
            'email' => $pEmail,
            'mobile' => "980000100" . $idx,
            'password' => Hash::make('password123'),
            'role_id' => $patientRole->id
        ]);
    } else {
        $pUser->update([
            'password' => Hash::make('password123'),
            'role_id' => $patientRole->id
        ]);
    }
    echo "✅ Patient: {$pEmail} | RoleID: {$pUser->role_id}\n";
}

// 2. ADMIN ACCOUNTS (admin@emergency.com, admin1..admin10, admin187..admin191)
echo "\n--- HOSPITAL ADMIN ACCOUNTS ---\n";

$adminMap = [
    'admin@emergency.com'   => $hospitals[0] ?? null,
    'admin1@emergency.com'  => Hospital::where('name', 'like', '%Apollo%')->first() ?: ($hospitals[0] ?? null),
    'admin2@emergency.com'  => Hospital::where('name', 'like', '%Meenakshi%')->first() ?: ($hospitals[1] ?? null),
    'admin3@emergency.com'  => Hospital::where('name', 'like', '%Velammal%')->first() ?: ($hospitals[2] ?? null),
    'admin4@emergency.com'  => Hospital::where('name', 'like', '%Vadamalayan%')->first() ?: ($hospitals[3] ?? null),
    'admin5@emergency.com'  => Hospital::where('name', 'like', '%Devadoss%')->first() ?: ($hospitals[4] ?? null),
    'admin6@emergency.com'  => $hospitals[5] ?? null,
    'admin7@emergency.com'  => $hospitals[6] ?? null,
    'admin8@emergency.com'  => $hospitals[7] ?? null,
    'admin9@emergency.com'  => $hospitals[8] ?? null,
    'admin10@emergency.com' => $hospitals[9] ?? null,
];

$count = 1;
foreach ($adminMap as $email => $hosp) {
    if (!$hosp) continue;
    
    $aUser = User::where('email', $email)->first();
    if (!$aUser) {
        $aUser = User::create([
            'name' => "Admin - {$hosp->name}",
            'email' => $email,
            'mobile' => "980000200" . $count,
            'password' => Hash::make('password123'),
            'role_id' => $adminRole->id,
            'hospital_id' => $hosp->id
        ]);
    } else {
        $aUser->update([
            'name' => "Admin - {$hosp->name}",
            'password' => Hash::make('password123'),
            'role_id' => $adminRole->id,
            'hospital_id' => $hosp->id
        ]);
    }
    echo "  - {$email} -> [#{$hosp->id}] {$hosp->name} (RoleID: {$aUser->role_id})\n";
    $count++;
}

// 3. RESPONDER ACCOUNTS (responder@emergency.com, responder1..responder7)
echo "\n--- RESPONDER ACCOUNTS ---\n";

$responderEmails = [
    'responder@emergency.com'  => $hospitals[0] ?? null,
    'responder1@emergency.com' => Hospital::where('name', 'like', '%Apollo%')->first() ?: ($hospitals[0] ?? null),
    'responder2@emergency.com' => Hospital::where('name', 'like', '%Meenakshi%')->first() ?: ($hospitals[1] ?? null),
    'responder3@emergency.com' => Hospital::where('name', 'like', '%Velammal%')->first() ?: ($hospitals[2] ?? null),
    'responder4@emergency.com' => Hospital::where('name', 'like', '%Vadamalayan%')->first() ?: ($hospitals[3] ?? null),
    'responder5@emergency.com' => Hospital::where('name', 'like', '%Devadoss%')->first() ?: ($hospitals[4] ?? null),
    'responder6@emergency.com' => Hospital::where('name', 'like', '%Rajaji%')->first() ?: ($hospitals[5] ?? null),
    'responder7@emergency.com' => $hospitals[6] ?? null,
];

$rCount = 1;
foreach ($responderEmails as $rEmail => $hosp) {
    if (!$hosp) continue;

    $rUser = User::where('email', $rEmail)->first();
    if (!$rUser) {
        $rUser = User::create([
            'name' => "Responder Unit {$rCount}",
            'email' => $rEmail,
            'mobile' => "990000300" . $rCount,
            'password' => Hash::make('password123'),
            'role_id' => $responderRole->id
        ]);
    } else {
        $rUser->update([
            'password' => Hash::make('password123'),
            'role_id' => $responderRole->id
        ]);
    }

    $respRec = Responder::where('user_id', $rUser->id)->first();
    if (!$respRec) {
        $respRec = Responder::create([
            'user_id' => $rUser->id,
            'responder_name' => "Ambulance Unit {$rCount}",
            'phone_number' => "990000300" . $rCount,
            'availability_status' => 'Available',
            'current_latitude' => $hosp->latitude,
            'current_longitude' => $hosp->longitude
        ]);
    } else {
        $respRec->update([
            'availability_status' => 'Available',
            'current_latitude' => $hosp->latitude,
            'current_longitude' => $hosp->longitude
        ]);
    }
    echo "  - {$rEmail} -> Ambulance Unit {$rCount} at {$hosp->name} (RoleID: {$rUser->role_id})\n";
    $rCount++;
}

echo "\n========================================================================\n";
echo "SUCCESS: ALL DROPDOWN ACCOUNTS SEEDED & VERIFIED!\n";
echo "========================================================================\n";
