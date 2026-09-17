// ─────────────────────────────────────────────────────────────────────────────
// Vyapar-Mind — Demo data (Ramesh General Store, kirana, M001)
// All values are SIMULATED for the hackathon prototype. No private Paytm data.
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_MERCHANT = {
  merchantCode: "M001",
  businessName: "Ramesh General Store",
  ownerName: "Ramesh Kumar",
  language: "hi-IN",
  city: "Indore",
  soundboxLinked: true,
};

// The demo PIN itself is only used to derive a SHA-256 hash server-side
// (never stored in plaintext). Showing it in the demo UI is acceptable for a
// hackathon prototype.
export const DEMO_PIN = "1234";

export const START_DAY_OFFSET = 30; // days of transaction history

// name, phone, days-since-last-purchase, totalSpent (INR), visitCount
export const DEMO_CUSTOMERS: Array<{
  name: string;
  phone: string;
  lastPurchaseDaysAgo: number;
  totalSpent: number;
  visitCount: number;
}> = [
  { name: "Suresh Patel", phone: "+91 98765 43210", lastPurchaseDaysAgo: 1, totalSpent: 48200, visitCount: 142 },
  { name: "Anita Sharma", phone: "+91 98123 45678", lastPurchaseDaysAgo: 2, totalSpent: 39650, visitCount: 118 },
  { name: "Vijay Verma", phone: "+91 99001 23456", lastPurchaseDaysAgo: 4, totalSpent: 31400, visitCount: 96 },
  { name: "Pooja Singh", phone: "+91 98711 22334", lastPurchaseDaysAgo: 6, totalSpent: 22800, visitCount: 74 },
  { name: "Amit Joshi", phone: "+91 97654 32109", lastPurchaseDaysAgo: 8, totalSpent: 18900, visitCount: 61 },
  { name: "Kavita Devi", phone: "+91 96543 21098", lastPurchaseDaysAgo: 12, totalSpent: 15600, visitCount: 52 },
  { name: "Mohammed Irfan", phone: "+91 95432 10987", lastPurchaseDaysAgo: 15, totalSpent: 12400, visitCount: 44 },
  { name: "Lakhan Yadav", phone: "+91 94321 09876", lastPurchaseDaysAgo: 21, totalSpent: 9800, visitCount: 31 },
  { name: "Ramesh Kumar", phone: "+91 91234 56789", lastPurchaseDaysAgo: 24, totalSpent: 7600, visitCount: 27 },
  { name: "Deepak Mishra", phone: "+91 99887 76655", lastPurchaseDaysAgo: 41, totalSpent: 6200, visitCount: 22 },
  { name: "Sunita Agarwal", phone: "+91 98760 12345", lastPurchaseDaysAgo: 52, totalSpent: 5400, visitCount: 19 },
  { name: "Rahul Tiwari", phone: "+91 97698 65432", lastPurchaseDaysAgo: 67, totalSpent: 4100, visitCount: 15 },
  { name: "Manoj Prajapati", phone: "+91 96677 88990", lastPurchaseDaysAgo: 84, totalSpent: 3200, visitCount: 11 },
  { name: "Rekha Bai", phone: "+91 95566 44332", lastPurchaseDaysAgo: 96, totalSpent: 2800, visitCount: 9 },
  { name: "Harish Chandra", phone: "+91 94455 66778", lastPurchaseDaysAgo: 118, totalSpent: 2100, visitCount: 7 },
  { name: "Gopal Das", phone: "+91 93344 55667", lastPurchaseDaysAgo: 145, totalSpent: 1600, visitCount: 5 },
  { name: "Neelam Gupta", phone: "+91 92233 44556", lastPurchaseDaysAgo: 172, totalSpent: 1200, visitCount: 4 },
  { name: "Shankar Lal", phone: "+91 91122 33445", lastPurchaseDaysAgo: 198, totalSpent: 900, visitCount: 3 },
];

