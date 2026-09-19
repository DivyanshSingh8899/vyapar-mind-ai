import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // ─────────────────── Vyapar-Mind demo data ───────────────────

    merchants: defineTable({
      merchantCode: v.string(), // "M001"
      businessName: v.string(),
      ownerName: v.string(),
      language: v.string(), // "hi-IN"
      city: v.string(),
      soundboxLinked: v.boolean(),
      demoPinHash: v.string(), // sha256 hex — never plaintext
      createdAt: v.number(),
    }).index("by_code", ["merchantCode"]),

    transactions: defineTable({
      merchantId: v.id("merchants"),
      customerId: v.optional(v.id("customers")),
      amount: v.number(),
      category: v.string(),
      paymentMethod: v.string(),
      transactionTime: v.number(),
    })
      .index("by_merchant_time", ["merchantId", "transactionTime"])
      .index("by_merchant_customer", ["merchantId", "customerId"]),

    customers: defineTable({
      merchantId: v.id("merchants"),
      name: v.string(),
      phone: v.string(),
      lastPurchaseAt: v.number(),
      totalSpent: v.number(),
      visitCount: v.number(),
    })
      .index("by_merchant", ["merchantId"])
      .index("by_merchant_lastPurchase", ["merchantId", "lastPurchaseAt"]),

    inventory: defineTable({
      merchantId: v.id("merchants"),
      productName: v.string(),
      quantity: v.number(),
      reorderLevel: v.number(),
      price: v.number(),
    }).index("by_merchant", ["merchantId"]),

    udhaarLedger: defineTable({
      merchantId: v.id("merchants"),
      customerId: v.id("customers"),
      amount: v.number(), // positive = udhaar given, negative = repayment
      type: v.string(), // "credit" | "repayment"
      description: v.string(),
      createdAt: v.number(),
    })
      .index("by_merchant_customer", ["merchantId", "customerId"])
      .index("by_merchant", ["merchantId"]),

    campaigns: defineTable({
      merchantId: v.id("merchants"),
      campaignType: v.string(), // "winback"
      targetCount: v.number(),
      offer: v.string(),
      status: v.string(), // "created" | "delivering" | "completed"
      channel: v.string(), // "simulated_whatsapp"
      customerNames: v.array(v.string()),
      createdAt: v.number(),
    }).index("by_merchant", ["merchantId"]),

    loanOffers: defineTable({
      merchantId: v.id("merchants"),
      amount: v.number(),
      status: v.string(), // "simulated_offer" | "accepted"
      reason: v.string(),
      activityScore: v.number(),
      createdAt: v.number(),
    }).index("by_merchant", ["merchantId"]),

    qrCodes: defineTable({
      merchantId: v.id("merchants"),
      razorpayQrId: v.string(),
      amount: v.number(), // rupees, same unit as transactions
      imageUrl: v.string(),
      status: v.string(), // "pending" | "paid"
      razorpayPaymentId: v.optional(v.string()),
      createdAt: v.number(),
      paidAt: v.optional(v.number()),
    })
      .index("by_qrId", ["razorpayQrId"])
      .index("by_merchant", ["merchantId"]),

    agentLogs: defineTable({
      merchantId: v.id("merchants"),
      userInput: v.string(),
      detectedIntent: v.string(),
      toolUsed: v.string(),
      response: v.string(),
      success: v.boolean(),
      latencyMs: v.number(),
      source: v.string(), // "voice" | "text" | "demo"
      createdAt: v.number(),
    }).index("by_merchant_time", ["merchantId", "createdAt"]),

    paymentEvents: defineTable({
      merchantId: v.id("merchants"),
      amount: v.number(),
      customerReference: v.string(),
      method: v.string(),
      createdAt: v.number(),
    }).index("by_merchant_time", ["merchantId", "createdAt"]),

    // Server-side sensitive-action queue: the agent NEVER writes sensitive
    // data directly — it enqueues here, the merchant approves with demo PIN.
    pendingActions: defineTable({
      merchantId: v.id("merchants"),
      actionType: v.string(), // "udhaar_update" | "create_campaign"
      payload: v.any(),
      summary: v.string(),
      status: v.string(), // "pending" | "approved" | "rejected" | "expired"
      expiresAt: v.number(),
      createdAt: v.number(),
    })
      .index("by_merchant_status", ["merchantId", "status"])
      .index("by_merchant_time", ["merchantId", "createdAt"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
