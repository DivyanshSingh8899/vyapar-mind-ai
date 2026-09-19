// ─────────────────────────────────────────────────────────────────────────────
// Vyapar-Mind — Agent engine (multilingual)
// Deterministic intent router → business tools → merchant-friendly responses
// in Hindi, English, Tamil, Telugu or Kannada. The LLM never touches the DB
// directly: all access goes through tools, and sensitive writes are enqueued
// as pending_actions for merchant approval.
// ─────────────────────────────────────────────────────────────────────────────
import { Id } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";
import {
  CUSTOMER_ALIASES,
  INTENT_KEYWORDS,
  PRODUCT_ALIASES,
  isLang,
  type Lang,
} from "./langs";
import {
  APPROVE_AUTH_MSG,
  APPROVE_PENDING_DETAIL,
  CUSTOMER_INSIGHTS,
  CUSTOMER_NOT_FOUND,
  HELP,
  INACTIVE_LIST,
  INVENTORY_ALL_OK,
  INVENTORY_LOW_LIST,
  LOAN_NONE,
  LOAN_OFFER,
  NO_INACTIVE,
  NO_PENDING,
  NO_WINBACK_TARGETS,
  PAYMENT_PRIORITY,
  PRODUCT_LOW,
  PRODUCT_NOT_FOUND,
  PRODUCT_OK,
  SALES_TODAY,
  SYSTEM_ERROR,
  UDHAAR_AUTH_MSG,
  UDHAAR_BALANCE_ONE,
  UDHAAR_CONFIRM_LABEL,
  UDHAAR_NEED_AMOUNT,
  UDHAAR_NEED_NAME,
  UDHAAR_PENDING_DETAIL,
  UDHAAR_PENDING_SUMMARY,
  UDHAAR_TOTAL,
  UNKNOWN,
  WINBACK_CONFIRM_LABEL,
  WINBACK_PENDING_DETAIL,
  WINBACK_PENDING_SUMMARY,
  WINBACK_PROPOSAL,
} from "./responses";
import {
  getCustomerInsights,
  getInactiveCustomers,
  getInventoryStatus,
  getLoanRecommendation,
  getProductStock,
  getSalesSummary,
  getTodaySales,
  getUdhaarBalance,
  inr,
} from "./tools";
import { internal } from "./_generated/api";

export type Intent =
  | "SALES_QUERY"
  | "CUSTOMER_INSIGHT"
  | "CUSTOMER_WINBACK"
  | "INVENTORY_QUERY"
  | "UDHAAR_QUERY"
  | "UDHAAR_UPDATE"
  | "LOAN_RECOMMENDATION"
  | "PAYMENT_EVENT"
  | "GENERAL_MERCHANT_QUERY"
  | "CREATE_QR"
  | "APPROVE_ACTION"
  | "UNKNOWN";

export type AgentResult = {
  intent: Intent;
  tool: string;
  response: string;
  lang: Lang;
  success: boolean;
  /** Sensitive action awaiting merchant approval + demo PIN. */
  pendingAction?: {
    actionId: string;
    actionType: "udhaar_update" | "create_campaign";
    summary: string;
    detail: string;
    confirmLabel: string;
    payload: Record<string, unknown>;
  };
};

const numWords: Record<string, number> = {
  ek: 1,
  do: 2,
  teen: 3,
  char: 4,
  paanch: 5,
  panch: 5,
  bees: 20,
  tees: 30,
  chaalis: 40,
  pachaas: 50,
  saath: 60,
};

const has = (t: string, ...words: string[]) => words.some((w) => t.includes(w));

