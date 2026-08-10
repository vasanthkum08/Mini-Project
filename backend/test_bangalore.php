<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$request = Illuminate\Http\Request::create('/api/hospitals', 'GET', ['latitude' => 12.9716, 'longitude' => 77.5946]);
$controller = app('App\Http\Controllers\HospitalController');
$response = $controller->index($request);
echo $response->getContent();
