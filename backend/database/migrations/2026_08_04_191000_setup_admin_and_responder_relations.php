<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add hospital_id to users table for Hospital Admins
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('hospital_id')->nullable()->constrained('hospitals')->onDelete('set null');
        });

        // 2. Create responders table
        Schema::create('responders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->foreignId('hospital_id')->nullable()->constrained('hospitals')->onDelete('set null');
            $table->string('assigned_ambulance')->default('Ambulance Node A-10');
            $table->string('ambulance_status')->default('Active'); // Active, Inactive
            $table->string('availability_status')->default('Available'); // Available, Busy, Offline
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('responders');
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['hospital_id']);
            $table->dropColumn('hospital_id');
        });
    }
};
