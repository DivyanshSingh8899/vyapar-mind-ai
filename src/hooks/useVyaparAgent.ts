import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { CLIENT_STRINGS, LANGS, type Lang } from "@/convex/langs";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  isSttSupported,
  micPermissionState,
  playBase64Audio,
  speak,
  startListening,
  startRecorder,
  stopSpeaking,
  supportsMediaRecorder,
  type RecorderHandle,
  type SttHandle,
} from "@/lib/voice";

// Conversation engine hook.
// States: IDLE → LISTENING → PROCESSING → RESPONDING → IDLE
// Payment events interrupt anything (PAYMENT_INTERRUPT, then resume).

export type SoundboxState =
  | "IDLE"
  | "LISTENING"
  | "PROCESSING"
  | "RESPONDING"
  | "PAYMENT_INTERRUPT"
  | "AUTHENTICATION_REQUIRED"
  | "SUCCESS"
  | "ERROR";

export interface ChatMessage {
  id: string;
  role: "merchant" | "agent" | "payment";
  text: string;
  at: number;
  meta?: {
    intent?: string;
    tool?: string;
    latencyMs?: number;
  };
}

export interface PendingActionView {
  id: string | null;
  actionType: "udhaar_update" | "create_campaign";
  summary: string;
  detail?: string;
  confirmLabel?: string;
}

let msgCounter = 0;
const nextMsgId = () => `m${++msgCounter}-${Date.now()}`;

