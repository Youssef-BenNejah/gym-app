import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Leaf, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPassword,
  head: () => ({
    meta: [
      { title: "Reset Password · NuriFit" },
      { name: "description", content: "Set a new password for your NuriFit account." },
    ],
  }),
});

function ResetPassword() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    // The recovery link from resetPasswordForEmail() lands here with a token
    // in the URL; supabase-js exchanges it for a session automatically and
    // fires PASSWORD_RECOVERY. A plain existing session also counts (lets a
    // signed-in user change their password from here too).
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
      setChecked(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) setReady(true);
      setChecked(true);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pass.length < 6) return toast.error("Password must be 6+ characters");
    if (pass !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pass });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    nav({ to: "/" });
  }

  if (!checked) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background px-6 text-center">
        <div>
          <div className="text-lg font-semibold text-foreground">Invalid or expired link</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Request a new password reset link from the sign-in page.
          </p>
        </div>
      </div>
    );
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
        <h1 className="mt-10 text-3xl font-bold text-foreground">Set a new password</h1>
        <p className="mt-1 text-muted-foreground text-sm">Choose a new password for your account.</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium">New password</label>
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
          <div>
            <label className="text-sm font-medium">Confirm new password</label>
            <input
              type={show ? "text" : "password"} required
              className="mt-1 h-12 w-full rounded-xl border border-input px-4 outline-none focus:border-primary bg-card"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <button
            disabled={loading}
            className="mt-2 h-13 min-h-13 w-full rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ height: 52 }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}
