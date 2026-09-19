import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";

export const demoMerchantId = internalQuery({
  args: {},
  handler: async (ctx) => {
    const m = await ctx.db.query("merchants")
      .withIndex("by_code", (q) => q.eq("merchantCode", "M001")).unique();
    if (!m) throw new Error("Demo merchant not seeded yet.");
    return m._id;
  },
});

export const saveQr = internalMutation({
  args: { merchantId: v.id("merchants"), razorpayQrId: v.string(), amount: v.number(), imageUrl: v.string() },
  handler: async (ctx, a) => {
    await ctx.db.insert("qrCodes", { ...a, status: "pending", createdAt: Date.now() });
  },
});

export const createQr = action({
  args: { amount: v.number() },
  handler: async (ctx, { amount }): Promise<{ qrId: string; imageUrl: string; amount: number }> => {
    if (!(amount >= 1 && amount <= 100000)) throw new Error("Amount must be ₹1–₹1,00,000");
    const res = await fetch("https://api.razorpay.com/v1/payments/qr_codes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${process.env.RZP_KEY_ID}:${process.env.RZP_KEY_SECRET}`),
      },
      body: JSON.stringify({
        type: "upi_qr", name: "Vyapar Mind", usage: "single_use",
        fixed_amount: true, payment_amount: Math.round(amount * 100),
        description: `Vyapar Mind ₹${amount}`,
      }),
    });
    if (!res.ok) throw new Error("Razorpay: " + (await res.text()));
    const qr = await res.json();
    const merchantId = await ctx.runQuery(internal.razorpay.demoMerchantId, {});
    await ctx.runMutation(internal.razorpay.saveQr, {
      merchantId, razorpayQrId: qr.id, amount, imageUrl: qr.image_url,
    });
    return { qrId: qr.id, imageUrl: qr.image_url, amount };
  },
});

// Idempotent: Razorpay retries webhooks.
export const handleCredited = internalMutation({
  args: { qrId: v.string(), paymentId: v.string(), amountPaise: v.number(), payer: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const qr = await ctx.db.query("qrCodes")
      .withIndex("by_qrId", (q) => q.eq("razorpayQrId", a.qrId)).unique();
    if (!qr || qr.status === "paid") return;
    const now = Date.now();
    const amount = a.amountPaise / 100;
    await ctx.db.patch(qr._id, { status: "paid", razorpayPaymentId: a.paymentId, paidAt: now });
    await ctx.db.insert("transactions", {
      merchantId: qr.merchantId, amount, category: "QR sale",
      paymentMethod: "Razorpay UPI", transactionTime: now,
    });
    await ctx.db.insert("paymentEvents", {
      merchantId: qr.merchantId, amount,
      customerReference: a.payer ?? "QR customer", method: "Razorpay UPI", createdAt: now,
    });
  },
});