"use client";
import { useEffect, useState } from "react";

/** Vrai une fois le store local (localStorage) chargé côté navigateur. */
export function useHydrated() {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  return ok;
}

/** Anneau de progression animé (dégradé framboise → orange → ciel). */
export function Ring({ value, max, children }: { value: number; max: number; children: React.ReactNode }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(Math.min(1, max > 0 ? value / max : 0)), 80);
    return () => clearTimeout(t);
  }, [value, max]);
  const r = 88, c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto h-56 w-56">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF0A54" />
            <stop offset="0.55" stopColor="#FF4600" />
            <stop offset="1" stopColor="#00BFFF" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={r} fill="none" stroke="#4A2C3F" strokeOpacity="0.07" strokeWidth="16" />
        <circle
          cx="100" cy="100" r={r} fill="none" stroke="url(#ring)" strokeWidth="16" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - shown)}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

export function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = Math.min(100, goal > 0 ? (value / goal) * 100 : 0);
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm font-bold">
        <span>{label}</span>
        <span className="text-prune/70">{Math.round(value)} / {goal} g</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-prune/5" role="progressbar" aria-label={label}
        aria-valuenow={Math.round(value)} aria-valuemax={goal}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function Sparkle({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`select-none ${className}`}>✨</span>;
}

export function PageTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <header className="mb-4 mt-2">
      <h1 className="titre-grad text-3xl leading-tight">{children} <Sparkle className="text-xl" /></h1>
      {sub && <p className="text-sm font-semibold text-prune/70">{sub}</p>}
    </header>
  );
}

export function Spinner({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8" role="status">
      <div className="flex gap-2 text-3xl">
        {["💖", "✨", "🍓"].map((e, i) => (
          <span key={i} className="pulse-doux" style={{ animationDelay: `${i * 0.25}s` }}>{e}</span>
        ))}
      </div>
      <p className="font-bold text-prune/80">{text}</p>
    </div>
  );
}

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }) =>
  new Intl.DateTimeFormat("fr-FR", opts).format(new Date(iso + "T12:00:00"));
