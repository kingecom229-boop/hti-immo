# Tests et validation — HTI-IMMO

Toutes les commandes ci-dessous ont été **réellement exécutées** sur le dépôt.
Les résultats sont reportés tels quels, y compris pour ce qui n'a pas pu être
testé faute d'accès externe.

---

## 1. Commandes

| Commande                       | Portée                              | Résultat                     |
| ------------------------------ | ----------------------------------- | ---------------------------- |
| `npm ci`                       | Installation reproductible          | ✅ 282 paquets installés     |
| `npm run typecheck`            | `tsc --noEmit`, mode strict         | ✅ 0 erreur                  |
| `npm run lint`                 | ESLint (TypeScript + React Hooks)   | ✅ 0 erreur, 0 avertissement |
| `npm run format:check`         | Prettier                            | ✅ conforme                  |
| `npm test`                     | 17 fichiers, **157 tests**          | ✅ 157 réussis               |
| `npm run test:db`              | 2 fichiers, **56 tests** PostgreSQL | ✅ 56 réussis                |
| `npm run build`                | Build de production Vite            | ✅ 2 151 modules, ~3,5 s     |
| `npm run test:coverage`        | Couverture V8                       | ✅ seuils atteints           |
| `npm audit --audit-level=high` | Dépendances vulnérables             | ✅ 0 vulnérabilité           |

### Couverture mesurée (interface)

```
Statements   : 56,46 %
Branches     : 49,72 %
Functions    : 55,88 %
Lines        : 59,32 %
```

Seuils « plancher » configurés dans `vitest.config.ts` : 52 / 45 / 50 / 55.
Ils servent de garde-fou anti-régression, et non d'objectif de qualité maximal :
les pages d'administration, les pages légales et les formulaires de connexion
restent partiellement couverts.

## 2. Ce que couvrent les tests unitaires et d'intégration (jsdom)

