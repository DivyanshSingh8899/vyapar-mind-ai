import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clapperboard, Play } from "lucide-react";

export const DEMO_SCENARIOS: { id: string; label: string; utterance: string }[] = [
  { id: "d1", label: "Sales summary", utterance: "Aaj kitna business hua?" },
  { id: "d2", label: "Inactive customers", utterance: "Kaunse customer 30 din se nahi aaye?" },
  { id: "d3", label: "Win-back offer", utterance: "Unko ₹50 ka offer bhej do." },
  { id: "d4", label: "Stock check", utterance: "Milk ka stock kitna hai?" },
  { id: "d5", label: "Udhaar + PIN", utterance: "Ramesh ka ₹500 udhaar update kar do." },
  { id: "d6", label: "Loan offer", utterance: "Mere liye koi loan offer hai?" },
  { id: "d7", label: "Simulate payment", utterance: "__PAYMENT__" },
];

export function DemoModeBar({
  onRun,
  activeId,
}: {
  onRun: (utterance: string, id: string) => void;
  activeId: string | null;
}) {
  return (
    <div className="glass flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3">
      <Badge className="gap-1 border-indigo-200 bg-indigo-50/80 text-indigo-700" variant="secondary">
        <Clapperboard className="size-3" /> Hackathon Demo Mode
      </Badge>
      <span className="hidden text-[11px] text-muted-foreground sm:inline">
        One-tap scripted scenarios — judges can replay the full story:
      </span>
      <div className="ml-auto flex flex-wrap gap-1.5">
        {DEMO_SCENARIOS.map((s, i) => (
          <Button
            key={s.id}
            size="sm"
            variant="outline"
            className={cn(
              "h-7 gap-1 rounded-full border-white/70 bg-white/55 px-3 text-[11px] font-semibold text-slate-600 hover:bg-white/85",
              activeId === s.id && "border-indigo-300 bg-indigo-50 text-indigo-700",
            )}
            onClick={() => onRun(s.utterance, s.id)}
          >
            <Play className="size-3" /> Demo {i + 1}: {s.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
