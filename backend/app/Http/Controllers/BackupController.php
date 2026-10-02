<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Hospital;
use App\Models\EmergencyAppointment;
use App\Models\Responder;

class BackupController extends Controller
{
    private function getBackupDir()
    {
        $dir = storage_path('app/backups');
        if (!File::exists($dir)) {
            File::makeDirectory($dir, 0755, true);
        }
        return $dir;
    }

    /**
     * Create a MySQL database backup snapshot (JSON format).
     */
    public function createBackup()
    {
        try {
            $dir = $this->getBackupDir();
            $timestamp = date('Y-m-d_H-i-s');
            $fileName = "backup_{$timestamp}.json";
            $filePath = $dir . '/' . $fileName;

            $data = [
                'timestamp' => date('Y-m-d H:i:s'),
                'version' => '1.0',
                'tables' => [
                    'users' => DB::table('users')->get()->map(fn($r) => (array)$r)->toArray(),
                    'hospitals' => DB::table('hospitals')->get()->map(fn($r) => (array)$r)->toArray(),
                    'emergency_appointments' => DB::table('emergency_appointments')->get()->map(fn($r) => (array)$r)->toArray(),
                    'responders' => DB::table('responders')->get()->map(fn($r) => (array)$r)->toArray(),
                    'notifications' => DB::table('notifications')->get()->map(fn($r) => (array)$r)->toArray(),
                ],
                'summary' => [
                    'users' => DB::table('users')->count(),
                    'hospitals' => DB::table('hospitals')->count(),
                    'emergency_appointments' => DB::table('emergency_appointments')->count(),
                    'responders' => DB::table('responders')->count(),
                    'notifications' => DB::table('notifications')->count(),
                ]
            ];

            File::put($filePath, json_encode($data, JSON_PRETTY_PRINT));

            return response()->json([
                'success' => true,
                'message' => "Database backup created successfully ({$fileName}).",
                'data' => [
                    'file_name' => $fileName,
                    'timestamp' => $data['timestamp'],
                    'size_kb' => round(filesize($filePath) / 1024, 2),
                    'summary' => $data['summary']
                ]
            ], 201);
        } catch (\Exception $e) {
            \Log::error('[Backup Create] Failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create database backup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * List all historical database backups.
     */
    public function listBackups()
    {
        try {
            $dir = $this->getBackupDir();
            $files = File::files($dir);
            $backups = [];

            foreach ($files as $file) {
                if ($file->getExtension() === 'json') {
                    $content = json_decode(File::get($file->getRealPath()), true);
                    $backups[] = [
                        'file_name' => $file->getFilename(),
                        'timestamp' => $content['timestamp'] ?? date('Y-m-d H:i:s', $file->getMTime()),
                        'size_kb' => round($file->getSize() / 1024, 2),
                        'summary' => $content['summary'] ?? []
                    ];
                }
            }

            // Sort by latest timestamp
            usort($backups, function ($a, $b) {
                return strcmp($b['timestamp'], $a['timestamp']);
            });

            return response()->json([
                'success' => true,
                'count' => count($backups),
                'data' => $backups
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to list backups: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore database snapshot from a backup file.
     */
    public function restoreBackup(Request $request)
    {
        $fileName = $request->input('file_name');
        if (!$fileName) {
            return response()->json([
                'success' => false,
                'message' => 'Backup file_name is required.'
            ], 422);
        }

        $dir = $this->getBackupDir();
        $filePath = $dir . '/' . basename($fileName);

        if (!File::exists($filePath)) {
            return response()->json([
                'success' => false,
                'message' => 'Backup file not found.'
            ], 404);
        }

        try {
            $content = json_decode(File::get($filePath), true);
            if (!isset($content['tables'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid backup file structure.'
                ], 422);
            }

            // Disable foreign key checks for restore
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            DB::beginTransaction();

            // 1. Restore Hospitals
            if (isset($content['tables']['hospitals'])) {
                DB::table('hospitals')->delete();
                foreach ($content['tables']['hospitals'] as $row) {
                    $arr = $this->sanitizeRow((array)$row);
                    if (isset($arr['specialties']) && is_array($arr['specialties'])) {
                        $arr['specialties'] = json_encode($arr['specialties']);
                    }
                    if (isset($arr['ambulance_available'])) {
                        $arr['ambulance_available'] = (int)$arr['ambulance_available'];
                    }
                    if (isset($arr['emergency_24_7'])) {
                        $arr['emergency_24_7'] = (int)$arr['emergency_24_7'];
                    }
                    DB::table('hospitals')->insert($arr);
                }
            }

            // 2. Restore Users
            if (isset($content['tables']['users'])) {
                DB::table('users')->delete();
                foreach ($content['tables']['users'] as $row) {
                    $arr = $this->sanitizeRow((array)$row);
                    DB::table('users')->insert($arr);
                }
            }

            // 3. Restore Emergency Appointments
            if (isset($content['tables']['emergency_appointments'])) {
                DB::table('emergency_appointments')->delete();
                foreach ($content['tables']['emergency_appointments'] as $row) {
                    $arr = $this->sanitizeRow((array)$row);
                    DB::table('emergency_appointments')->insert($arr);
                }
            }

            // 4. Restore Responders
            if (isset($content['tables']['responders'])) {
                DB::table('responders')->delete();
                foreach ($content['tables']['responders'] as $row) {
                    $arr = $this->sanitizeRow((array)$row);
                    DB::table('responders')->insert($arr);
                }
            }

            // 5. Restore Notifications
            if (isset($content['tables']['notifications'])) {
                DB::table('notifications')->delete();
                foreach ($content['tables']['notifications'] as $row) {
                    $arr = $this->sanitizeRow((array)$row);
                    DB::table('notifications')->insert($arr);
                }
            }

            DB::commit();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            return response()->json([
                'success' => true,
                'message' => "Database successfully restored from snapshot {$fileName}.",
                'summary' => [
                    'users' => User::count(),
                    'hospitals' => Hospital::count(),
                    'emergency_appointments' => EmergencyAppointment::count(),
                    'responders' => Responder::count(),
                ]
            ]);
        } catch (\Exception $e) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            \Log::error('[Backup Restore] Failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to restore database backup: ' . $e->getMessage() . ' at line ' . $e->getLine()
            ], 500);
        }
    }

    /**
     * Sanitize datetime strings for MySQL insert compatibility.
     */
    private function sanitizeRow(array $arr): array
    {
        foreach (['created_at', 'updated_at', 'email_verified_at'] as $col) {
            if (isset($arr[$col]) && is_string($arr[$col])) {
                $ts = strtotime($arr[$col]);
                if ($ts !== false) {
                    $arr[$col] = date('Y-m-d H:i:s', $ts);
                }
            }
        }
        return $arr;
    }
}
