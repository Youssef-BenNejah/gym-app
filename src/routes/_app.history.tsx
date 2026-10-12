import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isToday,
  isFuture,
  isSameMonth,
  getDay,
} from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { round0, round1 } from "@/lib/nutrition";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  Sunrise,
  Sun,
  Moon,
  Cookie,
  Droplet,
  CalendarX,
} from "lucide-react";

export const Route = createFileRoute("/_app/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "History · NuriFit" },
      { name: "description", content: "See which days you logged, how many calories you ate, and revisit past meals." },
    ],
  }),
});

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MEAL_TIME_META = {
  breakfast: { label: "Breakfast", Icon: Sunrise },
  snack: { label: "Snack", Icon: Cookie },
  lunch: { label: "Lunch", Icon: Sun },
  dinner: { label: "Dinner", Icon: Moon },
} as const;

function dateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function HistoryPage() {
  const nav = useNavigate();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthStartStr = dateKey(startOfMonth(month));
  const monthEndStr = dateKey(endOfMonth(month));

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ["history", monthStartStr],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from("daily_logs")
        .select("*, daily_log_meals(*)")
        .eq("user_id", user.id)
        .gte("log_date", monthStartStr)
        .lte("log_date", monthEndStr);
      return data ?? [];
    },
  });

  const logsByDate = useMemo(() => {
    const map = new Map<string, any>();
    (logs ?? []).forEach((l: any) => map.set(l.log_date, l));
    return map;
  }, [logs]);

  const cells = useMemo(() => {
    const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
    const leading = Array(getDay(startOfMonth(month))).fill(null);
    return [...leading, ...days];
  }, [month]);

  const calorieTarget = Number(profile?.daily_calorie_target ?? 0);
  const atNextMonthLimit = isSameMonth(month, new Date());
  const selectedEntry = selectedDate ? logsByDate.get(selectedDate) ?? null : null;

  return (
    <div className="px-5 pt-8 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={() => nav({ to: "/" })} className="h-10 w-10 rounded-xl border border-border grid place-items-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">History</h1>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button onClick={() => setMonth((d) => subMonths(d, 1))}
          className="h-9 w-9 rounded-xl border border-border grid place-items-center">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="font-semibold tabular-nums">{format(month, "MMMM yyyy")}</div>
        <button
          onClick={() => setMonth((d) => addMonths(d, 1))}
          disabled={atNextMonthLimit}
          className="h-9 w-9 rounded-xl border border-border grid place-items-center disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAY_LABELS.map((w, i) => (
          <div key={i} className="text-[10px] font-medium text-muted-foreground">{w}</div>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-1.5 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : (
        <motion.div
          className="mt-1.5 grid grid-cols-7 gap-1.5"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.01 } } }}
        >
          {cells.map((day, i) => {
            if (!day) return <div key={`blank-${i}`} />;
            const key = dateKey(day);
            const entry = logsByDate.get(key);
            const cals = entry ? Number(entry.total_calories) : 0;
            const done = cals > 0;
            const future = isFuture(day) && !isToday(day);
            const over = done && calorieTarget > 0 && cals > calorieTarget * 1.1;

            return (
              <motion.button
                key={key}
                variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
                whileTap={!future ? { scale: 0.9 } : {}}
                disabled={future}
                onClick={() => setSelectedDate(key)}
                className={cn(
                  "aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 border transition-colors",
                  future
                    ? "opacity-30 border-transparent cursor-default"
                    : done
                      ? over
                        ? "bg-destructive/10 border-destructive/20"
                        : "bg-primary/10 border-primary/20"
                      : "border-border bg-card",
                  isToday(day) && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                )}
              >
                <span className={cn("text-xs font-semibold tabular-nums", done ? "text-foreground" : "text-muted-foreground")}>
                  {format(day, "d")}
                </span>
                {done && (
                  <span className="text-[8px] tabular-nums leading-none text-muted-foreground">
                    {round0(cals)}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      )}

      <div className="mt-5 flex items-center gap-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary/40 border border-primary/30" /> Logged
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/40 border border-destructive/30" /> Over target
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-primary" /> Today
        </div>
      </div>

      <AnimatePresence>
        {selectedDate && (
          <DayDetailSheet
            dateStr={selectedDate}
            entry={selectedEntry}
            waterTarget={Number(profile?.daily_water_target_ml ?? 0)}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DayDetailSheet({
  dateStr,
  entry,
  waterTarget,
  onClose,
}: {
  dateStr: string;
  entry: any | null;
  waterTarget: number;
  onClose: () => void;
}) {
  const parsed = new Date(`${dateStr}T00:00:00`);
  const hasEntries = !!entry && Number(entry.total_calories) > 0;

  const mealsByTime: Record<string, any[]> = { breakfast: [], snack: [], lunch: [], dinner: [] };
  (entry?.daily_log_meals ?? []).forEach((m: any) => {
    if (mealsByTime[m.meal_time]) mealsByTime[m.meal_time].push(m);
  });

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="mx-auto max-w-md w-full flex-1 flex flex-col overflow-hidden">
        <div className="px-5 pt-6 pb-3 border-b border-border flex items-center justify-between">
          <div>
            <div className="font-semibold">{format(parsed, "EEEE, MMMM d")}</div>
            <div className="text-xs text-muted-foreground">{format(parsed, "yyyy")}</div>
          </div>
          <button onClick={onClose} className="h-10 w-10 rounded-xl border border-border grid place-items-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {!hasEntries ? (
            <div className="mt-10 text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-muted grid place-items-center">
                <CalendarX className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="mt-4 font-semibold">No entries logged</div>
              <p className="mt-1 text-sm text-muted-foreground">Nothing was tracked on this day.</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  {[
                    ["Cal", round0(Number(entry.total_calories))],
                    ["Prot", round0(Number(entry.total_protein_g)) + "g"],
                    ["Carb", round0(Number(entry.total_carbs_g)) + "g"],
                    ["Fat", round0(Number(entry.total_fat_g)) + "g"],
                    ["Fiber", round0(Number(entry.total_fiber_g)) + "g"],
                  ].map(([l, v]) => (
                    <div key={l as string}>
                      <div className="text-muted-foreground">{l}</div>
                      <div className="mt-0.5 text-sm font-semibold tabular-nums">{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {Number(entry.water_consumed_ml) > 0 && (
                <div className="mt-3 rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl grid place-items-center" style={{ background: "color-mix(in oklab, var(--water) 15%, transparent)" }}>
                    <Droplet className="h-4 w-4" style={{ color: "var(--water)" }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Water</div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {round0(Number(entry.water_consumed_ml))}{waterTarget > 0 ? ` / ${waterTarget}` : ""} ml
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-2">
                {(["breakfast", "snack", "lunch", "dinner"] as const).map((mt) => {
                  const items = mealsByTime[mt];
                  if (items.length === 0) return null;
                  const { label, Icon } = MEAL_TIME_META[mt];
                  const total = items.reduce((a, b) => a + Number(b.calories), 0);
                  return (
                    <div key={mt} className="rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-semibold">
                          <Icon className="h-4 w-4 text-primary" /> {label}
                        </div>
                        <div className="text-sm text-muted-foreground tabular-nums">{round0(total)} kcal</div>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {items.map((it: any) => (
                          <li key={it.id} className="flex justify-between text-sm">
                            <span className="truncate pr-2">{it.meal_name}</span>
                            <span className="tabular-nums text-muted-foreground shrink-0">
                              {round0(Number(it.calories))} kcal · P {round1(Number(it.protein_g))}g
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
