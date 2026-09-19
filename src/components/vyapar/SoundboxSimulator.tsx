import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LANGS, type Lang } from "@/convex/langs";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Loader2,
  Volume2,
  ShieldCheck,
  Wifi,
  CheckCircle2,
  Languages,
} from "lucide-react";
import type { SoundboxState } from "@/hooks/useVyaparAgent";
import type { PendingActionView } from "@/hooks/useVyaparAgent";

const STATE_META: Record<
  SoundboxState,
  { label: string; tint: string; ring: string }
> = {
  IDLE: { label: "Idle — say \"Ok Vyapar\"", tint: "text-slate-600", ring: "ring-slate-200" },
  LISTENING: { label: "Listening…", tint: "text-indigo-600", ring: "ring-indigo-300" },
  PROCESSING: { label: "Thinking…", tint: "text-violet-600", ring: "ring-violet-300" },
  RESPONDING: { label: "Speaking…", tint: "text-teal-600", ring: "ring-teal-300" },
  PAYMENT_INTERRUPT: { label: "Payment received", tint: "text-emerald-600", ring: "ring-emerald-300" },
  AUTHENTICATION_REQUIRED: { label: "Authentication required", tint: "text-amber-600", ring: "ring-amber-300" },
  SUCCESS: { label: "Action completed", tint: "text-emerald-600", ring: "ring-emerald-300" },
  ERROR: { label: "Something went wrong", tint: "text-rose-600", ring: "ring-rose-300" },
};

