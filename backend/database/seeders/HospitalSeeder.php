<?php

namespace Database\Seeders;

use App\Models\Hospital;
use Illuminate\Database\Seeder;

class HospitalSeeder extends Seeder
{
    public function run(): void
    {
        $cities = [
            [
                'city' => 'Bangalore',
                'state' => 'Karnataka',
                'district' => 'Bangalore Urban',
                'lat' => 12.9716,
                'lng' => 77.5946,
                'names' => [
                    'Metro Care Hospital (A)',
                    'Apex Healthcare Center (B)',
                    'National Trauma Institute (C)',
                    'City General Clinic (D)',
                    'St. Jude Emergency Center (E)',
                    'Fortis Clinical Care',
                    'Columbia Asia Emergency',
                    'Manipal Health Center',
                    'Sakra World Hospital',
                    'Narayana Hrudayalaya'
                ]
            ],
            [
                'city' => 'Chennai',
                'state' => 'Tamil Nadu',
                'district' => 'Chennai',
                'lat' => 13.0827,
                'lng' => 80.2707,
                'names' => [
                    'Apollo Emergency Care',
                    'Madras Medical Mission',
                    'Fortis Malar Hospital',
                    'Global Health City',
                    'MIOT International',
                    'SIMS Hospital Vadapalani'
                ]
            ],
            [
                'city' => 'Madurai',
                'state' => 'Tamil Nadu',
                'district' => 'Madurai',
                'lat' => 9.9252,
                'lng' => 78.1198,
                'names' => [
                    'Meenakshi Mission Hospital',
                    'Grace Kennett Foundation',
                    'Apollo Speciality Madurai',
                    'Velammal Medical College',
                    'Vadamalayan Hospitals'
                ]
            ],
            [
                'city' => 'Mumbai',
                'state' => 'Maharashtra',
                'district' => 'Mumbai City',
                'lat' => 19.0760,
                'lng' => 72.8777,
                'names' => [
                    'Kokilaben Dhirubhai Ambani',
                    'Lilavati Hospital',
                    'Hinduja National Hospital',
                    'KEM Hospital Parel',
                    'H. N. Reliance Foundation',
                    'Fortis Hiranandani Hospital'
                ]
            ],
            [
                'city' => 'Delhi',
                'state' => 'Delhi',
                'district' => 'New Delhi',
                'lat' => 28.7041,
                'lng' => 77.1025,
                'names' => [
                    'Max Super Speciality',
                    'Fortis Escorts Heart',
                    'Indraprastha Apollo',
                    'Sir Ganga Ram Hospital',
                    'Medanta Medicity',
                    'BLK Max Hospital'
                ]
            ],
            [
                'city' => 'Hyderabad',
                'state' => 'Telangana',
                'district' => 'Hyderabad',
                'lat' => 17.3850,
                'lng' => 78.4867,
                'names' => [
                    'Yashoda Hospitals',
                    'Care Hospitals Nampally',
                    'KIMS Hospitals',
                    'Continental Hospitals',
                    'Apollo Jubilee Hills',
                    'Sunshine Hospitals'
                ]
            ],
            [
                'city' => 'Pune',
                'state' => 'Maharashtra',
                'district' => 'Pune',
                'lat' => 18.5204,
                'lng' => 73.8567,
                'names' => [
                    'Ruby Hall Clinic',
                    'Jehangir Hospital',
                    'Sahyadri Super Speciality',
                    'Noble Hospital Hadapsar',
                    'Deenanath Mangeshkar'
                ]
            ],
            [
                'city' => 'Kolkata',
                'state' => 'West Bengal',
                'district' => 'Kolkata',
                'lat' => 22.5726,
                'lng' => 88.3639,
                'names' => [
                    'AMRI Hospitals Salt Lake',
                    'Fortis Anandapur',
                    'Ruby General Hospital',
                    'Woodlands Multispeciality',
                    'Peerless Hospital'
                ]
            ],
            [
                'city' => 'Kochi',
                'state' => 'Kerala',
                'district' => 'Ernakulam',
                'lat' => 9.9312,
                'lng' => 76.2673,
                'names' => [
                    'Aster Medcity Kochi',
                    'Amrita Institute of Medical Sciences',
                    'Lourdes Hospital',
                    'Medical Trust Hospital'
                ]
            ],
            [
                'city' => 'Lucknow',
                'state' => 'Uttar Pradesh',
                'district' => 'Lucknow',
                'lat' => 26.8467,
                'lng' => 80.9462,
                'names' => [
                    'Medanta Lucknow',
                    'Sahara Hospital',
                    'Sanjay Gandhi PGIMS',
                    'Apollo Medics Lucknow'
                ]
            ]
        ];

        $departments = [
            ['Cardiology', 'Trauma', 'Pediatrics'],
            ['Cardiology', 'Neurology', 'Orthopedics', 'General Medicine'],
            ['Trauma', 'Neurology', 'Orthopedics'],
            ['General Medicine', 'Pediatrics'],
            ['Cardiology', 'Trauma'],
            ['Neurology', 'General Medicine', 'Orthopedics']
        ];

        $idx = 0;
        foreach ($cities as $c) {
            foreach ($c['names'] as $nameIndex => $name) {
                // Generate coordinate offsets around the city center coordinates
                // 1 deg is ~111 km. Offsets are within 0.01 to 0.09 deg (approx 1 to 10 km)
                $latOffset = (rand(-9, 9) / 100);
                $lngOffset = (rand(-9, 9) / 100);
                
                // Add specific offsets for Bangalore to test the care speed ranking rules
                if ($c['city'] === 'Bangalore') {
                    if ($name === 'Metro Care Hospital (A)') {
                        $latOffset = 0.0074;
                        $lngOffset = -0.0036;
                    } elseif ($name === 'Apex Healthcare Center (B)') {
                        $latOffset = -0.0166;
                        $lngOffset = -0.0196;
                    } elseif ($name === 'National Trauma Institute (C)') {
                        $latOffset = 0.0274;
                        $lngOffset = 0.0154;
                    } elseif ($name === 'City General Clinic (D)') {
                        $latOffset = 0.0084;
                        $lngOffset = 0.0054;
                    } elseif ($name === 'St. Jude Emergency Center (E)') {
                        $latOffset = -0.0316;
                        $lngOffset = -0.0046;
                    }
                }

                // Dynamic wait times and doctor sizes
                $wait = rand(5, 55);
                $queue = rand(1, 15);
                $doctors = rand(1, 10);
                $icu = rand(1, 15);
                $general = rand(5, 40);
                $emergency = rand(2, 20);

                // Specific properties for Bangalore to preserve the specific triage logic:
                if ($c['city'] === 'Bangalore') {
                    if ($name === 'Metro Care Hospital (A)') {
                        $wait = 45;
                        $queue = 12;
                        $doctors = 2;
                        $icu = 5;
                        $general = 20;
                        $emergency = 8;
                    } elseif ($name === 'Apex Healthcare Center (B)') {
                        $wait = 10; // Lowest wait!
                        $queue = 2;
                        $doctors = 4;
                        $icu = 3;
                        $general = 15;
                        $emergency = 10;
                    } elseif ($name === 'National Trauma Institute (C)') {
                        $wait = 15;
                        $queue = 4;
                        $doctors = 6;
                        $icu = 10;
                        $general = 30;
                        $emergency = 12;
                    } elseif ($name === 'City General Clinic (D)') {
                        $wait = 60;
                        $queue = 15;
                        $doctors = 2;
                        $icu = 0; // Empty ICU beds!
                        $general = 0; // Empty general beds!
                        $emergency = 0;
                    } elseif ($name === 'St. Jude Emergency Center (E)') {
                        $wait = 5;
                        $queue = 1;
                        $doctors = 0; // Out of doctors!
                        $icu = 4;
                        $general = 10;
                        $emergency = 5;
                    }
                }

                $phoneSuffix = sprintf('%04d', rand(100, 9999));
                $email = strtolower(preg_replace('/[^a-zA-Z]/', '', $name)) . '@emergency.in';
                $type = (rand(1, 10) > 3) ? 'Private' : 'Government';
                $emerg247 = (rand(1, 10) > 1) ? true : false;
                $ambul = (rand(1, 10) > 1) ? true : false;

                Hospital::updateOrCreate(
                    ['name' => $name],
                    [
                        'state' => $c['state'],
                        'district' => $c['district'],
                        'city' => $c['city'],
                        'address' => rand(1, 999) . ' Main Road, ' . $c['city'] . ', ' . $c['state'],
                        'latitude' => $c['lat'] + $latOffset,
                        'longitude' => $c['lng'] + $lngOffset,
                        'phone' => '+91-' . rand(80, 99) . '-555-' . $phoneSuffix,
                        'specialties' => $departments[$idx % count($departments)],
                        'available_doctors' => $doctors,
                        'available_icu_beds' => $icu,
                        'available_general_beds' => $general,
                        'emergency_beds' => $emergency,
                        'er_wait_minutes' => $wait,
                        'queue_count' => $queue,
                        'hospital_status' => (rand(1, 100) > 4) ? 'Open' : 'Closed', // 96% open
                        'rating' => round(3.5 + (rand(0, 15) / 10), 1),
                        'email' => $email,
                        'hospital_type' => $type,
                        'emergency_24_7' => $emerg247,
                        'ambulance_available' => $ambul,
                    ]
                );

                $idx++;
            }
        }
    }
}
