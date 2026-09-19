import { useState } from "react";
import { useAction } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";

export default function GenerateQr() {
  const createQr = useAction(api.razorpay.createQr);
  const [amount, setAmount] = useState("");
  const [qr, setQr] = useState<{ imageUrl: string; amount: number } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onGenerate() {
    setBusy(true);
    try {
      setQr(await createQr({ amount: Number(amount) }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create QR");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <h3 className="font-semibold">Generate payment QR</h3>
      <div className="flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount in ₹"
          className="border rounded px-3 py-2 w-40"
        />
        <button
          onClick={onGenerate}
          disabled={busy || !amount}
          className="rounded bg-primary text-primary-foreground px-4 py-2 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Generate QR"}
        </button>
      </div>
      {qr && (
        <img src={qr.imageUrl} alt={`QR for ₹${qr.amount}`} className="w-56 h-56" />
      )}
    </div>
  );
}