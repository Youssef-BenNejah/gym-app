import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, UtensilsCrossed, Trash2 } from "lucide-react";
import { useState } from "react";
import { round0 } from "@/lib/nutrition";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/meals")({
  component: MealsPage,
  head: () => ({
    meta: [
      { title: "My Meals · NuriFit" },
      { name: "description", content: "Your saved meals and recipes with full macro breakdowns." },
    ],
  }),
});

function MealsPage() {
  const [q, setQ] = useState("");
  const { data: meals, refetch } = useQuery({
    queryKey: ["meals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from("meals").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = (meals ?? []).filter((m) => m.name.toLowerCase().includes(q.toLowerCase()));

  async function del(id: string) {
    if (!confirm("Delete this meal?")) return;
    const { error } = await supabase.from("meals").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refetch();
  }

  return (
    <div className="px-5 pt-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Meals</h1>
        <Link to="/meals/new" className="h-10 rounded-xl bg-primary text-primary-foreground font-semibold px-3 flex items-center gap-1 text-sm">
          <Plus className="h-4 w-4" /> New
        </Link>
      </header>
      <div className="mt-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search meals..."
          className="h-12 w-full rounded-xl border border-input pl-10 pr-4 bg-card outline-none focus:border-primary" />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 grid place-items-center">
            <UtensilsCrossed className="h-7 w-7 text-primary" />
          </div>
          <div className="mt-4 font-semibold">No meals yet</div>
          <p className="mt-1 text-sm text-muted-foreground">Create your first recipe to log it quickly later.</p>
          <Link to="/meals/new" className="mt-5 inline-flex h-11 rounded-xl bg-primary text-primary-foreground font-semibold items-center px-5">
            Create meal
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {filtered.map((m) => (
            <li key={m.id} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{m.name}</div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {round0(Number(m.total_calories))} kcal · P {round0(Number(m.total_protein_g))}g · C {round0(Number(m.total_carbs_g))}g · F {round0(Number(m.total_fat_g))}g
                </div>
              </div>
              <button onClick={() => del(m.id)} className="h-9 w-9 rounded-xl grid place-items-center text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
