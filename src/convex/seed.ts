import { v } from "convex/values";
import { MutationCtx, mutation } from "./_generated/server";
import {
  DEMO_CUSTOMERS,
  DEMO_INVENTORY,
  DEMO_MERCHANT,
  DEMO_PIN,
  DEMO_UDHAAR,
  PRODUCT_CATEGORIES,
  START_DAY_OFFSET,
  demoDailySalesForDay,
} from "./demoData";

/** SHA-256 hex via WebCrypto (available in the Convex runtime). */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time-ish comparison after hashing — PIN never stored in plaintext. */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return (await sha256Hex(pin)) === hash;
}

const DAY = 86400000;

/** Internal: create (or wipe + recreate) the demo merchant. */
export async function seedDemoMerchantCore(ctx: MutationCtx, force = false) {
  const existing = await ctx.db
    .query("merchants")
    .withIndex("by_code", (q) => q.eq("merchantCode", DEMO_MERCHANT.merchantCode))
    .unique();

  if (existing && !force) {
    return { merchantId: existing._id, seeded: false };
  }
  if (existing && force) {
    for (const table of [
      "transactions",
      "customers",
      "inventory",
      "udhaarLedger",
      "campaigns",
      "loanOffers",
      "agentLogs",
      "paymentEvents",
      "pendingActions",
    ] as const) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) {
        if (row.merchantId === existing._id) await ctx.db.delete(row._id);
      }
    }
    await ctx.db.delete(existing._id);
  }

  const now = Date.now();
  const merchantId = await ctx.db.insert("merchants", {
    ...DEMO_MERCHANT,
    demoPinHash: await sha256Hex(DEMO_PIN),
    createdAt: now,
  });

  const customerIds = new Map<string, any>();
  for (const c of DEMO_CUSTOMERS) {
    const id = await ctx.db.insert("customers", {
      merchantId,
      name: c.name,
      phone: c.phone,
      lastPurchaseAt: now - c.lastPurchaseDaysAgo * DAY,
      totalSpent: c.totalSpent,
      visitCount: c.visitCount,
    });
    customerIds.set(c.name, id);
  }

  for (const p of DEMO_INVENTORY) {
    await ctx.db.insert("inventory", {
      merchantId,
      productName: p.productName,
      quantity: p.quantity,
      reorderLevel: p.reorderLevel,
      price: p.price,
    });
  }

  for (const [name, u] of Object.entries(DEMO_UDHAAR)) {
    const customerId = customerIds.get(name);
    if (!customerId) continue;
    await ctx.db.insert("udhaarLedger", {
      merchantId,
      customerId,
      amount: u.amount,
      type: "credit",
      description: u.note,
      createdAt: now - u.daysAgo * DAY,
    });
  }

  // Transactions for the last 30 days (each day sums exactly to its target).
  const loyal = DEMO_CUSTOMERS.slice(0, 8);
  for (let d = START_DAY_OFFSET; d >= 0; d--) {
    const dayStart = Math.floor((now - d * DAY) / DAY) * DAY;
    const target = demoDailySalesForDay(d);
    const count = d === 0 ? 6 : 12 + ((d * 7) % 8); // today is partial (morning so far)
    const eligible = loyal.filter((c) => c.lastPurchaseDaysAgo >= d);
    const parts: number[] = [];
    for (let i = 0; i < count; i++) {
      const jitter = ((d * 31 + i * 17) % 23) / 23;
      parts.push(Math.round((target / count) * (0.55 + jitter * 0.9)));
    }
    const sum = parts.reduce((a, b) => a + b, 0);
    parts[parts.length - 1] += target - sum;

    let t = dayStart + 8 * 3600000; // shop opens 8 AM
    for (let i = 0; i < parts.length; i++) {
      const isCustomer = eligible.length > 0 && i % 4 === 0;
      const customer = isCustomer ? eligible[(d + i) % eligible.length] : undefined;
      t += Math.round(((13 * 3600000) / parts.length) * ((i * 13) % 5) * 0.4 + 600000);
      await ctx.db.insert("transactions", {
        merchantId,
        customerId: customer ? customerIds.get(customer.name) : undefined,
        amount: parts[i],
        category: PRODUCT_CATEGORIES[(d + i) % PRODUCT_CATEGORIES.length],
        paymentMethod: i % 5 === 0 ? "Cash" : "Paytm UPI",
        transactionTime: Math.min(t, now - 60000),
      });
    }
  }

  return { merchantId, seeded: true };
}

/** Idempotent seed mutation for the hackathon demo merchant. */
export const seedDemoMerchant = mutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, args) => seedDemoMerchantCore(ctx, args.force ?? false),
});
