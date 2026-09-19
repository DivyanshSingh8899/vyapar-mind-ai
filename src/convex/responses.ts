// ─────────────────────────────────────────────────────────────────────────────
// Vyapar-Mind — Localized agent responses
// Every agent response exists in all 5 launch languages (hi, en, ta, te, kn).
// Templates are functions so numbers/names interpolate naturally; copy is
// short, merchant-friendly, conversational, and action oriented (spec §16).
// ─────────────────────────────────────────────────────────────────────────────
import type { Lang } from "./langs";

type Tpl = Record<Lang, (...a: any[]) => string>;

// ───────────────────────── SALES ─────────────────────────
export const SALES_TODAY: Tpl = {
  hi: (s: string, txn: number, avg: string, delta: number, dir: string, cat?: string) =>
    `Aaj aapki sale ${s} rahi hai — ${txn} transactions, average ${avg}. ` +
    (delta === 0
      ? "Kal ke jaisa hi chal raha hai."
      : `Kal se ${Math.abs(delta)}% ${dir} hai.`) +
    (cat ? ` Sabse zyada ${cat} category mein bikri hui.` : ""),
  en: (s: string, txn: number, avg: string, delta: number, _dir: string, cat?: string) =>
    `Today's sale is ${s} — ${txn} transactions, average ${avg}. ` +
    (delta === 0 ? "Same as yesterday." : `That's ${Math.abs(delta)}% ${delta >= 0 ? "higher" : "lower"} than yesterday.`) +
    (cat ? ` Most sales came from the ${cat} category.` : ""),
  ta: (s: string, txn: number, avg: string, delta: number, dir: string, cat?: string) =>
    `இன்றைய விற்பனை ${s} — ${txn} transactions, சராசரி ${avg}. ` +
    (delta === 0
      ? "நேற்றையைப் போலவே உள்ளது."
      : `நேற்றையை விட ${Math.abs(delta)}% ${dir === "zyada" ? "அதிகம்" : "குறைவு"}.`) +
    (cat ? ` அதிக விற்பனை ${cat} வகையில் நடந்தது.` : ""),
  te: (s: string, txn: number, avg: string, delta: number, dir: string, cat?: string) =>
    `ఈరోజు మీ అమ్మకం ${s} — ${txn} transactions, సగటు ${avg}. ` +
    (delta === 0
      ? "నిన్నటిలాగే ఉంది."
      : `నిన్నటికి పోలిస్తే ${Math.abs(delta)}% ${dir === "zyada" ? "ఎక్కువ" : "తక్కువ"}.`) +
    (cat ? ` ఎక్కువ అమ్మకం ${cat} విభాగంలో జరిగింది.` : ""),
  kn: (s: string, txn: number, avg: string, delta: number, dir: string, cat?: string) =>
    `ಇಂದಿನ ಮಾರಾಟ ${s} — ${txn} transactions, ಸರಾಸರಿ ${avg}. ` +
    (delta === 0
      ? "ನಿನ್ನೆಯಂತೆಯೇ ಇದೆ."
      : `ನಿನ್ನೆಗಿಂತ ${Math.abs(delta)}% ${dir === "zyada" ? "ಹೆಚ್ಚು" : "ಕಡಿಮೆ"}.`) +
    (cat ? ` ಹೆಚ್ಚು ಮಾರಾಟ ${cat} ವಿಭಾಗದಲ್ಲಿ ಆಯಿತು.` : ""),
};

export const PAYMENT_PRIORITY: Tpl = {
  hi: (s: string, method: string) =>
    `Payments ke liye Soundbox live hai — aaj ab tak ${s} receive hua hai via ${method}.`,
  en: (s: string, method: string) => `Soundbox is live for payments — ${s} received today via ${method}.`,
  ta: (s: string, method: string) => `Soundbox payments-க்கு live உள்ளது — இன்று வரை ${s} வந்துள்ளது (${method}).`,
  te: (s: string, method: string) => `Soundbox payments-కి live ఉంది — ఈరోజు వరకు ${s} వచ్చింది (${method}).`,
  kn: (s: string, method: string) => `Soundbox payments-ಗೆ live ಇದೆ — ಇಂದು ವರೆಗೆ ${s} ಬಂದಿದೆ (${method}).`,
};

// ───────────────────────── CUSTOMERS ─────────────────────────
export const INACTIVE_LIST: Tpl = {
  hi: (n: number, days: number, names: string) =>
    `${n} customers pichle ${days} din se nahi aaye. Sabse purane: ${names}. "Unko offer bhej do" boliye to campaign bana dunga.`,
  en: (n: number, days: number, names: string) =>
    `${n} customers have not come in the last ${days} days. Oldest: ${names}. Say "send them an offer" and I will create a campaign.`,
  ta: (n: number, days: number, names: string) =>
    `${n} வாடிக்கையாளர்கள் கடந்த ${days} நாட்களாக வரவில்லை. பழையவர்கள்: ${names}. "ஆஃபர் அனுப்பு" என்று சொன்னால் campaign உருவாக்குகிறேன்.`,
  te: (n: number, days: number, names: string) =>
    `${n} కస్టమర్లు గత ${days} రోజులుగా రాలేదు. పాతవారు: ${names}. "ఆఫర్ పంపు" అని చెబితే campaign చేస్తాను.`,
  kn: (n: number, days: number, names: string) =>
    `${n} ಗ್ರಾಹಕರು ಕಳೆದ ${days} ದಿನಗಳಿಂದ ಬಂದಿಲ್ಲ. ಹಳೆಯವರು: ${names}. "ಆಫರ್ ಕಳುಹಿಸು" ಎಂದು ಹೇಳಿದರೆ campaign ಮಾಡುತ್ತೇನೆ.`,
};

