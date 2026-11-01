/**
 * Rich Bilingual Symptom Catalog for Patient Triage
 * Designed for intuitive visual identification, Tamil/English bilingual clarity,
 * and automatic clinical text construction.
 */

export interface SymptomItem {
  id: string;
  category:
    | "critical"
    | "heart"
    | "breath"
    | "brain"
    | "trauma"
    | "bleeding"
    | "stomach"
    | "fever"
    | "maternity";
  titleEn: string;
  titleTa: string;
  descriptionEn: string;
  descriptionTa: string;
  severity: "High" | "Medium" | "Low";
  badge: string;
  badgeTa: string;
  icon: string;
  clinicalText: string;
  keywords: string[];
}

export interface SymptomCategory {
  id: string;
  nameEn: string;
  nameTa: string;
  icon: string;
}

export const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  { id: "all", nameEn: "All Symptoms", nameTa: "அனைத்தும்", icon: "Sparkles" },
  { id: "critical", nameEn: "🚨 Emergency / Critical", nameTa: "🚨 அவசரம்", icon: "AlertTriangle" },
  { id: "heart", nameEn: "🫀 Chest & Heart", nameTa: "🫀 நெஞ்சு / இதயம்", icon: "Heart" },
  { id: "breath", nameEn: "🫁 Breathing & Lungs", nameTa: "🫁 மூச்சுத் திணறல்", icon: "Activity" },
  { id: "brain", nameEn: "🧠 Head & Brain", nameTa: "🧠 தலை / மயக்கம்", icon: "Brain" },
  { id: "trauma", nameEn: "🦴 Accidents & Bones", nameTa: "🦴 விபத்து / எலும்பு", icon: "ShieldAlert" },
  { id: "bleeding", nameEn: "🩸 Bleeding & Cuts", nameTa: "🩸 ரத்தப்போக்கு", icon: "Droplet" },
  { id: "stomach", nameEn: "🤢 Stomach & Bites", nameTa: "🤢 வயிறு / விஷக்கடி", icon: "Stethoscope" },
  { id: "fever", nameEn: "🤒 Fever & Infection", nameTa: "🤒 காய்ச்சல்", icon: "Thermometer" },
  { id: "maternity", nameEn: "🤰 Pregnancy Emergency", nameTa: "🤰 பிரசவ அவசரம்", icon: "HeartPulse" },
];

