import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  HeartPulse,
  Sparkles,
  MapPin,
  Compass,
  Loader2,
  Stethoscope,
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Camera,
  Mic,
  Volume2,
  Volume1,
  Languages,
  Play,
  Square,
  Search,
  Check,
  Plus,
  RotateCcw,
  HelpCircle,
  VolumeX,
} from "lucide-react";
import {
  BrowserSpeechRecognizer,
  isSpeechRecognitionSupported,
  speakAloud,
  stopSpeech,
} from "../utils/speechHelper";
import {
  SYMPTOM_CATALOG,
  SYMPTOM_CATEGORIES,
  type SymptomItem,
} from "../data/symptomCatalog";

interface Hospital {
  id: number;
  name: string;
  state: string;
  district: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  available_doctors: number;
  available_icu_beds: number;
  available_general_beds: number;
  emergency_beds: number;
  er_wait_minutes: number;
  queue_count: number;
  hospital_status: string;
  rating: number;
  distance_km: number;
  eta_minutes: number;
  recommendation_score: number;
  phone?: string;
  email?: string;
  hospital_type?: string;
  emergency_24_7?: boolean;
  ambulance_available?: boolean;
  specialties?: string[];
}

const INDIAN_STATES_CITIES: Record<string, string[]> = {
  "Tamil Nadu": ["Madurai", "Thiruparankundram", "Chennai", "Coimbatore", "Trichy", "Salem", "Tirunelveli", "Vellore", "Erode", "Thanjavur"],
  "Karnataka": ["Bangalore", "Mysore", "Mangalore", "Hubli", "Belgaum", "Gulbarga"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Navi Mumbai", "Aurangabad", "Kolhapur"],
  "Delhi": ["Delhi", "New Delhi", "Noida", "Gurgaon", "Faridabad"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam", "Kannur", "Alappuzha"],
  "Uttar Pradesh": ["Lucknow", "Varanasi", "Agra", "Noida", "Kanpur", "Prayagraj", "Meerut", "Bareilly"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
  "Telangana": ["Hyderabad", "Secunderabad", "Warangal", "Nizamabad", "Karimnagar"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Nellore", "Kurnool"],
  "Punjab": ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
  "Haryana": ["Gurgaon", "Faridabad", "Panipat", "Ambala", "Karnal", "Rohtak"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Manali", "Solan"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Nainital"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur"],
  "Jammu & Kashmir": ["Srinagar", "Jammu", "Anantnag"],
  "Puducherry": ["Pondicherry", "Karaikal"],
  "Chandigarh": ["Chandigarh"],
  "Tripura": ["Agartala"],
  "Meghalaya": ["Shillong"],
  "Manipur": ["Imphal"],
  "Mizoram": ["Aizawl"],
  "Nagaland": ["Kohima", "Dimapur"],
  "Sikkim": ["Gangtok"],
  "Arunachal Pradesh": ["Itanagar"],
  "Ladakh": ["Leh", "Kargil"],
  "Andaman & Nicobar": ["Port Blair"],
  "Dadra & Nagar Haveli": ["Daman", "Silvassa"],
  "Lakshadweep": ["Kavaratti"],
};

const PatientDashboard: React.FC = () => {
  const { user, logout, checkAuth } = useAuth();

  // Profile Edit states
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditMobile(user.mobile);
      setEditPhoto(user.profile_photo || "");
    }
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
      setError("Name and Mobile number are required.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(editMobile)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setUpdatingProfile(true);
    try {
      const res = await api.put("/auth/profile/update", {
        name: editName,
        mobile: editMobile,
        profile_photo: editPhoto,
      });
      if (res.data.success) {
        await checkAuth();
        setSuccessMsg("Profile updated successfully.");
        setTimeout(() => setSuccessMsg(null), 4000);
        setIsEditingProfile(false);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const firstKey = Object.keys(err.response.data.errors)[0];
        setError(err.response.data.errors[firstKey][0]);
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to update profile. Please try again.",
        );
      }
    } finally {
      setUpdatingProfile(false);
    }
  };

  // GPS Tracking & Emergency Appointment states
  const [gpsWatchId, setGpsWatchId] = useState<number | null>(null);
  const [gpsText, setGpsText] = useState("Not Tracked");
  const [appointmentDate, setAppointmentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [appointmentTime, setAppointmentTime] = useState(
    new Date().toTimeString().slice(0, 5),
  );
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Cleanup GPS Watch Position on unmount
  React.useEffect(() => {
    return () => {
      if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
      }
    };
  }, [gpsWatchId]);

  // Symptom Analysis states
  const [symptoms, setSymptoms] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{
    possible_condition: string;
    emergency_severity: "Low" | "Medium" | "High";
    recommended_department: string;
    first_aid: string[];
    voice_summary_en?: string;
    voice_summary_ta?: string;
  } | null>(null);

  // Voice & Accessibility states (Speech-to-Text & Text-to-Speech)
  const [isListening, setIsListening] = useState(false);
  const [speechInterimText, setSpeechInterimText] = useState("");
  const [voiceLang, setVoiceLang] = useState<"ta-IN" | "en-IN">("ta-IN");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioVoiceLang, setAudioVoiceLang] = useState<"ta" | "en">("ta");
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Symptom Catalog & Identification states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [symptomSearchQuery, setSymptomSearchQuery] = useState("");
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([]);
  const [showGuidedBuilder, setShowGuidedBuilder] = useState(false);
  const [builderBodyPart, setBuilderBodyPart] = useState("Chest (மார்பு)");
  const [builderPainType, setBuilderPainType] = useState("Severe Tightness / Crushing (கடுமையான இறுக்கம்)");
  const [builderDuration, setBuilderDuration] = useState("Sudden / Past 1 hour (திடீரென தொடங்கியது)");

  const speechRecognizerRef = React.useRef<BrowserSpeechRecognizer | null>(null);

  // Initialize SpeechRecognizer
  React.useEffect(() => {
    if (isSpeechRecognitionSupported()) {
      speechRecognizerRef.current = new BrowserSpeechRecognizer({
        lang: voiceLang,
        onStart: () => {
          setIsListening(true);
          setSpeechError(null);
        },
        onResult: (transcript, isFinal) => {
          setSpeechInterimText(transcript);
          if (isFinal) {
            setSymptoms((prev) => (prev ? prev + ", " + transcript : transcript));
            setSpeechInterimText("");
          }
        },
        onError: (errMsg) => {
          setIsListening(false);
          setSpeechInterimText("");
          setSpeechError(errMsg);
          setTimeout(() => setSpeechError(null), 6000);
        },
        onEnd: () => {
          setIsListening(false);
          setSpeechInterimText("");
        },
      });
    }

    return () => {
      if (speechRecognizerRef.current) {
        speechRecognizerRef.current.stop();
      }
      stopSpeech();
    };
  }, [voiceLang]);

  const toggleVoiceRecording = () => {
    setSpeechError(null);
    if (!isSpeechRecognitionSupported()) {
      setSpeechError(
        "Voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge."
      );
      return;
    }
    if (isListening) {
      speechRecognizerRef.current?.stop();
      setIsListening(false);
      setSpeechInterimText("");
    } else {
      stopSpeech();
      setIsSpeaking(false);
      speechRecognizerRef.current?.start();
    }
  };

  const handleVoiceGuide = () => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }
    const guideTa =
      "வணக்கம். உங்கள் உடல்நிலை அல்லது அவசர அறிகுறிகளை மைக் பட்டனை அழுத்தி தமிழில் பேசலாம். அல்லது கீழே உள்ள கார்டுகளில் உங்கள் அறிகுறியைத் தேர்ந்தெடுக்கவும். நெஞ்சு வலி, விபத்து, மூச்சுத் திணறல் போன்ற அவசர நிலைகளுக்கு உடனடியாக மருத்துவமனை உதவி வழங்கப்படும்.";
    const guideEn =
      "Hello. You can speak your symptoms by clicking the microphone button, or choose from the symptom categories below. Emergency conditions like chest pain, breathing difficulty, or accidents will be prioritized immediately.";

    const textToSpeak = audioVoiceLang === "ta" ? guideTa : guideEn;
    speakAloud(textToSpeak, audioVoiceLang, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleReadCurrentSymptoms = () => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }
    if (!symptoms.trim()) {
      const msg = audioVoiceLang === "ta" ? "அறிகுறிகள் எதுவும் இன்னும் எழுதப்படவில்லை." : "No symptoms have been entered yet.";
      speakAloud(msg, audioVoiceLang, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
      return;
    }
    const introTa = "நீங்கள் உள்ளிட்ட அறிகுறிகள்: " + symptoms;
    const introEn = "Your entered symptoms: " + symptoms;
    speakAloud(audioVoiceLang === "ta" ? introTa : introEn, audioVoiceLang, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleReadTriageResults = () => {
    if (!aiResult) return;
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }

    const speechText =
      audioVoiceLang === "ta"
        ? (aiResult.voice_summary_ta ||
          `மருத்துவ அறிக்கையின் விவரங்கள். கண்டறியப்பட்ட நிலை: ${aiResult.possible_condition}. ஆபத்து நிலை: ${
            aiResult.emergency_severity === "High"
              ? "உயிர் காக்கும் அதி தீவிர அவசரம்"
              : aiResult.emergency_severity === "Medium"
              ? "நடுத்தர அவசரம்"
              : "பொதுவான நிலை"
          }. பரிந்துரைக்கப்பட்ட துறை: ${aiResult.recommended_department}. முதலுதவி குறிப்புகள்: ${aiResult.first_aid.join(". ")}.`)
        : (aiResult.voice_summary_en ||
          `Clinical Diagnostic Summary. Possible condition: ${aiResult.possible_condition}. Emergency severity: ${aiResult.emergency_severity}. Recommended department: ${aiResult.recommended_department}. First aid guidelines: ${aiResult.first_aid.join(". ")}.`);

    speakAloud(speechText, audioVoiceLang, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleSelectSymptomItem = (item: SymptomItem) => {
    const isSelected = selectedSymptomIds.includes(item.id);
    setSelectedSymptomIds((prev) =>
      isSelected ? prev.filter((id) => id !== item.id) : [...prev, item.id]
    );

    if (!isSelected) {
      setSymptoms((prev) => {
        if (prev.includes(item.clinicalText) || prev.includes(item.titleEn)) {
          return prev;
        }
        return prev ? `${prev}, ${item.clinicalText}` : item.clinicalText;
      });
    }
  };

  const handleApplyGuidedBuilder = () => {
    const built = `Acute discomfort in the ${builderBodyPart} with ${builderPainType}, onset ${builderDuration}.`;
    setSymptoms((prev) => (prev ? `${prev}, ${built}` : built));
    setShowGuidedBuilder(false);
  };

  const filteredSymptoms = React.useMemo(() => {
    return SYMPTOM_CATALOG.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" ||
        item.category === selectedCategory ||
        (selectedCategory === "critical" && item.severity === "High");

      if (!symptomSearchQuery.trim()) return matchesCategory;

      const q = symptomSearchQuery.toLowerCase().trim();
      const matchesSearch =
        item.titleEn.toLowerCase().includes(q) ||
        item.titleTa.toLowerCase().includes(q) ||
        item.descriptionEn.toLowerCase().includes(q) ||
        item.descriptionTa.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, symptomSearchQuery]);

  // Location and search states
  const [locOption, setLocOption] = useState<"gps" | "manual" | null>(null);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // Manual Address states
  const [state, setState] = useState("");
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>("Tamil Nadu");
  const [city, setCity] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [geocoding, setGeocoding] = useState(false);

  // Hospital query states
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(
    null,
  );
  const [recommendationReason, setRecommendationReason] = useState("");
  const [searchingHospitals, setSearchingHospitals] = useState(false);
  const lastRequestParamsRef = React.useRef<string>("");

  // Error handling
  const [error, setError] = useState<string | null>(null);

  const handleRunAIAnalysis = async (e?: React.SyntheticEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!symptoms.trim()) {
      setError("Please describe your symptoms first.");
      return;
    }

    setError(null);
    setAnalyzing(true);
    setAiResult(null);
    setLocOption(null);
    setHospitals([]);
    setSelectedHospital(null);
    setRecommendationReason("");
    setBookingSuccess(false);

    // Cancel any active continuous GPS tracking watches
    if (gpsWatchId !== null) {
      navigator.geolocation.clearWatch(gpsWatchId);
      setGpsWatchId(null);
    }
    setGpsText("Not Tracked");

    try {
      const res = await api.post("/ai/analyze", { symptoms });
      if (res.data.success) {
        setAiResult(res.data.data);
      } else {
        throw new Error(res.data.message || "Symptom analysis failed.");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Gemini AI service timed out. Please try again.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // GPS Location Trigger
  const handleUseCurrentLocation = (e?: React.SyntheticEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!navigator.geolocation) {
      setError("GPS Geolocation is not supported by your browser.");
      return;
    }

    setError(null);
    setLocOption("gps");
    setFetchingGps(true);
    lastRequestParamsRef.current = "";

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = pos.coords.accuracy || null;
        setCurrentCoords({ lat, lng });
        setGpsAccuracy(acc);
        setFetchingGps(false);
        setGpsText(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);

        // Search hospitals with coordinates
        await searchHospitals(lat, lng);
      },
      async (err) => {
        console.warn("GPS error / denied:", err);
        setFetchingGps(false);
        if (err.code === 1) {
          setError(
            "GPS location access was denied by your browser. Please allow location access in your browser settings, or click 'Select Location' to type your Landmark/City below.",
          );
        } else if (err.code === 3) {
          setError(
            "GPS signal timed out. Please click 'Select Location' to type your Landmark or City below for instant, exact routing.",
          );
        } else {
          setError(
            "Unable to acquire GPS position. Please click 'Select Location' to type your Landmark or City below.",
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // Dynamic Request Type Detection (Emergency vs Normal Mode)
  const detectRequestType = (): "Emergency" | "Normal" => {
    if (aiResult?.emergency_severity === "High") return "Emergency";
    if (
      aiResult?.emergency_severity === "Medium" ||
      aiResult?.emergency_severity === "Low"
    )
      return "Normal";

    const emergencyKeywords = [
      "chest pain",
      "heart attack",
      "stroke",
      "breathing difficulty",
      "snake bite",
      "accident",
      "fracture",
      "bleeding",
      "burns",
      "pregnancy emergency",
      "unconscious",
      "fast",
      "cardiac",
      "choking",
      "hemorrhage",
      "trauma",
      "dengue",
      "நெஞ்சு",
      "இதயம்",
      "மாரடைப்பு",
      "படபடப்பு",
      "மூச்சு",
      "சுவாசம்",
      "விபத்து",
      "காயம்",
      "ரத்தம்",
      "இரத்தம்",
      "மயக்கம்",
      "சுயநினைவு",
      "பாம்பு",
      "விஷம்",
      "பிரசவம்",
      "கர்ப்பம்",
      "எலும்பு",
      "முறிவு",
      "தீக்காயம்",
      "nenju",
      "maradaippu",
      "moochu",
      "vibathu",
      "ratham",
      "mayakkam",
      "paambu",
      "elumbu",
      "theekayam",
    ];
    const isEmergencySymptom = emergencyKeywords.some((kw) =>
      symptoms.toLowerCase().includes(kw),
    );

    return isEmergencySymptom ? "Emergency" : "Normal";
  };

  // Manual Location form submission geocoder
  const handleManualLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetCity = city.trim();
    let targetState = state.trim();
    const targetLandmark = landmark.trim();

    // Auto-detect if user entered Thiruparankundram in Landmark field without typing City
    if (!targetCity && targetLandmark) {
      if (
        /thiruparan|tiruparan|thirupparan|parankundram|parankudram/i.test(
          targetLandmark,
        )
      ) {
        targetCity = "Madurai";
        targetState = targetState || "Tamil Nadu";
        setCity("Madurai");
        if (!state) setState("Tamil Nadu");
      }
    }

    if (!targetCity && !targetState && !targetLandmark) {
      setError("Please select or enter a State, City, or Locality.");
      return;
    }

    // If city is Thiruparankundram, ensure state is set to Tamil Nadu
    if (
      /thiruparan|tiruparan|thirupparan|parankundram|parankudram/i.test(
        targetCity,
      )
    ) {
      if (!targetState) {
        targetState = "Tamil Nadu";
        setState("Tamil Nadu");
      }
    }

    // Cancel any active watch position since manual location is selected
    if (gpsWatchId !== null) {
      navigator.geolocation.clearWatch(gpsWatchId);
      setGpsWatchId(null);
    }

    setError(null);
    setGeocoding(true);
    setHospitals([]);
    setRecommendationReason("");
    const locDisplay = [targetLandmark, targetCity, targetState, "India"]
      .filter(Boolean)
      .join(", ");
    setGpsText(locDisplay);

    const requestType = detectRequestType();
    const isEmergency = requestType === "Emergency";

    // Synchronize emergency state if emergency request is detected
    if (isEmergency && (!aiResult || aiResult.emergency_severity !== "High")) {
      setAiResult({
        emergency_severity: "High",
        possible_condition: symptoms || "Emergency Condition Detected",
        recommended_department: "Emergency Medicine & Trauma Care",
        first_aid: [
          "Keep the patient calm and comfortable.",
          "Ensure unobstructed airway and monitor breathing continuously.",
          "Avoid unprescribed physical exertion or movement.",
          "Prepare for immediate transport to nearest emergency hospital.",
        ],
      });
    }

    try {
      // Dispatch payload to backend hospitals to trigger geocoding and filtering
      const params: any = {
        severity: isEmergency
          ? "High"
          : aiResult?.emergency_severity || "Medium",
        specialty: aiResult?.recommended_department || "",
        state: targetState,
        city: targetCity,
        landmark: targetLandmark,
        pincode,
      };

      const res = await api.get("/hospitals", { params });
      if (res.data.success) {
        const list = res.data.data.hospitals || [];
        setHospitals(list);
        setRecommendationReason(res.data.data.recommendation_reason);
        if (list.length > 0) {
          setSelectedHospital(list[0]);
        }

        if (res.data.data.searched_coords) {
          const coords = res.data.data.searched_coords;
          setCurrentCoords({
            lat: Number(coords.latitude),
            lng: Number(coords.longitude),
          });
          const addressLabel =
            res.data.data.geocoded_address ||
            [targetLandmark, targetCity, targetState].filter(Boolean).join(", ");
          setGpsText(
            `${addressLabel} (Lat: ${Number(coords.latitude).toFixed(4)}, Lng: ${Number(coords.longitude).toFixed(4)})`,
          );
        }

        // Dynamic navigation routing based on request type
        setTimeout(() => {
          if (isEmergency) {
            const emergencyEl = document.getElementById(
              "emergency-command-section",
            );
            if (emergencyEl) {
              emergencyEl.scrollIntoView({ behavior: "smooth" });
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          } else {
            const normalEl = document.getElementById(
              "normal-hospitals-section",
            );
            if (normalEl) {
              normalEl.scrollIntoView({ behavior: "smooth" });
            }
          }
        }, 150);
      } else {
        throw new Error(res.data.message || "Failed to search hospitals.");
      }
    } catch (err: any) {
      console.error(err);
      setHospitals([]);
      setSelectedHospital(null);
      setRecommendationReason("");
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to search hospitals. Please check your connection and try again.",
      );
    } finally {
      setGeocoding(false);
    }
  };

  // Search hospitals core method
  const searchHospitals = async (latitude: number, longitude: number) => {
    setCurrentCoords({ lat: latitude, lng: longitude });
    setError(null);
    setSearchingHospitals(true);
    setHospitals([]);
    setRecommendationReason("");

    const requestType = detectRequestType();
    const isEmergency = requestType === "Emergency";

    if (isEmergency && (!aiResult || aiResult.emergency_severity !== "High")) {
      setAiResult({
        emergency_severity: "High",
        possible_condition: symptoms || "Emergency Condition Detected",
        recommended_department: "Emergency Medicine & Trauma Care",
        first_aid: [
          "Keep the patient calm and comfortable.",
          "Ensure unobstructed airway and monitor breathing continuously.",
          "Avoid unprescribed physical exertion or movement.",
          "Prepare for immediate transport to nearest emergency hospital.",
        ],
      });
    }

    try {
      const params = {
        latitude,
        longitude,
        severity: isEmergency
          ? "High"
          : aiResult?.emergency_severity || "Medium",
        specialty: aiResult?.recommended_department || "",
      };

      const paramKey = JSON.stringify(params);
      if (lastRequestParamsRef.current === paramKey && hospitals.length > 0) {
        setSearchingHospitals(false);
        return;
      }
      lastRequestParamsRef.current = paramKey;

      const res = await api.get("/hospitals", { params });
      if (res.data.success) {
        const list = res.data.data.hospitals || [];
        setHospitals(list);
        setRecommendationReason(res.data.data.recommendation_reason);
        if (list.length > 0) {
          setSelectedHospital(list[0]);
        }
        if (res.data.data.geocoded_address) {
          setGpsText(
            `${res.data.data.geocoded_address} (Lat: ${Number(latitude).toFixed(4)}, Lng: ${Number(longitude).toFixed(4)})`,
          );
        }

        // Dynamic navigation routing based on request type
        setTimeout(() => {
          if (isEmergency) {
            const emergencyEl = document.getElementById(
              "emergency-command-section",
            );
            if (emergencyEl) {
              emergencyEl.scrollIntoView({ behavior: "smooth" });
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          } else {
            const normalEl = document.getElementById(
              "normal-hospitals-section",
            );
            if (normalEl) {
              normalEl.scrollIntoView({ behavior: "smooth" });
            }
          }
        }, 150);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "This application currently supports emergency services only within India.",
      );
    } finally {
      setSearchingHospitals(false);
    }
  };

  const handleEmergencyAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetHosp = selectedHospital || hospitals[0];
    if (!targetHosp) {
      setError("No recommended hospital available.");
      return;
    }
    if (!appointmentDate || !appointmentTime) {
      setError("Please select date and time for the appointment.");
      return;
    }

    setError(null);
    setBookingLoading(true);
    setBookingSuccess(false);

    try {
      const res = await api.post("/appointments", {
        patient_name: user?.name,
        mobile_number: user?.mobile,
        gps_location: gpsText,
        hospital_id: targetHosp.id,
        hospital_name: targetHosp.name,
        department: aiResult?.recommended_department || "General Medicine",
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        priority: aiResult?.emergency_severity || "Medium",
      });

      if (res.data.success) {
        setBookingSuccess(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to submit appointment request.",
      );
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans antialiased text-slate-800">
      {/* enterprise-level Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100/80 shadow-sm px-8 py-4 sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/20">
              <HeartPulse className="h-5.5 w-5.5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-base font-black text-slate-900 tracking-tight block">
                EMERGENIX-AI Portal
              </span>
              <span className="text-[9px] font-black text-blue-600 block leading-none uppercase tracking-widest">
                AI Emergency Intelligence System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            <div
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-3 px-3 py-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-2xl cursor-pointer transition-all duration-250 select-none"
            >
              <div className="h-10 w-10 rounded-xl overflow-hidden bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
                {user?.profile_photo ? (
                  <img
                    src={user.profile_photo}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-black uppercase">
                    {user?.name?.slice(0, 2)}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left text-xs font-bold leading-tight">
                <span className="text-slate-900 font-black">{user?.name}</span>
                <span className="text-[9px] text-blue-600 font-black uppercase tracking-wider">
                  {user?.role}
                </span>
              </div>
            </div>

            {/* Profile Dropdown panel */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-14 w-80 bg-white border border-slate-150 shadow-2xl rounded-3xl p-6 z-50 text-slate-800 animate-slide-in space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    User Profile
                  </h4>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setProfileDropdownOpen(false);
                    }}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-655 uppercase"
                  >
                    Close
                  </button>
                </div>

                {successMsg && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-xl text-center text-[10px] font-bold">
                    {successMsg}
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-center text-[10px] font-bold">
                    {error}
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
                      <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
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
                      <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">
                        Mobile Number
                      </label>
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
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-md shadow-blue-500/10"
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
                        <span className="text-[9px] px-2 py-0.5 bg-blue-50 text-blue-650 rounded-md font-black uppercase tracking-wider inline-block mt-1">
                          {user?.role}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs font-semibold text-slate-600">
                      <div className="border-t border-slate-100 pt-2.5">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">
                          Email
                        </span>
                        <span className="text-slate-800">{user?.email}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">
                          Mobile Number
                        </span>
                        <span className="text-slate-800">
                          {user?.mobile || "Not provided"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsEditingProfile(true);
                        }}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider tracking-widest transition-all shadow-md shadow-blue-500/10"
                      >
                        Edit Profile
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          logout();
                        }}
                        className="w-full py-2 bg-slate-50 hover:bg-rose-50 text-slate-650 hover:text-rose-600 border border-slate-200/80 rounded-xl text-[10px] font-black uppercase transition-all"
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

      {/* Main Grid container */}
      <main className="max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
        {/* ── REDESIGNED EMERGENCY COMMAND CENTER UI (Phase 2) ────────────────── */}
        {aiResult && aiResult.emergency_severity === "High" && (
          <div
            id="emergency-command-section"
            className="col-span-12 bg-slate-900 border-2 border-red-500 rounded-3xl p-6 md:p-8 animate-slide-in relative overflow-hidden emergency-border-blink emergency-glow-pulse space-y-6 text-white shadow-2xl"
          >
            {/* Top glowing red accent bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse" />

            {/* Emergency Header Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800 relative z-10">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/40 shrink-0 emergency-siren-pulse shadow-lg shadow-red-500/20">
                  <span className="text-2xl">🚨</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg md:text-xl font-black text-red-500 tracking-tight uppercase flex items-center gap-2 emergency-text-blink">
                      CRITICAL EMERGENCY COMMAND ACTIVE
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-2">
                    <span>AEIS High-Severity Command Center</span>
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  </p>
                </div>
              </div>

              {/* Status Badges Header */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-black uppercase rounded-xl tracking-wider shadow-inner flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  Severity: {aiResult.emergency_severity} (Critical)
                </span>
                <span className="px-4 py-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase rounded-xl tracking-wider">
                  ⚡ Triage Level 1
                </span>
                <span className="px-4 py-2 bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-black uppercase rounded-xl tracking-wider flex items-center gap-1">
                  <Compass className="h-3.5 w-3.5 animate-spin" />
                  Live GPS Tracking Active
                </span>
              </div>
            </div>

            {/* Critical Treatment Countdown Indicator */}
            <div className="bg-red-950/60 border border-red-500/30 p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold">
              <div className="flex items-center gap-3 text-red-200">
                <div className="h-9 w-9 rounded-xl bg-red-600/30 flex items-center justify-center text-red-400 shrink-0 text-base font-black">
                  🕒
                </div>
                <div>
                  <span className="text-slate-300 block text-[10px] uppercase font-bold tracking-wider">
                    Time-Critical Response Window
                  </span>
                  <span className="text-xs font-bold text-red-100">
                    Recommended emergency treatment should begin within{" "}
                    <strong className="text-sm font-black text-red-400 underline">
                      {[
                        "Chest Pain",
                        "Heart Attack",
                        "Stroke",
                        "Breathing Difficulty",
                        "Snake Bite",
                      ].some(
                        (c) =>
                          symptoms.toLowerCase().includes(c.toLowerCase()) ||
                          aiResult.possible_condition
                            .toLowerCase()
                            .includes(c.toLowerCase()),
                      )
                        ? "30"
                        : "45"}{" "}
                      minutes
                    </strong>
                    .
                  </span>
                </div>
              </div>
              <span className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider text-center shrink-0 shadow-md">
                Critical Response Window Active
              </span>
            </div>

            {/* Emergency Details Grid (4 Key Informational Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 text-xs font-semibold">
              {/* Card 1: Emergency Location */}
              <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl space-y-1.5 shadow-sm hover:border-slate-600 transition-all">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <span>Incident Location</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-black">
                    📍 GPS
                  </span>
                </div>
                <span className="text-xs font-black text-white block leading-snug break-words">
                  {gpsText !== "Not Tracked"
                    ? gpsText
                    : city
                      ? `${city}, ${state || ""} ${pincode || ""}`
                      : "Current GPS Location Active"}
                </span>
                {landmark && (
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    Landmark: {landmark}
                  </span>
                )}
                {currentCoords && (
                  <a
                    href={`https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-[10px] text-blue-400 hover:text-blue-300 font-bold underline flex items-center gap-1"
                  >
                    🗺️ Verify Pin on Google Maps ↗
                  </a>
                )}
              </div>

              {/* Card 2: Patient Details */}
              <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl space-y-1.5 shadow-sm hover:border-slate-600 transition-all">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <span>Patient Identity</span>
                  <span className="text-blue-400 font-black">👤 Verified</span>
                </div>
                <span className="text-xs font-black text-white block">
                  {user?.name || "Emergency Patient"}
                </span>
                <span className="text-[10px] text-slate-300 block font-bold">
                  📞 Mobile: {user?.mobile || "Linked"}
                </span>
              </div>

              {/* Card 3: Emergency Type / Symptoms */}
              <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl space-y-1.5 shadow-sm hover:border-slate-600 transition-all">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <span>Emergency Condition</span>
                  <span className="text-amber-400 font-black">
                    🩺 AI Triaged
                  </span>
                </div>
                <span className="text-xs font-black text-red-400 block truncate">
                  {aiResult.possible_condition}
                </span>
                <span className="text-[10px] text-slate-300 block font-semibold truncate">
                  Dept: {aiResult.recommended_department}
                </span>
              </div>

              {/* Card 4: Emergency Dispatch Status */}
              <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl space-y-1.5 shadow-sm hover:border-slate-600 transition-all">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <span>Emergency Status</span>
                  <span className="text-emerald-400 font-black">⚡ Active</span>
                </div>
                <span className="text-xs font-black text-emerald-400 block">
                  High Severity Active
                </span>
                <span className="text-[10px] text-slate-300 block font-semibold">
                  Triage Priority 1 Assigned
                </span>
              </div>
            </div>

            {/* TOP 10 RECOMMENDED EMERGENCY HOSPITALS LIST */}
            <div className="pt-4 relative z-10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <h4 className="text-xs md:text-sm font-black uppercase text-slate-200 tracking-wider flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Top Recommended Emergency Hospitals (Ranked by Distance &
                  Speed)
                </h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Showing {Math.min(10, hospitals.length)} Hospitals Available
                </span>
              </div>

              {hospitals.length > 0 ? (
                <div className="space-y-4">
                  {hospitals.slice(0, 10).map((hosp, idx) => {
                    const isFirst = idx === 0;
                    return (
                      <div
                        key={hosp.id}
                        className={`rounded-2xl p-5 md:p-6 transition-all duration-300 relative overflow-hidden ${
                          isFirst
                            ? "bg-slate-850 border-2 border-red-500 shadow-xl shadow-red-950/30"
                            : "bg-slate-800/90 border border-slate-700/80 shadow-md hover:border-slate-600"
                        }`}
                      >
                        {/* Header Banner Badge */}
                        <div
                          className={`absolute top-0 right-0 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-bl-xl shadow-md ${
                            isFirst
                              ? "bg-red-600 text-white"
                              : "bg-slate-700 text-slate-300 border-l border-b border-slate-600"
                          }`}
                        >
                          {isFirst
                            ? "⭐ #1 AI Recommended Hospital"
                            : `Priority Rank #${idx + 1}`}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                          {/* Left Column: Hospital Identity */}
                          <div className="lg:col-span-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${
                                  isFirst
                                    ? "bg-red-600 text-white"
                                    : "bg-slate-700 text-slate-200"
                                }`}
                              >
                                {hosp.hospital_type || "General Emergency"}
                              </span>
                              <span className="bg-amber-500/20 text-amber-300 text-[9px] font-black px-2.5 py-1 rounded-lg border border-amber-500/30">
                                ★ {hosp.rating || "4.5"} Rating
                              </span>
                              {hosp.emergency_24_7 !== false && (
                                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black px-2.5 py-1 rounded-lg border border-emerald-500/30">
                                  24/7 ER
                                </span>
                              )}
                            </div>

                            <div>
                              <h3 className="text-base md:text-lg font-black text-white leading-snug flex items-center gap-2">
                                {isFirst && (
                                  <span className="text-red-500">⭐</span>
                                )}
                                {hosp.name}
                              </h3>
                              <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
                                📍 {hosp.address}, {hosp.city}, {hosp.state}
                              </p>
                              {hosp.phone && (
                                <p className="text-[11px] text-blue-400 font-bold mt-1.5 flex items-center gap-1">
                                  📞 Contact: {hosp.phone}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right Column: Emergency Key Metrics & Availability */}
                          <div className="lg:col-span-8 space-y-4">
                            {/* Grid of Key Emergency Parameters */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                              {/* Distance */}
                              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                                  Distance
                                </span>
                                <span className="text-sm font-black text-white">
                                  {hosp.distance_km} km
                                </span>
                              </div>

                              {/* Travel ETA */}
                              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                                  Travel ETA
                                </span>
                                <span className="text-sm font-black text-amber-400">
                                  {hosp.eta_minutes} mins
                                </span>
                              </div>

                              {/* ER Waiting Time */}
                              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                                  ER Wait Time
                                </span>
                                <span className="text-sm font-black text-blue-400">
                                  {hosp.er_wait_minutes} mins
                                </span>
                              </div>

                              {/* Emergency Doctors */}
                              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                                  Doctors Available
                                </span>
                                <span
                                  className={`text-sm font-black ${hosp.available_doctors > 0 ? "text-emerald-400" : "text-rose-400"}`}
                                >
                                  {hosp.available_doctors > 0
                                    ? `${hosp.available_doctors} Available`
                                    : "On Call"}
                                </span>
                              </div>
                            </div>

                            {/* Bed Vacancies Grid */}
                            <div className="grid grid-cols-3 gap-2.5 text-[10.5px] font-bold">
                              <div className="bg-slate-900/60 border border-slate-700/50 p-2.5 rounded-xl flex justify-between items-center">
                                <span className="text-slate-400">
                                  Emergency Beds:
                                </span>
                                <span className="text-emerald-400 font-black text-xs">
                                  {hosp.emergency_beds} vacant
                                </span>
                              </div>
                              <div className="bg-slate-900/60 border border-slate-700/50 p-2.5 rounded-xl flex justify-between items-center">
                                <span className="text-slate-400">
                                  ICU Beds:
                                </span>
                                <span className="text-emerald-400 font-black text-xs">
                                  {hosp.available_icu_beds} vacant
                                </span>
                              </div>
                              <div className="bg-slate-900/60 border border-slate-700/50 p-2.5 rounded-xl flex justify-between items-center">
                                <span className="text-slate-400">
                                  General Beds:
                                </span>
                                <span className="text-emerald-400 font-black text-xs">
                                  {hosp.available_general_beds} vacant
                                </span>
                              </div>
                            </div>

                            {/* Ambulance & Dispatch Row */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 ${
                                    hosp.ambulance_available !== false &&
                                    Boolean(hosp.ambulance_available)
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  }`}
                                >
                                  {hosp.ambulance_available !== false &&
                                  Boolean(hosp.ambulance_available)
                                    ? "🚑 Ambulance Available"
                                    : "🚑 Ambulance Unavailable"}
                                </span>
                                <span className="px-3 py-1.5 bg-slate-700/80 text-slate-300 rounded-xl text-[10px] font-black uppercase">
                                  Queue: {hosp.queue_count} Patients Line
                                </span>
                              </div>

                              {/* Interactive Action Buttons */}
                              <div className="flex items-center gap-2">
                                {hosp.phone && (
                                  <a
                                    href={`tel:${hosp.phone}`}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                                  >
                                    📞 Call Hospital
                                  </a>
                                )}
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1${
                                    currentCoords
                                      ? `&origin=${currentCoords.lat},${currentCoords.lng}`
                                      : ""
                                  }&destination=${hosp.latitude},${hosp.longitude}&travelmode=driving`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                                >
                                  📍 Live Directions
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedHospital(hosp);
                                    document
                                      .getElementById("booking-form")
                                      ?.scrollIntoView({ behavior: "smooth" });
                                  }}
                                  className={`px-5 py-2 font-black text-white text-xs rounded-xl shadow-md transition-all hover:translate-y-[-1px] cursor-pointer ${
                                    isFirst
                                      ? "bg-red-600 hover:bg-red-500 shadow-red-600/30"
                                      : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30"
                                  }`}
                                >
                                  ⚡ Book Emergency Admission
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-800 p-8 rounded-2xl text-center text-slate-400 border border-slate-700">
                  No emergency hospital coordinates resolved. Enable location
                  settings to refresh routing options.
                </div>
              )}
            </div>
          </div>
        )}
        {/* enterprise Emergency Appointment Booking Card */}
        {aiResult && (selectedHospital || hospitals.length > 0) && (
          <div
            id="booking-form"
            className="col-span-12 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl space-y-5 animate-slide-in"
          >
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Confirm Care Center Appointment
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    Pre-filled and configured based on AI treatment speed
                    evaluation
                  </p>
                </div>
              </div>
              {selectedHospital && selectedHospital.id !== hospitals[0]?.id && (
                <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  Custom Choice Selected
                </span>
              )}
            </div>

            {bookingSuccess ? (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-6 rounded-2xl text-center font-bold text-xs space-y-2">
                <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="text-sm font-black">
                  Appointment booked successfully.
                </p>
                <p className="text-[10.5px] text-slate-655 font-bold uppercase tracking-wider">
                  Booked Hospital:{" "}
                  <span className="text-slate-800 font-black">
                    {(selectedHospital || hospitals[0])?.name}
                  </span>
                </p>
                <p className="text-[9px] text-slate-400 font-medium">
                  Your request records have been securely locked inside our
                  databases.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleEmergencyAppointment}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-650 bg-slate-50/50 p-5 rounded-2xl border border-slate-100"
              >
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    value={user?.name || ""}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 focus:outline-none text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                    Registered Contact Mobile
                  </label>
                  <input
                    type="text"
                    value={user?.mobile || ""}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 focus:outline-none text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                    Patient Current Location
                  </label>
                  <input
                    type="text"
                    value={gpsText}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 focus:outline-none font-bold text-slate-800 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                    Selected Hospital Name
                  </label>
                  <input
                    type="text"
                    value={
                      (selectedHospital || hospitals[0])?.name ||
                      "Resolving Care Centers..."
                    }
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 focus:outline-none font-black text-blue-650 cursor-not-allowed"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                    Hospital Address
                  </label>
                  <input
                    type="text"
                    value={(selectedHospital || hospitals[0])?.address || ""}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 focus:outline-none text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                    Admitting Department
                  </label>
                  <input
                    type="text"
                    value={
                      aiResult.recommended_department || "General Medicine"
                    }
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 focus:outline-none text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                    Emergency Priority
                  </label>
                  <input
                    type="text"
                    value={aiResult.emergency_severity}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 focus:outline-none font-black text-red-650 cursor-not-allowed uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                    Appointment Time
                  </label>
                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    required
                  />
                </div>
                <div className="md:col-span-2 flex items-end justify-end">
                  <button
                    type="submit"
                    disabled={
                      bookingLoading || !hospitals || hospitals.length === 0
                    }
                    className="w-full md:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl cursor-pointer text-center text-xs tracking-wider uppercase shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Securing
                        slots...
                      </>
                    ) : (
                      <>Confirm Hospital Booking</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Left Column: Symptoms Intake (col-span-12 md:col-span-6 lg:col-span-5) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-5 space-y-6">
          {/* AI Clinical assistant panel */}
          <div className="healthcare-card-shadow bg-white rounded-3xl p-7 md:p-8 border border-slate-100 space-y-6 transition-all duration-300">
            {/* Header with Audio Voice Guide and Language Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shrink-0">
                  <Stethoscope className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800 tracking-tight">
                    AI Hospital Assistant
                  </h2>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                    Clinical Symptoms Triage
                  </p>
                </div>
              </div>

              {/* Voice Guide Button for Non-Readers */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleVoiceGuide}
                  title="Listen to audio instructions in chosen language"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                    isSpeaking
                      ? "bg-rose-50 text-rose-600 border border-rose-200 animate-pulse"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60"
                  }`}
                >
                  {isSpeaking ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                  <span>
                    {isSpeaking
                      ? "Stop Audio"
                      : audioVoiceLang === "ta"
                      ? "🔊 குரல் வழிகாட்டல்"
                      : "🔊 Voice Guide"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = audioVoiceLang === "ta" ? "en" : "ta";
                    setAudioVoiceLang(next);
                    setVoiceLang(next === "ta" ? "ta-IN" : "en-IN");
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 border border-slate-200/60"
                  title="Switch Language"
                >
                  <Languages className="h-3.5 w-3.5 text-blue-600" />
                  {audioVoiceLang === "ta" ? "தமிழ்" : "English"}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 font-bold leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            {/* Auto-filled Emergency Mobile Block */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex justify-between items-center text-xs font-semibold text-slate-655">
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block leading-none mb-1">
                  Registered Contact Mobile
                </span>
                <span className="text-slate-800 font-black text-xs">
                  {user?.mobile}
                </span>
              </div>
              <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                linked
              </span>
            </div>

            {/* Voice Input Section for Illiterate / Non-readers & Emergency Speaking */}
            <div className="bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-slate-50 border border-blue-200/80 rounded-2xl p-4.5 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shadow-xs ${
                      isListening
                        ? "bg-rose-500 text-white animate-pulse"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    <Mic className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">
                      {voiceLang === "ta-IN"
                        ? "🎙️ குரல் மூலம் அறிகுறிகளைச் சொல்லுங்கள்"
                        : "🎙️ Speak Your Symptoms Aloud"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold block">
                      {voiceLang === "ta-IN"
                        ? "படிக்கத் தெரியாதவர்கள் மைக்கை அழுத்தி நேரடியாகப் பேசலாம்"
                        : "For non-readers or hands-free voice input"}
                    </span>
                  </div>
                </div>

                {/* Mic Language Selector */}
                <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceLang("ta-IN");
                      setAudioVoiceLang("ta");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      voiceLang === "ta-IN"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    தமிழ்
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceLang("en-IN");
                      setAudioVoiceLang("en");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      voiceLang === "en-IN"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Big Speak Button */}
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`w-full py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md ${
                  isListening
                    ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-4 ring-rose-200"
                    : "bg-slate-900 hover:bg-blue-600 text-white hover:shadow-lg hover:scale-[1.01]"
                }`}
              >
                {isListening ? (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                    <span>
                      {voiceLang === "ta-IN"
                        ? "🔴 கேட்கிறது... இப்போது பேசவும் (நிறுத்த கிளிக் செய்க)"
                        : "🔴 Listening... Speak now (Click to Stop)"}
                    </span>
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    <span>
                      {voiceLang === "ta-IN"
                        ? "பேச இங்கே கிளிக் செய்யவும் (Click to Speak in Tamil)"
                        : "Click to Speak Symptoms (English)"}
                    </span>
                  </>
                )}
              </button>

              {/* Interim Live Transcript */}
              {speechInterimText && (
                <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-3 flex items-start gap-2 animate-pulse">
                  <Activity className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 font-bold leading-relaxed">
                    🗣️ <span className="underline">பேசுவது:</span> "
                    {speechInterimText}"
                  </p>
                </div>
              )}

              {/* Speech Error */}
              {speechError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{speechError}</span>
                </div>
              )}
            </div>

            {/* Input symptoms description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-tight">
                  {audioVoiceLang === "ta"
                    ? "உங்கள் அறிகுறிகள் (விவரம்)"
                    : "Describe your symptoms"}
                </label>
                <div className="flex items-center gap-2">
                  {symptoms && (
                    <button
                      type="button"
                      onClick={handleReadCurrentSymptoms}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100"
                      title="Listen to what is written"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      {audioVoiceLang === "ta" ? "வாசிக்க" : "Read Aloud"}
                    </button>
                  )}
                  {symptoms && (
                    <button
                      type="button"
                      onClick={() => {
                        setSymptoms("");
                        setSelectedSymptomIds([]);
                      }}
                      className="text-[11px] font-bold text-slate-400 hover:text-rose-500 cursor-pointer flex items-center gap-0.5"
                    >
                      <RotateCcw className="h-3 w-3" />
                      {audioVoiceLang === "ta" ? "அழிக்க" : "Clear"}
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder={
                  audioVoiceLang === "ta"
                    ? "அறிகுறிகளை விவரிக்கவும் (எ.கா: கடுமையான நெஞ்சு வலி, மூச்சுத் திணறல், இடது கை வலி... அல்லது மேலே உள்ள மைக்கை அழுத்தி பேசவும்)"
                    : "Please describe symptoms in detail (e.g., severe tightness in the chest, breathing difficulty, radiating left arm pain... or click mic above to speak)"
                }
                rows={4}
                className="w-full border border-slate-200 rounded-2xl p-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/30 focus:bg-white transition-all duration-300 resize-none min-h-[110px]"
              />
            </div>

            {/* Visual Categorized Symptom Identifier */}
            <div className="space-y-3.5 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-black text-slate-800 tracking-tight">
                    {audioVoiceLang === "ta"
                      ? "🔍 அறிகுறிகளைக் கண்டறியும் வழிகாட்டி"
                      : "🔍 Visual Symptom Identifier"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    {audioVoiceLang === "ta"
                      ? "சரியான அறிகுறிகளைத் தேர்வு செய்ய கீழே உள்ள கார்டுகளை கிளிக் செய்க"
                      : "Click any card below to auto-fill accurate clinical descriptions"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuidedBuilder((prev) => !prev)}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  {showGuidedBuilder
                    ? "Close Builder"
                    : audioVoiceLang === "ta"
                    ? "வடிவமைக்க வழிகாட்டி"
                    : "Step-by-Step"}
                </button>
              </div>

              {/* Guided Symptom Builder Drawer */}
              {showGuidedBuilder && (
                <div className="bg-gradient-to-r from-slate-50 to-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-3 animate-slide-in">
                  <span className="text-[11px] font-black text-indigo-950 uppercase tracking-wide block">
                    Guided Symptom Assistant (உடலின் பகுதி வாரியாக)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase">
                        1. Body Region (பகுதி)
                      </label>
                      <select
                        value={builderBodyPart}
                        onChange={(e) => setBuilderBodyPart(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                      >
                        <option>Chest (மார்பு / நெஞ்சு)</option>
                        <option>Head & Brain (தலை / மூளை)</option>
                        <option>Stomach / Abdomen (வயிறு)</option>
                        <option>Arms & Legs (கை / கால்)</option>
                        <option>Whole Body / Systemic (முழு உடல்)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase">
                        2. Pain Type (வலியின் தன்மை)
                      </label>
                      <select
                        value={builderPainType}
                        onChange={(e) => setBuilderPainType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                      >
                        <option>
                          Severe Tightness / Crushing (கடுமையான இறுக்கம்)
                        </option>
                        <option>
                          Sharp Stabbing Pain (கடும் குத்தல் வலி)
                        </option>
                        <option>
                          Heavy Bleeding / Fracture (ரத்தப்போக்கு / முறிவு)
                        </option>
                        <option>Burning Sensation (கடும் எரிச்சல்)</option>
                        <option>Continuous Dull Ache (தொடர் வலி)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase">
                        3. Onset Time (தொடங்கிய நேரம்)
                      </label>
                      <select
                        value={builderDuration}
                        onChange={(e) => setBuilderDuration(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                      >
                        <option>
                          Sudden / Past 1 hour (திடீரென தொடங்கியது)
                        </option>
                        <option>Since morning (இன்று காலை முதல்)</option>
                        <option>Past 24 hours (கடந்த 1 நாளாக)</option>
                        <option>Gradual / Several days (சில நாட்களாக)</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyGuidedBuilder}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {audioVoiceLang === "ta"
                      ? "விவரத்தை அறிகுறிகளில் சேர்க்க"
                      : "Add Structured Symptom to Box"}
                  </button>
                </div>
              )}

              {/* Search input for symptoms */}
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={symptomSearchQuery}
                  onChange={(e) => setSymptomSearchQuery(e.target.value)}
                  placeholder={
                    audioVoiceLang === "ta"
                      ? "அறிகுறிகளைத் தேட (எ.கா: chest, நெஞ்சு, வலி, காய்ச்சல், accident, breath)..."
                      : "Search symptoms (e.g. chest pain, vali, fever, breath, accident)..."
                  }
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                />
                {symptomSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSymptomSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px] font-bold">
                {SYMPTOM_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                      selectedCategory === cat.id
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100/80 hover:bg-slate-200 text-slate-650"
                    }`}
                  >
                    <span>{audioVoiceLang === "ta" ? cat.nameTa : cat.nameEn}</span>
                  </button>
                ))}
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {filteredSymptoms.map((sym) => {
                  const isSelected = selectedSymptomIds.includes(sym.id);
                  return (
                    <div
                      key={sym.id}
                      onClick={() => handleSelectSymptomItem(sym)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left flex items-start justify-between gap-3 ${
                        isSelected
                          ? "bg-blue-50/80 border-blue-400 shadow-sm ring-1 ring-blue-300"
                          : "bg-white hover:bg-slate-50 border-slate-200/80 shadow-2xs hover:border-blue-200"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              sym.severity === "High"
                                ? "bg-rose-100 text-rose-700 border border-rose-200"
                                : sym.severity === "Medium"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {audioVoiceLang === "ta" ? sym.badgeTa : sym.badge}
                          </span>
                          <h4 className="text-xs font-black text-slate-800">
                            {sym.titleEn}
                          </h4>
                        </div>
                        <p className="text-[11px] font-bold text-blue-800/90 leading-tight">
                          {sym.titleTa}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                          {audioVoiceLang === "ta"
                            ? sym.descriptionTa
                            : sym.descriptionEn}
                        </p>
                      </div>

                      <button
                        type="button"
                        className={`shrink-0 h-7 w-7 rounded-xl flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600"
                        }`}
                      >
                        {isSelected ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
                {filteredSymptoms.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400 font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    {audioVoiceLang === "ta"
                      ? "பொருந்தும் அறிகுறிகள் எதுவும் இல்லை. உங்கள் அறிகுறிகளை மேலே உள்ள மைக்கை அழுத்தி பேசலாம்."
                      : "No matching symptoms found. You can speak your symptoms using the microphone above."}
                  </div>
                )}
              </div>
            </div>

            {/* AI Diagnostics run button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleRunAIAnalysis(e);
              }}
              disabled={analyzing}
              className="w-full py-4.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-2xl shadow-lg shadow-blue-500/15 hover:shadow-xl hover:translate-y-[-1px] transition-all duration-250 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Triaging
                  symptoms...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Run AI Triage Analysis
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Triage results & ranked list (col-span-12 md:col-span-6 lg:col-span-7) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-7 space-y-6">
          {/* AI Result Card */}
          {aiResult && (
            <div className="healthcare-card-shadow bg-white rounded-3xl p-6 border border-slate-100 space-y-5 animate-slide-in relative overflow-hidden transition-all duration-300 hover:shadow-md">
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  aiResult.emergency_severity === "High"
                    ? "bg-red-500"
                    : aiResult.emergency_severity === "Medium"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
              ></div>

              <div className="flex justify-between items-start gap-4 pb-2 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                      Clinical Diagnostic Summary
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      Gemini Triage Model v1.5
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                    aiResult.emergency_severity === "High"
                      ? "bg-red-50 text-red-655 border border-red-200 shadow-sm"
                      : aiResult.emergency_severity === "Medium"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {aiResult.emergency_severity} Severity Triage
                </span>
              </div>

              {/* Audio Listen Bar for Illiterate / Panic Patients */}
              <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/70 to-slate-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-xs ${
                      isSpeaking
                        ? "bg-rose-600 text-white animate-pulse"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {isSpeaking ? (
                      <Volume2 className="h-5 w-5" />
                    ) : (
                      <Volume1 className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">
                      {audioVoiceLang === "ta"
                        ? "மருத்துவ அறிக்கையைக் கேட்க (Voice Audio)"
                        : "Listen to Diagnosis & First Aid (Audio)"}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      {audioVoiceLang === "ta"
                        ? "படிக்கத் தெரியாதவர்களுக்காக குரல் வழியே விளக்கப்படும்"
                        : "Voice readout of condition, severity & first aid"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setAudioVoiceLang((prev) => (prev === "ta" ? "en" : "ta"));
                    }}
                    className="px-2.5 py-1.5 bg-white border border-blue-200 rounded-xl text-[10px] font-black text-blue-700 flex items-center gap-1 shadow-2xs hover:bg-blue-50 cursor-pointer"
                  >
                    <Languages className="h-3.5 w-3.5" />
                    {audioVoiceLang === "ta" ? "தமிழ்" : "English"}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleReadTriageResults();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                      isSpeaking
                        ? "bg-rose-600 text-white hover:bg-rose-700 animate-pulse"
                        : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02]"
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <Square className="h-3.5 w-3.5" /> Stop Audio
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" /> Play Voice (கேட்க)
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Alert for High Priority */}
              {aiResult.emergency_severity === "High" && (
                <div className="bg-red-50/50 border border-red-100/80 p-4 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-655 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-red-900 uppercase tracking-wider">
                      High Severity Condition Detected
                    </h4>
                    <p className="text-[11px] text-red-750 font-semibold leading-relaxed mt-0.5">
                      Diagnostic metrics indicate severe risks. Continuous GPS
                      tracking is active. Verify appointments immediately.
                    </p>
                  </div>
                </div>
              )}

              {/* Metrics layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40">
                  <span className="text-[9px] text-slate-400 font-black uppercase block tracking-wider">
                    Possible Condition
                  </span>
                  <p className="text-xs font-black text-slate-800 mt-1">
                    {aiResult.possible_condition}
                  </p>
                </div>

                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40">
                  <span className="text-[9px] text-slate-400 font-black uppercase block tracking-wider">
                    Suggested Specialty Department
                  </span>
                  <p className="text-xs font-black text-slate-800 mt-1">
                    {aiResult.recommended_department}
                  </p>
                </div>
              </div>

              {/* First Aid Guidelines */}
              <div className="space-y-3 pt-1">
                <span className="block text-[10px] font-black text-slate-450 uppercase tracking-wider">
                  Clinical First Aid Guidelines
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aiResult.first_aid.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 text-xs text-slate-650 bg-slate-50/30 p-3 rounded-2xl border border-slate-100/50 font-semibold leading-relaxed"
                    >
                      <span className="h-5 w-5 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 border border-blue-100">
                        {idx + 1}
                      </span>
                      <p className="pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location selection tools */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Set Incident Location (India Geofence Only)
                </span>

                <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleUseCurrentLocation(e);
                    }}
                    disabled={fetchingGps || searchingHospitals}
                    className="py-3 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/50 rounded-xl text-xs font-black text-blue-700 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all duration-300 shadow-sm"
                  >
                    {fetchingGps ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Compass className="h-4 w-4" />
                    )}
                    📍 Use Current Location
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setLocOption((prev) =>
                        prev === "manual" ? null : "manual",
                      );
                    }}
                    className="py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-300 shadow-sm"
                  >
                    <MapPin className="h-4 w-4" />
                    📍 Select Location
                  </button>
                </div>

                {/* Live GPS Verification Panel */}
                {currentCoords && locOption === "gps" && (
                  <div className="max-w-lg mx-auto bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs text-slate-700 space-y-2.5 animate-slide-in">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-blue-900 flex items-center gap-1.5 text-xs">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        Live GPS Position Detected
                      </span>
                      {gpsAccuracy !== null && (
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-blue-100">
                          Accuracy: ±{Math.round(gpsAccuracy)}m
                        </span>
                      )}
                    </div>

                    <p className="text-slate-800 font-black text-xs leading-snug">
                      📍 {gpsText}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-blue-100">
                      <a
                        href={`https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        🗺️ Verify My Pin on Google Maps ↗
                      </a>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Click to confirm Google Maps pin matches your exact building/street
                      </span>
                    </div>

                    {gpsAccuracy !== null && gpsAccuracy > 500 && (
                      <div className="text-[10.5px] text-amber-800 bg-amber-50/90 border border-amber-200/80 p-2.5 rounded-xl font-medium">
                        💡 <strong>Wi-Fi / Desktop Location:</strong> Desktop browsers estimate location via internet broadband. If this is not your exact street, click <strong>"Select Location"</strong> to type your Landmark/Area for 100% precision.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* manual form address */}
              {locOption === "manual" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleManualLocationSubmit(e);
                  }}
                  className="bg-slate-50/50 rounded-2xl p-5 border border-slate-150 space-y-4 animate-slide-in"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Search Indian Address Details (All States Supported)
                    </h4>
                  </div>

                  {/* 1. Quick State Filter Tabs */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                        Quick Select State:
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {[
                        "Tamil Nadu",
                        "Karnataka",
                        "Maharashtra",
                        "Delhi",
                        "Kerala",
                        "Uttar Pradesh",
                        "Rajasthan",
                        "Gujarat",
                        "West Bengal",
                        "Telangana",
                        "Andhra Pradesh",
                        "Punjab",
                        "Haryana",
                        "Madhya Pradesh",
                        "Bihar",
                        "Odisha",
                        "Assam",
                        "Goa",
                        "Uttarakhand",
                        "Himachal Pradesh",
                        "Chhattisgarh",
                        "Jharkhand",
                      ].map((st) => {
                        const isSelected = (state === st || selectedStateFilter === st);
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              setSelectedStateFilter(st);
                              setState(st);
                              setCity("");
                              setLandmark("");
                            }}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all border ${
                              isSelected
                                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                : "bg-white text-slate-650 hover:bg-slate-100 border-slate-200"
                            }`}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Primary Landmark / Incident Location Input */}
                  <div className="bg-white p-3.5 rounded-xl border-2 border-blue-200/80 shadow-xs space-y-1.5">
                    <label className="block text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                      <span className="text-base text-red-500">📍</span> Enter Landmark / Area / Location:
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Thiruparankundram, Simmakkal, Goripalayam, Anna Nagar, Periyar Bus Stand..."
                      className="w-full border border-slate-200 bg-slate-50/50 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">
                      Whichever landmark or locality you type will be set as your incident location and matched with real driving routes.
                    </p>
                  </div>

                  {/* 3. Optional State, City & Pincode Inputs */}
                  <div className="grid grid-cols-3 gap-2.5 text-xs font-semibold text-slate-655 bg-white p-3.5 rounded-xl border border-slate-100 font-sans">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">
                        State (Optional)
                      </label>
                      <select
                        value={state}
                        onChange={(e) => {
                          const val = e.target.value;
                          setState(val);
                          setSelectedStateFilter(val);
                        }}
                        className="w-full border border-slate-200 bg-slate-50/50 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">-- All States --</option>
                        {Object.keys(INDIAN_STATES_CITIES).map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">
                        City (Optional)
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Madurai..."
                        className="w-full border border-slate-200 bg-slate-50/50 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">
                        Pincode (Optional)
                      </label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="e.g. 625001"
                        className="w-full border border-slate-200 bg-slate-50/50 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={geocoding}
                    onClick={(e) => {
                      e.preventDefault();
                      handleManualLocationSubmit(e);
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {geocoding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Search Hospitals"
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Hospital recommendations list */}
        {(searchingHospitals || hospitals.length > 0) &&
          (!aiResult || aiResult.emergency_severity !== "High") && (
            <div className="col-span-12 bg-white rounded-3xl p-6 border border-slate-100 space-y-4 transition-all duration-300">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                      Nearby Hospital Search Results
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      Top 10 Ranked by Treatment Speed Score
                    </p>
                  </div>
                </div>
              </div>

              {searchingHospitals ? (
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-12 text-center space-y-3 flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-600">
                    Calculating hospital treatment speeds...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* AI Explanation Banner */}
                  {recommendationReason && (
                    <div className="bg-blue-50/50 border border-blue-150 rounded-2xl p-4 space-y-1 shadow-sm">
                      <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="h-4 w-4" /> AI Recommendation
                        Explanation
                      </h4>
                      <p className="text-xs text-blue-800 font-semibold leading-relaxed">
                        {recommendationReason}
                      </p>
                    </div>
                  )}

                  {/* Clean, continuous vertical list layout for all 10 hospitals */}
                  <div className="space-y-3.5">
                    {hospitals.slice(0, 10).map((hosp, idx) => {
                      if (idx === 0) {
                        // Highlighted Best Choice Hospital Card
                        return (
                          <div
                            key={hosp.id}
                            className="bg-gradient-to-br from-blue-50/30 via-white to-blue-50/10 border-2 border-blue-600 shadow-xl rounded-3xl p-6 relative overflow-hidden animate-scale-in"
                          >
                            {/* AI Recommended Badge */}
                            <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1.5 text-[9px] font-black uppercase rounded-bl-2xl shadow-md tracking-wider flex items-center gap-1">
                              ⭐ AI Best Recommended Hospital
                            </div>

                            <div className="space-y-4">
                              <div>
                                <div className="flex flex-wrap gap-1.5 items-center mb-2">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full font-black text-[9px] uppercase tracking-wider">
                                    ⭐ Best Choice • {hosp.recommendation_score}
                                    % Match
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-750 rounded-full font-black text-[9px] uppercase tracking-wider">
                                    {hosp.hospital_type || "Private"}
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full font-black text-[9px] uppercase tracking-wider">
                                    ★ {hosp.rating || "4.0"} / 5 Rating
                                  </span>
                                </div>
                                <h4 className="text-base font-black text-slate-850">
                                  {hosp.name}
                                </h4>
                                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                  {hosp.address}, {hosp.city}, {hosp.district},{" "}
                                  {hosp.state}
                                </p>
                              </div>

                              {/* Specialties/Departments selection */}
                              {hosp.specialties &&
                                hosp.specialties.length > 0 && (
                                  <div className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 text-[10px] font-semibold text-slate-650">
                                    <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">
                                      Available Specialties
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {hosp.specialties.map((s) => (
                                        <span
                                          key={s}
                                          className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-md font-bold"
                                        >
                                          {s}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              {/* Highlights details grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-650 leading-none">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">📍</span>
                                    <span>
                                      Distance:{" "}
                                      <strong className="text-slate-850 font-bold">
                                        {hosp.distance_km} km
                                      </strong>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">🕒</span>
                                    <span>
                                      Travel ETA:{" "}
                                      <strong className="text-slate-850 font-bold">
                                        {hosp.eta_minutes} mins
                                      </strong>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">⏳</span>
                                    <span>
                                      ER Waiting Time:{" "}
                                      <strong className="text-slate-850 font-bold">
                                        {hosp.er_wait_minutes} mins
                                      </strong>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">📞</span>
                                    <span>
                                      Phone:{" "}
                                      <strong className="text-blue-600 font-black">
                                        {hosp.phone || "N/A"}
                                      </strong>
                                    </span>
                                  </div>
                                  {hosp.email && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-400">✉</span>
                                      <span>
                                        Email:{" "}
                                        <strong className="text-blue-600 font-black">
                                          {hosp.email}
                                        </strong>
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">👨‍⚕️</span>
                                    <span>
                                      Doctor Availability:{" "}
                                      <strong
                                        className={
                                          hosp.available_doctors > 0
                                            ? "text-emerald-600 font-black"
                                            : "text-rose-500"
                                        }
                                      >
                                        {hosp.available_doctors > 0
                                          ? `Yes (${hosp.available_doctors} vacant)`
                                          : "No"}
                                      </strong>
                                    </span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <span className="text-slate-400">🛏</span>
                                    <div>
                                      <span className="block mb-1">
                                        Bed Vacancies:
                                      </span>
                                      <div className="text-[10px] text-slate-500 font-bold space-y-1">
                                        <span className="inline-block bg-slate-50 border border-slate-200 px-2 py-0.5 rounded mr-1">
                                          ICU: {hosp.available_icu_beds}
                                        </span>
                                        <span className="inline-block bg-slate-50 border border-slate-200 px-2 py-0.5 rounded mr-1">
                                          General: {hosp.available_general_beds}
                                        </span>
                                        <span className="inline-block bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                                          Emergency: {hosp.emergency_beds}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">🚨</span>
                                    <span>
                                      24/7 Emergency:{" "}
                                      <strong className="text-emerald-600 font-black">
                                        {hosp.emergency_24_7 !== false
                                          ? "Yes"
                                          : "No"}
                                      </strong>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">🚑</span>
                                    <span>
                                      Ambulance Active:{" "}
                                      <strong className="text-emerald-600 font-black">
                                        {hosp.ambulance_available !== false
                                          ? "Yes"
                                          : "No"}
                                      </strong>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">👥</span>
                                    <span>
                                      Queue Count:{" "}
                                      <strong className="text-slate-800 font-black">
                                        {hosp.queue_count} in line
                                      </strong>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                  {hosp.phone && (
                                    <a
                                      href={`tel:${hosp.phone}`}
                                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
                                    >
                                      📞 Call Hospital
                                    </a>
                                  )}
                                  <a
                                    href={`https://www.google.com/maps/dir/?api=1${
                                      currentCoords
                                        ? `&origin=${currentCoords.lat},${currentCoords.lng}`
                                        : ""
                                    }&destination=${hosp.latitude},${hosp.longitude}&travelmode=driving`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
                                  >
                                    📍 Navigate
                                  </a>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedHospital(hosp);
                                    document
                                      .getElementById("booking-form")
                                      ?.scrollIntoView({ behavior: "smooth" });
                                  }}
                                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all duration-200 hover:translate-y-[-1px] cursor-pointer"
                                >
                                  Book Appointment
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Remaining Ranked Hospitals
                      return (
                        <div
                          key={hosp.id}
                          className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all duration-200 relative overflow-hidden healthcare-card-hover"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <div className="flex flex-wrap gap-1 items-center mb-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded font-black text-[9px] uppercase tracking-wider">
                                  {hosp.hospital_type || "Private"}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded font-black text-[9px] uppercase tracking-wider">
                                  ★ {hosp.rating || "4.0"} / 5 Rating
                                </span>
                              </div>
                              <h4 className="text-xs font-black text-slate-850">
                                {hosp.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                {hosp.address}, {hosp.city}, {hosp.district},{" "}
                                {hosp.state}
                              </p>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[9px] text-blue-600 font-bold">
                                {hosp.phone && (
                                  <span>📞 Contact: {hosp.phone}</span>
                                )}
                                {hosp.email && (
                                  <span>✉ Email: {hosp.email}</span>
                                )}
                              </div>
                            </div>
                            <span className="text-[9px] font-black text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200 font-sans shrink-0">
                              Rank #{idx + 1} • {hosp.recommendation_score}%
                              Match
                            </span>
                          </div>

                          {/* Specialties/Departments selection */}
                          {hosp.specialties && hosp.specialties.length > 0 && (
                            <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100/70 text-[9px] font-semibold text-slate-655">
                              <span className="text-[8px] text-slate-400 font-bold block uppercase mb-1">
                                Available Specialties
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {hosp.specialties.map((s) => (
                                  <span
                                    key={s}
                                    className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-700 rounded font-bold"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Details grid layout */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold text-slate-655 pt-2 border-t border-slate-50">
                            <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                              <span className="text-[9px] text-slate-400 font-bold block">
                                Distance / ETA
                              </span>
                              <span className="text-slate-800 font-extrabold">
                                {hosp.distance_km} km / {hosp.eta_minutes} mins
                              </span>
                            </div>

                            <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                              <span className="text-[9px] text-slate-400 font-bold block">
                                Waiting Time
                              </span>
                              <span className="text-slate-800 font-extrabold">
                                {hosp.er_wait_minutes} mins
                              </span>
                            </div>

                            <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                              <span className="text-[9px] text-slate-400 font-bold block">
                                Doctors Available
                              </span>
                              <span
                                className={`font-black ${hosp.available_doctors > 0 ? "text-emerald-600" : "text-rose-500"}`}
                              >
                                {hosp.available_doctors > 0
                                  ? `${hosp.available_doctors} vacant`
                                  : "None"}
                              </span>
                            </div>

                            <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                              <span className="text-[9px] text-slate-400 font-bold block">
                                Queue Count
                              </span>
                              <span className="text-slate-800 font-extrabold">
                                {hosp.queue_count} in line
                              </span>
                            </div>
                          </div>

                          {/* Bed vacancies & Services */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-semibold text-slate-655 pt-1">
                            <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                              <span className="text-[9px] text-slate-400 font-bold block">
                                ICU Beds
                              </span>
                              <span className="text-slate-850 font-bold">
                                {hosp.available_icu_beds} vacant
                              </span>
                            </div>
                            <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                              <span className="text-[9px] text-slate-400 font-bold block">
                                General Beds
                              </span>
                              <span className="text-slate-855 font-bold">
                                {hosp.available_general_beds} vacant
                              </span>
                            </div>
                            <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                              <span className="text-[9px] text-slate-400 font-bold block">
                                Emergency Beds
                              </span>
                              <span className="text-slate-855 font-bold">
                                {hosp.emergency_beds} vacant
                              </span>
                            </div>
                            <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100 col-span-1">
                              <span className="text-[9px] text-slate-400 font-bold block">
                                24/7 Emergency
                              </span>
                              <span className="text-emerald-600 font-black">
                                {hosp.emergency_24_7 !== false ? "Yes" : "No"}
                              </span>
                            </div>
                            <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100 col-span-1">
                              <span className="text-[9px] text-slate-400 font-bold block">
                                Ambulance
                              </span>
                              <span className="text-emerald-600 font-black">
                                {hosp.ambulance_available !== false
                                  ? "Yes"
                                  : "No"}
                              </span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100/60 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5">
                              {hosp.phone && (
                                <a
                                  href={`tel:${hosp.phone}`}
                                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10.5px] rounded-xl flex items-center gap-1 transition-all"
                                >
                                  📞 Call Hospital
                                </a>
                              )}
                              <a
                                href={`https://www.google.com/maps/dir/?api=1${
                                  currentCoords
                                    ? `&origin=${currentCoords.lat},${currentCoords.lng}`
                                    : ""
                                }&destination=${hosp.latitude},${hosp.longitude}&travelmode=driving`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10.5px] rounded-xl flex items-center gap-1 transition-all"
                              >
                                📍 Navigate
                              </a>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedHospital(hosp);
                                document
                                  .getElementById("booking-form")
                                  ?.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-xl shadow-sm transition-all duration-200 hover:translate-y-[-1px] cursor-pointer"
                            >
                              Book Appointment
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
      </main>
    </div>
  );
};

export default PatientDashboard;