export const NO_INACTIVE: Tpl = {
  hi: (days: number) => `Shabaash! Pichle ${days} din mein koi customer inactive nahi hai.`,
  en: (days: number) => `Great news! No customer has been inactive in the last ${days} days.`,
  ta: (days: number) => `அருமை! கடந்த ${days} நாட்களில் யாரும் inactive இல்லை.`,
  te: (days: number) => `బాగుంది! గత ${days} రోజుల్లో ఎవరూ inactive లేరు.`,
  kn: (days: number) => `ಚೆನ್ನಾಗಿದೆ! ಕಳೆದ ${days} ದಿನಗಳಲ್ಲಿ ಯಾರೂ inactive ಇಲ್ಲ.`,
};

export const CUSTOMER_INSIGHTS: Tpl = {
  hi: (total: number, active: number, returning: number, inactive: number, top: string, spent: string) =>
    `Aapke ${total} customers hain — ${active} active (7 din), ${returning} repeat, ${inactive} 30+ din se nahi aaye. Top customer: ${top} (${spent}).`,
  en: (total: number, active: number, returning: number, inactive: number, top: string, spent: string) =>
    `You have ${total} customers — ${active} active (7 days), ${returning} repeat, ${inactive} away 30+ days. Top customer: ${top} (${spent}).`,
  ta: (total: number, active: number, returning: number, inactive: number, top: string, spent: string) =>
    `உங்களிடம் ${total} வாடிக்கையாளர்கள் — ${active} active (7 நாள்), ${returning} repeat, ${inactive} 30+ நாட்களாக வரவில்லை. முதன்மை வாடிக்கையாளர்: ${top} (${spent}).`,
  te: (total: number, active: number, returning: number, inactive: number, top: string, spent: string) =>
    `మీకు ${total} కస్టమర్లు — ${active} active (7 రోజులు), ${returning} repeat, ${inactive} 30+ రోజులుగా రాలేదు. టాప్ కస్టమర్: ${top} (${spent}).`,
  kn: (total: number, active: number, returning: number, inactive: number, top: string, spent: string) =>
    `ನಿಮಗೆ ${total} ಗ್ರಾಹಕರು — ${active} active (7 ದಿನ), ${returning} repeat, ${inactive} 30+ ದಿನಗಳಿಂದ ಬಂದಿಲ್ಲ. ಟಾಪ್ ಗ್ರಾಹಕ: ${top} (${spent}).`,
};

// ───────────────────────── WIN-BACK ─────────────────────────
export const NO_WINBACK_TARGETS: Tpl = {
  hi: (days: number) => `Pichle ${days} din mein koi inactive customer nahi mila — campaign ki zaroorat nahi.`,
  en: (days: number) => `No inactive customers in the last ${days} days — no campaign needed.`,
  ta: (days: number) => `கடந்த ${days} நாட்களில் யாரும் inactive இல்லை — campaign தேவையில்லை.`,
  te: (days: number) => `గత ${days} రోజుల్లో ఎవరూ inactive లేరు — campaign అవసరం లేదు.`,
  kn: (days: number) => `ಕಳೆದ ${days} ದಿನಗಳಲ್ಲಿ ಯಾರೂ inactive ಇಲ್ಲ — campaign ಅಗತ್ಯವಿಲ್ಲ.`,
};

export const WINBACK_PROPOSAL: Tpl = {
  hi: (n: number, days: number, offer: string) =>
    `${n} customers pichle ${days} din se nahi aaye. Main ${offer} ka win-back campaign bana sakti hoon (simulated WhatsApp). Merchant authentication required hai — approve karenge?`,
  en: (n: number, days: number, offer: string) =>
    `${n} customers have been away ${days} days. I can create a ${offer} win-back campaign (simulated WhatsApp). Merchant authentication required — approve?`,
  ta: (n: number, days: number, offer: string) =>
    `${n} வாடிக்கையாளர்கள் ${days} நாட்களாக வரவில்லை. ${offer} win-back campaign உருவாக்கலாம் (simulated WhatsApp). அங்கீகாரம் தேவை — ஒப்புக்கொள்கிறீர்களா?`,
  te: (n: number, days: number, offer: string) =>
    `${n} కస్టమర్లు ${days} రోజులుగా రాలేదు. ${offer} win-back campaign చేయవచ్చు (simulated WhatsApp). ప్రమాణీకరణ అవసరం — ఆమోదిస్తారా?`,
  kn: (n: number, days: number, offer: string) =>
    `${n} ಗ್ರಾಹಕರು ${days} ದಿನಗಳಿಂದ ಬಂದಿಲ್ಲ. ${offer} win-back campaign ಮಾಡಬಹುದು (simulated WhatsApp). ದೃಢೀಕರಣ ಬೇಕು — ಅನುಮೋದಿಸುವಿರಾ?`,
};

