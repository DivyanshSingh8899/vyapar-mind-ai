import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEMO_UTTERANCES, type Lang } from "@/convex/langs";
import { cn } from "@/lib/utils";
import { Clapperboard, Play } from "lucide-react";

export function DemoModeBar({
  onRun,
  activeId,
  lang,
}: {
  onRun: (utterance: string, id: string) => void;
  activeId: string | null;
  lang: Lang;
}) {
  const scenarios = DEMO_UTTERANCES[lang];
  return (
    <div className="glass flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3">
      <Badge className="gap-1 border-indigo-200 bg-indigo-50/80 text-indigo-700" variant="secondary">
        <Clapperboard className="size-3" /> Hackathon Demo Mode
      </Badge>
      <span className="hidden text-[11px] text-muted-foreground sm:inline">
        One-tap scripted scenarios — judges can replay the full story:
      </span>
      <div className="ml-auto flex flex-wrap gap-1.5">
        {scenarios.map((s, i) => (
          <Button
            key={`${lang}-${s.label}`}
            size="sm"
            variant="outline"
            className={cn(
              "h-7 gap-1 rounded-full border-white/70 bg-white/55 px-3 text-[11px] font-semibold text-slate-600 hover:bg-white/85",
              activeId === `${lang}-${i}` && "border-indigo-300 bg-indigo-50 text-indigo-700",
            )}
            onClick={() => onRun(s.utterance, `${lang}-${i}`)}
          >
            <Play className="size-3" /> Demo {i + 1}: {s.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
