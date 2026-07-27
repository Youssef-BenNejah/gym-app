import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search, Plus, Trash2, Save } from "lucide-react";
import { calcFoodNutrition, sumTotals, round0, round1, CATEGORIES, type Food } from "@/lib/nutrition";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/meals/new")({
  component: NewMeal,
  head: () => ({
    meta: [
      { title: "New Meal · NuriFit" },
      { name: "description", content: "Build a meal from halal foods and save it with automatic macro totals." },
    ],
  }),
});

type Item = { food: Food; quantity_g: number };

function NewMeal() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => sumTotals(items.map((i) => calcFoodNutrition(i.food, i.quantity_g))), [items]);

  async function save() {
    if (!name.trim()) return toast.error("Name your meal");
    if (items.length === 0) return toast.error("Add at least one ingredient");
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: meal, error } = await supabase.from("meals").insert({
      user_id: user.id, name, description: desc || null,
      total_calories: round1(totals.calories),
      total_protein_g: round1(totals.protein_g),
      total_carbs_g: round1(totals.carbs_g),
      total_fat_g: round1(totals.fat_g),
      total_fiber_g: round1(totals.fiber_g),
    }).select().single();
    if (error || !meal) { setSaving(false); return toast.error(error?.message ?? "Failed"); }
    const rows = items.map((i) => {
      const n = calcFoodNutrition(i.food, i.quantity_g);
      return {
        meal_id: meal.id, food_id: i.food.id, food_name: i.food.name, quantity_g: i.quantity_g,
        calories: round1(n.calories), protein_g: round1(n.protein_g),
        carbs_g: round1(n.carbs_g), fat_g: round1(n.fat_g), fiber_g: round1(n.fiber_g),
      };
    });
    const { error: iErr } = await supabase.from("meal_items").insert(rows);
    setSaving(false);
    if (iErr) return toast.error(iErr.message);
    toast.success("Meal saved");
    nav({ to: "/meals" });
  }

  return (
    <div className="px-5 pt-8">
      <div className="flex items-center gap-3">
        <button onClick={() => nav({ to: "/meals" })} className="h-10 w-10 rounded-xl border border-border grid place-items-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">New meal</h1>
      </div>

      <div className="mt-5 space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Meal name"
          className="h-12 w-full rounded-xl border border-input bg-card px-4 outline-none focus:border-primary" />
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Notes (optional)"
          rows={2} className="w-full rounded-xl border border-input bg-card px-4 py-3 outline-none focus:border-primary resize-none" />
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

      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-semibold">Ingredients</h2>
        <button onClick={() => setPicking(true)}
          className="h-9 rounded-xl bg-primary/10 text-primary font-semibold px-3 text-sm flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add food
        </button>
      </div>

      <ul className="mt-2 space-y-2">
        {items.map((it, idx) => {
          const n = calcFoodNutrition(it.food, it.quantity_g);
          return (
            <li key={idx} className="rounded-2xl border border-border bg-card p-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{it.food.name}</div>
                  <div className="text-xs text-muted-foreground">{it.food.category}</div>
                </div>
                <input type="number" min={1} step={1} value={it.quantity_g}
                  onChange={(e) => {
                    const q = Number(e.target.value);
                    setItems((arr) => arr.map((x, i) => i === idx ? { ...x, quantity_g: q } : x));
                  }}
                  className="w-20 h-10 rounded-lg border border-input px-2 text-center tabular-nums outline-none focus:border-primary bg-background" />
                <span className="text-xs text-muted-foreground">g</span>
                <button onClick={() => setItems((arr) => arr.filter((_, i) => i !== idx))}
                  className="h-9 w-9 rounded-xl grid place-items-center text-muted-foreground">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 text-xs tabular-nums text-muted-foreground">
                {round0(n.calories)} kcal · P {round1(n.protein_g)}g · C {round1(n.carbs_g)}g · F {round1(n.fat_g)}g
              </div>
            </li>
          );
        })}
      </ul>

      <button onClick={save} disabled={saving}
        className="mt-8 h-13 w-full rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ height: 52 }}>
        <Save className="h-4 w-4" /> Save meal
      </button>

      {picking && <FoodPicker onClose={() => setPicking(false)} onPick={(food, quantity_g) => {
        setItems((arr) => [...arr, { food, quantity_g }]);
        setPicking(false);
      }} />}
    </div>
  );
}