export const WINBACK_PENDING_SUMMARY: Tpl = {
  hi: (offer: string, n: number) => `Campaign: ${offer} → ${n} customers`,
  en: (offer: string, n: number) => `Campaign: ${offer} → ${n} customers`,
  ta: (offer: string, n: number) => `Campaign: ${offer} → ${n} வாடிக்கையாளர்கள்`,
  te: (offer: string, n: number) => `Campaign: ${offer} → ${n} కస్టమర్లు`,
  kn: (offer: string, n: number) => `Campaign: ${offer} → ${n} ಗ್ರಾಹಕರು`,
};

export const WINBACK_PENDING_DETAIL: Tpl = {
  hi: (n: number, days: number, names: string, offer: string) =>
    `${n} customers pichle ${days} din se nahi aaye: ${names}. Offer: ${offer}. Channel: simulated WhatsApp (demo).`,
  en: (n: number, days: number, names: string, offer: string) =>
    `${n} customers away ${days}+ days: ${names}. Offer: ${offer}. Channel: simulated WhatsApp (demo).`,
  ta: (n: number, days: number, names: string, offer: string) =>
    `${n} வாடிக்கையாளர்கள் ${days}+ நாட்களாக வரவில்லை: ${names}. Offer: ${offer}. Channel: simulated WhatsApp (demo).`,
  te: (n: number, days: number, names: string, offer: string) =>
    `${n} కస్టమర్లు ${days}+ రోజులుగా రాలేదు: ${names}. Offer: ${offer}. Channel: simulated WhatsApp (demo).`,
  kn: (n: number, days: number, names: string, offer: string) =>
    `${n} ಗ್ರಾಹಕರು ${days}+ ದಿನಗಳಿಂದ ಬಂದಿಲ್ಲ: ${names}. Offer: ${offer}. Channel: simulated WhatsApp (demo).`,
};

export const WINBACK_CONFIRM_LABEL: Tpl = {
  hi: (n: number) => `Approve campaign for ${n} customers`,
  en: (n: number) => `Approve campaign for ${n} customers`,
  ta: (n: number) => `${n} வாடிக்கையாளர்களுக்கு ஒப்புதல்`,
  te: (n: number) => `${n} కస్టమర్లకు ఆమోదం`,
  kn: (n: number) => `${n} ಗ್ರಾಹಕರಿಗೆ ಅನುಮೋದನೆ`,
};

// ───────────────────────── INVENTORY ─────────────────────────
export const PRODUCT_NOT_FOUND: Tpl = {
  hi: (p: string) => `"${p}" naam ka product stock list mein nahi mila. Kya aap product ka exact naam batayenge?`,
  en: (p: string) => `Product "${p}" was not found in the stock list. Could you say the exact product name?`,
  ta: (p: string) => `"${p}" என்ற product சரக்கு பட்டியலில் இல்லை. Product-ன் சரியான பெயரைச் சொல்லுங்கள்?`,
  te: (p: string) => `"${p}" అనే product స్టాక్ జాబితాలో లేదు. Product ఖచ్చితమైన పేరు చెప్పగలరా?`,
  kn: (p: string) => `"${p}" ಎಂಬ product ಸ್ಟಾಕ್ ಪಟ್ಟಿಯಲ್ಲಿ ಇಲ್ಲ. Product ಸರಿಯಾದ ಹೆಸರನ್ನು ಹೇಳಬಲ್ಲಿರಾ?`,
};

export const PRODUCT_LOW: Tpl = {
  hi: (p: string, q: number, r: number) =>
    `${p} ke sirf ${q} unit bache hain (reorder level ${r}). Order karne ka time ho gaya hai!`,
  en: (p: string, q: number, r: number) => `Only ${q} units of ${p} left (reorder level ${r}). Time to order!`,
  ta: (p: string, q: number, r: number) => `${p}-க்கு வெறும் ${q} unit மட்டுமே உள்ளது (reorder level ${r}). Order செய்ய வேண்டிய நேரம்!`,
  te: (p: string, q: number, r: number) => `${p}కి ${q} unit మాత్రమే ఉన్నాయి (reorder level ${r}). Order చేసే సమయం!`,
  kn: (p: string, q: number, r: number) => `${p}ಗೆ ${q} unit ಮಾತ್ರ ಉಳಿದಿವೆ (reorder level ${r}). Order ಮಾಡುವ ಸಮಯ!`,
};

