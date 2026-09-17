import { v } from "convex/values";
import { FunctionReturnType } from "convex/server";
import { Id } from "./_generated/dataModel";
import { mutation, query, QueryCtx } from "./_generated/server";
import { runAgent } from "./agent";
import { DEMO_PAYMENT_SIMULATIONS } from "./demoData";
import { seedDemoMerchantCore, verifyPin } from "./seed";
import {
  getCustomerInsights,
  getInactiveCustomers,
  getInventoryStatus,
  getLoanRecommendation,
  getSalesSummary,
  getTodaySales,
  getUdhaarBalance,
} from "./tools";

const DAY = 86400000;

async function getDemoMerchant(ctx: QueryCtx) {
  const m = await ctx.db
    .query("merchants")
    .withIndex("by_code", (q) => q.eq("merchantCode", "M001"))
    .unique();
  if (!m) throw new Error("Demo merchant not seeded yet.");
  return m;
}

/** Seed-tolerant variant for read queries: null until the demo seed has run. */
async function getDemoMerchantOrNull(ctx: QueryCtx) {
  return (
    (await ctx.db
      .query("merchants")
      .withIndex("by_code", (q) => q.eq("merchantCode", "M001"))
      .unique()) ?? null
  );
}

/** Ensure the demo merchant exists; seeds on first call. Idempotent. */
export const ensureDemoMerchant = mutation({
  args: {},
  handler: async (ctx) => {
    const r = await seedDemoMerchantCore(ctx, false);
    return { merchantId: r.merchantId as string, seeded: r.seeded };
  },
});

/** Force a fresh demo dataset (wipes transactions, logs, campaigns…). */
export const reseedDemoMerchant = mutation({
  args: {},
  handler: async (ctx) => {
    const r = await seedDemoMerchantCore(ctx, true);
    return { merchantId: r.merchantId as string, seeded: r.seeded };
  },
});

/** MAIN AGENT ENTRY — equivalent of POST /api/agent. Logs every turn. */
export const agentTurn = mutation({
  args: {
    text: v.string(),
    source: v.optional(v.union(v.literal("voice"), v.literal("text"), v.literal("demo"))),
  },
  handler: async (ctx, args) => {
    const started = Date.now();
    const merchant = await getDemoMerchant(ctx);
    const result = await runAgent(ctx, merchant._id, args.text, args.source ?? "text");
    const latencyMs = Date.now() - started;

    await ctx.db.insert("agentLogs", {
      merchantId: merchant._id,
      userInput: args.text,
      detectedIntent: result.intent,
      toolUsed: result.tool,
      response: result.response,
      success: result.success,
      latencyMs: Math.max(latencyMs, 12),
      source: args.source ?? "text",
      createdAt: Date.now(),
    });

    return {
      intent: result.intent,
      tool: result.tool,
      response: result.response,
      success: result.success,
      latencyMs: Math.max(latencyMs, 12),
      pendingAction: result.pendingAction ?? null,
    };
  },
});

/** FULL DASHBOARD — equivalent of GET /api/dashboard (one reactive query). */
export const getDashboard = query({
  args: {},
  handler: async (ctx) => {
    const merchant = await getDemoMerchantOrNull(ctx);
    if (!merchant) return null; // not seeded yet — UI shows a loading state
    const mid = merchant._id;

    const [sales, week, cust, inv, udhaar, loan, payments, logs] = await Promise.all([
      getTodaySales(ctx, mid),
      getSalesSummary(ctx, mid),
      getCustomerInsights(ctx, mid),
      getInventoryStatus(ctx, mid),
      getUdhaarBalance(ctx, mid),
      getLoanRecommendation(ctx, mid),
      ctx.db
        .query("paymentEvents")
        .withIndex("by_merchant_time", (q) => q.eq("merchantId", mid).gte("createdAt", Date.now() - DAY))
        .order("desc")
        .take(12),
      ctx.db
        .query("agentLogs")
        .withIndex("by_merchant_time", (q) => q.eq("merchantId", mid))
        .order("desc")
        .take(25),
    ]);

    // 7-day sales sparkline (oldest → today).
    const spark: { label: string; value: number }[] = [];
    for (let d = 6; d >= 0; d--) {
      const start = Math.floor((Date.now() - d * DAY) / DAY) * DAY;
      const rows = await ctx.db
        .query("transactions")
        .withIndex("by_merchant_time", (q) =>
          q.eq("merchantId", mid).gte("transactionTime", start).lt("transactionTime", start + DAY),
        )
        .collect();
      spark.push({
        label: new Date(start).toLocaleDateString("en-IN", { weekday: "short" }),
        value: rows.reduce((s, t) => s + t.amount, 0),
      });
    }

    return {
      merchant: {
        id: merchant.merchantCode,
        businessName: merchant.businessName,
        ownerName: merchant.ownerName,
        city: merchant.city,
        language: merchant.language,
        soundboxLinked: merchant.soundboxLinked,
      },
      today: {
        totalSales: sales.todaySales,
        txnCount: sales.txnCount,
        avgValue: sales.avgValue,
        deltaPct: sales.deltaPct,
        yesterdaySales: sales.yesterdaySales,
        topMethod: sales.topMethod,
        topCategory: sales.topCategory,
        spark,
        weekTotal: week.weekTotal,
        dailyAvg: week.dailyAvg,
      },
      customers: {
        total: cust.totalCustomers,
        active: cust.active,
        returning: cust.returning,
        inactive: cust.inactive,
        top: cust.topCustomers,
      },
      inventory: {
        totalProducts: inv.totalProducts,
        lowStockCount: inv.lowStockCount,
        criticalCount: inv.criticalCount,
        lowStock: inv.lowStock.slice(0, 6),
      },
      udhaar: {
        total: (udhaar as { total?: number }).total ?? 0,
        customerCount: (udhaar as { customerCount?: number }).customerCount ?? 0,
      },
      credit: {
        activityScore: loan.activityScore,
        dailyAvg: loan.dailyAvg,
        offerAmount: loan.amount,
        reason: loan.reason,
      },
      payments: payments.map((p) => ({
        id: p._id,
        amount: p.amount,
        ref: p.customerReference,
        method: p.method,
        at: p.createdAt,
      })),
      agentLogs: logs.map((l) => ({
        id: l._id,
        at: l.createdAt,
        input: l.userInput,
        intent: l.detectedIntent,
        tool: l.toolUsed,
        success: l.success,
        latencyMs: l.latencyMs,
        response: l.response,
      })),
    };
  },
});

