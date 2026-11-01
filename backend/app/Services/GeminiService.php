<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GeminiService
{
    /**
     * Analyze patient symptoms and return structured diagnosis.
     */
    public static function analyzeSymptoms($symptomsText)
    {
        $apiKey = env('GEMINI_API_KEY');

        if ($apiKey) {
            try {
                $prompt = "You are a clinical triage AI. Analyze these symptoms: '{$symptomsText}'. " .
                          "Respond ONLY in a raw, valid JSON object with EXACTLY these keys (do not wrap in markdown ```json blocks): " .
                          "{" .
                          "\"emergency_severity\": \"Low|Medium|High\"," .
                          "\"possible_condition\": \"predicted medical condition\"," .
                          "\"recommended_department\": \"department name (e.g. Cardiology, Neurology, Orthopedics, General Medicine, Pediatrics, Trauma)\"," .
                          "\"first_aid\": [\"step 1\", \"step 2\", \"step 3\"]" .
                          "}";

                $response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ]
                ]);

                if ($response->successful()) {
                    $result = $response->json();
                    $text = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    
                    // Clean up markdown wrapping if present
                    $cleaned = trim($text);
                    if (str_starts_with($cleaned, '```')) {
                        $cleaned = preg_replace('/^```(?:json)?|```$/i', '', $cleaned);
                    }
                    $cleaned = trim($cleaned);
                    
                    $decoded = json_decode($cleaned, true);
                    if ($decoded && isset($decoded['emergency_severity'])) {
                        // Keep severity consistent with requested low/medium/high
                        $sev = ucfirst(strtolower($decoded['emergency_severity']));
                        if (!in_array($sev, ['Low', 'Medium', 'High'])) {
                            $sev = 'Medium';
                        }
                        $decoded['emergency_severity'] = $sev;
                        return $decoded;
                    }
                }
            } catch (\Exception $e) {
                \Log::error('Gemini API call failed: ' . $e->getMessage());
            }
        }

        // Rule-Based Enhanced Multilingual Clinical Triage Fallback (English, Tamil & Tanglish)
        $textLower = mb_strtolower($symptomsText, 'UTF-8');
        
        $containsAny = function(array $words) use ($textLower) {
            foreach ($words as $w) {
                if (str_contains($textLower, mb_strtolower($w, 'UTF-8'))) return true;
            }
            return false;
        };

        $possible_condition = 'General Fatigue & Dehydration';
        $emergency_severity = 'Low';
        $triage_level = 'Level 4 - Low (Non-Urgent)';
        $risk_score = 25;
        $recommended_department = 'General Medicine';
        $recommended_tests = ['Complete Blood Count (CBC)', 'Basic Metabolic Panel', 'Serum Electrolytes'];
        $first_aid = [
            'Rest comfortably in a quiet area.',
            'Keep hydrated with oral rehydration fluids.',
            'Consult a primary care physician if symptoms persist.'
        ];
        $voice_summary_en = 'Low severity condition detected. Recommended department is General Medicine. Rest comfortably and stay hydrated.';
        $voice_summary_ta = 'பொதுவான உடல் சோர்வு மற்றும் நீர்ச்சத்து குறைவு கண்டறியப்பட்டுள்ளது. பொது மருத்துவரை அணுகவும். ஓய்வெடுத்து போதுமான தண்ணீர் குடிக்கவும்.';

        // 1. Chest Pain & Heart Attack (English, Tamil & Tanglish)
        if ($containsAny(['chest', 'heart', 'cardiac', 'angina', 'palpitation', 'tightness', 'crushing', 'நெஞ்சு', 'இதயம்', 'மாரடைப்பு', 'படபடப்பு', 'nenju', 'nenjil', 'maradaippu', 'marbadaippu', 'padapadappu'])) {
            $possible_condition = 'Acute Coronary Syndrome / Myocardial Infarction';
            $emergency_severity = 'High';
            $triage_level = 'Level 1 - Critical (Immediate Resuscitation)';
            $risk_score = 92;
            $recommended_department = 'Cardiology';
            $recommended_tests = ['12-Lead Electrocardiogram (ECG)', 'High-Sensitivity Cardiac Troponin-I', 'Echocardiogram', 'Chest X-Ray (PA View)'];
            $first_aid = [
                'Sit upright in a comfortable position to reduce cardiac strain.',
                'Loosen any tight clothing around the neck and chest.',
                'Keep calm and administer sublingual Aspirin if prescribed.'
            ];
            $voice_summary_en = 'Critical High Severity Emergency detected: Possible Heart Attack or Acute Coronary Syndrome. Recommended department: Cardiology. Sit upright, loosen tight clothing, and call emergency services immediately.';
            $voice_summary_ta = 'உயிர் காக்கும் அவசர நிலை கண்டறியப்பட்டுள்ளது: மாரடைப்பு அல்லது கடுமையான நெஞ்சு வலி. பரிந்துரைக்கப்பட்ட துறை: இதயவியல். நோயாளியை அமைதியாக சாய்ந்து உட்கார வைக்கவும், ஆம்புலன்ஸை உடனடியாக அழைக்கவும்.';
        
        // 2. Stroke, Paralysis & Unconsciousness
        } elseif ($containsAny(['stroke', 'numbness', 'paralysis', 'speech', 'slurred', 'unconscious', 'faint', 'blackout', 'collapse', 'பக்கவாதம்', 'மரத்து', 'வாய் கோணல்', 'மயக்கம்', 'சுயநினைவு', 'pakkavatham', 'marathu', 'mayakkam'])) {
            $possible_condition = 'Acute Ischemic Stroke / Cerebrovascular Event';
            $emergency_severity = 'High';
            $triage_level = 'Level 1 - Critical (Immediate Resuscitation)';
            $risk_score = 95;
            $recommended_department = 'Neurology';
            $recommended_tests = ['Non-Contrast CT Brain', 'MRI Brain Stroke Protocol', 'Carotid Doppler Ultrasound', 'Blood Glucose Check'];
            $first_aid = [
                'Lay the patient flat with their head elevated at 30 degrees.',
                'Do not give anything by mouth (risk of aspiration).',
                'Note exact time of symptom onset for thrombolytic window.'
            ];
            $voice_summary_en = 'Critical High Severity Emergency detected: Possible Stroke or Neurological Event. Recommended department: Neurology. Keep head elevated, do not give water or food, reach hospital immediately.';
            $voice_summary_ta = 'அதி தீவிர நரம்பியல் அவசர நிலை கண்டறியப்பட்டுள்ளது: பக்கவாதம் அல்லது சுயநினைவின்மை. பரிந்துரைக்கப்பட்ட துறை: நரம்பியல். தலையை சற்று உயர்த்தி படுக்க வைக்கவும், வாயில் எதுவும் கொடுக்க வேண்டாம்.';

        // 3. Respiratory & Breathing Trouble
        } elseif ($containsAny(['breath', 'asthma', 'suffocation', 'wheez', 'chok', 'airway', 'dyspnea', 'மூச்சு', 'திணறல்', 'சுவாசம்', 'அடைப்பு', 'moochu', 'thinaral'])) {
            $possible_condition = 'Acute Respiratory Distress / Severe Bronchospasm';
            $emergency_severity = 'High';
            $triage_level = 'Level 2 - High (Emergency Care)';
            $risk_score = 88;
            $recommended_department = 'General Medicine';
            $recommended_tests = ['Arterial Blood Gas (ABG)', 'Pulse Oximetry Monitor', 'Chest X-Ray (PA View)', 'Peak Expiratory Flow'];
            $first_aid = [
                'Assist patient into a high Fowler (upright sitting) position.',
                'Administer supplemental oxygen or prescribed bronchodilator inhaler.',
                'Ensure well-ventilated, calm environment.'
            ];
            $voice_summary_en = 'High Severity Emergency: Acute Respiratory Distress. Recommended department: Pulmonology or Emergency Medicine. Sit upright and use prescribed inhaler or oxygen.';
            $voice_summary_ta = 'தீவிர சுவாச அவசர நிலை: கடுமையான மூச்சுத் திணறல். பரிந்துரைக்கப்பட்ட துறை: சுவாசவியல் அல்லது பொது மருத்துவம். நேராக உட்கார வைத்து நன்கு காற்றோட்டமான இடத்தில் வைக்கவும்.';

        // 4. Accidents, Poly-Trauma & Fractures
        } elseif ($containsAny(['accident', 'fracture', 'bone', 'injury', 'trauma', 'crash', 'collision', 'broken', 'fall', 'bike', 'car', 'விபத்து', 'எலும்பு', 'முறிவு', 'காயம்', 'vibathu', 'vabathu', 'elumbu', 'murivu', 'odinju'])) {
            $possible_condition = 'Severe Skeletal Trauma / Complex Fracture';
            $emergency_severity = 'Medium';
            $triage_level = 'Level 2 - High (Emergency Care)';
            $risk_score = 78;
            $recommended_department = 'Orthopedics';
            $recommended_tests = ['Digital Radiography (X-Ray AP/Lateral)', 'CT 3D Trauma Reconstruction', 'Hemoglobin & Hematocrit Level'];
            $first_aid = [
                'Immobilize the affected limb using rigid splints.',
                'Apply ice wrapped in cloth to reduce swelling.',
                'Elevate injured extremity above heart level if no spinal trauma.'
            ];
            $voice_summary_en = 'Urgent Orthopedic Trauma condition detected: Possible Bone Fracture or Accident Injury. Recommended department: Orthopedics or Trauma. Do not move injured limb.';
            $voice_summary_ta = 'விபத்து அல்லது எலும்பு முறிவு காயம் கண்டறியப்பட்டுள்ளது. பரிந்துரைக்கப்பட்ட துறை: எலும்பியல் அல்லது அவசர சிகிச்சை பிரிவு. பாதிக்கப்பட்ட கையை அல்லது காலை அசைக்காமல் வையுங்கள்.';

        // 5. Active Bleeding & Wounds
        } elseif ($containsAny(['bleed', 'hemorrhage', 'cut', 'blood', 'wound', 'laceration', 'ரத்தம்', 'இரத்தம்', 'வெட்டு', 'ratham', 'iratham'])) {
            $possible_condition = 'Acute Laceration / Arterial Hemorrhagic Bleeding';
            $emergency_severity = 'Medium';
            $triage_level = 'Level 2 - High (Emergency Care)';
            $risk_score = 82;
            $recommended_department = 'Trauma';
            $recommended_tests = ['Coagulation Profile (PT/INR)', 'Complete Blood Count', 'Blood Typing & Crossmatch'];
            $first_aid = [
                'Apply firm, direct pressure to the wound with sterile gauze.',
                'Elevate bleeding site above heart level.',
                'Apply pressure dressing once hemorrhage slows.'
            ];
            $voice_summary_en = 'Urgent Bleeding condition detected: Acute Laceration. Recommended department: Trauma Surgery. Apply continuous direct pressure with clean cloth.';
            $voice_summary_ta = 'அதிக ரத்தப்போக்கு அல்லது ஆழமான வெட்டுக்காயம் கண்டறியப்பட்டுள்ளது. பரிந்துரைக்கப்பட்ட துறை: அவசர சிகிச்சை. காயத்தின் மீது சுத்தமான துணியை வைத்து அழுத்தமாகப் பிடிக்கவும்.';

        // 6. Thermal Burns & Fire
        } elseif ($containsAny(['burn', 'fire', 'scald', 'acid', 'thee', 'theekayam', 'தீக்காயம்', 'தீ', 'வெந்து'])) {
            $possible_condition = 'Thermal Burns (Partial/Full Thickness)';
            $emergency_severity = 'Medium';
            $triage_level = 'Level 3 - Moderate (Urgent Care)';
            $risk_score = 70;
            $recommended_department = 'Trauma';
            $recommended_tests = ['Serum Electrolyte Panel', 'Carboxyhemoglobin Assessment', 'Wound Culture'];
            $first_aid = [
                'Cool burn site immediately under cool running water for 15 mins.',
                'Avoid applying ice, ointments, or home remedies.',
                'Cover loosely with dry, sterile non-adherent dressing.'
            ];
            $voice_summary_en = 'Thermal Burn injury detected. Recommended department: Plastic & Burn Surgery. Cool under running water immediately for 15 minutes.';
            $voice_summary_ta = 'தீக்காயம் அல்லது கொதிநீர் காயம் கண்டறியப்பட்டுள்ளது. பரிந்துரைக்கப்பட்ட துறை: தீக்காய பிரிவு. எரியும் பகுதியில் 15 நிமிடங்கள் குளிர்ந்த ஓடும் நீரை ஊற்றவும்.';

        // 7. Snake Bites & Toxic Venom
        } elseif ($containsAny(['snake', 'bite', 'venom', 'sting', 'scorpion', 'பாம்பு', 'கடி', 'விஷம்', 'தேள்', 'paambu', 'pambu', 'visham', 'kadi'])) {
            $possible_condition = 'Ophitoxemia (Venomous Snake Envenomation)';
            $emergency_severity = 'High';
            $triage_level = 'Level 1 - Critical (Immediate Resuscitation)';
            $risk_score = 96;
            $recommended_department = 'Trauma';
            $recommended_tests = ['Whole Blood Clotting Time (20WBCT)', 'Prothrombin Time (PT)', 'Renal Function Test'];
            $first_aid = [
                'Keep patient still and calm to slow venom circulation.',
                'Immobilize affected bitten limb below heart level.',
                'Avoid incising, sucking, or applying tourniquets to the bite.'
            ];
            $voice_summary_en = 'Critical High Severity Emergency: Venomous Snake Bite. Recommended department: Emergency Trauma. Keep patient completely still, do not cut or tie wound, rush to hospital immediately.';
            $voice_summary_ta = 'உயிர் காக்கும் அவசர நிலை: பாம்பு அல்லது விஷக்கடி. பரிந்துரைக்கப்பட்ட துறை: அவசர நச்சுமுறிவு பிரிவு. நோயாளியை முற்றிலும் அசையாமல் வைக்கவும், உடனடியாக மருத்துவமனைக்கு செல்லவும்.';

        // 8. Pregnancy & Active Labor
        } elseif ($containsAny(['pregnancy', 'labor', 'delivery', 'contraction', 'maternity', 'பிரசவம்', 'கர்ப்பம்', 'பிரசவ வலி', 'prasavam', 'garbham', 'prasava vali'])) {
            $possible_condition = 'Obstetric Emergency / Active Labor Contractions';
            $emergency_severity = 'High';
            $triage_level = 'Level 1 - Critical (Immediate Resuscitation)';
            $risk_score = 90;
            $recommended_department = 'Maternity';
            $recommended_tests = ['Cardiotocography (CTG)', 'Obstetric Ultrasound', 'Maternal Complete Blood Count'];
            $first_aid = [
                'Support patient in left lateral tilt position.',
                'Time contraction intervals and monitor for rupture of membranes.',
                'Transport immediately to the nearest maternity hospital.'
            ];
            $voice_summary_en = 'Critical Obstetric Emergency: Active Labor or Pregnancy Complication. Recommended department: Obstetrics & Gynecology. Transport immediately to maternity emergency.';
            $voice_summary_ta = 'மகப்பேறு அவசர நிலை: பிரசவ வலி அல்லது கர்ப்பகால அவசரம். பரிந்துரைக்கப்பட்ட துறை: மகளிர் மற்றும் மகப்பேறு பிரிவு. நோயாளியை இடது பக்கம் திருப்பி படுக்க வைத்து உடனடியாக மருத்துவமனைக்கு அழைத்துச் செல்லவும்.';

        // 9. Food Poisoning & Severe Dehydration
        } elseif ($containsAny(['food poison', 'poison', 'vomit', 'diarrhea', 'gastro', 'stomach', 'belly', 'appendix', 'வாந்தி', 'வயிற்றுப்போக்கு', 'வயிற்று வலி', 'vanthi', 'vayiru vali'])) {
            $possible_condition = 'Acute Gastroenteritis / Dehydration';
            $emergency_severity = 'Medium';
            $triage_level = 'Level 3 - Moderate (Urgent Care)';
            $risk_score = 55;
            $recommended_department = 'General Medicine';
            $recommended_tests = ['Stool Routine & Culture', 'Serum Electrolytes', 'Blood Urea Nitrogen'];
            $first_aid = [
                'Sip Oral Rehydration Salt (ORS) solution continuously.',
                'Avoid solid foods, dairy, and caffeinated beverages.',
                'Monitor for signs of severe dehydration.'
            ];
            $voice_summary_en = 'Gastrointestinal condition detected: Food Poisoning or Severe Vomiting. Recommended department: General Medicine. Sip ORS electrolyte fluids continuously.';
            $voice_summary_ta = 'உணவு நச்சு அல்லது தொடர் வாந்தி மற்றும் வயிற்றுப்போக்கு கண்டறியப்பட்டுள்ளது. பரிந்துரைக்கப்பட்ட துறை: பொது மருத்துவம். ஓ.ஆர்.எஸ் (ORS) கரைசல் அல்லது உப்பு சர்க்கரை கரைசலை சிறிது சிறிதாக குடிக்கவும்.';

        // 10. Fever & Infections
        } elseif ($containsAny(['fever', 'infection', 'flu', 'chills', 'shivering', 'dengue', 'platelet', 'temperature', 'காய்ச்சல்', 'நடுக்கம்', 'டெங்கு', 'kaichal', 'nadukkam'])) {
            $possible_condition = 'Acute Febrile Syndrome / Systemic Viral Infection';
            $emergency_severity = 'Low';
            $triage_level = 'Level 4 - Low (Non-Urgent)';
            $risk_score = 35;
            $recommended_department = 'General Medicine';
            $recommended_tests = ['Complete Blood Count', 'C-Reactive Protein (CRP)', 'Dengue NS1 Antigen Panel'];
            $first_aid = [
                'Apply cool water sponges to forehead and neck.',
                'Administer oral antipyretic (Paracetamol) as guided.',
                'Maintain high fluid intake and bed rest.'
            ];
            $voice_summary_en = 'Febrile condition detected: High Fever or Viral Infection. Recommended department: General Medicine. Take adequate fluids, sponge with cool water, and consult physician.';
            $voice_summary_ta = 'காய்ச்சல் அல்லது வைரஸ் தொற்று கண்டறியப்பட்டுள்ளது. பரிந்துரைக்கப்பட்ட துறை: பொது மருத்துவம். நெற்றியில் குளிர்ந்த நீர் ஒத்தடம் கொடுக்கவும், அதிக தண்ணீர் குடிக்கவும்.';
        }

        return [
            'possible_condition' => $possible_condition,
            'emergency_severity' => $emergency_severity,
            'triage_level' => $triage_level,
            'risk_score' => $risk_score,
            'recommended_department' => $recommended_department,
            'recommended_tests' => $recommended_tests,
            'first_aid' => $first_aid,
            'voice_summary_en' => $voice_summary_en,
            'voice_summary_ta' => $voice_summary_ta,
        ];
    }
}
