import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ShieldAlert, CheckCircle, Mail, ArrowLeft, Send, HeartPulse } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setMessage(res.data.message || 'Password reset instructions have been sent.');
      } else {
        throw new Error(res.data.message);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Unable to process password reset request. Please check email address and try again.'
      );
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
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Reset Password</h2>
          <p className="text-[10px] font-black text-blue-600 block leading-none uppercase tracking-widest mt-1">
            AI Emergency Intelligence System
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white border border-slate-100/80 shadow-2xl rounded-3xl p-8 space-y-6 healthcare-card-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>

          <div className="text-center space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900">Forgot Password?</h3>
            <p className="text-xs text-slate-400 font-semibold">We will send verification instructions</p>
          </div>
          
          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3 animate-slide-in">
              <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 font-bold leading-relaxed">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-start gap-3 animate-slide-in">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700 font-bold leading-relaxed">{message}</p>
            </div>
          )}

          {!message ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                Provide your registered account email address. We will verify credentials and send password reset links.
              </p>
              
              {/* Email Input */}
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
                    className="w-full pl-10 pr-4 border border-slate-200 bg-slate-50/40 focus:bg-white rounded-xl py-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send Instructions Link
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 pt-2">
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Please check your inbox. If registered, instructions should appear shortly.
              </p>
              <Link
                to="/login"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-colors shadow-lg shadow-blue-500/10"
              >
                Return to Login
              </Link>
            </div>
          )}

          <div className="text-center pt-2 border-t border-slate-100">
            <Link to="/login" className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer">
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
