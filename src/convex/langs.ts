// ─────────────────────────────────────────────────────────────────────────────
// Vyapar-Mind — Language registry
// Single source of truth for the 5 launch languages: Hindi, English, Tamil,
// Telugu and Kannada. Used by BOTH the backend agent (intent keywords, entity
// aliases, response language) and the frontend voice layer (STT/TTS locales,
// Sarvam language codes, demo utterances). Plain data — no server imports.
// ─────────────────────────────────────────────────────────────────────────────

export const LANG_CODES = ["hi", "en", "ta", "te", "kn"] as const;
export type Lang = (typeof LANG_CODES)[number];

export interface LangDef {
  /** Convex/lang id, e.g. "ta". */
  code: Lang;
  /** Display name (English) */
  label: string;
  /** Display name in the language itself */
  native: string;
  /** BCP-47 locale for Web Speech STT/TTS */
  locale: string;
  /** Sarvam STT language_code ("unknown" = auto-detect) */
  sarvamStt: string;
  /** Sarvam TTS target_language_code */
  sarvamTts: string;
}

export const LANGS: Record<Lang, LangDef> = {
  hi: {
    code: "hi",
    label: "Hindi",
    native: "हिन्दी",
    locale: "hi-IN",
    sarvamStt: "unknown",
    sarvamTts: "hi-IN",
  },
  en: {
    code: "en",
    label: "English",
    native: "English",
    locale: "en-IN",
    sarvamStt: "en-IN",
    sarvamTts: "en-IN",
  },
  ta: {
    code: "ta",
    label: "Tamil",
    native: "தமிழ்",
    locale: "ta-IN",
    sarvamStt: "ta-IN",
    sarvamTts: "ta-IN",
  },
  te: {
    code: "te",
    label: "Telugu",
    native: "తెలుగు",
    locale: "te-IN",
    sarvamStt: "te-IN",
    sarvamTts: "te-IN",
  },
  kn: {
    code: "kn",
    label: "Kannada",
    native: "ಕನ್ನಡ",
    locale: "kn-IN",
    sarvamStt: "kn-IN",
    sarvamTts: "kn-IN",
  },
};

export const isLang = (v: unknown): v is Lang =>
  typeof v === "string" && (LANG_CODES as readonly string[]).includes(v);

// ───────────────────── Intent keywords (per language) ─────────────────────
// Combined Hinglish (hi covers Hinglish romanized too) + English + native
// scripts. Speech recognition in South India often returns romanized text,
// so romanized Tamil/Telugu/Kannada keywords are included as well.

