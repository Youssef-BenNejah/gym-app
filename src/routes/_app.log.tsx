import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { Plus, UtensilsCrossed, Trash2, Sunrise, Sun, Moon, Cookie, Search } from "lucide-react";
import { round0, round1, calcFoodNutrition, sumTotals, type Food } from "@/lib/nutrition";
import { FoodPicker } from "./_app.meals.new";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/log")({
  component: LogPage,
  head: () => ({
    meta: [
      { title: "Log Meal · NuriFit" },
      { name: "description", content: "Log what you ate for breakfast, snacks, lunch or dinner." },
    ],
  }),
});

const MEAL_TIMES = [
  { key: "breakfast", label: "Breakfast", Icon: Sunrise },
  { key: "snack", label: "Snack", Icon: Cookie },
  { key: "lunch", label: "Lunch", Icon: Sun },
  { key: "dinner", label: "Dinner", Icon: Moon },
] as const;

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function recalcDailyLog(userId: string, date: string) {
  const { data: dl } = await supabase.from("daily_logs").select("id").eq("user_id", userId).eq("log_date", date).maybeSingle();
  if (!dl) return;
  const { data: rows } = await supabase.from("daily_log_meals").select("calories,protein_g,carbs_g,fat_g,fiber_g").eq("daily_log_id", dl.id);
  const t = (rows ?? []).reduce((a, r) => ({
    total_calories: a.total_calories + Number(r.calories),
    total_protein_g: a.total_protein_g + Number(r.protein_g),
    total_carbs_g: a.total_carbs_g + Number(r.carbs_g),
    total_fat_g: a.total_fat_g + Number(r.fat_g),
    total_fiber_g: a.total_fiber_g + Number(r.fiber_g),
  }), { total_calories: 0, total_protein_g: 0, total_carbs_g: 0, total_fat_g: 0, total_fiber_g: 0 });
  await supabase.from("daily_logs").update({
    total_calories: round1(t.total_calories),
    total_protein_g: round1(t.total_protein_g),
    total_carbs_g: round1(t.total_carbs_g),
    total_fat_g: round1(t.total_fat_g),
    total_fiber_g: round1(t.total_fiber_g),
  }).eq("id", dl.id);
}

