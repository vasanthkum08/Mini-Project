<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Responder;
use App\Models\User;
use App\Models\Hospital;

echo "=== All Responders in MySQL Database ===\n";
$responders = Responder::with('user', 'hospital')->get();

foreach ($responders as $r) {
    echo "ID: {$r->id}\n";
    echo "  User ID: {$r->user_id} (" . ($r->user ? $r->user->name : 'No User') . ", Email: " . ($r->user ? $r->user->email : 'N/A') . ")\n";
    echo "  Hospital ID: {$r->hospital_id} (" . ($r->hospital ? $r->hospital->name : 'No Hospital Assigned') . ")\n";
    echo "  Ambulance: " . ($r->assigned_ambulance ?? 'No Ambulance Assigned') . "\n";
    echo "  Ambulance Status: {$r->ambulance_status}\n";
    echo "  Availability Status: {$r->availability_status}\n";
    echo "  Coordinates: Lat={$r->latitude}, Lng={$r->longitude}\n";
    echo "---------------------------------------------------------\n";
}

echo "=== Users with role_id = 3 (responder) ===\n";
$users = User::where('role_id', 3)->get();
foreach ($users as $u) {
    echo "User ID: {$u->id}, Name: {$u->name}, Email: {$u->email}, Mobile: {$u->mobile}\n";
}
