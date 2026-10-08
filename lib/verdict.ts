import { budgetForDay, dayTotals, proteinGoal, addDays } from "./calc";
import type { Meal, Profile } from "./types";

export type VerdictLevel = "peu" | "parfait" | "au-dessus" | "gourmand";

export interface VerdictFacts {
  niveau: VerdictLevel;
  titre: string;
  emoji: string;
  rapport: number;
  kcal: number;
  budget: number;
  proteines: number;
  objectifProteines: number;
  proteinesOk: boolean;
  troisJoursLegers: boolean;
}

const TITRES: Record<VerdictLevel, { titre: string; emoji: string }> = {
  peu: { titre: "Tu n'as pas assez mangé", emoji: "🌸" },
  parfait: { titre: "Parfait pour ta perte de poids", emoji: "✨" },
  "au-dessus": { titre: "Un peu au-dessus, rien de grave", emoji: "🍓" },
  gourmand: { titre: "Journée plus gourmande, on repart demain", emoji: "🧁" },
};

export function levelFromRatio(r: number): VerdictLevel {
  if (r < 0.8) return "peu";
  if (r <= 1.05) return "parfait";
  if (r <= 1.2) return "au-dessus";
  return "gourmand";
}

/** Vrai si les 3 derniers jours (dont aujourd'hui) sont tous sous 1 200 kcal, avec des repas notés. */
export function threeLightDays(meals: Meal[], dateIso: string) {
  return [0, 1, 2].every((i) => {
    const d = addDays(dateIso, -i);
    if (!meals.some((m) => m.date === d)) return false;
    return dayTotals(meals, d).kcal < 1200;
  });
}

/** Verdict calculé par des règles (le texte chaleureux est ensuite formulé par Claude). */
export function computeVerdict(p: Profile, poids: number, meals: Meal[], dateIso: string): VerdictFacts {
  const budget = budgetForDay(p, poids, dateIso);
  const t = dayTotals(meals, dateIso);
  const rapport = budget > 0 ? t.kcal / budget : 0;
  const niveau = levelFromRatio(rapport);
  const obj = proteinGoal(poids);
  return {
    niveau,
    ...TITRES[niveau],
    rapport: Math.round(rapport * 100) / 100,
    kcal: Math.round(t.kcal),
    budget,
    proteines: Math.round(t.proteines),
    objectifProteines: obj,
    proteinesOk: t.proteines >= obj,
    troisJoursLegers: threeLightDays(meals, dateIso),
  };
}

/** Texte de secours écrit en dur si l'API ne répond pas. */
export function fallbackVerdict(f: VerdictFacts): { message: string; conseil: string } {
  const prot = f.proteinesOk
    ? ""
    : ` Côté protéines, tu es à ${f.proteines} g sur ${f.objectifProteines} g : un peu plus t'aidera à rester en forme.`;
  const conseils: Record<VerdictLevel, string> = {
    peu: "Demain, prévois un petit-déjeuner complet avec des protéines (œuf, yaourt grec, fromage blanc) pour bien démarrer.",
    parfait: "Demain, continue sur la même lancée et pense à ajouter des protéines au petit-déj.",
    "au-dessus": "Demain, privilégie des légumes et une source de protéines à chaque repas, sans te priver.",
    gourmand: "Demain, repars simplement : un bon petit-déj protéiné, de l'eau et des légumes au déjeuner.",
  };
  const messages: Record<VerdictLevel, string> = {
    peu: `Tu as mangé ${f.kcal} kcal pour un budget de ${f.budget} kcal. Manger trop peu freine aussi la perte de poids et l'énergie : ton corps a besoin de carburant, accorde-toi un peu plus de douceur.`,
    parfait: `Bravo, ${f.kcal} kcal pour un budget de ${f.budget} kcal : ta journée est en harmonie avec ton objectif.`,
    "au-dessus": `Tu es à ${f.kcal} kcal pour ${f.budget} kcal : un petit dépassement, rien de grave. C'est la moyenne de la semaine qui compte.`,
    gourmand: `Une journée plus gourmande (${f.kcal} kcal pour ${f.budget} kcal), ça arrive à tout le monde. Une journée ne change rien : c'est la moyenne de la semaine qui compte.`,
  };
  let message = messages[f.niveau] + prot;
  if (f.troisJoursLegers)
    message += " Ces derniers jours ont été légers : manger davantage t'aidera à avancer et à garder la forme.";
  return { message, conseil: conseils[f.niveau] };
}
