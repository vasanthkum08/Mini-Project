import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  HeartPulse, 
  Radio, 
  Activity, 
  Camera, 
  RefreshCw, 
  Compass, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Navigation, 
  PhoneCall, 
  User, 
  Clock, 
  Ambulance, 
  History, 
  CheckCheck, 
  ArrowRight,
  Save
} from 'lucide-react';

interface AssignedCase {
  id: number;
  patient_name: string;
  mobile_number: string;
  symptoms: string;
  priority: string;
  gps_location: string;
  patient_latitude: number;
  patient_longitude: number;
  hospital_name: string;
  hospital_latitude: number;
  hospital_longitude: number;
  ambulance_latitude: number;
  ambulance_longitude: number;
  distance_km: number;
  eta_minutes: number;
  hospital_distance_km: number;
  hospital_eta_minutes: number;
  status: string;
  created_at: string;
}

interface CaseHistoryItem {
  id: number;
  patient_name: string;
  mobile_number: string;
  symptoms: string;
  priority: string;
  gps_location: string;
  hospital_name: string;
  status: string;
  completed_at: string;
}

const ResponderDashboard: React.FC = () => {
  const { user, logout, checkAuth } = useAuth();

  // Profile Edit states
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Responder Data states
  const [responder, setResponder] = useState<any>(null);
  const [assignedCases, setAssignedCases] = useState<AssignedCase[]>([]);
  const [caseHistory, setCaseHistory] = useState<CaseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<number | null>(null);
  const [updatingTelemetry, setUpdatingTelemetry] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Telemetry / Status states
  const [availabilityStatus, setAvailabilityStatus] = useState<string>('Available');
  const [ambulanceStatus, setAmbulanceStatus] = useState<string>('Active');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [resolvingGps, setResolvingGps] = useState(false);
  const [activeTab, setActiveTab] = useState<'dispatch' | 'history'>('dispatch');

  const fetchResponderProfile = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.get('/responder/profile');
      if (res.data.success) {
        const data = res.data.data;
        setResponder(data);
        setAvailabilityStatus(data.availability_status || 'Available');
        setAmbulanceStatus(data.ambulance_status || 'Active');
        setLatitude(data.latitude !== null ? String(data.latitude) : '12.9716');
        setLongitude(data.longitude !== null ? String(data.longitude) : '77.5946');
        setAssignedCases(data.assigned_cases || []);
        setCaseHistory(data.case_history || []);
      }
    } catch (err: any) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to load assigned responder profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditMobile(user.mobile);
      setEditPhoto(user.profile_photo || '');
    }
    fetchResponderProfile();
  }, [user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editMobile.trim()) {
      setProfileError('Name and Mobile number are required.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(editMobile)) {
      setProfileError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setProfileError(null);
    setProfileSuccessMsg(null);
    setUpdatingProfile(true);
    try {
      const res = await api.put('/auth/profile/update', { 
        name: editName, 
        mobile: editMobile,
        profile_photo: editPhoto
      });
      if (res.data.success) {
        await checkAuth();
        setProfileSuccessMsg('Profile updated successfully.');
        setTimeout(() => setProfileSuccessMsg(null), 4000);
        setIsEditingProfile(false);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const firstKey = Object.keys(err.response.data.errors)[0];
        setProfileError(err.response.data.errors[firstKey][0]);
      } else {
        setProfileError(err.response?.data?.message || 'Unable to update profile. Please try again.');
      }
    } finally {
      setUpdatingProfile(false);
    }
  };

  const resolveCurrentGps = () => {
    setResolvingGps(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser client.');
      setResolvingGps(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setResolvingGps(false);
      },
      (err) => {
        console.error(err);
        setError('Location resolution failed. Using current GPS telemetry.');
        setResolvingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // One-click update for ambulance emergency status & save to MySQL immediately
  const handleUpdateStatus = async (status: string, caseId?: number) => {
    setSavingStatus(caseId || 9999);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.put('/responder/status', {
        status,
        case_id: caseId,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      });
      if (res.data.success) {
        const updatedData = res.data.data;
        if (updatedData) {
          setResponder(updatedData);
          setAvailabilityStatus(updatedData.availability_status);
          setAssignedCases(updatedData.assigned_cases || []);
          setCaseHistory(updatedData.case_history || []);
        }
        setSuccessMsg(`Ambulance status updated to "${status}" and saved to MySQL.`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update emergency case status.');
    } finally {
      setSavingStatus(null);
    }
  };

  // Update responder telemetry coordinates
  const handleUpdateTelemetry = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingTelemetry(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.put('/responder/profile', {
        availability_status: availabilityStatus,
        ambulance_status: ambulanceStatus,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      });
      if (res.data.success) {
        const data = res.data.data;
        setResponder(data);
        setAssignedCases(data.assigned_cases || []);
        setCaseHistory(data.case_history || []);
        setSuccessMsg('Telemetry coordinates and availability saved to MySQL successfully.');
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update telemetry settings.');
    } finally {
      setUpdatingTelemetry(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Header Navbar */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm sticky top-0 z-50 px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <HeartPulse className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="text-base font-black text-slate-900 tracking-tight block">AEIS Rescue Console</span>
              <span className="text-[9px] font-black text-emerald-600 block leading-none uppercase tracking-widest">Emergency Responder Terminal</span>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            <div 
              onClick={(e) => { e.preventDefault(); setProfileDropdownOpen(!profileDropdownOpen); }}
              className="flex items-center gap-3 px-3 py-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-2xl cursor-pointer transition-all duration-250 select-none"
            >
              <div className="h-10 w-10 rounded-xl overflow-hidden bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 shadow-inner">
                {user?.profile_photo ? (
                  <img src={user.profile_photo} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-black uppercase">{user?.name?.slice(0, 2)}</span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left text-xs font-bold leading-tight">
                <span className="text-slate-900 font-black">{user?.name}</span>
                <span className="text-[9px] text-emerald-600 font-black uppercase tracking-wider">{user?.role}</span>
              </div>
            </div>

            {/* Profile Dropdown panel */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-14 w-80 bg-white border border-slate-150 shadow-2xl rounded-3xl p-6 z-50 text-slate-800 animate-slide-in space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">User Profile</h4>
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); setProfileDropdownOpen(false); }}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-655 uppercase"
                  >
                    Close
                  </button>
                </div>

                {profileSuccessMsg && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-xl text-center text-[10px] font-bold">
                    {profileSuccessMsg}
                  </div>
                )}
                {profileError && (
                  <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-center text-[10px] font-bold">
                    {profileError}
                  </div>
                )}

                {isEditingProfile ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-3.5 text-left text-xs font-semibold">
                    <div className="flex flex-col items-center gap-2 pb-2">
                      <div className="relative group h-16 w-16 rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-inner cursor-pointer">
                        {editPhoto ? (
                          <img src={editPhoto} alt="edit preview" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-base font-black uppercase">{user?.name?.slice(0, 2)}</span>
                        )}
                        <label className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Camera className="h-4 w-4" />
                          <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                        </label>
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Change Photo</span>
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Full Name</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500" 
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Email Address (Read-only)</label>
                      <input 
                        type="email" 
                        value={user?.email || ''} 
                        readOnly 
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none text-slate-400 cursor-not-allowed" 
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Mobile Number</label>
                      <input 
                        type="text" 
                        value={editMobile}
                        onChange={(e) => setEditMobile(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500" 
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); setIsEditingProfile(false); }}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={updatingProfile}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-md shadow-emerald-500/10"
                      >
                        {updatingProfile ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4 text-left">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 shadow-inner">
                        {user?.profile_photo ? (
                          <img src={user.profile_photo} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-base font-black uppercase">{user?.name?.slice(0, 2)}</span>
                        )}
                      </div>
                      <div className="leading-tight">
                        <h4 className="text-sm font-black text-slate-900">{user?.name}</h4>
                        <span className="text-[9px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-black uppercase tracking-wider inline-block mt-1">
                          {user?.role}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs font-semibold text-slate-600">
                      <div className="border-t border-slate-100 pt-2.5">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Email</span>
                        <span className="text-slate-800">{user?.email}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Mobile Number</span>
                        <span className="text-slate-800">{user?.mobile || 'Not provided'}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); setIsEditingProfile(true); }}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider tracking-widest transition-all shadow-md shadow-emerald-500/10"
                      >
                        Edit Profile
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); logout(); }}
                        className="w-full py-2 bg-slate-50 hover:bg-rose-50 text-slate-655 hover:text-rose-600 border border-slate-200/80 rounded-xl text-[10px] font-black uppercase transition-all"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-8 space-y-8">

        {/* Global Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-28 space-y-4">
            <RefreshCw className="h-10 w-10 text-emerald-600 animate-spin" />
            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Loading Responder Terminal...</p>
          </div>
        )}

        {/* Access Control / Error Box */}
        {!loading && fetchError && (
          <div className="max-w-xl mx-auto mt-12 bg-white border border-slate-150 rounded-3xl p-8 shadow-xl text-center space-y-6 animate-slide-in">
            <div className="h-16 w-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-500 mx-auto">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Access Control Restrictions</h2>
              <p className="text-xs text-slate-550 font-semibold leading-relaxed">{fetchError}</p>
            </div>
            <div>
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); logout(); }}
                className="px-6 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-black text-xs rounded-xl uppercase tracking-wider transition-all"
              >
                Sign Out / Return
              </button>
            </div>
          </div>
        )}

        {!loading && !fetchError && responder && (
          <div className="space-y-8 animate-slide-in">
            
            {/* Alert Message Banner */}
            {successMsg && (
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-2xl flex items-center justify-between shadow-sm animate-slide-in">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <p className="text-xs font-black text-emerald-800">{successMsg}</p>
                </div>
                <button type="button" onClick={() => setSuccessMsg(null)} className="text-emerald-700 font-bold text-xs">✕</button>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-2xl flex items-center justify-between shadow-sm animate-slide-in">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                  <p className="text-xs font-black text-rose-800">{error}</p>
                </div>
                <button type="button" onClick={() => setError(null)} className="text-rose-700 font-bold text-xs">✕</button>
              </div>
            )}

            {/* ── 1. RESPONDER HEADER PROFILE CARD & DASHBOARD STATISTICS ──────── */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden space-y-6">
              
              {/* Header Info Row */}
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 pb-6 border-b border-white/10 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-black tracking-tight">{responder.name}</h1>
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-md font-black text-[9px] uppercase tracking-wider">
                        Responder Officer
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-300 mt-1">
                      <span>📞 {responder.mobile}</span>
                      <span>🏥 {responder.assigned_hospital}</span>
                      <span>🚑 Vehicle: <strong className="text-emerald-400 font-black">{responder.assigned_ambulance}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 border border-white/15 px-4 py-2 rounded-2xl text-center">
                    <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider block">Intake Availability</span>
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${
                      responder.availability_status === 'Available' ? 'bg-emerald-500 text-white' :
                      responder.availability_status === 'Busy' ? 'bg-amber-500 text-white' :
                      'bg-slate-600 text-white'
                    }`}>
                      ● {responder.availability_status}
                    </span>
                  </div>

                  <div className="bg-white/10 border border-white/15 px-4 py-2 rounded-2xl text-center">
                    <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider block">Ambulance Telemetry</span>
                    <span className="text-xs font-black text-emerald-400 block mt-0.5">
                      {responder.ambulance_status} State
                    </span>
                  </div>
                </div>
              </div>

              {/* ── REQUIREMENT 8: DASHBOARD STATISTICS (4 CARDS) ─────────────── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                
                <div className="bg-white/10 border border-white/10 rounded-2xl p-4.5 flex items-center gap-3.5 backdrop-blur-sm">
                  <div className="h-10 w-10 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-xl flex items-center justify-center shrink-0">
                    <Radio className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-300 font-black uppercase tracking-wider block">Active Emergency Cases</span>
                    <span className="text-xl font-black text-white">{responder.stats?.active_cases || assignedCases.length} Active</span>
                  </div>
                </div>

                <div className="bg-white/10 border border-white/10 rounded-2xl p-4.5 flex items-center gap-3.5 backdrop-blur-sm">
                  <div className="h-10 w-10 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-300 font-black uppercase tracking-wider block">Completed Cases Today</span>
                    <span className="text-xl font-black text-emerald-400">{responder.stats?.completed_today || caseHistory.length} Rescues</span>
                  </div>
                </div>

                <div className="bg-white/10 border border-white/10 rounded-2xl p-4.5 flex items-center gap-3.5 backdrop-blur-sm">
                  <div className="h-10 w-10 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-xl flex items-center justify-center shrink-0">
                    <Ambulance className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-300 font-black uppercase tracking-wider block">Assigned Ambulance</span>
                    <span className="text-sm font-black text-white">{responder.assigned_ambulance}</span>
                  </div>
                </div>

                <div className="bg-white/10 border border-white/10 rounded-2xl p-4.5 flex items-center gap-3.5 backdrop-blur-sm">
                  <div className="h-10 w-10 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-300 font-black uppercase tracking-wider block">Avg Response Time</span>
                    <span className="text-xl font-black text-purple-300">{responder.stats?.avg_response_time || '7.5 mins'}</span>
                  </div>
                </div>

              </div>

              <div className="absolute -right-10 -bottom-10 h-64 w-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            {/* ── TABS NAVIGATION (DISPATCH VS CASE HISTORY) ────────────────── */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveTab('dispatch'); }}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'dispatch' 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Activity className="h-4 w-4" /> Active Emergency Requests ({assignedCases.length})
                </button>

                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveTab('history'); }}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'history' 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <History className="h-4 w-4" /> Case History & Activity ({caseHistory.length})
                </button>
              </div>

              <button
                type="button"
                onClick={fetchResponderProfile}
                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <RefreshCw className="h-3.5 w-3.5 text-slate-600" /> Refresh Cases
              </button>
            </div>

            {/* ── TAB 1: ACTIVE EMERGENCY REQUESTS & LIVE GPS TRACKING ───────── */}
            {activeTab === 'dispatch' && (
              <div className="space-y-6">
                {assignedCases.length === 0 ? (
                  <div className="bg-white border border-slate-150 rounded-3xl p-12 text-center space-y-3 shadow-sm">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                    <h3 className="text-base font-black text-slate-800">No active emergency requests</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">No active emergency dispatches currently assigned to your rescue unit in the database.</p>
                  </div>
                ) : (
                  assignedCases.map((c) => (
                    <div key={c.id} className="bg-white border border-slate-150 rounded-3xl p-8 shadow-xl space-y-6 healthcare-card-shadow relative overflow-hidden">
                      
                      {/* Case Header */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-100 shrink-0">
                            <Radio className="h-6 w-6 animate-pulse" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-black text-slate-900">Emergency Dispatch #{c.id}</h3>
                              <span className={`px-2.5 py-0.5 rounded font-black text-[9px] uppercase tracking-wider ${
                                c.priority === 'High' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {c.priority} Priority
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Assigned via AEIS Emergency Triage Engine</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                            State: <strong className="text-emerald-700">{c.status}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Case Details Grid (Requirement 3) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
                        
                        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-1">
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Patient Details</span>
                          <span className="text-slate-900 font-black text-sm block">{c.patient_name}</span>
                          <a href={`tel:${c.mobile_number}`} className="text-emerald-600 font-bold text-xs flex items-center gap-1 hover:underline">
                            <PhoneCall className="h-3 w-3" /> {c.mobile_number}
                          </a>
                        </div>

                        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-1">
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Reported Symptoms</span>
                          <p className="text-slate-800 font-bold text-xs leading-relaxed line-clamp-2">{c.symptoms}</p>
                        </div>

                        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-1">
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Patient Location</span>
                          <p className="text-slate-900 font-bold text-xs leading-tight">{c.gps_location}</p>
                          <span className="text-[9.5px] text-slate-400 block font-mono">Lat: {c.patient_latitude?.toFixed(4)}, Lng: {c.patient_longitude?.toFixed(4)}</span>
                        </div>

                        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-1">
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">AI Recommended Hospital</span>
                          <span className="text-slate-900 font-black text-xs block">{c.hospital_name}</span>
                          <span className="text-emerald-600 font-black text-xs block mt-0.5">
                            📍 {c.distance_km} km • ETA {c.eta_minutes} mins
                          </span>
                        </div>

                      </div>

                      {/* ── REQUIREMENT 4: LIVE GPS TRACKING & ROUTE MAP ─────────────── */}
                      <div className="border border-slate-200/80 rounded-2xl p-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white space-y-4 shadow-inner">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-white/10">
                          <div className="flex items-center gap-2">
                            <Compass className="h-5 w-5 text-emerald-400 animate-spin" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">
                              Live Route Tracking (Ambulance → Patient → Hospital)
                            </h4>
                          </div>

                          <a
                            href={`https://www.google.com/maps/dir/?api=1&origin=${c.ambulance_latitude},${c.ambulance_longitude}&destination=${c.hospital_latitude},${c.hospital_longitude}&waypoints=${c.patient_latitude},${c.patient_longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black rounded-xl flex items-center gap-1.5 shadow-md transition-all self-start sm:self-auto"
                          >
                            <Navigation className="h-3.5 w-3.5" /> Launch Google Maps GPS Navigation
                          </a>
                        </div>

                        {/* Interactive Google Maps Embed Route */}
                        <div className="h-64 w-full rounded-xl overflow-hidden border border-white/10 bg-slate-800 relative shadow-md">
                          <iframe
                            title={`Route Map for Case ${c.id}`}
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            style={{ border: 0, filter: 'contrast(1.05)' }}
                            src={`https://maps.google.com/maps?q=${c.patient_latitude},${c.patient_longitude}&z=14&output=embed`}
                            allowFullScreen
                          ></iframe>
                          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-[10px] font-bold text-slate-200 flex items-center gap-3">
                            <span className="flex items-center gap-1 text-emerald-400">
                              🚑 Ambulance (Lat: {c.ambulance_latitude?.toFixed(3)})
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="flex items-center gap-1 text-rose-400">
                              👤 Patient ({c.distance_km} km)
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="flex items-center gap-1 text-blue-400">
                              🏥 Hospital ({c.hospital_name})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ── REQUIREMENT 5 & 6: ONE-CLICK STATUS STAGE TRANSITION BUTTONS ── */}
                      <div className="space-y-3 pt-2">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          One-Click Status Progress Update (Saved to MySQL Immediately)
                        </span>

                        <div className="flex flex-wrap gap-2">
                          {[
                            'Assigned',
                            'Dispatched',
                            'On The Way',
                            'Reached Patient',
                            'Transporting Patient',
                            'Reached Hospital',
                            'Completed',
                            'Offline'
                          ].map((st) => {
                            const isCurrent = c.status === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                disabled={savingStatus === c.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleUpdateStatus(st, c.id);
                                }}
                                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                  isCurrent
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105 border border-emerald-500'
                                    : st === 'Completed'
                                    ? 'bg-slate-900 hover:bg-black text-emerald-400 border border-emerald-500/40 hover:scale-102'
                                    : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300'
                                }`}
                              >
                                {savingStatus === c.id && isCurrent ? (
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : isCurrent ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                ) : (
                                  <ArrowRight className="h-3 w-3" />
                                )}
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── TAB 2: CASE HISTORY & RECENT ACTIVITY LOG (REQUIREMENT 7 & 9) ── */}
            {activeTab === 'history' && (
              <div className="bg-white border border-slate-150 rounded-3xl p-8 shadow-xl space-y-6 healthcare-card-shadow">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
                    <History className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Completed Rescues & Activity History Log</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Historical records stored in MySQL database</p>
                  </div>
                </div>

                {caseHistory.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs font-bold">
                    No completed case history recorded yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {caseHistory.map((item) => (
                      <div key={item.id} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-emerald-50/20 transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-sm">{item.patient_name}</span>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-black px-2 py-0.5 rounded uppercase">
                              {item.status}
                            </span>
                            <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded uppercase">
                              {item.priority} Priority
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-semibold">
                            📞 {item.mobile_number} • 🏥 {item.hospital_name} • 📍 {item.gps_location}
                          </p>
                          <p className="text-[10.5px] text-slate-400 font-semibold">{item.symptoms}</p>
                        </div>

                        <div className="shrink-0 text-left sm:text-right">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Completed Time</span>
                          <span className="text-xs font-black text-slate-700">{item.completed_at}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── 3. TELEMETRY & AMBULANCE CONTROL FORM ─────────────────────── */}
            <form onSubmit={handleUpdateTelemetry} className="bg-white border border-slate-150 rounded-3xl p-8 shadow-xl space-y-6 healthcare-card-shadow">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
                    <Activity className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Ambulance Telemetry & Location Settings</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Sync responder availability states and GPS coordinates</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingTelemetry}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 cursor-pointer uppercase tracking-wider flex items-center gap-2"
                >
                  {updatingTelemetry ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {updatingTelemetry ? 'Syncing...' : 'Save Telemetry Data'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-bold">
                
                <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5 space-y-3">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Intake Availability</span>
                  <select
                    value={availabilityStatus}
                    onChange={(e) => setAvailabilityStatus(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl p-3 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Available">🟢 Available</option>
                    <option value="Busy">🟡 Busy</option>
                    <option value="Offline">🔴 Offline</option>
                  </select>
                </div>

                <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5 space-y-3">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Ambulance Telemetry State</span>
                  <select
                    value={ambulanceStatus}
                    onChange={(e) => setAmbulanceStatus(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl p-3 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Active">🟢 Active Service</option>
                    <option value="Inactive">🔴 Inactive State</option>
                  </select>
                </div>

                <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">GPS Resolution</span>
                    <button
                      type="button"
                      onClick={resolveCurrentGps}
                      disabled={resolvingGps}
                      className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[9.5px] font-black uppercase flex items-center gap-1"
                    >
                      {resolvingGps ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Compass className="h-3 w-3" />}
                      GPS Snapshot
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="Lat e.g. 12.9716"
                      className="w-full border border-slate-200 bg-white rounded-xl p-2.5 text-xs font-extrabold"
                    />
                    <input
                      type="text"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="Lng e.g. 77.5946"
                      className="w-full border border-slate-200 bg-white rounded-xl p-2.5 text-xs font-extrabold"
                    />
                  </div>
                </div>

              </div>

            </form>

          </div>
        )}

      </main>
    </div>
  );
};

export default ResponderDashboard;
