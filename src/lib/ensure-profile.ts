import { supabase } from "@/integrations/supabase/client";
import { loadPendingProfile, clearPendingProfile, type PendingProfile } from "./pending-profile";

const DEFAULT_PROFILE: Omit<PendingProfile, "full_name" | "email"> = {
  age: 28,
  gender: "male",
  height_cm: 175,
  current_weight_kg: 75,
  target_weight_kg: 75,
  body_fat_percent: null,
  target_body_fat_percent: null,
  activity_level: "moderately_active",
  goal: "maintain",
  daily_calorie_target: 2000,
  daily_protein_target_g: 140,
  daily_carbs_target_g: 200,
  daily_fat_target_g: 65,
  daily_fiber_target_g: 34,
  daily_water_target_ml: 2500,
};

// Guarantees the signed-in user has a `profiles` row, creating one if it's
// missing. A row can be missing when: signup's own insert failed after the
// auth user was created (orphaned account), the account required email
// confirmation so no session existed yet to run the insert, or any other
// path that authenticates a user without going through the signup wizard.
// Safe to call repeatedly — it no-ops once a profile row exists.
export async function ensureProfile(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (selectError) return false;
  if (existing) return true;

  const pending = user.email ? loadPendingProfile(user.email) : null;
  const profile: PendingProfile =
    pending ?? {
      ...DEFAULT_PROFILE,
      full_name: (user.user_metadata as Record<string, unknown> | null)?.full_name as string
        ?? user.email?.split("@")[0]
        ?? "there",
      email: user.email ?? "",
    };

  const { error: insertError } = await supabase.from("profiles").insert({
    id: user.id,
    ...profile,
    email: user.email ?? profile.email,
  });
  if (insertError) return false;

  clearPendingProfile();
  return true;
}
