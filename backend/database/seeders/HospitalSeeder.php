<?php

namespace Database\Seeders;

use App\Models\Hospital;
use Illuminate\Database\Seeder;

class HospitalSeeder extends Seeder
{
    public function run(): void
    {
        $cities = [
            // ── KARNATAKA ─────────────────────────────────────────────────────
            ['city'=>'Bangalore','state'=>'Karnataka','district'=>'Bangalore Urban','lat'=>12.9716,'lng'=>77.5946,
                'names'=>['Metro Care Hospital','Fortis Clinical Care','Columbia Asia Emergency','Manipal Health Center','Sakra World Hospital','Narayana Hrudayalaya','Apollo Hospitals Bangalore','Aster CMI Hebbal','St Johns Medical College','Bowring Hospital'],
                'coords'=>[[12.9790,77.5910],[12.9698,77.7500],[12.9116,77.6389],[12.9591,77.7014],[12.9063,77.5857],[12.8399,77.6770],[12.9933,77.5900],[13.0358,77.5970],[12.9562,77.6010],[12.9780,77.6085]]
            ],
            ['city'=>'Mysore','state'=>'Karnataka','district'=>'Mysuru','lat'=>12.2958,'lng'=>76.6394,
                'names'=>['JSS Hospital Mysore','Apollo BGS Hospitals','Columbia Asia Mysore','Vikram Hospital Mysore'],
                'coords'=>[[12.3214,76.6341],[12.2951,76.6392],[12.2938,76.6482],[12.3102,76.6378]]
            ],
            // ── TAMIL NADU ────────────────────────────────────────────────────
            ['city'=>'Chennai','state'=>'Tamil Nadu','district'=>'Chennai','lat'=>13.0827,'lng'=>80.2707,
                'names'=>['Apollo Emergency Care','Madras Medical Mission','Fortis Malar Hospital','Global Health City','MIOT International','SIMS Hospital','Kauvery Hospital Chennai','Sri Ramachandra Hospital'],
                'coords'=>[[13.0604,80.2496],[13.0850,80.2101],[13.0418,80.2341],[13.0067,80.2206],[12.9815,80.2180],[13.0524,80.2123],[13.0843,80.2705],[13.0334,80.1534]]
            ],
            ['city'=>'Madurai','state'=>'Tamil Nadu','district'=>'Madurai','lat'=>9.9252,'lng'=>78.1198,
                'names'=>['Meenakshi Mission Hospital','Grace Kennett Foundation','Apollo Speciality Madurai','Velammal Medical College','Vadamalayan Hospitals','Kauvery Hospital Madurai','Government Rajaji Hospital','Devadoss Multispeciality'],
                'coords'=>[[9.9195,78.1191],[9.9452,78.1452],[9.9355,78.0945],[9.8812,78.0795],[9.9412,78.1035],[9.9285,78.1285],[9.9165,78.1135],[9.9535,78.0855]]
            ],
            ['city'=>'Coimbatore','state'=>'Tamil Nadu','district'=>'Coimbatore','lat'=>11.0168,'lng'=>76.9558,
                'names'=>['Ganga Hospital Coimbatore','PSG Hospitals','KG Hospital','Sri Ramakrishna Hospital','Kovai Medical Center','Aravind Eye Hospital'],
                'coords'=>[[11.0178,76.9432],[11.0280,76.9400],[11.0120,76.9680],[11.0230,76.9710],[11.0050,76.9390],[11.0168,76.9558]]
            ],
            ['city'=>'Trichy','state'=>'Tamil Nadu','district'=>'Tiruchirappalli','lat'=>10.7905,'lng'=>78.7047,
                'names'=>['Kavery Hospital Trichy','Sri Venkateshwara Hospital','Bharath Hospital Trichy','Apollo Trichy'],
                'coords'=>[[10.7995,78.7050],[10.7820,78.7015],[10.8010,78.6890],[10.7750,78.7200]]
            ],
            ['city'=>'Salem','state'=>'Tamil Nadu','district'=>'Salem','lat'=>11.6643,'lng'=>78.1460,
                'names'=>['Vinayaka Hospital Salem','Salem Government Hospital','Kasturi Hospital'],
                'coords'=>[[11.6700,78.1480],[11.6600,78.1550],[11.6590,78.1370]]
            ],
            // ── MAHARASHTRA ───────────────────────────────────────────────────
            ['city'=>'Mumbai','state'=>'Maharashtra','district'=>'Mumbai City','lat'=>19.0760,'lng'=>72.8777,
                'names'=>['Kokilaben Dhirubhai Ambani','Lilavati Hospital','Hinduja National Hospital','KEM Hospital Parel','H. N. Reliance Foundation','Fortis Hiranandani Hospital'],
                'coords'=>[[19.1136,72.8697],[19.0596,72.8295],[19.0400,72.8400],[18.9985,72.8378],[18.9630,72.8310],[19.2307,72.8567]]
            ],
            ['city'=>'Pune','state'=>'Maharashtra','district'=>'Pune','lat'=>18.5204,'lng'=>73.8567,
                'names'=>['Ruby Hall Clinic','Jehangir Hospital','Sahyadri Super Speciality','Noble Hospital Hadapsar','Deenanath Mangeshkar'],
                'coords'=>[[18.5362,73.8935],[18.5290,73.8740],[18.5074,73.8077],[18.5089,73.9260],[18.5100,73.8250]]
            ],
            ['city'=>'Nagpur','state'=>'Maharashtra','district'=>'Nagpur','lat'=>21.1458,'lng'=>79.0882,
                'names'=>['Wockhardt Hospital Nagpur','Orange City Hospital','Alexis Hospital Nagpur','KIMS Nagpur'],
                'coords'=>[[21.1550,79.0820],[21.1400,79.0950],[21.1600,79.0700],[21.1490,79.0880]]
            ],
            // ── DELHI / NCR ───────────────────────────────────────────────────
            ['city'=>'Delhi','state'=>'Delhi','district'=>'New Delhi','lat'=>28.7041,'lng'=>77.1025,
                'names'=>['Max Super Speciality','Fortis Escorts Heart','Indraprastha Apollo','Sir Ganga Ram Hospital','Medanta Medicity','BLK Max Hospital'],
                'coords'=>[[28.5244,77.2066],[28.5600,77.2800],[28.5676,77.2834],[28.6514,77.1907],[28.4395,77.0423],[28.6600,77.1850]]
            ],
            ['city'=>'Noida','state'=>'Uttar Pradesh','district'=>'Gautam Buddha Nagar','lat'=>28.5355,'lng'=>77.3910,
                'names'=>['Jaypee Hospital Noida','Fortis Hospital Noida','Felix Hospital Noida'],
                'coords'=>[[28.5457,77.3938],[28.5640,77.3760],[28.5200,77.4000]]
            ],
            ['city'=>'Gurgaon','state'=>'Haryana','district'=>'Gurugram','lat'=>28.4595,'lng'=>77.0266,
                'names'=>['Medanta The Medicity','Fortis Memorial Gurgaon','Max Hospital Gurgaon','Artemis Hospital'],
                'coords'=>[[28.4395,77.0423],[28.4515,77.0765],[28.4632,77.0367],[28.4730,77.0820]]
            ],
            // ── RAJASTHAN ─────────────────────────────────────────────────────
            ['city'=>'Jaipur','state'=>'Rajasthan','district'=>'Jaipur','lat'=>26.9124,'lng'=>75.7873,
                'names'=>['Fortis Escorts Jaipur','Narayana Multispeciality Jaipur','SMS Hospital Jaipur','Eternal Hospital','Mahatma Gandhi Hospital Jaipur'],
                'coords'=>[[26.9154,75.7845],[26.8800,75.8200],[26.9000,75.7900],[26.9300,75.8100],[26.8950,75.8050]]
            ],
            ['city'=>'Jodhpur','state'=>'Rajasthan','district'=>'Jodhpur','lat'=>26.2389,'lng'=>73.0243,
                'names'=>['AIIMS Jodhpur','Goyal Hospital Jodhpur','Mathura Das Mathur Hospital'],
                'coords'=>[[26.2557,73.0139],[26.2400,73.0350],[26.2300,73.0280]]
            ],
            ['city'=>'Udaipur','state'=>'Rajasthan','district'=>'Udaipur','lat'=>24.5854,'lng'=>73.7125,
                'names'=>['Geetanjali Medical College Udaipur','Pacific Medical College','Maharana Bhupal Hospital'],
                'coords'=>[[24.5620,73.7100],[24.5900,73.7350],[24.5750,73.7250]]
            ],
            // ── GUJARAT ───────────────────────────────────────────────────────
            ['city'=>'Ahmedabad','state'=>'Gujarat','district'=>'Ahmedabad','lat'=>23.0225,'lng'=>72.5714,
                'names'=>['Apollo Hospital Ahmedabad','Zydus Hospital','SAL Hospital Ahmedabad','UN Mehta Institute','Sterling Hospital'],
                'coords'=>[[23.0395,72.5120],[23.0500,72.5050],[23.0300,72.5700],[23.0280,72.5410],[23.0450,72.5500]]
            ],
            ['city'=>'Surat','state'=>'Gujarat','district'=>'Surat','lat'=>21.1702,'lng'=>72.8311,
                'names'=>['Kiran Hospital Surat','Sahara Hospital Surat','New Civil Hospital Surat'],
                'coords'=>[[21.1900,72.8200],[21.1600,72.8500],[21.2070,72.8425]]
            ],
            ['city'=>'Vadodara','state'=>'Gujarat','district'=>'Vadodara','lat'=>22.3072,'lng'=>73.1812,
                'names'=>['Baroda Medical College','Bhailal Amin Hospital','Kailash Cancer Hospital'],
                'coords'=>[[22.3200,73.1850],[22.3050,73.1900],[22.2900,73.2000]]
            ],
            // ── PUNJAB / CHANDIGARH ───────────────────────────────────────────
            ['city'=>'Chandigarh','state'=>'Punjab','district'=>'Chandigarh','lat'=>30.7333,'lng'=>76.7794,
                'names'=>['PGIMER Chandigarh','Fortis Hospital Mohali','Max Super Speciality Chandigarh','GMCH Chandigarh'],
                'coords'=>[[30.7650,76.7700],[30.7090,76.7150],[30.7300,76.7600],[30.7085,76.7445]]
            ],
            ['city'=>'Ludhiana','state'=>'Punjab','district'=>'Ludhiana','lat'=>30.9010,'lng'=>75.8573,
                'names'=>['CMC Ludhiana','Dayanand Medical College','Fortis Hospital Ludhiana'],
                'coords'=>[[30.9100,75.8490],[30.8950,75.8600],[30.9200,75.8700]]
            ],
            ['city'=>'Amritsar','state'=>'Punjab','district'=>'Amritsar','lat'=>31.6340,'lng'=>74.8723,
                'names'=>['Sri Guru Ram Dass Institute','Ivy Hospital Amritsar','Fortis Escorts Amritsar'],
                'coords'=>[[31.6230,74.8720],[31.6500,74.8850],[31.6100,74.8900]]
            ],
            // ── HARYANA ───────────────────────────────────────────────────────
            ['city'=>'Faridabad','state'=>'Haryana','district'=>'Faridabad','lat'=>28.4089,'lng'=>77.3178,
                'names'=>['Sarvodaya Hospital Faridabad','Metro Heart Institute','Fortis Escorts Faridabad'],
                'coords'=>[[28.4082,77.3025],[28.4100,77.3400],[28.4200,77.3100]]
            ],
            // ── ANDHRA PRADESH ────────────────────────────────────────────────
            ['city'=>'Visakhapatnam','state'=>'Andhra Pradesh','district'=>'Visakhapatnam','lat'=>17.6868,'lng'=>83.2185,
                'names'=>['KIMS Vizag','Seven Hills Hospital Vizag','Apollo Hospital Vizag','Care Hospital Vizag'],
                'coords'=>[[17.7280,83.3360],[17.7200,83.2900],[17.7133,83.3065],[17.7050,83.3020]]
            ],
            ['city'=>'Vijayawada','state'=>'Andhra Pradesh','district'=>'Krishna','lat'=>16.5062,'lng'=>80.6480,
                'names'=>['Andhra Hospitals Vijayawada','Apollo Vijayawada','Ramesh Hospitals','Manipal Hospital Vijayawada'],
                'coords'=>[[16.5100,80.6350],[16.5200,80.6400],[16.4900,80.6700],[16.5050,80.6600]]
            ],
            // ── TELANGANA ─────────────────────────────────────────────────────
            ['city'=>'Hyderabad','state'=>'Telangana','district'=>'Hyderabad','lat'=>17.3850,'lng'=>78.4867,
                'names'=>['Yashoda Hospitals','Care Hospitals Nampally','KIMS Hospitals','Continental Hospitals','Apollo Jubilee Hills','Sunshine Hospitals'],
                'coords'=>[[17.4399,78.4983],[17.3888,78.4700],[17.4441,78.4729],[17.4401,78.3489],[17.4325,78.4073],[17.4849,78.3942]]
            ],
            ['city'=>'Warangal','state'=>'Telangana','district'=>'Warangal','lat'=>17.9784,'lng'=>79.5941,
                'names'=>['MGM Hospital Warangal','Kakatiya Medical College Hospital','Vijaya Hospital Warangal'],
                'coords'=>[[17.9800,79.5980],[17.9720,79.5800],[17.9850,79.6050]]
            ],
            // ── KERALA ────────────────────────────────────────────────────────
            ['city'=>'Kochi','state'=>'Kerala','district'=>'Ernakulam','lat'=>9.9312,'lng'=>76.2673,
                'names'=>['Aster Medcity Kochi','Amrita Institute of Medical Sciences','Lourdes Hospital','Medical Trust Hospital'],
                'coords'=>[[10.0262,76.3125],[10.0350,76.2860],[9.9639,76.2394],[9.9800,76.2900]]
            ],
            ['city'=>'Thiruvananthapuram','state'=>'Kerala','district'=>'Thiruvananthapuram','lat'=>8.5241,'lng'=>76.9366,
                'names'=>['KIMS Health Trivandrum','SUT Hospital','Ananthapuri Hospital','Government Medical College Trivandrum'],
                'coords'=>[[8.5400,76.9150],[8.5180,76.9200],[8.5050,76.9500],[8.5200,76.9430]]
            ],
            ['city'=>'Kozhikode','state'=>'Kerala','district'=>'Kozhikode','lat'=>11.2588,'lng'=>75.7804,
                'names'=>['MIMS Hospital Kozhikode','Baby Memorial Hospital','Aster MIMS Kozhikode'],
                'coords'=>[[11.2600,75.7750],[11.2500,75.7900],[11.2550,75.7680]]
            ],
            // ── WEST BENGAL ───────────────────────────────────────────────────
            ['city'=>'Kolkata','state'=>'West Bengal','district'=>'Kolkata','lat'=>22.5726,'lng'=>88.3639,
                'names'=>['AMRI Hospitals Salt Lake','Fortis Anandapur','Ruby General Hospital','Woodlands Multispeciality','Peerless Hospital'],
                'coords'=>[[22.5804,88.4168],[22.5120,88.3970],[22.5170,88.3640],[22.5300,88.3440],[22.5100,88.3523]]
            ],
            // ── UTTAR PRADESH ─────────────────────────────────────────────────
            ['city'=>'Lucknow','state'=>'Uttar Pradesh','district'=>'Lucknow','lat'=>26.8467,'lng'=>80.9462,
                'names'=>['Medanta Lucknow','Sahara Hospital','Sanjay Gandhi PGIMS','Apollo Medics Lucknow'],
                'coords'=>[[26.8558,80.9925],[26.8505,80.9462],[26.8942,80.9381],[26.8400,80.9100]]
            ],
            ['city'=>'Varanasi','state'=>'Uttar Pradesh','district'=>'Varanasi','lat'=>25.3176,'lng'=>82.9739,
                'names'=>['Heritage Hospital Varanasi','Shubham Hospital','BHU Sir Sunderlal Hospital'],
                'coords'=>[[25.3200,82.9800],[25.3100,82.9700],[25.2700,82.9970]]
            ],
            ['city'=>'Agra','state'=>'Uttar Pradesh','district'=>'Agra','lat'=>27.1767,'lng'=>78.0081,
                'names'=>['Pushpanjali Hospital Agra','Surya Hospital Agra','S N Medical College Agra'],
                'coords'=>[[27.1900,78.0100],[27.1700,78.0200],[27.2200,78.0000]]
            ],
            // ── MADHYA PRADESH ────────────────────────────────────────────────
            ['city'=>'Bhopal','state'=>'Madhya Pradesh','district'=>'Bhopal','lat'=>23.2599,'lng'=>77.4126,
                'names'=>['Bansal Hospital Bhopal','Hamidia Hospital Bhopal','Apollo Hospital Bhopal','Bhopal Memorial Hospital'],
                'coords'=>[[23.2450,77.4300],[23.2600,77.4050],[23.2300,77.4500],[23.2350,77.4150]]
            ],
            ['city'=>'Indore','state'=>'Madhya Pradesh','district'=>'Indore','lat'=>22.7196,'lng'=>75.8577,
                'names'=>['CHL Hospital Indore','Bombay Hospital Indore','Index Medical College','MY Hospital Indore'],
                'coords'=>[[22.7200,75.8600],[22.7100,75.8700],[22.7500,75.9000],[22.7050,75.8800]]
            ],
            // ── BIHAR ─────────────────────────────────────────────────────────
            ['city'=>'Patna','state'=>'Bihar','district'=>'Patna','lat'=>25.6093,'lng'=>85.1376,
                'names'=>['Paras HMRI Hospital Patna','Ruban Memorial Hospital','PMCH Patna','Apollo Clinic Patna'],
                'coords'=>[[25.6150,85.1440],[25.6000,85.1200],[25.6100,85.1500],[25.6200,85.1350]]
            ],
            // ── JHARKHAND ─────────────────────────────────────────────────────
            ['city'=>'Ranchi','state'=>'Jharkhand','district'=>'Ranchi','lat'=>23.3441,'lng'=>85.3096,
                'names'=>['RIMS Ranchi','Medanta Hospital Ranchi','Rajendra Institute of Medical Sciences'],
                'coords'=>[[23.3350,85.3200],[23.3500,85.3000],[23.3300,85.3150]]
            ],
            // ── ODISHA ────────────────────────────────────────────────────────
            ['city'=>'Bhubaneswar','state'=>'Odisha','district'=>'Bhubaneswar','lat'=>20.2961,'lng'=>85.8245,
                'names'=>['Apollo Hospital Bhubaneswar','AIIMS Bhubaneswar','Capital Hospital Bhubaneswar','KIMS Hospital Bhubaneswar'],
                'coords'=>[[20.3000,85.8150],[20.2500,85.7800],[20.2700,85.8300],[20.3100,85.8400]]
            ],
            // ── ASSAM / NORTHEAST ─────────────────────────────────────────────
            ['city'=>'Guwahati','state'=>'Assam','district'=>'Kamrup','lat'=>26.1445,'lng'=>91.7362,
                'names'=>['GNRC Hospital Guwahati','Narayana Hospital Guwahati','GMCH Guwahati','Nemcare Hospital'],
                'coords'=>[[26.1400,91.7200],[26.1500,91.7500],[26.1900,91.7720],[26.1350,91.7100]]
            ],
            // ── GOA ───────────────────────────────────────────────────────────
            ['city'=>'Panaji','state'=>'Goa','district'=>'North Goa','lat'=>15.4909,'lng'=>73.8278,
                'names'=>['Goa Medical College','Apollo Victor Hospital','Manipal Hospital Goa','Healthway Hospital Goa'],
                'coords'=>[[15.4600,73.8300],[15.5390,73.9120],[15.5250,73.8600],[15.4700,73.8100]]
            ],
            // ── HIMACHAL PRADESH ─────────────────────────────────────────────
            ['city'=>'Shimla','state'=>'Himachal Pradesh','district'=>'Shimla','lat'=>31.1048,'lng'=>77.1734,
                'names'=>['Indira Gandhi Medical College Shimla','DDU Hospital Shimla','IGMC Shimla'],
                'coords'=>[[31.1050,77.1680],[31.1100,77.1800],[31.0980,77.1650]]
            ],
            // ── UTTARAKHAND ───────────────────────────────────────────────────
            ['city'=>'Dehradun','state'=>'Uttarakhand','district'=>'Dehradun','lat'=>30.3165,'lng'=>78.0322,
                'names'=>['Max Hospital Dehradun','Synapse Hospital','AIIMS Rishikesh','Doon Hospital'],
                'coords'=>[[30.3200,78.0500],[30.3100,78.0100],[30.1041,78.2854],[30.3150,78.0350]]
            ],
            // ── CHHATTISGARH ─────────────────────────────────────────────────
            ['city'=>'Raipur','state'=>'Chhattisgarh','district'=>'Raipur','lat'=>21.2514,'lng'=>81.6296,
                'names'=>['AIIMS Raipur','Ramkrishna Care Hospital','Apollo BSR Hospital Raipur'],
                'coords'=>[[21.2100,81.6200],[21.2600,81.6400],[21.2300,81.6350]]
            ],
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
                // Use explicit coordinates if provided, otherwise generate random offsets
                if (isset($c['coords'][$nameIndex])) {
                    $finalLat = $c['coords'][$nameIndex][0];
                    $finalLng = $c['coords'][$nameIndex][1];
                } else {
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
                    $finalLat = $c['lat'] + $latOffset;
                    $finalLng = $c['lng'] + $lngOffset;
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
                        'latitude' => $finalLat,
                        'longitude' => $finalLng,
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
