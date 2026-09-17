import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * Sarvam AI voice adapter (secure backend endpoints).
 *
 * If SARVAM_AI_API_KEY is configured, STT/TTS are proxied through these Convex
 * actions so the key never reaches the frontend. If not configured, they
 * return a clean "unavailable" response - we NEVER fake a transcription.
 */

export const sarvamStt = action({
  args: { audioBase64: v.string(), language: v.optional(v.string()) },
  handler: async (_ctx, args) => {
    const apiKey = process.env.SARVAM_AI_API_KEY;
    if (!apiKey) {
      return {
        available: false as const,
        text: "",
        note: "SARVAM_AI_API_KEY not configured - text fallback active. No simulated transcript.",
      };
    }

    const bytes = Uint8Array.from(atob(args.audioBase64), (c) => c.charCodeAt(0));
    const fd = new FormData();
    fd.append("file", new Blob([bytes], { type: "audio/webm" }), "audio.webm");
    fd.append("model", "saarika:v2.5");
    if (args.language && args.language !== "unknown") {
      fd.append("language_code", args.language);
    }

    const res = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: { "api-subscription-key": apiKey },
      body: fd,
    });
    if (!res.ok) {
      return { available: false as const, text: "", note: `Sarvam STT error ${res.status}` };
    }
    const data = (await res.json()) as { transcript?: string };
    return { available: true as const, text: String(data.transcript ?? "") };
  },
});

export const sarvamTts = action({
  args: { text: v.string(), language: v.optional(v.string()) },
  handler: async (_ctx, args) => {
    const apiKey = process.env.SARVAM_AI_API_KEY;
    if (!apiKey) {
      return {
        available: false as const,
        audioBase64: "",
        note: "SARVAM_AI_API_KEY not configured - using Web Speech API fallback.",
      };
    }

    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: { "api-subscription-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs: [args.text],
        target_language_code: args.language ?? "hi-IN",
        speaker: "anushka",
        model: "bulbul:v2",
      }),
    });
    if (!res.ok) {
      return { available: false as const, audioBase64: "", note: `Sarvam TTS error ${res.status}` };
    }
    const data = (await res.json()) as { audios?: string[] };
    return { available: true as const, audioBase64: String(data.audios?.[0] ?? "") };
  },
});
