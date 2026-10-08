export type MealType = "petit-dej" | "dejeuner" | "diner" | "collation";
export type Confidence = "faible" | "moyen" | "élevé";

export interface Profile {
  prenom: string;
  age: number;
  tailleCm: number;
  poidsActuel: number;
  poidsCible: number;
  joursDanse: number[]; // 0 = dimanche … 6 = samedi (convention JS)
}

export interface FoodItem {
  id: string;
  nom: string;
  quantite: number;
  unite: "g" | "ml" | "unité";
  kcal: number;
  proteines: number;
  glucides: number;
  lipides: number;
  confiance?: Confidence;
}

export interface Meal {
  id: string;
  date: string; // AAAA-MM-JJ
  type: MealType;
  items: FoodItem[];
  photo?: string; // miniature JPEG en data-URL
}

export interface WeightEntry {
  date: string;
  kg: number;
}

export const MEAL_LABELS: Record<MealType, string> = {
  "petit-dej": "Petit-déjeuner",
  dejeuner: "Déjeuner",
  diner: "Dîner",
  collation: "Collations",
};
export const MEAL_EMOJI: Record<MealType, string> = {
  "petit-dej": "🥐",
  dejeuner: "🥗",
  diner: "🍝",
  collation: "🍓",
};
export const MEAL_ORDER: MealType[] = ["petit-dej", "dejeuner", "diner", "collation"];
