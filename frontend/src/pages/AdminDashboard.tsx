import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  HeartPulse,
  Users,
  Bed,
  Clock,
  RefreshCw,
  Activity,
  Camera,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Phone,
  ShieldCheck,
  Star,
  BarChart3,
  TrendingUp,
  PieChart,
  Layers
} from "lucide-react";

const AdminDashboard: React.FC = () => {
  const { user, logout, checkAuth } = useAuth();

  // Profile dropdown & edit states
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(
    null,
  );
  const [profileError, setProfileError] = useState<string | null>(null);

  // Hospital states
  const [hospital, setHospital] = useState<any>(null);
  const [allHospitals, setAllHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states & Phase 4 Analytics states
  const [activeTab, setActiveTab] = useState<'capacity' | 'analytics'>('capacity');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [availableDoctors, setAvailableDoctors] = useState<number>(0);
  const [availableIcuBeds, setAvailableIcuBeds] = useState<number>(0);
  const [availableGeneralBeds, setAvailableGeneralBeds] = useState<number>(0);
  const [emergencyBeds, setEmergencyBeds] = useState<number>(0);
  const [erWaitMinutes, setErWaitMinutes] = useState<number>(0);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [ambulanceAvailable, setAmbulanceAvailable] = useState<boolean>(true);

  const fetchAnalytics = async (selectedId?: number) => {
    try {
      const url = selectedId ? `/admin/analytics?hospital_id=${selectedId}` : '/admin/analytics';
      const res = await api.get(url);
      if (res.data.success) {
        setAnalyticsData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const fetchHospital = async (selectedId?: number) => {
    setLoading(true);
    setFetchError(null);
    try {
      const url = selectedId
        ? `/admin/hospital?hospital_id=${selectedId}`
        : "/admin/hospital";
      const res = await api.get(url);
      if (res.data.success) {
        const data = res.data.data;
        setHospital(data);
        setAvailableDoctors(data.available_doctors);
        setAvailableIcuBeds(data.available_icu_beds);
        setAvailableGeneralBeds(data.available_general_beds);
        setEmergencyBeds(data.emergency_beds);
        setErWaitMinutes(data.er_wait_minutes);
        setQueueCount(data.queue_count);
        setAmbulanceAvailable(!!data.ambulance_available);
        if (res.data.all_hospitals) {
          setAllHospitals(res.data.all_hospitals);
        }
        fetchAnalytics(data.id);
      }
    } catch (err: any) {
      console.error(err);
      setFetchError(
        err.response?.data?.message ||
          "Failed to load assigned hospital operational data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditMobile(user.mobile);
      setEditPhoto(user.profile_photo || "");
    }
    fetchHospital();
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
      setProfileError("Name and Mobile number are required.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(editMobile)) {
      setProfileError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    setProfileError(null);
    setProfileSuccessMsg(null);
    setUpdatingProfile(true);
    try {
      const res = await api.put("/auth/profile/update", {
        name: editName,
        mobile: editMobile,
        profile_photo: editPhoto,
      });
      if (res.data.success) {
        await checkAuth();
        setProfileSuccessMsg("Profile updated successfully.");
        setIsEditingProfile(false);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.errors) {
        const firstErrKey = Object.keys(err.response.data.errors)[0];
        setProfileError(err.response.data.errors[firstErrKey][0]);
      } else {
        setProfileError(
          err.response?.data?.message ||
            "Unable to update profile. Please try again.",
        );
      }
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.put("/admin/hospital", {
        hospital_id: hospital?.id,
        available_doctors: availableDoctors,
        available_icu_beds: availableIcuBeds,
        available_general_beds: availableGeneralBeds,
        emergency_beds: emergencyBeds,
        er_wait_minutes: erWaitMinutes,
        queue_count: queueCount,
        ambulance_available: ambulanceAvailable,
      });
      if (res.data.success) {
        setHospital(res.data.data);
        setSuccessMsg(
          `Operational details for ${res.data.data.name} updated successfully.`,
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to save operational changes.",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      {/* Header Navbar - Dark Navy background */}
      <nav className="bg-[#1E3A8A] border-b border-blue-900 shadow-md sticky top-0 z-50 px-8 py-4 text-white">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white text-[#1E3A8A] flex items-center justify-center shadow-md">
              <HeartPulse className="h-6 w-6 text-[#2563EB] animate-pulse" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight block">
                AEIS Operations Console
              </span>
              <span className="text-[9px] font-black text-cyan-300 block leading-none uppercase tracking-widest">
                Administrator Portal Desk
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {allHospitals.length > 0 && (
              <div className="flex items-center gap-2 bg-blue-900/60 px-3 py-1.5 rounded-xl border border-blue-700/80">
                <span className="text-[10px] font-black text-cyan-200 uppercase hidden md:inline">
                  Hospital:
                </span>
                <select
                  value={hospital?.id || ""}
                  onChange={(e) => fetchHospital(Number(e.target.value))}
                  className="bg-[#1E3A8A] text-white text-xs font-bold rounded-lg p-1.5 border border-blue-500 focus:outline-none cursor-pointer"
                >
                  {allHospitals.map((h: any) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-3 px-3 py-1.5 hover:bg-blue-800/50 rounded-2xl cursor-pointer transition-all duration-250 select-none border border-transparent hover:border-blue-700"
            >
              <div className="h-10 w-10 rounded-xl overflow-hidden bg-white border border-blue-100 flex items-center justify-center text-blue-900 shrink-0 shadow-inner">
                {user?.profile_photo ? (
                  <img
                    src={user.profile_photo}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-black uppercase text-[#1E3A8A]">
                    {user?.name?.slice(0, 2)}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left text-xs font-bold leading-tight">
                <span className="font-black text-white">{user?.name}</span>
                <span className="text-[9px] text-cyan-300 font-black uppercase tracking-wider">
                  {user?.role}
                </span>
              </div>
            </div>

            {/* Profile Dropdown panel */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-14 w-80 bg-white border border-slate-150 shadow-2xl rounded-3xl p-6 z-50 text-slate-800 animate-slide-in space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#1E3A8A]">
                    User Profile
                  </h4>
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
                  <form
                    onSubmit={handleProfileUpdate}
                    className="space-y-3.5 text-left text-xs font-semibold"
                  >
                    <div className="flex flex-col items-center gap-2 pb-2">
                      <div className="relative group h-16 w-16 rounded-2xl overflow-hidden bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-inner cursor-pointer">
                        {editPhoto ? (
                          <img
                            src={editPhoto}
                            alt="edit preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-base font-black uppercase">
                            {user?.name?.slice(0, 2)}
                          </span>
                        )}
                        <label className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Camera className="h-4 w-4" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">
                        Change Photo
                      </span>
                    </div>

                    <div>
                      <label className="block text-[9px] text-[#1E3A8A] font-black uppercase mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">
                        Email Address (Read-only)
                      </label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        readOnly
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none text-slate-400 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] text-[#1E3A8A] font-black uppercase mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="text"
                        value={editMobile}
                        onChange={(e) => setEditMobile(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-[#2563EB]"
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
                        className="flex-1 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-md shadow-blue-500/10"
                      >
                        {updatingProfile ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4 text-left">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-2xl overflow-hidden bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
                        {user?.profile_photo ? (
                          <img
                            src={user.profile_photo}
                            alt={user.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-base font-black uppercase">
                            {user?.name?.slice(0, 2)}
                          </span>
                        )}
                      </div>
                      <div className="leading-tight">
                        <h4 className="text-sm font-black text-slate-900">
                          {user?.name}
                        </h4>
                        <span className="text-[9px] px-2 py-0.5 bg-blue-50 text-[#2563EB] rounded-md font-black uppercase tracking-wider inline-block mt-1">
                          {user?.role}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs font-semibold text-slate-655">
                      <div className="border-t border-slate-100 pt-2.5">
                        <span className="text-[9px] text-[#1E3A8A] font-black block uppercase mb-0.5">
                          Email Address
                        </span>
                        <span className="text-slate-800">{user?.email}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#1E3A8A] font-black block uppercase mb-0.5">
                          Mobile Number
                        </span>
                        <span className="text-slate-800">
                          {user?.mobile || "Not provided"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="w-full py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-blue-500/10"
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
            <RefreshCw className="h-10 w-10 text-[#2563EB] animate-spin" />
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Loading Hospital Console...
            </p>
          </div>
        )}

        {/* Error/No assigned data message */}
        {!loading && fetchError && (
          <div className="max-w-xl mx-auto mt-12 bg-white border border-slate-150 rounded-3xl p-8 shadow-xl text-center space-y-6 animate-slide-in">
            <div className="h-16 w-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-500 mx-auto">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Access Control Restrictions
              </h2>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
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
        {!loading && !fetchError && hospital && (
          <div className="space-y-8 animate-slide-in">
            {/* CLEAN PROFESSIONAL HOSPITAL HEADER (replacing purple banner) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm relative overflow-hidden flex flex-col lg:flex-row justify-between gap-6 items-start">
              <div className="space-y-4 max-w-2xl relative z-10">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="px-3 py-1 bg-blue-50 border border-blue-100 text-[#2563EB] rounded-lg font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> AEIS Connected Node
                  </span>
                  <span className="px-3 py-1 bg-cyan-50 border border-cyan-150 text-cyan-700 rounded-lg font-black text-[9px] uppercase tracking-wider">
                    {hospital.hospital_type || "Private"} Facility
                  </span>
                  {hospital.emergency_24_7 && (
                    <span className="px-3 py-1 bg-emerald-50 border border-emerald-150 text-emerald-700 rounded-lg font-black text-[9px] uppercase tracking-wider animate-pulse">
                      🔴 24/7 ER Service
                    </span>
                  )}
                </div>

                <div>
                  <h1 className="text-2xl font-black text-[#1E3A8A] tracking-tight leading-none mb-2">
                    {hospital.name}
                  </h1>
                  <div className="flex items-start gap-1.5 text-slate-500 text-xs font-semibold">
                    <MapPin className="h-4.5 w-4.5 shrink-0 text-[#2563EB] mt-0.5" />
                    <span>
                      {hospital.address}, {hospital.city}, {hospital.district},{" "}
                      {hospital.state}
                    </span>
                  </div>
                </div>

                {/* Specialty Departments list */}
                <div className="space-y-1">
                  <span className="text-[9px] text-[#1E3A8A] font-black uppercase tracking-widest block">
                    Active Specializations
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {Array.isArray(hospital.specialties) ? (
                      hospital.specialties.map((dep: string) => (
                        <span
                          key={dep}
                          className="px-2.5 py-0.5 bg-slate-50 text-slate-700 text-[10px] font-bold rounded-md border border-slate-200 uppercase tracking-wide"
                        >
                          {dep.trim()}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 font-bold">
                        General Emergency Care
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Verified status & contact info card */}
              <div className="flex flex-row sm:flex-col gap-4 items-end justify-between shrink-0 w-full lg:w-auto border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0 relative z-10">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[140px] text-center">
                  <span className="text-[9px] text-slate-450 font-black uppercase tracking-wider">
                    AEIS Live Rating
                  </span>
                  <span className="text-2xl font-black text-amber-500 mt-1 flex items-center justify-center gap-1">
                    ★ {hospital.rating || "4.0"}
                  </span>
                  <div className="flex gap-0.5 text-amber-400 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                </div>
                <div className="text-right text-[10.5px] text-slate-655 font-bold leading-tight">
                  <p className="flex items-center justify-end gap-1">
                    <Users className="h-3.5 w-3.5 text-[#2563EB]" /> Admin:{" "}
                    {user?.name}
                  </p>
                  <p className="flex items-center justify-end gap-1 mt-1 text-[#2563EB]">
                    <Phone className="h-3.5 w-3.5 text-[#2563EB]" /> Hotline:{" "}
                    {hospital.phone || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* ── TABS NAVIGATION (CAPACITY VS PHASE 4 ANALYTICS) ────────── */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveTab('capacity'); }}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'capacity' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Activity className="h-4 w-4" /> Live Capacity & Operational Telemetry
                </button>

                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveTab('analytics'); }}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'analytics' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" /> Performance & Case Analytics
                </button>
              </div>

              <button
                type="button"
                onClick={() => { fetchHospital(hospital?.id); fetchAnalytics(hospital?.id); }}
                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <RefreshCw className="h-3.5 w-3.5 text-slate-600" /> Refresh Telemetry
              </button>
            </div>

            {activeTab === 'capacity' && (
              <div className="space-y-8">
            {/* LIVE OPERATIONAL MONITOR STATISTICS CARD */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
              <h3 className="text-xs font-black text-[#1E3A8A] uppercase tracking-widest border-b border-slate-100 pb-2.5">
                Live Operations Real-Time Telemetry
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Doctors status - Green for active resources */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">
                      ER Care Team
                    </span>
                    <Users className="h-4.5 w-4.5 text-[#2563EB]" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 block">
                      {availableDoctors} Available
                    </span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${availableDoctors > 0 ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-pulse"}`}
                      />
                      <span
                        className={`text-[10px] font-black uppercase ${availableDoctors > 0 ? "text-emerald-700" : "text-rose-700"}`}
                      >
                        {availableDoctors > 0
                          ? "On-Call Operations Active"
                          : "No Doctors Available"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ICU Beds Status - Colored status */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">
                      ICU Beds Vacancy
                    </span>
                    <Bed className="h-4.5 w-4.5 text-[#2563EB]" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 block">
                      {availableIcuBeds} Vacant
                    </span>
                    {/* Capacity Indicator Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3">
                      <div
                        className={`h-full transition-all duration-500 ${
                          availableIcuBeds === 0
                            ? "bg-rose-600"
                            : availableIcuBeds < 3
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${Math.min(100, (availableIcuBeds / 15) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[8px] text-slate-400 font-bold block uppercase mt-1">
                      Estimated ICU Max Limit: 15
                    </span>
                  </div>
                </div>

                {/* ER Intake Wait - Orange for warnings, Red for critical alerts */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">
                      Avg ER Intake Wait
                    </span>
                    <Clock className="h-4.5 w-4.5 text-[#2563EB]" />
                  </div>
                  <div>
                    <span
                      className={`text-2xl font-black block ${
                        erWaitMinutes > 45
                          ? "text-rose-600"
                          : erWaitMinutes > 20
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      {erWaitMinutes} Minutes
                    </span>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          erWaitMinutes > 45
                            ? "bg-rose-500"
                            : erWaitMinutes > 20
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                      />
                      <span
                        className={`text-[10px] font-black uppercase ${
                          erWaitMinutes > 45
                            ? "text-rose-700"
                            : erWaitMinutes > 20
                              ? "text-amber-700"
                              : "text-emerald-700"
                        }`}
                      >
                        {erWaitMinutes > 45
                          ? "Critical Intake Delay"
                          : erWaitMinutes > 20
                            ? "Moderate Wait Queue"
                            : "Speed Choice Optimal"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Queue Count */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">
                      Queue size
                    </span>
                    <Activity className="h-4.5 w-4.5 text-[#2563EB]" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 block">
                      {queueCount} Patients
                    </span>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3">
                      <div
                        className={`h-full transition-all duration-500 ${
                          queueCount > 10
                            ? "bg-rose-600"
                            : queueCount > 5
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${Math.min(100, (queueCount / 20) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[8px] text-slate-400 font-bold block uppercase mt-1">
                      Live Ambulance Queue: {queueCount} in line
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE OPERATIONAL UPDATES FORM */}
            <form
              onSubmit={handleUpdateHospital}
              className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-150">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-50 text-[#2563EB] rounded-2xl flex items-center justify-center border border-blue-100">
                    <Activity className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1E3A8A] uppercase tracking-tight">
                      Operational Variables Editor
                    </h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">
                      Edit live metrics that directly influence the AI hospital
                      sorting engine
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => fetchHospital()}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
                    title="Refresh current DB stats"
                  >
                    <RefreshCw className="h-4 w-4 text-slate-500" />
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 cursor-pointer uppercase tracking-wider flex items-center gap-2"
                  >
                    {saving ? "Syncing..." : "Save Live Status"}
                  </button>
                </div>
              </div>

              {/* Status Alert Banners */}
              {successMsg && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-2xl flex items-center gap-3 animate-slide-in">
                  <CheckCircle2 className="h-5.5 w-5.5 text-emerald-600 shrink-0" />
                  <p className="text-xs font-black text-emerald-800">
                    {successMsg}
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-2xl flex items-center gap-3 animate-slide-in">
                  <AlertCircle className="h-5.5 w-5.5 text-rose-500 shrink-0" />
                  <p className="text-xs font-black text-rose-800">{error}</p>
                </div>
              )}

              {/* Operational Variables inputs layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-bold">
                {/* 1. Available Doctors */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                  <label className="block text-[10px] text-[#1E3A8A] font-black uppercase tracking-wider">
                    Available Doctors
                  </label>
                  <p className="text-[10px] text-slate-400 font-semibold mb-2">
                    ER Care Team available now
                  </p>
                  <input
                    type="number"
                    value={availableDoctors}
                    onChange={(e) =>
                      setAvailableDoctors(parseInt(e.target.value) || 0)
                    }
                    min="0"
                    className="w-full border border-slate-200 bg-white rounded-xl p-3 text-xs font-black focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25"
                    required
                  />
                </div>

                {/* 2. ER Waiting Time */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                  <label className="block text-[10px] text-[#1E3A8A] font-black uppercase tracking-wider">
                    Estimated Waiting Time
                  </label>
                  <p className="text-[10px] text-slate-400 font-semibold mb-2">
                    Average ER wait duration (Minutes)
                  </p>
                  <input
                    type="number"
                    value={erWaitMinutes}
                    onChange={(e) =>
                      setErWaitMinutes(parseInt(e.target.value) || 0)
                    }
                    min="0"
                    className="w-full border border-slate-200 bg-white rounded-xl p-3 text-xs font-black focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25"
                    required
                  />
                </div>

                {/* 3. Queue Count */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                  <label className="block text-[10px] text-[#1E3A8A] font-black uppercase tracking-wider">
                    Queue Count
                  </label>
                  <p className="text-[10px] text-slate-400 font-semibold mb-2">
                    Number of patients currently in line
                  </p>
                  <input
                    type="number"
                    value={queueCount}
                    onChange={(e) =>
                      setQueueCount(parseInt(e.target.value) || 0)
                    }
                    min="0"
                    className="w-full border border-slate-200 bg-white rounded-xl p-3 text-xs font-black focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25"
                    required
                  />
                </div>

                {/* 4. ICU Beds */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                  <label className="block text-[10px] text-[#1E3A8A] font-black uppercase tracking-wider">
                    Available ICU Beds
                  </label>
                  <p className="text-[10px] text-slate-400 font-semibold mb-2">
                    Vacant critical ICU beds
                  </p>
                  <input
                    type="number"
                    value={availableIcuBeds}
                    onChange={(e) =>
                      setAvailableIcuBeds(parseInt(e.target.value) || 0)
                    }
                    min="0"
                    className="w-full border border-slate-200 bg-white rounded-xl p-3 text-xs font-black focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25"
                    required
                  />
                </div>

                {/* 5. General Beds */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                  <label className="block text-[10px] text-[#1E3A8A] font-black uppercase tracking-wider">
                    Available General Beds
                  </label>
                  <p className="text-[10px] text-slate-400 font-semibold mb-2">
                    Vacant general ward beds
                  </p>
                  <input
                    type="number"
                    value={availableGeneralBeds}
                    onChange={(e) =>
                      setAvailableGeneralBeds(parseInt(e.target.value) || 0)
                    }
                    min="0"
                    className="w-full border border-slate-200 bg-white rounded-xl p-3 text-xs font-black focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25"
                    required
                  />
                </div>

                {/* 6. Emergency Beds */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                  <label className="block text-[10px] text-[#1E3A8A] font-black uppercase tracking-wider">
                    Available Emergency Beds
                  </label>
                  <p className="text-[10px] text-slate-400 font-semibold mb-2">
                    Vacant emergency intake beds
                  </p>
                  <input
                    type="number"
                    value={emergencyBeds}
                    onChange={(e) =>
                      setEmergencyBeds(parseInt(e.target.value) || 0)
                    }
                    min="0"
                    className="w-full border border-slate-200 bg-white rounded-xl p-3 text-xs font-black focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25"
                    required
                  />
                </div>

                {/* 7. Ambulance Service Toggle */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 md:col-span-3">
                  <label className="block text-[10px] text-[#1E3A8A] font-black uppercase tracking-wider mb-1">
                    Ambulance Availability
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-xl">
                    <span className="text-slate-500 font-semibold text-xs">
                      Are dispatchable ambulances currently active for AEIS
                      routes?
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAmbulanceAvailable(true)}
                        className={`px-4 py-2 text-xs font-black rounded-lg cursor-pointer transition-all border ${
                          ambulanceAvailable
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                      >
                        Yes, Available
                      </button>
                      <button
                        type="button"
                        onClick={() => setAmbulanceAvailable(false)}
                        className={`px-4 py-2 text-xs font-black rounded-lg cursor-pointer transition-all border ${
                          !ambulanceAvailable
                            ? "bg-rose-50 text-rose-700 border-rose-300 shadow-sm"
                            : "bg-slate-50 text-slate-550 border-slate-200"
                        }`}
                      >
                        No, Unavailable
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
            </div>
            )}

            {/* ── PERFORMANCE & EMERGENCY CASE ANALYTICS TAB VIEW ── */}
            {activeTab === 'analytics' && (
              <div className="space-y-6 animate-slide-in">
                
                {/* 1. Analytics Summary Metrics Header */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">Total Cases Processed</span>
                      <span className="text-2xl font-black text-slate-900">{analyticsData?.summary?.total_cases || 0}</span>
                      <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Live Database Records</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">Emergency Resolution Rate</span>
                      <span className="text-2xl font-black text-emerald-600">{analyticsData?.summary?.resolution_rate || '100%'}</span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{analyticsData?.summary?.completed_cases || 0} Successful Rescues</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">Avg ER Wait Time</span>
                      <span className="text-2xl font-black text-purple-600">{analyticsData?.summary?.avg_er_wait_time || '6 mins'}</span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Average Intake Latency</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Activity className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">Active Dispatches</span>
                      <span className="text-2xl font-black text-amber-600">{analyticsData?.summary?.active_cases || 0}</span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Under Live Responder Care</span>
                    </div>
                  </div>

                </div>

                {/* 2. Charts & Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Departmental Case Distribution Bar Chart */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-blue-600" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                          Departmental Case Distribution
                        </h4>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Live MySQL Count</span>
                    </div>

                    <div className="space-y-3.5 pt-2">
                      {analyticsData?.department_analytics && Object.entries(analyticsData.department_analytics).map(([dept, count]: any) => {
                        const vals = Object.values(analyticsData.department_analytics) as number[];
                        const maxVal = Math.max(...vals, 1);
                        const pct = Math.round((count / maxVal) * 100);
                        return (
                          <div key={dept} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-slate-700">
                              <span>{dept}</span>
                              <span className="font-black text-blue-600">{count} Cases ({pct}%)</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500" 
                                style={{ width: `${Math.max(pct, 8)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Priority Severity Breakdown Chart */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-rose-600" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                          Emergency Severity Level Breakdown
                        </h4>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Triage Distribution</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      {analyticsData?.priority_analytics && Object.entries(analyticsData.priority_analytics).map(([priority, count]: any) => {
                        const colorMap: any = {
                          Critical: 'bg-rose-50 border-rose-200 text-rose-700',
                          High: 'bg-amber-50 border-amber-200 text-amber-700',
                          Medium: 'bg-blue-50 border-blue-200 text-blue-700',
                          Low: 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        };
                        return (
                          <div key={priority} className={`p-4 rounded-2xl border ${colorMap[priority] || 'bg-slate-50 border-slate-200 text-slate-700'} space-y-1`}>
                            <span className="text-[10px] font-black uppercase tracking-wider block">{priority} Priority</span>
                            <span className="text-2xl font-black block">{count}</span>
                            <span className="text-[9px] font-bold opacity-80 block">Active Triage Pool</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* 3. Hospital Resource Capacity Meters */}
                <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-wider text-white">
                          Real-Time Hospital Resource Capacity Telemetry
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Dynamic MySQL Capacity & Occupancy Meters
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[9.5px] font-black uppercase">
                      ● Operational
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold">
                    <div className="bg-slate-800/80 p-4.5 rounded-2xl border border-slate-700/80 space-y-2">
                      <span className="text-[9.5px] text-slate-400 font-black uppercase tracking-wider block">ICU Beds Available</span>
                      <span className="text-2xl font-black text-white">{analyticsData?.resources?.available_icu_beds || 0}</span>
                      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>

                    <div className="bg-slate-800/80 p-4.5 rounded-2xl border border-slate-700/80 space-y-2">
                      <span className="text-[9.5px] text-slate-400 font-black uppercase tracking-wider block">Emergency Beds</span>
                      <span className="text-2xl font-black text-white">{analyticsData?.resources?.emergency_beds || 0}</span>
                      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '80%' }}></div>
                      </div>
                    </div>

                    <div className="bg-slate-800/80 p-4.5 rounded-2xl border border-slate-700/80 space-y-2">
                      <span className="text-[9.5px] text-slate-400 font-black uppercase tracking-wider block">Active On-Call Doctors</span>
                      <span className="text-2xl font-black text-white">{analyticsData?.resources?.available_doctors || 0}</span>
                      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>

                    <div className="bg-slate-800/80 p-4.5 rounded-2xl border border-slate-700/80 space-y-2">
                      <span className="text-[9.5px] text-slate-400 font-black uppercase tracking-wider block">Active Ambulances</span>
                      <span className="text-2xl font-black text-emerald-400">{analyticsData?.resources?.ambulance_fleet_active || 0} Vehicles</span>
                      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: '90%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