export type DashboardData = {
  merchant: {
    id: string;
    businessName: string;
    ownerName: string;
    city: string;
    language: string;
    soundboxLinked: boolean;
  };
  today: {
    totalSales: number;
    txnCount: number;
    avgValue: number;
    deltaPct: number;
    yesterdaySales: number;
    topMethod?: string;
    topCategory?: string;
    spark: { label: string; value: number }[];
    weekTotal: number;
    dailyAvg: number;
  };
  customers: {
    total: number;
    active: number;
    returning: number;
    inactive: number;
    top: { name: string; totalSpent: number; visits: number }[];
  };
  inventory: {
    totalProducts: number;
    lowStockCount: number;
    criticalCount: number;
    lowStock: { name: string; qty: number; reorder: number; price: number }[];
  };
  udhaar: { total: number; customerCount: number };
  credit: {
    activityScore: number;
    dailyAvg: number;
    offerAmount: number;
    reason: string;
  };
  payments: { id: string; amount: number; ref: string; method: string; at: number }[];
  agentLogs: {
    id: string;
    at: number;
    input: string;
    intent: string;
    tool: string;
    success: boolean;
    latencyMs: number;
    response: string;
  }[];
};

/** AGENT ACTIVITY feed — equivalent of GET /api/agent/logs. */
export const getAgentLogs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const merchant = await getDemoMerchantOrNull(ctx);
    if (!merchant) return [];
    const logs = await ctx.db
      .query("agentLogs")
      .withIndex("by_merchant_time", (q) => q.eq("merchantId", merchant._id))
      .order("desc")
      .take(args.limit ?? 40);
    return logs.map((l) => ({
      id: l._id,
      at: l.createdAt,
      input: l.userInput,
      intent: l.detectedIntent,
      tool: l.toolUsed,
      response: l.response,
      success: l.success,
      latencyMs: l.latencyMs,
      source: l.source,
    }));
  },
});

/** SIMULATE PAYMENT — Soundbox announcement priority demo. */
export const simulatePayment = mutation({
  args: {
    amount: v.optional(v.number()),
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const merchant = await getDemoMerchant(ctx);
    const pick =
      args.amount != null
        ? { amount: args.amount, ref: args.reference ?? "Walk-in customer", method: "Paytm UPI" }
        : DEMO_PAYMENT_SIMULATIONS[Math.floor(Math.random() * DEMO_PAYMENT_SIMULATIONS.length)];

    const id = await ctx.db.insert("paymentEvents", {
      merchantId: merchant._id,
      amount: pick.amount,
      customerReference: pick.ref,
      method: pick.method,
      createdAt: Date.now(),
    });
    return { id: id as string, amount: pick.amount, ref: pick.ref, method: pick.method, at: Date.now() };
  },
});

/** Get the current pending sensitive action (for the approval UI). */
export const getPendingAction = query({
  args: {},
  handler: async (ctx) => {
    const merchant = await getDemoMerchantOrNull(ctx);
    if (!merchant) return null;
    const pend = await ctx.db
      .query("pendingActions")
      .withIndex("by_merchant_status", (q) => q.eq("merchantId", merchant._id).eq("status", "pending"))
      .order("desc")
      .first();
    if (!pend || pend.expiresAt < Date.now()) return null;
    return {
      id: pend._id as string,
      actionType: pend.actionType as "udhaar_update" | "create_campaign",
      summary: pend.summary,
      payload: pend.payload as Record<string, unknown>,
      expiresAt: pend.expiresAt,
    };
  },
});

/**
 * APPROVE sensitive action with demo PIN.
 * Equivalent of POST /api/auth/verify + POST /api/udhaar/update + POST /api/campaign.
 * The agent NEVER executes these writes directly.
 */
