"use client";
import { useEffect, useState } from "react";
import { fallbackVerdict, type VerdictFacts } from "@/lib/verdict";
import { Spinner } from "./ui";

/** Fenêtre du verdict : règles dans le code, formulation chaleureuse par Claude (texte de secours si l'API échoue). */
export default function VerdictSheet({ facts, prenom, jourDanse, onClose }: {
  facts: VerdictFacts; prenom: string; jourDanse: boolean; onClose: () => void;
}) {
  const [txt, setTxt] = useState<{ message: string; conseil: string } | null>(null);
  const [secours, setSecours] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const r = await fetch("/api/verdict", {
          method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal,
          body: JSON.stringify({
            prenom, niveau: facts.niveau, titre: facts.titre, kcal: facts.kcal, budget: facts.budget,
            proteines: facts.proteines, objectifProteines: facts.objectifProteines,
            proteinesOk: facts.proteinesOk, troisJoursLegers: facts.troisJoursLegers, jourDanse,
          }),
        });
        if (!r.ok) throw new Error("api");
        setTxt(await r.json());
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setSecours(true);
        setTxt(fallbackVerdict(facts));
      }
    })();
    return () => ctrl.abort();
  }, [facts, prenom, jourDanse]);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-prune/40 p-3 md:items-center" role="dialog" aria-modal="true" aria-label="Verdict du jour">
      <div className="card w-full max-w-md text-center">
        <div className="text-5xl" aria-hidden>{facts.emoji}</div>
        <h2 className="titre-grad mt-2 text-2xl">{facts.titre}</h2>
        <p className="mt-1 text-sm font-bold text-prune/70">{facts.kcal} kcal sur {facts.budget} kcal · protéines {facts.proteines}/{facts.objectifProteines} g</p>
        {!txt ? <Spinner text="Je prépare ton petit mot…" /> : (
          <div className="mt-4 space-y-3 text-left">
            <p className="leading-relaxed">{txt.message}</p>
            <div className="rounded-2xl bg-creme p-3">
              <p className="text-sm font-bold text-framboise">Pour demain 🌷</p>
              <p className="text-sm leading-relaxed">{txt.conseil}</p>
            </div>
            {secours && <p className="text-xs text-prune/60">Message de secours (la connexion à Claude n&apos;est pas disponible).</p>}
          </div>
        )}
        <button className="btn-grad mt-5 w-full" onClick={onClose}>Merci 💕</button>
      </div>
    </div>
  );
}
