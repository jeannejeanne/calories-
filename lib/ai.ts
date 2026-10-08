import { z } from "zod";
import { analyzeResultSchema, verdictResultSchema, type AnalyzeResult } from "./schemas";

/**
 * Appels directs à l'API Anthropic depuis le navigateur (site statique, comme sur GitHub Pages).
 * La clé est saisie dans Réglages et reste uniquement sur l'appareil.
 */
export class AiError extends Error {
  constructor(public code: "no_key" | "auth" | "invalid" | "network", message: string) {
    super(message);
  }
}

export const MODELS = [
  { id: "claude-sonnet-5-5", label: "Sonnet 5.5 (recommandé)" },
  { id: "claude-haiku-5-5", label: "Haiku 5.5 (plus rapide, moins cher)" },
  { id: "claude-opus-5-5", label: "Opus 5.5 (plus précis)" },
];
export const DEFAULT_MODEL = MODELS[0].id;

type Block =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } };

async function ask(apiKey: string, model: string, system: string, content: Block[], maxTokens: number) {
  if (!apiKey) throw new AiError("no_key", "Clé API absente");
  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        // obligatoire pour appeler l'API depuis un navigateur
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content }] }),
    });
  } catch {
    throw new AiError("network", "Pas de connexion");
  }
  if (res.status === 401 || res.status === 403) throw new AiError("auth", "Clé refusée");
  if (!res.ok) throw new AiError("network", `Service indisponible (${res.status})`);
  const data = await res.json().catch(() => null);
  const text: string = (data?.content ?? []).map((b: { type: string; text?: string }) => (b.type === "text" ? b.text : "")).join("");
  return text;
}

/** Extrait le premier objet JSON d'une réponse (tolère les ```json). */
function extractJson(text: string): unknown {
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a < 0 || b <= a) throw new AiError("invalid", "Réponse sans JSON");
  try { return JSON.parse(text.slice(a, b + 1)); } catch { throw new AiError("invalid", "JSON invalide"); }
}

function parse<T extends z.ZodTypeAny>(schema: T, text: string): z.infer<T> {
  const r = schema.safeParse(extractJson(text));
  if (!r.success) throw new AiError("invalid", "Réponse inattendue");
  return r.data;
}

const ANALYZE_SYSTEM = `Tu es une assistante nutritionniste. On te donne la description d'un repas (texte et/ou photo).
Estime les aliments, leurs quantités réalistes et leurs valeurs nutritionnelles.
Réponds UNIQUEMENT par un objet JSON, sans texte autour, de la forme :
{"aliments":[{"nom":"string en français","quantite":nombre,"unite":"g"|"ml"|"unité","kcal":nombre,"proteines":nombre,"glucides":nombre,"lipides":nombre,"confiance":"faible"|"moyen"|"élevé"}]}
Les valeurs nutritionnelles sont pour la quantité indiquée (pas pour 100 g). Les macros sont en grammes.
Utilise "unité" pour les aliments comptés (œuf, tranche, fruit). Confiance plus faible pour les photos ambiguës.`;

export async function analyzeMeal(opts: { apiKey: string; model: string; texte?: string; image?: string }): Promise<AnalyzeResult> {
  const content: Block[] = [];
  const m = opts.image?.match(/^data:image\/jpeg;base64,(.+)$/);
  if (m) content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: m[1] } });
  content.push({ type: "text", text: opts.texte?.trim() ? `Repas : ${opts.texte.trim()}` : "Analyse ce repas d'après la photo." });
  return parse(analyzeResultSchema, await ask(opts.apiKey, opts.model, ANALYZE_SYSTEM, content, 2000));
}

const VERDICT_SYSTEM = `Tu es une coach bienveillante et chaleureuse qui s'adresse à une femme en tutoyant.
Rédige le verdict de sa journée alimentaire à partir des faits fournis (le niveau est déjà décidé, ne le change pas).
Règles de ton STRICTES : jamais de culpabilisation ; interdits : les mots « mauvais », « raté », « interdit », « échec », « triche », « craquage » ;
ne parle pas de comparaison de corps ni de séries de jours. Si le niveau est « peu » ou si troisJoursLegers est vrai,
dis doucement que manger trop peu freine aussi la perte de poids et la forme, et encourage à manger davantage.
Si le niveau est « gourmand » ou « au-dessus », rappelle que c'est la moyenne de la semaine qui compte.
Si proteinesOk est faux, ajoute une courte remarque sur les protéines.
Réponds UNIQUEMENT par du JSON : {"message":"2 à 3 phrases","conseil":"un conseil concret pour demain, une phrase"}`;

export async function writeVerdict(opts: { apiKey: string; model: string; facts: Record<string, unknown> }) {
  const text = await ask(opts.apiKey, opts.model, VERDICT_SYSTEM, [{ type: "text", text: JSON.stringify(opts.facts) }], 600);
  return parse(verdictResultSchema, text);
}

/** Petit test de la clé (utilisé dans Réglages). */
export async function testKey(apiKey: string, model: string) {
  await ask(apiKey, model, "Réponds simplement : ok", [{ type: "text", text: "ok ?" }], 10);
}
