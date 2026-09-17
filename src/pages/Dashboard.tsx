import { AgentActivityPanel, PaymentsPanel } from "@/components/vyapar/ActivityPanels";
import { DemoModeBar } from "@/components/vyapar/DemoModeBar";
import { SoundboxSimulator } from "@/components/vyapar/SoundboxSimulator";
import { ConversationPanel } from "@/components/vyapar/ConversationPanel";
import {
  CustomersPanel,
  InventoryPanel,
  TodayPanel,
  UdhaarCreditRow,
} from "@/components/vyapar/BusinessPanels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useVyaparAgent } from "@/hooks/useVyaparAgent";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { BellRing, CircleStop, LogOut, Radio, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const data = useQuery(api.vyapar.getDashboard);
  const agent = useVyaparAgent();
  const reseed = useMutation(api.vyapar.reseedDemoMerchant);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const runDemo = (utterance: string, id: string) => {
    setActiveDemo(id);
    if (utterance === "__PAYMENT__") {
      agent.simulatePayment();
      window.setTimeout(() => setActiveDemo(null), 2000);
    } else {
      agent.runTurn(utterance, "demo");
    }
  };

  const busy =
    agent.state === "PROCESSING" ||
    agent.state === "RESPONDING" ||
    agent.state === "AUTHENTICATION_REQUIRED" ||
    agent.state === "PAYMENT_INTERRUPT";

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-14 pt-6 sm:px-6">
      {/* ── Header ── */}
      <header className="glass-strong flex flex-col gap-4 rounded-3xl px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="vm-orb grid size-11 shrink-0 place-items-center rounded-2xl text-white shadow-lg">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
                Paytm <span className="text-gradient">Vyapar-Mind</span>
              </h1>
              <Badge className="hidden border-indigo-200 bg-indigo-50/80 text-[10px] font-bold text-indigo-700 sm:inline-flex" variant="secondary">
                AI Hackathon 2026 · Prototype
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {data ? (
                <>
                  {data.merchant.businessName} · <span className="font-mono">{data.merchant.id}</span> · {data.merchant.city}
                </>
              ) : (
                "Loading merchant…"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={agent.simulatePayment}
            className="vm-orb border-0 gap-2 rounded-full px-4 font-bold text-white shadow-lg"
          >
            <BellRing className="size-4" />
            SIMULATE PAYMENT
          </Button>
          <Button variant="outline" size="icon" className="rounded-full border-white/70 bg-white/60" onClick={handleSignOut} title={user?.email ?? "Sign out"}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      {/* ── Demo bar ── */}
      <div className="mt-4">
        <DemoModeBar onRun={runDemo} activeId={activeDemo} />
      </div>

      {/* ── Soundbox + Conversation ── */}
      <section className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_1fr]">
        <SoundboxSimulator
          state={agent.state}
          partial={agent.partial}
          sttSupported={agent.sttSupported}
          pending={agent.pending}
          businessName={data?.merchant.businessName ?? "Ramesh General Store"}
          lastApproved={agent.lastApproved}
          onToggleTalk={agent.startVoice}
          onCancel={agent.cancelListening}
          onApprove={(pin) => agent.approve(pin)}
          onReject={agent.reject}
        />
        <ConversationPanel
          messages={agent.messages}
          state={agent.state}
          disabled={busy}
          onSubmit={(t) => agent.runTurn(t, "text")}
          onQuickPrompt={(t) => agent.runTurn(t, "text")}
          onClear={agent.clearConversation}
          onReseed={() => {
            reseed({}).finally(() => window.location.reload());
          }}
          onSimulatePayment={agent.simulatePayment}
        />
      </section>

      {/* ── Voice-first message ── */}
      <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <Radio className="size-3.5 text-indigo-400" />
        Merchant ko dashboard kholne ki zaroorat nahi — bas boliye. Dashboard sirf backup hai.
      </p>

      {/* ── Business panels ── */}
      {!data ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass h-48 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : (
        <section className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <TodayPanel data={data} />
          <CustomersPanel data={data} />
          <InventoryPanel data={data} />
          <UdhaarCreditRow data={data} />
          <PaymentsPanel data={data} />
          <AgentActivityPanel data={data} />
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <ShieldCheck className="size-3 text-indigo-400" /> Sensitive actions need merchant PIN
        </span>
        <span className="flex items-center gap-1">
          <CircleStop className="size-3 text-rose-400" /> Demo data only — no private Paytm APIs
        </span>
        <span>Voice: Web Speech API (Sarvam-ready adapter)</span>
        <span className="font-mono">M001 · Ramesh General Store · Indore</span>
      </footer>
    </main>
  );
}
