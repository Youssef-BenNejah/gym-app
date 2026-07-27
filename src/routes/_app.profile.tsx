import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { LogOut, Save, User } from "lucide-react";
import { toast } from "sonner";
import { calcTargets } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Profile · NuriFit" },
      { name: "description", content: "Manage your body stats, activity level, goal and daily nutrition targets." },
    ],
  }),
});

function ProfilePage() {
  const nav = useNavigate();
  const { data, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  const [f, setF] = useState<any>(null);
  useEffect(() => { if (data) setF({ ...data }); }, [data]);

  if (!f) return <div className="p-6">Loading...</div>;

  function updateField(k: string, v: any) {
    setF((p: any) => ({ ...p, [k]: v }));
  }

  function recalc() {
    const t = calcTargets({
      age: f.age, gender: f.gender, height_cm: f.height_cm,
      weight_kg: f.current_weight_kg, body_fat_percent: f.body_fat_percent,
      activity: f.activity_level, goal: f.goal,
    });
    setF({ ...f, ...t });
    toast.success("Targets recalculated");
  }

  async function save() {
    const { id, created_at, email, ...update } = f;
    const { error } = await supabase.from("profiles").update(update).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    refetch();
  }

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/auth/login" });
  }

  const inputCls = "h-11 w-full rounded-xl border border-input bg-card px-4 outline-none focus:border-primary tabular-nums";

  return (
    <div className="px-5 pt-8">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 grid place-items-center text-primary">
          <User className="h-6 w-6" />
        </div>
        <div>
          <div className="text-xl font-bold">{f.full_name}</div>
          <div className="text-xs text-muted-foreground">{f.email}</div>
        </div>
      </div>

      <Section title="You">
        <Row label="Full name">
          <input className={inputCls} value={f.full_name ?? ""} onChange={(e) => updateField("full_name", e.target.value)} />
        </Row>
        <Row label="Age">
          <input type="number" className={inputCls} value={f.age ?? ""} onChange={(e) => updateField("age", Number(e.target.value))} />
        </Row>
        <Row label="Gender">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            {["male", "female"].map((g) => (
              <button key={g} onClick={() => updateField("gender", g)}
                className={cn("h-9 rounded-lg text-sm font-medium capitalize", f.gender === g ? "bg-card shadow-sm" : "text-muted-foreground")}>
                {g}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Height (cm)">
          <input type="number" className={inputCls} value={f.height_cm ?? ""} onChange={(e) => updateField("height_cm", Number(e.target.value))} />
        </Row>
        <Row label="Current weight (kg)">
          <input type="number" step={0.1} className={inputCls} value={f.current_weight_kg ?? ""} onChange={(e) => updateField("current_weight_kg", Number(e.target.value))} />
        </Row>
        <Row label="Target weight (kg)">
          <input type="number" step={0.1} className={inputCls} value={f.target_weight_kg ?? ""} onChange={(e) => updateField("target_weight_kg", Number(e.target.value))} />
        </Row>
        <Row label="Body fat % (optional)">
          <input type="number" step={0.1} className={inputCls}
            value={f.body_fat_percent ?? ""}
            onChange={(e) => updateField("body_fat_percent", e.target.value ? Number(e.target.value) : null)} />
        </Row>
      </Section>

      <Section title="Goal & Activity">
        <Row label="Goal">
          <select className={cn(inputCls, "appearance-none")} value={f.goal ?? ""} onChange={(e) => updateField("goal", e.target.value)}>
            <option value="lose_fat">Lose body fat</option>
            <option value="maintain">Maintain</option>
            <option value="gain_muscle">Gain muscle</option>
          </select>
        </Row>
        <Row label="Activity level">
          <select className={cn(inputCls, "appearance-none")} value={f.activity_level ?? ""} onChange={(e) => updateField("activity_level", e.target.value)}>
            <option value="sedentary">Sedentary</option>
            <option value="lightly_active">Lightly active</option>
            <option value="moderately_active">Moderately active</option>
            <option value="very_active">Very active</option>
          </select>
        </Row>
        <button onClick={recalc} className="mt-2 h-11 w-full rounded-xl border border-primary text-primary font-semibold">
          Recalculate targets
        </button>
      </Section>

      <Section title="Daily targets">
        <div className="grid grid-cols-2 gap-3">
          <TInput label="Calories" unit="kcal" value={f.daily_calorie_target} onChange={(v) => updateField("daily_calorie_target", v)} />
          <TInput label="Protein" unit="g" value={f.daily_protein_target_g} onChange={(v) => updateField("daily_protein_target_g", v)} />
          <TInput label="Carbs" unit="g" value={f.daily_carbs_target_g} onChange={(v) => updateField("daily_carbs_target_g", v)} />
          <TInput label="Fat" unit="g" value={f.daily_fat_target_g} onChange={(v) => updateField("daily_fat_target_g", v)} />
          <TInput label="Fiber" unit="g" value={f.daily_fiber_target_g} onChange={(v) => updateField("daily_fiber_target_g", v)} />
          <TInput label="Water" unit="ml" value={f.daily_water_target_ml} onChange={(v) => updateField("daily_water_target_ml", v)} />
        </div>
      </Section>

      <div className="mt-6 space-y-2">
        <button onClick={save} className="h-13 w-full rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2" style={{ height: 52 }}>
          <Save className="h-4 w-4" /> Save changes
        </button>
        <button onClick={signOut} className="h-13 w-full rounded-xl border border-border text-foreground font-medium flex items-center justify-center gap-2" style={{ height: 52 }}>
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      {children}
    </div>
  );
}
function TInput({ label, unit, value, onChange }: { label: string; unit: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <input type="number" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 bg-transparent text-xl font-bold tabular-nums outline-none" />
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
