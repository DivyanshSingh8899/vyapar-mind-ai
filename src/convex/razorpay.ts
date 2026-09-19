import { v } from "convex/values";
// import { action, internalMutation, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";
import {
  action,
  internalMutation,
  internalAction,
  internalQuery,
  query,
} from "./_generated/server";

export const demoMerchantId = internalQuery({
  args: {},
  handler: async (ctx) => {
    const m = await ctx.db
      .query("merchants")
      .withIndex("by_code", (q) => q.eq("merchantCode", "M001"))
      .unique();
    if (!m) throw new Error("Demo merchant not seeded yet.");
    return m._id;
  },
});

export const saveQr = internalMutation({
  args: {
    merchantId: v.id("merchants"),
    razorpayQrId: v.string(),
    amount: v.number(),
    imageUrl: v.string(),
  },
  handler: async (ctx, a) => {
    await ctx.db.insert("qrCodes", {
      ...a,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const createQr = action({
  args: { amount: v.number() },
  handler: async (
    ctx,
    { amount },
  ): Promise<{ qrId: string; imageUrl: string; amount: number }> => {
    if (!(amount >= 1 && amount <= 100000))
      throw new Error("Amount must be ₹1–₹1,00,000");
    const res = await fetch("https://api.razorpay.com/v1/payments/qr_codes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " +
          btoa(`${process.env.RZP_KEY_ID}:${process.env.RZP_KEY_SECRET}`),
      },
      body: JSON.stringify({
        type: "upi_qr",
        name: "Vyapar Mind",
        usage: "single_use",
        fixed_amount: true,
        payment_amount: Math.round(amount * 100),
        description: `Vyapar Mind ₹${amount}`,
      }),
    });
    if (!res.ok) throw new Error("Razorpay: " + (await res.text()));
    const qr = await res.json();
    const merchantId = await ctx.runQuery(internal.razorpay.demoMerchantId, {});
    await ctx.runMutation(internal.razorpay.saveQr, {
      merchantId,
      razorpayQrId: qr.id,
      amount,
      imageUrl: qr.image_url,
    });
    return { qrId: qr.id, imageUrl: qr.image_url, amount };
  },
});

// Idempotent: Razorpay retries webhooks.
export const handleCredited = internalMutation({
  args: {
    qrId: v.string(),
    paymentId: v.string(),
    amountPaise: v.number(),
    payer: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const qr = await ctx.db
      .query("qrCodes")
      .withIndex("by_qrId", (q) => q.eq("razorpayQrId", a.qrId))
      .unique();
    if (!qr || qr.status === "paid") return;
    const now = Date.now();
    const amount = a.amountPaise / 100;
    await ctx.db.patch(qr._id, {
      status: "paid",
      razorpayPaymentId: a.paymentId,
      paidAt: now,
    });
    await ctx.db.insert("transactions", {
      merchantId: qr.merchantId,
      amount,
      category: "QR sale",
      paymentMethod: "Razorpay UPI",
      transactionTime: now,
    });
    await ctx.db.insert("paymentEvents", {
      merchantId: qr.merchantId,
      amount,
      customerReference: a.payer ?? "QR customer",
      method: "Razorpay UPI",
      createdAt: now,
    });
  },
});

export const qrStatus = query({
  args: { qrId: v.string() },
  handler: async (ctx, { qrId }) => {
    const qr = await ctx.db
      .query("qrCodes")
      .withIndex("by_qrId", (q) => q.eq("razorpayQrId", qrId))
      .unique();
    return qr ? { status: qr.status, amount: qr.amount } : null;
  },
});

export const listPending = internalQuery({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 3600 * 1000;
    const rows = await ctx.db.query("qrCodes").order("desc").take(50);
    return rows
      .filter((r) => r.status === "pending" && r.createdAt > cutoff)
      .map((r) => ({ razorpayQrId: r.razorpayQrId }));
  },
});

// Asks Razorpay whether pending QRs were paid. Idempotent with the webhook.
export const reconcilePending = action({
  args: {},
  handler: async (ctx): Promise<{ checked: number; paid: number }> => {
    const pending = await ctx.runQuery(internal.razorpay.listPending, {});
    const auth =
      "Basic " +
      btoa(`${process.env.RZP_KEY_ID}:${process.env.RZP_KEY_SECRET}`);
    let paid = 0;
    for (const qr of pending) {
      const res = await fetch(
        `https://api.razorpay.com/v1/payments/qr_codes/${qr.razorpayQrId}/payments`,
        { headers: { Authorization: auth } },
      );
      if (!res.ok) continue; // e.g. old test-mode QR while using live keys
      const data = await res.json();
      const pay = (data.items ?? []).find((p: any) => p.status === "captured");
      if (!pay) continue;
      await ctx.runMutation(internal.razorpay.handleCredited, {
        qrId: qr.razorpayQrId,
        paymentId: pay.id,
        amountPaise: pay.amount,
        payer: pay.vpa ?? undefined,
      });
      paid++;
    }
    return { checked: pending.length, paid };
  },
});

export const latestQr = query({
  args: {},
  handler: async (ctx) => {
    const qr = await ctx.db.query("qrCodes").order("desc").first();
    return qr
      ? { qrId: qr.razorpayQrId, imageUrl: qr.imageUrl, amount: qr.amount, status: qr.status, createdAt: qr.createdAt }
      : null;
  },
});

export const latestPaymentEvent = query({
  args: {},
  handler: async (ctx) => {
    const m = await ctx.db.query("merchants")
      .withIndex("by_code", (q) => q.eq("merchantCode", "M001")).unique();
    if (!m) return null;
    const p = await ctx.db.query("paymentEvents")
      .withIndex("by_merchant_time", (q) => q.eq("merchantId", m._id))
      .order("desc").first();
    return p ? { id: p._id, amount: p.amount, method: p.method, at: p.createdAt } : null;
  },
});

// Called by the agent (mutations can't fetch). Failures land in the agent activity log.
export const createQrFromAgent = internalAction({
  args: { amount: v.number() },
  handler: async (ctx, { amount }): Promise<void> => {
    try {
      await ctx.runAction(api.razorpay.createQr, { amount });
    } catch (e) {
      await ctx.runMutation(internal.razorpay.logQrFailure, {
        message: e instanceof Error ? e.message : String(e),
      });
    }
  },
});

export const logQrFailure = internalMutation({
  args: { message: v.string() },
  handler: async (ctx, { message }) => {
    const m = await ctx.db.query("merchants")
      .withIndex("by_code", (q) => q.eq("merchantCode", "M001")).unique();
    if (!m) return;
    await ctx.db.insert("agentLogs", {
      merchantId: m._id, userInput: "[voice] create QR", detectedIntent: "CREATE_QR",
      toolUsed: "create_qr", response: "QR failed: " + message.slice(0, 200),
      success: false, latencyMs: 0, source: "voice", createdAt: Date.now(),
    });
  },
});