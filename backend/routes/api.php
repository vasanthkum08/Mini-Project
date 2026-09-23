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

    // Phase 2 AI Medical Assistant & Hospitals matching
    Route::post('ai/analyze', [AIAnalysisController::class, 'analyze']);
    Route::get('hospitals', [HospitalController::class, 'index']);

    // Phase 2 Emergency Appointment requests
    Route::post('appointments', [AppointmentController::class, 'store']);

    // Phase 4 Analytics & Hospital Admin endpoints
    Route::get('admin/hospital', [\App\Http\Controllers\HospitalAdminController::class, 'getHospital']);
    Route::put('admin/hospital', [\App\Http\Controllers\HospitalAdminController::class, 'updateHospital']);
    Route::get('admin/analytics', [\App\Http\Controllers\HospitalAdminController::class, 'getAnalytics']);
    Route::get('responder/profile', [\App\Http\Controllers\ResponderController::class, 'getProfile']);
    Route::put('responder/profile', [\App\Http\Controllers\ResponderController::class, 'updateProfile']);
    Route::put('responder/status', [\App\Http\Controllers\ResponderController::class, 'updateCaseStatus']);
});
