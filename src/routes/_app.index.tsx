import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { CalorieRing } from "@/components/CalorieRing";
import { MacroPill } from "@/components/MacroPill";
import { round0 } from "@/lib/nutrition";
import { useBadges } from "@/lib/use-badges";
import { checkNewlyEarnedBadges } from "@/lib/badge-notifications";
import { Skeleton } from "@/components/ui/skeleton";
import { Droplet, Plus, Minus, ChevronRight, Flame, Award, CalendarDays } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Today · NuriFit" },
      { name: "description", content: "Your daily calorie, macro and water dashboard." },
    ],
  }),
});

function todayStr() {
  const d = new Date();
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function Home() {
  const date = todayStr();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  const { data: log, refetch } = useQuery({
    queryKey: ["daily-log", date],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("daily_logs")
        .select("*, daily_log_meals(*)").eq("user_id", user.id).eq("log_date", date).maybeSingle();
      return data;
    },
  });

  const badges = useBadges(profile ? {
    daily_calorie_target: profile.daily_calorie_target,
    daily_protein_target_g: profile.daily_protein_target_g,
    daily_water_target_ml: profile.daily_water_target_ml,
    target_weight_kg: profile.target_weight_kg,
    current_weight_kg: profile.current_weight_kg,
    goal: profile.goal as any,
  } : null);

  useEffect(() => {
    if (badges.length === 0) return;
    const newlyEarned = checkNewlyEarnedBadges(badges);
    for (const badge of newlyEarned) {
      toast.success(`Achievement unlocked — ${badge.label}`, {
        description: badge.description,
        icon: <Award className="h-4 w-4" />,
        duration: 5000,
      });
    }
  }, [badges]);

  async function addWater(ml: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Your session expired. Please sign in again.");
    const current = log?.water_consumed_ml ?? 0;
    const next = Math.max(0, current + ml);
    const { error } = await supabase.from("daily_logs")
      .upsert({ user_id: user.id, log_date: date, water_consumed_ml: next }, { onConflict: "user_id,log_date" });
    if (error) return toast.error(error.message);
    await refetch();
  }

  if (profileLoading) return <HomeSkeleton />;

  if (!profile) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="font-semibold">Finish setting up your profile</div>
          <p className="mt-1 text-sm text-muted-foreground">Complete onboarding to see your targets.</p>
        </div>
      </div>
    );
  }

  const cals = Number(log?.total_calories ?? 0);
  const p = Number(log?.total_protein_g ?? 0);
  const c = Number(log?.total_carbs_g ?? 0);
  const fat = Number(log?.total_fat_g ?? 0);
  const fiber = Number(log?.total_fiber_g ?? 0);
  const water = Number(log?.water_consumed_ml ?? 0);
  const waterPct = Math.min(100, (water / (profile.daily_water_target_ml || 1)) * 100);

  const mealsByTime: Record<string, any[]> = { breakfast: [], snack: [], lunch: [], dinner: [] };
  (log?.daily_log_meals ?? []).forEach((m: any) => {
    if (mealsByTime[m.meal_time]) mealsByTime[m.meal_time].push(m);
  });

  return (
    <motion.div
      className="px-5 pt-8 pb-4"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
    >
      <motion.header variants={fadeUp} className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <h1 className="text-2xl font-bold">Hi, {profile.full_name?.split(" ")[0] ?? "there"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/history" className="h-11 w-11 rounded-full border border-border grid place-items-center text-muted-foreground">
            <CalendarDays className="h-5 w-5" />
          </Link>
          <div className="h-11 w-11 rounded-full bg-primary/10 grid place-items-center text-primary font-semibold">
            {(profile.full_name?.[0] ?? "N").toUpperCase()}
          </div>
        </div>
      </motion.header>

      <motion.section variants={fadeUp} className="mt-6 rounded-3xl bg-primary/5 border border-primary/10 p-6 flex flex-col items-center">
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary uppercase tracking-wide">
          <Flame className="h-3.5 w-3.5" /> Calories today
        </div>
        <div className="mt-3">
          <CalorieRing consumed={cals} target={profile.daily_calorie_target ?? 0} />
        </div>
      </motion.section>

      <motion.section variants={fadeUp} className="mt-4 grid grid-cols-2 gap-3">
        <MacroPill kind="protein" value={p} target={profile.daily_protein_target_g ?? 0} />
        <MacroPill kind="carbs" value={c} target={profile.daily_carbs_target_g ?? 0} />
        <MacroPill kind="fat" value={fat} target={profile.daily_fat_target_g ?? 0} />
        <MacroPill kind="fiber" value={fiber} target={profile.daily_fiber_target_g ?? 0} />
      </motion.section>

      <motion.section variants={fadeUp} className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl grid place-items-center" style={{ background: "color-mix(in oklab, var(--water) 15%, transparent)" }}>
              <Droplet className="h-4 w-4" style={{ color: "var(--water)" }} />
            </div>
            <div>
              <div className="text-sm font-semibold">Water</div>
              <div className="text-xs text-muted-foreground tabular-nums">
                {round0(water)} / {profile.daily_water_target_ml} ml
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => addWater(-250)} className="h-9 w-9 rounded-xl border border-border grid place-items-center">
              <Minus className="h-4 w-4" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => addWater(250)} className="h-9 rounded-xl bg-primary text-primary-foreground grid place-items-center px-3 text-sm font-semibold">
              <Plus className="h-4 w-4 mr-1 inline" /> 250ml
            </motion.button>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: "var(--water)" }}
            initial={false}
            animate={{ width: `${waterPct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
      </motion.section>

      <motion.section variants={fadeUp} className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Today's meals</h2>
          <Link to="/log" className="text-primary text-sm font-semibold flex items-center gap-0.5">
            Log a meal <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {(["breakfast", "snack", "lunch", "dinner"] as const).map((mt, i) => {
            const items = mealsByTime[mt];
            const total = items.reduce((a, b) => a + Number(b.calories), 0);
            return (
              <motion.div
                key={mt}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="capitalize font-semibold">{mt}</div>
                  <div className="text-sm text-muted-foreground tabular-nums">{round0(total)} kcal</div>
                </div>
                {items.length === 0 ? (
                  <div className="mt-1 text-xs text-muted-foreground">No entries yet</div>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {items.map((it: any) => (
                      <li key={it.id} className="flex justify-between text-sm">
                        <span>{it.meal_name}</span>
                        <span className="tabular-nums text-muted-foreground">{round0(Number(it.calories))} kcal</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.section>
    </motion.div>
  );
}

function HomeSkeleton() {
  return (
    <div className="px-5 pt-8 pb-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-40" />
        </div>
        <Skeleton className="h-11 w-11 rounded-full" />
      </div>
      <div className="mt-6 rounded-3xl bg-primary/5 border border-primary/10 p-6 flex flex-col items-center">
        <Skeleton className="h-48 w-48 rounded-full" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="mt-6 h-20 rounded-2xl" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