export const PRODUCT_OK: Tpl = {
  hi: (p: string, q: number, price: string) => `${p} ka stock theek hai — ${q} unit available (${price} per unit).`,
  en: (p: string, q: number, price: string) => `${p} stock is fine — ${q} units available (${price} per unit).`,
  ta: (p: string, q: number, price: string) => `${p} சரக்கு நல்லுள்ளது — ${q} unit உள்ளது (${price} per unit).`,
  te: (p: string, q: number, price: string) => `${p} స్టాక్ బాగుంది — ${q} unit ఉన్నాయి (${price} per unit).`,
  kn: (p: string, q: number, price: string) => `${p} ಸ್ಟಾಕ್ ಸರಿಯಾಗಿದೆ — ${q} unit ಇದೆ (${price} per unit).`,
};

export const INVENTORY_LOW_LIST: Tpl = {
  hi: (total: number, low: number, names: string) =>
    `Aapke ${total} products hain, ${low} low stock hain: ${names}. Reorder list taiyaar hai.`,
  en: (total: number, low: number, names: string) =>
    `You have ${total} products, ${low} are low on stock: ${names}. Reorder list is ready.`,
  ta: (total: number, low: number, names: string) =>
    `உங்களிடம் ${total} products உள்ளன, ${low} குறைவாக உள்ளன: ${names}. Reorder பட்டியல் தயார்.`,
  te: (total: number, low: number, names: string) =>
    `మీకు ${total} products ఉన్నాయి, ${low} తక్కువగా ఉన్నాయి: ${names}. Reorder జాబితా సిద్ధం.`,
  kn: (total: number, low: number, names: string) =>
    `ನಿಮಗೆ ${total} products ಇವೆ, ${low} ಕಡಿಮೆ ಇವೆ: ${names}. Reorder ಪಟ್ಟಿ ಸಿದ್ಧ.`,
};

export const INVENTORY_ALL_OK: Tpl = {
  hi: (total: number) => `Sab ${total} products ka stock theek hai. Kisi bhi product ka naam boliye, detail bata dunga.`,
  en: (total: number) => `All ${total} products are well stocked. Name any product and I'll give details.`,
  ta: (total: number) => `அனைத்து ${total} products-ன் சரக்கும் நல்லுள்ளது. எந்த product-ன் பெயரையும் சொல்லுங்கள், விவரம் தருகிறேன்.`,
  te: (total: number) => `అన్ని ${total} products స్టాక్ బాగున్నాయి. ఏ product పేరు చెబితేనే వివరాలు చెబుతాను.`,
  kn: (total: number) => `ಎಲ್ಲಾ ${total} products ಸ್ಟಾಕ್ ಸರಿಯಾಗಿದೆ. ಯಾವುದಾದರೂ product ಹೆಸರನ್ನು ಹೇಳಿ, ವಿವರ ಕೊಡುತ್ತೇನೆ.`,
};

// ───────────────────────── UDHAAR ─────────────────────────
export const CUSTOMER_NOT_FOUND: Tpl = {
  hi: (n: string) => `${n} naam ka customer nahi mila. Kya aap kisi aur customer ka naam batayenge?`,
  en: (n: string) => `Customer "${n}" was not found. Would you like to try another name?`,
  ta: (n: string) => `${n} என்ற வாடிக்கையாளர் கிடைக்கவில்லை. வேறு பெயரைச் சொல்லுங்களா?`,
  te: (n: string) => `${n} అనే కస్టమర్ కనబడలేదు. వేరే పేరు చెబుతారా?`,
  kn: (n: string) => `${n} ಎಂಬ ಗ್ರಾಹಕ ಸಿಗಲಿಲ್ಲ. ಬೇರೆ ಹೆಸರನ್ನು ಹೇಳುತ್ತೀರಾ?`,
};

export const UDHAAR_BALANCE_ONE: Tpl = {
  hi: (n: string, amt: string) => `${n} ka udhaar ${amt} hai.`,
  en: (n: string, amt: string) => `${n}'s udhaar (credit) is ${amt}.`,
  ta: (n: string, amt: string) => `${n} கடன் ${amt}.`,
  te: (n: string, amt: string) => `${n} అప్పు ${amt}.`,
  kn: (n: string, amt: string) => `${n} ಸಾಲ ${amt}.`,
};

export const UDHAAR_TOTAL: Tpl = {
  hi: (amt: string, n: number, top: string) =>
    `Total udhaar ${amt} hai, ${n} customers par. Sabse zyada: ${top}.`,
  en: (amt: string, n: number, top: string) => `Total udhaar (credit) is ${amt} across ${n} customers. Highest: ${top}.`,
  ta: (amt: string, n: number, top: string) => `மொத்த கடன் ${amt}, ${n} வாடிக்கையாளர்கள் மீது. அதிகம்: ${top}.`,
  te: (amt: string, n: number, top: string) => `మొత్తం అప్పు ${amt}, ${n} కస్టమర్లపై. ఎక్కువ: ${top}.`,
  kn: (amt: string, n: number, top: string) => `ಒಟ್ಟು ಸಾಲ ${amt}, ${n} ಗ್ರಾಹಕರ ಮೇಲೆ. ಹೆಚ್ಚು: ${top}.`,
};

