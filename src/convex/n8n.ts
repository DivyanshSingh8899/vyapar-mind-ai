import { v } from "convex/values";
import { action, query } from "./_generated/server";
import { internal } from "./_generated/api";

// ─────────────────────────────────────────────────────────────────────────────
// Vyapar-Mind — n8n Cloud adapter
//
// n8n is the delivery/workflow engine behind approved campaigns: when the
// merchant approves a win-back campaign with the demo PIN, Convex fires a
// webhook to the configured n8n workflow, which fans out the (simulated)
// WhatsApp/Email sends and calls back the /n8n/callback HTTP endpoint to mark
// the campaign delivered.
//
// Configuration (both optional — the app runs fully without n8n):
//   N8N_WEBHOOK_URL    production webhook URL of the "Vyapar-Mind Campaign
//                      Delivery" workflow (Webhook node, POST method)
//   N8N_SHARED_SECRET  shared secret; sent as `x-vyapar-secret` on the
//                      outbound webhook, and required on inbound callbacks
//
// No secrets are exposed to the client: getConfig only returns booleans.
// ─────────────────────────────────────────────────────────────────────────────

/** Which n8n capabilities are configured (client-safe booleans only). */
export const getN8nConfig = query({
  args: {},
  handler: async () => ({
    n8nAvailable: Boolean(process.env.N8N_WEBHOOK_URL),
    secured: Boolean(process.env.N8N_SHARED_SECRET),
  }),
});

/** Constant-time-ish string compare (small secret space is fine here). */
function secretMatches(received: string | null, expected: string | undefined): boolean {
  if (!expected) return true; // no secret configured → open callback (demo mode)
  if (!received) return false;
  if (received.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= received.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/**
 * Fire the approved campaign to the n8n workflow.
 * Runs in its own action so the approval mutation stays fast and a slow n8n
 * call can never block or fail the merchant's PIN approval — delivery state
 * converges via the /n8n/callback endpoint.
 */
export const dispatchCampaign = action({
  args: {
    campaignId: v.string(),
    merchantCode: v.string(),
    businessName: v.string(),
    offer: v.string(),
    customerNames: v.array(v.string()),
  },
  handler: async (_ctx, args) => {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      return { dispatched: false as const, note: "N8N_WEBHOOK_URL not configured — campaign delivery stays simulated in-app." };
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.N8N_SHARED_SECRET
            ? { "x-vyapar-secret": process.env.N8N_SHARED_SECRET }
            : {}),
        },
        body: JSON.stringify({
          source: "vyapar-mind",
          event: "campaign.approved",
          campaignId: args.campaignId,
          merchantCode: args.merchantCode,
          businessName: args.businessName,
          offer: args.offer,
          channel: "whatsapp_simulation",
          customers: args.customerNames.map((name) => ({ name })),
          dispatchedAt: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        return { dispatched: false as const, note: `n8n webhook returned ${res.status}` };
      }
      return { dispatched: true as const, note: "Campaign handed off to n8n workflow." };
    } catch (err) {
      return { dispatched: false as const, note: `n8n webhook failed: ${err instanceof Error ? err.message : String(err)}` };
    }
  },
});

/** Mark a campaign delivered — called via the /n8n/callback HTTP route after n8n runs. */
export const markCampaignDelivered = action({
  args: { campaignId: v.string(), secret: v.optional(v.string()), delivered: v.number() },
  handler: async (ctx, args): Promise<{ ok: boolean; note: string }> => {
    if (!secretMatches(args.secret ?? null, process.env.N8N_SHARED_SECRET)) {
      return { ok: false, note: "Invalid shared secret" };
    }
    await ctx.runMutation(internal.vyapar.setCampaignDelivered, {
      campaignId: args.campaignId as never,
      deliveredCount: args.delivered,
    });
    return { ok: true, note: "Campaign marked delivered" };
  },
});
