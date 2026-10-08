"use client";
import { useState } from "react";
import { Bar, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageTitle, fmtDate } from "@/components/ui";
import { addDays, budgetForDay, dayTotals, todayIso, weekStart } from "@/lib/calc";
import { useBudget, useStore } from "@/lib/store";
import { levelFromRatio } from "@/lib/verdict";

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function Semaine() {
  const profile = useStore((s) => s.profile)!;
  const meals = useStore((s) => s.meals);
  const b = useBudget()!;
  const [offset, setOffset] = useState(0);
  const debut = addDays(weekStart(todayIso()), offset * 7);

  const data = JOURS.map((j, i) => {
    const d = addDays(debut, i);
    const logged = meals.some((m) => m.date === d);
    const kcal = Math.round(dayTotals(meals, d).kcal);
    const budget = budgetForDay(profile, b.poids, d);
    return { jour: j, date: d, kcal, budget, logged, niveau: logged ? levelFromRatio(kcal / budget) : null };
  });
  const notes = data.filter((d) => d.logged);
  const moyenne = notes.length ? Math.round(notes.reduce((a, d) => a + d.kcal, 0) / notes.length) : 0;
  const moyBudget = notes.length ? Math.round(notes.reduce((a, d) => a + d.budget, 0) / notes.length) : 0;
  const dansCible = notes.filter((d) => d.niveau === "parfait").length;

  return (
    <div className="space-y-4">
      <PageTitle sub={`Du ${fmtDate(debut)} au ${fmtDate(addDays(debut, 6))}`}>Ma semaine</PageTitle>

      <div className="flex items-center justify-between">
        <button className="btn-soft !min-w-[48px] !px-3" aria-label="Semaine précédente" onClick={() => setOffset(offset - 1)}>←</button>
        <span className="text-sm font-bold">{offset === 0 ? "Cette semaine" : offset === -1 ? "Semaine dernière" : `Il y a ${-offset} semaines`}</span>
        <button className="btn-soft !min-w-[48px] !px-3" aria-label="Semaine suivante" disabled={offset >= 0} onClick={() => setOffset(offset + 1)}>→</button>
      </div>

      <section className="card" aria-label="Calories par jour">
        <div className="h-64" role="img" aria-label="Graphique en barres des calories par jour avec la ligne du budget">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="barre" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#FF0A54" /><stop offset="1" stopColor="#FF4600" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#4A2C3F22" />
              <XAxis dataKey="jour" tick={{ fill: "#4A2C3F", fontWeight: 700, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4A2C3F", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v, n) => [`${v} kcal`, n === "kcal" ? "Mangé" : "Budget"]} contentStyle={{ borderRadius: 16, border: "none", boxShadow: "0 8px 30px -8px rgba(255,10,84,.3)" }} />
              <Bar dataKey="kcal" radius={[12, 12, 4, 4]} maxBarSize={30}>
                {data.map((d) => <Cell key={d.date} fill="url(#barre)" />)}
              </Bar>
              <Line dataKey="budget" stroke="#00BFFF" strokeWidth={3} dot={{ r: 3, fill: "#00BFFF" }} type="monotone" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 text-center text-xs font-semibold text-prune/70">
          <span className="text-framboise">■</span> mangé · <span className="text-ciel">●</span> budget du jour (plus haut les jours de danse 💃)
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="font-titre text-3xl font-bold text-framboise">{notes.length ? moyenne : "–"}</p>
          <p className="text-sm font-bold">kcal en moyenne</p>
          {notes.length > 0 && <p className="text-xs font-semibold text-prune/60">budget moyen {moyBudget}</p>}
        </div>
        <div className="card text-center">
          <p className="font-titre text-3xl font-bold text-orange-vif">{dansCible}<span className="text-lg text-prune/60"> / {notes.length}</span></p>
          <p className="text-sm font-bold">jours dans la cible</p>
        </div>
      </section>

      <p className="card text-center text-sm font-semibold leading-relaxed">
        🌷 Ce qui compte, c&apos;est la <b>moyenne de la semaine</b>, pas une seule journée. Une journée plus gourmande se rééquilibre naturellement.
      </p>
    </div>
  );
}
