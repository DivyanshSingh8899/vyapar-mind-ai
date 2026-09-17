import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  Boxes,
  BrainCircuit,
  Mic,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Link } from "react-router";

const FEATURES = [
  {
    icon: Mic,
    title: "Speak, don't navigate",
    body: "\"Aaj kitna business hua?\" — one line in Hindi or Hinglish. The agent picks the right business tool and answers in seconds.",
  },
  {
    icon: BellRing,
    title: "Payment priority",
    body: "The Soundbox's #1 job stays sacred. A live payment interrupts any conversation, announces instantly, then the AI resumes.",
  },
  {
    icon: Users,
    title: "Agentic win-back",
    body: "\"Jo customer 30 din se nahi aaye unko offer bhej do\" — the agent finds them, suggests an offer, and waits for merchant approval.",
  },
  {
    icon: Wallet,
    title: "Voice udhaar khata",
    body: "\"Ramesh ka ₹500 udhaar update kar do\" — sensitive financial actions always require demo-PIN authentication first.",
  },
  {
    icon: Boxes,
    title: "Stock on your tongue",
    body: "\"Milk ka stock kitna hai?\" — live inventory with reorder intelligence, no dashboard needed.",
  },
  {
    icon: TrendingUp,
    title: "Credit intelligence",
    body: "Business activity score generates a simulated credit offer — clearly labelled DEMO, never a real loan approval.",
  },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-6 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="vm-orb grid size-10 place-items-center rounded-2xl text-white shadow-lg">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold tracking-tight text-slate-900">
              Paytm <span className="text-gradient">Vyapar-Mind</span>
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              AI Business Operator
            </p>
          </div>
        </div>
        <Button asChild className="vm-orb rounded-full border-0 px-5 font-bold text-white shadow-lg">
          <Link to="/auth">
            {isAuthenticated ? "Open Console" : "Launch Console"} <ArrowRight className="size-4" />
          </Link>
        </Button>
      </header>

      {/* Hero */}
      <section className="mx-auto mt-10 grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 lg:mt-16 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Badge className="border-indigo-200 bg-white/60 text-indigo-700" variant="secondary">
            <BrainCircuit className="mr-1 size-3.5" /> Paytm AI Hackathon 2026 · Merchant Growth AI
          </Badge>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl">
            The Soundbox that <span className="text-gradient">talks back.</span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
            Turning the Paytm Soundbox from a passive payment speaker into a{" "}
            <span className="font-semibold text-slate-800">two-way AI business operator</span> for India's
            kirana merchants. No dashboards to open. Bas boliye.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="vm-orb rounded-full border-0 px-6 font-bold text-white shadow-xl">
              <Link to="/auth">
                Try the live demo <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-white/70 bg-white/50 font-semibold">
              <Link to="/auth">Sign in as merchant</Link>
            </Button>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-indigo-400" />
            Hackathon prototype · simulated data · no private Paytm APIs
          </p>
        </motion.div>

        {/* Voice-flow glass card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="glass-strong animate-vm-float rounded-3xl p-6"
        >
          <div className="flex items-center gap-3">
            <div className="vm-orb grid size-12 place-items-center rounded-full text-white">
              <Mic className="size-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Merchant</p>
              <p className="text-xs text-muted-foreground">Ramesh General Store · Indore</p>
            </div>
            <Badge className="ml-auto border-emerald-200 bg-emerald-50 text-emerald-700" variant="secondary">
              <span className="size-1.5 rounded-full bg-emerald-500" /> live
            </Badge>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="vm-orb ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-white">
              “Aaj kitna business hua?”
            </div>
            <div className="glass-chip w-fit max-w-[85%] rounded-2xl rounded-bl-md px-4 py-2.5 text-slate-800">
              Aaj aapki sale <b className="tabnum">₹18,450</b> rahi — 42 transactions, kal se{" "}
              <b className="text-emerald-600">12% zyada</b>.
            </div>
            <div className="vm-orb ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-white">
              “Milk ka stock kitna hai?”
            </div>
            <div className="glass-chip w-fit max-w-[85%] rounded-2xl rounded-bl-md px-4 py-2.5 text-slate-800">
              Milk ke sirf <b className="tabnum">24</b> unit bache (reorder 30). Order karne ka time ho gaya!
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-2.5 text-sm font-semibold text-emerald-800">
              🔊 ₹500 received on Paytm <span className="ml-1 text-[10px] font-bold uppercase">· priority interrupt</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Pipeline strip */}
      <section className="mx-auto mt-14 w-full max-w-6xl px-4 sm:px-6">
        <div className="glass flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-2xl px-5 py-4 text-[11px] font-semibold text-slate-600">
          {["Merchant voice", "Speech-to-text", "Intent routing", "AI agent", "Business tools", "PostgreSQL", "TTS", "Soundbox"].map(
            (s, i, arr) => (
              <span key={s} className="flex items-center gap-3">
                <span>{s}</span>
                {i < arr.length - 1 && <span className="text-indigo-400">→</span>}
              </span>
            ),
          )}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto mt-14 w-full max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Ek awaaz, poora business
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-600">
          Voice-first operations for Tier-2/Tier-3 merchants — built on real business tools, not a chatbot.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass glass-hover rounded-3xl p-5">
              <span className="vm-orb grid size-10 place-items-center rounded-xl text-white">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-3 text-sm font-bold text-slate-800">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-6 text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security strip */}
      <section className="mx-auto mt-14 w-full max-w-6xl px-4 sm:px-6">
        <div className="glass-strong grid gap-6 rounded-3xl p-7 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              t: "PIN-gated writes",
              d: "Udhaar updates & campaigns wait for merchant approval — the agent can never write sensitive data directly.",
            },
            {
              icon: BrainCircuit,
              t: "Tools, not hallucination",
              d: "Every answer comes from a real business tool call against the demo database — visible in the Agent Activity log.",
            },
            {
              icon: BellRing,
              t: "Soundbox-first design",
              d: "Payments stay priority #1. The AI layer wraps around the announcement, never blocks it.",
            },
          ].map((s) => (
            <div key={s.t} className="flex gap-3">
              <span className="vm-orb grid size-10 shrink-0 place-items-center rounded-xl text-white">
                <s.icon className="size-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{s.t}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto mt-14 w-full max-w-4xl px-4 pb-16 text-center sm:px-6">
        <div className="glass-strong rounded-3xl p-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Ready when the shop opens
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Step into the merchant console with the seeded demo store — Ramesh General Store, M001.
          </p>
          <Button asChild size="lg" className="vm-orb mt-6 rounded-full border-0 px-8 font-bold text-white shadow-xl">
            <Link to="/auth">
              Launch Vyapar-Mind <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <p className="mt-6 text-[11px] text-muted-foreground">
          Hackathon prototype. Not affiliated with or endorsed by Paytm. Voice uses the browser Web Speech API;
          Sarvam AI adapter ready via SARVAM_AI_API_KEY.
        </p>
      </section>
    </div>
  );
}
