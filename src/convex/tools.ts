import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

const DAY = 86400000;

export const startOfToday = (now: number) => Math.floor(now / DAY) * DAY;
export const startOfDayN = (now: number, daysAgo: 0 | 1 | 7) =>
  Math.floor((now - daysAgo * DAY) / DAY) * DAY;

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export const shortDate = (ts: number) =>
  new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

// ───────────────────────── READ TOOLS ─────────────────────────

/** get_today_sales(merchant_id) → SALES_QUERY */
export async function getTodaySales(ctx: QueryCtx, merchantId: Id<"merchants">) {
  const now = Date.now();
  const todayStart = startOfToday(now);
  const yestStart = todayStart - DAY;

  const all = await ctx.db
    .query("transactions")
    .withIndex("by_merchant_time", (q) =>
      q.eq("merchantId", merchantId).gte("transactionTime", yestStart),
    )
    .collect();

  const today = all.filter((t) => t.transactionTime >= todayStart);
  const yesterday = all.filter((t) => t.transactionTime < todayStart);

  const sum = (a: Doc<"transactions">[]) => a.reduce((s, t) => s + t.amount, 0);
  const todaySales = sum(today);
  const yestSales = sum(yesterday) || 1;
  const avg = today.length ? todaySales / today.length : 0;
  const delta = Math.round(((todaySales - yestSales) / yestSales) * 100);

  const byMethod: Record<string, number> = {};
  for (const t of today) byMethod[t.paymentMethod] = (byMethod[t.paymentMethod] ?? 0) + t.amount;
  const topMethod = Object.entries(byMethod).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Highest single category today
  const byCat: Record<string, number> = {};
  for (const t of today) byCat[t.category] = (byCat[t.category] ?? 0) + t.amount;
  const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    todaySales,
    txnCount: today.length,
    avgValue: avg,
    yesterdaySales: sum(yesterday),
    deltaPct: delta,
    topMethod,
    topCategory: topCat,
  };
}

/** get_sales_summary(merchant_id, date_range) → SALES_QUERY (weekly context) */
export async function getSalesSummary(ctx: QueryCtx, merchantId: Id<"merchants">) {
  const now = Date.now();
  const weekAgo = startOfDayN(now, 7);
  const rows = await ctx.db
    .query("transactions")
    .withIndex("by_merchant_time", (q) =>
      q.eq("merchantId", merchantId).gte("transactionTime", weekAgo),
    )
    .collect();
  const total = rows.reduce((s, t) => s + t.amount, 0);
  const days = 7;
  return {
    weekTotal: total,
    weekTxns: rows.length,
    dailyAvg: total / days,
    txnCount: rows.length,
  };
}

/** get_customer_insights(merchant_id) → CUSTOMER_INSIGHT */
export async function getCustomerInsights(ctx: QueryCtx, merchantId: Id<"merchants">) {
  const now = Date.now();
  const rows = await ctx.db
    .query("customers")
    .withIndex("by_merchant", (q) => q.eq("merchantId", merchantId))
    .collect();

  const active = rows.filter((c) => now - c.lastPurchaseAt <= 7 * DAY).length;
  const inactive = rows.filter((c) => now - c.lastPurchaseAt > 30 * DAY).length;
  const returning = rows.filter((c) => c.visitCount > 1).length;
  const top = [...rows].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

  return {
    totalCustomers: rows.length,
    active,
    inactive,
    returning,
    topCustomers: top.map((c) => ({
      name: c.name,
      totalSpent: c.totalSpent,
      visits: c.visitCount,
    })),
  };
}

/** get_inactive_customers(merchant_id, days) → CUSTOMER_INSIGHT / CUSTOMER_WINBACK */
export async function getInactiveCustomers(
  ctx: QueryCtx,
  merchantId: Id<"merchants">,
  days: number,
) {
  const cutoff = Date.now() - days * DAY;
  const rows = await ctx.db
    .query("customers")
    .withIndex("by_merchant_lastPurchase", (q) =>
      q.eq("merchantId", merchantId).lt("lastPurchaseAt", cutoff),
    )
    .collect();
  return {
    count: rows.length,
    customers: rows
      .sort((a, b) => a.lastPurchaseAt - b.lastPurchaseAt)
      .slice(0, 25)
      .map((c) => ({
        name: c.name,
        daysSince: Math.floor((Date.now() - c.lastPurchaseAt) / DAY),
        totalSpent: c.totalSpent,
      })),
  };
}

