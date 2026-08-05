<?php

namespace App\Http\Controllers;

use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AIAnalysisController extends Controller
{
    /**
     * Analyze patient symptoms and return diagnosis.
     */
    public function analyze(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'symptoms' => 'required|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Symptoms text is required.',
                'errors' => $validator->errors()
            ], 422);
        }

        $symptomsText = $request->input('symptoms');
        $analysis = GeminiService::analyzeSymptoms($symptomsText);

        return response()->json([
            'success' => true,
            'message' => 'Symptoms evaluated successfully',
            'data' => $analysis
        ]);
    }
}
