<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hospitals', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('state');
            $table->string('district');
            $table->string('city');
            $table->string('address');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('phone')->nullable();
            $table->json('specialties')->nullable(); // Available Departments
            $table->integer('available_doctors')->default(5);
            $table->integer('available_icu_beds')->default(5);
            $table->integer('available_general_beds')->default(15);
            $table->integer('emergency_beds')->default(10);
            $table->integer('er_wait_minutes')->default(15); // Estimated Waiting Time
            $table->integer('queue_count')->default(5);
            $table->string('email')->nullable();
            $table->string('hospital_type')->default('Private'); // Government / Private
            $table->boolean('emergency_24_7')->default(true);
            $table->boolean('ambulance_available')->default(true);
            $table->string('hospital_status')->default('Open'); // Open / Closed
            $table->decimal('rating', 3, 2)->default(4.0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hospitals');
    }
};
