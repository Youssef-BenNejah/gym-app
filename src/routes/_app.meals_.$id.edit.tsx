import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calcFoodNutrition, sumTotals, round1, type Food } from "@/lib/nutrition";
import { toast } from "sonner";
import { MealForm, type MealFormValues, type MealItem } from "@/components/MealForm";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/meals_/$id/edit")({
  component: EditMeal,
  head: () => ({
    meta: [
      { title: "Edit Meal · NuriFit" },
      { name: "description", content: "Update your saved meal's ingredients, notes and recipe link." },
    ],
  }),
});

function EditMeal() {
  const nav = useNavigate();
  const { id } = useParams({ from: "/_app/meals_/$id/edit" });
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["meal-edit", id],
    queryFn: async () => {
      const { data: meal, error: mealErr } = await supabase.from("meals").select("*").eq("id", id).single();
      if (mealErr || !meal) throw new Error(mealErr?.message ?? "Meal not found");
      const { data: mealItems } = await supabase.from("meal_items").select("*").eq("meal_id", id);
      const foodIds = (mealItems ?? []).map((mi) => mi.food_id).filter((v): v is string => !!v);
      const { data: foods } = foodIds.length
        ? await supabase.from("foods").select("*").in("id", foodIds)
        : { data: [] as Food[] };
      const foodsById = new Map((foods ?? []).map((f) => [f.id, f as Food]));
      const items: MealItem[] = (mealItems ?? []).map((mi) => {
        const food = mi.food_id ? foodsById.get(mi.food_id) : undefined;
        return {
          food: food ?? {
            id: mi.food_id ?? mi.id,
            name: mi.food_name ?? "Unknown food",
            category: "",
            serving_unit: "g",
            serving_size_g: mi.quantity_g || 100,
            calories_per_serving: Number(mi.calories) || 0,
            protein_g: Number(mi.protein_g) || 0,
            carbs_g: Number(mi.carbs_g) || 0,
            fat_g: Number(mi.fat_g) || 0,
            fiber_g: Number(mi.fiber_g) || 0,
          },
          quantity_g: mi.quantity_g,
        };
      });
      return { meal, items };
    },
  });

  async function save({ name, desc, sourceUrl, items }: MealFormValues) {
    if (!name.trim()) return toast.error("Name your meal");
    if (items.length === 0) return toast.error("Add at least one ingredient");
    setSaving(true);
    const totals = sumTotals(items.map((i) => calcFoodNutrition(i.food, i.quantity_g)));
    const { error } = await supabase.from("meals").update({
      name, description: desc || null, source_url: sourceUrl || null,
      total_calories: round1(totals.calories),
      total_protein_g: round1(totals.protein_g),
      total_carbs_g: round1(totals.carbs_g),
      total_fat_g: round1(totals.fat_g),
      total_fiber_g: round1(totals.fiber_g),
    }).eq("id", id);
    if (error) { setSaving(false); return toast.error(error.message); }
    const { error: delErr } = await supabase.from("meal_items").delete().eq("meal_id", id);
    if (delErr) { setSaving(false); return toast.error(delErr.message); }
    const rows = items.map((i) => {
      const n = calcFoodNutrition(i.food, i.quantity_g);
      return {
        meal_id: id, food_id: i.food.id, food_name: i.food.name, quantity_g: i.quantity_g,
        calories: round1(n.calories), protein_g: round1(n.protein_g),
        carbs_g: round1(n.carbs_g), fat_g: round1(n.fat_g), fiber_g: round1(n.fiber_g),
      };
    });
    const { error: iErr } = await supabase.from("meal_items").insert(rows);
    setSaving(false);
    if (iErr) return toast.error(iErr.message);
    toast.success("Meal updated");
    nav({ to: "/meals" });
  }

  if (isLoading || !data) {
    return (
      <div className="px-5 pt-8 space-y-3">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <MealForm
      title="Edit meal"
      initialName={data.meal.name}
      initialDesc={data.meal.description ?? ""}
      initialSourceUrl={data.meal.source_url ?? ""}
      initialItems={data.items}
      saving={saving}
      onSave={save}
      onBack={() => nav({ to: "/meals" })}
      saveLabel="Save changes"
    />
  );
}
