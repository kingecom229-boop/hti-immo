# Architecture — HTI-IMMO

## 1. Vue d'ensemble

```
Navigateur (React 19 + Vite)
   │
   │  HTTPS / fetch / websocket
   ▼
Supabase
   ├── PostgREST  ──► PostgreSQL (RLS + contraintes + triggers)
   ├── GoTrue     ──► authentification (JWT, e-mails)
   └── Storage    ──► bucket `listing-photos` (URL publiques, écriture contrôlée)
```

Le site est une **application monopage** (SPA) entièrement statique. Il n'y a
pas de serveur d'application propriétaire : toute la logique d'autorisation est
portée par PostgreSQL (Row Level Security), ce qui évite d'exposer une API
intermédiaire à sécuriser.

Hébergement : Netlify sert les fichiers de `dist/` et redirige toutes les URL
inconnues vers `index.html` (routage côté client).

## 2. Découpage du code

| Dossier                       | Responsabilité                           | Règle                                             |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------- |
| `src/pages/`                  | Écrans, orchestration des chargements    | Ne contient aucun accès direct au client Supabase |
| `src/components/`             | Présentation, formulaires, design system | Sans état métier global                           |
| `src/lib/`                    | Accès aux données, validation, formatage | **Seule** couche qui parle à Supabase             |
| `src/auth/`, `src/favorites/` | États transverses (session, favoris)     | Contexte React + hooks                            |
| `src/types/`                  | Types métier                             | Reflètent le schéma PostgreSQL                    |

Cette séparation permet de remplacer la source de données (mode démonstration ↔
Supabase) sans toucher aux écrans : chaque fonction de `src/lib/*-api.ts`
implémente les deux branches.

## 3. Flux de données principaux

### 3.1 Catalogue et recherche

1. Les filtres vivent **dans l'URL** (`?ville=Lyon&max=800&tri=price_asc`),
   ce qui rend chaque recherche partageable et compatible avec le bouton retour.
2. `parseFilters()` valide chaque paramètre (URL = entrée non fiable) : valeurs
   numériques bornées, tri et équipements sur liste blanche, page plafonnée.
3. `searchListings()` construit la requête PostgREST : `status = 'published'`,
   recherche plein texte `search_vector` (dictionnaire `french`), filtres typés,
   tri et pagination avec `count: 'exact'`.
4. En mode démonstration, `filterAndPaginateListings()` applique **les mêmes
   règles** en mémoire — la logique est testée unitairement.

### 3.2 Publication d'une annonce

```
Bailleur (statut draft / pending)
   └─► trigger guard_listing_write : owner_id forcé, publication refusée
         └─► Staff (modérateur/admin) : statut → published
               └─► trigger set_published_at : published_at renseigné
```

Un bailleur ne peut donc jamais publier sans relecture, même en manipulant
directement l'API REST avec son jeton.

### 3.3 Demande de logement

Le formulaire est accessible sans compte. La politique RLS impose que l'annonce
soit publiée et que `student_id` soit nul ou égal à l'utilisateur courant.
La lecture est réservée au bailleur de l'annonce, à l'auteur et au staff.

## 4. Décisions techniques

| Décision                              | Justification                                                                                                                                                                                                    |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SPA Vite** plutôt que SSR           | Aucune donnée sensible rendue côté serveur, déploiement statique simple et peu coûteux, build rapide. Le SEO des pages publiques est traité par métadonnées statiques ; un passage à Next.js resterait possible. |
| **Supabase** plutôt qu'une API maison | PostgreSQL + Auth + Storage gérés, RLS native : la sécurité est déclarative et testable en SQL.                                                                                                                  |
| **RLS comme unique source de vérité** | Les gardes de routes React ne sont qu'un confort d'interface ; un utilisateur qui les contourne n'obtient aucune donnée supplémentaire.                                                                          |
| **Montants en centimes (`integer`)**  | Évite toute erreur d'arrondi flottant sur de l'argent.                                                                                                                                                           |
| **Recherche plein texte en base**     | `tsvector` généré + index GIN : tolérance aux accents et aux pluriels, performant sur catalogue moyen.                                                                                                           |
| **Zod partagé**                       | Un seul schéma pour les formulaires et la normalisation ; les contraintes SQL restent la seconde barrière.                                                                                                       |
| **PGlite pour les tests SQL**         | PostgreSQL réellement exécuté, sans service externe ni risque pour la production.                                                                                                                                |
| **Mode démonstration explicite**      | Permet d'évaluer l'interface sans backend, tout en garantissant qu'aucune fausse annonce ne soit présentée comme réelle.                                                                                         |

## 5. Performance

- Découpage des chunks : `react`, `supabase`, reste de l'application.
- Images : `loading="lazy"`, `decoding="async"`, dimensions explicites (limite
  les décalages de mise en page).
- Index SQL ciblés : statut + date de publication, ville, code postal, loyer,
  type, propriétaire, GIN sur `search_vector` et `amenities`.
- Pagination serveur (`range`) : le client ne charge jamais tout le catalogue.

## 6. Accessibilité

- Structure sémantique (`header`, `nav`, `main`, `footer`, listes, titres hiérarchisés).
- Lien d'évitement « Aller au contenu principal ».
- Formulaires : `label` associé, `aria-invalid`, `aria-describedby`, messages
  d'erreur avec `role="alert"`.
- Composants interactifs accessibles au clavier (galerie avec `Échap` et flèches,
  menu mobile avec `aria-expanded`, onglets avec `role="tablist"`).
- Respect de `prefers-reduced-motion`.
- Contrastes vérifiés sur la palette (texte sur `ink-950`, accents sur `sand-50`).

## 7. Évolution envisagée

1. Rendu serveur (Next.js) ou pré-rendu des pages catalogue pour le SEO local.
2. Messagerie interne chiffrée remplaçant la mise en relation par e-mail.
3. Vérification d'identité des bailleurs et badge « vérifié ».
4. Carte interactive (Leaflet) à partir des colonnes `latitude`/`longitude`
   déjà présentes mais inutilisées.
5. Signature électronique du bail et état des lieux.
