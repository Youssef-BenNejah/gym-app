// Achievement badges are computed client-side from data the app already
// fetches (daily_logs, weight_logs, meals) — no dedicated badges table. This
// keeps unlock rules easy to tune and avoids a migration + RLS surface for
// what is purely a derived/presentational feature.

export type BadgeId =
  | "first_meal"
  | "streak_3"
  | "streak_7"
  | "streak_30"
  | "meal_prep_5"
  | "meal_prep_10"
  | "hydration_5"
  | "protein_5"
  | "calorie_5"
  | "weigh_in_4"
  | "goal_reached";

export type Badge = {
  id: BadgeId;
  label: string;
  description: string;
  earned: boolean;
  progress: { current: number; target: number };
};

export type DailyLogSummary = {
  log_date: string;
  total_calories: number;
  total_protein_g: number;
  water_consumed_ml: number;
};

export type WeightLogSummary = {
  logged_at: string;
};

export type BadgeProfileInputs = {
  daily_calorie_target: number | null;
  daily_protein_target_g: number | null;
  daily_water_target_ml: number | null;
  target_weight_kg: number | null;
  current_weight_kg: number | null;
  goal: "lose_fat" | "maintain" | "gain_muscle" | null;
};

export type BadgeInput = {
  dailyLogs: DailyLogSummary[];
  weightLogs: WeightLogSummary[];
  savedMealsCount: number;
  profile: BadgeProfileInputs;
};

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function currentStreak(dailyLogs: DailyLogSummary[]): number {
  const byDate = new Map(dailyLogs.map((d) => [d.log_date, d]));
  let streak = 0;
  const cursor = new Date();
  // A missed today doesn't break a streak earned through yesterday, so allow
  // today to be absent on the first iteration only.
  for (let i = 0; ; i++) {
    const entry = byDate.get(localDateStr(cursor));
    const hasEntry = !!entry && Number(entry.total_calories) > 0;
    if (hasEntry) {
      streak++;
    } else if (i > 0) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
    if (i > 365) break;
  }
  return streak;
}

function countDaysHitting(dailyLogs: DailyLogSummary[], predicate: (d: DailyLogSummary) => boolean): number {
  return dailyLogs.filter(predicate).length;
}

function clamp(current: number, target: number) {
  return { current: Math.min(current, target), target };
}

export function computeBadges(input: BadgeInput): Badge[] {
  const { dailyLogs, weightLogs, savedMealsCount, profile } = input;

  const loggedDays = countDaysHitting(dailyLogs, (d) => Number(d.total_calories) > 0);
  const streak = currentStreak(dailyLogs);

  const calorieTarget = profile.daily_calorie_target ?? 0;
  const proteinTarget = profile.daily_protein_target_g ?? 0;
  const waterTarget = profile.daily_water_target_ml ?? 0;

  const daysOnCalorieTarget = calorieTarget > 0
    ? countDaysHitting(dailyLogs, (d) => {
        const pct = Number(d.total_calories) / calorieTarget;
        return pct >= 0.9 && pct <= 1.1;
      })
    : 0;

  const daysHitProtein = proteinTarget > 0
    ? countDaysHitting(dailyLogs, (d) => Number(d.total_protein_g) >= proteinTarget * 0.95)
    : 0;

  const daysHitWater = waterTarget > 0
    ? countDaysHitting(dailyLogs, (d) => Number(d.water_consumed_ml) >= waterTarget)
    : 0;

  const weighIns = weightLogs.length;

  let goalReached = false;
  if (profile.target_weight_kg != null && profile.current_weight_kg != null) {
    const current = profile.current_weight_kg;
    const target = profile.target_weight_kg;
    if (profile.goal === "lose_fat") goalReached = current <= target;
    else if (profile.goal === "gain_muscle") goalReached = current >= target;
    else goalReached = Math.abs(current - target) <= 1;
  }

  const badges: Badge[] = [
    {
      id: "first_meal",
      label: "First Meal Logged",
      description: "Log your first meal to start tracking.",
      earned: loggedDays >= 1,
      progress: clamp(loggedDays, 1),
    },
    {
      id: "streak_3",
      label: "3-Day Streak",
      description: "Log meals 3 days in a row.",
      earned: streak >= 3,
      progress: clamp(streak, 3),
    },
    {
      id: "streak_7",
      label: "7-Day Streak",
      description: "Log meals 7 days in a row.",
      earned: streak >= 7,
      progress: clamp(streak, 7),
    },
    {
      id: "streak_30",
      label: "30-Day Streak",
      description: "Log meals 30 days in a row.",
      earned: streak >= 30,
      progress: clamp(streak, 30),
    },
    {
      id: "meal_prep_5",
      label: "Meal Prepper",
      description: "Save 5 meals to your library.",
      earned: savedMealsCount >= 5,
      progress: clamp(savedMealsCount, 5),
    },
    {
      id: "meal_prep_10",
      label: "Meal Prep Pro",
      description: "Save 10 meals to your library.",
      earned: savedMealsCount >= 10,
      progress: clamp(savedMealsCount, 10),
    },
    {
      id: "hydration_5",
      label: "Hydration Hero",
      description: "Hit your water target 5 days.",
      earned: daysHitWater >= 5,
      progress: clamp(daysHitWater, 5),
    },
    {
      id: "protein_5",
      label: "Protein Champion",
      description: "Hit your protein target 5 days.",
      earned: daysHitProtein >= 5,
      progress: clamp(daysHitProtein, 5),
    },
    {
      id: "calorie_5",
      label: "On Track",
      description: "Stay within 10% of your calorie target 5 days.",
      earned: daysOnCalorieTarget >= 5,
      progress: clamp(daysOnCalorieTarget, 5),
    },
    {
      id: "weigh_in_4",
      label: "Consistent Weigh-Ins",
      description: "Log your weight 4 times.",
      earned: weighIns >= 4,
      progress: clamp(weighIns, 4),
    },
    {
      id: "goal_reached",
      label: "Goal Crusher",
      description: "Reach your target weight.",
      earned: goalReached,
      progress: clamp(goalReached ? 1 : 0, 1),
    },
  ];

  return badges;
}
