"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ProfileForm from "@/components/ProfileForm";
import { Hero, Pull } from "@/components/ui";
import { AiError, MODELS, testKey } from "@/lib/ai";
import { useStore } from "@/lib/store";

export default function Reglages() {
  const router = useRouter();
  const profile = useStore((s) => s.profile)!;
  const setProfile = useStore((s) => s.setProfile);
  const addWeight = useStore((s) => s.addWeight);
  const apiKey = useStore((s) => s.apiKey);
  const model = useStore((s) => s.model);
  const setApiKey = useStore((s) => s.setApiKey);
  const setModel = useStore((s) => s.setModel);
  const [key, setKey] = useState(apiKey);
  const [etat, setEtat] = useState<"" | "test" | "ok" | "auth" | "erreur">("");

  async function tester() {
    setApiKey(key); setEtat("test");
    try { await testKey(key.trim(), model); setEtat("ok"); }
    catch (e) { setEtat(e instanceof AiError && e.code === "auth" ? "auth" : "erreur"); }
  }

  return (
    <div>
      <Hero title="Réglages" sub="Ton profil et l'intelligence artificielle" />
      <Pull>
        <section className="card space-y-3" aria-label="Intelligence artificielle">
          <h2 className="text-xl font-extrabold">🔑 Clé Anthropic</h2>
          <p className="text-sm leading-relaxed text-prune/80">
            Elle permet d&apos;analyser tes repas (texte ou photo) et de rédiger ton verdict. Sans clé, tout le reste fonctionne (saisie manuelle).
            Crée-la sur <b>console.anthropic.com</b> (menu « API keys »). C&apos;est payant à l&apos;usage, quelques euros suffisent pour démarrer :
            pense à fixer une limite de dépenses.
          </p>
          <div>
            <label className="label" htmlFor="cle">Ta clé API</label>
            <input id="cle" type="password" autoComplete="off" className="input" placeholder="sk-ant-…" value={key} onChange={(e) => { setKey(e.target.value); setEtat(""); }} />
          </div>
          <div>
            <label className="label" htmlFor="modele">Modèle</label>
            <select id="modele" className="input" value={model} onChange={(e) => setModel(e.target.value)}>
              {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <button className="btn-grad w-full" onClick={tester} disabled={!key.trim() || etat === "test"}>{etat === "test" ? "Test en cours…" : "Enregistrer et tester"}</button>
          {etat === "ok" && <p className="rounded-2xl bg-ciel/20 p-3 text-sm font-bold" role="status">✅ Ça marche, ta clé est enregistrée.</p>}
          {etat === "auth" && <p className="rounded-2xl bg-jaune/50 p-3 text-sm font-bold" role="alert">Clé refusée : vérifie-la (elle commence par sk-ant-).</p>}
          {etat === "erreur" && <p className="rounded-2xl bg-jaune/50 p-3 text-sm font-bold" role="alert">Impossible de joindre Anthropic. Vérifie ta connexion et le modèle choisi.</p>}
          <p className="text-xs font-semibold text-prune/70">🔒 La clé reste uniquement sur cet appareil (jamais dans le code ni dans l&apos;export). Ne l&apos;utilise que sur ton propre téléphone.</p>
        </section>

        <section className="card">
          <h2 className="mb-3 text-xl font-extrabold">🌷 Mon profil</h2>
          <ProfileForm initial={profile} submitLabel="Enregistrer 💖" onSubmit={(p) => {
            // si le poids a changé dans les réglages, on l'ajoute comme pesée du jour
            if (p.poidsActuel !== profile.poidsActuel) addWeight(p.poidsActuel);
            setProfile(p); router.push("/");
          }} />
        </section>

        <p className="card text-sm leading-relaxed">
          💛 Cette appli donne des estimations, elle ne remplace pas l&apos;avis d&apos;un médecin ou d&apos;une diététicienne.
          Parles-en à un professionnel si l&apos;alimentation devient une source d&apos;angoisse.
        </p>
      </Pull>
    </div>
  );
}
