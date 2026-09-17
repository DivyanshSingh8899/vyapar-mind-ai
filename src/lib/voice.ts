// ─────────────────────────────────────────────────────────────────────────────
// Vyapar-Mind — Voice provider adapter (frontend)
//
// ARCHITECTURE (matches the spec):
//   VOICE INPUT → STT → AGENT (Convex agentTurn) → TOOLS (Postgres)
//     → RESPONSE → TTS → SOUNDBOX OUTPUT
//
// Default provider is the browser's Web Speech API — no key required, works
// offline in Chrome/Edge. If SARVAM_AI_API_KEY is configured server-side, the
// same interface can be swapped to the Convex sarvamStt/sarvamTts actions
// (see src/convex/voice.ts). We never fake transcription output.
// ─────────────────────────────────────────────────────────────────────────────

export type VoiceProvider = "webspeech" | "sarvam" | "unavailable";

export interface SttHandle {
  stop: () => void;
}

export interface SttCallbacks {
  onPartial?: (text: string) => void;
  onFinal: (text: string, confidence: number) => void;
  onError: (code: string, message: string) => void;
  onEnd?: () => void;
}

/** Minimal typings for the Web Speech API (not in TS DOM lib). */
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

function createRecognition(
  lang: string,
  callbacks: SttCallbacks,
): SpeechRecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = lang;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  rec.interimResults = true;
  rec.onresult = (e: any) => {
    let partial = "";
    let final = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      if (res.isFinal) final += res[0].transcript;
      else partial += res[0].transcript;
    }
    if (callbacks.onPartial) callbacks.onPartial(partial);
    if (final) callbacks.onFinal(final.trim(), e.results[0][0].confidence ?? 0.9);
  };
  rec.onerror = (e: any) => {
    callbacks.onError(e.error ?? "unknown", "Speech recognition error");
  };
  rec.onend = () => {
    if (callbacks.onEnd) callbacks.onEnd();
  };
  return rec;
}

/** Returns null when the browser has no speech recognition support. */
export function startListening(
  lang: string,
  callbacks: SttCallbacks,
): SttHandle | null {
  const rec = createRecognition(lang, callbacks);
  if (!rec) return null;
  try {
    rec.start();
  } catch {
    return null;
  }
  return {
    stop: () => {
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    },
  };
}

export function isSttSupported(): boolean {
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

/** Speak text via Web Speech API; resolves when playback completes. */
export function speak(
  text: string,
  lang = "hi-IN",
  onEnd?: () => void,
): void {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 1.0;
    u.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.lang === lang && /female|woman/i.test(v.name)) ??
      voices.find((v) => v.lang?.startsWith(lang.slice(0, 2)));
    if (voice) u.voice = voice;
    if (onEnd) u.onend = () => onEnd();
    window.speechSynthesis.speak(u);
  } catch {
    if (onEnd) onEnd();
  }
}

export function stopSpeaking(): void {
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* noop */
  }
}

export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Detect Sarvam availability server-side (used for status chips). */
export function voiceProviderLabel(hasSarvam: boolean): string {
  if (hasSarvam) return "Sarvam AI STT/TTS";
  if (isSttSupported() && isTtsSupported()) return "Browser voice (Web Speech API)";
  return "Text fallback";
}
