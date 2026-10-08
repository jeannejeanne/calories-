"use client";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageTitle, fmtDate } from "@/components/ui";
import { estimateArrival, realisticDuration, todayIso } from "@/lib/calc";
import { useBudget, useStore } from "@/lib/store";

export default function Suivi() {
  const { profile, weights, meals, water, closedDays, addWeight, reset } = useStore();
  const b = useBudget()!;
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");
  const cible = profile!.poidsCible;

  const data = weights.map((w) => ({ ...w, label: fmtDate(w.date, { day: "numeric", month: "short" }) }));
  const arrivee = estimateArrival(weights, cible, todayIso());
  const reste = Math.max(0, Math.round((b.poids - cible) * 10) / 10);
  const duree = realisticDuration(reste);
  const kgs = data.map((d) => d.kg).concat(cible);

  function ajouter() {
    const kg = parseFloat(val.replace(",", "."));
    if (!(kg >= 35 && kg <= 250)) return setErr("Entre un poids valide, par exemple 62,4");
    setErr(""); addWeight(kg); setVal("");
  }

  function exporter() {
    const blob = new Blob([JSON.stringify({ profile, weights, meals, water, closedDays }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mes-calories-${todayIso()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-4">
      <PageTitle sub="Une pesée par semaine suffit 🌸">Mon suivi</PageTitle>

      <section className="card space-y-3">
        <label className="label" htmlFor="poids">Mon poids du jour (kg)</label>
        <div className="flex gap-2">
          <input id="poids" className="input" inputMode="decimal" placeholder={String(b.poids).replace(".", ",")} value={val}
            onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ajouter()} />
          <button className="btn-grad" onClick={ajouter}>Noter</button>
        </div>
        {err && <p className="text-sm font-semibold" role="alert">{err}</p>}
        <p className="text-xs font-semibold text-prune/70">
          Conseil : pèse-toi une fois par semaine, le même jour et au même moment (par exemple le matin, à jeun). Ton budget se recalcule à chaque pesée.
        </p>
      </section>

      <section className="card" aria-label="Courbe du poids">
        <div className="h-60" role="img" aria-label="Courbe du poids avec la ligne d'objectif">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="courbe" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#FF0A54" /><stop offset="1" stopColor="#FF4600" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#4A2C3F22" />
              <XAxis dataKey="label" tick={{ fill: "#4A2C3F", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[Math.floor(Math.min(...kgs) - 1), Math.ceil(Math.max(...kgs) + 1)]} tick={{ fill: "#4A2C3F", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v} kg`, "Poids"]} contentStyle={{ borderRadius: 16, border: "none" }} />
              <ReferenceLine y={cible} stroke="#00BFFF" strokeWidth={3} strokeDasharray="6 4" label={{ value: `Objectif ${cible} kg`, fill: "#4A2C3F", fontSize: 12, fontWeight: 700, position: "insideTopRight" }} />
              <Line dataKey="kg" stroke="url(#courbe)" strokeWidth={4} dot={{ r: 5, fill: "#FF0A54", strokeWidth: 0 }} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card space-y-2 text-sm leading-relaxed">
        <p className="font-titre text-xl font-bold text-framboise">{b.poids} kg → {cible} kg</p>
        {reste > 0 ? (
          <>
            <p>Il te reste <b>{reste} kg</b>. Au rythme sain de 0,5 kg par semaine maximum, compte environ <b>{duree.mois < 1.5 ? `${duree.semaines} semaines` : `${Math.round(duree.mois)} mois`}</b>.</p>
            {arrivee ? (
              <p>À ton rythme réel ({arrivee.rate.toFixed(2).replace(".", ",")} kg/semaine), tu y seras vers le <b>{fmtDate(arrivee.date, { day: "numeric", month: "long", year: "numeric" })}</b> 🎉</p>
            ) : (
              <p className="text-prune/70">Pour estimer ta date d&apos;arrivée au rythme réel, il me faut au moins deux pesées espacées d&apos;une semaine.</p>
            )}
          </>
        ) : <p>Tu as atteint ton objectif, bravo ! 🎉 Pense à le maintenir en douceur.</p>}
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-bold">Mes données</h2>
        <button className="btn-ciel w-full" onClick={exporter}>Exporter en JSON</button>
        <button className="btn-soft w-full" onClick={() => confirm("Tout effacer ? Cette action est définitive.") && reset()}>Tout effacer</button>
      </section>
    </div>
  );
}
