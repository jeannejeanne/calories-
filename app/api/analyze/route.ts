import { analyzeResultSchema } from "@/lib/schemas";
import { ApiError, MODEL, errorResponse, extractJson, getClient, textOf } from "@/lib/claude";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  texte: z.string().max(2000).optional(),
  image: z.string().max(6_000_000).optional(), // data-URL JPEG déjà redimensionnée côté client
});

const SYSTEM = `Tu es une assistante nutritionniste. On te donne la description d'un repas (texte et/ou photo).
Estime les aliments, leurs quantités réalistes et leurs valeurs nutritionnelles.
Réponds UNIQUEMENT par un objet JSON, sans texte autour, de la forme :
{"aliments":[{"nom":"string en français","quantite":nombre,"unite":"g"|"ml"|"unité","kcal":nombre,"proteines":nombre,"glucides":nombre,"lipides":nombre,"confiance":"faible"|"moyen"|"élevé"}]}
Les valeurs nutritionnelles sont pour la quantité indiquée (pas pour 100 g). Les macros sont en grammes.
Utilise "unité" pour les aliments comptés (œuf, tranche, fruit). Confiance plus faible pour les photos ambiguës.`;

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success || (!parsed.data.texte?.trim() && !parsed.data.image))
      return Response.json({ code: "bad_request", message: "Décris ton repas ou ajoute une photo." }, { status: 400 });
    const { texte, image } = parsed.data;
    const client = getClient();

    const content: Array<
      | { type: "text"; text: string }
      | { type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } }
    > = [];
    if (image) {
      const m = image.match(/^data:image\/jpeg;base64,(.+)$/);
      if (!m) throw new ApiError("invalid", "Format d'image non pris en charge", 400);
      content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: m[1] } });
    }
    content.push({ type: "text", text: texte?.trim() ? `Repas : ${texte.trim()}` : "Analyse ce repas d'après la photo." });

    const res = await client.messages.create({
      model: MODEL(),
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: "user", content }],
    });
    const json = analyzeResultSchema.safeParse(extractJson(textOf(res)));
    if (!json.success) throw new ApiError("invalid", "Réponse inattendue");
    return Response.json(json.data);
  } catch (e) {
    return errorResponse(e);
  }
}
