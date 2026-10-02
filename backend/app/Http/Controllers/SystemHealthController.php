<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use App\Models\User;
use App\Models\Hospital;
use App\Models\EmergencyAppointment;
use App\Models\Responder;

class SystemHealthController extends Controller
{
    /**
     * Get system health monitoring status and log error statistics.
     */
    public function getHealth()
    {
        $startTime = microtime(true);

        // 1. MySQL Database Health & Latency Check
        $dbStatus = 'Healthy';
        $dbLatencyMs = 0;
        try {
            $dbStart = microtime(true);
            DB::connection()->getPdo();
            $dbLatencyMs = round((microtime(true) - $dbStart) * 1000, 2);
        } catch (\Exception $e) {
            $dbStatus = 'Disconnected: ' . $e->getMessage();
        }

        // 2. Log Errors Parser (storage/logs/laravel.log)
        $logErrorsCount = 0;
        $failedRequestsCount = 0;
        $authFailuresCount = 0;
        $googleMapsErrorsCount = 0;
        $recentErrorSnippet = null;

        $logPath = storage_path('logs/laravel.log');
        if (File::exists($logPath)) {
            $lines = file($logPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            $recentLines = array_slice($lines, -500); // Check last 500 lines

            foreach ($recentLines as $line) {
                if (str_contains($line, '.ERROR') || str_contains($line, '.CRITICAL')) {
                    $logErrorsCount++;
                    $recentErrorSnippet = substr($line, 0, 160);
                }
                if (str_contains($line, '401') || str_contains($line, 'Unauthenticated')) {
                    $authFailuresCount++;
                }
                if (str_contains($line, '422') || str_contains($line, 'Validation error') || str_contains($line, '500')) {
                    $failedRequestsCount++;
                }
                if (str_contains($line, '[Geocode]') || str_contains($line, '[GoogleMaps]')) {
                    if (str_contains($line, 'failed') || str_contains($line, 'error') || str_contains($line, 'ZERO_RESULTS')) {
                        $googleMapsErrorsCount++;
                    }
                }
            }
        }

        // 3. API & External Services Health
        $googleMapsStatus = env('GOOGLE_MAPS_API_KEY') ? 'Configured (Live)' : 'Operational (Fallback Mode Active)';
        $geminiAiStatus   = env('GEMINI_API_KEY') ? 'Configured (Live)' : 'Operational (Fallback Engine Active)';
        $jwtAuthStatus    = env('JWT_SECRET') ? 'Healthy (JWT Configured)' : 'Warning (No JWT Secret)';

        $overallLatencyMs = round((microtime(true) - $startTime) * 1000, 2);

        return response()->json([
            'success' => true,
            'timestamp' => date('Y-m-d H:i:s'),
            'system' => [
                'server_status' => 'Operational',
                'php_version' => PHP_VERSION,
                'memory_usage_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
                'overall_latency_ms' => $overallLatencyMs,
            ],
            'database' => [
                'status' => $dbStatus,
                'latency_ms' => $dbLatencyMs,
                'total_users' => User::count(),
                'total_hospitals' => Hospital::count(),
                'total_responders' => Responder::count(),
                'total_appointments' => EmergencyAppointment::count(),
            ],
            'external_services' => [
                'google_maps_api' => $googleMapsStatus,
                'gemini_ai_api' => $geminiAiStatus,
                'jwt_auth' => $jwtAuthStatus,
            ],
            'monitoring_logs' => [
                'total_logged_errors' => $logErrorsCount,
                'failed_requests_count' => $failedRequestsCount,
                'auth_failures_count' => $authFailuresCount,
                'google_maps_errors_count' => $googleMapsErrorsCount,
                'recent_error' => $recentErrorSnippet ?: 'No recent critical system errors logged.'
            ]
        ]);
    }

    /**
     * Clear historical system log file.
     */
    public function clearLogs()
    {
        $logPath = storage_path('logs/laravel.log');
        if (File::exists($logPath)) {
            File::put($logPath, '');
        }

        return response()->json([
            'success' => true,
            'message' => 'System error logs cleared successfully.'
        ]);
    }
}
