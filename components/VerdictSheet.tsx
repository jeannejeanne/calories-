"use client";
import { useEffect, useState } from "react";
import { writeVerdict } from "@/lib/ai";
import { useStore } from "@/lib/store";
import { fallbackVerdict, type VerdictFacts } from "@/lib/verdict";
import { Heart, Spinner, Star } from "./ui";

/** Fenêtre du verdict : règles dans le code, formulation chaleureuse par Claude (texte de secours sinon). */
export default function VerdictSheet({ facts, prenom, jourDanse, onClose }: {
  facts: VerdictFacts; prenom: string; jourDanse: boolean; onClose: () => void;
}) {
  const apiKey = useStore((s) => s.apiKey);
  const model = useStore((s) => s.model);
  const [txt, setTxt] = useState<{ message: string; conseil: string } | null>(null);
  const [secours, setSecours] = useState<"" | "cle" | "erreur">("");

  useEffect(() => {
    let annule = false;
    (async () => {
      if (!apiKey) { setSecours("cle"); setTxt(fallbackVerdict(facts)); return; }
      try {
        const r = await writeVerdict({ apiKey, model, facts: {
          prenom, niveau: facts.niveau, titre: facts.titre, kcal: facts.kcal, budget: facts.budget,
          proteines: facts.proteines, objectifProteines: facts.objectifProteines,
          proteinesOk: facts.proteinesOk, troisJoursLegers: facts.troisJoursLegers, jourDanse } });
        if (!annule) setTxt(r);
      } catch {
        if (!annule) { setSecours("erreur"); setTxt(fallbackVerdict(facts)); }
      }
    })();
    return () => { annule = true; };
  }, [facts, prenom, jourDanse, apiKey, model]);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-prune/50 p-3 backdrop-blur-sm md:items-center" role="dialog" aria-modal="true" aria-label="Verdict du jour">
      <div className="w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl animate-apparition">
        <div className="hero relative px-6 pb-8 pt-8 text-center" style={{ borderRadius: 0 }}>
          <Star className="flotte absolute left-8 top-6 h-6 w-6 text-white/60" />
          <Heart className="flotte absolute right-10 top-10 h-5 w-5 text-white/50" style={{ animationDelay: "-3s" }} />
          <Star className="flotte absolute bottom-6 right-16 h-4 w-4 text-jaune" style={{ animationDelay: "-1s" }} />
          <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-white text-5xl shadow-lg" aria-hidden>{facts.emoji}</div>
          <h2 className="relative mt-3 text-2xl font-extrabold leading-tight [text-shadow:0_2px_10px_rgba(74,44,63,.35)]">{facts.titre}</h2>
        </div>
        <div className="p-5">
          <div className="flex justify-center gap-2 text-xs font-bold">
            <span className="rounded-full bg-framboise/10 px-3 py-1">{facts.kcal} / {facts.budget} kcal</span>
            <span className="rounded-full bg-ciel/20 px-3 py-1">protéines {facts.proteines}/{facts.objectifProteines} g</span>
          </div>
          {!txt ? <Spinner text="Je prépare ton petit mot…" /> : (
            <div className="mt-4 space-y-3">
              <p className="leading-relaxed">{txt.message}</p>
              <div className="rounded-2xl bg-creme p-3 ring-1 ring-framboise/15">
                <p className="text-sm font-bold text-framboise">Pour demain 🌷</p>
                <p className="text-sm leading-relaxed">{txt.conseil}</p>
              </div>
              {secours === "cle" && <p className="text-xs text-prune/70">Ajoute ta clé dans Réglages pour un message encore plus personnel.</p>}
              {secours === "erreur" && <p className="text-xs text-prune/70">Message de secours (la connexion à Claude n&apos;a pas fonctionné).</p>}
            </div>
          )}
          <button className="btn-grad mt-5 w-full" onClick={onClose}>Merci 💕</button>
        </div>
      </div>
    </div>
  );
}
