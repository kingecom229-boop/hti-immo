# Sécurité — HTI-IMMO

## 1. Principes

1. **Le client n'est jamais une autorité.** Les gardes de routes React
   (`ProtectedRoute`) et les validations Zod améliorent l'expérience ; la
   sécurité réelle est appliquée par PostgreSQL (RLS, contraintes, triggers).
2. **Moindre privilège.** `anon` ne peut presque rien lire, `authenticated` est
   limité à ses propres données, `service_role` n'existe jamais côté navigateur.
3. **Refus par défaut.** Toute table sans politique RLS est inaccessible ; un
   test automatisé vérifie qu'aucune table du schéma `public` n'est sans RLS.
4. **Aucun secret dans le dépôt.** `.env` est ignoré ; le bundle est analysé en CI.

## 2. Modèle de rôles

| Rôle           | Portée             | Peut faire                                                                               | Ne peut pas faire                                                       |
| -------------- | ------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `anon`         | Visiteur           | Lire les annonces publiées et leurs photos ; envoyer une demande sur une annonce publiée | Lire les profils, les demandes, les favoris ; écrire une annonce        |
| `student`      | Étudiant           | Gérer son profil, ses favoris, ses demandes                                              | Créer une annonce, lire le profil d'autrui, changer de rôle             |
| `owner`        | Bailleur           | Créer/modifier ses annonces, répondre aux demandes reçues                                | Publier sans modération, toucher aux annonces d'autrui, changer de rôle |
| `moderator`    | Équipe             | Voir toutes les annonces et demandes, publier/refuser                                    | Promouvoir un rôle                                                      |
| `admin`        | Équipe             | Tout ce qui précède + modifier les rôles                                                 | Accéder au `service_role` depuis le client                              |
| `service_role` | Serveur uniquement | Administration complète, contourne RLS                                                   | — (jamais exposé)                                                       |

## 3. Politiques RLS en place

### `profiles`

