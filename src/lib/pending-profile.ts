// Holds the profile data collected during the signup wizard in localStorage
// so it survives the "confirm your email" round trip (no session exists yet
// to write it to Supabase) and can be applied by ensureProfile() on next login.

const KEY = "nurifit.pending_profile";

export type PendingProfile = {
  full_name: string;
  email: string;
  age: number;
  gender: "male" | "female";
  height_cm: number;
  current_weight_kg: number;
  target_weight_kg: number;
  body_fat_percent: number | null;
  target_body_fat_percent: number | null;
  activity_level: "sedentary" | "lightly_active" | "moderately_active" | "very_active";
  goal: "lose_fat" | "maintain" | "gain_muscle";
  daily_calorie_target: number;
  daily_protein_target_g: number;
  daily_carbs_target_g: number;
  daily_fat_target_g: number;
  daily_fiber_target_g: number;
  daily_water_target_ml: number;
};

export function savePendingProfile(profile: PendingProfile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // localStorage unavailable (private mode, etc.) — profile creation falls
    // back to defaults in ensureProfile(), so this is safe to ignore.
  }
}

export function loadPendingProfile(email: string): PendingProfile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const profile = JSON.parse(raw) as PendingProfile;
    if (!profile.email || profile.email.toLowerCase() !== email.toLowerCase()) return null;
    return profile;
  } catch {
    return null;
  }
}

export function clearPendingProfile() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