// product, quantity, reorderLevel, unit price (INR)
export const DEMO_INVENTORY: Array<{
  productName: string;
  quantity: number;
  reorderLevel: number;
  price: number;
}> = [
  { productName: "Milk", quantity: 24, reorderLevel: 30, price: 28 },
  { productName: "Bread", quantity: 12, reorderLevel: 20, price: 25 },
  { productName: "Eggs", quantity: 60, reorderLevel: 40, price: 6 },
  { productName: "Rice (5kg)", quantity: 18, reorderLevel: 10, price: 340 },
  { productName: "Wheat Flour (5kg)", quantity: 14, reorderLevel: 8, price: 250 },
  { productName: "Toor Dal (1kg)", quantity: 9, reorderLevel: 12, price: 160 },
  { productName: "Cooking Oil (1L)", quantity: 11, reorderLevel: 15, price: 145 },
  { productName: "Sugar (1kg)", quantity: 32, reorderLevel: 20, price: 46 },
  { productName: "Tea (250g)", quantity: 7, reorderLevel: 10, price: 150 },
  { productName: "Biscuits", quantity: 85, reorderLevel: 40, price: 10 },
  { productName: "Detergent (1kg)", quantity: 16, reorderLevel: 10, price: 110 },
  { productName: "Soap", quantity: 48, reorderLevel: 25, price: 35 },
  { productName: "Shampoo (100ml)", quantity: 6, reorderLevel: 12, price: 55 },
  { productName: "Butter (100g)", quantity: 10, reorderLevel: 8, price: 58 },
  { productName: "Curd (400g)", quantity: 9, reorderLevel: 12, price: 30 },
];

// name → [amount owed, days since last activity]
export const DEMO_UDHAAR: Record<string, { amount: number; daysAgo: number; note: string }> = {
  "Suresh Patel": { amount: 1250, daysAgo: 3, note: "Ration for family" },
  "Vijay Verma": { amount: 450, daysAgo: 4, note: "Groceries on credit" },
  "Lakhan Yadav": { amount: 800, daysAgo: 21, note: "Monthly khata" },
  "Deepak Mishra": { amount: 320, daysAgo: 41, note: "Oil + atta" },
  "Sunita Agarwal": { amount: 150, daysAgo: 52, note: "Diwali stock" },
  "Rahul Tiwari": { amount: 500, daysAgo: 67, note: "Pending from last month" },
  "Harish Chandra": { amount: 210, daysAgo: 118, note: "Old khata entry" },
};

// Payments used by the SIMULATE PAYMENT button — realistic soundbox-style events.
export const DEMO_PAYMENT_SIMULATIONS: Array<{ amount: number; ref: string; method: string }> = [
  { amount: 500, ref: "Suresh Patel", method: "Paytm UPI" },
  { amount: 120, ref: "Anita Sharma", method: "Paytm UPI" },
  { amount: 340, ref: "Walk-in customer", method: "Paytm UPI" },
  { amount: 850, ref: "Vijay Verma", method: "Paytm UPI" },
  { amount: 250, ref: "Walk-in customer", method: "Paytm UPI" },
  { amount: 65, ref: "Amit Joshi", method: "Paytm UPI" },
  { amount: 1500, ref: "Mohammed Irfan", method: "Paytm UPI" },
  { amount: 45, ref: "Walk-in customer", method: "Paytm UPI" },
  { amount: 620, ref: "Pooja Singh", method: "Paytm UPI" },
  { amount: 180, ref: "Walk-in customer", method: "Paytm UPI" },
];

// Deterministic-ish daily sales for the last N days (today gets live additions).
export function demoDailySalesForDay(daysAgo: number): number {
  // Weekends busier; gentle upward trend across the 30-day window; some noise.
  const base = 14500;
  const trend = (START_DAY_OFFSET - daysAgo) * 62; // ~₹1,860 growth over 30 days
  const weekendBoost = [0, 6].includes(new Date(Date.now() - daysAgo * 86400000).getDay()) ? 2200 : 0;
  const noise = ((daysAgo * 37) % 19) * 95 - 700;
  return Math.max(6800, Math.round(base + trend + weekendBoost + noise));
}

export const PRODUCT_CATEGORIES = [
  "Groceries",
  "Dairy",
  "Snacks",
  "Personal Care",
  "Household",
  "Staples",
] as const;