export const UDHAAR_NEED_NAME: Tpl = {
  hi: () => "Kis customer ka udhaar update karna hai? Naam aur amount dono bataiye.",
  en: () => "Whose credit should I update? Please give the name and amount.",
  ta: () => "எந்த வாடிக்கையாளரின் கடனை புதுப்பிக்க வேண்டும்? பெயர் மற்றும் தொகை சொல்லுங்கள்.",
  te: () => "ఎవరి అప్పు అప్‌డేట్ చేయాలి? పేరు మరియు మొత్తం చెప్పండి.",
  kn: () => "ಯಾರ ಸಾಲ ಅಪ್‌ಡೇಟ್ ಮಾಡಬೇಕು? ಹೆಸರು ಮತ್ತು ಮೊತ್ತ ಹೇಳಿ.",
};

export const UDHAAR_NEED_AMOUNT: Tpl = {
  hi: (n: string) => "Kitne rupaye ka udhaar update karna hai? Amount bataiye.",
  en: (n: string) => `How much of ${n}'s credit should I update? Please give the amount.`,
  ta: (n: string) => `${n} கடனில் எவ்வளவு புதுப்பிக்க வேண்டும்? தொகை சொல்லுங்கள்.`,
  te: (n: string) => `${n} అప్పులో ఎంత అప్‌డేట్ చేయాలి? మొత్తం చెప్పండి.`,
  kn: (n: string) => `${n} ಸಾಲದಲ್ಲಿ ಎಷ್ಟು ಅಪ್‌ಡೇಟ್ ಮಾಡಬೇಕು? ಮೊತ್ತ ಹೇಳಿ.`,
};

export const UDHAAR_PENDING_SUMMARY: Tpl = {
  hi: (n: string, amt: string) => `${n} ka udhaar ${amt} kam karna hai`,
  en: (n: string, amt: string) => `Reduce ${n}'s udhaar by ${amt}`,
  ta: (n: string, amt: string) => `${n} கடனை ${amt} குறைக்க வேண்டும்`,
  te: (n: string, amt: string) => `${n} అప్పు ${amt} తగ్గించాలి`,
  kn: (n: string, amt: string) => `${n} ಸಾಲ ${amt} ಕಡಿಮೆ ಮಾಡಬೇಕು`,
};

export const UDHAAR_PENDING_DETAIL: Tpl = {
  hi: (cur: string, newB: string) =>
    `Current balance: ${cur}. Naya balance: ${newB}. Yeh ek sensitive financial action hai.`,
  en: (cur: string, newB: string) => `Current balance: ${cur}. New balance: ${newB}. This is a sensitive financial action.`,
  ta: (cur: string, newB: string) => `தற்போதைய நிலுவை: ${cur}. புதிய நிலுவை: ${newB}. இது முக்கியமான நிதி செயல்.`,
  te: (cur: string, newB: string) => `ప్రస్తుత బాకీ: ${cur}. కొత్త బాకీ: ${newB}. ఇది ముఖ్యమైన ఆర్థిక చర్య.`,
  kn: (cur: string, newB: string) => `ಪ್ರಸ್ತುತ ಬಾಕಿ: ${cur}. ಹೊಸ ಬಾಕಿ: ${newB}. ಇದು ಮುಖ್ಯವಾದ ಆರ್ಥಿಕ ಕ್ರಿಯೆ.`,
};

export const UDHAAR_CONFIRM_LABEL: Tpl = {
  hi: (amt: string) => `Approve ${amt} repayment`,
  en: (amt: string) => `Approve ${amt} repayment`,
  ta: (amt: string) => `${amt} திருப்பி செலுத்த ஒப்புதல்`,
  te: (amt: string) => `${amt} చెల్లింపు ఆమోదం`,
  kn: (amt: string) => `${amt} ಪಾವತಿ ಅನುಮೋದನೆ`,
};

export const UDHAAR_AUTH_MSG: Tpl = {
  hi: (n: string, amt: string) =>
    `${n} ka udhaar ${amt} kam karna hai. Udhaar update ke liye merchant authentication required hai — demo PIN daaliye.`,
  en: (n: string, amt: string) =>
    `${n}'s udhaar will be reduced by ${amt}. Merchant authentication required — enter the demo PIN.`,
  ta: (n: string, amt: string) =>
    `${n} கடன் ${amt} குறைக்கப்படும். அங்கீகாரம் தேவை — demo PIN உள்ளிடுங்கள்.`,
  te: (n: string, amt: string) =>
    `${n} అప్పు ${amt} తగ్గించబడుతుంది. ప్రమాణీకరణ అవసరం — demo PIN నమోదు చేయండి.`,
  kn: (n: string, amt: string) =>
    `${n} ಸಾಲ ${amt} ಕಡಿಮೆ ಮಾಡಲಾಗುವುದು. ದೃಢೀಕರಣ ಬೇಕು — demo PIN ನಮೂದಿಸಿ.`,
};

