"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { useHydrated } from "./ui";
import Onboarding from "./Onboarding";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

const icon = (d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>
);
const TABS = [
  { href: "/", label: "Aujourd'hui", svg: icon(<><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /><path d="M10 19.5v-5h4v5" /></>) },
  { href: "/semaine/", label: "Semaine", svg: icon(<><path d="M5 20V11M12 20V4M19 20v-6" /></>) },
  { href: "/suivi/", label: "Mon suivi", svg: icon(<><path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.8a4.3 4.3 0 0 1 7.5 2.7c0 5.4-7.5 10-7.5 10z" /></>) },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const profile = useStore((s) => s.profile);
  const path = usePathname();

  // Service worker : permet l'installation sur l'écran d'accueil
  useEffect(() => {
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register(`${base}/sw.js`).catch(() => {});
  }, []);

  if (!hydrated)
    return <div className="grid min-h-dvh place-items-center font-logo text-4xl text-framboise">Mes calories</div>;
  if (!profile) return <Onboarding />;

  const norm = (p: string) => (p.length > 1 ? p.replace(/\/$/, "") : p);
  const tab = (t: (typeof TABS)[number]) => {
    const on = norm(path) === norm(t.href);
    return (
      <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined}
        className={`flex min-h-[60px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${on ? "text-framboise" : "text-prune/70"}`}>
        <span className={`grid h-8 w-12 place-items-center rounded-full transition ${on ? "bg-framboise/10" : ""}`}>{t.svg}</span>
        {t.label}
      </Link>
    );
  };

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md px-4 pb-40 pt-3 md:my-6 md:min-h-[calc(100dvh-3rem)] md:max-w-lg md:overflow-hidden md:rounded-[40px] md:bg-creme md:shadow-[0_30px_80px_-20px_rgba(255,10,84,.45)]">
      <main>{children}</main>
      <nav aria-label="Navigation principale"
        className="fixed bottom-4 left-1/2 z-20 flex w-[calc(100%-2rem)] max-w-[26rem] -translate-x-1/2 items-center rounded-full border border-white bg-white/90 px-2 shadow-[0_18px_40px_-12px_rgba(255,10,84,.45)] backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        {tab(TABS[0])}
        <Link href="/ajouter/" aria-label="Ajouter un repas"
          className="-mt-9 mb-1 grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full text-white ring-[6px] ring-creme transition active:scale-95"
          style={{ backgroundImage: "linear-gradient(135deg,#FF0A54,#FF4600 60%,#00BFFF)", boxShadow: "0 16px 30px -8px rgba(255,10,84,.7), inset 0 2px 0 rgba(255,255,255,.35)" }}>
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
        </Link>
        {tab(TABS[1])}
        {tab(TABS[2])}
      </nav>
    </div>
  );
}
