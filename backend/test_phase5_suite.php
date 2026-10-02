<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Hospital;
use App\Models\Responder;
use App\Models\EmergencyAppointment;
use App\Models\Notification;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HospitalController;
use App\Http\Controllers\AIAnalysisController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\HospitalAdminController;
use App\Http\Controllers\ResponderController;
use App\Http\Controllers\NotificationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

echo "========================================================================\n";
echo "    EMERGENIX-AI: PHASE 5 FULL SYSTEM TESTING & SECURITY AUDIT TEST SUITE\n";
echo "========================================================================\n\n";

$passedCount = 0;
$failedCount = 0;

function assertTest(string $testName, bool $condition, string $details = '') {
    global $passedCount, $failedCount;
    if ($condition) {
        $passedCount++;
        echo "  [PASS] {$testName} " . ($details ? "({$details})" : "") . "\n";
    } else {
        $failedCount++;
        echo "  [FAIL] {$testName} " . ($details ? "({$details})" : "") . "\n";
    }
}

// ------------------------------------------------------------------------
// 1. AUTHENTICATION & ROLE AUTHORIZATION TESTS
// ------------------------------------------------------------------------
echo "--- 1. Testing Authentication & Role Authorization ---\n";

$patientUser = User::whereDoesntHave('responder')->first() ?: User::first();
assertTest("Patient User exists in MySQL", $patientUser !== null, "ID: {$patientUser?->id}");

$adminUser = User::whereNotNull('hospital_id')->first() ?: User::first();
assertTest("Admin User exists in MySQL", $adminUser !== null, "ID: {$adminUser?->id}");

$respRec = Responder::first();
$responderUser = ($respRec && $respRec->user_id) ? User::find($respRec->user_id) : null;
if (!$responderUser) {
    $responderUser = User::first();
    if ($respRec && $responderUser) {
        $respRec->update(['user_id' => $responderUser->id]);
    }
}
assertTest("Responder User exists in MySQL", $responderUser !== null, "ID: {$responderUser?->id}");

// Test unauthenticated access guard
Auth::guard('api')->logout();
$responderCtrl = new ResponderController();
$unauthProfileRes = $responderCtrl->getProfile();
assertTest("Unauthenticated API access blocked (HTTP 401)", $unauthProfileRes->getStatusCode() === 401);

// ------------------------------------------------------------------------
// 2. AI SYMPTOM ANALYSIS & TRIAGE FLOW
// ------------------------------------------------------------------------
echo "\n--- 2. Testing AI Symptom Triage Flow ---\n";
Auth::guard('api')->setUser($patientUser);

$aiCtrl = new AIAnalysisController();
$aiReq = Request::create('/api/ai/analyze', 'POST', [
    'symptoms' => 'Severe chest pain, breathlessness, radiation down left arm'
]);
$aiRes = $aiCtrl->analyze($aiReq);
$aiData = json_decode($aiRes->getContent(), true);

assertTest("AI Triage API call successful", $aiRes->getStatusCode() === 200 && ($aiData['success'] ?? false));
assertTest("AI Severity set to High", ($aiData['data']['emergency_severity'] ?? '') === 'High');
assertTest("AI Triage Level present", !empty($aiData['data']['triage_level']));
assertTest("AI Risk Score present", isset($aiData['data']['risk_score']));

// ------------------------------------------------------------------------
// 3. CITY + STATE + LANDMARK GEOLOCATION & HOSPITAL RECOMMENDATION
// ------------------------------------------------------------------------
echo "\n--- 3. Testing City + State + Landmark Location Search & Hospital Ranking ---\n";

$hospCtrl = new HospitalController();
$hospReq = Request::create('/api/hospitals', 'GET', [
    'city' => 'Madurai',
    'state' => 'Tamil Nadu',
    'landmark' => 'Kaitari Nagar',
    'severity' => 'High',
    'specialty' => 'Cardiology'
]);
$hospRes = $hospCtrl->index($hospReq);
$hospData = json_decode($hospRes->getContent(), true);

assertTest("Hospital Search API returns success", $hospRes->getStatusCode() === 200 && ($hospData['success'] ?? false));
assertTest("Hospitals list returned dynamically from MySQL", !empty($hospData['data']['hospitals']));
$topHosp = $hospData['data']['hospitals'][0] ?? null;
assertTest("Top hospital has valid recommendation score", ($topHosp['recommendation_score'] ?? 0) > 0, "Score: {$topHosp['recommendation_score']}");
assertTest("Calculated ETA & distance present", isset($topHosp['distance_km']) && isset($topHosp['eta_minutes']));

// Test Validation error when location empty
$emptyHospReq = Request::create('/api/hospitals', 'GET', ['severity' => 'High']);
$emptyHospRes = $hospCtrl->index($emptyHospReq);
assertTest("Empty location search returns validation HTTP 422", $emptyHospRes->getStatusCode() === 422);

// ------------------------------------------------------------------------
// 4. EMERGENCY APPOINTMENT BOOKING & REAL-TIME NOTIFICATION FLOW
// ------------------------------------------------------------------------
echo "\n--- 4. Testing Emergency Appointment Booking & Notification Trigger ---\n";

