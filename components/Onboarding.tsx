"use client";
import { useStore } from "@/lib/store";
import ProfileForm from "./ProfileForm";
import { Sparkle } from "./ui";

export default function Onboarding() {
  const setProfile = useStore((s) => s.setProfile);
  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 py-8 md:max-w-lg">
      <div className="mb-6 text-center">
        <h1 className="font-logo text-4xl text-framboise">Mes calories</h1>
        <p className="mt-2 font-semibold">Bienvenue ! Faisons connaissance <Sparkle /> <span aria-hidden>💖</span></p>
      </div>
      <div className="card">
        <ProfileForm initial={{}} submitLabel="C'est parti ✨" onSubmit={setProfile} />
      </div>
      <p className="mt-4 text-center text-xs font-semibold text-prune/70">
        Tes données restent sur ton téléphone, rien n&apos;est envoyé sans que tu ajoutes un repas.
      </p>
    </div>
  );
}