| Fichier                                        | Sujets                                                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/format.test.ts`                       | Montants, surfaces, dates, normalisation des accents, pluriels                                                            |
| `src/lib/validation.test.ts`                   | Politique de mot de passe, codes postaux, téléphones, e-mails, annonces, échappement HTML                                 |
| `src/lib/search-params.test.ts`                | Lecture/écriture d'URL, rejet des valeurs invalides, aller-retour stable                                                  |
| `src/lib/listing-filters.test.ts`              | Filtrage (ville, CP, prix, surface, équipements), tri, pagination, anti-injection                                         |
| `src/lib/config.test.ts`                       | Détection du mode démo, refus d'une clé `service_role`                                                                    |
| `src/components/ui/pagination-utils.test.ts`   | Calcul des pages avec ellipses                                                                                            |
| `src/components/listings/ListingCard.test.tsx` | Rendu, badge « Exemple », lien de détail, favori sans compte                                                              |
| `src/components/listings/InquiryForm.test.tsx` | Validation, consentement, enregistrement de la demande                                                                    |
| `src/App.test.tsx`                             | Accueil, navigation, filtrage par URL, 404, pages légales, mode démo, route protégée                                      |
| `src/pages/*.test.tsx`                         | Détail d'annonce, inscription, favoris, administration, espace personnel, formulaire d'annonce, contact, réinitialisation |

## 3. Tests de base de données (PostgreSQL réel via PGlite)

`npm run test:db` exécute les **quatre migrations réelles** dans PostgreSQL
compilé en WebAssembly, puis interroge les tables en changeant de rôle
(`anon`, `authenticated`, `service`). Aucune connexion à Supabase n'est
nécessaire : la production n'est jamais sollicitée.

### `supabase/tests/schema.test.ts` (19 tests)

- présence des 5 tables et des index de recherche ;
- **RLS activée sur toutes les tables** ;
- vecteur plein texte français généré correctement ;
- contraintes : loyer minimum, code postal, longueur du titre, liste blanche
  des équipements, unicité des favoris, chemins de photos ;
- triggers : création de profil à l'inscription, filtrage du rôle demandé,
  `updated_at`, `published_at`, suppression en cascade ;
- protection du rôle (auto-promotion refusée, promotion administrateur permise) ;
- `owner_id` forcé à l'auteur de la création.

### `supabase/tests/rls.test.ts` (37 tests)

- **Visiteur** : lit uniquement les annonces publiées, ne lit ni profils ni
  demandes (privilège refusé), peut envoyer une demande sur une annonce
  publiée mais pas sur un brouillon ;
- **Étudiant** : ne voit que son profil, ne peut pas modifier celui d'autrui,
  ne peut pas créer d'annonce, gère uniquement ses favoris, ne voit pas les
  demandes des autres ;
- **Bailleur** : voit ses brouillons mais pas ceux des autres, **ne peut pas
  publier lui-même**, ne peut pas modifier l'annonce d'un tiers, pas de
  changement de `owner_id` ni de `is_demo`, photos limitées à son dossier ;
- **Staff** : lecture complète, publication, modification de rôle (admin
  uniquement), refus pour un modérateur ;
- **Cohérence** : aucune table publique sans RLS, fonctions internes non
  exécutables par les clients.

## 4. Vérifications de sécurité réalisées

| Vérification                           | Méthode                                  | Résultat                                                   |
| -------------------------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| Aucun secret dans le bundle            | `grep` sur `dist/` (aussi exécuté en CI) | ✅ aucun `service_role`, `sb_secret_`, mot de passe ni DSN |
| `.env` ignoré                          | `.gitignore` + `git status`              | ✅ absent du suivi Git                                     |
| Clé `service_role` refusée côté client | test unitaire `config.test.ts`           | ✅ bascule en mode démo                                    |
| RLS sur toutes les tables              | test SQL itératif                        | ✅                                                         |
| Escalade de rôle par métadonnées       | test SQL                                 | ✅ filtrée                                                 |
| Escalade de rôle par `UPDATE`          | test SQL                                 | ✅ refusée (42501)                                         |
| Publication sans modération            | test SQL                                 | ✅ refusée (42501)                                         |
| Injection de syntaxe PostgREST         | `sanitizeFilterValue` + tests            | ✅ neutralisée                                             |
| Chemins de stockage malveillants       | contrainte + trigger + tests             | ✅ refusés                                                 |
| En-têtes HTTP                          | `netlify.toml`                           | ✅ configurés (non vérifiés en ligne, aucun déploiement)   |

## 5. Éléments NON testés ou BLOQUÉS

| Élément                                                                    | Statut        | Raison                                                            |
| -------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------- |
| Connexion réelle à Supabase (inscription, confirmation e-mail)             | **BLOQUÉ**    | Aucun projet Supabase ni identifiants fournis                     |
| Application des migrations sur Supabase                                    | **BLOQUÉ**    | Nécessite votre compte                                            |
| Stockage des photos sur Supabase Storage                                   | **BLOQUÉ**    | Aucun bucket réel ; le code et les politiques sont testés en SQL  |
| Déploiement Netlify et en-têtes de production                              | **BLOQUÉ**    | Aucun site Netlify fourni ; configuration prête mais non déployée |
| Vérification visuelle dans un navigateur réel (responsive, Safari/Firefox) | **NON TESTÉ** | Tests jsdom uniquement, aucune session navigateur                 |
| Tests end-to-end Playwright                                                | **NON TESTÉ** | Hors périmètre de cette itération                                 |
| Envoi d'e-mails transactionnels                                            | **NON TESTÉ** | Nécessite un fournisseur SMTP                                     |
| Audit des dépendances (`npm audit --audit-level=high`)                     | ✅ **RÉUSSI** | 0 vulnérabilité détectée (la CI le rejoue)                        |
| Mesure de performance réelle (Lighthouse)                                  | **NON TESTÉ** | Nécessite un déploiement                                          |

## 6. Note sur une règle ESLint désactivée

`react-hooks/set-state-in-effect` (nouvelle règle issue du React Compiler) est
**désactivée avec justification** dans `eslint.config.js` : elle signale le
chargement de données dans un effet (`setLoading(true)` puis `fetch`), qui est
le modèle retenu dans toutes les pages. Les règles de correction
(`purity`, `rules-of-hooks`, `exhaustive-deps`) restent actives. Aucun test
n'a été désactivé ou affaibli pour obtenir un résultat positif.