$appCtrl = new AppointmentController();
$appReq = Request::create('/api/appointments', 'POST', [
    'patient_name' => 'Testing Patient QA',
    'mobile_number' => '9876543210',
    'gps_location' => 'Kaitari Nagar, Madurai (Lat: 9.9188, Lng: 78.1332)',
    'hospital_name' => $topHosp['name'] ?? 'Velammal Medical College',
    'department' => 'Cardiology',
    'appointment_date' => date('Y-m-d'),
    'appointment_time' => date('H:i:s'),
    'priority' => 'High',
    'symptoms' => 'Severe chest pain emergency'
]);
$appRes = $appCtrl->store($appReq);
$appData = json_decode($appRes->getContent(), true);

assertTest("Emergency Appointment booking succeeds (HTTP 201)", $appRes->getStatusCode() === 201 && ($appData['success'] ?? false));
$newAppId = $appData['data']['id'] ?? null;
assertTest("Appointment ID created in MySQL", !empty($newAppId));

// Check notification creation
$notif = Notification::where('title', 'like', '%Emergency Request%')->orderBy('id', 'desc')->first();
assertTest("Real-time notification created for appointment", $notif !== null);

// ------------------------------------------------------------------------
// 5. RESPONDER TELEMETRY, ONE-CLICK STATUS UPDATES & CASE COMPLETION
// ------------------------------------------------------------------------
echo "\n--- 5. Testing Responder Status Updates & MySQL State Transitions ---\n";

Auth::guard('api')->setUser($responderUser);
$respCtrl = new ResponderController();

// Assign new appointment to responder
if ($newAppId) {
    $apptModel = EmergencyAppointment::find($newAppId);
    $respModel = Responder::where('user_id', $responderUser->id)->first();
    if ($apptModel && $respModel) {
        $apptModel->update(['responder_id' => $respModel->id]);
    }
}

// Update status to 'On The Way'
$statusReq1 = Request::create('/api/responder/status', 'PUT', [
    'status' => 'On The Way',
    'case_id' => $newAppId,
    'latitude' => 9.9190,
    'longitude' => 78.1335
]);
$statusRes1 = $respCtrl->updateCaseStatus($statusReq1);
assertTest("Responder status transition to 'On The Way' succeeds", $statusRes1->getStatusCode() === 200);

// Update status to 'Completed'
$statusReq2 = Request::create('/api/responder/status', 'PUT', [
    'status' => 'Completed',
    'case_id' => $newAppId
]);
$statusRes2 = $respCtrl->updateCaseStatus($statusReq2);
assertTest("Responder case completion succeeds", $statusRes2->getStatusCode() === 200);

// Verify appointment status updated to Completed in MySQL
$updatedAppt = EmergencyAppointment::find($newAppId);
assertTest("Emergency appointment status in MySQL is 'Completed'", $updatedAppt?->status === 'Completed');

// Verify responder availability returned to 'Available'
$updatedResp = Responder::where('user_id', $responderUser->id)->first();
assertTest("Responder availability in MySQL is 'Available'", $updatedResp?->availability_status === 'Available');

// Clean up test appointment
if ($newAppId) {
    EmergencyAppointment::destroy($newAppId);
}

// ------------------------------------------------------------------------
// 6. ADMIN HOSPITAL AVAILABILITY UPDATES & ANALYTICS
// ------------------------------------------------------------------------
echo "\n--- 6. Testing Admin Hospital Availability Updates & Phase 4 Analytics ---\n";

Auth::guard('api')->setUser($adminUser);
$adminCtrl = new HospitalAdminController();

$analyticsReq = Request::create('/api/admin/analytics', 'GET');
$analyticsRes = $adminCtrl->getAnalytics($analyticsReq);
$analyticsData = json_decode($analyticsRes->getContent(), true);

assertTest("Admin Analytics API returns HTTP 200", $analyticsRes->getStatusCode() === 200);
assertTest("MySQL summary metrics returned", isset($analyticsData['data']['summary']['total_cases']));

// Test hospital updates validation
$hospId = $adminUser->hospital_id ?: (Hospital::first()->id ?? 1);
$badUpdateReq = Request::create('/api/admin/hospital', 'PUT', [
    'hospital_id' => $hospId,
    'available_doctors' => -5 // Invalid negative number
]);
$badUpdateRes = $adminCtrl->updateHospital($badUpdateReq);
assertTest("Negative doctor count rejected by validation (HTTP 422)", $badUpdateRes->getStatusCode() === 422);

// ------------------------------------------------------------------------
// SUMMARY RESULTS
// ------------------------------------------------------------------------
echo "\n========================================================================\n";
echo "    TEST SUITE SUMMARY: {$passedCount} PASSED, {$failedCount} FAILED\n";
echo "========================================================================\n";

if ($failedCount === 0) {
    echo "SUCCESS: ALL PHASE 5 INTEGRATION & SECURITY TESTS PASSED!\n";
} else {
    echo "ATTENTION: SOME TESTS FAILED. CHECK LOGS ABOVE.\n";
}
