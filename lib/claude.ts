import Anthropic from "@anthropic-ai/sdk";

export class ApiError extends Error {
  constructor(public code: "no_key" | "invalid" | "network", message: string, public status = 502) {
    super(message);
  }
}

/** La clé n'est lue que côté serveur (jamais envoyée au navigateur). */
export function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new ApiError("no_key", "Clé API absente", 503);
  return new Anthropic({ apiKey: key, maxRetries: 1, timeout: 45_000 });
}
export const MODEL = () => process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

/** Extrait le premier objet JSON d'une réponse texte (tolère les ```json). */
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new ApiError("invalid", "Réponse sans JSON");
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new ApiError("invalid", "JSON invalide");
  }
}

export function errorResponse(e: unknown) {
  if (e instanceof ApiError) return Response.json({ code: e.code, message: e.message }, { status: e.status });
  console.error("Erreur API Claude :", e instanceof Error ? e.message : e);
  return Response.json({ code: "network", message: "Service indisponible" }, { status: 502 });
}

export function textOf(res: Anthropic.Message) {
  return res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}