export function SoundboxSimulator({
  state,
  partial,
  onToggleTalk,
  onCancel,
  sttSupported,
  pending,
  onApprove,
  onReject,
  businessName,
  lastApproved,
  lang,
}: {
  state: SoundboxState;
  partial: string;
  onToggleTalk: () => void;
  onCancel: () => void;
  sttSupported: boolean;
  pending: PendingActionView | null;
  onApprove: (pin: string) => void;
  onReject: () => void;
  businessName: string;
  lastApproved: string | null;
  lang: Lang;
}) {
  const busy =
    state === "PROCESSING" ||
    state === "RESPONDING" ||
    state === "AUTHENTICATION_REQUIRED" ||
    state === "PAYMENT_INTERRUPT";
  const meta = STATE_META[state];
  const isListening = state === "LISTENING";
  const isPayment = state === "PAYMENT_INTERRUPT";
  const isAuth = state === "AUTHENTICATION_REQUIRED";

  return (
    <div className="glass-strong relative overflow-hidden rounded-3xl p-6 sm:p-8">
      {/* Status row */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge className="glass-chip gap-1 border-white/60 text-slate-700" variant="secondary">
          <Wifi className="size-3 text-emerald-500" /> Network: Online
        </Badge>
        <Badge className="glass-chip gap-1 border-white/60 text-slate-700" variant="secondary">
          <ShieldCheck className="size-3 text-indigo-500" /> Demo PIN protected
        </Badge>
        <Badge className="glass-chip gap-1 border-white/60 text-slate-700" variant="secondary">
          <Volume2 className="size-3 text-teal-500" /> Speaker: {state === "RESPONDING" ? "Active" : "Ready"}
        </Badge>
        <Badge className="glass-chip gap-1 border-white/60 text-slate-700" variant="secondary">
          <Languages className="size-3 text-indigo-500" /> {LANGS[lang].native} ({LANGS[lang].label})
        </Badge>
        <Badge className="glass-chip gap-1 border-white/60 text-slate-700" variant="secondary">
          {businessName}
        </Badge>
      </div>

      {/* Orb */}
      <div className="relative mx-auto mt-6 flex flex-col items-center">
        <AnimatePresence>
          {isPayment && (
            <motion.div
              key="pay"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.06 }}
              className="absolute -top-8 z-10 rounded-full bg-emerald-500/95 px-4 py-1.5 text-xs font-semibold text-white shadow-lg"
            >
              Payment priority mode
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          aria-label={sttSupported ? "Talk to Vyapar-Mind" : "Voice not supported, use text input"}
          disabled={busy}
          onClick={isListening ? onCancel : onToggleTalk}
          className={cn(
            "vm-orb relative grid size-40 place-items-center rounded-full text-white shadow-xl outline-none sm:size-44",
            "ring-4 ring-offset-4 ring-offset-white/40 transition-all duration-300",
            meta.ring,
            busy && "cursor-not-allowed",
            !busy && "hover:scale-[1.03] active:scale-95",
          )}
        >
          {isListening && (
            <span className="animate-vm-ping absolute inset-0 rounded-full bg-indigo-400/40" />
          )}
          {isListening ? (
            <div className="flex h-10 items-end gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="animate-vm-eq w-1.5 rounded-full bg-white"
                  style={{ height: 40, animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
          ) : state === "PROCESSING" ? (
            <Loader2 className="size-10 animate-spin" />
          ) : state === "RESPONDING" ? (
            <Volume2 className="size-11" />
          ) : isAuth ? (
            <ShieldCheck className="size-11" />
          ) : isPayment ? (
            <Volume2 className="size-11" />
          ) : (
            <Mic className="size-12" />
          )}
        </button>

        <p className={cn("mt-4 text-sm font-semibold", meta.tint)}>{meta.label}</p>
        <p className="mt-0.5 h-4 max-w-md truncate text-xs text-muted-foreground">
          {partial ||
            (sttSupported
              ? "Tap the orb, allow the microphone, then speak"
              : "Type below — voice input unavailable in this browser")}
        </p>
        {sttSupported && state === "IDLE" && (
          <p className="mt-1 max-w-sm text-center text-[10px] leading-4 text-slate-400">
            Works best in Chrome/Edge. If the mic is blocked inside the preview, open the preview in a
            separate browser tab and allow microphone access.
          </p>
        )}
      </div>

      {/* Sensitive-action approval strip */}
      <AnimatePresence>
        {isAuth && pending && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-5 rounded-2xl border border-amber-200/70 bg-amber-50/80 p-4"
          >
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-amber-900">Merchant authentication required</p>
                <p className="mt-0.5 text-xs leading-5 text-amber-800">{pending.summary}</p>
                {pending.detail && (
                  <p className="mt-1 text-xs leading-5 text-amber-700">{pending.detail}</p>
                )}
                <PinRow onApprove={onApprove} onReject={onReject} label={pending.confirmLabel} />
              </div>
            </div>
            <p className="mt-3 border-t border-amber-200/70 pt-2 text-[11px] text-amber-700">
              Sensitive write operations are never executed by the agent directly — approval + demo PIN required (spec §15).
            </p>
            {lastApproved && (
              <p className="mt-1 text-[11px] font-medium text-emerald-700">✓ {lastApproved}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {state === "ERROR" && (
        <p className="mt-4 rounded-xl bg-rose-50/85 p-3 text-center text-xs font-medium text-rose-700">
          Something went wrong. Please try again.
        </p>
      )}
      {/* Cancel listening */}
      {isListening && (
        <div className="mt-4 text-center">
          <Button size="sm" variant="ghost" className="text-slate-500" onClick={onCancel}>
            <MicOff className="size-3.5" /> Cancel
          </Button>
        </div>
      )}
      {busy && !isAuth && (
        <p className="mt-4 text-center text-[11px] text-slate-400">
          Payment announcements take priority over AI conversation (spec §10).
        </p>
      )}
    </div>
  );
}

function PinRow({
  onApprove,
  onReject,
  label,
}: {
  onApprove: (pin: string) => void;
  onReject: () => void;
  label?: string;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input
        inputMode="numeric"
        maxLength={4}
        placeholder="••••"
        aria-label="Demo PIN"
        className="w-24 rounded-lg border border-amber-300 bg-white/80 px-3 py-1.5 text-center font-mono text-lg tracking-[0.4em] outline-none focus:ring-2 focus:ring-amber-300"
        onKeyDown={(e) => {
          const v = (e.target as HTMLInputElement).value;
          if (e.key === "Enter" && v.length === 4) onApprove(v);
        }}
        id="vm-pin-input"
      />
      <Button
        size="sm"
        className="bg-amber-500 text-white hover:bg-amber-600"
        onClick={() => {
          const el = document.getElementById("vm-pin-input") as HTMLInputElement | null;
          if (el && el.value.length === 4) onApprove(el.value);
        }}
      >
        <CheckCircle2 className="size-4" /> {label ?? "Approve"}
      </Button>
      <Button size="sm" variant="ghost" className="text-slate-500" onClick={onReject}>
        Reject
      </Button>
    </div>
  );
}
