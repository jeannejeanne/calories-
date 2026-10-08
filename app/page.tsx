"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MacroBar, PageTitle, Ring, fmtDate } from "@/components/ui";
import VerdictSheet from "@/components/VerdictSheet";
import { budgetForDay, dayTotals, isDanceDay, macroTargets, todayIso } from "@/lib/calc";
import { useBudget, useStore } from "@/lib/store";
import { computeVerdict } from "@/lib/verdict";
import { MEAL_EMOJI, MEAL_LABELS, MEAL_ORDER } from "@/lib/types";

const WATER_GOAL = 8;

export default function Aujourdhui() {
  const profile = useStore((s) => s.profile)!;
  const meals = useStore((s) => s.meals);
  const water = useStore((s) => s.water);
  const setWater = useStore((s) => s.setWater);
  const removeMeal = useStore((s) => s.removeMeal);
  const closeDay = useStore((s) => s.closeDay);
  const b = useBudget()!;
  const date = todayIso();
  const [open, setOpen] = useState(false);

  const total = useMemo(() => dayTotals(meals, date), [meals, date]);
  const danse = isDanceDay(profile, date);
  const budget = budgetForDay(profile, b.poids, date);
  const cibles = macroTargets(budget, b.poids);
  const reste = Math.round(budget - total.kcal);
  const todays = meals.filter((m) => m.date === date);
  const verdict = useMemo(() => open ? computeVerdict(profile, b.poids, meals, date) : null, [open, profile, b.poids, meals, date]);
  const verres = water[date] ?? 0;

  return (
    <div className="space-y-4">
      <PageTitle sub={fmtDate(date, { weekday: "long", day: "numeric", month: "long" })}>Coucou {profile.prenom}</PageTitle>

      <section className="card text-center" aria-label="Calories du jour">
        {danse && <span className="mb-2 inline-block rounded-full bg-jaune px-3 py-1 text-sm font-bold">Jour de danse 💃 +{b.budget.bonusDanse} kcal</span>}
        <Ring value={total.kcal} max={budget}>
          <span className="font-titre text-5xl font-bold text-prune">{Math.abs(reste)}</span>
          <span className="text-sm font-bold text-prune/70">{reste >= 0 ? "kcal restantes" : "kcal au-dessus"}</span>
          <span className="mt-1 text-xs font-semibold text-prune/60">{Math.round(total.kcal)} / {budget}</span>
        </Ring>
        <div className="mt-5 space-y-3 text-left">
          <MacroBar label="Protéines" value={total.proteines} goal={cibles.proteines} color="#FF0A54" />
          <MacroBar label="Glucides" value={total.glucides} goal={cibles.glucides} color="#FF4600" />
          <MacroBar label="Lipides" value={total.lipides} goal={cibles.lipides} color="#00BFFF" />
        </div>
      </section>

      {MEAL_ORDER.map((type) => {
        const list = todays.filter((m) => m.type === type);
        const kcal = list.reduce((a, m) => a + m.items.reduce((x, i) => x + i.kcal, 0), 0);
        return (
          <section key={type} className="card" aria-label={MEAL_LABELS[type]}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold"><span aria-hidden>{MEAL_EMOJI[type]}</span> {MEAL_LABELS[type]}</h2>
              <span className="text-sm font-bold text-framboise">{Math.round(kcal)} kcal</span>
            </div>
            {list.length === 0 ? (
              <Link href={`/ajouter?repas=${type}`} className="mt-2 inline-flex min-h-[44px] items-center text-sm font-bold text-prune/70 underline decoration-ciel decoration-2">+ Ajouter</Link>
            ) : list.map((m) => (
              <div key={m.id} className="mt-3 flex gap-3">
                {m.photo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={m.photo} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />}
                <ul className="flex-1 text-sm">
                  {m.items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-2 py-0.5">
                      <span>{i.nom} <span className="text-prune/60">· {i.quantite} {i.unite === "unité" ? "" : i.unite}</span></span>
                      <span className="font-bold">{Math.round(i.kcal)}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => confirm("Supprimer ce repas ?") && removeMeal(m.id)} aria-label="Supprimer ce repas"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-prune/60 hover:bg-prune/5">🗑️</button>
              </div>
            ))}
          </section>
        );
      })}

      <section className="card" aria-label="Eau">
        <h2 className="text-lg font-bold">💧 Eau <span className="text-sm text-prune/70">{verres} / {WATER_GOAL} verres</span></h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {Array.from({ length: WATER_GOAL }, (_, i) => (
            <button key={i} aria-label={`${i + 1} verre${i ? "s" : ""}`} aria-pressed={i < verres}
              onClick={() => setWater(date, i + 1 === verres ? i : i + 1)}
              className={`grid h-11 w-11 place-items-center rounded-full text-xl transition ${i < verres ? "bg-ciel" : "bg-prune/5 opacity-70"}`}>💧</button>
          ))}
        </div>
      </section>

      <button className="btn-grad w-full" disabled={todays.length === 0} onClick={() => { closeDay(date); setOpen(true); }}>
        Clôturer ma journée 🌙
      </button>
      {todays.length === 0 && <p className="text-center text-xs font-semibold text-prune/60">Ajoute au moins un repas pour voir ton verdict.</p>}

      {open && verdict && <VerdictSheet facts={verdict} prenom={profile.prenom} jourDanse={danse} onClose={() => setOpen(false)} />}
    </div>
  );
}