function LogPage() {
  const qc = useQueryClient();
  const date = today();
  const [mealTime, setMealTime] = useState<typeof MEAL_TIMES[number]["key"]>("breakfast");
  const [picking, setPicking] = useState<null | "food" | "saved">(null);
  const [q, setQ] = useState("");

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

  const { data: savedMeals } = useQuery({
    queryKey: ["meals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from("meals").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const items = useMemo(() =>
    ((log?.daily_log_meals ?? []) as any[]).filter((m) => m.meal_time === mealTime), [log, mealTime]);

  async function ensureLog(): Promise<{ userId: string; logId: string } | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: existing } = await supabase.from("daily_logs").select("id").eq("user_id", user.id).eq("log_date", date).maybeSingle();
    if (existing) return { userId: user.id, logId: existing.id };
    const { data: created, error } = await supabase.from("daily_logs")
      .insert({ user_id: user.id, log_date: date }).select("id").single();
    if (error || !created) { toast.error(error?.message ?? "Failed"); return null; }
    return { userId: user.id, logId: created.id };
  }

  async function addFood(food: Food, quantity_g: number) {
    const ctx = await ensureLog();
    if (!ctx) return;
    const n = calcFoodNutrition(food, quantity_g);
    const { error } = await supabase.from("daily_log_meals").insert({
      daily_log_id: ctx.logId, meal_time: mealTime,
      meal_name: `${food.name} (${quantity_g}g)`,
      calories: round1(n.calories), protein_g: round1(n.protein_g),
      carbs_g: round1(n.carbs_g), fat_g: round1(n.fat_g), fiber_g: round1(n.fiber_g),
    });
    if (error) return toast.error(error.message);
    await recalcDailyLog(ctx.userId, date);
    await refetch();
    qc.invalidateQueries({ queryKey: ["daily-log", date] });
    toast.success("Added");
  }

  async function addSavedMeal(m: any) {
    const ctx = await ensureLog();
    if (!ctx) return;
    const { error } = await supabase.from("daily_log_meals").insert({
      daily_log_id: ctx.logId, meal_id: m.id, meal_time: mealTime, meal_name: m.name,
      calories: m.total_calories, protein_g: m.total_protein_g,
      carbs_g: m.total_carbs_g, fat_g: m.total_fat_g, fiber_g: m.total_fiber_g,
    });
    if (error) return toast.error(error.message);
    await recalcDailyLog(ctx.userId, date);
    await refetch();
    qc.invalidateQueries({ queryKey: ["daily-log", date] });
    setPicking(null);
    toast.success("Added");
  }

  async function removeItem(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("daily_log_meals").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await recalcDailyLog(user.id, date);
    await refetch();
    qc.invalidateQueries({ queryKey: ["daily-log", date] });
  }

  const totals = sumTotals(items.map((i) => ({
    calories: Number(i.calories), protein_g: Number(i.protein_g),
    carbs_g: Number(i.carbs_g), fat_g: Number(i.fat_g), fiber_g: Number(i.fiber_g),
  })));

  const filteredSaved = (savedMeals ?? []).filter((m) => m.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="px-5 pt-8">
      <h1 className="text-2xl font-bold">Log meal</h1>
      <div className="mt-1 text-xs text-muted-foreground">
        {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {MEAL_TIMES.map(({ key, label, Icon }) => {
          const active = mealTime === key;
          return (
            <button key={key} onClick={() => setMealTime(key)}
              className={cn("rounded-2xl border-2 p-3 flex flex-col items-center gap-1 transition-colors",
                active ? "border-primary bg-primary/5" : "border-border bg-card")}>
              <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}>{label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {[
            ["Cal", round0(totals.calories)],
            ["Prot", round0(totals.protein_g) + "g"],
            ["Carb", round0(totals.carbs_g) + "g"],
            ["Fat", round0(totals.fat_g) + "g"],
            ["Fiber", round0(totals.fiber_g) + "g"],
          ].map(([l, v]) => (
            <div key={l as string}>
              <div className="text-muted-foreground">{l}</div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums">{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button onClick={() => setPicking("food")}
          className="h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-1">
          <Plus className="h-4 w-4" /> Add food
        </button>
        <button onClick={() => setPicking("saved")}
          className="h-12 rounded-xl border border-primary text-primary font-semibold flex items-center justify-center gap-1">
          <UtensilsCrossed className="h-4 w-4" /> Saved meal
        </button>
      </div>

      <div className="mt-5">
        <h2 className="font-semibold capitalize">{mealTime} entries</h2>
        {items.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No entries yet for {mealTime}
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {items.map((it: any) => (
              <li key={it.id} className="rounded-2xl border border-border bg-card p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{it.meal_name}</div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {round0(Number(it.calories))} kcal · P {round1(Number(it.protein_g))}g · C {round1(Number(it.carbs_g))}g · F {round1(Number(it.fat_g))}g
                  </div>
                </div>
                <button onClick={() => removeItem(it.id)}
                  className="h-9 w-9 rounded-xl grid place-items-center text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {picking === "food" && (
        <FoodPicker onClose={() => setPicking(null)} onPick={(f, q) => { setPicking(null); addFood(f, q); }} />
      )}

      {picking === "saved" && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="mx-auto max-w-md w-full flex-1 flex flex-col">
            <div className="px-5 pt-6 pb-3 border-b border-border flex items-center gap-3">
              <button onClick={() => setPicking(null)} className="h-10 px-3 rounded-xl border border-border font-medium text-sm">Close</button>
              <div className="font-semibold">Pick a saved meal</div>
            </div>
            <div className="px-5 pt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search meals..."
                  className="h-12 w-full rounded-xl border border-input pl-10 pr-4 bg-card outline-none focus:border-primary" />
              </div>
            </div>
            <ul className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
              {filteredSaved.length === 0 && (
                <li className="text-center text-sm text-muted-foreground py-10">No saved meals</li>
              )}
              {filteredSaved.map((m) => (
                <li key={m.id}>
                  <button onClick={() => addSavedMeal(m)}
                    className="w-full text-left rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
                      <UtensilsCrossed className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {round0(Number(m.total_calories))} kcal · P {round0(Number(m.total_protein_g))}g
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-primary" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
