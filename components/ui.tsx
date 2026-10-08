"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

/** Vrai une fois le store local (localStorage) chargé côté navigateur. */
export function useHydrated() {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  return ok;
}

/** Étoile à 4 branches (sparkle) dessinée en SVG. */
export function Star({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
      <path d="M12 0c.8 6.4 3.6 9.2 12 12-8.4 2.8-11.2 5.6-12 12-.8-6.4-3.6-9.2-12-12C8.4 9.2 11.2 6.4 12 0z" />
    </svg>
  );
}
export function Heart({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
      <path d="M12 21s-8.5-5.3-8.5-11.2A4.8 4.8 0 0 1 12 7.2a4.8 4.8 0 0 1 8.5 2.6C20.5 15.7 12 21 12 21z" />
    </svg>
  );
}
export const Sparkle = ({ className = "" }: { className?: string }) => <span aria-hidden className={`select-none ${className}`}>✨</span>;

/** Bandeau d'en-tête en dégradé avec logo, réglages et décors flottants. */
export function Hero({ title, sub, children }: { title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="hero -mx-4 -mt-3 px-5 pb-16 pt-4 md:rounded-t-[40px]">
      <Star className="flotte absolute right-10 top-14 h-7 w-7 text-white/50" />
      <Star className="flotte absolute right-24 top-28 h-4 w-4 text-jaune/90" style={{ animationDelay: "-2s" }} />
      <Heart className="flotte absolute left-[55%] top-20 h-5 w-5 text-white/35" style={{ animationDelay: "-4s" }} />
      <Star className="flotte absolute bottom-10 left-6 h-5 w-5 text-white/40" style={{ animationDelay: "-3s" }} />
      <div className="relative z-10 flex items-center justify-between">
        <span className="font-logo text-2xl text-white drop-shadow">Mes calories</span>
        <Link href="/reglages/" aria-label="Réglages" className="grid h-11 w-11 place-items-center rounded-full bg-white/25 text-white backdrop-blur transition active:scale-95">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </Link>
      </div>
      <div className="relative z-10 mt-6">
        <h1 className="text-[2.1rem] font-extrabold leading-[1.1] text-white [text-shadow:0_2px_12px_rgba(74,44,63,.35)]">{title}</h1>
        {sub && <p className="mt-2 inline-block rounded-full bg-prune/35 px-3 py-1 text-sm font-bold text-white backdrop-blur">{sub}</p>}
        {children}
      </div>
    </header>
  );
}

/** Conteneur qui remonte sous le bandeau (effet de superposition). */
export const Pull = ({ children }: { children: React.ReactNode }) => (
  <div className="stagger relative z-10 -mt-12 space-y-4">{children}</div>
);

/** Grand anneau de progression animé (dégradé framboise → orange → ciel). */
export function Ring({ value, max, children }: { value: number; max: number; children: React.ReactNode }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(Math.min(1, max > 0 ? value / max : 0)), 80);
    return () => clearTimeout(t);
  }, [value, max]);
  const r = 88, c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto h-60 w-60">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90 [filter:drop-shadow(0_8px_14px_rgba(255,10,84,.3))]" aria-hidden>
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF0A54" /><stop offset="0.55" stopColor="#FF4600" /><stop offset="1" stopColor="#00BFFF" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="68" fill="none" stroke="#FF0A54" strokeOpacity="0.12" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
        <circle cx="100" cy="100" r={r} fill="none" stroke="#4A2C3F" strokeOpacity="0.07" strokeWidth="16" />
        <circle cx="100" cy="100" r={r} fill="none" stroke="url(#ring)" strokeWidth="16" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - shown)} style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

/** Petit anneau pour les macros. */
export function MiniRing({ label, value, goal, color, icon }: { label: string; value: number; goal: number; color: string; icon: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = setTimeout(() => setShown(Math.min(1, goal > 0 ? value / goal : 0)), 150); return () => clearTimeout(t); }, [value, goal]);
  const r = 26, c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1 rounded-3xl bg-creme p-3" role="group" aria-label={`${label} : ${Math.round(value)} sur ${goal} g`}>
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeOpacity=".18" strokeWidth="7" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={c}
            strokeDashoffset={c * (1 - shown)} style={{ transition: "stroke-dashoffset 1s ease-out" }} />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-xl" aria-hidden>{icon}</span>
      </div>
      <span className="text-xs font-bold">{label}</span>
      <span className="text-xs font-semibold text-prune/70">{Math.round(value)} / {goal} g</span>
    </div>
  );
}

export function Spinner({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8" role="status">
      <div className="flex gap-2 text-3xl">
        {["💖", "✨", "🍓"].map((e, i) => <span key={i} className="pulse-doux" style={{ animationDelay: `${i * 0.25}s` }}>{e}</span>)}
      </div>
      <p className="font-bold text-prune/80">{text}</p>
    </div>
  );
}

/** Pastille d'icône colorée pour les titres de cartes. */
export const Bubble = ({ children, tint }: { children: React.ReactNode; tint: string }) => (
  <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: `${tint}22` }}>{children}</span>
);

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }) =>
  new Intl.DateTimeFormat("fr-FR", opts).format(new Date(iso + "T12:00:00"));
