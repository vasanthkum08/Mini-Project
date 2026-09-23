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

        // Rule-Based Enhanced Clinical Triage Fallback
        $textLower = strtolower($symptomsText);
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

        if (str_contains($textLower, 'chest pain') || str_contains($textLower, 'heart') || str_contains($textLower, 'cardiac')) {
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
        } elseif (str_contains($textLower, 'stroke') || str_contains($textLower, 'numbness') || str_contains($textLower, 'paralysis') || str_contains($textLower, 'speech')) {
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
        } elseif (str_contains($textLower, 'breath') || str_contains($textLower, 'asthma') || str_contains($textLower, 'suffocation')) {
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
        } elseif (str_contains($textLower, 'accident') || str_contains($textLower, 'fracture') || str_contains($textLower, 'bone') || str_contains($textLower, 'injury')) {
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
        } elseif (str_contains($textLower, 'bleed') || str_contains($textLower, 'hemorrhage') || str_contains($textLower, 'cut')) {
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
        } elseif (str_contains($textLower, 'burn') || str_contains($textLower, 'fire')) {
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
        } elseif (str_contains($textLower, 'fever') || str_contains($textLower, 'infection') || str_contains($textLower, 'flu')) {
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
        } elseif (str_contains($textLower, 'snake') || str_contains($textLower, 'bite') || str_contains($textLower, 'venom')) {
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
        } elseif (str_contains($textLower, 'food') || str_contains($textLower, 'poison') || str_contains($textLower, 'vomit')) {
            $possible_condition = 'Acute Gastroenteritis (Toxic Food Contamination)';
            $emergency_severity = 'Low';
            $triage_level = 'Level 4 - Low (Non-Urgent)';
            $risk_score = 40;
            $recommended_department = 'General Medicine';
            $recommended_tests = ['Stool Routine & Culture', 'Serum Electrolytes', 'Blood Urea Nitrogen'];
            $first_aid = [
                'Sip Oral Rehydration Salt (ORS) solution continuously.',
                'Avoid solid foods, dairy, and caffeinated beverages.',
                'Monitor for signs of severe dehydration.'
            ];
        }

        return [
            'possible_condition' => $possible_condition,
            'emergency_severity' => $emergency_severity,
            'triage_level' => $triage_level,
            'risk_score' => $risk_score,
            'recommended_department' => $recommended_department,
            'recommended_tests' => $recommended_tests,
            'first_aid' => $first_aid
        ];
    }
}