export const approvePendingAction = mutation({
  args: { pendingId: v.string(), pin: v.string() },
  handler: async (ctx, args) => {
    const merchant = await getDemoMerchant(ctx);
    const pend = await ctx.db.get(args.pendingId as Id<"pendingActions">);
    if (!pend || pend.merchantId !== merchant._id || pend.status !== "pending") {
      return { ok: false as const, message: "Yeh action expire ho gaya ya already processed hai." };
    }
    if (pend.expiresAt < Date.now()) {
      await ctx.db.patch(pend._id, { status: "expired" });
      return { ok: false as const, message: "Approval window expire ho gaya. Request dobara bhejiye." };
    }
    if (!(await verifyPin(args.pin, merchant.demoPinHash))) {
      return { ok: false as const, message: "Galat PIN. Dobara koshish kijiye." };
    }

    const payload = pend.payload as Record<string, unknown>;
    let message = "";
    let detail = "";

    if (pend.actionType === "udhaar_update") {
      const customers = await ctx.db
        .query("customers")
        .withIndex("by_merchant", (q) => q.eq("merchantId", merchant._id))
        .collect();
      const customer = customers.find(
        (c) => c.name.toLowerCase() === String(payload.customerName).toLowerCase(),
      );
      if (!customer) {
        return { ok: false as const, message: `${payload.customerName} naam ka customer nahi mila.` };
      }
      const amount = Number(payload.amount);
      await ctx.db.insert("udhaarLedger", {
        merchantId: merchant._id,
        customerId: customer._id,
        amount: -amount, // repayment reduces balance
        type: "repayment",
        description: "Voice-verified udhaar repayment (demo PIN approved)",
        createdAt: Date.now(),
      });
      await ctx.db.patch(pend._id, { status: "approved" });
      message = `${customer.name} ka ₹${amount} udhaar successfully update ho gaya.`;
      detail = "Ledger entry created. Sensitive write executed only after PIN approval.";
    } else if (pend.actionType === "create_campaign") {
      const names = (payload.customerNames as string[]) ?? [];
      const campaignId = await ctx.db.insert("campaigns", {
        merchantId: merchant._id,
        campaignType: "winback",
        targetCount: names.length,
        offer: String(payload.offer ?? "₹50 coupon"),
        status: "created",
        channel: "simulated_whatsapp",
        customerNames: names,
        createdAt: Date.now(),
      });
      await ctx.db.patch(pend._id, { status: "approved" });
      message = `Campaign created for ${names.length} customers. Delivery simulated (no real WhatsApp sent).`;
      detail = `Campaign id ${campaignId}. Channel: simulated_whatsapp (demo only).`;
    } else {
      return { ok: false as const, message: "Unknown action type." };
    }

    await ctx.db.insert("agentLogs", {
      merchantId: merchant._id,
      userInput: `[merchant approval] ${pend.summary}`,
      detectedIntent: "SENSITIVE_ACTION_APPROVED",
      toolUsed: pend.actionType === "udhaar_update" ? "update_udhaar" : "create_customer_campaign",
      response: message,
      success: true,
      latencyMs: 0,
      source: "auth",
      createdAt: Date.now(),
    });

    return { ok: true as const, message, detail };
  },
});

/** Reject a pending action (merchant says no). */
export const rejectPendingAction = mutation({
  args: { pendingId: v.string() },
  handler: async (ctx, args) => {
    const merchant = await getDemoMerchant(ctx);
    const pend = await ctx.db.get(args.pendingId as Id<"pendingActions">);
    if (pend && pend.merchantId === merchant._id && pend.status === "pending") {
      await ctx.db.patch(pend._id, { status: "rejected" });
      await ctx.db.insert("agentLogs", {
        merchantId: merchant._id,
        userInput: `[merchant rejection] ${pend.summary}`,
        detectedIntent: "SENSITIVE_ACTION_REJECTED",
        toolUsed: "none",
        response: "Merchant ne action reject kiya. Koi change nahi kiya gaya.",
        success: true,
        latencyMs: 0,
        source: "auth",
        createdAt: Date.now(),
      });
    }
    return { ok: true as const, message: "Action cancel kar diya. Koi change nahi hua." };
  },
});

/** Marketing helper: recent simulated campaigns for the Campaigns panel. */
export const getCampaigns = query({
  args: {},
  handler: async (ctx) => {
    const merchant = await getDemoMerchantOrNull(ctx);
    if (!merchant) return [];
    const rows = await ctx.db
      .query("campaigns")
      .withIndex("by_merchant", (q) => q.eq("merchantId", merchant._id))
      .collect();
    return rows
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((c) => ({
        id: c._id,
        offer: c.offer,
        targetCount: c.targetCount,
        status: c.status,
        channel: c.channel,
        createdAt: c.createdAt,
      }));
  },
});

/** Public demo info (PIN hint) — fine for a hackathon prototype. */
export const getDemoInfo = query({
  args: {},
  handler: async () => ({ demoPin: "1234", note: "Demo PIN for the hackathon prototype only." }),
});

export const DAY_MS = DAY;