// ───────────────────────── LOAN ─────────────────────────
export const LOAN_OFFER: Tpl = {
  hi: (amt: string, score: number, reason: string) =>
    `Aapki recent business activity ke basis par aapke profile ke liye ek simulated merchant credit offer of ${amt} available hai. Business activity score: ${score}/100 — ${reason}. Note: yeh DEMO / SIMULATED OFFER hai, koi asli Paytm loan approval nahi.`,
  en: (amt: string, score: number, reason: string) =>
    `Based on your recent business activity, a simulated merchant credit offer of ${amt} is available for your profile. Activity score: ${score}/100 — ${reason}. Note: this is a DEMO / SIMULATED OFFER, not a real Paytm loan approval.`,
  ta: (amt: string, score: number, reason: string) =>
    `உங்கள் சமீபத்திய வியாபார செயல்பாட்டின் அடிப்படையில் ${amt} simulated credit offer உங்களுக்கு உள்ளது. Activity score: ${score}/100 — ${reason}. குறிப்பு: இது DEMO / SIMULATED OFFER, உண்மையான Paytm கடன் அனுமதி அல்ல.`,
  te: (amt: string, score: number, reason: string) =>
    `మీ ఇటీవలి వ్యాపార కార్యకలాపాల ఆధారంగా ${amt} simulated credit offer మీ ప్రొఫైల్‌కు అందుబాటులో ఉంది. Activity score: ${score}/100 — ${reason}. గమనిక: ఇది DEMO / SIMULATED OFFER, నిజమైన Paytm రుణ ఆమోదం కాదు.`,
  kn: (amt: string, score: number, reason: string) =>
    `ನಿಮ್ಮ ಇತ್ತೀಚಿನ ವ್ಯಾಪಾರ ಚಟುವಟಿಕೆಯ ಆಧಾರದ ಮೇರೆಗೆ ${amt} simulated credit offer ನಿಮಗೆ ಲಭ್ಯವಿದೆ. Activity score: ${score}/100 — ${reason}. ಗಮನಿಸಿ: ಇದು DEMO / SIMULATED OFFER, ನಿಜವಾದ Paytm ಸಾಲ ಅನುಮೋದನೆ ಅಲ್ಲ.`,
};

export const LOAN_NONE: Tpl = {
  hi: (score: number) =>
    `Abhi aapki business activity score ${score}/100 hai, isliye koi simulated credit offer generate nahi hui. Kuch aur din consistent sale ke baad phir poochhiye. (DEMO / SIMULATED)`,
  en: (score: number) =>
    `Your business activity score is currently ${score}/100, so no simulated credit offer can be generated. Check again after a few more days of steady sales. (DEMO / SIMULATED)`,
  ta: (score: number) =>
    `உங்கள் activity score தற்போது ${score}/100. அதனால் இப்போது simulated credit offer இல்லை. சில நாட்கள் சீரான விற்பனைக்குப் பிறகு மீண்டும் கேளுங்கள். (DEMO / SIMULATED)`,
  te: (score: number) =>
    `మీ activity score ప్రస్తుతం ${score}/100. అందుకే ఇప్పుడు simulated credit offer లేదు. కొన్ని రోజులు స్థిరమైన అమ్మకాల తర్వాత మళ్లీ అడగండి. (DEMO / SIMULATED)`,
  kn: (score: number) =>
    `ನಿಮ್ಮ activity score ಪ್ರಸ್ತುತ ${score}/100. ಆದ್ದರಿಂದ ಈಗ simulated credit offer ಇಲ್ಲ. ಕೆಲವು ದಿನ ಸ್ಥಿರ ಮಾರಾಟದ ನಂತರ ಮತ್ತೆ ಕೇಳಿ. (DEMO / SIMULATED)`,
};

// ───────────────────────── APPROVAL / HELP / ERRORS ─────────────────────────
export const NO_PENDING: Tpl = {
  hi: () => "Koi pending action nahi mila jo approve karna ho.",
  en: () => "No pending action found to approve.",
  ta: () => "ஒப்புதலுக்கான நிலுவை செயல் இல்லை.",
  te: () => "ఆమోదించడానికి పెండింగ్ చర్య లేదు.",
  kn: () => "ಅನುಮೋದಿಸಲು ಬಾಕಿ ಕ್ರಿಯೆ ಇಲ್ಲ.",
};

export const APPROVE_AUTH_MSG: Tpl = {
  hi: () => "Authentication required hai. Demo PIN daaliye, phir main action complete kar dunga.",
  en: () => "Authentication required. Enter the demo PIN and I will complete the action.",
  ta: () => "அங்கீகாரம் தேவை. Demo PIN உள்ளிடுங்கள், பிறகு செயலை முடிக்கிறேன்.",
  te: () => "ప్రమాణీకరణ అవసరం. Demo PIN నమోదు చేయండి, తర్వాత చర్య పూర్తి చేస్తాను.",
  kn: () => "ದೃಢೀಕರಣ ಬೇಕು. Demo PIN ನಮೂದಿಸಿ, ನಂತರ ಕ್ರಿಯೆ ಪೂರ್ತಿ ಮಾಡುತ್ತೇನೆ.",
};

