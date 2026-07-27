import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalorieRing } from "@/components/CalorieRing";
import { MacroPill } from "@/components/MacroPill";
import { round0 } from "@/lib/nutrition";
import { Droplet, Plus, Minus, ChevronRight, Flame } from "lucide-react";
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

function Home() {
  const date = todayStr();

  const { data: profile } = useQuery({
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

  async function addWater(ml: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const current = log?.water_consumed_ml ?? 0;
    const next = Math.max(0, current + ml);
    const { error } = await supabase.from("daily_logs")
      .upsert({ user_id: user.id, log_date: date, water_consumed_ml: next }, { onConflict: "user_id,log_date" });
    if (error) return toast.error(error.message);
    await refetch();
  }

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
    <div className="px-5 pt-8">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <h1 className="text-2xl font-bold">Hi, {profile.full_name?.split(" ")[0] ?? "there"}</h1>
        </div>
        <div className="h-11 w-11 rounded-full bg-primary/10 grid place-items-center text-primary font-semibold">
          {(profile.full_name?.[0] ?? "N").toUpperCase()}
        </div>
      </header>

      <section className="mt-6 rounded-3xl bg-primary/5 border border-primary/10 p-6 flex flex-col items-center">
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary uppercase tracking-wide">
          <Flame className="h-3.5 w-3.5" /> Calories today
        </div>
        <div className="mt-3">
          <CalorieRing consumed={cals} target={profile.daily_calorie_target ?? 0} />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <MacroPill kind="protein" value={p} target={profile.daily_protein_target_g ?? 0} />
        <MacroPill kind="carbs" value={c} target={profile.daily_carbs_target_g ?? 0} />
        <MacroPill kind="fat" value={fat} target={profile.daily_fat_target_g ?? 0} />
        <MacroPill kind="fiber" value={fiber} target={profile.daily_fiber_target_g ?? 0} />
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
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
            <button onClick={() => addWater(-250)} className="h-9 w-9 rounded-xl border border-border grid place-items-center">
              <Minus className="h-4 w-4" />
            </button>
            <button onClick={() => addWater(250)} className="h-9 rounded-xl bg-primary text-primary-foreground grid place-items-center px-3 text-sm font-semibold">
              <Plus className="h-4 w-4 mr-1 inline" /> 250ml
            </button>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${waterPct}%`, backgroundColor: "var(--water)" }} />
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Today's meals</h2>
          <Link to="/log" className="text-primary text-sm font-semibold flex items-center gap-0.5">
            Log a meal <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {(["breakfast", "snack", "lunch", "dinner"] as const).map((mt) => {
            const items = mealsByTime[mt];
            const total = items.reduce((a, b) => a + Number(b.calories), 0);
            return (
              <div key={mt} className="rounded-2xl border border-border bg-card p-4">
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
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
