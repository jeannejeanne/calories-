# Mes calories 🌷✨

Application web mobile-first, girly et bienveillante : note ce que tu manges (texte ou photo), suis tes calories du jour et reçois un verdict doux adapté à ton objectif de perte de poids. Les données restent dans ton navigateur, pas de compte.

## Installation et lancement en 3 commandes

```bash
npm install
cp .env.example .env.local   # puis colle ta clé dans ANTHROPIC_API_KEY
npm run dev                  # ou : npm run build && npm start
```

Ouvre <http://localhost:3000>. Sans clé API, l'appli fonctionne quand même : tu ajoutes tes repas en mode manuel et le verdict utilise un texte de secours.

## Variables d'environnement (`.env.local`)

| Variable | Rôle |
|---|---|
| `ANTHROPIC_API_KEY` | Clé Anthropic, lue **uniquement côté serveur** (`/api/analyze` et `/api/verdict`) |
| `ANTHROPIC_MODEL` | Modèle utilisé (défaut `claude-sonnet-5-5`) |

`.env.local` est ignoré par Git.

## L'ouvrir sur ton téléphone

1. Ordinateur et téléphone sur le **même Wi-Fi**.
2. Lance `npm run dev` (le serveur écoute sur toutes les interfaces).
3. Trouve l'IP de ton ordinateur (`ipconfig getifaddr en0` sur Mac, `hostname -I` sur Linux, `ipconfig` sur Windows).
4. Sur le téléphone, ouvre `http://<IP-de-ton-ordi>:3000`.

### Ajouter à l'écran d'accueil
- **iPhone (Safari)** : bouton Partager → « Sur l'écran d'accueil ».
- **Android (Chrome)** : menu ⋮ → « Installer l'application » / « Ajouter à l'écran d'accueil ».

Pour l'utiliser partout, déploie l'appli en HTTPS (par ex. Vercel) en renseignant les variables d'environnement.

## Calculs (`lib/calc.ts`)
- Métabolisme de base (Mifflin-St Jeor, femme) : `10 × kg + 6,25 × cm − 5 × âge − 161`
- Dépense = métabolisme × 1,375 ; budget = dépense − 15 %, déficit plafonné à 500 kcal/jour
- Jour de danse : + 50 % de la dépense de la séance (5 MET × poids × 1 h)
- Garde-fous : jamais sous 1 400 kcal/jour, perte max 0,5 kg/semaine, message doux si moins de 1 200 kcal pendant 3 jours, objectif de poids limité à un IMC de 18,5
- Le budget se recalcule à chaque pesée

## Développement
- `npm test` : tests des calculs et des règles de verdict
- `npm run icons` : régénère les icônes PWA
- Stack : Next.js 15, TypeScript, Tailwind, zustand, Recharts, zod, `@anthropic-ai/sdk`

> Cette appli donne des estimations, elle ne remplace pas l'avis d'un médecin ou d'une diététicienne.