- `SELECT` : propriétaire du profil ou staff.
- `UPDATE` : propriétaire (hors rôle) ou administrateur.
- `INSERT` : uniquement son propre identifiant (le trigger d'inscription le fait).
- `DELETE` : aucune politique → suppression via suppression du compte (cascade).

### `listings`

- `SELECT` : `status = 'published'` **ou** propriétaire **ou** staff.
- `INSERT` : `owner_id = auth.uid()` **et** rôle ∈ {owner, moderator, admin}.
- `UPDATE` / `DELETE` : propriétaire ou staff.
- Triggers : propriétaire immuable, `is_demo` réservé au staff, publication
  réservée au staff, `published_at` géré automatiquement.

### `listing_photos`

- `SELECT` : si l'annonce parente est visible.
- `INSERT`/`UPDATE`/`DELETE` : propriétaire de l'annonce ou staff.
- Trigger : chemin imposé `<owner_id>/<listing_id>/<fichier>` (pas de `../`,
  pas de chemin absolu, pas d'URL).

### `favorites`

- `SELECT`/`INSERT`/`DELETE` : uniquement `user_id = auth.uid()`, et seulement
  pour une annonce publiée.

### `inquiries`

- `INSERT` : ouvert à `anon` et `authenticated`, uniquement sur une annonce
  publiée ; `student_id` nul ou égal à soi-même.
- `SELECT`/`UPDATE` : bailleur de l'annonce, auteur de la demande ou staff.
- `DELETE` : staff uniquement.

### `storage.objects` (bucket `listing-photos`)

- Lecture publique (bucket public, nécessaire aux `<img>`).
- Écriture limitée au dossier `(storage.foldername(name))[1] = auth.uid()`.
- Types MIME restreints (`image/jpeg`, `image/png`, `image/webp`), 5 Mo maximum,
  contrôlés **aussi** côté client avant l'envoi.

## 4. Escalade de privilèges : protections vérifiées

| Attaque                                            | Protection                                         | Test                            |
| -------------------------------------------------- | -------------------------------------------------- | ------------------------------- |
| S'inscrire avec `role: admin` dans les métadonnées | `handle_new_user` filtre sur `('student','owner')` | `schema.test.ts`                |
| `UPDATE profiles SET role='admin'`                 | Trigger `guard_profile_role` + politique RLS       | `schema.test.ts`, `rls.test.ts` |
| Publier une annonce sans modération                | Trigger `guard_listing_write`                      | `rls.test.ts`                   |
| Changer `owner_id` d'une annonce                   | Trigger (levée `42501`)                            | `rls.test.ts`                   |
| Lire le profil d'un autre utilisateur              | RLS `profiles_select_own`                          | `rls.test.ts`                   |
| Lire les demandes d'un autre bailleur              | RLS `inquiries_select_involved`                    | `rls.test.ts`                   |
| Injecter un chemin `../` dans le stockage          | Contrainte + trigger de chemin                     | `schema.test.ts`                |
| S'octroyer un favori au nom d'un tiers             | `WITH CHECK (user_id = auth.uid())`                | `rls.test.ts`                   |

## 5. Secrets et configuration

- Seules les variables `VITE_*` sont exposées au bundle. La clé `anon` est
  publique **par conception** : sa portée est strictement limitée par RLS.
- `resolveConfig()` refuse une clé qui ressemble à `service_role` ou `sb_secret_`
  et bascule en mode démonstration, avec un message d'erreur explicite.
- `.gitignore` exclut `.env`, `.env.*` (sauf `.env.example`), `dist/`, `coverage/`
  et les fichiers Supabase locaux.
- La CI analyse `dist/` à la recherche de `service_role`, `sb_secret_`,
  `SUPABASE_DB_PASSWORD` et de chaînes de connexion PostgreSQL.

## 6. En-têtes HTTP (Netlify)

`netlify.toml` applique :

- `Content-Security-Policy` : `default-src 'self'`, `script-src 'self'`,
  connexions limitées au site et à `*.supabase.co` (HTTPS + WSS),
  `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`.
- `X-Frame-Options: DENY` (anti-clickjacking, redondant avec `frame-ancestors`).
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` : caméra, micro, géolocalisation, paiement, USB désactivés.
- `Cross-Origin-Opener-Policy: same-origin`.

> La CSP autorise `'unsafe-inline'` pour les styles uniquement (Tailwind injecte
> des styles inline au chargement). Aucun script inline n'est autorisé.

## 7. Données personnelles (RGPD)

- Minimisation : seules les données nécessaires au service sont demandées.
- Consentement explicite sur le formulaire de demande de logement.
- Aucun traceur publicitaire, aucun outil de mesure d'audience tiers.
- Droits d'accès, de rectification et d'effacement décrits dans la page
  `Confidentialité` ; suppression du compte en cascade sur toutes les données.
- Textes légaux à compléter avec l'identité réelle de l'éditeur avant mise en
  ligne (champs `[À COMPLÉTER]` explicitement signalés dans l'interface).

## 8. Risques résiduels connus

| Risque                                                     | Niveau                    | Mitigation / suite                                                                  |
| ---------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------- |
| Absence de limitation de débit sur les formulaires publics | Moyen                     | Activer le rate limiting Supabase / Netlify, ou ajouter un captcha (non implémenté) |
| Pas de vérification d'identité des bailleurs               | Moyen                     | Modération humaine ; badge « vérifié » à ajouter                                    |
| Envoi d'e-mails transactionnels non configuré (SMTP)       | Faible                    | Configurer un fournisseur SMTP dans Supabase                                        |
| Textes légaux non finalisés                                | Élevé avant mise en ligne | Compléter et faire valider juridiquement                                            |
| Aucun test end-to-end navigateur (Playwright)              | Faible                    | Tests d'intégration jsdom en place ; E2E à ajouter                                  |
