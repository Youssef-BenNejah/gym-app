import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfile } from "@/lib/ensure-profile";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function handleSession(session: Session | null) {
      if (!mounted) return;
      if (!session) {
        window.location.href = "/auth/login";
        return;
      }
      // Guarantees a `profiles` row exists (e.g. recovers accounts left
      // without one after a failed signup insert or a delayed email
      // confirmation) before the rest of the app assumes it's there.
      await ensureProfile();
      if (!mounted) return;
      setAuthed(true);
      setReady(true);
    }

    supabase.auth.getSession().then(({ data }) => handleSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      handleSession(s);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!ready || !authed) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-20">
      <div className="mx-auto max-w-md">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
