import { z } from "zod";

export const analyzedItemSchema = z.object({
  nom: z.string().min(1),
  quantite: z.number().nonnegative(),
  unite: z.enum(["g", "ml", "unité"]),
  kcal: z.number().nonnegative(),
  proteines: z.number().nonnegative(),
  glucides: z.number().nonnegative(),
  lipides: z.number().nonnegative(),
  confiance: z.enum(["faible", "moyen", "élevé"]),
});
export const analyzeResultSchema = z.object({ aliments: z.array(analyzedItemSchema).min(1).max(30) });
export type AnalyzeResult = z.infer<typeof analyzeResultSchema>;

export const verdictResultSchema = z.object({
  message: z.string().min(1).max(900),
  conseil: z.string().min(1).max(400),
});
