import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, HeartPulse, User, Mail, Lock, Phone, ArrowLeft, CheckSquare } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { registerUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<'patient' | 'admin' | 'responder'>('patient');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name || !email || !password || !passwordConfirmation || !mobile || !role) {
      setError('Please fill in all form details.');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    // 10-digit mobile check
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const profile = await registerUser({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        mobile,
        role
      });

      // Role-based routing redirect
      if (profile.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (profile.role === 'responder') {
        navigate('/responder-dashboard');
      } else {
        navigate('/patient-dashboard');
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const firstErrKey = Object.keys(err.response.data.errors)[0];
        setError(err.response.data.errors[firstErrKey][0]);
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-white to-blue-50/60 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased text-slate-800">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-blue-600 text-white items-center justify-center shadow-lg shadow-blue-500/20">
          <HeartPulse className="h-7 w-7 animate-pulse" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Account</h2>
          <p className="text-[10px] font-black text-blue-600 block leading-none uppercase tracking-widest mt-1">
            Join AI Emergency Intelligence System
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white border border-slate-100/80 shadow-2xl rounded-3xl p-8 space-y-6 healthcare-card-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>

          <div className="text-center space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900">Get Started</h3>
            <p className="text-xs text-slate-400 font-semibold">Join the emergency triage platform</p>
          </div>
          
          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3 animate-slide-in">
              <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 font-bold leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Full Name</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-4 border border-slate-200 bg-slate-50/40 focus:bg-white rounded-xl py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Email Address</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@healthcare.com"
                  className="w-full pl-10 pr-4 border border-slate-200 bg-slate-50/40 focus:bg-white rounded-xl py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Mobile Number (10-digit)</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-10 pr-4 border border-slate-200 bg-slate-50/40 focus:bg-white rounded-xl py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Role selection */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">System Access Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(['patient', 'admin', 'responder'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-3 px-1 text-center rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                      role === r 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/10 font-black' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/50'
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Password</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 border border-slate-200 bg-slate-50/40 focus:bg-white rounded-xl py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">Confirm Password</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 border border-slate-200 bg-slate-50/40 focus:bg-white rounded-xl py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Register Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4" /> Create Account
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-semibold">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-bold transition-colors inline-flex items-center gap-0.5">
                <ArrowLeft className="h-3 w-3" /> Back to Login
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;
