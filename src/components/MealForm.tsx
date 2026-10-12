import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Save, Loader2, Link2 } from "lucide-react";
import { calcFoodNutrition, sumTotals, round0, round1, type Food } from "@/lib/nutrition";
import { FoodPicker } from "@/components/FoodPicker";

export type MealItem = { food: Food; quantity_g: number };

export type MealFormValues = {
  name: string;
  desc: string;
  sourceUrl: string;
  items: MealItem[];
};

export function MealForm({
  title,
  initialName = "",
  initialDesc = "",
  initialSourceUrl = "",
  initialItems = [],
  saving,
  onSave,
  onBack,
  saveLabel = "Save meal",
}: {
  title: string;
  initialName?: string;
  initialDesc?: string;
  initialSourceUrl?: string;
  initialItems?: MealItem[];
  saving: boolean;
  onSave: (values: MealFormValues) => void;
  onBack: () => void;
  saveLabel?: string;
}) {
  const [name, setName] = useState(initialName);
  const [desc, setDesc] = useState(initialDesc);
  const [sourceUrl, setSourceUrl] = useState(initialSourceUrl);
  const [items, setItems] = useState<MealItem[]>(initialItems);
  const [picking, setPicking] = useState(false);

  const totals = useMemo(() => sumTotals(items.map((i) => calcFoodNutrition(i.food, i.quantity_g))), [items]);

  return (
    <motion.div
      className="px-5 pt-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="h-10 w-10 rounded-xl border border-border grid place-items-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">{title}</h1>
      </div>

      <div className="mt-5 space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Meal name"
          className="h-12 w-full rounded-xl border border-input bg-card px-4 outline-none focus:border-primary" />
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Notes (optional)"
          rows={2} className="w-full rounded-xl border border-input bg-card px-4 py-3 outline-none focus:border-primary resize-none" />
        <div className="relative">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="Recipe link (Instagram, TikTok, Facebook...)"
            type="url" inputMode="url"
            className="h-12 w-full rounded-xl border border-input bg-card pl-10 pr-4 outline-none focus:border-primary" />
        </div>
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
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setPicking(true)}
          className="h-9 rounded-xl bg-primary/10 text-primary font-semibold px-3 text-sm flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add food
        </motion.button>
      </div>

      <ul className="mt-2 space-y-2">
        <AnimatePresence initial={false}>
          {items.map((it, idx) => {
            const n = calcFoodNutrition(it.food, it.quantity_g);
            return (
              <motion.li
                key={`${it.food.id}-${idx}`}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="rounded-2xl border border-border bg-card p-3"
              >
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
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setItems((arr) => arr.filter((_, i) => i !== idx))}
                    className="h-9 w-9 rounded-xl grid place-items-center text-muted-foreground">
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </div>
                <div className="mt-2 text-xs tabular-nums text-muted-foreground">
                  {round0(n.calories)} kcal · P {round1(n.protein_g)}g · C {round1(n.carbs_g)}g · F {round1(n.fat_g)}g
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <motion.button whileTap={{ scale: 0.98 }} onClick={() => onSave({ name, desc, sourceUrl, items })} disabled={saving}
        className="mt-8 h-13 w-full rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ height: 52 }}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saveLabel}
      </motion.button>

      <AnimatePresence>
        {picking && (
          <FoodPicker onClose={() => setPicking(false)} onPick={(food, quantity_g) => {
            setItems((arr) => [...arr, { food, quantity_g }]);
            setPicking(false);
          }} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