/** get_inventory_status(merchant_id) → INVENTORY_QUERY */
export async function getInventoryStatus(ctx: QueryCtx, merchantId: Id<"merchants">) {
  const rows = await ctx.db
    .query("inventory")
    .withIndex("by_merchant", (q) => q.eq("merchantId", merchantId))
    .collect();
  const low = rows.filter((p) => p.quantity <= p.reorderLevel);
  const critical = low.filter((p) => p.quantity <= p.reorderLevel / 2);
  return {
    totalProducts: rows.length,
    lowStockCount: low.length,
    criticalCount: critical.length,
    lowStock: low
      .sort((a, b) => a.quantity / a.reorderLevel - b.quantity / b.reorderLevel)
      .map((p) => ({
        name: p.productName,
        qty: p.quantity,
        reorder: p.reorderLevel,
        price: p.price,
      })),
  };
}

/** get_product_stock(merchant_id, product_name) → INVENTORY_QUERY */
export async function getProductStock(
  ctx: QueryCtx,
  merchantId: Id<"merchants">,
  productName: string,
) {
  const rows = await ctx.db
    .query("inventory")
    .withIndex("by_merchant", (q) => q.eq("merchantId", merchantId))
    .collect();
  const q = productName.toLowerCase().trim();
  const product = rows.find((p) => p.productName.toLowerCase().includes(q));
  if (!product) return { found: false as const, productName };
  return {
    found: true as const,
    productName: product.productName,
    quantity: product.quantity,
    reorderLevel: product.reorderLevel,
    price: product.price,
  };
}

/** get_udhaar_balance(merchant_id, customer_name) → UDHAAR_QUERY */
export async function getUdhaarBalance(
  ctx: QueryCtx,
  merchantId: Id<"merchants">,
  customerName?: string,
) {
  const ledger = await ctx.db
    .query("udhaarLedger")
    .withIndex("by_merchant", (q) => q.eq("merchantId", merchantId))
    .collect();
  const customers = await ctx.db
    .query("customers")
    .withIndex("by_merchant", (q) => q.eq("merchantId", merchantId))
    .collect();
  const nameOf = (id: Id<"customers">) =>
    customers.find((c) => c._id === id)?.name ?? "Unknown";

  const balances = new Map<string, number>();
  for (const e of ledger) {
    const n = nameOf(e.customerId);
    balances.set(n, (balances.get(n) ?? 0) + e.amount);
  }

  if (customerName) {
    const target = customerName.toLowerCase().trim();
    const match = [...balances.keys()].find((n) => n.toLowerCase().includes(target));
    if (!match) return { found: false as const, query: customerName };
    const balance = balances.get(match) ?? 0;
    return { found: true as const, name: match, balance };
  }

  const total = [...balances.values()].filter((v) => v > 0).reduce((a, b) => a + b, 0);
  const people = [...balances.entries()].filter(([, v]) => v > 0);
  return {
    found: true as const,
    total,
    customerCount: people.length,
    top: people.sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n, v]) => ({ name: n, amount: v })),
  };
}

/** get_loan_recommendation(merchant_id) → LOAN_RECOMMENDATION (SIMULATED) */
export async function getLoanRecommendation(ctx: QueryCtx, merchantId: Id<"merchants">) {
  const [today, week] = await Promise.all([
    getTodaySales(ctx, merchantId),
    getSalesSummary(ctx, merchantId),
  ]);
  const dailyAvg = week.dailyAvg;

  // Business activity score 0–100: daily sales vs ₹20k benchmark + txn volume.
  const salesScore = Math.min(1, dailyAvg / 20000);
  const freqScore = Math.min(1, week.txnCount / (12 * 7));
  const activityScore = Math.round((salesScore * 0.65 + freqScore * 0.35) * 100);

  // Simple tiered simulated offer.
  let amount = 0;
  let reason = "";
  if (activityScore >= 70 && dailyAvg >= 15000) {
    amount = 50000;
    reason = "strong daily sales and consistent UPI inflow";
  } else if (activityScore >= 50) {
    amount = 25000;
    reason = "steady daily sales";
  } else if (activityScore >= 35) {
    amount = 10000;
    reason = "regular but moderate business activity";
  } else {
    amount = 0;
    reason = "business activity is currently low for a credit offer";
  }

  return { activityScore, dailyAvg, weekTotal: week.weekTotal, amount, reason };
}
