import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { HeartPulse, Radio, Activity, Camera, RefreshCw, Compass, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable parameters states
  const [availabilityStatus, setAvailabilityStatus] = useState<string>('Available');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [ambulanceStatus, setAmbulanceStatus] = useState<string>('Active');
  const [resolvingGps, setResolvingGps] = useState(false);

  const fetchResponder = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.get('/responder/profile');
      if (res.data.success) {
        const data = res.data.data;
        setResponder(data);
        setAvailabilityStatus(data.availability_status);
        setLatitude(data.latitude !== null ? String(data.latitude) : '');
        setLongitude(data.longitude !== null ? String(data.longitude) : '');
        setAmbulanceStatus(data.ambulance_status);
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
    fetchResponder();
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
        setError('Location resolution failed. Please verify browser coordinates access rights.');
        setResolvingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.put('/responder/profile', {
        availability_status: availabilityStatus,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        ambulance_status: ambulanceStatus,
      });
      if (res.data.success) {
        setResponder(res.data.data);
        setSuccessMsg('Responder status and GPS coordinates updated successfully.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update responder profile.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Header Navbar */}
      <nav className="bg-white/85 backdrop-blur-md border-b border-slate-100/80 shadow-sm sticky top-0 z-50 px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <HeartPulse className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="text-base font-black text-slate-900 tracking-tight block">AEIS Responder Terminal</span>
              <span className="text-[9px] font-black text-emerald-600 block leading-none uppercase tracking-widest">Rescue Operations Desk</span>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            <div 
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-3 px-3 py-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-2xl cursor-pointer transition-all duration-250 select-none"
            >
              <div className="h-10 w-10 rounded-xl overflow-hidden bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
                {user?.profile_photo ? (
                  <img src={user.profile_photo} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-black uppercase">{user?.name?.slice(0, 2)}</span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left text-xs font-bold leading-tight">
                <span className="text-slate-900 font-black">{user?.name}</span>
                <span className="text-[9px] text-emerald-655 font-black uppercase tracking-wider">{user?.role}</span>
              </div>
            </div>

            {/* Profile Dropdown panel */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-14 w-80 bg-white border border-slate-150 shadow-2xl rounded-3xl p-6 z-50 text-slate-800 animate-slide-in space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">User Profile</h4>
                  <button 
                    onClick={() => setProfileDropdownOpen(false)}
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
                      <div className="relative group h-16 w-16 rounded-2xl overflow-hidden bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-inner cursor-pointer">
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500" 
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500" 
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button 
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
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
                      <div className="h-14 w-14 rounded-2xl overflow-hidden bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
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
                        onClick={() => setIsEditingProfile(true)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider tracking-widest transition-all shadow-md shadow-emerald-500/10"
                      >
                        Edit Profile
                      </button>
                      <button 
                        onClick={logout}
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

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-8">
        
        {/* Loading Indicator */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <RefreshCw className="h-10 w-10 text-emerald-650 animate-spin" />
            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Loading Responder Console...</p>
          </div>
        )}

        {/* Error/No assigned data message */}
        {!loading && fetchError && (
          <div className="max-w-xl mx-auto mt-12 bg-white border border-slate-150 rounded-3xl p-8 shadow-xl text-center space-y-6 animate-slide-in">
            <div className="h-16 w-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-500 mx-auto">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Access Control Restrictions</h2>
              <p className="text-xs text-slate-550 font-semibold leading-relaxed">
                {fetchError}
              </p>
            </div>
            <div className="pt-2">
              <button 
                onClick={logout}
                className="px-6 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-black text-xs rounded-xl uppercase tracking-wider transition-all"
              >
                Sign Out / Return
              </button>
            </div>
          </div>
        )}

        {/* Operational Dashboard Panel */}
        {!loading && !fetchError && responder && (
          <div className="space-y-8 animate-slide-in">
            
            {/* Header / Info Panel */}
            <div className="bg-gradient-to-tr from-emerald-600 to-emerald-700 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between gap-6 items-start">
              <div className="relative z-10 space-y-4 max-w-xl">
                <span className="px-2.5 py-0.5 bg-white/15 border border-white/20 text-white rounded-full font-black text-[9px] uppercase tracking-widest inline-block">
                  Responder Account Linked
                </span>
                <div>
                  <h1 className="text-2xl font-black tracking-tight leading-tight">{responder.name}</h1>
                  <div className="flex items-center gap-1.5 text-emerald-100 text-xs font-semibold mt-1">
                    <span className="font-extrabold uppercase tracking-wide">Mobile:</span>
                    <span>{responder.mobile}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs font-bold pt-1">
                  <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 flex flex-col">
                    <span className="text-[8px] text-emerald-200 uppercase tracking-wider block">Assigned Vehicle</span>
                    <span className="text-xs font-black mt-0.5">{responder.assigned_ambulance}</span>
                  </div>

                  <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 flex flex-col">
                    <span className="text-[8px] text-emerald-200 uppercase tracking-wider block">Stationed Hospital</span>
                    <span className="text-xs font-black mt-0.5">{responder.assigned_hospital}</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex flex-row md:flex-col gap-4 items-end justify-between shrink-0 w-full md:w-auto border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
                <div className="bg-white/10 border border-white/15 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[120px]">
                  <span className="text-[9px] text-emerald-200 font-bold uppercase tracking-wider">Current Status</span>
                  <span className={`text-sm font-black px-3 py-1 rounded-lg uppercase tracking-wider mt-1.5 border ${
                    responder.availability_status === 'Available' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400' :
                    responder.availability_status === 'Busy' ? 'bg-amber-500/20 text-amber-100 border-amber-400' :
                    'bg-slate-500/20 text-slate-300 border-slate-400'
                  }`}>
                    {responder.availability_status}
                  </span>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 skew-x-12 transform origin-bottom-right"></div>
            </div>

            {/* Live Operational updates form */}
            <form onSubmit={handleUpdateProfile} className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xl space-y-8 healthcare-card-shadow">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
                    <Activity className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-805 uppercase tracking-tight">Rescue Variables Panel</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Control dispatcher availability states and telemetry coordinates</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={fetchResponder}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
                    title="Refresh current DB stats"
                  >
                    <RefreshCw className="h-4 w-4 text-slate-500" />
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 cursor-pointer uppercase tracking-wider flex items-center gap-2"
                  >
                    {saving ? 'Syncing...' : 'Save Live Status'}
                  </button>
                </div>
              </div>

              {/* Status Alert Banners */}
              {successMsg && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-2xl flex items-center gap-3 animate-slide-in">
                  <CheckCircle2 className="h-5.5 w-5.5 text-emerald-600 shrink-0" />
                  <p className="text-xs font-black text-emerald-800">{successMsg}</p>
                </div>
              )}

              {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-2xl flex items-center gap-3 animate-slide-in">
                  <AlertCircle className="h-5.5 w-5.5 text-rose-500 shrink-0" />
                  <p className="text-xs font-black text-rose-800">{error}</p>
                </div>
              )}

              {/* Responder Variables grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold">
                
                {/* 1. Availability Status */}
                <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Intake Availability</span>
                    <Radio className="h-4.5 w-4.5 text-emerald-600" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1.5">Availability Status</label>
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
                </div>

                {/* 2. Ambulance Status */}
                <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Ambulance State</span>
                    <Activity className="h-4.5 w-4.5 text-emerald-600" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1.5">Assigned Ambulance Status</label>
                    <select
                      value={ambulanceStatus}
                      onChange={(e) => setAmbulanceStatus(e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-xl p-3 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="Active">🟢 Active / Active Service</option>
                      <option value="Inactive">🔴 Inactive / Inactive State</option>
                    </select>
                  </div>
                </div>

                {/* 3. GPS Coordinates Location */}
                <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5 space-y-3 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Telemetry Geolocation</span>
                    <button
                      type="button"
                      onClick={resolveCurrentGps}
                      disabled={resolvingGps}
                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-250 rounded-lg flex items-center gap-1.5 transition-all font-black text-[10px] uppercase shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {resolvingGps ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" /> Resolving GPS...
                        </>
                      ) : (
                        <>
                          <Compass className="h-3 w-3" /> Fetch Current Location
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Latitude</label>
                      <input
                        type="text"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="e.g. 12.9716"
                        className="w-full border border-slate-200 bg-white rounded-xl p-3 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Longitude</label>
                      <input
                        type="text"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="e.g. 77.5946"
                        className="w-full border border-slate-200 bg-white rounded-xl p-3 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        required
                      />
                    </div>
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