export const SYMPTOM_CATALOG: SymptomItem[] = [
  // ── 1. Critical & Heart ──
  {
    id: "chest-pain-severe",
    category: "heart",
    titleEn: "Severe Chest Pain / Heart Attack",
    titleTa: "கடுமையான நெஞ்சு வலி / மாரடைப்பு",
    descriptionEn: "Crushing chest tightness, pain spreading to left shoulder or jaw, profuse sweating.",
    descriptionTa: "மார்பில் கடுமையான பாரம், இடது கை அல்லது தாடைக்கு பரவும் வலி, அதிக வியர்வை.",
    severity: "High",
    badge: "Critical 108",
    badgeTa: "உயிர் காக்கும் அவசரம்",
    icon: "HeartPulse",
    clinicalText: "Severe crushing chest pain with chest tightness, radiation to left arm and back, cold sweating.",
    keywords: ["chest", "pain", "heart", "attack", "cardiac", "nenju", "vali", "maradaippu", "நெஞ்சு", "வலி", "மாரடைப்பு"],
  },
  {
    id: "irregular-heartbeat",
    category: "heart",
    titleEn: "Rapid Heart Palpitations & Dizziness",
    titleTa: "தீவிர நெஞ்சு படபடப்பு & மயக்கம்",
    descriptionEn: "Heart racing uncontrollably, fluttering sensation, dizziness, sudden fatigue.",
    descriptionTa: "இதயம் மிக வேகமாகத் துடித்தல், தலைசுற்றல், நெஞ்சில் நடுக்கம், மூச்சுத் திணறல்.",
    severity: "High",
    badge: "Urgent Care",
    badgeTa: "அவசர பரிசோதனை",
    icon: "Heart",
    clinicalText: "Severe cardiac palpitations, tachycardia, acute dizziness and near-syncope.",
    keywords: ["palpitation", "heartbeat", "racing", "nenju", "padapadappu", "படபடப்பு", "மயக்கம்"],
  },

  // ── 2. Breathing & Lungs ──
  {
    id: "breathing-difficulty",
    category: "breath",
    titleEn: "Severe Breathing Difficulty / Gasping",
    titleTa: "கடும் மூச்சுத் திணறல் / சுவாசிக்க முடியாமை",
    descriptionEn: "Unable to catch breath, noisy wheezing, blue lips, struggling while sitting or lying.",
    descriptionTa: "மூச்சு விட கடும் சிரமம், மூச்சிரைப்பு, உதடுகள் நீலமாதல், உட்காரவோ படுக்கவோ முடியாமை.",
    severity: "High",
    badge: "Critical Airway",
    badgeTa: "சுவாச அவசரம்",
    icon: "Activity",
    clinicalText: "Acute severe respiratory distress, acute dyspnea, wheezing and stridor, low oxygen saturation.",
    keywords: ["breath", "breathing", "choking", "asthma", "suffocation", "moochu", "thinaral", "மூச்சு", "திணறல்"],
  },
  {
    id: "choking-obstruction",
    category: "breath",
    titleEn: "Foreign Body Choking / Suffocation",
    titleTa: "தொண்டையில் அடைப்பு / மூச்சுத் திணறல்",
    descriptionEn: "Food or object stuck in throat, silent coughing, unable to speak or breathe.",
    descriptionTa: "தொண்டையில் உணவு அல்லது பொருள் மாட்டிக்கொள்ளுதல், பேசவோ மூச்சுவிடவோ இயலாமை.",
    severity: "High",
    badge: "Immediate Action",
    badgeTa: "உடனடி முதலுதவி",
    icon: "AlertTriangle",
    clinicalText: "Acute foreign body airway obstruction, inability to phonate or ventilate.",
    keywords: ["choking", "throat", "swallow", "suffocate", "adaipu", "thondai", "அடைப்பு"],
  },

  // ── 3. Brain & Stroke ──
  {
    id: "stroke-paralysis",
    category: "brain",
    titleEn: "Stroke / Sudden Body Paralysis",
    titleTa: "பக்கவாதம் / கை, கால் மரத்துப்போதல்",
    descriptionEn: "One-sided face drooping, unable to lift one arm, slurred or garbled speech.",
    descriptionTa: "முகம் ஒரு பக்கமாக இழுத்தல், ஒரு கையை தூக்க முடியாமை, பேச்சு குழறுதல்.",
    severity: "High",
    badge: "Golden Hour Stroke",
    badgeTa: "பக்கவாத அவசரம்",
    icon: "Brain",
    clinicalText: "Suspected acute stroke (FAST positive), sudden unilateral hemiparesis, facial asymmetry, dysarthria.",
    keywords: ["stroke", "paralysis", "numbness", "speech", "slurred", "pakkavatham", "marathu", "பக்கவாதம்"],
  },
  {
    id: "unconscious-fainting",
    category: "brain",
    titleEn: "Loss of Consciousness / Fainting",
    titleTa: "மயக்கம் / திடீர் சுயநினைவின்மை",
    descriptionEn: "Patient collapsed, unresponsive to voice or pinch, eyes closed, pale skin.",
    descriptionTa: "திடீரென மயங்கி விழுதல், குரல் கொடுத்தாலும் பேசாத நிலை, சுயநினைவு இழப்பு.",
    severity: "High",
    badge: "Critical 108",
    badgeTa: "சுயநினைவின்மை",
    icon: "AlertTriangle",
    clinicalText: "Sudden syncope, unresponsive patient, GCS reduction, prolonged loss of consciousness.",
    keywords: ["unconscious", "faint", "fainting", "blackout", "collapse", "mayakkam", "மயக்கம்"],
  },
  {
    id: "severe-headache-vomiting",
    category: "brain",
    titleEn: "Sudden 'Thunderclap' Headache",
    titleTa: "தாங்க முடியாத தலைவலி / தலைசுற்றல்",
    descriptionEn: "Worst headache of life, sudden explosion of pain in head, stiff neck, vomiting.",
    descriptionTa: "வாழ்க்கையிலேயே இல்லாத மிகக் கொடூரமான தலைவலி, கழுத்து விரைப்பு, பார்வை மங்குதல்.",
    severity: "High",
    badge: "Neurological Alert",
    badgeTa: "நரம்பியல் அவசரம்",
    icon: "Brain",
    clinicalText: "Acute sudden thunderclap headache, meningismus, neck stiffness, intractable nausea.",
    keywords: ["headache", "head", "pain", "migraine", "thalai", "vali", "தலைவலி", "தலை"],
  },

  // ── 4. Accidents, Bones & Trauma ──
  {
    id: "road-accident-trauma",
    category: "trauma",
    titleEn: "Road Accident / Severe Vehicle Crash",
    titleTa: "வாகன விபத்து / பலத்த மோதல் காயம்",
    descriptionEn: "Bike or car collision, physical impact, multiple visible wounds, head or spine injury.",
    descriptionTa: "பைக் அல்லது கார் விபத்து, பலத்த காயம், உடலில் ரத்தக் காயங்கள், தலையில் அடிபடுதல்.",
    severity: "High",
    badge: "Trauma Emergency",
    badgeTa: "விபத்து அவசரம்",
    icon: "ShieldAlert",
    clinicalText: "Road traffic accident (RTA) victim, blunt multi-system trauma, visible contusions and abrasions.",
    keywords: ["accident", "crash", "collision", "bike", "car", "vibathu", "vabathu", "விபத்து", "காயம்"],
  },
  {
    id: "bone-fracture",
    category: "trauma",
    titleEn: "Bone Fracture / Broken Arm or Leg",
    titleTa: "எலும்பு முறிவு / நடக்க முடியாமை",
    descriptionEn: "Visible limb deformity, intense localized swelling, popping sound, unable to move limb.",
    descriptionTa: "கை அல்லது காலில் எலும்பு முறிவு, பயங்கர வீக்கம், கையை/காலை அசைக்க முடியாமை.",
    severity: "Medium",
    badge: "Orthopedic",
    badgeTa: "எலும்பு முறிவு",
    icon: "ShieldAlert",
    clinicalText: "Suspected closed/open bone fracture, acute localized angulation deformity, inability to bear weight.",
    keywords: ["fracture", "bone", "broken", "leg", "arm", "elumbu", "murivu", "odinju", "எலும்பு", "முறிவு"],
  },

  // ── 5. Bleeding & Cuts ──
  {
    id: "severe-bleeding",
    category: "bleeding",
    titleEn: "Uncontrolled Bleeding / Deep Laceration",
    titleTa: "அதிக ரத்தப்போக்கு / ஆழமான வெட்டு",
    descriptionEn: "Pumping or heavily flowing blood that does not stop with a cloth or direct pressure.",
    descriptionTa: "துணியால் அழுத்திப் பிடித்தும் நிற்காத தொடர் ரத்தப்போக்கு, ஆழமான வெட்டுக்காயம்.",
    severity: "High",
    badge: "Hemorrhage Alert",
    badgeTa: "அதிதீவிர ரத்தப்போக்கு",
    icon: "Droplet",
    clinicalText: "Active arterial/venous hemorrhage, deep open laceration, heavy blood volume loss.",
    keywords: ["bleed", "bleeding", "blood", "wound", "cut", "ratham", "iratham", "ரத்தம்", "வெட்டு"],
  },
  {
    id: "severe-burns",
    category: "bleeding",
    titleEn: "Severe Thermal Burns / Scalds",
    titleTa: "தீக்காயம் / வெந்நீர் அல்லது எண்ணெய் படுதல்",
    descriptionEn: "Skin charred, raw or blistering from fire, boiling water, steam or chemicals.",
    descriptionTa: "தீ, சுடுநீர் அல்லது சூடான எண்ணெய் பட்டு தோல் கொப்புளித்தல், கடும் எரிச்சல்.",
    severity: "Medium",
    badge: "Burn Center",
    badgeTa: "தீக்காய சிகிச்சை",
    icon: "AlertTriangle",
    clinicalText: "Extensive thermal burns, blistering erythema, second-to-third degree tissue involvement.",
    keywords: ["burn", "burns", "fire", "scald", "theekayam", "thee", "தீக்காயம்", "தீ"],
  },

  // ── 6. Stomach, Poison & Bites ──
  {
    id: "snake-insect-bite",
    category: "stomach",
    titleEn: "Snake Bite / Venomous Insect Sting",
    titleTa: "பாம்பு கடி / விஷ வண்டு கடி",
    descriptionEn: "Puncture fang marks, intense burning pain, swelling spreading up the limb, sweating.",
    descriptionTa: "பாம்பு கடித்த பற்கள் தடம், தாங்க முடியாத எரிச்சல் வலி, விரைவாகப் பரவும் வீக்கம்.",
    severity: "High",
    badge: "Anti-Venom Critical",
    badgeTa: "விஷமுறிவு அவசரம்",
    icon: "AlertTriangle",
    clinicalText: "Suspected venomous snakebite envenomation, dual fang puncture wounds, rapid ascending edema.",
    keywords: ["snake", "bite", "venom", "sting", "paambu", "kadi", "visham", "பாம்பு", "கடி", "விஷம்"],
  },
  {
    id: "food-poisoning-vomiting",
    category: "stomach",
    titleEn: "Severe Food Poisoning / Constant Vomiting",
    titleTa: "உணவு நச்சு / தொடர் வாந்தி & வயிற்றுப்போக்கு",
    descriptionEn: "Cannot keep water down, continuous vomiting, watery diarrhea, extreme weakness.",
    descriptionTa: "தண்ணீர் கூட குடிக்க முடியாத தொடர் வாந்தி, பேதி, கடுமையான மயக்கம், நடுக்கம்.",
    severity: "Medium",
    badge: "Urgent Care",
    badgeTa: "நீரிழப்பு சிகிச்சை",
    icon: "Stethoscope",
    clinicalText: "Severe acute gastroenteritis, intractable vomiting, persistent diarrhea, severe volume depletion.",
    keywords: ["food", "poison", "vomit", "vomiting", "diarrhea", "vanthi", "vayiru", "வாந்தி", "வயிறு"],
  },
  {
    id: "acute-abdominal-pain",
    category: "stomach",
    titleEn: "Acute Abdominal Pain / Appendicitis",
    titleTa: "கடுமையான வயிற்று வலி (அப்பெண்டிசைடிஸ்)",
    descriptionEn: "Sharp stabbing pain in lower right abdomen, unable to stand straight, fever.",
    descriptionTa: "வயிற்றின் வலது கீழ் பகுதியில் தாங்க முடியாத குத்தல் வலி, நிற்க முடியாத நிலை, காய்ச்சல்.",
    severity: "Medium",
    badge: "Surgical Evaluation",
    badgeTa: "அறுவைசிகிச்சை தேவை",
    icon: "Stethoscope",
    clinicalText: "Acute severe localized right iliac fossa abdominal pain, rebound tenderness, suspected appendicitis.",
    keywords: ["abdominal", "stomach", "appendix", "belly", "pain", "vayiru", "vali", "வயிறு", "வலி"],
  },

  // ── 7. Fever & Infection ──
  {
    id: "high-grade-fever",
    category: "fever",
    titleEn: "High Fever (>102°F) & Shivering Chills",
    titleTa: "அதி தீவிர காய்ச்சல் / உடல் நடுக்கம்",
    descriptionEn: "Burning high temperature, severe shivering rigors, headache, body stiffness.",
    descriptionTa: "உடல் கொதிக்கும் காய்ச்சல், பல் கிட்டிப்போகும் நடுக்கம், கடுமையான தலைவலி, உடல் வலி.",
    severity: "Medium",
    badge: "Medical Care",
    badgeTa: "காய்ச்சல் பரிசோதனை",
    icon: "Thermometer",
    clinicalText: "High-grade acute pyrexia (>102.5°F), rigors, severe generalized myalgia, prostration.",
    keywords: ["fever", "temperature", "chills", "shivering", "kaichal", "nadukkam", "காய்ச்சல்", "நடுக்கம்"],
  },
  {
    id: "dengue-rash-fever",
    category: "fever",
    titleEn: "Dengue / Platelet Drop Alert (Bleeding / Red Spots)",
    titleTa: "டெங்கு காய்ச்சல் அறிகுறி / ரத்த தட்டணுக்கள் குறைவு",
    descriptionEn: "High fever with pain behind eyes, joint agony, tiny red spots on skin, extreme fatigue.",
    descriptionTa: "கண்களுக்குப் பின் வலி, மூட்டுகளில் தாங்க முடியாத வலி, தோலில் சிவப்பு புள்ளிகள்.",
    severity: "High",
    badge: "Platelet Monitoring",
    badgeTa: "டெங்கு அவசரம்",
    icon: "Thermometer",
    clinicalText: "High fever with retro-orbital pain, severe arthralgia (breakbone), petechial rash, suspected dengue.",
    keywords: ["dengue", "platelet", "fever", "rash", "dengu", "kaichal", "டெங்கு", "காய்ச்சல்"],
  },

  // ── 8. Pregnancy & Maternity ──
  {
    id: "pregnancy-labor-emergency",
    category: "maternity",
    titleEn: "Active Labor Pain / Pregnancy Emergency",
    titleTa: "கர்ப்பகால அவசரம் / தீவிர பிரசவ வலி",
    descriptionEn: "Frequent intense labor contractions, water breaking, unexpected pregnancy bleeding.",
    descriptionTa: "தொடர் பிரசவ வலி, பனிக்குடம் உடைந்து நீர் வெளியேறுதல், கர்ப்பகால ரத்தப்போக்கு.",
    severity: "High",
    badge: "Labor & Delivery",
    badgeTa: "பிரசவ வார்டு அவசரம்",
    icon: "HeartPulse",
    clinicalText: "Active third-trimester obstetric labor, painful uterine contractions, rupture of membranes.",
    keywords: ["pregnancy", "labor", "maternity", "delivery", "contractions", "prasavam", "garbham", "பிரசவம்", "கர்ப்பம்"],
  },
];
