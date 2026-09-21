import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ShieldAlert,
  LogIn,
  HeartPulse,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Activity,
  Zap,
  Navigation,
  Ambulance,
  Sparkles,
  Building2,
  UserCheck,
  Stethoscope,
} from "lucide-react";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAdminEmail, setSelectedAdminEmail] = useState(
    "admin1@emergency.com",
  );
  const [selectedResponderEmail, setSelectedResponderEmail] = useState(
    "responder@emergency.com",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all email and password fields.");
      return;
    }

    setLoading(true);
    try {
      const profile = await login({ email, password });

      // Role-based routing redirect
      if (profile.role === "admin") {
        navigate("/admin-dashboard");
      } else if (profile.role === "responder") {
        navigate("/responder-dashboard");
      } else {
        navigate("/patient-dashboard");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Incorrect email or password. Please verify and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (
    demoRole: "patient" | "admin" | "responder",
    customEmail?: string,
  ) => {
    if (demoRole === "patient") {
      setEmail("patient@emergency.com");
      setPassword("password");
    } else if (demoRole === "admin") {
      setEmail(customEmail || selectedAdminEmail);
      setPassword("password");
    } else if (demoRole === "responder") {
      setEmail(customEmail || selectedResponderEmail);
      setPassword("password");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans antialiased text-slate-800 selection:bg-blue-500 selection:text-white">
      {/* ── SPLIT SCREEN CONTAINER ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-screen w-full overflow-hidden">
        {/* ── LEFT HERO PANEL (Desktop Brand Showcase & Visuals) ───────────── */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-[#0B1536] to-[#1E3A8A] text-white p-12 flex-col justify-between relative overflow-hidden border-r border-blue-900/40">
          {/* Ambient Glows */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-400/30">
                <HeartPulse className="h-7 w-7 animate-pulse text-white" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight block text-white">
                  AEIS Healthcare
                </span>
                <span className="text-[10px] font-black text-cyan-300 block leading-none uppercase tracking-widest">
                  AI Emergency Intelligence System
                </span>
              </div>
            </div>

            <div className="space-y-3 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-cyan-300 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Phase 2
                Intelligence Ready
              </span>
              <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight">
                Rapid Emergency Triage & Real-Time Hospital Navigation
              </h1>
              <p className="text-xs xl:text-sm text-slate-300 font-semibold leading-relaxed">
                Empowering patients, emergency responders, and hospital
                administrators with AI-driven symptom analysis, live GPS
                routing, and instant ER bed tracking.
              </p>
            </div>
          </div>

          {/* Middle Hero Visual Showcase Image */}
          <div className="relative z-10 my-6">
            <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-slate-900/60 backdrop-blur-md group">
              <img
                src="/healthcare_login_hero.jpg"
                alt="AEIS AI Emergency Intelligence Showcase"
                className="w-full h-64 xl:h-72 object-cover object-center transform group-hover:scale-105 transition-transform duration-700 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

              {/* Floating Overlay Stats Badges */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 text-white">
                <div className="bg-slate-900/80 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-2xl flex items-center gap-2.5 shadow-lg">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">
                      AI Speed
                    </span>
                    <span className="text-xs font-black text-white">
                      &lt; 1.2s Response
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-2xl flex items-center gap-2.5 shadow-lg">
                  <div className="h-8 w-8 rounded-xl bg-blue-500/20 border border-blue-500/40 text-cyan-300 flex items-center justify-center">
                    <Navigation className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">
                      Haversine GPS
                    </span>
                    <span className="text-xs font-black text-white">
                      Live Distance &amp; ETA
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-2xl flex items-center gap-2.5 shadow-lg">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                    <Ambulance className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">
                      Network
                    </span>
                    <span className="text-xs font-black text-white">
                      50+ Hospitals
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Feature List */}
          <div className="relative z-10 border-t border-white/10 pt-4 grid grid-cols-3 gap-3 text-xs font-bold text-slate-300">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>Patient Self-Triage</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Hospital Admin Desk</span>
            </div>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Paramedic Dispatch</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT AUTH FORM PANEL (Healthcare Clean Light Theme) ─────────── */}
        <div className="flex-1 bg-slate-50/90 flex flex-col justify-center items-center p-6 sm:p-12 relative">
          {/* Subtle Mobile Top Header */}
          <div className="lg:hidden mb-8 text-center space-y-2">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-blue-600 text-white items-center justify-center shadow-xl shadow-blue-500/20">
              <HeartPulse className="h-7 w-7 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                AEIS Healthcare
              </h2>
              <p className="text-[10px] font-black text-blue-600 block leading-none uppercase tracking-widest mt-1">
                AI Emergency Intelligence System
              </p>
            </div>
          </div>

          {/* Login Card Container */}
          <div className="w-full max-w-md bg-white border border-slate-200/80 shadow-2xl rounded-3xl p-8 sm:p-10 space-y-6 relative overflow-hidden">
            {/* Top Accent Line (Blue with subtle Red Emergency Highlight) */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-red-500" />

            {/* Form Title Header */}
            <div className="space-y-1 text-left">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Sign In
                </h2>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[9px] font-black uppercase tracking-wider">
                  Secure Access
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold">
                Access your AEIS healthcare emergency portal
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-2xl flex items-start gap-3 animate-slide-in shadow-sm">
                <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-rose-900 uppercase">
                    Authentication Error
                  </h4>
                  <p className="text-xs text-rose-700 font-bold leading-relaxed">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative rounded-2xl shadow-sm group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@healthcare.com"
                    className="w-full pl-11 pr-4 border border-slate-200 bg-slate-50/50 focus:bg-white rounded-2xl py-3.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative rounded-2xl shadow-sm group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 border border-slate-200 bg-slate-50/50 focus:bg-white rounded-2xl py-3.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4.5 w-4.5" />
                    ) : (
                      <Eye className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-black rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:translate-y-[-1px] active:translate-y-[0px] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="h-4.5 w-4.5" /> Sign In to Workspace
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Options */}
            <div className="pt-5 border-t border-slate-150 space-y-3.5">
              <div className="flex items-center justify-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-blue-600" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Quick Portal Sandbox Login
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("patient")}
                  className="py-2.5 bg-slate-50 hover:bg-blue-50/80 text-slate-700 hover:text-blue-700 rounded-xl text-[10px] font-black border border-slate-200/80 hover:border-blue-200 transition-all duration-200 text-center cursor-pointer shadow-2xs"
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("admin")}
                  className="py-2.5 bg-slate-50 hover:bg-blue-50/80 text-slate-700 hover:text-blue-700 rounded-xl text-[10px] font-black border border-slate-200/80 hover:border-blue-200 transition-all duration-200 text-center cursor-pointer shadow-2xs"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("responder")}
                  className="py-2.5 bg-slate-50 hover:bg-blue-50/80 text-slate-700 hover:text-blue-700 rounded-xl text-[10px] font-black border border-slate-200/80 hover:border-blue-200 transition-all duration-200 text-center cursor-pointer shadow-2xs"
                >
                  Responder
                </button>
              </div>

              {/* Admin Hospital Account Dropdown */}
              <div className="flex flex-col gap-1.5 pt-1 text-left">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider text-center">
                  Select Admin Hospital Account
                </label>
                <select
                  value={selectedAdminEmail}
                  onChange={(e) => {
                    setSelectedAdminEmail(e.target.value);
                    handleQuickLogin("admin", e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-2.5 text-[11px] font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="admin1@emergency.com">
                    🏢 admin1 (Metro Care Hospital)
                  </option>
                  <option value="admin2@emergency.com">
                    🏢 admin2 (Apex Healthcare)
                  </option>
                  <option value="admin3@emergency.com">
                    🏢 admin3 (National Trauma)
                  </option>
                  <option value="admin4@emergency.com">
                    🏢 admin4 (City General)
                  </option>
                  <option value="admin5@emergency.com">
                    🏢 admin5 (St. Jude Emergency)
                  </option>
                  <option value="admin6@emergency.com">
                    🏢 admin6 (Apollo Hospital)
                  </option>
                  <option value="admin7@emergency.com">
                    🏢 admin7 (Velammal Hospital)
                  </option>
                  <option value="admin8@emergency.com">
                    🏢 admin8 (Meenakshi Mission)
                  </option>
                  <option value="admin9@emergency.com">
                    🏢 admin9 (Kauvery Hospital)
                  </option>
                  <option value="admin10@emergency.com">
                    🏢 admin10 (Bowring Hospital)
                  </option>
                  <option value="admin187@emergency.com">
                    🏢 admin187 (Apollo Hospital – Madurai)
                  </option>
                  <option value="admin188@emergency.com">
                    🏢 admin188 (Meenakshi Mission – Madurai)
                  </option>
                  <option value="admin189@emergency.com">
                    🏢 admin189 (Velammal Medical College – Madurai)
                  </option>
                  <option value="admin190@emergency.com">
                    🏢 admin190 (Vadamalayan Hospital – Madurai)
                  </option>
                  <option value="admin191@emergency.com">
                    🏢 admin191 (Devadoss Multispeciality – Madurai)
                  </option>
                </select>
              </div>

              {/* Responder Rescue Unit Dropdown */}
              <div className="flex flex-col gap-1.5 pt-1 text-left">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider text-center">
                  Select Responder Rescue Unit Account
                </label>
                <select
                  value={selectedResponderEmail}
                  onChange={(e) => {
                    setSelectedResponderEmail(e.target.value);
                    handleQuickLogin("responder", e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-2.5 text-[11px] font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="responder@emergency.com">
                    🚑 Responder A - Officer Jane (Metro Care Hospital, Bangalore - KA-01-ME-9876)
                  </option>
                  <option value="responder2@emergency.com">
                    🚑 Responder B - Officer Vijay (Velammal Hospital, Madurai - TN-59-AM-1108)
                  </option>
                </select>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500 font-semibold">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-blue-600 hover:text-blue-700 font-black transition-colors inline-flex items-center gap-0.5 hover:underline"
                >
                  Register here <ArrowRight className="h-3 w-3" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
