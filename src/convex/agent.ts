// ─────────────────────────────────────────────────────────────────────────────
// Vyapar-Mind — Agent engine
// Deterministic intent router → business tools → merchant-friendly responses.
// The LLM never touches the DB directly: all access goes through these tools,
// and sensitive writes are enqueued as pending_actions for merchant approval.
// This module is provider-agnostic; if SARVAM_AI_API_KEY is configured, the
// same flow can be routed through Sarvam's LLM for richer NLU (see actions.ts).
// ─────────────────────────────────────────────────────────────────────────────
import { Id } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";
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
  | "APPROVE_ACTION"
  | "UNKNOWN";

export type AgentResult = {
  intent: Intent;
  tool: string;
  response: string;
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
  ek: 1, do: 2, teen: 3, char: 4, paanch: 5, panch: 5,
  bees: 20, tees: 30, chaalis: 40, pachaas: 50, saath: 60,
};

const has = (t: string, ...words: string[]) => words.some((w) => t.includes(w));

/** Hinglish + English intent router (deterministic, testable). */
export function routeIntent(raw: string): Intent {
  const t = raw.toLowerCase().trim();

  if (has(t, "udhaar") && has(t, "update", "karo", "kar do", "kam", "add", "jodo", "deduct", "repay")) {
    return "UDHAAR_UPDATE";
  }
  if (
    has(t, "offer bhej", "offer send", "coupon bhej", "campaign", "win back", "winback", "wapas la") ||
    (has(t, "offer") && has(t, "customer"))
  ) {
    return "CUSTOMER_WINBACK";
  }
  if (has(t, "loan", "credit", "udhaar offer")) return "LOAN_RECOMMENDATION";
  if (has(t, "udhaar", "khata", "udhar")) return "UDHAAR_QUERY";
  if (has(t, "stock", "inventory", "maal", "saman")) return "INVENTORY_QUERY";
  if (
    has(t, "kitni sale", "kitna business", "kitna bikri", "aaj ka", "today", "sales", "revenue",
      "business kaisa", "business hua", "summary", "kal se", "kamai")
  ) {
    return "SALES_QUERY";
  }
  if (has(t, "customer", "graahak", "grahak")) return "CUSTOMER_INSIGHT";
  if (has(t, "haan", "yes", "confirm", "approve", "ok ", "ok", "theek hai", "karo")) {
    return "APPROVE_ACTION";
  }
  if (has(t, "payment", "aaya", "received", "paisa")) return "PAYMENT_EVENT";
  if (has(t, "help", "kya kar sakte", "namaste", "hello", "hi", "hey")) {
    return "GENERAL_MERCHANT_QUERY";
  }
  return "UNKNOWN";
}

function extractDays(t: string): number {
  const m = t.match(/(\d+)\s*(din|day|days|dino)/);
  if (m) return Math.max(1, parseInt(m[1], 10));
  for (const [w, n] of Object.entries(numWords)) {
    if (new RegExp(`${w}\\s*(din|day)`).test(t)) return n;
  }
  return 30;
}

function extractAmount(t: string): number | null {
  const m = t.match(/(?:₹|rs\.?|rupees|rupaye)\s*([0-9][0-9,]*)/i) ?? t.match(/([0-9][0-9,]*)\s*(?:₹|rs\.?|rupaye|rupees)/i);
  if (m) return parseInt(m[1].replace(/,/g, ""), 10);
  const plain = t.match(/\b(\d{2,6})\b/);
  return plain ? parseInt(plain[1], 10) : null;
}

