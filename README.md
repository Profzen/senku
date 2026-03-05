# Senku

Plateforme SaaS de journal de trading (Next.js + MongoDB) basée sur le cahier des charges fourni.

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS
- MongoDB Atlas + Mongoose
- Recharts
- Lucide React (icônes pro, sans emoji)

## Démarrage local

1. Vérifier le fichier `.env`:

```dotenv
MONGODB_URI=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

2. Installer les dépendances:

```bash
npm install
```

3. Lancer le projet:

```bash
npm run dev
```

4. Ouvrir:

- Dashboard: `http://localhost:3000/dashboard`

## Seed de données de démo

Pour injecter un compte + des trades de démo dans MongoDB:

```bash
curl -X POST http://localhost:3000/api/seed
```

Ensuite recharger `http://localhost:3000/dashboard`.

## API disponibles

- `GET/POST /api/accounts`
- `GET/PATCH/DELETE /api/accounts/[id]`
- `GET/POST /api/trades`
- `GET/PATCH/DELETE /api/trades/[id]`
- `GET /api/stats`
- `POST /api/seed`

## Statut actuel

Implémenté:

- Architecture projet Senku
- Connexion MongoDB
- Modèles Mongoose: User, Account, Trade, Strategy
- Validation Zod des payloads principaux
- API CRUD de base (accounts, trades)
- API stats dashboard
- Dashboard UI initial avec KPI + charts + table trades

À implémenter (prochaines phases):

- Auth complète (NextAuth + JWT)
- Formulaires UI complets (ajout/edit trades/comptes)
- Journal psychologique avancé + score discipline dynamique
- Filtres avancés et export CSV/Excel/PDF
- Module statistiques avancées complet
