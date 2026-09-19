import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// ─────────────────────────────────────────────────────────────────────────────
// n8n Cloud callback — the campaign-delivery workflow POSTs here when it has
// finished fanning out the messages for an approved campaign.
//
// Contract (matches src/convex/n8n.ts):
//   POST /n8n/callback
//   headers: Content-Type: application/json, x-vyapar-secret: <N8N_SHARED_SECRET>
//   body:    { "event": "campaign.delivered", "campaignId": "<convex id>",
//              "delivered": <number of messages sent> }
//   → 200 { ok: true } | 403 invalid secret | 404 unknown campaign | 500 error
// ─────────────────────────────────────────────────────────────────────────────
export const n8nCallback = httpAction(async (ctx, req) => {
  try {
    const body = (await req.json()) as {
      event?: string;
      campaignId?: string;
      delivered?: number;
    };
    if (body.event !== "campaign.delivered" || !body.campaignId) {
      return new Response(JSON.stringify({ ok: false, error: "Expected event=campaign.delivered with campaignId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const secret = req.headers.get("x-vyapar-secret");
    const result: { ok: boolean; note: string } = await ctx.runAction(api.n8n.markCampaignDelivered, {
      campaignId: body.campaignId,
      secret: secret ?? undefined,
      delivered: Number(body.delivered ?? 0),
    });
    if (!result.ok) {
      return new Response(JSON.stringify(result), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "callback failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

http.route({ path: "/n8n/callback", method: "POST", handler: n8nCallback });

export default http;
