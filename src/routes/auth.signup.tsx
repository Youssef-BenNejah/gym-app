import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Leaf, Eye, EyeOff, Loader2, ArrowLeft, TrendingDown, TrendingUp, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { calcTargets, round0 } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth/signup")({
  component: Signup,
  head: () => ({
    meta: [
      { title: "Get Started · Halal Nutrition Tracker" },
      { name: "description", content: "Create your account and set up your daily nutrition goals in 4 quick steps." },
    ],
  }),
});

type Form = {
  full_name: string;
  email: string;
  password: string;
  confirm: string;
  age: number;
  gender: "male" | "female";
  height_cm: number;
  current_weight_kg: number;
  body_fat_percent: number | null;
  goal: "lose_fat" | "maintain" | "gain_muscle";
  target_weight_kg: number;
  target_body_fat_percent: number | null;
  activity_level: "sedentary" | "lightly_active" | "moderately_active" | "very_active";
  daily_calorie_target: number;
  daily_protein_target_g: number;
  daily_carbs_target_g: number;
  daily_fat_target_g: number;
  daily_fiber_target_g: number;
  daily_water_target_ml: number;
};

function Signup() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [f, setF] = useState<Form>({
    full_name: "", email: "", password: "", confirm: "",
    age: 28, gender: "male", height_cm: 175, current_weight_kg: 78,
    body_fat_percent: null,
    goal: "lose_fat", target_weight_kg: 72, target_body_fat_percent: null,
    activity_level: "moderately_active",
    daily_calorie_target: 0, daily_protein_target_g: 0, daily_carbs_target_g: 0,
    daily_fat_target_g: 0, daily_fiber_target_g: 0, daily_water_target_ml: 0,
  });

  function next() {
    if (step === 1) {
      if (!f.full_name || !f.email || !f.password) return toast.error("Fill all fields");
      if (f.password.length < 6) return toast.error("Password must be 6+ characters");
      if (f.password !== f.confirm) return toast.error("Passwords do not match");
    }
    if (step === 3) {
      const t = calcTargets({
        age: f.age, gender: f.gender, height_cm: f.height_cm,
        weight_kg: f.current_weight_kg, body_fat_percent: f.body_fat_percent,
        activity: f.activity_level, goal: f.goal,
      });
      setF((p) => ({ ...p, ...t }));
    }
    setStep((s) => Math.min(4, s + 1));
  }

  async function submit() {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email: f.email, password: f.password,
      options: { emailRedirectTo: redirectUrl, data: { full_name: f.full_name } },
    });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    if (!data.user) {
      setLoading(false);
      return toast.error("Signup failed");
    }
    const { error: pErr } = await supabase.from("profiles").insert({
      id: data.user.id,
      full_name: f.full_name, email: f.email,
      age: f.age, gender: f.gender, height_cm: f.height_cm,
      current_weight_kg: f.current_weight_kg,
      target_weight_kg: f.target_weight_kg,
      body_fat_percent: f.body_fat_percent,
      target_body_fat_percent: f.target_body_fat_percent,
      activity_level: f.activity_level, goal: f.goal,
      daily_calorie_target: f.daily_calorie_target,
      daily_protein_target_g: f.daily_protein_target_g,
      daily_carbs_target_g: f.daily_carbs_target_g,
      daily_fat_target_g: f.daily_fat_target_g,
      daily_fiber_target_g: f.daily_fiber_target_g,
      daily_water_target_ml: f.daily_water_target_ml,
    });
    setLoading(false);
    if (pErr) return toast.error(pErr.message);
    toast.success("Account created!");
    nav({ to: "/" });
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-md px-6 pt-8 pb-24">
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="h-10 w-10 grid place-items-center rounded-xl border border-border">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 grid place-items-center">
                <Leaf className="h-4 w-4 text-primary" />
              </div>
              <div className="font-semibold">NuriFit</div>
            </div>
          )}
          <div className="text-xs font-medium text-muted-foreground">Step {step} of 4</div>
        </div>

        <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        {step === 1 && <Step1 f={f} setF={setF} show={show} setShow={setShow} />}
        {step === 2 && <Step2 f={f} setF={setF} />}
        {step === 3 && <Step3 f={f} setF={setF} />}
        {step === 4 && <Step4 f={f} setF={setF} />}

        <button
          onClick={step === 4 ? submit : next}
          disabled={loading}
          className="mt-10 h-13 w-full rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ height: 52 }}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {step === 4 ? "Create My Account" : "Continue"}
        </button>

        {step === 1 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth/login" className="text-primary font-semibold">Sign in</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function inputCls() {
  return "h-12 w-full rounded-xl border border-input px-4 outline-none focus:border-primary bg-card";
}

function Step1({ f, setF, show, setShow }: any) {
  return (
    <div className="mt-8 space-y-4">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <Field label="Full name">
        <input className={inputCls()} value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
      </Field>
      <Field label="Email">
        <input type="email" className={inputCls()} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      </Field>
      <Field label="Password">
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            className={cn(inputCls(), "pr-12")}
            value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })}
          />
          <button type="button" onClick={() => setShow((s: boolean) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </Field>
      <Field label="Confirm password">
        <input type={show ? "text" : "password"} className={inputCls()} value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} />
      </Field>
    </div>
  );
}

