import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Leaf, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/login")({
  component: Login,
  head: () => ({
    meta: [
      { title: "Sign In · Halal Nutrition Tracker" },
      { name: "description", content: "Sign in to track your halal meals, macros, water, and weight." },
    ],
  }),
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password: pass });
    setLoading(false);
    if (error) {
      setUnconfirmedEmail(/confirm/i.test(error.message) ? trimmedEmail : null);
      toast.error(error.message);
      return;
    }
    setUnconfirmedEmail(null);
    nav({ to: "/" });
  }

  async function resendConfirmation() {
    if (!unconfirmedEmail) return;
    const { error } = await supabase.auth.resend({ type: "signup", email: unconfirmedEmail });
    if (error) toast.error(error.message);
    else toast.success("Confirmation email sent");
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="mx-auto w-full max-w-md flex-1 flex flex-col px-6 pt-16">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 grid place-items-center">
            <Leaf className="h-5 w-5 text-primary" />
          </div>
          <div className="font-semibold text-foreground">NuriFit</div>
        </div>
        <h1 className="mt-10 text-3xl font-bold text-foreground">Welcome back</h1>
        <p className="mt-1 text-muted-foreground text-sm">Sign in to keep tracking your goals.</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email" required autoComplete="email"
              className="mt-1 h-12 w-full rounded-xl border border-input px-4 outline-none focus:border-primary bg-card"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <div className="mt-1 relative">
              <input
                type={show ? "text" : "password"} required
                className="h-12 w-full rounded-xl border border-input px-4 pr-12 outline-none focus:border-primary bg-card"
                value={pass} onChange={(e) => setPass(e.target.value)}
              />
              <button type="button" onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <button
            type="button"
            className="text-sm text-primary font-medium"
            onClick={async () => {
              const trimmedEmail = email.trim();
              if (!trimmedEmail) return toast.error("Enter your email first");
              const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
              });
              if (error) toast.error(error.message);
              else toast.success("Password reset email sent");
            }}
          >
            Forgot password?
          </button>
          {unconfirmedEmail && (
            <button
              type="button"
              className="text-sm text-primary font-medium"
              onClick={resendConfirmation}
            >
              Resend confirmation email
            </button>
          )}
          <button
            disabled={loading}
            className="mt-2 h-13 min-h-13 w-full rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ height: 52 }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/auth/signup" className="text-primary font-semibold">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
