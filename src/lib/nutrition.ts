export type Food = {
  id: string;
  name: string;
  category: string;
  serving_unit: string;
  serving_size_g: number;
  calories_per_serving: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
};

export type MacroTotals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
};

export function calcFoodNutrition(food: Food, quantityG: number): MacroTotals {
  const size = Number(food.serving_size_g) || 100;
  const f = quantityG / size;
  return {
    calories: Number(food.calories_per_serving) * f,
    protein_g: Number(food.protein_g) * f,
    carbs_g: Number(food.carbs_g) * f,
    fat_g: Number(food.fat_g) * f,
    fiber_g: Number(food.fiber_g) * f,
  };
}

export function sumTotals(items: MacroTotals[]): MacroTotals {
  return items.reduce(
    (a, b) => ({
      calories: a.calories + b.calories,
      protein_g: a.protein_g + b.protein_g,
      carbs_g: a.carbs_g + b.carbs_g,
      fat_g: a.fat_g + b.fat_g,
      fiber_g: a.fiber_g + b.fiber_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
  );
}

export function round1(n: number): number {
  return Math.round((Number(n) || 0) * 10) / 10;
}

export function round0(n: number): number {
  return Math.round(Number(n) || 0);
}

export type ActivityLevel = "sedentary" | "lightly_active" | "moderately_active" | "very_active";
export type Goal = "lose_fat" | "maintain" | "gain_muscle";

export function calcTargets(input: {
  age: number;
  gender: "male" | "female";
  height_cm: number;
  weight_kg: number;
  body_fat_percent?: number | null;
  activity: ActivityLevel;
  goal: Goal;
}) {
  const { age, gender, height_cm, weight_kg, body_fat_percent, activity, goal } = input;
  const bmr =
    gender === "male"
      ? 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
      : 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  const mult = { sedentary: 1.2, lightly_active: 1.375, moderately_active: 1.55, very_active: 1.725 }[activity];
  const tdee = bmr * mult;
  const calories = goal === "lose_fat" ? tdee - 500 : goal === "gain_muscle" ? tdee + 300 : tdee;
  const leanMass = body_fat_percent ? weight_kg * (1 - body_fat_percent / 100) : null;
  const protein = leanMass ? 2.2 * leanMass : 1.8 * weight_kg;
  const fat = 0.8 * weight_kg;
  const carbs = Math.max(0, (calories - protein * 4 - fat * 9) / 4);
  const fiber = gender === "male" ? 38 : 30;
  const water = 35 * weight_kg;
  return {
    daily_calorie_target: round0(calories),
    daily_protein_target_g: round0(protein),
    daily_carbs_target_g: round0(carbs),
    daily_fat_target_g: round0(fat),
    daily_fiber_target_g: fiber,
    daily_water_target_ml: round0(water),
  };
}

export const CATEGORIES = [
  "Meat & Poultry",
  "Fish & Seafood",
  "Eggs & Dairy",
  "Grains & Cereals",
  "Legumes & Pulses",
  "Nuts & Seeds",
  "Vegetables",
  "Fruits",
  "Oils & Fats",
  "Natural Sweeteners",
  "Protein Supplements",
  "Herbs & Spices",
];
