<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Role;
use App\Models\Responder;
use App\Models\Hospital;

echo "--- ROLES ---\n";
print_r(Role::all()->toArray());

echo "\n--- RESPONDERS & LINKED USERS ---\n";
$responders = Responder::with('user', 'hospital')->get();
foreach ($responders as $r) {
    echo "Responder ID: {$r->id} | User ID: {$r->user_id} | Name: {$r->user?->name} | Email: {$r->user?->email} | Mobile: {$r->user?->mobile} | RoleID: {$r->user?->role_id} ({$r->user?->role}) | Hospital: {$r->hospital?->name} (ID: {$r->hospital_id}) | AmbNo: {$r->assigned_ambulance} | AvailStatus: {$r->availability_status} | AmbStatus: {$r->ambulance_status} | Lat: {$r->latitude} | Lng: {$r->longitude}\n";
}

echo "\nTotal Responders Count: " . $responders->count() . "\n";

echo "\n--- HOSPITALS SAMPLE (first 10) ---\n";
foreach (Hospital::take(10)->get() as $h) {
    echo "Hosp ID: {$h->id} | Name: {$h->name} | City: {$h->city} | Lat: {$h->latitude} | Lng: {$h->longitude}\n";
}
