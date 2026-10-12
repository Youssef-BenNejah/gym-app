import { motion } from "framer-motion";
import { round0 } from "@/lib/nutrition";
import { useCountUp } from "@/lib/use-count-up";
import { cn } from "@/lib/utils";

type Kind = "protein" | "carbs" | "fat" | "fiber";
const labels: Record<Kind, string> = { protein: "Protein", carbs: "Carbs", fat: "Fat", fiber: "Fiber" };
const colorVar: Record<Kind, string> = {
  protein: "var(--color-macro-protein)",
  carbs: "var(--color-macro-carbs)",
  fat: "var(--color-macro-fat)",
  fiber: "var(--color-macro-fiber)",
};

export function MacroPill({ kind, value, target, className }: { kind: Kind; value: number; target: number; className?: string }) {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0);
  const animatedValue = useCountUp(value);
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-3", className)}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{labels[kind]}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
        {round0(animatedValue)}<span className="text-muted-foreground font-normal">/{round0(target)}g</span>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: colorVar[kind] }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
