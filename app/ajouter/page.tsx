"use client";
import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageTitle, Spinner } from "@/components/ui";
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
      const r = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texte: texte.trim() || undefined, image: mode === "photo" ? image ?? undefined : undefined }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (data.code === "no_key") {
          setErreur("L'analyse automatique n'est pas configurée (clé API absente). Pas de souci : ajoute ton repas à la main 💕");
          setMode("manuel"); setItems([blank()]);
        } else if (data.code === "invalid") {
          setErreur("Claude m'a répondu de façon inattendue. Réessaie, ou ajoute ton repas à la main.");
        } else if (data.code === "bad_request") {
          setErreur(data.message);
        } else {
          setErreur("Le service d'analyse est indisponible pour le moment. Tu peux réessayer ou saisir ton repas à la main.");
        }
        return;
      }
      setItems(data.aliments.map((a: Omit<FoodItem, "id">) => ({ ...a, id: newId() })));
    } catch {
      setErreur("Pas de connexion au service d'analyse. Vérifie ton réseau, ou saisis ton repas à la main.");
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
      <div className="space-y-4">
        <PageTitle sub={`${MEAL_EMOJI[meal]} ${MEAL_LABELS[meal]}`}>On vérifie ?</PageTitle>
        {erreur && <p className="rounded-2xl bg-jaune/40 p-3 text-sm font-semibold" role="alert">{erreur}</p>}
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
                <input className="input" inputMode="decimal" key={i.id + "q"} defaultValue={i.quantite}
                  onBlur={(e) => update(i.id, rescale(i, num(e.target.value)))} />
              </div>
              <div>
                <label className="label">Calories</label>
                <input className="input" inputMode="numeric" key={i.id + i.kcal} defaultValue={Math.round(i.kcal)}
                  onBlur={(e) => update(i.id, { kcal: num(e.target.value) })} />
              </div>
            </div>
            <p className="text-xs font-semibold text-prune/70">
              P {i.proteines} g · G {i.glucides} g · L {i.lipides} g{i.confiance && ` · confiance ${i.confiance}`}
            </p>
          </div>
        ))}
        <button className="btn-soft w-full" onClick={() => setItems([...items, blank()])}>+ Ajouter une ligne</button>
        <div className="card text-center">
          <p className="font-titre text-3xl font-bold text-framboise">{Math.round(t.kcal)} kcal</p>
          <p className="text-sm font-semibold text-prune/70">P {Math.round(t.proteines)} g · G {Math.round(t.glucides)} g · L {Math.round(t.lipides)} g</p>
          <p className="mt-2 text-xs text-prune/60">Estimation à environ ±20 % près, surtout pour les photos</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-soft" onClick={() => { setItems(null); setErreur(null); if (mode === "manuel") setMode("texte"); }}>Retour</button>
          <button className="btn-grad flex-1" onClick={enregistrer}>Enregistrer 💖</button>
        </div>
      </div>
    );
  }

  // ----- Saisie -----
  const peutAnalyser = mode === "texte" ? texte.trim().length > 1 : mode === "photo" ? !!image : false;
  return (
    <div className="space-y-4">
      <PageTitle sub="Écris ou prends en photo, je m'occupe du reste">Ajouter un repas</PageTitle>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choix du repas">
        {MEAL_ORDER.map((m) => (
          <button key={m} className="chip" aria-pressed={meal === m} onClick={() => setMeal(m)}>{MEAL_EMOJI[m]} {MEAL_LABELS[m]}</button>
        ))}
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Mode de saisie">
          {([["texte", "✍️ Écrire"], ["photo", "📷 Photo"], ["manuel", "🍽️ Manuel"]] as const).map(([k, l]) => (
            <button key={k} className="chip justify-center" aria-pressed={mode === k}
              onClick={() => { setMode(k); setErreur(null); if (k === "manuel") setItems([blank()]); }}>{l}</button>
          ))}
        </div>

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
              <button className="btn-ciel w-full !min-h-[96px] !rounded-3xl" onClick={() => fileRef.current?.click()}>📷 Prendre ou importer une photo</button>
            )}
          </div>
        )}

        {(mode === "texte" || mode === "photo") && (
          <div>
            <label className="label" htmlFor="texte">{mode === "photo" ? "Un petit détail ? (facultatif)" : "Qu'as-tu mangé ?"}</label>
            <textarea id="texte" className="input min-h-[110px] py-3" value={texte} onChange={(e) => setTexte(e.target.value)}
              placeholder="2 tranches de pain complet, 1 œuf, un café" />
          </div>
        )}

        {erreur && <p className="rounded-2xl bg-jaune/40 p-3 text-sm font-semibold" role="alert">{erreur}</p>}
        {loading ? <Spinner text="Je regarde ton assiette…" /> : (
          <button className="btn-grad w-full" disabled={!peutAnalyser} onClick={analyser}>Analyser ✨</button>
        )}
        <p className="text-center text-xs text-prune/60">Estimation à environ ±20 % près, surtout pour les photos</p>
      </div>
    </div>
  );
}

export default function Ajouter() {
  return <Suspense fallback={null}><AjouterInner /></Suspense>;
}
