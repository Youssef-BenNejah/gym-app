import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Plus, Weight, ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { round1 } from "@/lib/nutrition";

export const Route = createFileRoute("/_app/progress")({
  component: ProgressPage,
  head: () => ({
    meta: [
      { title: "Progress · NuriFit" },
      { name: "description", content: "Track your weight history and progress toward your goal." },
    ],
  }),
});

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ProgressPage() {
  const [w, setW] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  const { data: logs, refetch } = useQuery({
    queryKey: ["weights"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from("weight_logs")
        .select("*").eq("user_id", user.id).order("logged_at", { ascending: false }).limit(30);
      return data ?? [];
    },
  });

  async function log() {
    const val = Number(w);
    if (!val || val <= 0) return toast.error("Enter a valid weight");
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("weight_logs")
      .upsert({ user_id: user.id, logged_at: today(), weight_kg: val }, { onConflict: "user_id,logged_at" });
    if (!error) await supabase.from("profiles").update({ current_weight_kg: val }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    setW("");
    toast.success("Logged");
    refetch();
  }

  const latest = logs?.[0];
  const start = logs?.[logs.length - 1];
  const change = latest && start ? Number(latest.weight_kg) - Number(start.weight_kg) : 0;

  const chartData = (logs ?? []).slice().reverse();
  const min = Math.min(...chartData.map((d) => Number(d.weight_kg)), Number(profile?.target_weight_kg ?? Infinity));
  const max = Math.max(...chartData.map((d) => Number(d.weight_kg)), Number(profile?.target_weight_kg ?? -Infinity));
  const pad = 0.5;

  return (
    <div className="px-5 pt-8">
      <h1 className="text-2xl font-bold">Progress</h1>

      <section className="mt-5 rounded-3xl bg-primary/5 border border-primary/10 p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-primary">Current weight</div>
        <div className="mt-1 flex items-baseline gap-2">
          <div className="text-4xl font-bold tabular-nums">{round1(Number(profile?.current_weight_kg ?? 0))}</div>
          <div className="text-muted-foreground">kg</div>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs">
          <div className="text-muted-foreground">
            Goal: <span className="font-semibold text-foreground tabular-nums">{round1(Number(profile?.target_weight_kg ?? 0))} kg</span>
          </div>
          {logs && logs.length > 1 && (
            <div className={change < 0 ? "text-primary" : change > 0 ? "text-destructive" : "text-muted-foreground"}>
              {change < 0 ? <ArrowDown className="inline h-3 w-3" /> : change > 0 ? <ArrowUp className="inline h-3 w-3" /> : null}
              {" "}{round1(Math.abs(change))} kg
            </div>
          )}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Weight className="h-4 w-4 text-primary" /> Log today
        </div>
        <div className="mt-3 flex gap-2">
          <input type="number" step={0.1} placeholder="kg" value={w} onChange={(e) => setW(e.target.value)}
            className="h-12 flex-1 rounded-xl border border-input bg-background px-4 outline-none focus:border-primary tabular-nums" />
          <button onClick={log} disabled={saving}
            className="h-12 px-5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-1 disabled:opacity-60">
            <Plus className="h-4 w-4" /> Save
          </button>
        </div>
      </section>

      {chartData.length >= 2 && (
        <section className="mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="text-sm font-semibold">History ({chartData.length})</div>
          <svg viewBox="0 0 300 120" className="mt-3 w-full h-32">
            {(() => {
              const lo = min - pad, hi = max + pad;
              const range = hi - lo || 1;
              const x = (i: number) => (chartData.length === 1 ? 150 : (i / (chartData.length - 1)) * 280 + 10);
              const y = (v: number) => 110 - ((v - lo) / range) * 100;
              const target = Number(profile?.target_weight_kg ?? 0);
              const path = chartData.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(Number(d.weight_kg))}`).join(" ");
              return (
                <>
                  {target > 0 && (
                    <line x1={10} x2={290} y1={y(target)} y2={y(target)} stroke="var(--color-primary)" strokeDasharray="3 3" strokeOpacity={0.4} />
                  )}
                  <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                  {chartData.map((d, i) => (
                    <circle key={d.id} cx={x(i)} cy={y(Number(d.weight_kg))} r={3} fill="var(--color-primary)" />
                  ))}
                </>
              );
            })()}
          </svg>
        </section>
      )}

      <section className="mt-4">
        <div className="text-sm font-semibold">Entries</div>
        <ul className="mt-2 space-y-1.5">
          {(logs ?? []).map((l) => (
            <li key={l.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
              <div className="text-sm">{new Date(l.logged_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
              <div className="font-semibold tabular-nums">{round1(Number(l.weight_kg))} kg</div>
            </li>
          ))}
          {(!logs || logs.length === 0) && (
            <li className="text-sm text-muted-foreground text-center py-6">No weight entries yet</li>
          )}
        </ul>
      </section>
    </div>
  );
}
