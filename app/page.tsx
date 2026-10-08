"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bubble, Hero, MiniRing, Pull, Ring, fmtDate } from "@/components/ui";
import VerdictSheet from "@/components/VerdictSheet";
import { budgetForDay, dayTotals, isDanceDay, macroTargets, todayIso } from "@/lib/calc";
import { useBudget, useStore } from "@/lib/store";
import { computeVerdict } from "@/lib/verdict";
import { MEAL_EMOJI, MEAL_LABELS, MEAL_ORDER } from "@/lib/types";

const WATER_GOAL = 8;
const TINT = { "petit-dej": "#FF4600", dejeuner: "#00BFFF", diner: "#FF0A54", collation: "#E6D800" } as const;

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
  const verdict = useMemo(() => (open ? computeVerdict(profile, b.poids, meals, date) : null), [open, profile, b.poids, meals, date]);
  const verres = water[date] ?? 0;

  return (
    <div>
      <Hero title={<>Coucou {profile.prenom} <span aria-hidden>💖</span></>} sub={<>{fmtDate(date, { weekday: "long", day: "numeric", month: "long" })}{danse && " · Jour de danse 💃"}</>}>
        {danse && <p className="mt-2 inline-block rounded-full bg-jaune px-3 py-1 text-sm font-extrabold text-prune">Bonus danse +{b.budget.bonusDanse} kcal ✨</p>}
      </Hero>

      <Pull>
        <section className="card text-center" aria-label="Calories du jour">
          <Ring value={total.kcal} max={budget}>
            <span className="text-xs font-bold uppercase tracking-widest text-prune/60">{reste >= 0 ? "il te reste" : "tu es au-dessus de"}</span>
            <span className="font-titre text-6xl font-extrabold leading-none text-prune">{Math.abs(reste)}</span>
            <span className="text-sm font-bold text-framboise">kcal</span>
            <span className="mt-1 rounded-full bg-prune/5 px-3 py-0.5 text-xs font-bold text-prune/70">{Math.round(total.kcal)} / {budget}</span>
          </Ring>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <MiniRing label="Protéines" icon="🥚" value={total.proteines} goal={cibles.proteines} color="#FF0A54" />
            <MiniRing label="Glucides" icon="🍞" value={total.glucides} goal={cibles.glucides} color="#FF4600" />
            <MiniRing label="Lipides" icon="🥑" value={total.lipides} goal={cibles.lipides} color="#00A8E0" />
          </div>
        </section>

        {MEAL_ORDER.map((type) => {
          const list = todays.filter((m) => m.type === type);
          const kcal = list.reduce((a, m) => a + m.items.reduce((x, i) => x + i.kcal, 0), 0);
          return (
            <section key={type} className="card" aria-label={MEAL_LABELS[type]}>
              <div className="flex items-center gap-3">
                <Bubble tint={TINT[type]}>{MEAL_EMOJI[type]}</Bubble>
                <div className="flex-1">
                  <h2 className="text-lg font-bold leading-tight">{MEAL_LABELS[type]}</h2>
                  <p className="text-sm font-bold text-framboise">{Math.round(kcal)} kcal</p>
                </div>
                <Link href={`/ajouter/?repas=${type}`} aria-label={`Ajouter à ${MEAL_LABELS[type]}`}
                  className="grid h-11 w-11 place-items-center rounded-full text-xl font-bold text-white" style={{ background: "linear-gradient(135deg,#FF0A54,#FF4600)" }}>+</Link>
              </div>
              {list.map((m) => (
                <div key={m.id} className="mt-3 flex gap-3 rounded-2xl bg-creme p-3">
                  {m.photo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={m.photo} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />}
                  <ul className="flex-1 text-sm">
                    {m.items.map((i) => (
                      <li key={i.id} className="flex justify-between gap-2 py-0.5">
                        <span>{i.nom} <span className="text-prune/60">· {i.quantite}{i.unite === "unité" ? "" : ` ${i.unite}`}</span></span>
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
          <div className="flex items-center gap-3">
            <Bubble tint="#00BFFF">💧</Bubble>
            <div className="flex-1">
              <h2 className="text-lg font-bold leading-tight">Eau</h2>
              <p className="text-sm font-bold text-prune/70">{verres} / {WATER_GOAL} verres</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-8 gap-1.5">
            {Array.from({ length: WATER_GOAL }, (_, i) => (
              <button key={i} aria-label={`${i + 1} verre${i ? "s" : ""}`} aria-pressed={i < verres}
                onClick={() => setWater(date, i + 1 === verres ? i : i + 1)}
                className="relative h-12 overflow-hidden rounded-xl border-2 border-ciel/40 bg-white transition active:scale-90">
                <span className="absolute inset-x-0 bottom-0 origin-bottom transition-all duration-500" style={{ height: i < verres ? "100%" : "0%", background: "linear-gradient(180deg,#5fd8ff,#00BFFF)" }} />
              </button>
            ))}
          </div>
        </section>

        <button className="btn-grad w-full !min-h-[56px] text-lg" disabled={todays.length === 0} onClick={() => { closeDay(date); setOpen(true); }}>
          Clôturer ma journée 🌙
        </button>
        {todays.length === 0 && <p className="text-center text-xs font-semibold text-prune/70">Ajoute au moins un repas pour voir ton verdict.</p>}
      </Pull>

      {open && verdict && <VerdictSheet facts={verdict} prenom={profile.prenom} jourDanse={danse} onClose={() => setOpen(false)} />}
    </div>
  );
}
