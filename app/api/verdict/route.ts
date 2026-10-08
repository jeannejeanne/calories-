import { verdictResultSchema } from "@/lib/schemas";
import { ApiError, MODEL, errorResponse, extractJson, getClient, textOf } from "@/lib/claude";
import { z } from "zod";

export const runtime = "nodejs";

// Le verdict (niveau, chiffres) est calculé par des règles côté appli ; Claude ne fait que le formuler.
const bodySchema = z.object({
  prenom: z.string().max(40),
  niveau: z.enum(["peu", "parfait", "au-dessus", "gourmand"]),
  titre: z.string().max(100),
  kcal: z.number(),
  budget: z.number(),
  proteines: z.number(),
  objectifProteines: z.number(),
  proteinesOk: z.boolean(),
  troisJoursLegers: z.boolean(),
  jourDanse: z.boolean(),
});

const SYSTEM = `Tu es une coach bienveillante et chaleureuse qui s'adresse à une femme en tutoyant.
Rédige le verdict de sa journée alimentaire à partir des faits fournis (le niveau est déjà décidé, ne le change pas).
Règles de ton STRICTES : jamais de culpabilisation ; interdits : les mots « mauvais », « raté », « interdit », « échec », « triche », « craquage » ;
ne parle pas de comparaison de corps ni de séries de jours. Si le niveau est « peu » ou si troisJoursLegers est vrai,
dis doucement que manger trop peu freine aussi la perte de poids et la forme, et encourage à manger davantage.
Si le niveau est « gourmand » ou « au-dessus », rappelle que c'est la moyenne de la semaine qui compte.
Si proteinesOk est faux, ajoute une courte remarque sur les protéines.
Réponds UNIQUEMENT par du JSON : {"message":"2 à 3 phrases","conseil":"un conseil concret pour demain, une phrase"}`;

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return Response.json({ code: "bad_request", message: "Données invalides" }, { status: 400 });
    const client = getClient();
    const res = await client.messages.create({
      model: MODEL(),
      max_tokens: 600,
      system: SYSTEM,
      messages: [{ role: "user", content: JSON.stringify(parsed.data) }],
    });
    const json = verdictResultSchema.safeParse(extractJson(textOf(res)));
    if (!json.success) throw new ApiError("invalid", "Réponse inattendue");
    return Response.json(json.data);
  } catch (e) {
    return errorResponse(e);
  }
}