// ── QR creation (voice/text: "10 rupees ka QR banao") ──
const QR_MENTION = /\bq\s?r\b|क्यू\s?आर|கியூ\s?ஆர்|క్యూ\s?ఆర్|ಕ್ಯೂ\s?ಆರ್/i;
const QR_WORDS: Record<string, number> = {
  ten: 10,
  twenty: 20,
  fifty: 50,
  hundred: 100,
  das: 10,
  bees: 20,
  pachaas: 50,
  sau: 100,
  दस: 10,
  बीस: 20,
  पचास: 50,
  सौ: 100,
};
function extractQrAmount(raw: string): number | null {
  const t = raw.toLowerCase();
  const cur = "(?:₹|rs\\.?|rupees?|rupaye|रुपये|रुपए|ரூபாய்|రూపాయలు|ರೂಪಾಯಿ)";
  const m =
    t.match(new RegExp(cur + "\\s*([0-9][0-9,]*)", "i")) ??
    t.match(new RegExp("([0-9][0-9,]*)\\s*" + cur, "i")) ??
    t.match(/\b([0-9][0-9,]*)\b/);
  if (m) return parseInt(m[1].replace(/,/g, ""), 10);
  for (const [w, n] of Object.entries(QR_WORDS)) {
    if (new RegExp(`(^|\\s)${w}(\\s|$)`).test(t)) return n;
  }
  return null;
}
const QR_CREATING: Record<Lang, (amt: string) => string> = {
  hi: (a) => `${a} का QR बना रहा हूँ। स्क्रीन पर दिखेगा।`,
  en: (a) => `Creating a ${a} QR. It will appear on screen.`,
  ta: (a) => `${a} QR உருவாக்குகிறேன். திரையில் தெரியும்.`,
  te: (a) => `${a} QR తయారు చేస్తున్నాను. స్క్రీన్‌పై కనిపిస్తుంది.`,
  kn: (a) => `${a} QR ರಚಿಸುತ್ತಿದ್ದೇನೆ. ಪರದೆಯಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.`,
};
const QR_NEED_AMOUNT: Record<Lang, string> = {
  hi: "कितने रुपये का QR बनाना है?",
  en: "For how many rupees should I make the QR?",
  ta: "எத்தனை ரூபாய்க்கு QR வேண்டும்?",
  te: "ఎన్ని రూపాయలకు QR కావాలి?",
  kn: "ಎಷ್ಟು ರೂಪಾಯಿಗೆ QR ಬೇಕು?",
};

// ── Payment summary / last payment ──
const PAY_MENTION =
  /payment|paise|paisa|received|collection|पेमेंट|पैसे|पैसा|भुगतान|பணம்|பேமெண்ட்|చెల్లింపు|పేమెంట్|ಪಾವತಿ|ಪೇಮೆಂಟ್/i;
const NOT_PAY = /udhaar|udhar|khata|khate|loan|inventory|stock|उधार|खाता|लोन/i;
const LAST_WORD =
  /last|latest|recent|previous|pichla|pichli|aakhri|akhri|आखिरी|आख़िरी|पिछला|पिछली|கடைசி|చివరి|ಕೊನೆಯ/i;

const AGO: Record<
  Lang,
  { now: string; min: (n: number) => string; hr: (n: number) => string }
> = {
  hi: {
    now: "अभी अभी",
    min: (n) => `${n} मिनट पहले`,
    hr: (n) => `${n} घंटे पहले`,
  },
  en: {
    now: "just now",
    min: (n) => `${n} minutes ago`,
    hr: (n) => `${n} hours ago`,
  },
  ta: {
    now: "இப்போதுதான்",
    min: (n) => `${n} நிமிடங்களுக்கு முன்`,
    hr: (n) => `${n} மணி நேரத்திற்கு முன்`,
  },
  te: {
    now: "ఇప్పుడే",
    min: (n) => `${n} నిమిషాల క్రితం`,
    hr: (n) => `${n} గంటల క్రితం`,
  },
  kn: {
    now: "ಈಗಷ್ಟೇ",
    min: (n) => `${n} ನಿಮಿಷಗಳ ಹಿಂದೆ`,
    hr: (n) => `${n} ಗಂಟೆಗಳ ಹಿಂದೆ`,
  },
};
function agoText(lang: Lang, ms: number): string {
  const m = Math.round(ms / 60000);
  if (m < 1) return AGO[lang].now;
  if (m < 90) return AGO[lang].min(m);
  return AGO[lang].hr(Math.round(m / 60));
}
const PAY_TODAY: Record<Lang, (total: string, count: number) => string> = {
  hi: (t, c) => `आज अब तक ${c} पेमेंट में कुल ${t} आए हैं।`,
  en: (t, c) => `So far today: ${t} across ${c} payments.`,
  ta: (t, c) =>
    `இன்று இதுவரை ${c} பணம் செலுத்தல்களில் மொத்தம் ${t} வந்துள்ளது.`,
  te: (t, c) => `ఈ రోజు ఇప్పటివరకు ${c} చెల్లింపుల్లో మొత్తం ${t} వచ్చింది.`,
  kn: (t, c) => `ಇಂದು ಇಲ್ಲಿಯವರೆಗೆ ${c} ಪಾವತಿಗಳಲ್ಲಿ ಒಟ್ಟು ${t} ಬಂದಿದೆ.`,
};
const PAY_LAST: Record<
  Lang,
  (amt: string, who: string, ago: string) => string