export const INTENT_KEYWORDS: Record<Lang, Record<string, string[]>> = {
  hi: {
    udhaarUpdate: ["udhaar", "udhar", "khata", "update", "karo", "kar do", "kam", "add", "jodo", "deduct", "repay"],
    winback: ["offer bhej", "offer send", "coupon bhej", "campaign", "win back", "winback", "wapas la", "offer"],
    loan: ["loan", "credit", "udhaar offer"],
    udhaarQuery: ["udhaar", "udhar", "khata"],
    inventory: ["stock", "inventory", "maal", "saman"],
    sales: ["kitni sale", "kitna business", "kitna bikri", "aaj ka", "today", "sales", "revenue", "business kaisa", "business hua", "summary", "kal se", "kamai"],
    customers: ["customer", "graahak", "grahak"],
    approve: ["haan", "yes", "confirm", "approve", "ok", "theek hai", "karo", "bhej do", "send"],
    payment: ["payment", "aaya", "received", "paisa"],
    help: ["help", "kya kar sakte", "namaste", "hello", "hi", "hey"],
    inactive: ["nahi aaye", "nahi aaya", "inactive", "gayab"],
  },
  en: {
    udhaarUpdate: ["credit update", "udhaar update", "update credit", "repay", "deduct", "khata update"],
    winback: ["offer", "coupon", "campaign", "win back", "winback", "send offer"],
    loan: ["loan", "credit offer", "financing"],
    udhaarQuery: ["credit balance", "udhaar", "khata", "credit"],
    inventory: ["stock", "inventory", "products"],
    sales: ["sales", "revenue", "business", "today", "summary", "how much"],
    customers: ["customer", "customers", "client"],
    approve: ["yes", "confirm", "approve", "ok", "send"],
    payment: ["payment", "received", "money"],
    help: ["help", "hello", "hi", "hey", "what can"],
    inactive: ["not visited", "haven't come", "inactive", "no purchase"],
  },
  ta: {
    udhaarUpdate: ["கடன்", "update", "புதுப்பி", "புதுப்பிக்க", "செலுத்த", "கழி", "kadan", "மாற்று"],
    winback: ["ஆஃபர்", "அனுப்பு", "கூப்பன்", "பிரச்சாரம்", "offer", "வரவேற்பு"],
    loan: ["கடன்", "loan", "நிதி", "வட்டி"],
    udhaarQuery: ["கடன்", "கணக்கு", "kadan", "kanakku"],
    inventory: ["சரக்கு", "ஸ்டாக்", "மால்", "stock", "saraku"],
    sales: ["விற்பனை", "வியாபாரம்", "இன்று", "வருவாய்", "சுருக்கம்", "virpanai", "vyaparam"],
    customers: ["வாடிக்கையாளர்", "customer", "நண்பர்"],
    approve: ["ஆம்", "சரி", "ஒப்புக்கொள்", "அனுப்பு", "yes", "seri", "haan"],
    payment: ["பணம்", "பேமெண்ட்", "வந்தது", "payment"],
    help: ["உதவி", "வணக்கம்", "hello", "hi"],
    inactive: ["வரவில்லை", "வராத", "inactive"],
  },
  te: {
    udhaarUpdate: ["అప్పు", "అప్‌డేట్", "చెల్లించు", "తగ్గించు", "ఖాతా", "appu", "update"],
    winback: ["ఆఫర్", "పంపు", "కూపన్", "ప్రచారం", "offer", "pampu"],
    loan: ["రుణం", "అప్పు", "loan", "క్రెడిట్"],
    udhaarQuery: ["అప్పు", "ఖాతా", "appu", "khata"],
    inventory: ["స్టాక్", "సరుకు", "మాల్", "stock", "saruku"],
    sales: ["అమ్మకం", "వ్యాపారం", "ఈరోజు", "ఆదాయం", "సారాంశం", "ammakanam", "vyaparam"],
    customers: ["కస్టమర్", "వినియోగదారు", "customer"],
    approve: ["అవును", "సరే", "ఆమోదించు", "పంపు", "yes", "saré", "avunu"],
    payment: ["డబ్బు", "పేమెంట్", "వచ్చింది", "payment"],
    help: ["సహాయం", "నమస్కారం", "hello", "hi"],
    inactive: ["రాలేదు", "రాని", "inactive"],
  },
  kn: {
    udhaarUpdate: ["ಸಾಲ", "ಅಪ್‌ಡೇಟ್", "ಪಾವತಿಸು", "ಕಡಿತ", "ಖಾತೆ", "saala", "update"],
    winback: ["ಆಫರ್", "ಕಳುಹಿಸು", "ಕೂಪನ್", "ಪ್ರಚಾರ", "offer", "kalisu"],
    loan: ["ಸಾಲ", "ಸಾಲದ", "loan", "ಕ್ರೆಡಿಟ್"],
    udhaarQuery: ["ಸಾಲ", "ಖಾತೆ", "saala", "khate"],
    inventory: ["ಸ್ಟಾಕ್", "ಸರಕು", "ಮಾಲ್", "stock", "sarakku"],
    sales: ["ಮಾರಾಟ", "ವ್ಯಾಪಾರ", "ಇಂದು", "ಆದಾಯ", "ಸಾರಾಂಶ", "marata", "vyapara"],
    customers: ["ಗ್ರಾಹಕ", "ಕಸ್ಟಮರ್", "customer"],
    approve: ["ಹೌದು", "ಸರಿ", "ಅನುಮೋದಿಸು", "ಕಳುಹಿಸು", "yes", "haudu", "sari"],
    payment: ["ಹಣ", "ಪೇಮೆಂಟ್", "ಬಂತು", "payment"],
    help: ["ಸಹಾಯ", "ನಮಸ್ಕಾರ", "hello", "hi"],
    inactive: ["ಬಂದಿಲ್ಲ", "ಬಾರದ", "inactive"],
  },
};

