"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { Sparkle, useHydrated } from "./ui";
import Onboarding from "./Onboarding";

const TABS = [
  { href: "/", label: "Aujourd'hui", icon: "🌷" },
  { href: "/semaine", label: "Semaine", icon: "📊" },
  { href: "/suivi", label: "Mon suivi", icon: "⚖️" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const profile = useStore((s) => s.profile);
  const path = usePathname();

  if (!hydrated)
    return <div className="grid min-h-dvh place-items-center font-logo text-3xl text-framboise">Mes calories</div>;
  if (!profile) return <Onboarding />;

  const tab = (t: (typeof TABS)[number]) => {
    const on = path === t.href;
    return (
      <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined}
        className={`flex min-h-[56px] flex-1 flex-col items-center justify-center text-xs font-bold ${on ? "text-framboise" : "text-prune/70"}`}>
        <span aria-hidden className="text-xl">{t.icon}</span>{t.label}
      </Link>
    );
  };

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md px-4 pb-32 pt-3 md:max-w-lg">
      <div className="flex items-center justify-between">
        <span className="font-logo text-2xl text-framboise">Mes calories <Sparkle className="text-base" /></span>
        <Link href="/reglages" aria-label="Réglages" className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl shadow-doux">⚙️</Link>
      </div>
      <main>{children}</main>

      <nav aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md items-end rounded-t-[32px] border-t border-prune/5 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-10px_rgba(255,10,84,0.25)] backdrop-blur md:max-w-lg">
        {tab(TABS[0])}
        <Link href="/ajouter" aria-label="Ajouter un repas"
          className={`-mt-7 mb-2 grid h-16 w-16 shrink-0 place-items-center rounded-full text-3xl font-bold text-white shadow-doux ring-4 ring-creme transition active:scale-95`}
          style={{ backgroundImage: "linear-gradient(135deg,#FF0A54,#FF4600 60%,#00BFFF)", textShadow: "0 1px 2px rgba(74,44,63,.4)" }}>
          +
        </Link>
        {tab(TABS[1])}
        {tab(TABS[2])}
      </nav>
    </div>
  );
}
