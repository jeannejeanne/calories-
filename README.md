# Mes calories 🌷✨

Appli web mobile-first, girly et bienveillante : note ce que tu manges (texte ou photo), suis tes calories du jour et reçois un verdict doux adapté à ton objectif. Site 100 % statique publié sur **GitHub Pages**, données stockées sur ton téléphone, pas de compte.

## Mettre le site en ligne (3 étapes)

1. **Fusionner la branche** `claude/mes-calories-app-4xgmy9` dans la branche principale (ou la laisser telle quelle si c'est la seule branche).
2. Dans GitHub : **Settings → Pages → Build and deployment → Source : GitHub Actions**.
3. Le workflow `.github/workflows/pages.yml` construit et publie le site à chaque push (onglet **Actions** pour suivre). L'adresse est :
   **`https://jeannejeanne.github.io/calories-/`**

## L'installer sur ton téléphone
- **iPhone (Safari)** : bouton Partager → « Sur l'écran d'accueil ».
- **Android (Chrome)** : menu ⋮ → « Installer l'application ».

## Brancher l'IA (facultatif)
Crée une clé sur <https://console.anthropic.com> (menu « API keys »), puis colle-la dans **Réglages** de l'appli et touche « Enregistrer et tester ». Payant à l'usage (quelques euros suffisent) : pense à fixer une limite de dépenses. Le modèle par défaut est Sonnet 5.5 ; Haiku 5.5 (moins cher) et Opus 5.5 sont proposés. Sans clé, tout fonctionne en saisie manuelle et le verdict utilise un texte de secours.

🔒 La clé reste sur ton appareil (stockage local du navigateur) : jamais dans le code, jamais dans l'export JSON. N'utilise l'appli avec ta clé que sur tes propres appareils.

## Développer en local
```bash
npm install
npm run dev      # http://localhost:3000
npm test         # calculs et règles de verdict
```
Pour tester le build statique : `NEXT_PUBLIC_BASE_PATH=/calories- npm run build` (dossier `out/`).

## Calculs (`lib/calc.ts`)
- Métabolisme de base (Mifflin-St Jeor, femme) : `10 × kg + 6,25 × cm − 5 × âge − 161`
- Dépense = métabolisme × 1,375 ; budget = dépense − 15 %, déficit plafonné à 500 kcal/jour
- Jour de danse : + 50 % de la dépense de la séance (5 MET × poids × 1 h)
- Garde-fous : jamais sous 1 400 kcal/jour, perte max 0,5 kg/semaine, message doux si moins de 1 200 kcal pendant 3 jours, objectif limité à un IMC de 18,5
- Le budget se recalcule à chaque pesée

Stack : Next.js (export statique), TypeScript, Tailwind, zustand, Recharts, zod.

> Cette appli donne des estimations, elle ne remplace pas l'avis d'un médecin ou d'une diététicienne.
