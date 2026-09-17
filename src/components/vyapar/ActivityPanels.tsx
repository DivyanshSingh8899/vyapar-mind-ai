import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { inr, shortTime, timeStr } from "@/lib/format";
import type { DashboardData } from "@/convex/vyapar";
import { Activity, BellRing, CheckCircle2, XCircle } from "lucide-react";

type Dash = NonNullable<DashboardData>;

const INTENT_TINTS: Record<string, string> = {
  SALES_QUERY: "bg-indigo-100 text-indigo-700",
  CUSTOMER_INSIGHT: "bg-teal-100 text-teal-700",
  CUSTOMER_WINBACK: "bg-violet-100 text-violet-700",
  INVENTORY_QUERY: "bg-amber-100 text-amber-700",
  UDHAAR_QUERY: "bg-sky-100 text-sky-700",
  UDHAAR_UPDATE: "bg-rose-100 text-rose-700",
  LOAN_RECOMMENDATION: "bg-emerald-100 text-emerald-700",
  PAYMENT_EVENT: "bg-emerald-100 text-emerald-700",
  SENSITIVE_ACTION_APPROVED: "bg-emerald-100 text-emerald-700",
  SENSITIVE_ACTION_REJECTED: "bg-rose-100 text-rose-700",
  UNKNOWN: "bg-slate-200 text-slate-600",
};

export function AgentActivityPanel({ data }: { data: Dash }) {
  return (
    <Card className="glass rounded-3xl border-white/60">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <span className="vm-orb grid size-7 place-items-center rounded-lg text-white">
            <Activity className="size-4" />
          </span>
          Agent Activity
          <span className="ml-auto font-mono text-[10px] font-medium text-muted-foreground">
            proof-of-tools · live
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.agentLogs.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No agent turns yet — ask something via the Soundbox above.
          </p>
        ) : (
          <div className="space-y-2">
            {data.agentLogs.slice(0, 8).map((l) => (
              <div key={l.id} className="glass-inset rounded-xl p-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-mono text-[10px] text-slate-400">{timeStr(l.at)}</span>
                  <Badge className={cn("h-5 border-0 px-1.5 text-[9px] font-bold", INTENT_TINTS[l.intent] ?? INTENT_TINTS.UNKNOWN)} variant="secondary">
                    {l.intent}
                  </Badge>
                  <span className="font-mono text-[10px] font-semibold text-slate-600">{l.tool}</span>
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold">
                    {l.success ? (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="size-3" /> SUCCESS
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-500">
                        <XCircle className="size-3" /> FAIL
                      </span>
                    )}
                    <span className="tabnum ml-1 text-slate-400">{l.latencyMs}ms</span>
                  </span>
                </div>
                <p className="mt-1 truncate text-xs font-medium text-slate-700">“{l.input}”</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-muted-foreground">{l.response}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PaymentsPanel({ data }: { data: Dash }) {
  return (
    <Card className="glass rounded-3xl border-white/60">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <span className="vm-orb grid size-7 place-items-center rounded-lg text-white">
            <BellRing className="size-4" />
          </span>
          Payment Events
          <span className="ml-auto text-[10px] font-medium text-muted-foreground">last 24h · soundbox feed</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.payments.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No payments yet — press SIMULATE PAYMENT to fire a live announcement.
          </p>
        ) : (
          <div className="space-y-1.5">
            {data.payments.slice(0, 6).map((p) => (
              <div key={p.id} className="glass-inset flex items-center gap-2.5 rounded-xl px-3 py-2">
                <span className="grid size-7 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-700">{p.ref}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {p.method} · {shortTime(p.at)}
                  </p>
                </div>
                <span className="tabnum text-sm font-extrabold text-emerald-600">+{inr(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