// ───────────────── Native-script entity aliases ─────────────────
// Merchants may say product/customer names in their own script.
// Each alias maps to the canonical English entity already seeded.

export const PRODUCT_ALIASES: Record<string, string> = {
  // Tamil
  "பால்": "Milk",
  "ரொட்டி": "Bread",
  "முட்டை": "Eggs",
  "அரிசி": "Rice (5kg)",
  "கோதுமை": "Wheat Flour (5kg)",
  "துவரம் பருப்பு": "Toor Dal (1kg)",
  "எண்ணெய்": "Cooking Oil (1L)",
  "சர்க்கரை": "Sugar (1kg)",
  "தேநீர்": "Tea (250g)",
  "தீ": "Tea (250g)", // spoken shortcut "theenir"
  "஬ிஸ்கட்": "Biscuits",
  "சோப்பு": "Soap",
  "தயிர்": "Curd (400g)",
  "வெண்ணெய்": "Butter (100g)",
  // Telugu
  "పాలు": "Milk",
  "బ్రెడ్": "Bread",
  "గుడ్లు": "Eggs",
  "వరి": "Rice (5kg)",
  "బియ్యం": "Rice (5kg)",
  "పిండి": "Wheat Flour (5kg)",
  "నూనె": "Cooking Oil (1L)",
  "చక్కెర": "Sugar (1kg)",
  "టీ": "Tea (250g)",
  "బిస్కట్": "Biscuits",
  "సబ్బు": "Soap",
  "పెరుగు": "Curd (400g)",
  "వెన్న": "Butter (100g)",
  // Kannada
  "ಹಾಲು": "Milk",
  "ಬ್ರೆಡ್": "Bread",
  "ಮೊಟ್ಟೆ": "Eggs",
  "ಅಕ್ಕಿ": "Rice (5kg)",
  "ಗೋಧಿ": "Wheat Flour (5kg)",
  "ತೊಗರಿ ಬೇಳೆ": "Toor Dal (1kg)",
  "ಎಣ್ಣೆ": "Cooking Oil (1L)",
  "ಸಕ್ಕರೆ": "Sugar (1kg)",
  "ಚಹಾ": "Tea (250g)",
  "ಬಿಸ್ಕತ್ತು": "Biscuits",
  "ಸೋಪು": "Soap",
  "ಮೊಸರು": "Curd (400g)",
  "ಬೆಣ್ಣೆ": "Butter (100g)",
  // Romanized South-Indian speech (STT often returns this)
  paal: "Milk",
  "palu": "Milk",
  haalu: "Milk",
  rotti: "Bread",
  muttai: "Eggs",
  gudlu: "Eggs",
  "arisi": "Rice (5kg)",
  "biyyam": "Rice (5kg)",
  "akki": "Rice (5kg)",
  "ennai": "Cooking Oil (1L)",
  "nune": "Cooking Oil (1L)",
  sakkare: "Sugar (1kg)",
  chakkera: "Sugar (1kg)",
  sakkarai: "Sugar (1kg)",
  theer: "Tea (250g)",
  te: "Tea (250g)",
  thi: "Tea (250g)",
  "soppu": "Soap",
  sabbu: "Soap",
  thayir: "Curd (400g)",
  perugu: "Curd (400g)",
  mosaru: "Curd (400g)",
};

export const CUSTOMER_ALIASES: Record<string, string> = {
  // Tamil script
  "ரமேஷ்": "Ramesh",
  "சுரேஷ்": "Suresh",
  "விஜய்": "Vijay",
  "அமித்": "Amit",
  "தீபக்": "Deepak",
  "ராகுல்": "Rahul",
  "மனோஜ்": "Manoj",
  "கோபால்": "Gopal",
  "ஹரீஷ்": "Harish",
  // Telugu script
  "రమేష్": "Ramesh",
  "సురేష్": "Suresh",
  "విజయ్": "Vijay",
  "అమిత్": "Amit",
  "దీపక్": "Deepak",
  "రాహుల్": "Rahul",
  "మనోజ్": "Manoj",
  "గోపాల్": "Gopal",
  "హరీష్": "Harish",
  // Kannada script
  "ರಮೇಶ್": "Ramesh",
  "ಸುರೇಶ್": "Suresh",
  "ವಿಜಯ್": "Vijay",
  "ಅಮಿತ್": "Amit",
  "ದೀಪಕ್": "Deepak",
  "ರಾಹುಲ್": "Rahul",
  "ಮನೋಜ್": "Manoj",
  "ಗೋಪಾಲ್": "Gopal",
  "ಹರೀಶ್": "Harish",
  // Romanized
  rameshan: "Ramesh",
  surash: "Suresh",
  vijayan: "Vijay",
  amith: "Amit",
  dipak: "Deepak",
  "rahul": "Rahul",
  manog: "Manoj",
  gopalan: "Gopal",
};

