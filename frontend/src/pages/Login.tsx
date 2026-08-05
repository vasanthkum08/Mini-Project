import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogIn, HeartPulse, User, Lock, ArrowRight, Eye, EyeOff, Activity } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAdminEmail, setSelectedAdminEmail] = useState('admin1@emergency.com');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all email and password fields.');
      return;
    }

    setLoading(true);
    try {
      const profile = await login({ email, password });
      
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
      setError(
        err.response?.data?.message || 
        'Incorrect email or password. Please verify and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoRole: 'patient' | 'admin' | 'responder', customAdminEmail?: string) => {
    if (demoRole === 'patient') {
      setEmail('patient@emergency.com');
      setPassword('password');
    } else if (demoRole === 'admin') {
      setEmail(customAdminEmail || selectedAdminEmail);
      setPassword('password');
    } else if (demoRole === 'responder') {
      setEmail('responder@emergency.com');
      setPassword('password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-white to-blue-50/60 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased text-slate-800">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-blue-600 text-white items-center justify-center shadow-lg shadow-blue-500/20">
          <HeartPulse className="h-7 w-7 animate-pulse" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">AEIS Healthcare</h2>
          <p className="text-[10px] font-black text-blue-600 block leading-none uppercase tracking-widest mt-1">
            AI Emergency Intelligence System
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white border border-slate-100/80 shadow-2xl rounded-3xl p-8 space-y-6 healthcare-card-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          
          <div className="text-center space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900">Sign In</h3>
            <p className="text-xs text-slate-400 font-semibold">Access your emergency triage workspace</p>
          </div>

          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3 animate-slide-in">
              <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 font-bold leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Email Address</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@healthcare.com"
                  className="w-full pl-10 pr-4 border border-slate-200 bg-slate-50/40 focus:bg-white rounded-xl py-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-xs font-bold text-blue-650 hover:text-blue-700 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 border border-slate-200 bg-slate-50/40 focus:bg-white rounded-xl py-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="h-4 w-4" /> Sign In
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="pt-4 border-t border-slate-100 space-y-3.5">
            <div className="flex items-center justify-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-slate-400" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Quick Portal Sandbox Login</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('patient')}
                className="py-2.5 bg-slate-50 hover:bg-blue-50 text-slate-655 hover:text-blue-700 rounded-xl text-[10px] font-bold border border-slate-200/60 hover:border-blue-200/50 cursor-pointer transition-all duration-200 text-center font-sans"
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="py-2.5 bg-slate-50 hover:bg-blue-50 text-slate-655 hover:text-blue-700 rounded-xl text-[10px] font-bold border border-slate-200/60 hover:border-blue-200/50 cursor-pointer transition-all duration-200 text-center font-sans"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('responder')}
                className="py-2.5 bg-slate-50 hover:bg-blue-50 text-slate-655 hover:text-blue-700 rounded-xl text-[10px] font-bold border border-slate-200/60 hover:border-blue-200/50 cursor-pointer transition-all duration-200 text-center font-sans"
              >
                Responder
              </button>
            </div>

            {/* Admin selector dropdown */}
            <div className="flex flex-col gap-1.5 pt-1.5">
              <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider text-center">Select Admin Hospital Account</label>
              <select
                value={selectedAdminEmail}
                onChange={(e) => {
                  setSelectedAdminEmail(e.target.value);
                  handleQuickLogin('admin', e.target.value);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] font-bold focus:outline-none"
              >
                <option value="admin1@emergency.com">🏢 admin1 (Metro Care Hospital)</option>
                <option value="admin2@emergency.com">🏢 admin2 (Apex Healthcare)</option>
                <option value="admin3@emergency.com">🏢 admin3 (National Trauma)</option>
                <option value="admin4@emergency.com">🏢 admin4 (City General)</option>
                <option value="admin5@emergency.com">🏢 admin5 (St. Jude Emergency)</option>
                <option value="admin6@emergency.com">🏢 admin6 (Apollo Hospital)</option>
                <option value="admin7@emergency.com">🏢 admin7 (Velammal Hospital)</option>
                <option value="admin8@emergency.com">🏢 admin8 (Meenakshi Mission)</option>
                <option value="admin9@emergency.com">🏢 admin9 (Kauvery Hospital)</option>
                <option value="admin10@emergency.com">🏢 admin10 (Govt Rajaji Hospital)</option>
              </select>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500 font-semibold">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-bold transition-colors inline-flex items-center gap-0.5">
                Register here <ArrowRight className="h-3 w-3" />
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
