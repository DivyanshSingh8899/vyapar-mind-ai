import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { inr, inrCompact } from "@/lib/format";
import type { DashboardData } from "@/convex/vyapar";
import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CreditCard,
  IndianRupee,
  ReceiptText,
  TrendingUp,
  Users,
} from "lucide-react";

type Dash = NonNullable<DashboardData>;

export function TodayPanel({ data }: { data: Dash }) {
  const t = data.today;
  const up = t.deltaPct >= 0;
  const max = Math.max(...t.spark.map((s) => s.value), 1);
  return (
    <Card className="glass glass-hover rounded-3xl border-white/60">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <span className="vm-orb grid size-7 place-items-center rounded-lg text-white">
            <IndianRupee className="size-4" />
          </span>
          Aaj ka Business · Today
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3">
          <p className="tabnum text-3xl font-extrabold tracking-tight text-slate-900">{inr(t.totalSales)}</p>
          <span
            className={cn(
              "mb-1 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold",
              up ? "bg-emerald-100/80 text-emerald-700" : "bg-rose-100/80 text-rose-700",
            )}
          >
            {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(t.deltaPct)}% vs kal
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="glass-inset rounded-xl py-2">
            <p className="tabnum text-base font-bold text-slate-800">{t.txnCount}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Transactions</p>
          </div>
          <div className="glass-inset rounded-xl py-2">
            <p className="tabnum text-base font-bold text-slate-800">{inr(t.avgValue)}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Avg bill</p>
          </div>
          <div className="glass-inset rounded-xl py-2">
            <p className="tabnum text-base font-bold text-slate-800">{inrCompact(t.weekTotal)}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">7-day total</p>
          </div>
        </div>
        {/* 7-day sparkline */}
        <div className="mt-4 flex h-16 items-end gap-1.5">
          {t.spark.map((s, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  "w-full rounded-md transition-all",
                  i === t.spark.length - 1 ? "vm-orb" : "bg-indigo-200/80",
                )}
                style={{ height: `${Math.max(8, (s.value / max) * 56)}px` }}
                title={`${s.label}: ${inr(s.value)}`}
              />
              <span className="text-[9px] font-medium text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Top method: <span className="font-semibold text-slate-700">{t.topMethod ?? "—"}</span>
          {t.topCategory && (
            <>
              {" · "}Top category: <span className="font-semibold text-slate-700">{t.topCategory}</span>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

export function CustomersPanel({ data }: { data: Dash }) {
  const c = data.customers;
  return (
    <Card className="glass glass-hover rounded-3xl border-white/60">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <span className="vm-orb grid size-7 place-items-center rounded-lg text-white">
            <Users className="size-4" />
          </span>
          Customer Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="glass-inset rounded-xl py-2">
            <p className="tabnum text-lg font-bold text-emerald-600">{c.active}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Active (7d)</p>
          </div>
          <div className="glass-inset rounded-xl py-2">
            <p className="tabnum text-lg font-bold text-indigo-600">{c.returning}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Repeat</p>
          </div>
          <div className="glass-inset rounded-xl py-2">
            <p className="tabnum text-lg font-bold text-amber-600">{c.inactive}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">30d+ away</p>
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          {c.top.slice(0, 4).map((cu, i) => (
            <div key={cu.name} className="flex items-center gap-2 text-xs">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{cu.name}</span>
              <span className="tabnum font-semibold text-slate-800">{inr(cu.totalSpent)}</span>
              <span className="text-[10px] text-muted-foreground">{cu.visits} visits</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function InventoryPanel({ data }: { data: Dash }) {
  const inv = data.inventory;
  return (
    <Card className="glass glass-hover rounded-3xl border-white/60">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <span className="vm-orb grid size-7 place-items-center rounded-lg text-white">
            <Boxes className="size-4" />
          </span>
          Inventory · Reorder
          {inv.lowStockCount > 0 && (
            <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              {inv.lowStockCount} low
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {inv.lowStock.length === 0 && (
            <p className="text-xs text-muted-foreground">Sab products ka stock theek hai ✓</p>
          )}
          {inv.lowStock.map((p) => {
            const ratio = Math.min(1, p.qty / Math.max(1, p.reorder));
            const critical = p.qty <= p.reorder / 2;
            return (
              <div key={p.name} className="text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">{p.name}</span>
                  <span className={cn("tabnum font-semibold", critical ? "text-rose-600" : "text-amber-600")}>
                    {p.qty}/{p.reorder}
                  </span>
                </div>
                <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-slate-200/70">
                  <div
                    className={cn("h-full rounded-full", critical ? "bg-rose-400" : "bg-amber-400")}
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function UdhaarCreditRow({ data }: { data: Dash }) {
  const u = data.udhaar;
  const cr = data.credit;
  return (
    <>
      <Card className="glass glass-hover rounded-3xl border-white/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <span className="vm-orb grid size-7 place-items-center rounded-lg text-white">
              <ReceiptText className="size-4" />
            </span>
            Udhaar / Khata
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="tabnum text-2xl font-extrabold text-slate-900">{inr(u.total)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {u.customerCount} customers par outstanding
          </p>
          <p className="mt-3 rounded-xl bg-indigo-50/80 p-2.5 text-[11px] leading-4 text-indigo-800">
            Bol ke manage karo: “Ramesh ka ₹500 udhaar update kar do” — PIN ke baad ledger update hota hai.
          </p>
        </CardContent>
      </Card>

      <Card className="glass glass-hover rounded-3xl border-white/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <span className="vm-orb grid size-7 place-items-center rounded-lg text-white">
              <CreditCard className="size-4" />
            </span>
            Credit Intelligence
            <span className="ml-auto rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase text-teal-700">
              Simulated
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="relative grid size-14 place-items-center">
              <svg viewBox="0 0 36 36" className="absolute size-14 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(cr.activityScore / 100) * 97.4} 97.4`}
                />
              </svg>
              <span className="tabnum text-xs font-extrabold text-slate-800">{cr.activityScore}</span>
            </div>
            <div className="min-w-0">
              <p className="tabnum text-lg font-extrabold text-slate-900">
                {cr.offerAmount > 0 ? inr(cr.offerAmount) : "No offer"}
              </p>
              <p className="text-[11px] leading-4 text-muted-foreground">
                Activity score {cr.activityScore}/100 · {cr.dailyAvg.toFixed(0)}/day avg
              </p>
            </div>
          </div>
          <p className="mt-3 rounded-xl bg-teal-50/80 p-2.5 text-[11px] leading-4 text-teal-800">
            <TrendingUp className="mr-1 inline size-3" />
            {cr.reason}. DEMO / SIMULATED OFFER — not a real Paytm loan approval.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
