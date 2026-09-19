import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();
auth.addHttpRoutes(http);

http.route({
  path: "/razorpay/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const raw = await req.text();
    const sig = req.headers.get("x-razorpay-signature") ?? "";
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(process.env.RZP_WEBHOOK_SECRET!),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
    );
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
    const expected = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
    let diff = expected.length ^ sig.length;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ (sig.charCodeAt(i) || 0);
    if (diff !== 0) return new Response("bad signature", { status: 400 });

    const event = JSON.parse(raw);
    if (event.event === "qr_code.credited") {
      const pay = event.payload?.payment?.entity;
      await ctx.runMutation(internal.razorpay.handleCredited, {
        qrId: event.payload.qr_code.entity.id,
        paymentId: pay.id,
        amountPaise: pay.amount,
        payer: pay.vpa ?? undefined,
      });
    }
    return new Response("ok");
  }),
});

export default http;