export const APPROVE_PENDING_DETAIL: Tpl = {
  hi: () => "Aapne haan kaha — ab authentication chahiye. Demo PIN daaliye.",
  en: () => "You said yes — now authentication is needed. Enter the demo PIN.",
  ta: () => "நீங்கள் ஆம் என்றீர்கள் — இப்போது அங்கீகாரம் தேவை. Demo PIN உள்ளிடுங்கள்.",
  te: () => "మీరు అవును అన్నారు — ఇప్పుడు ప్రమాణీకరణ అవసరం. Demo PIN నమోదు చేయండి.",
  kn: () => "ನೀವು ಹೌದು ಎಂದು ಹೇಳಿದ್ದೀರಿ — ಈಗ ದೃಢೀಕರಣ ಬೇಕು. Demo PIN ನಮೂದಿಸಿ.",
};

export const HELP: Tpl = {
  hi: () =>
    "Namaste! Main Vyapar-Mind hoon. Aap poochh sakte hain: aaj ki sale, inactive customers, stock, udhaar, ya loan offer. Payment aane par main turant announce karungi.",
  en: () =>
    "Hello! I'm Vyapar-Mind. Ask me about today's sales, inactive customers, stock, udhaar (credit), or a loan offer. When a payment arrives I'll announce it instantly.",
  ta: () =>
    "வணக்கம்! நான் Vyapar-Mind. இன்றைய விற்பனை, வராத வாடிக்கையாளர்கள், சரக்கு, கடன் அல்லது கடன் ஆஃபர் பற்றி கேளுங்கள். Payment வந்தால் உடனே அறிவிப்பேன்.",
  te: () =>
    "నమస్కారం! నేను Vyapar-Mind. ఈరోజు అమ్మకాలు, రాని కస్టమర్లు, స్టాక్, అప్పు లేదా రుణం ఆఫర్ గురించి అడగండి. Payment వస్తే వెంటనే ప్రకటిస్తాను.",
  kn: () =>
    "ನಮಸ್ಕಾರ! ನಾನು Vyapar-Mind. ಇಂದಿನ ಮಾರಾಟ, ಬಾರದ ಗ್ರಾಹಕರು, ಸ್ಟಾಕ್, ಸಾಲ ಅಥವಾ ಸಾಲ ಆಫರ್ ಬಗ್ಗೆ ಕೇಳಿ. Payment ಬಂದರೆ ತಕ್ಷಣ ತಿಳಿಸುತ್ತೇನೆ.",
};

export const UNKNOWN: Tpl = {
  hi: () =>
    "Maaf kijiye, yeh samajh nahi aaya. Aap sale, stock, udhaar, customers ya loan ke baare mein poochh sakte hain.",
  en: () => "Sorry, I didn't catch that. Ask me about sales, stock, udhaar, customers, or a loan.",
  ta: () => "மன்னிக்கவும், இது புரியவில்லை. விற்பனை, சரக்கு, கடன், வாடிக்கையாளர் அல்லது கடன் ஆஃபர் பற்றி கேளுங்கள்.",
  te: () => "క్షమించండి, అర్థం కాలేదు. అమ్మకాలు, స్టాక్, అప్పు, కస్టమర్లు లేదా రుణం గురించి అడగండి.",
  kn: () => "ಕ್ಷಮಿಸಿ, ಇದು ಅರ್ಥವಾಗಲಿಲ್ಲ. ಮಾರಾಟ, ಸ್ಟಾಕ್, ಸಾಲ, ಗ್ರಾಹಕರು ಅಥವಾ ಸಾಲ ಆಫರ್ ಬಗ್ಗೆ ಕೇಳಿ.",
};

export const SYSTEM_ERROR: Tpl = {
  hi: () => "Sorry, system error aa gayi. Dobara koshish kijiye.",
  en: () => "Sorry, a system error occurred. Please try again.",
  ta: () => "மன்னிக்கவும், சிஸ்டம் பிழை. மீண்டும் முயற்சிக்கவும்.",
  te: () => "క్షమించండి, సిస్టమ్ లోపం. మళ్లీ ప్రయత్నించండి.",
  kn: () => "ಕ್ಷಮಿಸಿ, ಸಿಸ್ಟಮ್ ದೋಷ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
};

// ───────── Server-side approve/reject mutation messages ─────────
export const APPROVED_UDHAAR_OK: Tpl = {
  hi: (n: string, amt: string) => `${n} ka ₹${amt} udhaar successfully update ho gaya.`,
  en: (n: string, amt: string) => `${n}'s ₹${amt} udhaar was updated successfully.`,
  ta: (n: string, amt: string) => `${n} கடன் ₹${amt} வெற்றிகரமாக புதுப்பிக்கப்பட்டது.`,
  te: (n: string, amt: string) => `${n} అప్పు ₹${amt} విజయవంతంగా అప్‌డేట్ అయింది.`,
  kn: (n: string, amt: string) => `${n} ಸಾಲ ₹${amt} ಯಶಸ್ವಿಯಾಗಿ ಅಪ್‌ಡೇಟ್ ಆಗಿದೆ.`,
};