> = {
  hi: (a, w, g) => `आख़िरी पेमेंट ${a} का था, ${w} से, ${g}।`,
  en: (a, w, g) => `The last payment was ${a} from ${w}, ${g}.`,
  ta: (a, w, g) => `கடைசி பணம் ${a}, ${w} இடமிருந்து, ${g}.`,
  te: (a, w, g) => `చివరి చెల్లింపు ${a}, ${w} నుండి, ${g}.`,
  kn: (a, w, g) => `ಕೊನೆಯ ಪಾವತಿ ${a}, ${w} ಅವರಿಂದ, ${g}.`,
};
const PAY_NONE: Record<Lang, string> = {
  hi: "अभी तक कोई पेमेंट नहीं आया है।",
  en: "No payments received yet.",
  ta: "இதுவரை எந்த பணமும் வரவில்லை.",
  te: "ఇంకా ఏ చెల్లింపు రాలేదు.",
  kn: "ಇನ್ನೂ ಯಾವುದೇ ಪಾವತಿ ಬಂದಿಲ್ಲ.",
};

/**
 * Multilingual intent router (deterministic, testable).
 * Matches native-script + romanized keywords for each language, and always
 * falls back to the Hindi/English keyword set (mixed speech is common).
 */
export function routeIntent(raw: string, lang: Lang = "hi"): Intent {
  const t = raw.toLowerCase().trim();
  const kw = INTENT_KEYWORDS[lang];

  if (QR_MENTION.test(raw)) return "CREATE_QR";

  // ── Sensitive action: udhaar/credit update ──
  if (
    has(t, ...kw.udhaarUpdate) &&
    (has(t, ...kw.udhaarQuery) ||
      /(\d{2,6})/.test(t) ||
      has(
        t,
        "update",
        "karo",
        "புதுப்பி",
        "అప్‌డేట్",
        "ಅಪ್‌ಡೇಟ್",
        "చెయ్యి",
        "ಮಾಡು",
        "மாற்று",
        "செய்",
      ))
  ) {
    return "UDHAAR_UPDATE";
  }

  // ── Win-back campaign ──
  if (
    has(t, ...kw.winback) &&
    (has(t, ...kw.customers) ||
      has(
        t,
        "unko",
        "unhe",
        "அவர்களுக்கு",
        "వాళ్లకి",
        "ಅವರಿಗೆ",
        "அவங்க",
        "వాళ్ళు",
        "ಅವರು",
      ))
  ) {
    return "CUSTOMER_WINBACK";
  }
  if (has(t, "campaign", "win back", "winback", "wapas la"))
    return "CUSTOMER_WINBACK";

  if (PAY_MENTION.test(raw) && !NOT_PAY.test(raw)) return "PAYMENT_EVENT";

  // ── Loan ──
  if (has(t, ...kw.loan) && !has(t, ...kw.udhaarQuery))
    return "LOAN_RECOMMENDATION";

  // ── Udhaar (credit) query ──
  if (has(t, ...kw.udhaarQuery)) return "UDHAAR_QUERY";

  // ── Inventory ──
  if (has(t, ...kw.inventory)) return "INVENTORY_QUERY";

  // ── Sales ──
  if (has(t, ...kw.sales)) return "SALES_QUERY";

  // ── Customers ──
  // "Who hasn't come in N days?" often omits the word "customer" entirely —
  // detect the inactive-phrasing directly (works in all 5 languages).
  if (has(t, ...kw.customers) || has(t, ...kw.inactive))
    return "CUSTOMER_INSIGHT";

  // ── Approval (voice "yes") ──
  if (has(t, ...kw.approve)) return "APPROVE_ACTION";

  // ── Payment event ──
  if (has(t, ...kw.payment)) return "PAYMENT_EVENT";

  // ── Help / greeting ──
  if (has(t, ...kw.help)) return "GENERAL_MERCHANT_QUERY";

  // Cross-language fallback (mixed-language speech is common in India):
  return routeIntentEnFb(t);
}