function extractCustomerName(t: string): string | null {
  const m =
    t.match(/([a-z]+(?:\s[a-z]+)?)\s*(?:ka|ki|kaa)\s/) ??
    t.match(/(?:for|of)\s+([a-z]+(?:\s[a-z]+)?)/);
  if (!m) return null;
  const stop = new Set(["aaj", "kal", "milk", "stock", "udhaar", "udhar", "kitna", "kitne", "update", "offer", "payment"]);
  const candidate = m[1].trim();
  if (stop.has(candidate)) return null;
  return candidate
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function extractProduct(t: string): string | null {
  // Known catalogue keywords win first (most reliable path).
  const known = ["milk", "bread", "egg", "rice", "atta", "wheat", "dal", "oil", "sugar", "tea", "biscuit", "detergent", "soap", "shampoo", "butter", "curd", "flour"];
  for (const k of known) if (t.includes(k)) return k;
  const m = t.match(/(?:ka|ki|of|kitna|kitne)\s+([a-z][a-z0-9 ()\-]*?)\s*(?:ka|ki|kitna|kitne|stock|hai|left|bacha|$)/);
  if (m) {
    const cand = m[1].trim();
    const stop = /^(kitna|kitne|kya|sab|kaisa|stock|saman|maal|udhaar|udhar|offer)$/;
    if (cand && !stop.test(cand)) return cand;
  }
  return null;
}

/** Random hex id for pending actions. */
const actionId = () =>
  Array.from({ length: 4 }, () => Math.floor(Math.random() * 0xffff).toString(16).padStart(4, "0")).join("");

// ───────────────────────── AGENT ENGINE ─────────────────────────

/**
 * Run the agent for a merchant utterance. Pure read intents execute
 * immediately; sensitive writes create a pending_action that requires
 * merchant approval (demo PIN) before anything touches the database.
 */
export async function runAgent(
  ctx: MutationCtx,
  merchantId: Id<"merchants">,
  userInput: string,
  source: "voice" | "text" | "demo" = "text",
): Promise<AgentResult> {
  const intent = routeIntent(userInput);
  const t = userInput.toLowerCase();
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
        response =
          `Aaj aapki sale ${inr(s.todaySales)} rahi hai — ${s.txnCount} transactions, average ${inr(s.avgValue)}. ` +
          (s.deltaPct === 0
            ? "Kal ke jaisa hi chal raha hai."
            : `Kal se ${Math.abs(s.deltaPct)}% ${dir} hai.`) +
          (s.topCategory ? ` Sabse zyada ${s.topCategory} category mein bikri hui.` : "");
        break;
      }

      case "CUSTOMER_INSIGHT": {
        if (has(t, "nahi aaye", "nahi aaya", "inactive", "gayab")) {
          tool = "get_inactive_customers";
          const days = extractDays(t);
          const r = await getInactiveCustomers(ctx, merchantId, days);
          response = r.count
            ? `${r.count} customers pichle ${days} din se nahi aaye. Sabse purane: ${r.customers
                .slice(0, 3)
                .map((c) => `${c.name} (${c.daysSince} din)`)
                .join(", ")}. Bol dijiye "unko offer bhej do" to campaign bana dunga.`
            : `Shabaash! Pichle ${days} din mein koi customer inactive nahi hai.`;
        } else {
          tool = "get_customer_insights";
          const r = await getCustomerInsights(ctx, merchantId);
          response =
            `Aapke ${r.totalCustomers} customers hain — ${r.active} active (7 din), ` +
            `${r.returning} repeat, ${r.inactive} 30+ din se nahi aaye. ` +
            `Top customer: ${r.topCustomers[0]?.name ?? "—"} (${inr(r.topCustomers[0]?.totalSpent ?? 0)}).`;
        }
        break;
      }

      case "CUSTOMER_WINBACK": {
        tool = "get_inactive_customers";
        const days = extractDays(t) || 30;
        const r = await getInactiveCustomers(ctx, merchantId, days);
        if (!r.count) {
          response = `Pichle ${days} din mein koi inactive customer nahi mila — campaign ki zaroorat nahi.`;
          break;
        }
        const offer = extractAmount(t) ? `₹${extractAmount(t)} coupon` : "₹50 promotional coupon";
        const actionIdStr = actionId();
        const aid = await ctx.db.insert("pendingActions", {
          merchantId,
          actionType: "create_campaign",
          payload: { days, offer, customerNames: r.customers.map((c) => c.name), actionId: actionIdStr },
          summary: `Win-back campaign for ${r.count} customers (${days}+ din inactive) with ${offer}`,
          status: "pending",
          expiresAt: Date.now() + 10 * 60 * 1000,
          createdAt: Date.now(),
        });
        pendingAction = {
          actionId: actionIdStr,
          actionType: "create_campaign",
          summary: `Campaign: ${offer} → ${r.count} customers`,
          detail: `${r.count} customers pichle ${days} din se nahi aaye: ${r.customers
            .slice(0, 5)
            .map((c) => c.name)
            .join(", ")}${r.count > 5 ? "…" : ""}. Offer: ${offer}. Channel: simulated WhatsApp (demo).`,
          confirmLabel: `Approve campaign for ${r.count} customers`,
          payload: {},
        };
        response =
          `${r.count} customers pichle ${days} din se nahi aaye. Main ${offer} ka win-back campaign bana sakti hoon ` +
          `(simulated WhatsApp). Merchant authentication required hai — approve karenge?`;
        void aid;
        break;
      }

      case "INVENTORY_QUERY": {
        const product = extractProduct(t);
        if (product) {
          tool = "get_product_stock";
          const p = await getProductStock(ctx, merchantId, product);
          if (!p.found) {
            response = `"${product}" naam ka product stock list mein nahi mila. Kya aap product ka exact naam batayenge?`;
            success = false;
          } else if (p.quantity <= p.reorderLevel) {
            response = `${p.productName} ke sirf ${p.quantity} unit bache hain (reorder level ${p.reorderLevel}). Order karne ka time ho gaya hai!`;
          } else {
            response = `${p.productName} ka stock theek hai — ${p.quantity} unit available (₹${p.price} per unit).`;
          }
        } else {
          tool = "get_inventory_status";
          const inv = await getInventoryStatus(ctx, merchantId);
          response = inv.lowStockCount
            ? `Aapke ${inv.totalProducts} products hain, ${inv.lowStockCount} low stock hain: ${inv.lowStock
                .slice(0, 3)
                .map((p) => `${p.name} (${p.qty})`)
                .join(", ")}. Reorder list taiyaar hai.`
            : `Sab ${inv.totalProducts} products ka stock theek hai. Kisi bhi product ka naam boliye, detail bata dunga.`;
        }
        break;
      }

      case "UDHAAR_QUERY": {
        tool = "get_udhaar_balance";
        const name = extractCustomerName(t);
        const r = await getUdhaarBalance(ctx, merchantId, name ?? undefined);
        if (name && !r.found) {
          response = `${name} naam ka customer nahi mila. Kya aap kisi aur customer ka naam batayenge?`;
          success = false;
        } else if (name && "balance" in r) {
          response = `${(r as { name: string }).name} ka udhaar ${inr((r as { balance: number }).balance)} hai.`;
        } else {
          response = `Total udhaar ${inr((r as { total: number }).total)} hai, ${(r as { customerCount: number }).customerCount} customers par. Sabse zyada: ${(r as { top: { name: string; amount: number }[] }).top
            .map((c) => `${c.name} (${inr(c.amount)})`)
            .join(", ")}.`;
        }
        break;
      }

      case "UDHAAR_UPDATE": {
        tool = "update_udhaar (pending approval)";
        const name = extractCustomerName(t);
        const amount = extractAmount(t);
        if (!name || !amount) {
          response = name
            ? "Kitne rupaye ka udhaar update karna hai? Amount bataiye."
            : "Kis customer ka udhaar update karna hai? Naam aur amount dono bataiye.";
          success = false;
          break;
        }
        const bal = await getUdhaarBalance(ctx, merchantId, name);
        if (!bal.found) {
          response = `${name} naam ka customer nahi mila. Kya aap kisi aur customer ka naam batayenge?`;
          success = false;
          break;
        }
        // SENSITIVE: never execute directly. Enqueue for merchant PIN approval.
        const actionIdStr = actionId();
        await ctx.db.insert("pendingActions", {
          merchantId,
          actionType: "udhaar_update",
          payload: { customerName: (bal as { name: string }).name, amount, actionId: actionIdStr },
          summary: `Udhaar update: ${(bal as { name: string }).name} — ${inr(amount)} repayment`,
          status: "pending",
          expiresAt: Date.now() + 10 * 60 * 1000,
          createdAt: Date.now(),
        });
        pendingAction = {
          actionId: actionIdStr,
          actionType: "udhaar_update",
          summary: `${(bal as { name: string }).name} ka udhaar ${inr(amount)} kam karna hai`,
          detail: `Current balance: ${inr((bal as { balance: number }).balance)}. Naya balance: ${inr(
            Math.max(0, (bal as { balance: number }).balance - amount),
          )}. Yeh ek sensitive financial action hai.`,
          confirmLabel: `Approve ${inr(amount)} repayment`,
          payload: {},
        };
        response =
          `${(bal as { name: string }).name} ka udhaar ${inr(amount)} kam karna hai. ` +
          `Udhaar update ke liye merchant authentication required hai — demo PIN daaliye.`;
        break;
      }

      case "LOAN_RECOMMENDATION": {
        tool = "get_loan_recommendation";
        const r = await getLoanRecommendation(ctx, merchantId);
        response =
          r.amount > 0
            ? `Aapki recent business activity ke basis par aapke profile ke liye ek simulated merchant credit offer of ${inr(r.amount)} available hai. Business activity score: ${r.activityScore}/100 — ${r.reason}. Note: yeh DEMO / SIMULATED OFFER hai, koi asli Paytm loan approval nahi.`
            : `Abhi aapki business activity score ${r.activityScore}/100 hai, isliye koi simulated credit offer generate nahi hui. Kuch aur din consistent sale ke baad phir poochhiye. (DEMO / SIMULATED)`;
        break;
      }

      case "PAYMENT_EVENT": {
        tool = "get_today_sales";
        const s = await getTodaySales(ctx, merchantId);
        response = `Payments ke liye Soundbox live hai — aaj ab tak ${inr(s.todaySales)} receive hua hai via ${s.topMethod ?? "UPI"}.`;
        break;
      }

      case "APPROVE_ACTION": {
        const pend = await ctx.db
          .query("pendingActions")
          .withIndex("by_merchant_status", (q) => q.eq("merchantId", merchantId).eq("status", "pending"))
          .order("desc")
          .first();
        if (!pend) {
          response = "Koi pending action nahi mila jo approve karna ho.";
          success = false;
          break;
        }
        pendingAction = {
          actionId: (pend.payload as { actionId?: string }).actionId ?? pend._id.slice(-8),
          actionType: pend.actionType as "udhaar_update" | "create_campaign",
          summary: pend.summary,
          detail: "Aapne haan kaha — ab authentication chahiye. Demo PIN daaliye.",
          confirmLabel: "Approve & authenticate",
          payload: {},
        };
        tool = "request_action_approval";
        response = "Authentication required hai. Demo PIN daaliye, phir main action complete kar dunga.";
        break;
      }

      case "GENERAL_MERCHANT_QUERY": {
        tool = "help";
        response =
          "Namaste! Main Vyapar-Mind hoon. Aap poochh sakte hain: aaj ki sale, inactive customers, stock, udhaar, ya loan offer. Payment aane par main turant announce karungi.";
        break;
      }

      default: {
        tool = "none";
        success = false;
        response =
          "Maaf kijiye, yeh samajh nahi aaya. Aap sale, stock, udhaar, customers ya loan ke baare mein poochh sakte hain.";
        break;
      }
    }
  } catch (err) {
    success = false;
    tool = tool === "unknown" ? "error" : tool;
    response = "Sorry, system error aa gayi. Dobara koshish kijiye.";
    console.error("[vyapar-mind] agent error:", err);
  }

  return { intent, tool, response, success, pendingAction };
}
