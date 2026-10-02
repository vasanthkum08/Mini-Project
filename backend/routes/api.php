<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\HospitalController;
use App\Http\Controllers\AIAnalysisController;
use App\Http\Controllers\AppointmentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Authentication endpoints
Route::get('login', function () {
    return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
})->name('login');
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);
Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('reset-password', [AuthController::class, 'resetPassword']);

// Compatibility groups
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

// Public Hospitals Search endpoint
Route::get('hospitals', [HospitalController::class, 'index']);

// Protected routes using JWT guard
Route::middleware('auth:api')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    
    Route::prefix('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('me', [AuthController::class, 'me']);
        Route::put('profile/update', [AuthController::class, 'updateProfile']);
    });

    Route::put('user/profile', [AuthController::class, 'updateProfile']);

    // Phase 2 AI Medical Assistant
    Route::post('ai/analyze', [AIAnalysisController::class, 'analyze']);

    // Phase 2 Emergency Appointment requests
    Route::post('appointments', [AppointmentController::class, 'store']);

    // Phase 4 Analytics & Hospital Admin endpoints
    Route::get('admin/hospital', [\App\Http\Controllers\HospitalAdminController::class, 'getHospital']);
    Route::put('admin/hospital', [\App\Http\Controllers\HospitalAdminController::class, 'updateHospital']);
    Route::get('admin/analytics', [\App\Http\Controllers\HospitalAdminController::class, 'getAnalytics']);
    Route::get('admin/appointments', [\App\Http\Controllers\HospitalAdminController::class, 'getAppointments']);

    // Phase 6 Deployment, System Health Monitoring & Database Backup endpoints
    Route::get('admin/health', [\App\Http\Controllers\SystemHealthController::class, 'getHealth']);
    Route::post('admin/health/clear-logs', [\App\Http\Controllers\SystemHealthController::class, 'clearLogs']);
    Route::post('admin/backup/create', [\App\Http\Controllers\BackupController::class, 'createBackup']);
    Route::get('admin/backup/list', [\App\Http\Controllers\BackupController::class, 'listBackups']);
    Route::post('admin/backup/restore', [\App\Http\Controllers\BackupController::class, 'restoreBackup']);

    Route::get('responder/profile', [\App\Http\Controllers\ResponderController::class, 'getProfile']);
    Route::put('responder/profile', [\App\Http\Controllers\ResponderController::class, 'updateProfile']);
    Route::put('responder/status', [\App\Http\Controllers\ResponderController::class, 'updateCaseStatus']);
});