// ───────────────── Localized demo utterances ─────────────────
// Demo bar content per language — same 7 scenarios, native phrasing.

export const DEMO_UTTERANCES: Record<Lang, { label: string; utterance: string }[]> = {
  hi: [
    { label: "Sales summary", utterance: "Aaj kitna business hua?" },
    { label: "Inactive customers", utterance: "Kaunse customer 30 din se nahi aaye?" },
    { label: "Win-back offer", utterance: "Unko ₹50 ka offer bhej do." },
    { label: "Stock check", utterance: "Milk ka stock kitna hai?" },
    { label: "Udhaar + PIN", utterance: "Ramesh ka ₹500 udhaar update kar do." },
    { label: "Loan offer", utterance: "Mere liye koi loan offer hai?" },
    { label: "Simulate payment", utterance: "__PAYMENT__" },
  ],
  en: [
    { label: "Sales summary", utterance: "How much business did I do today?" },
    { label: "Inactive customers", utterance: "Which customers have not come in 30 days?" },
    { label: "Win-back offer", utterance: "Send them a ₹50 offer." },
    { label: "Stock check", utterance: "How much milk stock do I have?" },
    { label: "Credit + PIN", utterance: "Update Ramesh's ₹500 udhaar." },
    { label: "Loan offer", utterance: "Any loan offer for me?" },
    { label: "Simulate payment", utterance: "__PAYMENT__" },
  ],
  ta: [
    { label: "விற்பனை", utterance: "இன்று எவ்வளவு வியாபாரம் நடந்தது?" },
    { label: "வராத வாடிக்கையாளர்", utterance: "30 நாட்களாக யாரும் வரவில்லையா?" },
    { label: "ஆஃபர் அனுப்பு", utterance: "அவர்களுக்கு ₹50 ஆஃபர் அனுப்பு." },
    { label: "பால் சரக்கு", utterance: "பால் சரக்கு எவ்வளவு இருக்கிறது?" },
    { label: "கடன் + PIN", utterance: "ரமேஷ் கடன் ₹500 புதுப்பி." },
    { label: "கடன் ஆஃபர்", utterance: "எனக்கு ஏதாவது கடன் ஆஃபர் உள்ளதா?" },
    { label: "Simulate payment", utterance: "__PAYMENT__" },
  ],
  te: [
    { label: "అమ్మకాలు", utterance: "ఈరోజు ఎంత వ్యాపారం జరిగింది?" },
    { label: "రాని కస్టమర్లు", utterance: "30 రోజులుగా ఎవరూ రాలేదా?" },
    { label: "ఆఫర్ పంపు", utterance: "వాళ్లకి ₹50 ఆఫర్ పంపు." },
    { label: "పాలు స్టాక్", utterance: "పాలు స్టాక్ ఎంత ఉంది?" },
    { label: "అప్పు + PIN", utterance: "రమేష్ అప్పు ₹500 అప్‌డేట్ చెయ్యి." },
    { label: "రుణం ఆఫర్", utterance: "నాకు ఏదైనా రుణం ఆఫర్ ఉందా?" },
    { label: "Simulate payment", utterance: "__PAYMENT__" },
  ],
  kn: [
    { label: "ಮಾರಾಟ", utterance: "ಇಂದು ಎಷ್ಟು ವ್ಯಾಪಾರ ಆಯಿತು?" },
    { label: "ಬಾರದ ಗ್ರಾಹಕರು", utterance: "30 ದಿನವಾಗಿ ಯಾರೂ ಬಂದಿಲ್ಲವಾ?" },
    { label: "ಆಫರ್ ಕಳುಹಿಸು", utterance: "ಅವರಿಗೆ ₹50 ಆಫರ್ ಕಳುಹಿಸು." },
    { label: "ಹಾಲು ಸ್ಟಾಕ್", utterance: "ಹಾಲು ಸ್ಟಾಕ್ ಎಷ್ಟು ಇದೆ?" },
    { label: "ಸಾಲ + PIN", utterance: "ರಮೇಶ್ ಸಾಲ ₹500 ಅಪ್‌ಡೇಟ್ ಮಾಡು." },
    { label: "ಸಾಲ ಆಫರ್", utterance: "ನನಗೆ ಯಾವುದಾದರೂ ಸಾಲ ಆಫರ್ ಇದೆಯಾ?" },
    { label: "Simulate payment", utterance: "__PAYMENT__" },
  ],
};

