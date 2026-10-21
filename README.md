# HTI-IMMO — Le logement étudiant, simplifié

Plateforme immobilière destinée aux étudiants en France : catalogue de logements,
recherche par ville et code postal, filtres précis, fiches détaillées, comptes
utilisateurs, favoris, demandes de logement et modération des annonces.

> **État du projet** : version applicative complète et testée, prête à être examinée.
> **Aucun déploiement en production n'a été effectué** et la branche `main` n'a pas été
> modifiée par le développement. Voir la section « Mise en production ».

---

## Sommaire

- [Stack technique](#stack-technique)
- [Démarrage rapide](#démarrage-rapide)
- [Variables d'environnement](#variables-denvironnement)
- [Scripts disponibles](#scripts-disponibles)
- [Structure du projet](#structure-du-projet)
- [Mode démonstration](#mode-démonstration)
- [Base de données et sécurité](#base-de-données-et-sécurité)
- [Tests](#tests)
- [Mise en production](#mise-en-production)
- [Documentation](#documentation)

---

## Stack technique

| Domaine           | Choix                                | Version                       |
| ----------------- | ------------------------------------ | ----------------------------- |
| Interface         | React                                | 19.3                          |
| Build             | Vite                                 | 7.3                           |
| Langage           | TypeScript (strict)                  | 5.9                           |
| Styles            | Tailwind CSS                         | 4.3                           |
| Routage           | React Router                         | 7.18                          |
| Validation        | Zod                                  | 4.6                           |
| Icônes            | Lucide React                         | 1.60                          |
| Backend           | Supabase (PostgreSQL, Auth, Storage) | `@supabase/supabase-js` 2.118 |
| Hébergement cible | Netlify (SPA statique)               | —                             |
| Tests             | Vitest, Testing Library, PGlite      | 5.0 / 16.3 / 0.5              |

Aucun framework CSS lourd, aucune dépendance d'administration tierce : le bundle
reste maîtrisé et chaque dépendance est auditée en CI.

---

## Démarrage rapide

Prérequis : **Node.js ≥ 20.19** (Node 22 recommandé) et npm ≥ 10.

```bash
# 1. Installer les dépendances
npm ci

# 2. Créer le fichier d'environnement
cp .env.example .env

# 3. Lancer le serveur de développement
npm run dev          # http://localhost:5173
```

Sans configuration Supabase, l'application démarre en **mode démonstration** :
le catalogue est peuplé d'annonces fictives clairement identifiées « Exemple »,
et un compte local permet de tester les parcours. Voir [Mode démonstration](#mode-démonstration).

---

## Variables d'environnement

Toutes les variables sont documentées dans [`.env.example`](.env.example).

| Variable                 | Obligatoire      | Exposition | Rôle                                               |
| ------------------------ | ---------------- | ---------- | -------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Oui (production) | Publique   | URL du projet Supabase                             |
| `VITE_SUPABASE_ANON_KEY` | Oui (production) | Publique   | Clé publique `anon`, protégée par RLS              |
| `VITE_SITE_URL`          | Recommandé       | Publique   | URL publique (redirections d'auth, SEO)            |
| `VITE_APP_NAME`          | Non              | Publique   | Nom affiché de la marque                           |
| `VITE_CONTACT_EMAIL`     | Non              | Publique   | Adresse de contact des pages légales               |
| `VITE_DEMO_MODE`         | Non              | Publique   | Force (`true`) ou désactive (`false`) le mode démo |

### ⚠️ Secrets — règles absolues

- **Ne jamais** placer de clé `service_role` ni de clé `sb_secret_…` dans une
  variable `VITE_*` : elles finiraient dans le bundle JavaScript public.
- **Ne jamais** committer `.env` (déjà ignoré par Git).
- Le code refuse activement une clé de type `service_role` : la configuration
  retombe alors en mode démonstration et une alerte est écrite dans la console
  (`src/lib/config.ts` + test dédié).
- Les mots de passe de base de données, jetons Netlify et clés d'administration
  ne doivent exister que dans les variables d'environnement serveur.

---

## Scripts disponibles

| Commande                          | Description                                              |
| --------------------------------- | -------------------------------------------------------- |
| `npm run dev`                     | Serveur de développement Vite (port 5173)                |
| `npm run build`                   | Build de production dans `dist/`                         |
| `npm run preview`                 | Prévisualisation locale du build                         |
| `npm run typecheck`               | Contrôle TypeScript strict (`tsc --noEmit`)              |
| `npm run lint`                    | ESLint (TypeScript + React Hooks)                        |
| `npm run format` / `format:check` | Prettier                                                 |
| `npm test`                        | Tests unitaires et d'intégration (jsdom)                 |
| `npm run test:coverage`           | Tests + rapport de couverture                            |
| `npm run test:db`                 | Tests PostgreSQL : schéma, contraintes, **RLS** (PGlite) |
| `npm run verify`                  | Typecheck + lint + tests + build                         |

---

## Structure du projet

```
.
├── .github/workflows/ci.yml     # CI : contrôles uniquement, aucun déploiement
├── docs/                        # Documentation technique détaillée
├── public/                      # Assets statiques, robots.txt, sitemap, visuels démo
├── src/
│   ├── auth/                    # Contexte d'authentification et session
│   ├── components/
│   │   ├── auth/                # Garde de routes
│   │   ├── layout/              # En-tête, pied de page, pages légales
│   │   ├── listings/            # Carte d'annonce, galerie, filtres, formulaire de demande
│   │   └── ui/                  # Design system (boutons, champs, alertes, pagination)
│   ├── data/                    # Jeu de démonstration, villes étudiantes
│   ├── favorites/               # Contexte des favoris
│   ├── hooks/                   # Hooks transverses (titre de page)
│   ├── lib/                     # Configuration, API, validation, formatage, sécurité
│   ├── pages/                   # Pages de l'application (dont pages légales)
│   ├── test/                    # Configuration et utilitaires de test
│   └── types/                   # Types métier
├── supabase/
│   ├── config.toml              # Configuration CLI locale (aucun projet distant)
│   ├── migrations/              # 4 migrations versionnées (schéma, triggers, RLS, storage)
│   ├── seed.demo.sql            # Données de démonstration — jamais exécuté automatiquement
│   └── tests/                   # Tests PostgreSQL réels (PGlite)
├── netlify.toml                 # Build, redirections SPA, en-têtes de sécurité
└── index.html                   # Entrée HTML, métadonnées SEO
```

---

## Mode démonstration

Le mode démonstration s'active **automatiquement** lorsque Supabase n'est pas
configuré, ou **explicitement** avec `VITE_DEMO_MODE=true`.

Ce qu'il fait :

- sert un catalogue de **12 annonces fictives** (`src/data/demo-listings.ts`),
  toutes préfixées `[EXEMPLE]` et marquées `is_demo: true` ;
- fournit des comptes locaux (`Étudiant`, `Bailleur`, `Administrateur`) pour
  parcourir les écrans protégés ;
- stocke favoris, annonces créées et demandes dans le `localStorage` du navigateur ;
- affiche un bandeau permanent rappelant le caractère fictif des données.

Ce qu'il ne fait pas : aucun appel réseau, aucune donnée envoyée à un tiers,
aucune création de compte réelle.

**En production, laissez `VITE_DEMO_MODE` vide ou à `false`** afin que le site
ne présente jamais de fausses annonces comme de véritables offres.

---

## Base de données et sécurité

Le schéma est versionné dans `supabase/migrations/` :

| Migration                      | Contenu                                                                |
| ------------------------------ | ---------------------------------------------------------------------- |
| `…0001_init_schema.sql`        | Tables, types énumérés, contraintes, index, index plein texte français |
| `…0002_functions_triggers.sql` | Fonctions métier, protection des rôles, modération, horodatages        |
| `…0003_rls_policies.sql`       | Row Level Security, privilèges par rôle                                |
| `…0004_storage.sql`            | Bucket `listing-photos` et politiques Storage (conditionnel)           |

Points clés :

- **RLS activée sur les 5 tables** ; `service_role` n'est jamais exposé au client.
- Un bailleur ne peut **pas publier lui-même** : le statut passe par une relecture
  par le staff (trigger `guard_listing_write`).
- Le rôle applicatif est **immuable côté client** (trigger `guard_profile_role`) ;
  seul un administrateur peut le modifier.
- Le rôle demandé à l'inscription est filtré sur une liste blanche
  (`student`, `owner`) : impossible de s'octroyer `admin` via les métadonnées.
- Les montants sont stockés en **centimes** (`integer`), jamais en flottant.
- Les chemins de photos sont contraints à `<owner_id>/<listing_id>/<fichier>`.

Détails complets : [`docs/SECURITY.md`](docs/SECURITY.md).

---

## Tests

```bash
npm test          # 157 tests — interface, logique métier, sécurité applicative
npm run test:db   # 56 tests  — PostgreSQL réel (PGlite) : schéma, contraintes, RLS
```

Les tests de base de données exécutent **les vraies migrations** dans PostgreSQL
compilé en WebAssembly, puis interrogent les tables en changeant de rôle
(`anon`, `authenticated`, service). Ils vérifient notamment qu'un étudiant ne
peut pas publier d'annonce, qu'un bailleur ne voit pas les brouillons des autres,
et qu'un visiteur ne peut pas lire les demandes de logement.

Résultats détaillés et limites : [`docs/TESTS.md`](docs/TESTS.md).

---

## Mise en production

La mise en ligne est **volontairement manuelle** et réservée au propriétaire du
dépôt (branche `main`, projet Supabase, site Netlify). Voir :

- [`docs/SUPABASE.md`](docs/SUPABASE.md) — création du projet, application des
  migrations, bucket de stockage, URLs d'authentification ;
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — build Netlify, variables,
  domaine, HTTPS, prévisualisations, procédure de retour arrière.

---

## Documentation

| Fichier                                        | Contenu                                             |
| ---------------------------------------------- | --------------------------------------------------- |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Architecture, flux de données, décisions techniques |
| [`docs/SECURITY.md`](docs/SECURITY.md)         | Modèle de menaces, RLS, secrets, en-têtes           |
| [`docs/SUPABASE.md`](docs/SUPABASE.md)         | Mise en place du backend, étape par étape           |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)     | Déploiement Netlify et exploitation                 |
| [`docs/TESTS.md`](docs/TESTS.md)               | Stratégie de test, résultats, éléments non testés   |

---

## Licence

Projet privé — tous droits réservés. Voir les mentions légales de l'application.