export function FoodPicker({ onClose, onPick }: { onClose: () => void; onPick: (food: Food, quantity_g: number) => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [selected, setSelected] = useState<Food | null>(null);
  const [qty, setQty] = useState(100);

  const { data: foods } = useQuery({
    queryKey: ["foods"],
    queryFn: async () => {
      const { data } = await supabase.from("foods").select("*").order("name");
      return (data ?? []) as Food[];
    },
  });

  const filtered = (foods ?? []).filter((f) =>
    (cat === "all" || f.category === cat) &&
    f.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="mx-auto max-w-md w-full flex-1 flex flex-col">
        <div className="px-5 pt-6 pb-3 flex items-center gap-3 border-b border-border">
          <button onClick={onClose} className="h-10 w-10 rounded-xl border border-border grid place-items-center">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="font-semibold">Add food</div>
        </div>
        {!selected ? (
          <>
            <div className="px-5 pt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search foods..."
                  className="h-12 w-full rounded-xl border border-input pl-10 pr-4 bg-card outline-none focus:border-primary" />
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
                {["all", ...CATEGORIES].map((c) => (
                  <button key={c} onClick={() => setCat(c)}
                    className={cn("shrink-0 h-9 rounded-full px-3 text-xs font-medium border transition-colors",
                      cat === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border")}>
                    {c === "all" ? "All" : c}
                  </button>
                ))}
              </div>
            </div>
            <ul className="flex-1 overflow-y-auto px-5 py-2 space-y-1">
              {filtered.map((f) => (
                <li key={f.id}>
                  <button onClick={() => setSelected(f)}
                    className="w-full text-left rounded-xl border border-border bg-card p-3 flex items-center gap-3 active:scale-[0.99] transition-transform">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center font-semibold text-sm">
                      {f.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{f.name}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {round0(Number(f.calories_per_serving))} kcal / {f.serving_size_g}g · {f.category}
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-primary" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="flex-1 px-5 py-6">
            <div className="text-xs text-muted-foreground">{selected.category}</div>
            <div className="text-xl font-bold">{selected.name}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              Per {selected.serving_size_g}g: {round0(Number(selected.calories_per_serving))} kcal · P {selected.protein_g}g · C {selected.carbs_g}g · F {selected.fat_g}g
            </div>
            <div className="mt-6">
              <label className="text-sm font-medium">Quantity (g)</label>
              <div className="mt-2 flex items-center gap-2">
                {[50, 100, 150, 200].map((n) => (
                  <button key={n} onClick={() => setQty(n)}
                    className={cn("h-10 flex-1 rounded-xl border text-sm font-medium",
                      qty === n ? "border-primary bg-primary/10 text-primary" : "border-border")}>{n}g</button>
                ))}
              </div>
              <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))}
                className="mt-3 h-12 w-full rounded-xl border border-input bg-card px-4 outline-none focus:border-primary tabular-nums text-center" />
            </div>
            <div className="mt-6 rounded-2xl border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">Will add</div>
              {(() => {
                const n = calcFoodNutrition(selected, qty);
                return (
                  <div className="mt-1 text-sm tabular-nums">
                    <span className="font-bold text-lg">{round0(n.calories)}</span> kcal · P {round1(n.protein_g)}g · C {round1(n.carbs_g)}g · F {round1(n.fat_g)}g · Fi {round1(n.fiber_g)}g
                  </div>
                );
              })()}
            </div>
            <button onClick={() => onPick(selected, qty)}
              className="mt-6 h-13 w-full rounded-xl bg-primary text-primary-foreground font-semibold" style={{ height: 52 }}>
              Add to meal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
