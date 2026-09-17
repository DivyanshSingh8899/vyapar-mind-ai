import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Mic, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage, SoundboxState } from "@/hooks/useVyaparAgent";

const QUICK_PROMPTS = [
  "Aaj kitna business hua?",
  "Kaunse customer 30 din se nahi aaye?",
  "Milk ka stock kitna hai?",
  "Ramesh ka ₹500 udhaar update kar do.",
  "Mere liye koi loan offer hai?",
  "Aaj ka business ka summary batao.",
];

export function ConversationPanel({
  messages,
  state,
  onSubmit,
  onQuickPrompt,
  onClear,
  onReseed,
  onSimulatePayment,
  disabled,
}: {
  messages: ChatMessage[];
  state: SoundboxState;
  onSubmit: (text: string) => void;
  onQuickPrompt: (text: string) => void;
  onClear: () => void;
  onReseed: () => void;
  onSimulatePayment: () => void;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const submit = () => {
    const t = draft.trim();
    if (!t || disabled) return;
    setDraft("");
    onSubmit(t);
  };

  return (
    <div className="glass flex h-full min-h-[420px] flex-col rounded-3xl p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Conversation</h3>
          <p className="text-[11px] text-muted-foreground">Live transcript · agent answers via business tools</p>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="size-7 text-slate-400" title="Reseed demo data" onClick={onReseed}>
            <RotateCcw className="size-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="size-7 text-slate-400" title="Clear transcript" onClick={onClear}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Transcript */}
      <div className="no-scrollbar mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
            <div className="vm-orb flex size-12 items-center justify-center rounded-2xl text-white">
              <Mic className="size-6" />
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-700">Boliye, main sun rahi hoon</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Tap a suggestion below or type your question. Try: “Aaj kitna business hua?”
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", m.role === "merchant" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "merchant" && "vm-orb text-white",
                  m.role === "agent" && "glass-chip text-slate-800",
                  m.role === "payment" &&
                    "border border-emerald-200 bg-emerald-50/90 font-semibold text-emerald-800",
                )}
              >
                {m.role === "payment" && (
                  <span className="mr-1.5 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                    Soundbox
                  </span>
                )}
                {m.text}
                {m.role === "agent" && m.meta?.tool && (
                  <span className="mt-1.5 block font-mono text-[10px] text-slate-400">
                    {m.meta.intent} · {m.meta.tool} · {m.meta.latencyMs ?? 0}ms
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {state === "PROCESSING" && (
          <div className="flex items-center gap-2 text-xs text-violet-600">
            <span className="size-2 animate-pulse rounded-full bg-violet-500" />
            Vyapar-Mind is checking business tools…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            disabled={disabled}
            onClick={() => onQuickPrompt(q)}
            className="glass-chip shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:text-indigo-600 disabled:opacity-50"
          >
            <Plus className="mr-1 inline size-3" />
            {q}
          </button>
        ))}
      </div>

      {/* Text input fallback */}
      <div className="mt-3 flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Type in Hindi/English… (voice fallback)"
          disabled={disabled}
          className="glass-inset border-white/60 bg-white/70"
        />
        <Button onClick={submit} disabled={disabled || !draft.trim()} className="vm-orb border-0 text-white">
          <CornerDownLeft className="size-4" />
        </Button>
      </div>
    </div>
  );
}