export const APPROVED_DETAIL: Tpl = {
  hi: () => "Ledger entry created. Sensitive write executed only after PIN approval.",
  en: () => "Ledger entry created. Sensitive write executed only after PIN approval.",
  ta: () => "Ledger entry உருவாக்கப்பட்டது. PIN ஒப்புதலுக்குப் பிறகே எழுதப்பட்டது.",
  te: () => "Ledger entry సృష్టించబడింది. PIN ఆమోదం తర్వాతే నమోదైంది.",
  kn: () => "Ledger entry ರಚಿಸಲಾಗಿದೆ. PIN ಅನುಮೋದನೆಯ ನಂತರವೇ ಬರೆಯಲಾಗಿದೆ.",
};

export const APPROVED_CAMPAIGN_OK: Tpl = {
  hi: (n: number) => `Campaign created for ${n} customers. Delivery simulated (no real WhatsApp sent).`,
  en: (n: number) => `Campaign created for ${n} customers. Delivery simulated (no real WhatsApp sent).`,
  ta: (n: number) => `${n} வாடிக்கையாளர்களுக்கு campaign உருவாக்கப்பட்டது. அனுப்புதல் simulated (real WhatsApp அனுப்பப்படவில்லை).`,
  te: (n: number) => `${n} కస్టమర్లకు campaign సృష్టించబడింది. డెలివరీ simulated (real WhatsApp పంపబడలేదు).`,
  kn: (n: number) => `${n} ಗ್ರಾಹಕರಿಗೆ campaign ರಚಿಸಲಾಗಿದೆ. ವಿತರಣೆ simulated (real WhatsApp ಕಳುಹಿಸಲಾಗಿಲ್ಲ).`,
};

export const APPROVED_CAMPAIGN_DETAIL: Tpl = {
  hi: (id: string) => `Campaign id ${id}. Channel: simulated_whatsapp (demo only).`,
  en: (id: string) => `Campaign id ${id}. Channel: simulated_whatsapp (demo only).`,
  ta: (id: string) => `Campaign id ${id}. Channel: simulated_whatsapp (demo only).`,
  te: (id: string) => `Campaign id ${id}. Channel: simulated_whatsapp (demo only).`,
  kn: (id: string) => `Campaign id ${id}. Channel: simulated_whatsapp (demo only).`,
};

export const ACTION_EXPIRED: Tpl = {
  hi: () => "Yeh action expire ho gaya ya already processed hai.",
  en: () => "This action has expired or was already processed.",
  ta: () => "இந்த செயல் காலாவதியாகிவிட்டது அல்லது ஏற்கனவே செயல்படுத்தப்பட்டது.",
  te: () => "ఈ చర్య గడువు ముగిసింది లేదా ఇప్పటికే ప్రాసెస్ చేయబడింది.",
  kn: () => "ಈ ಕ್ರಿಯೆ ಅವಧಿ ಮುಗಿದಿದೆ ಅಥವಾ ಈಗಾಗಲೇ ಪ್ರಕ್ರಿಯೆಗೊಂಡಿದೆ.",
};

export const WINDOW_EXPIRED: Tpl = {
  hi: () => "Approval window expire ho gaya. Request dobara bhejiye.",
  en: () => "The approval window has expired. Please send the request again.",
  ta: () => "ஒப்புதல் காலம் முடிந்தது. கோரிக்கையை மீண்டும் அனுப்புங்கள்.",
  te: () => "ఆమోద వ్యవధి ముగిసింది. అభ్యర్థనను మళ్లీ పంపండి.",
  kn: () => "ಅನುಮೋದನೆ ಅವಧಿ ಮುಗಿಯಿತು. ವಿನಂತಿಯನ್ನು ಮತ್ತೆ ಕಳುಹಿಸಿ.",
};

export const WRONG_PIN: Tpl = {
  hi: () => "Galat PIN. Dobara koshish kijiye.",
  en: () => "Wrong PIN. Please try again.",
  ta: () => "தவறான PIN. மீண்டும் முயற்சிக்கவும்.",
  te: () => "తప్పు PIN. మళ్లీ ప్రయత్నించండి.",
  kn: () => "ತಪ್ಪಾದ PIN. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
};

export const REJECTED_MSG: Tpl = {
  hi: () => "Action cancel kar diya. Koi change nahi hua.",
  en: () => "Action cancelled. Nothing was changed.",
  ta: () => "செயல் ரத்து செய்யப்பட்டது. எதுவும் மாற்றப்படவில்லை.",
  te: () => "చర్య రద్దు చేయబడింది. ఏమీ మార్చబడలేదు.",
  kn: () => "ಕ್ರಿಯೆ ರದ್ದುಪಡಿಸಲಾಗಿದೆ. ಏನೂ ಬದಲಾಗಿಲ್ಲ.",
};
