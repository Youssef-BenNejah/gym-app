import { motion } from "framer-motion";
import {
  UtensilsCrossed,
  Flame,
  Zap,
  Trophy,
  ChefHat,
  Crown,
  Droplet,
  Dumbbell,
  Target,
  Scale,
  Medal,
  type LucideIcon,
} from "lucide-react";
import type { Badge, BadgeId } from "@/lib/badges";
import { cn } from "@/lib/utils";

const ICONS: Record<BadgeId, LucideIcon> = {
  first_meal: UtensilsCrossed,
  streak_3: Flame,
  streak_7: Zap,
  streak_30: Trophy,
  meal_prep_5: ChefHat,
  meal_prep_10: Crown,
  hydration_5: Droplet,
  protein_5: Dumbbell,
  calorie_5: Target,
  weigh_in_4: Scale,
  goal_reached: Medal,
};

export function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {badges.map((badge, i) => {
        const Icon = ICONS[badge.id];
        const pct =
          badge.progress.target > 0
            ? Math.min(100, (badge.progress.current / badge.progress.target) * 100)
            : 0;
        return (
          <motion.div
            key={badge.id}
            title={badge.description}
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04, ease: "easeOut" }}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "rounded-2xl border p-3 flex flex-col items-center text-center gap-1.5",
              badge.earned ? "border-primary/30 bg-primary/5" : "border-border bg-card",
            )}
          >
            <motion.div
              className={cn(
                "h-11 w-11 rounded-xl grid place-items-center",
                badge.earned ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
              animate={badge.earned ? { scale: [1, 1.12, 1] } : {}}
              transition={{ duration: 0.5, delay: i * 0.04 + 0.2, ease: "easeOut" }}
            >
              <Icon className="h-5 w-5" />
            </motion.div>
            <div className={cn("text-[11px] font-semibold leading-tight", !badge.earned && "text-muted-foreground")}>
              {badge.label}
            </div>
            {!badge.earned && (
              <div className="w-full mt-0.5">
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary/50" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-0.5 text-[9px] text-muted-foreground tabular-nums">
                  {badge.progress.current}/{badge.progress.target}
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