/** Secondary English-keyword pass for mixed-language utterances. */
function routeIntentEnFb(t: string): Intent {
  if (
    has(t, "udhaar") &&
    has(t, "update", "karo", "kam", "add", "jodo", "deduct", "repay")
  )
    return "UDHAAR_UPDATE";
  if (has(t, "offer", "coupon", "campaign")) return "CUSTOMER_WINBACK";
  if (has(t, "loan", "credit")) return "LOAN_RECOMMENDATION";
  if (has(t, "udhaar", "khata")) return "UDHAAR_QUERY";
  if (has(t, "stock", "inventory", "maal", "saman")) return "INVENTORY_QUERY";
  if (
    has(
      t,
      "kitni sale",
      "kitna business",
      "aaj ka",
      "today",
      "sales",
      "business kaisa",
      "business hua",
      "summary",
    )
  )
    return "SALES_QUERY";
  if (has(t, "customer")) return "CUSTOMER_INSIGHT";
  if (has(t, "haan", "yes", "confirm", "approve", "ok"))
    return "APPROVE_ACTION";
  if (has(t, "payment", "aaya", "received", "paisa")) return "PAYMENT_EVENT";
  return "UNKNOWN";
}

function extractDays(t: string): number {
  const m =
    t.match(
      /(\d+)\s*(din|day|days|dino|நாள்|நாட்கள்|రోజు|రోజులు|ದಿನ|ದಿನಗಳು)/,
    ) ??
    t.match(/(?:நாட்களாக|రోజులుగా|ದಿನವಾಗಿ)\s*(\d+)/) ??
    t.match(/(\d+)\s*(?:நாட்கள|రోజుల|ದಿನಗಳ)/);
  if (m) return Math.max(1, parseInt(m[1], 10));
  for (const [w, n] of Object.entries(numWords)) {
    if (new RegExp(`${w}\\s*(din|day)`).test(t)) return n;
  }
  return 30;
}

function extractAmount(t: string): number | null {
  const m =
    t.match(
      /(?:₹|rs\.?|rupees|rupaye|ரூபாய்|రూపాయలు|ರೂಪಾಯಿ)\s*([0-9][0-9,]*)/i,
    ) ??
    t.match(
      /([0-9][0-9,]*)\s*(?:₹|rs\.?|rupaye|rupees|ரூபாய்|రూపాయలు|ರೂಪಾಯಿ)/i,
    );
  if (m) return parseInt(m[1].replace(/,/g, ""), 10);
  // Native-script utterances usually place the bare number before the currency word
  const native = t.match(/(\d{2,6})\s*[^\x00-\x7F]/);
  if (native) return parseInt(native[1], 10);
  const plain = t.match(/\b(\d{2,6})\b/);
  return plain ? parseInt(plain[1], 10) : null;
}

