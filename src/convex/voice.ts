import { v } from "convex/values";
import { action, query } from "./_generated/server";

/**
 * Which voice providers the client should use (checked server-side, keys never
 * reach the frontend). Supports either a single combined key (SARVAM_AI_API_KEY)
 * or two separate per-direction keys:
 *   SARVAM_STT_API_KEY  → speech-to-text (saarika)
 *   SARVAM_TTS_API_KEY  → text-to-speech (bulbul)
 */
export const getVoiceConfig = query({
  args: {},
  handler: async () => ({
    sarvamSttAvailable: Boolean(process.env.SARVAM_STT_API_KEY ?? process.env.SARVAM_AI_API_KEY),
    sarvamTtsAvailable: Boolean(process.env.SARVAM_TTS_API_KEY ?? process.env.SARVAM_AI_API_KEY),
  }),
});

/**
 * Sarvam AI voice adapter (secure backend endpoints).
 *
 * Keys are read server-side only. If a direction's key is not configured, that
 * action returns a clean "unavailable" response and the client falls back
 * (Web Speech API / text input) — we NEVER fake a transcription or audio.
 */

export const sarvamStt = action({
  args: { audioBase64: v.string(), language: v.optional(v.string()) },
  handler: async (_ctx, args) => {
    const apiKey = process.env.SARVAM_STT_API_KEY ?? process.env.SARVAM_AI_API_KEY;
    if (!apiKey) {
      return {
        available: false as const,
        text: "",
        note: "SARVAM_STT_API_KEY not configured - text fallback active. No simulated transcript.",
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
    const apiKey = process.env.SARVAM_TTS_API_KEY ?? process.env.SARVAM_AI_API_KEY;
    if (!apiKey) {
      return {
        available: false as const,
        audioBase64: "",
        note: "SARVAM_TTS_API_KEY not configured - using Web Speech API fallback.",
      };
    }

    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: { "api-subscription-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs: [args.text],
        target_language_code: args.language ?? "hi-IN",
        speaker: "ritu",
        model: "bulbul:v3",
      }),
    });
    if (!res.ok) {
      return { available: false as const, audioBase64: "", note: `Sarvam TTS error ${res.status}` };
    }
    const data = (await res.json()) as { audios?: string[] };
    return { available: true as const, audioBase64: String(data.audios?.[0] ?? "") };
  },
});
