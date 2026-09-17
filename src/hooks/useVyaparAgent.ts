import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  isSttSupported,
  speak,
  startListening,
  stopSpeaking,
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
  const resumeRef = useRef<SoundboxState>("IDLE");
  const stateRef = useRef<SoundboxState>("IDLE");
  stateRef.current = state;

  // Server-side truth for pending sensitive actions (provides the DB id).
  const serverPending = useQuery(api.vyapar.getPendingAction);
  const serverPendingRef = useRef(serverPending);
  serverPendingRef.current = serverPending;

  const ensureMerchant = useMutation(api.vyapar.ensureDemoMerchant);
  const sendTurn = useMutation(api.vyapar.agentTurn);
  const simPayment = useMutation(api.vyapar.simulatePayment);
  const approveAction = useMutation(api.vyapar.approvePendingAction);
  const rejectAction = useMutation(api.vyapar.rejectPendingAction);

  // Seed the demo merchant on mount (idempotent server-side).
  useEffect(() => {
    ensureMerchant({}).catch(() => setError("Seed failed. Reload the page."));
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
          text: `₹${p.amount} received on Paytm`,
          at: p.at,
          meta: { intent: "PAYMENT_EVENT" },
        },
      ]);
      speak(`₹${p.amount} received on Paytm`, "hi-IN");
      window.setTimeout(() => {
        setPayment(null);
        setState(resumeRef.current === "PAYMENT_INTERRUPT" ? "IDLE" : resumeRef.current);
      }, 3800);
    },
    [],
  );

  const simulatePayment = useCallback(async () => {
    try {
      const p = await simPayment({});
      interruptForPayment({ amount: p.amount, ref: p.ref, method: p.method, at: p.at });
    } catch {
      setError("Payment simulation failed. Try again.");
    }
  }, [simPayment, interruptForPayment]);

  const runTurn = useCallback(
    async (text: string, source: "voice" | "text" | "demo") => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setError(null);
      setPartial("");
      setMessages((prev) => [
        ...prev,
        { id: nextMsgId(), role: "merchant", text: trimmed, at: Date.now() },
      ]);
      setState("PROCESSING");
      try {
        const res = await sendTurn({ text: trimmed, source });
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
          speak(res.response, "hi-IN", () => setState("IDLE"));
          // Safety: never stick in RESPONDING if TTS fails silently.
          window.setTimeout(() => {
            setState((s) => (s === "RESPONDING" ? "IDLE" : s));
          }, Math.min(15000, 4000 + res.response.length * 60));
        }
      } catch {
        setState("ERROR");
        setMessages((prev) => [
          ...prev,
          {
            id: nextMsgId(),
            role: "agent",
            text: "System error aa gayi. Dobara koshish kijiye.",
            at: Date.now(),
          },
        ]);
        window.setTimeout(() => setState("IDLE"), 2500);
      }
    },
    [sendTurn],
  );

  const startVoice = useCallback(() => {
    if (stateRef.current === "PAYMENT_INTERRUPT") return; // payment priority
    if (!isSttSupported()) {
      setError("Voice input is not supported in this browser — type instead.");
      return;
    }
    stopSpeaking();
    setState("LISTENING");
    const handle = startListening("hi-IN", {
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
      setError("Could not start the microphone.");
      setState("IDLE");
      return;
    }
    sttRef.current = handle;
  }, [runTurn]);

  const cancelListening = useCallback(() => {
    sttRef.current?.stop();
    sttRef.current = null;
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
      if (!id) return { ok: false, message: "Koi pending action nahi mila." };
      const res = await approveAction({ pendingId: id, pin });
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
        speak(res.message, "hi-IN", () => setState("IDLE"));
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
        await rejectAction({ pendingId: id });
      } catch {
        /* server state self-corrects via subscription */
      }
    }
    setMessages((prev) => [
      ...prev,
      {
        id: nextMsgId(),
        role: "agent",
        text: "Theek hai, main kuch bhi change nahi karungi. Aur kaise madad karun?",
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
  };
}