/** Resolve a customer name from any language (native script → canonical). */
export function extractCustomerName(
  raw: string,
  lang: Lang = "hi",
): string | null {
  const t = raw.toLowerCase();

  // 1) Native-script alias → canonical English first name.
  for (const [alias, canonical] of Object.entries(CUSTOMER_ALIASES)) {
    if (raw.includes(alias)) return canonical;
  }

  // 2) Romanized "ramesh ka / ramesh kadan / for ramesh" patterns.
  const m =
    t.match(/([a-z]+(?:\s[a-z]+)?)\s*(?:ka|ki|kaa|kuda|kadan|odu|n|ey)\s/) ??
    t.match(/(?:for|of)\s+([a-z]+(?:\s[a-z]+)?)/);
  if (m) {
    const stop = new Set([
      "aaj",
      "kal",
      "milk",
      "stock",
      "udhaar",
      "udhar",
      "kitna",
      "kitne",
      "update",
      "offer",
      "payment",
      "te",
      "thi",
      "palu",
      "paal",
      "haalu",
      "enna",
      "kya",
      "kadan",
      "appu",
      "saala",
      "khata",
      "khate",
    ]);
    const candidate = m[1].trim();
    if (!stop.has(candidate)) {
      return candidate
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  }

  // 3) Known first names anywhere in the utterance.
  const known = [
    "ramesh",
    "suresh",
    "anita",
    "vijay",
    "pooja",
    "amit",
    "kavita",
    "irfan",
    "lakhan",
    "deepak",
    "sunita",
    "rahul",
    "manoj",
    "rekha",
    "harish",
    "gopal",
    "neelam",
    "shankar",
  ];
  for (const k of known)
    if (t.includes(k)) return k.charAt(0).toUpperCase() + k.slice(1);

  void lang;
  return null;
}

/** Resolve a product from any language (native script → canonical). */
export function extractProduct(raw: string, lang: Lang = "hi"): string | null {
  // 1) Native/romanized alias → canonical seeded product.
  for (const [alias, canonical] of Object.entries(PRODUCT_ALIASES)) {
    if (
      raw.toLowerCase().includes(alias.toLowerCase()) &&
      /[\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF]/.test(raw)
    ) {
      return canonical;
    }
  }

  const t = raw.toLowerCase();
  // 2) Known English catalogue keywords (most reliable path).
  const known = [
    "milk",
    "bread",
    "egg",
    "rice",
    "atta",
    "wheat",
    "dal",
    "oil",
    "sugar",
    "tea",
    "biscuit",
    "detergent",
    "soap",
    "shampoo",
    "butter",
    "curd",
    "flour",
  ];
  for (const k of known) if (t.includes(k)) return k;

  // 3) Romanized South-Indian product words.
  for (const [alias, canonical] of Object.entries(PRODUCT_ALIASES)) {
    if (/^[a-z]+$/i.test(alias) && new RegExp(`\\b${alias}\\b`).test(t))
      return canonical;
  }

  // 4) Generic "X ka stock" extraction.
  const m = t.match(
    /(?:ka|ki|of|kitna|kitne|சரக்கு|స్టాక్|ಸ್ಟಾಕ್)\s+([a-z][a-z0-9 ()\-]*?)\s*(?:ka|ki|kitna|kitne|stock|hai|left|bacha|$)/,
  );
  if (m) {
    const cand = m[1].trim();
    const stop =
      /^(kitna|kitne|kya|sab|kaisa|stock|saman|maal|udhaar|udhar|offer)$/;
    if (cand && !stop.test(cand)) return cand;
  }

  void lang;
  return null;
}

/** Random hex id for pending actions. */
const actionId = () =>
  Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 0xffff)
      .toString(16)
      .padStart(4, "0"),
  ).join("");

// ───────────────────────── AGENT ENGINE ─────────────────────────

/**
 * Run the agent for a merchant utterance in the chosen language. Pure read
 * intents execute immediately; sensitive writes create a pending_action that
 * requires merchant approval (demo PIN) before anything touches the database.
 */
