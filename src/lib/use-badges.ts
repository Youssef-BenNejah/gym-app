import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { computeBadges, type Badge, type BadgeProfileInputs } from "./badges";

// Shared by Home (to detect newly-earned badges for the unlock toast) and
// Profile (to render the achievements grid) — reusing the same react-query
// keys ("weights", "meals") as the Progress/Meals/Log pages so the data is
// shared from cache instead of refetched per screen.
export function useBadges(profile: BadgeProfileInputs | null): Badge[] {
  const { data: recentLogs } = useQuery({
    queryKey: ["daily-logs-recent"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from("daily_logs")
        .select("log_date,total_calories,total_protein_g,water_consumed_ml")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false })
        .limit(60);
      return data ?? [];
    },
  });

  const { data: weightLogs } = useQuery({
    queryKey: ["weights"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from("weight_logs")
        .select("*").eq("user_id", user.id).order("logged_at", { ascending: false }).limit(30);
      return data ?? [];
    },
  });

  const { data: savedMeals } = useQuery({
    queryKey: ["meals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from("meals").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return useMemo(() => {
    if (!profile) return [];
    return computeBadges({
      dailyLogs: (recentLogs ?? []).map((d: any) => ({
        log_date: d.log_date,
        total_calories: Number(d.total_calories),
        total_protein_g: Number(d.total_protein_g),
        water_consumed_ml: Number(d.water_consumed_ml),
      })),
      weightLogs: (weightLogs ?? []).map((w: any) => ({ logged_at: w.logged_at })),
      savedMealsCount: (savedMeals ?? []).length,
      profile,
    });
  }, [profile, recentLogs, weightLogs, savedMeals]);
}
