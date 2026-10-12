import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search, Plus } from "lucide-react";
import { calcFoodNutrition, round0, round1, CATEGORIES, type Food } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

export function FoodPicker({ onClose, onPick }: { onClose: () => void; onPick: (food: Food, quantity_g: number) => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [selected, setSelected] = useState<Food | null>(null);
  const [qty, setQty] = useState(100);

  const { data: foods, isLoading } = useQuery({
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
    <motion.div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="mx-auto max-w-md w-full flex-1 flex flex-col">
        <div className="px-5 pt-6 pb-3 flex items-center gap-3 border-b border-border">
          <button onClick={onClose} className="h-10 w-10 rounded-xl border border-border grid place-items-center">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="font-semibold">Add food</div>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {!selected ? (
            <motion.div
              key="browse"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0"
            >
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
              {isLoading ? (
                <div className="px-5 py-2 space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-primary/10 animate-pulse" />
                  ))}
                </div>
              ) : (
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
              )}
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="flex-1 px-5 py-6 overflow-y-auto"
            >
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
              <motion.div
                key={`${qty}`}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="mt-6 rounded-2xl border border-border bg-card p-4"
              >
                <div className="text-xs text-muted-foreground">Will add</div>
                {(() => {
                  const n = calcFoodNutrition(selected, qty);
                  return (
                    <div className="mt-1 text-sm tabular-nums">
                      <span className="font-bold text-lg">{round0(n.calories)}</span> kcal · P {round1(n.protein_g)}g · C {round1(n.carbs_g)}g · F {round1(n.fat_g)}g · Fi {round1(n.fiber_g)}g
                    </div>
                  );
                })()}
              </motion.div>
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => onPick(selected, qty)}
                className="mt-6 h-13 w-full rounded-xl bg-primary text-primary-foreground font-semibold" style={{ height: 52 }}>
                Add to meal
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
