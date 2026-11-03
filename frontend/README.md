# Najahni — Frontend

React 18 + TypeScript + Vite · Tailwind CSS · TanStack Query · Zustand · React Hook Form + Zod · react-i18next (FR / AR)

## Lancer

```powershell
# 1. Backend (dans api/)
npm run start:dev

# 2. Frontend (dans frontend/)
npm install
npm run dev        # http://localhost:5173
```

Vite redirige `/api/*` vers le backend (`http://localhost:3000`), voir `vite.config.ts`.

## Organisation de `src/`

```
src/
├── app/App.tsx            Fournisseurs globaux (React Query, routeur, notifications)
├── routes/                TOUTES les URL de l'application
│   ├── index.tsx          Carte des routes (login, layout, 404)
│   ├── guards.tsx         Protection : connecte ? bon role ?
│   ├── admin.routes.tsx   /admin/...
│   ├── teacher.routes.tsx /teacher/...
│   ├── student.routes.tsx /student/...
│   └── parent.routes.tsx  /parent/...
├── actors/                Fonctionnalites PAR ACTEUR (meme decoupage que l'API)
│   ├── admin/
│   │   ├── api/           Appels HTTP + hooks React Query (1 fichier par ressource)
│   │   ├── components/    Formulaires et dialogues propres a l'admin
│   │   └── pages/         Pages affichees par les routes
│   ├── teacher/  student/  parent/   (meme structure)
│   └── common/pages/      Connexion, profil, 404
├── components/
│   ├── ui/                Briques de base (Button, Input, Dialog, Table...)
│   ├── shared/            Composants metier reutilisables (Pagination, ConfirmDialog...)
│   └── layout/            Menu lateral, barre du haut, nav.config.ts
└── core/                  Technique partagee
    ├── api/               Client axios (jeton + renouvellement auto), types, erreurs
    ├── auth/              Session (Zustand), connexion / deconnexion
    ├── i18n/              Traductions fr.ts / ar.ts (+ RTL automatique)
    ├── theme/             Mode clair / sombre
    └── lib/               Formatage (TND, dates), validation, utilitaires
```

## Ajouter une page (exemple : « Paiements » pour l'admin)

1. `actors/admin/api/payments.api.ts` — types + hooks (`usePayments`, `useCreatePayment`)
2. `actors/admin/pages/PaymentsPage.tsx` — la page
3. `routes/admin.routes.tsx` — `{ path: 'payments', ...lazyPage(() => import(...), 'PaymentsPage') }`
4. `components/layout/nav.config.ts` — l'entree du menu
5. `core/i18n/locales/fr.ts` et `ar.ts` — les textes (TypeScript signale une cle manquante)
