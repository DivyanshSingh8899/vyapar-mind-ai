import { useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";

export default function GenerateQr() {
  const createQr = useAction(api.razorpay.createQr);
  const reconcile = useAction(api.razorpay.reconcilePending);
  const latest = useQuery(api.razorpay.latestQr);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const pending = latest?.status === "pending";

  // Safety net while a QR is pending: ask Razorpay every 5s.
  useEffect(() => {
    if (!pending) return;
    const t = setInterval(() => { reconcile({}).catch(() => {}); }, 5000);
    return () => clearInterval(t);
  }, [pending, reconcile]);

  async function onGenerate() {
    setBusy(true);
    try {
      await createQr({ amount: Number(amount) });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create QR");
    } finally {
      setBusy(false);
    }
  }

  const fresh = latest && Date.now() - latest.createdAt < 15 * 60 * 1000;
  const show = latest && latest.qrId !== dismissed && (latest.status === "paid" || fresh);

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <h3 className="font-semibold">Generate payment QR</h3>
      <div className="flex gap-2">
        <input
          type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount in ₹" className="border rounded px-3 py-2 w-40"
        />
        <button
          onClick={onGenerate} disabled={busy || !amount}
          className="rounded bg-primary text-primary-foreground px-4 py-2 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Generate QR"}
        </button>
      </div>

      {show && latest.status === "paid" && (
        <div className="space-y-2">
          <p className="text-green-600 font-semibold">✅ ₹{latest.amount} received</p>
          <button className="underline text-sm" onClick={() => setDismissed(latest.qrId)}>Dismiss</button>
        </div>
      )}
      {show && latest.status === "pending" && (
        <div className="space-y-1">
          <img src={latest.imageUrl} alt={`QR for ₹${latest.amount}`} className="w-56 h-56" />
          <p className="text-sm text-muted-foreground">₹{latest.amount} · waiting for payment…</p>
        </div>
      )}
    </div>
  );
}