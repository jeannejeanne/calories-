"use client";
import { useState } from "react";
import { MIN_BUDGET, computeBudget, realisticDuration } from "@/lib/calc";
import type { Profile } from "@/lib/types";

const JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const ORDRE = [1, 2, 3, 4, 5, 6, 0];

/** Formulaire du profil, utilisé à l'onboarding et dans les réglages. */
export default function ProfileForm({ initial, submitLabel, onSubmit }: {
  initial: Partial<Profile>; submitLabel: string; onSubmit: (p: Profile) => void;
}) {
  const [f, setF] = useState({
    prenom: initial.prenom ?? "",
    age: initial.age?.toString() ?? "",
    taille: (initial.tailleCm ?? 165).toString(),
    poids: (initial.poidsActuel ?? 63).toString(),
    cible: (initial.poidsCible ?? 53).toString(),
  });
  const [jours, setJours] = useState<number[]>(initial.joursDanse ?? [2, 4]);
  const [touched, setTouched] = useState(false);

  const n = (s: string) => parseFloat(s.replace(",", "."));
  const age = n(f.age), taille = n(f.taille), poids = n(f.poids), cible = n(f.cible);
  const minCible = Math.ceil(18.5 * (taille / 100) ** 2); // IMC 18,5 : garde-fou doux

  const errors: Record<string, string> = {};
  if (!f.prenom.trim()) errors.prenom = "Dis-moi ton prénom 💕";
  if (!(age >= 16 && age <= 90)) errors.age = "Indique ton âge (16 à 90 ans), il sert au calcul.";
  if (!(taille >= 130 && taille <= 210)) errors.taille = "Taille entre 130 et 210 cm.";
  if (!(poids >= 35 && poids <= 250)) errors.poids = "Poids entre 35 et 250 kg.";
  if (!errors.taille && !(cible >= minCible && cible < poids + 0.01))
    errors.cible = cible < minCible
      ? `Pour ta santé, je te propose un objectif d'au moins ${minCible} kg pour ta taille.`
      : "L'objectif doit être inférieur ou égal à ton poids actuel.";
  const valid = Object.keys(errors).length === 0;

  const preview = valid ? computeBudget({ prenom: "", age, tailleCm: taille, poidsActuel: poids, poidsCible: cible, joursDanse: jours }, poids) : null;
  const duree = valid ? realisticDuration(Math.max(0, poids - cible)) : null;

  const field = (key: keyof typeof f, label: string, opts: { type?: string; unit?: string; err?: string; mode?: "text" | "decimal" | "numeric" } = {}) => (
    <div>
      <label className="label" htmlFor={key}>{label}{opts.unit && <span className="font-semibold text-prune/60"> ({opts.unit})</span>}</label>
      <input id={key} className="input" value={f[key]} inputMode={opts.mode ?? "decimal"}
        onChange={(e) => setF({ ...f, [key]: e.target.value })} aria-invalid={touched && !!opts.err} />
      {touched && opts.err && <p className="mt-1 text-sm font-semibold text-prune">{opts.err}</p>}
    </div>
  );

  return (
    <form className="space-y-4" noValidate onSubmit={(e) => {
      e.preventDefault(); setTouched(true);
      if (!valid) return;
      onSubmit({ prenom: f.prenom.trim(), age: Math.round(age), tailleCm: taille, poidsActuel: poids, poidsCible: cible, joursDanse: jours });
    }}>
      {field("prenom", "Ton prénom", { mode: "text", err: errors.prenom })}
      {field("age", "Ton âge", { unit: "ans", mode: "numeric", err: errors.age })}
      <div className="grid grid-cols-3 gap-3">
        {field("taille", "Taille", { unit: "cm", err: errors.taille })}
        {field("poids", "Poids", { unit: "kg", err: errors.poids })}
        {field("cible", "Objectif", { unit: "kg", err: errors.cible })}
      </div>
      <fieldset>
        <legend className="label">Tes jours de danse 💃 (modern jazz, 1 h)</legend>
        <div className="flex flex-wrap gap-2">
          {ORDRE.map((d) => (
            <button type="button" key={d} className="chip" aria-pressed={jours.includes(d)}
              onClick={() => setJours(jours.includes(d) ? jours.filter((x) => x !== d) : [...jours, d])}>
              {JOURS[d]}
            </button>
          ))}
        </div>
      </fieldset>

      {preview && duree && (
        <div className="rounded-carte bg-creme p-4 text-sm leading-relaxed">
          <p className="font-titre text-lg font-bold text-framboise">Ton budget : {preview.base} kcal / jour</p>
          <p>
            Ton corps dépense environ {preview.depenseTotale} kcal par jour (métabolisme de base × 1,375 pour une vie plutôt sédentaire).
            On retire un déficit doux{preview.plafonne ? " (plafonné à 500 kcal, soit 0,5 kg par semaine)" : " de 15 %"}.
            {jours.length > 0 && <> Les jours de danse, tu gagnes environ <b>+{preview.bonusDanse} kcal</b>.</>}
          </p>
          {preview.plancher && (
            <p className="mt-2 font-semibold">💛 Je ne descends jamais sous {MIN_BUDGET} kcal par jour : c&apos;est le minimum pour rester en forme.</p>
          )}
          {duree.semaines > 0 && (
            <p className="mt-2">Au rythme sain de 0,5 kg par semaine maximum, compte environ <b>{duree.mois < 1.5 ? `${duree.semaines} semaines` : `${Math.round(duree.mois)} mois`}</b> pour {poids - cible} kg. 🌸</p>
          )}
        </div>
      )}
      <button className="btn-grad w-full" type="submit">{submitLabel}</button>
    </form>
  );
}