function Stepper({ value, onChange, step = 1, min, max }: { value: number; onChange: (n: number) => void; step?: number; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onChange(Math.max(min ?? -Infinity, +(value - step).toFixed(1)))}
        className="h-12 w-12 rounded-xl border border-border grid place-items-center">
        <Minus className="h-4 w-4" />
      </button>
      <input type="number" className={cn(inputCls(), "text-center flex-1 tabular-nums")}
        value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <button type="button" onClick={() => onChange(Math.min(max ?? Infinity, +(value + step).toFixed(1)))}
        className="h-12 w-12 rounded-xl border border-border grid place-items-center">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function Step2({ f, setF }: any) {
  return (
    <div className="mt-8 space-y-5">
      <h1 className="text-2xl font-bold">Tell us about your body</h1>
      <Field label="Age">
        <Stepper value={f.age} onChange={(n) => setF({ ...f, age: n })} min={10} max={100} />
      </Field>
      <Field label="Gender">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
          {["male", "female"].map((g) => (
            <button key={g} type="button" onClick={() => setF({ ...f, gender: g })}
              className={cn("h-10 rounded-lg text-sm font-medium capitalize transition-colors",
                f.gender === g ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>
              {g}
            </button>
          ))}
        </div>
      </Field>
      <Field label={`Height: ${f.height_cm} cm`}>
        <input type="range" min={140} max={220} step={1} value={f.height_cm}
          onChange={(e) => setF({ ...f, height_cm: Number(e.target.value) })}
          className="w-full accent-primary" />
      </Field>
      <Field label={`Current weight: ${f.current_weight_kg} kg`}>
        <input type="range" min={40} max={200} step={0.5} value={f.current_weight_kg}
          onChange={(e) => setF({ ...f, current_weight_kg: Number(e.target.value) })}
          className="w-full accent-primary" />
      </Field>
      <Field label="Body fat % (optional)">
        <input type="number" min={5} max={50} step={0.1} placeholder="Optional"
          className={inputCls()}
          value={f.body_fat_percent ?? ""}
          onChange={(e) => setF({ ...f, body_fat_percent: e.target.value ? Number(e.target.value) : null })} />
      </Field>
    </div>
  );
}

function Step3({ f, setF }: any) {
  const goals = [
    { key: "lose_fat", label: "Lose body fat", sub: "Reduce fat mass while preserving muscle", Icon: TrendingDown },
    { key: "maintain", label: "Maintain weight", sub: "Keep current weight, improve composition", Icon: Minus },
    { key: "gain_muscle", label: "Gain muscle", sub: "Build lean mass with a calorie surplus", Icon: TrendingUp },
  ] as const;
  return (
    <div className="mt-8 space-y-5">
      <h1 className="text-2xl font-bold">What is your goal?</h1>
      <div className="space-y-2">
        {goals.map((g) => {
          const active = f.goal === g.key;
          return (
            <button key={g.key} type="button" onClick={() => setF({ ...f, goal: g.key })}
              className={cn("w-full text-left rounded-2xl border-2 p-4 flex items-center gap-3 transition-colors",
                active ? "border-primary bg-primary/5" : "border-border bg-card")}>
              <div className={cn("h-10 w-10 rounded-xl grid place-items-center",
                active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                <g.Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{g.label}</div>
                <div className="text-xs text-muted-foreground">{g.sub}</div>
              </div>
            </button>
          );
        })}
      </div>
      <Field label="Target weight (kg)">
        <Stepper value={f.target_weight_kg} onChange={(n) => setF({ ...f, target_weight_kg: n })} step={0.5} min={30} max={200} />
      </Field>
      <Field label="Activity level">
        <select className={cn(inputCls(), "appearance-none")}
          value={f.activity_level} onChange={(e) => setF({ ...f, activity_level: e.target.value })}>
          <option value="sedentary">Sedentary</option>
          <option value="lightly_active">Lightly active</option>
          <option value="moderately_active">Moderately active</option>
          <option value="very_active">Very active</option>
        </select>
      </Field>
    </div>
  );
}

function TargetCard({ label, value, unit, onChange }: { label: string; value: number; unit: string; onChange: (n: number) => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <input type="number" value={round0(value)} onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 bg-transparent text-2xl font-bold tabular-nums outline-none" />
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function Step4({ f, setF }: any) {
  return (
    <div className="mt-8 space-y-4">
      <h1 className="text-2xl font-bold">Your daily targets</h1>
      <p className="text-sm text-muted-foreground -mt-2">Calculated from your inputs — tap to adjust.</p>
      <div className="grid grid-cols-2 gap-3">
        <TargetCard label="Calories" unit="kcal" value={f.daily_calorie_target} onChange={(n) => setF({ ...f, daily_calorie_target: n })} />
        <TargetCard label="Protein" unit="g" value={f.daily_protein_target_g} onChange={(n) => setF({ ...f, daily_protein_target_g: n })} />
        <TargetCard label="Carbs" unit="g" value={f.daily_carbs_target_g} onChange={(n) => setF({ ...f, daily_carbs_target_g: n })} />
        <TargetCard label="Fat" unit="g" value={f.daily_fat_target_g} onChange={(n) => setF({ ...f, daily_fat_target_g: n })} />
        <TargetCard label="Fiber" unit="g" value={f.daily_fiber_target_g} onChange={(n) => setF({ ...f, daily_fiber_target_g: n })} />
        <TargetCard label="Water" unit="ml" value={f.daily_water_target_ml} onChange={(n) => setF({ ...f, daily_water_target_ml: n })} />
      </div>
    </div>
  );
}
