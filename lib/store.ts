"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MIN_BUDGET, computeBudget, todayIso } from "./calc";
import type { FoodItem, Meal, MealType, Profile, WeightEntry } from "./types";

interface State {
  profile: Profile | null;
  meals: Meal[];
  water: Record<string, number>; // verres par jour
  weights: WeightEntry[];
  closedDays: string[];
  setProfile: (p: Profile) => void;
  addMeal: (type: MealType, items: FoodItem[], photo?: string, date?: string) => void;
  removeMeal: (id: string) => void;
  setWater: (date: string, n: number) => void;
  addWeight: (kg: number, date?: string) => void;
  closeDay: (date: string) => void;
  reset: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
export const newId = uid;

export const useStore = create<State>()(
  persist(
    (set) => ({
      profile: null,
      meals: [],
      water: {},
      weights: [],
      closedDays: [],
      setProfile: (profile) =>
        set((s) => {
          // le poids actuel du profil sert de première pesée
          const weights = s.weights.length
            ? s.weights
            : [{ date: todayIso(), kg: profile.poidsActuel }];
          return { profile, weights };
        }),
      addMeal: (type, items, photo, date = todayIso()) =>
        set((s) => ({ meals: [...s.meals, { id: uid(), date, type, items, photo }] })),
      removeMeal: (id) => set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),
      setWater: (date, n) => set((s) => ({ water: { ...s.water, [date]: Math.max(0, n) } })),
      addWeight: (kg, date = todayIso()) =>
        set((s) => ({
          weights: [...s.weights.filter((w) => w.date !== date), { date, kg }].sort((a, b) =>
            a.date.localeCompare(b.date)
          ),
        })),
      closeDay: (date) => set((s) => ({ closedDays: [...new Set([...s.closedDays, date])] })),
      reset: () => set({ profile: null, meals: [], water: {}, weights: [], closedDays: [] }),
    }),
    { name: "mes-calories-v1", version: 1 }
  )
);

/** Poids de référence : dernière pesée, sinon poids du profil. */
export function currentWeight(s: Pick<State, "profile" | "weights">) {
  const last = [...s.weights].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  return last?.kg ?? s.profile?.poidsActuel ?? 60;
}

/** Budget recalculé automatiquement à chaque nouvelle pesée. */
export function useBudget() {
  const profile = useStore((s) => s.profile);
  const weights = useStore((s) => s.weights);
  if (!profile) return null;
  const poids = currentWeight({ profile, weights });
  return { poids, budget: computeBudget(profile, poids), min: MIN_BUDGET };
}