export async function runAgent(
  ctx: MutationCtx,
  merchantId: Id<"merchants">,
  userInput: string,
  source: "voice" | "text" | "demo" = "text",
  langInput?: string,
): Promise<AgentResult> {
  const lang: Lang = isLang(langInput) ? langInput : "hi";
  const intent = routeIntent(userInput, lang);
  const t = userInput.toLowerCase();
  const R =
    (tpl: Record<Lang, (...a: any[]) => string>) =>
    (...a: unknown[]) =>
      tpl[lang](...a);
  let tool = "unknown";
  let response = "";
  let success = true;
  let pendingAction: AgentResult["pendingAction"];

  try {
    switch (intent) {
      case "SALES_QUERY": {
        tool = "get_today_sales";
        const s = await getTodaySales(ctx, merchantId);
        const dir = s.deltaPct >= 0 ? "zyada" : "kam";
        response = R(SALES_TODAY)(
          inr(s.todaySales),
          s.txnCount,
          inr(s.avgValue),
          s.deltaPct,
          dir,
          s.topCategory,
        );
        break;
      }

      case "CREATE_QR": {
        tool = "create_qr";
        const amount = extractQrAmount(userInput);
        if (!amount || amount < 1 || amount > 100000) {
          response = QR_NEED_AMOUNT[lang];
          success = false;
          break;
        }
        await ctx.scheduler.runAfter(0, internal.razorpay.createQrFromAgent, {
          amount,
        });
        response = QR_CREATING[lang](inr(amount));
        break;
      }

      case "CUSTOMER_INSIGHT": {
        if (
          has(
            t,
            "nahi aaye",
            "nahi aaya",
            "inactive",
            "gayab",
            "வரவில்லை",
            "రాలేదు",
            "రాని",
            "ಬಂದಿಲ್ಲ",
            "ಬಾರದ",
          )
        ) {
          tool = "get_inactive_customers";
          const days = extractDays(t);
          const r = await getInactiveCustomers(ctx, merchantId, days);
          response = r.count
            ? R(INACTIVE_LIST)(
                r.count,
                days,
                r.customers
                  .slice(0, 3)
                  .map((c) => `${c.name} (${c.daysSince})`)
                  .join(", "),
              )
            : R(NO_INACTIVE)(days);
        } else {
          tool = "get_customer_insights";
          const r = await getCustomerInsights(ctx, merchantId);
          response = R(CUSTOMER_INSIGHTS)(
            r.totalCustomers,
            r.active,
            r.returning,
            r.inactive,
            r.topCustomers[0]?.name ?? "—",
            inr(r.topCustomers[0]?.totalSpent ?? 0),
          );
        }
        break;
      }

      case "CUSTOMER_WINBACK": {
        tool = "get_inactive_customers";
        const days = extractDays(t) || 30;
        const r = await getInactiveCustomers(ctx, merchantId, days);
        if (!r.count) {
          response = R(NO_WINBACK_TARGETS)(days);
          break;
        }
        const amt = extractAmount(t);
        const offer = amt ? `₹${amt} coupon` : "₹50 promotional coupon";
        const actionIdStr = actionId();
        await ctx.db.insert("pendingActions", {
          merchantId,
          actionType: "create_campaign",
          payload: {
            days,
            offer,
            customerNames: r.customers.map((c) => c.name),
            actionId: actionIdStr,
          },
          summary: R(WINBACK_PENDING_SUMMARY)(offer, r.count),
          status: "pending",
          expiresAt: Date.now() + 10 * 60 * 1000,
          createdAt: Date.now(),
        });
        pendingAction = {
          actionId: actionIdStr,
          actionType: "create_campaign",
          summary: R(WINBACK_PENDING_SUMMARY)(offer, r.count),
          detail: R(WINBACK_PENDING_DETAIL)(
            r.count,
            days,
            r.customers
              .slice(0, 5)
              .map((c) => c.name)
              .join(", ") + (r.count > 5 ? "…" : ""),
            offer,
          ),
          confirmLabel: R(WINBACK_CONFIRM_LABEL)(r.count),
          payload: {},
        };
        response = R(WINBACK_PROPOSAL)(r.count, days, offer);
        break;
      }

      case "INVENTORY_QUERY": {
        const product = extractProduct(userInput, lang);
        if (product) {
          tool = "get_product_stock";
          const p = await getProductStock(ctx, merchantId, product);
          if (!p.found) {
            response = R(PRODUCT_NOT_FOUND)(product);
            success = false;
          } else if (p.quantity <= p.reorderLevel) {
            response = R(PRODUCT_LOW)(
              p.productName,
              p.quantity,
              p.reorderLevel,
            );
          } else {
            response = R(PRODUCT_OK)(p.productName, p.quantity, `₹${p.price}`);
          }
        } else {
          tool = "get_inventory_status";
          const inv = await getInventoryStatus(ctx, merchantId);
          response = inv.lowStockCount
            ? R(INVENTORY_LOW_LIST)(
                inv.totalProducts,
                inv.lowStockCount,
                inv.lowStock
                  .slice(0, 3)
                  .map((p) => `${p.name} (${p.qty})`)
                  .join(", "),
              )
            : R(INVENTORY_ALL_OK)(inv.totalProducts);
        }
        break;
      }

      case "UDHAAR_QUERY": {
        tool = "get_udhaar_balance";
        const name = extractCustomerName(userInput, lang);
        const r = await getUdhaarBalance(ctx, merchantId, name ?? undefined);
        if (name && !r.found) {
          response = R(CUSTOMER_NOT_FOUND)(name);
          success = false;
        } else if (name && "balance" in r) {
          response = R(UDHAAR_BALANCE_ONE)(
            (r as { name: string }).name,
            inr((r as { balance: number }).balance),
          );
        } else {
          const rr = r as {
            total: number;
            customerCount: number;
            top: { name: string; amount: number }[];
          };
          response = R(UDHAAR_TOTAL)(
            inr(rr.total),
            rr.customerCount,
            rr.top.map((c) => `${c.name} (${inr(c.amount)})`).join(", "),
          );
        }
        break;
      }

      case "UDHAAR_UPDATE": {
        tool = "update_udhaar (pending approval)";
        const name = extractCustomerName(userInput, lang);
        const amount = extractAmount(t);
        if (!name || !amount) {
          response = name ? R(UDHAAR_NEED_AMOUNT)(name) : R(UDHAAR_NEED_NAME)();
          success = false;
          break;
        }
        const bal = await getUdhaarBalance(ctx, merchantId, name);
        if (!bal.found) {
          response = R(CUSTOMER_NOT_FOUND)(name);
          success = false;
          break;
        }
        // SENSITIVE: never execute directly. Enqueue for merchant PIN approval.
        const balOk = bal as { name: string; balance: number };
        const actionIdStr = actionId();
        await ctx.db.insert("pendingActions", {
          merchantId,
          actionType: "udhaar_update",
          payload: { customerName: balOk.name, amount, actionId: actionIdStr },
          summary: R(UDHAAR_PENDING_SUMMARY)(balOk.name, inr(amount)),
          status: "pending",
          expiresAt: Date.now() + 10 * 60 * 1000,
          createdAt: Date.now(),
        });
        pendingAction = {
          actionId: actionIdStr,
          actionType: "udhaar_update",
          summary: R(UDHAAR_PENDING_SUMMARY)(balOk.name, inr(amount)),
          detail: R(UDHAAR_PENDING_DETAIL)(
            inr(balOk.balance),
            inr(Math.max(0, balOk.balance - amount)),
          ),
          confirmLabel: R(UDHAAR_CONFIRM_LABEL)(inr(amount)),
          payload: {},
        };
        response = R(UDHAAR_AUTH_MSG)(balOk.name, inr(amount));
        break;
      }

      case "LOAN_RECOMMENDATION": {
        tool = "get_loan_recommendation";
        const r = await getLoanRecommendation(ctx, merchantId);
        response =
          r.amount > 0
            ? R(LOAN_OFFER)(inr(r.amount), r.activityScore, r.reason)
            : R(LOAN_NONE)(r.activityScore);
        break;
      }

      case "PAYMENT_EVENT": {
        tool = "get_payment_summary";
        const s = await getTodaySales(ctx, merchantId);
        const last = await ctx.db
          .query("paymentEvents")
          .withIndex("by_merchant_time", (q) => q.eq("merchantId", merchantId))
          .order("desc")
          .first();
        const lastLine = last
          ? PAY_LAST[lang](
              inr(last.amount),
              last.customerReference,
              agoText(lang, Date.now() - last.createdAt),
            )
          : PAY_NONE[lang];
        response = LAST_WORD.test(userInput)
          ? lastLine
          : `${PAY_TODAY[lang](inr(s.todaySales), s.txnCount)} ${lastLine}`;
        break;
      }

      case "APPROVE_ACTION": {
        const pend = await ctx.db
          .query("pendingActions")
          .withIndex("by_merchant_status", (q) =>
            q.eq("merchantId", merchantId).eq("status", "pending"),
          )
          .order("desc")
          .first();
        if (!pend) {
          response = R(NO_PENDING)();
          success = false;
          break;
        }
        pendingAction = {
          actionId:
            (pend.payload as { actionId?: string }).actionId ??
            pend._id.slice(-8),
          actionType: pend.actionType as "udhaar_update" | "create_campaign",
          summary: pend.summary,
          detail: R(APPROVE_PENDING_DETAIL)(),
          confirmLabel: "Approve & authenticate",
          payload: {},
        };
        tool = "request_action_approval";
        response = R(APPROVE_AUTH_MSG)();
        break;
      }

      case "GENERAL_MERCHANT_QUERY": {
        tool = "help";
        response = R(HELP)();
        break;
      }

      default: {
        tool = "none";
        success = false;
        response = R(UNKNOWN)();
        break;
      }
    }
  } catch (err) {
    success = false;
    tool = tool === "unknown" ? "error" : tool;
    response = R(SYSTEM_ERROR)();
    console.error("[vyapar-mind] agent error:", err);
  }

  return { intent, tool, response, lang, success, pendingAction };
}
