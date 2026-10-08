"use client";
import { useStore } from "@/lib/store";
import ProfileForm from "./ProfileForm";
import { Heart, Star } from "./ui";

export default function Onboarding() {
  const setProfile = useStore((s) => s.setProfile);
  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-10 pt-3 md:max-w-lg">
      <header className="hero -mx-4 -mt-3 px-6 pb-20 pt-10 text-center md:rounded-t-[40px]">
        <Star className="flotte absolute left-8 top-10 h-6 w-6 text-white/50" />
        <Star className="flotte absolute right-10 top-20 h-8 w-8 text-jaune/90" style={{ animationDelay: "-2s" }} />
        <Heart className="flotte absolute right-24 top-8 h-5 w-5 text-white/40" style={{ animationDelay: "-4s" }} />
        <h1 className="relative font-logo text-5xl font-normal text-white drop-shadow-lg">Mes calories</h1>
        <p className="relative mt-3 inline-block rounded-full bg-prune/35 px-4 py-1 text-sm font-bold backdrop-blur">Ton carnet doux et bienveillant 💖</p>
      </header>
      <div className="card -mt-12 relative z-10">
        <h2 className="mb-1 text-2xl font-extrabold">Faisons connaissance ✨</h2>
        <p className="mb-4 text-sm font-semibold text-prune/70">Quelques infos pour calculer ton budget du jour.</p>
        <ProfileForm initial={{}} submitLabel="C'est parti ✨" onSubmit={setProfile} />
      </div>
      <p className="mt-4 text-center text-xs font-semibold text-prune/70">Tes données restent sur ton téléphone.</p>
    </div>
  );
}
