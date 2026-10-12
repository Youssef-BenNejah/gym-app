import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calcFoodNutrition, sumTotals, round1 } from "@/lib/nutrition";
import { toast } from "sonner";
import { MealForm, type MealFormValues } from "@/components/MealForm";

export const Route = createFileRoute("/_app/meals_/new")({
  component: NewMeal,
  head: () => ({
    meta: [
      { title: "New Meal · NuriFit" },
      { name: "description", content: "Build a meal from halal foods and save it with automatic macro totals." },
    ],
  }),
});

function NewMeal() {
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);

  async function save({ name, desc, sourceUrl, items }: MealFormValues) {
    if (!name.trim()) return toast.error("Name your meal");
    if (items.length === 0) return toast.error("Add at least one ingredient");
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return toast.error("Your session expired. Please sign in again.");
    }
    const totals = sumTotals(items.map((i) => calcFoodNutrition(i.food, i.quantity_g)));
    const { data: meal, error } = await supabase.from("meals").insert({
      user_id: user.id, name, description: desc || null, source_url: sourceUrl || null,
      total_calories: round1(totals.calories),
      total_protein_g: round1(totals.protein_g),
      total_carbs_g: round1(totals.carbs_g),
      total_fat_g: round1(totals.fat_g),
      total_fiber_g: round1(totals.fiber_g),
    }).select().single();
    if (error || !meal) { setSaving(false); return toast.error(error?.message ?? "Failed"); }
    const rows = items.map((i) => {
      const n = calcFoodNutrition(i.food, i.quantity_g);
      return {
        meal_id: meal.id, food_id: i.food.id, food_name: i.food.name, quantity_g: i.quantity_g,
        calories: round1(n.calories), protein_g: round1(n.protein_g),
        carbs_g: round1(n.carbs_g), fat_g: round1(n.fat_g), fiber_g: round1(n.fiber_g),
      };
    });
    const { error: iErr } = await supabase.from("meal_items").insert(rows);
    setSaving(false);
    if (iErr) return toast.error(iErr.message);
    toast.success("Meal saved");
    nav({ to: "/meals" });
  }

  return (
    <MealForm
      title="New meal"
      saving={saving}
      onSave={save}
      onBack={() => nav({ to: "/meals" })}
      saveLabel="Save meal"
    />
  );
}
