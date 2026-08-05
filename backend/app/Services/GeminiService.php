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

        // Rule-Based Fallback Simulation
        $textLower = strtolower($symptomsText);
        $possible_condition = 'General Fatigue';
        $emergency_severity = 'Low';
        $recommended_department = 'General Medicine';
        $first_aid = [
            'Rest comfortably in a quiet area.',
            'Keep hydrated with water or fluids.',
            'Consult a doctor if symptoms persist.'
        ];

        if (str_contains($textLower, 'chest pain') || str_contains($textLower, 'heart') || str_contains($textLower, 'cardiac')) {
            $possible_condition = 'Acute Coronary Syndrome (Heart Attack)';
            $emergency_severity = 'High';
            $recommended_department = 'Cardiology';
            $first_aid = [
                'Sit upright in a comfortable position to reduce heart strain.',
                'Loosen any tight clothing around the neck and chest.',
                'Do not perform heavy physical activity. Keep calm.'
            ];
        } elseif (str_contains($textLower, 'stroke') || str_contains($textLower, 'numbness') || str_contains($textLower, 'paralysis') || str_contains($textLower, 'speech')) {
            $possible_condition = 'Ischemic Stroke / Cerebrovascular Event';
            $emergency_severity = 'High';
            $recommended_department = 'Neurology';
            $first_aid = [
                'Lay the patient flat with their head slightly elevated.',
                'Do not give the patient anything to eat or drink (risk of choking).',
                'Note the exact time symptoms first started.'
            ];
        } elseif (str_contains($textLower, 'breath') || str_contains($textLower, 'asthma') || str_contains($textLower, 'suffocation')) {
            $possible_condition = 'Respiratory Distress / Severe Bronchospasm';
            $emergency_severity = 'High';
            $recommended_department = 'General Medicine';
            $first_aid = [
                'Help the patient sit upright to assist lung expansion.',
                'Use prescribed inhalers or bronchodilators if available.',
                'Ensure a flow of fresh air in the room.'
            ];
        } elseif (str_contains($textLower, 'accident') || str_contains($textLower, 'fracture') || str_contains($textLower, 'bone') || str_contains($textLower, 'injury')) {
            $possible_condition = 'Severe Skeletal Trauma / Bone Fracture';
            $emergency_severity = 'Medium';
            $recommended_department = 'Orthopedics';
            $first_aid = [
                'Immobilize the affected limb using splints or supports.',
                'Apply ice wrapped in a cloth to reduce swelling.',
                'Elevate the injured area if possible without causing pain.'
            ];
        } elseif (str_contains($textLower, 'bleed') || str_contains($textLower, 'hemorrhage') || str_contains($textLower, 'cut')) {
            $possible_condition = 'Laceration / Hemorrhagic Bleeding';
            $emergency_severity = 'Medium';
            $recommended_department = 'Trauma';
            $first_aid = [
                'Apply direct pressure to the wound using a clean cloth.',
                'Elevate the bleeding limb above heart level.',
                'Secure a clean bandage over the wound once bleeding slows.'
            ];
        } elseif (str_contains($textLower, 'burn') || str_contains($textLower, 'fire')) {
            $possible_condition = 'Second-Degree Thermal Burns';
            $emergency_severity = 'Medium';
            $recommended_department = 'Trauma';
            $first_aid = [
                'Cool the burn immediately with clean, cool running water for 10-15 minutes.',
                'Do not apply ice, butter, or ointments to the burn.',
                'Cover loosely with a clean, dry, sterile cloth.'
            ];
        } elseif (str_contains($textLower, 'fever') || str_contains($textLower, 'infection') || str_contains($textLower, 'flu')) {
            $possible_condition = 'Acute Febrile Illness / Viral Infection';
            $emergency_severity = 'Low';
            $recommended_department = 'General Medicine';
            $first_aid = [
                'Keep body cool by wiping forehead with a damp cloth.',
                'Take paracetamol or fever reducers as advised.',
                'Rest and monitor temperature hourly.'
            ];
        } elseif (str_contains($textLower, 'snake') || str_contains($textLower, 'bite') || str_contains($textLower, 'venom')) {
            $possible_condition = 'Ophitoxemia (Venomous Snake Bite)';
            $emergency_severity = 'High';
            $recommended_department = 'Trauma';
            $first_aid = [
                'Keep the patient calm and restrict movement to slow venom spread.',
                'Keep the bitten limb below heart level.',
                'Remove rings or tight items near the bite area.'
            ];
        } elseif (str_contains($textLower, 'food') || str_contains($textLower, 'poison') || str_contains($textLower, 'vomit')) {
            $possible_condition = 'Acute Gastroenteritis (Food Poisoning)';
            $emergency_severity = 'Low';
            $recommended_department = 'General Medicine';
            $first_aid = [
                'Sip water, oral rehydration solutions, or clear broths.',
                'Avoid solid foods until vomiting stops.',
                'Avoid dairy products and heavy seasoning.'
            ];
        }

        return [
            'possible_condition' => $possible_condition,
            'emergency_severity' => $emergency_severity,
            'recommended_department' => $recommended_department,
            'first_aid' => $first_aid
        ];
    }
}
