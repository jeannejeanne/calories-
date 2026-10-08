import type { FoodItem, Meal, Profile, WeightEntry } from "./types";

export const MIN_BUDGET = 1400; // garde-fou santé : jamais en dessous
export const MAX_DEFICIT = 500; // ≈ 0,5 kg / semaine
export const MAX_LOSS_PER_WEEK = 0.5;
const ACTIVITY = 1.375;
const DANCE_MET = 5;
const DANCE_HOURS = 1;

/** Métabolisme de base — Mifflin-St Jeor (femme) */
export function bmr(poids: number, taille: number, age: number) {
  return 10 * poids + 6.25 * taille - 5 * age - 161;
}

export interface Budget {
  bmr: number;
  depenseTotale: number;
  base: number; // budget d'un jour normal
  deficit: number;
  plafonne: boolean; // déficit limité à 500 kcal
  plancher: boolean; // limité par le minimum de 1 400 kcal
  bonusDanse: number;
}

/** Budget calorique de base + bonus d'une séance de danse. */
export function computeBudget(p: Profile, poids: number): Budget {
  const b = bmr(poids, p.tailleCm, p.age);
  const depense = b * ACTIVITY;
  let base = depense * 0.85; // déficit modéré de 15 %
  let plafonne = false;
  if (depense - base > MAX_DEFICIT) {
    base = depense - MAX_DEFICIT;
    plafonne = true;
  }
  let plancher = false;
  if (base < MIN_BUDGET) {
    base = MIN_BUDGET;
    plancher = true;
  }
  // 50 % de la dépense de la séance (≈ 5 MET × poids × durée)
  const bonusDanse = 0.5 * DANCE_MET * poids * DANCE_HOURS;
  return {
    bmr: Math.round(b),
    depenseTotale: Math.round(depense),
    base: Math.round(base),
    deficit: Math.round(depense - base),
    plafonne,
    plancher,
    bonusDanse: Math.round(bonusDanse),
  };
}

export function isDanceDay(p: Profile, dateIso: string) {
  return p.joursDanse.includes(parseDate(dateIso).getDay());
}

export function budgetForDay(p: Profile, poids: number, dateIso: string) {
  const b = computeBudget(p, poids);
  return b.base + (isDanceDay(p, dateIso) ? b.bonusDanse : 0);
}

export const proteinGoal = (poids: number) => Math.round(1.2 * poids);
export const FIBER_GOAL = 25;

/** Répartition indicative des macros : lipides 30 %, protéines selon poids, glucides = le reste. */
export function macroTargets(budget: number, poids: number) {
  const proteines = proteinGoal(poids);
  const lipides = Math.round((budget * 0.3) / 9);
  const glucides = Math.max(0, Math.round((budget - proteines * 4 - lipides * 9) / 4));
  return { proteines, glucides, lipides };
}

/** Durée réaliste pour perdre `kg` au rythme maximum de 0,5 kg / semaine. */
export function realisticDuration(kg: number) {
  const semaines = Math.max(0, Math.ceil(kg / MAX_LOSS_PER_WEEK));
  return { semaines, mois: Math.round((semaines / 4.33) * 10) / 10 };
}

export function sumItems(items: FoodItem[]) {
  return items.reduce(
    (a, i) => ({
      kcal: a.kcal + i.kcal,
      proteines: a.proteines + i.proteines,
      glucides: a.glucides + i.glucides,
      lipides: a.lipides + i.lipides,
    }),
    { kcal: 0, proteines: 0, glucides: 0, lipides: 0 }
  );
}

export function dayTotals(meals: Meal[], dateIso: string) {
  return sumItems(meals.filter((m) => m.date === dateIso).flatMap((m) => m.items));
}

/** Recalcule les valeurs d'un aliment quand la quantité change (proportionnel). */
export function rescale(item: FoodItem, newQty: number): FoodItem {
  if (item.quantite <= 0 || newQty < 0) return { ...item, quantite: Math.max(0, newQty) };
  const r = newQty / item.quantite;
  const r1 = (n: number) => Math.round(n * r * 10) / 10;
  return {
    ...item,
    quantite: newQty,
    kcal: Math.round(item.kcal * r),
    proteines: r1(item.proteines),
    glucides: r1(item.glucides),
    lipides: r1(item.lipides),
  };
}

/** Rythme réel (kg/semaine perdus) par régression linéaire sur les pesées. */
export function weeklyRate(weights: WeightEntry[]) {
  if (weights.length < 2) return null;
  const pts = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const t0 = parseDate(pts[0].date).getTime();
  const xs = pts.map((w) => (parseDate(w.date).getTime() - t0) / 86400000);
  if (xs[xs.length - 1] < 6) return null; // pas assez de recul
  const n = pts.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = pts.reduce((a, w) => a + w.kg, 0) / n;
  let num = 0, den = 0;
  pts.forEach((w, i) => {
    num += (xs[i] - mx) * (w.kg - my);
    den += (xs[i] - mx) ** 2;
  });
  if (den === 0) return null;
  return -(num / den) * 7; // positif = perte
}

/** Date d'arrivée estimée au rythme réel (null si pas de perte constatée). */
export function estimateArrival(weights: WeightEntry[], cible: number, today: string) {
  const rate = weeklyRate(weights);
  if (rate === null || rate <= 0.02) return null;
  const last = [...weights].sort((a, b) => a.date.localeCompare(b.date)).at(-1)!;
  const reste = last.kg - cible;
  if (reste <= 0) return { date: today, rate };
  const jours = Math.ceil((reste / rate) * 7);
  const d = parseDate(today);
  d.setDate(d.getDate() + jours);
  return { date: toIso(d), rate };
}

// ---------- Dates ----------
export function toIso(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${j}`;
}
export function parseDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}
export const todayIso = () => toIso(new Date());
export function addDays(iso: string, n: number) {
  const d = parseDate(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
}
/** Lundi de la semaine contenant `iso`. */
export function weekStart(iso: string) {
  const d = parseDate(iso);
  const off = (d.getDay() + 6) % 7;
  return addDays(iso, -off);
}
