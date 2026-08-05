<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Create user account (Register)
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'mobile' => 'required|string|unique:users',
            'role' => 'required|string|in:patient,admin,responder',
            'profile_photo' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Map role name to role id
        $roleName = $request->input('role');
        $role = Role::where('name', $roleName)->first();
        $roleId = $role ? $role->id : 1;

        $user = User::create([
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'password' => Hash::make($request->input('password')),
            'mobile' => $request->input('mobile'),
            'role_id' => $roleId,
            'profile_photo' => $request->input('profile_photo')
        ]);

        $token = Auth::guard('api')->login($user);

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'mobile' => $user->mobile,
                    'role' => $user->role,
                    'profile_photo' => $user->profile_photo,
                    'hospital_id' => $user->hospital_id,
                ]
            ]
        ], 201);
    }

    /**
     * Authenticate credentials and issue token (Login)
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        if (!$token = Auth::guard('api')->attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password'
            ], 401);
        }

        $user = Auth::guard('api')->user();

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'mobile' => $user->mobile,
                    'role' => $user->role,
                    'profile_photo' => $user->profile_photo,
                    'hospital_id' => $user->hospital_id,
                ]
            ]
        ]);
    }

    /**
     * Get authenticated user details
     */
    public function me()
    {
        $user = Auth::guard('api')->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mobile' => $user->mobile,
                'role' => $user->role,
                'profile_photo' => $user->profile_photo,
                'hospital_id' => $user->hospital_id,
            ]
        ]);
    }

    /**
     * Terminate session (Logout)
     */
    public function logout()
    {
        Auth::guard('api')->logout();

        return response()->json([
            'success' => true,
            'message' => 'Logout successful'
        ]);
    }

    /**
     * Refresh JWT token
     */
    public function refresh()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'token' => Auth::guard('api')->refresh()
            ]
        ]);
    }

    /**
     * Forgot Password request skeleton
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email format'
            ], 422);
        }

        $user = User::where('email', $request->input('email'))->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No account found with this email address'
            ], 404);
        }

        // Mock token generation for skeleton resets
        return response()->json([
            'success' => true,
            'message' => 'Password reset instructions have been sent to your email.'
        ]);
    }

    /**
     * Reset Password handler skeleton
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string|min:6|confirmed'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->input('email'))->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No account matches this email'
            ], 404);
        }

        $user->password = Hash::make($request->input('password'));
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Your password has been successfully reset'
        ]);
    }

    /**
     * Update user profile settings
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::guard('api')->user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'mobile' => 'required|string|unique:users,mobile,' . $user->id,
            'profile_photo' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->name = $request->input('name');
        $user->mobile = $request->input('mobile');
        if ($request->has('profile_photo')) {
            $user->profile_photo = $request->input('profile_photo');
        }
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mobile' => $user->mobile,
                'role' => $user->role,
                'profile_photo' => $user->profile_photo,
                'hospital_id' => $user->hospital_id,
            ]
        ]);
    }
}
