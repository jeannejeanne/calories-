"use client";
import Link from "next/link";
import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Hero, Pull, Spinner } from "@/components/ui";
import { AiError, analyzeMeal } from "@/lib/ai";
import { rescale, sumItems } from "@/lib/calc";
import { resizeImage, thumbnail } from "@/lib/image";
import { newId, useStore } from "@/lib/store";
import { MEAL_EMOJI, MEAL_LABELS, MEAL_ORDER, type FoodItem, type MealType } from "@/lib/types";

type Mode = "texte" | "photo" | "manuel";

const defaultMeal = (): MealType => {
  const h = new Date().getHours();
  return h < 10 ? "petit-dej" : h < 15 ? "dejeuner" : h < 18 ? "collation" : "diner";
};
const blank = (): FoodItem => ({ id: newId(), nom: "", quantite: 1, unite: "unité", kcal: 0, proteines: 0, glucides: 0, lipides: 0 });

function AjouterInner() {
  const router = useRouter();
  const params = useSearchParams();
  const addMeal = useStore((s) => s.addMeal);
  const apiKey = useStore((s) => s.apiKey);
  const model = useStore((s) => s.model);
  const initial = params.get("repas") as MealType | null;
  const [meal, setMeal] = useState<MealType>(initial && MEAL_ORDER.includes(initial) ? initial : defaultMeal());
  const [mode, setMode] = useState<Mode>("texte");
  const [texte, setTexte] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [items, setItems] = useState<FoodItem[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(f?: File) {
    if (!f) return;
    setErreur(null);
    try { setImage(await resizeImage(f, 1024)); } catch { setErreur("Je n'arrive pas à lire cette image, essaie-en une autre."); }
  }

  async function analyser() {
    setErreur(null);
    setLoading(true);
    try {
      const r = await analyzeMeal({ apiKey, model, texte: texte.trim() || undefined, image: mode === "photo" ? image ?? undefined : undefined });
      setItems(r.aliments.map((a) => ({ ...a, id: newId() })));
    } catch (e) {
      const code = e instanceof AiError ? e.code : "network";
      if (code === "no_key") { setErreur("Ajoute ta clé dans Réglages pour l'analyse automatique. En attendant, tu peux saisir ton repas à la main 💕"); setMode("manuel"); setItems([blank()]); }
      else if (code === "auth") setErreur("Ta clé API a été refusée. Vérifie-la dans Réglages.");
      else if (code === "invalid") setErreur("Claude m'a répondu de façon inattendue. Réessaie, ou ajoute ton repas à la main.");
      else setErreur("Pas de connexion au service d'analyse. Vérifie ton réseau, ou saisis ton repas à la main.");
    } finally { setLoading(false); }
  }

  async function enregistrer() {
    const ok = (items ?? []).filter((i) => i.nom.trim());
    if (!ok.length) return setErreur("Ajoute au moins un aliment avec un nom.");
    const photo = mode === "photo" && image ? await thumbnail(image) : undefined;
    addMeal(meal, ok, photo);
    router.push("/");
  }

  const update = (id: string, patch: Partial<FoodItem>) => setItems((l) => l!.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const num = (s: string) => Math.max(0, parseFloat(s.replace(",", ".")) || 0);

  // ----- Écran de confirmation -----
  if (items) {
    const t = sumItems(items);
    return (
      <div>
        <Hero title="On vérifie ?" sub={`${MEAL_EMOJI[meal]} ${MEAL_LABELS[meal]}`} />
        <Pull>
          {erreur && <p className="card !p-3 text-sm font-semibold" role="alert">{erreur}</p>}
          {items.map((i) => (
            <div key={i.id} className="card space-y-3">
              <div className="flex gap-2">
                <input className="input" aria-label="Nom de l'aliment" placeholder="Aliment" value={i.nom} onChange={(e) => update(i.id, { nom: e.target.value })} />
                <button aria-label="Supprimer cet aliment" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-prune/5"
                  onClick={() => setItems(items.filter((x) => x.id !== i.id))}>🗑️</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Quantité ({i.unite === "unité" ? "unités" : i.unite})</label>
                  <input className="input" inputMode="decimal" key={i.id + "q"} defaultValue={i.quantite} onBlur={(e) => update(i.id, rescale(i, num(e.target.value)))} />
                </div>
                <div>
                  <label className="label">Calories</label>
                  <input className="input" inputMode="numeric" key={i.id + i.kcal} defaultValue={Math.round(i.kcal)} onBlur={(e) => update(i.id, { kcal: num(e.target.value) })} />
                </div>
              </div>
              <p className="text-xs font-semibold text-prune/70">P {i.proteines} g · G {i.glucides} g · L {i.lipides} g{i.confiance && ` · confiance ${i.confiance}`}</p>
            </div>
          ))}
          <button className="btn-soft w-full" onClick={() => setItems([...items, blank()])}>+ Ajouter une ligne</button>
          <div className="card text-center">
            <p className="font-titre text-4xl font-extrabold text-framboise">{Math.round(t.kcal)} kcal</p>
            <p className="text-sm font-semibold text-prune/70">P {Math.round(t.proteines)} g · G {Math.round(t.glucides)} g · L {Math.round(t.lipides)} g</p>
            <p className="mt-2 text-xs text-prune/70">Estimation à environ ±20 % près, surtout pour les photos</p>
          </div>
          <div className="flex gap-3">
            <button className="btn-soft" onClick={() => { setItems(null); setErreur(null); if (mode === "manuel") setMode("texte"); }}>Retour</button>
            <button className="btn-grad flex-1" onClick={enregistrer}>Enregistrer 💖</button>
          </div>
        </Pull>
      </div>
    );
  }

  // ----- Saisie -----
  const peutAnalyser = mode === "texte" ? texte.trim().length > 1 : mode === "photo" ? !!image : false;
  return (
    <div>
      <Hero title="Ajouter un repas" sub="Écris ou prends en photo ✨" />
      <Pull>
        <div className="card">
          <p className="label mb-2">C&apos;est quel repas ?</p>
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Choix du repas">
            {MEAL_ORDER.map((m) => (
              <button key={m} className="tile" aria-pressed={meal === m} onClick={() => setMeal(m)}>
                <span className="text-2xl" aria-hidden>{MEAL_EMOJI[m]}</span>
                <span className="text-[11px] leading-tight">{m === "petit-dej" ? "Petit-déj" : m === "dejeuner" ? "Déj" : m === "diner" ? "Dîner" : "Collation"}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card space-y-4">
          <div className="grid grid-cols-3 gap-1 rounded-full bg-prune/5 p-1" role="group" aria-label="Mode de saisie">
            {([["texte", "✍️ Écrire"], ["photo", "📷 Photo"], ["manuel", "🍽️ Manuel"]] as const).map(([k, l]) => (
              <button key={k} aria-pressed={mode === k}
                className={`min-h-[44px] rounded-full text-sm font-bold transition ${mode === k ? "bg-white text-framboise shadow" : "text-prune/70"}`}
                onClick={() => { setMode(k); setErreur(null); if (k === "manuel") setItems([blank()]); }}>{l}</button>
            ))}
          </div>

          {!apiKey && (
            <Link href="/reglages/" className="block rounded-2xl bg-jaune/50 p-3 text-sm font-bold">
              🔑 Ajoute ta clé Anthropic dans Réglages pour l&apos;analyse automatique →
            </Link>
          )}

          {mode === "photo" && (
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              {image ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="Aperçu du repas" className="max-h-64 w-full rounded-3xl object-cover" />
                  <button className="btn-soft absolute bottom-3 right-3 bg-white/90" onClick={() => fileRef.current?.click()}>Changer</button>
                </div>
              ) : (
                <button className="btn-ciel w-full !min-h-[110px] !rounded-3xl text-lg" onClick={() => fileRef.current?.click()}>📷 Prendre ou importer une photo</button>
              )}
            </div>
          )}

          {(mode === "texte" || mode === "photo") && (
            <div>
              <label className="label" htmlFor="texte">{mode === "photo" ? "Un petit détail ? (facultatif)" : "Qu'as-tu mangé ?"}</label>
              <textarea id="texte" className="input min-h-[110px] py-3" value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="2 tranches de pain complet, 1 œuf, un café" />
            </div>
          )}

          {erreur && <p className="rounded-2xl bg-jaune/50 p-3 text-sm font-semibold" role="alert">{erreur}</p>}
          {loading ? <Spinner text="Je regarde ton assiette…" /> : (
            <button className="btn-grad w-full !min-h-[56px] text-lg" disabled={!peutAnalyser} onClick={analyser}>Analyser ✨</button>
          )}
          <p className="text-center text-xs text-prune/70">Estimation à environ ±20 % près, surtout pour les photos</p>
        </div>
      </Pull>
    </div>
  );
}

export default function Ajouter() {
  return <Suspense fallback={null}><AjouterInner /></Suspense>;
}