/** Localized strings for client-side messages (payment announcement, errors). */
export const CLIENT_STRINGS: Record<Lang, Record<string, string>> = {
  hi: {
    payment: "रुपये received on Paytm",
    paymentSpoken: "रुपये प्राप्त हुए on Paytm",
    sysError: "System error aa gayi. Dobara koshish kijiye.",
    noPending: "Koi pending action nahi mila.",
    rejected: "Theek hai, main kuch bhi change nahi karungi. Aur kaise madad karun?",
    seedFailed: "Seed failed. Reload the page.",
    payFailed: "Payment simulation failed. Try again.",
    recording: "(recording — tap again to send)",
  },
  en: {
    payment: "received on Paytm",
    paymentSpoken: "received on Paytm",
    sysError: "A system error occurred. Please try again.",
    noPending: "No pending action found.",
    rejected: "Okay, I have not changed anything. How else can I help?",
    seedFailed: "Seed failed. Reload the page.",
    payFailed: "Payment simulation failed. Try again.",
    recording: "(recording — tap again to send)",
  },
  ta: {
    payment: "பெறப்பட்டது on Paytm",
    paymentSpoken: "பணம் பெறப்பட்டது on Paytm",
    sysError: "தொழில்நுட்ப பிழை. மீண்டும் முயற்சிக்கவும்.",
    noPending: "நிலுவையில் உள்ள செயல் இல்லை.",
    rejected: "சரி, எதுவும் மாற்றவில்லை. மேலும் எப்படி உதவலாம்?",
    seedFailed: "Seed தோல்வி. பக்கத்தை மீண்டும் ஏற்றவும்.",
    payFailed: "Payment simulation தோல்வி. மீண்டும் முயற்சிக்கவும்.",
    recording: "(பதிவு — மீண்டும் தட்டி அனுப்பவும்)",
  },
  te: {
    payment: "వచ్చింది on Paytm",
    paymentSpoken: "డబ్బు వచ్చింది on Paytm",
    sysError: "సిస్టమ్ లోపం. మళ్లీ ప్రయత్నించండి.",
    noPending: "పెండింగ్ చర్య లేదు.",
    rejected: "సరే, ఏమీ మార్చలేదు. ఇంకా ఎలా సహాయం చేయగలను?",
    seedFailed: "Seed విఫలం. పేజీని రీలోడ్ చేయండి.",
    payFailed: "Payment simulation విఫలం. మళ్లీ ప్రయత్నించండి.",
    recording: "(రికార్డింగ్ — మళ్లీ నొక్కి పంపండి)",
  },
  kn: {
    payment: "ಬಂದಿದೆ on Paytm",
    paymentSpoken: "ಹಣ ಬಂದಿದೆ on Paytm",
    sysError: "ಸಿಸ್ಟಮ್ ದೋಷ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    noPending: "ಬಾಕಿ ಇರುವ ಕ್ರಿಯೆ ಇಲ್ಲ.",
    rejected: "ಸರಿ, ಏನೂ ಬದಲಾಯಿಸಲಿಲ್ಲ. ಇನ್ನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
    seedFailed: "Seed ವಿಫಲ. ಪುಟವನ್ನು ರೀಲೋಡ್ ಮಾಡಿ.",
    payFailed: "Payment simulation ವಿಫಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    recording: "(ರೆಕಾರ್ಡಿಂಗ್ — ಮತ್ತೆ ಒತ್ತಿ ಕಳುಹಿಸಿ)",
  },
};

/** Help / UNKNOWN fallback per language is in responses.ts (server side). */
