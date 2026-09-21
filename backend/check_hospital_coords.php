<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Hospital;

$hospitals = Hospital::all();
echo "Total Hospitals in MySQL: " . $hospitals->count() . "\n";

$missingCoords = 0;
$sameCoords = [];

foreach ($hospitals as $h) {
    if (empty($h->latitude) || empty($h->longitude) || $h->latitude == 0 || $h->longitude == 0) {
        echo "Missing Coords: ID {$h->id} - {$h->name} ({$h->city})\n";
        $missingCoords++;
    } else {
        $coordKey = "{$h->latitude},{$h->longitude}";
        if (!isset($sameCoords[$coordKey])) {
            $sameCoords[$coordKey] = [];
        }
        $sameCoords[$coordKey][] = "ID {$h->id} - {$h->name} ({$h->city})";
    }
}

echo "Hospitals with missing/zero coordinates: {$missingCoords}\n";

$duplicates = 0;
foreach ($sameCoords as $coord => $list) {
    if (count($list) > 1) {
        echo "\nDuplicate Coordinates [{$coord}]:\n";
        foreach ($list as $item) {
            echo "  - {$item}\n";
        }
        $duplicates++;
    }
}
echo "Unique coordinate locations: " . count($sameCoords) . "\n";