export function useVyaparAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "hi";
    const saved = window.localStorage.getItem("vyapar-lang");
    return saved === "hi" || saved === "en" || saved === "ta" || saved === "te" || saved === "kn" ? saved : "hi";
  });
  const langRef = useRef<Lang>(lang);
  langRef.current = lang;
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem("vyapar-lang", l);
    } catch {
      /* private mode */
    }
  }, []);
  const S = CLIENT_STRINGS[lang];
  const [state, setState] = useState<SoundboxState>("IDLE");
  const [partial, setPartial] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingActionView | null>(null);
  const [payment, setPayment] = useState<{
    amount: number;
    ref: string;
    method: string;
    at: number;
  } | null>(null);
  const [lastTurn, setLastTurn] = useState<{
    intent: string;
    tool: string;
    latencyMs: number;
  } | null>(null);
  const [lastApproved, setLastApproved] = useState<string | null>(null);

  const sttRef = useRef<SttHandle | null>(null);
  const recRef = useRef<RecorderHandle | null>(null);
  const resumeRef = useRef<SoundboxState>("IDLE");
  const stateRef = useRef<SoundboxState>("IDLE");
  stateRef.current = state;

  // Server-side truth for pending sensitive actions (provides the DB id).
  const serverPending = useQuery(api.vyapar.getPendingAction);
  // Voice provider config: which Sarvam directions the backend has keys for.
  const voiceConfig = useQuery(api.voice.getVoiceConfig);
  const sarvamSttOn = Boolean(voiceConfig?.sarvamSttAvailable);
  const sarvamTtsOn = Boolean(voiceConfig?.sarvamTtsAvailable);
  const serverPendingRef = useRef(serverPending);
  serverPendingRef.current = serverPending;

  const sarvamSttAction = useAction(api.voice.sarvamStt);
  const sarvamTtsAction = useAction(api.voice.sarvamTts);
  const ensureMerchant = useMutation(api.vyapar.ensureDemoMerchant);
  const sendTurn = useMutation(api.vyapar.agentTurn);
  const simPayment = useMutation(api.vyapar.simulatePayment);
  const approveAction = useMutation(api.vyapar.approvePendingAction);
  const rejectAction = useMutation(api.vyapar.rejectPendingAction);

  // Seed the demo merchant on mount (idempotent server-side).
  useEffect(() => {
    ensureMerchant({}).catch(() => setError(CLIENT_STRINGS[langRef.current].seedFailed));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Payment events ALWAYS take priority over any conversation state. */
  const interruptForPayment = useCallback(
    (p: { amount: number; ref: string; method: string; at: number }) => {
      stopSpeaking();
      resumeRef.current = stateRef.current === "PAYMENT_INTERRUPT" ? "IDLE" : stateRef.current;
      setState("PAYMENT_INTERRUPT");
      setPayment(p);
      setMessages((prev) => [
        ...prev,
        {
          id: nextMsgId(),
          role: "payment",
          text: `₹${p.amount} ${S.payment}`,
          at: p.at,
          meta: { intent: "PAYMENT_EVENT" },
        },
      ]);
      speak(`₹${p.amount} ${S.paymentSpoken}`, LANGS[langRef.current].locale);
      window.setTimeout(() => {
        setPayment(null);
        setState(resumeRef.current === "PAYMENT_INTERRUPT" ? "IDLE" : resumeRef.current);
      }, 3800);
    },
    [S.payment, S.paymentSpoken],
  );

  const simulatePayment = useCallback(async () => {
    try {
      const p = await simPayment({});
      interruptForPayment({ amount: p.amount, ref: p.ref, method: p.method, at: p.at });
    } catch {
      setError(S.payFailed);
    }
  }, [simPayment, interruptForPayment, S.payFailed]);

  const runTurn = useCallback(
    async (text: string, source: "voice" | "text" | "demo") => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const selectedLang = langRef.current;
      setError(null);
      setPartial("");
      setMessages((prev) => [
        ...prev,
        { id: nextMsgId(), role: "merchant", text: trimmed, at: Date.now() },
      ]);
      setState("PROCESSING");
      try {
        const res = await sendTurn({ text: trimmed, source, lang: selectedLang });
        setLastTurn({ intent: res.intent, tool: res.tool, latencyMs: res.latencyMs });
        setMessages((prev) => [
          ...prev,
          {
            id: nextMsgId(),
            role: "agent",
            text: res.response,
            at: Date.now(),
            meta: { intent: res.intent, tool: res.tool, latencyMs: res.latencyMs },
          },
        ]);
        if (res.pendingAction) {
          setPending({
            id: serverPendingRef.current?.id ?? null,
            actionType: res.pendingAction.actionType,
            summary: res.pendingAction.summary,
            detail: res.pendingAction.detail,
            confirmLabel: res.pendingAction.confirmLabel,
          });
          setState("AUTHENTICATION_REQUIRED");
        } else {
          setState("RESPONDING");
          let settled = false;
          const done = () => {
            if (settled) return;
            settled = true;
            setState("IDLE");
          };
          if (sarvamTtsOn) {
            // Try premium Sarvam TTS first; silently fall back to browser TTS.
            try {
              const tts = await sarvamTtsAction({ text: res.response, language: LANGS[selectedLang].sarvamTts });
              if (tts.available && tts.audioBase64 && playBase64Audio(tts.audioBase64, done)) {
                window.setTimeout(done, 20000);
                return;
              }
            } catch {
              /* fall through to browser TTS */
            }
          }
          speak(res.response, LANGS[selectedLang].locale, done);
          window.setTimeout(done, Math.min(15000, 4000 + res.response.length * 60));
        }
      } catch {
        setState("ERROR");
        setMessages((prev) => [
          ...prev,
          {
            id: nextMsgId(),
            role: "agent",
            text: CLIENT_STRINGS[langRef.current].sysError,
            at: Date.now(),
          },
        ]);
        window.setTimeout(() => setState("IDLE"), 2500);
      }
    },
    [sendTurn, sarvamTtsOn],
  );

  const startVoice = useCallback(() => {
    void (async () => {
      if (stateRef.current === "PAYMENT_INTERRUPT") return; // payment priority
      if (sarvamSttOn && supportsMediaRecorder()) {
        // ── Sarvam path: record → secure backend STT (never a fake transcript) ──
        stopSpeaking();
        if (recRef.current) {
          // Second tap: stop capture → Sarvam STT → run the agent.
          const rec = recRef.current;
          recRef.current = null;
          setPartial("");
          setState("PROCESSING");
          const audio = await rec.stop();
          if (!audio?.base64) {
            setError("Recording failed — please try again or type instead.");
            setState("IDLE");
            return;
          }
          try {
            const stt = await sarvamSttAction({ audioBase64: audio.base64, language: LANGS[langRef.current].sarvamStt });
            if (!stt.available || !stt.text.trim()) {
              setError(stt.note || "Transcription unavailable — type instead.");
              setState("IDLE");
              return;
            }
            await runTurn(stt.text, "voice");
          } catch {
            setError("Sarvam STT call failed — check the API key, or type instead.");
            setState("IDLE");
          }
          return;
        }
        setState("LISTENING");
        const rec = await startRecorder();
        if (!rec) {
          setError("Microphone blocked or unavailable. Allow mic access in the browser, or type instead.");
          setState("IDLE");
        } else {
          recRef.current = rec;
          setPartial(CLIENT_STRINGS[langRef.current].recording);
        }
        return;
      }
      // ── Browser path: Web Speech API (live transcript) ──
      if (!isSttSupported()) {
        setError("Voice input is not supported in this browser — type instead.");
        return;
      }
      stopSpeaking();
      setState("LISTENING");
      const handle = startListening(LANGS[langRef.current].locale, {
        onPartial: (t) => setPartial(t),
        onFinal: (t) => {
          sttRef.current = null;
          runTurn(t, "voice");
        },
        onError: (code, message) => {
          sttRef.current = null;
          setError(`${message} (${code})`);
          setState("IDLE");
        },
        onEnd: () => {
          if (sttRef.current) {
            sttRef.current = null;
            if (stateRef.current === "LISTENING") setState("IDLE");
          }
        },
      });
      if (!handle) {
        setError("Could not start the microphone. Check browser mic permissions.");
        setState("IDLE");
        return;
      }
      sttRef.current = handle;
    })();
  }, [runTurn, sarvamSttOn]);

  const cancelListening = useCallback(() => {
    sttRef.current?.stop();
    sttRef.current = null;
    void recRef.current?.stop();
    recRef.current = null;
    setPartial("");
    setState("IDLE");
  }, []);

  // Sync the real server id into the local pending view once the query lands.
  useEffect(() => {
    if (serverPending && state === "AUTHENTICATION_REQUIRED") {
      setPending((p) =>
        p ? { ...p, id: serverPending.id, summary: serverPending.summary } : p,
      );
    }
  }, [serverPending, state]);

  const approve = useCallback(
    async (pin: string) => {
      const id = pending?.id ?? serverPendingRef.current?.id;
      if (!id) return { ok: false, message: CLIENT_STRINGS[langRef.current].noPending };
      const res = await approveAction({ pendingId: id, pin, lang: langRef.current });
      if (res.ok) {
        setLastApproved(res.message);
        setPending(null);
        setState("SUCCESS");
        setMessages((prev) => [
          ...prev,
          {
            id: nextMsgId(),
            role: "agent",
            text: res.message,
            at: Date.now(),
            meta: { tool: "approved_via_pin" },
          },
        ]);
        speak(res.message, LANGS[langRef.current].locale, () => setState("IDLE"));
        return { ok: true, message: res.message };
      }
      return { ok: false, message: res.message };
    },
    [pending, approveAction],
  );

  const reject = useCallback(async () => {
    const id = pending?.id;
    setPending(null);
    if (id) {
      try {
        await rejectAction({ pendingId: id, lang: langRef.current });
      } catch {
        /* server state self-corrects via subscription */
      }
    }
    setMessages((prev) => [
      ...prev,
      {
        id: nextMsgId(),
        role: "agent",
        text: CLIENT_STRINGS[langRef.current].rejected,
        at: Date.now(),
      },
    ]);
    setState("IDLE");
  }, [pending, rejectAction]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setLastApproved(null);
    setPending(null);
    setState("IDLE");
  }, []);

  return {
    messages,
    state,
    partial,
    error,
    pending,
    payment,
    lastTurn,
    lastApproved,
    serverPendingId: serverPending?.id ?? null,
    runTurn,
    startVoice,
    cancelListening,
    approve,
    reject,
    simulatePayment,
    clearConversation,
    sttSupported: isSttSupported(),
    lang,
    setLang,
  };
}

