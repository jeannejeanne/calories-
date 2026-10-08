"use client";
import { useRouter } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";
import { PageTitle } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function Reglages() {
  const router = useRouter();
  const profile = useStore((s) => s.profile)!;
  const setProfile = useStore((s) => s.setProfile);
  const addWeight = useStore((s) => s.addWeight);
  return (
    <div className="space-y-4">
      <PageTitle>Réglages</PageTitle>
      <div className="card">
        <ProfileForm initial={profile} submitLabel="Enregistrer 💖" onSubmit={(p) => {
          // si le poids a changé dans les réglages, on l'ajoute comme pesée du jour
          if (p.poidsActuel !== profile.poidsActuel) addWeight(p.poidsActuel);
          setProfile(p); router.push("/");
        }} />
      </div>
      <p className="card text-sm leading-relaxed">
        💛 Cette appli donne des estimations, elle ne remplace pas l&apos;avis d&apos;un médecin ou d&apos;une diététicienne.
        Parles-en à un professionnel si l&apos;alimentation devient une source d&apos;angoisse.
      </p>
    </div>
  );
}
