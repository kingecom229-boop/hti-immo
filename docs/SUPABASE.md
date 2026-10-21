# Mise en place de Supabase — HTI-IMMO

> ⚠️ **Ces opérations nécessitent VOTRE compte Supabase.** Aucune n'a été
> effectuée par l'agent : aucune base réelle n'a été créée, modifiée ou migrée.
> Exécutez-les dans l'ordre, en environnement de test d'abord.

---

## 1. Créer le projet

1. Connectez-vous à <https://supabase.com/dashboard>.
2. **New project** :
   - Nom : `hti-immo`
   - Mot de passe de base de données : générez-le et stockez-le dans un
     gestionnaire de secrets (**jamais** dans Git).
   - **Région : European Union** (ex. Francfort) pour limiter les transferts
     hors UE et faciliter la conformité RGPD.
3. Notez le **Project URL** et la clé **anon public**
   (`Project Settings → API`).

## 2. Renseigner les variables d'environnement

```bash
cp .env.example .env
```

```dotenv
VITE_SUPABASE_URL=https://<votre-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<clé anon publique>
VITE_SITE_URL=http://localhost:5173
VITE_DEMO_MODE=false
```

Puis `npm run dev` : le bandeau « Mode démonstration » doit disparaître.

> ⚠️ Si le bandeau reste affiché, la configuration n'est pas reconnue
> (URL invalide ou clé manifestement secrète). Vérifiez la console.

## 3. Appliquer les migrations

### Option A — CLI Supabase (recommandée)

```bash
# Installer la CLI si nécessaire
npm install -g supabase        # ou : brew install supabase/tap/supabase

# Lier le projet (action volontaire)
supabase login
supabase link --project-ref <votre-ref>

# Vérifier ce qui sera appliqué, sans rien modifier
supabase migration list
supabase db diff --linked

# Appliquer les 4 migrations
supabase db push
```

Les migrations sont **additives** : elles créent des tables, types, index,
fonctions et politiques. Elles ne suppriment aucune donnée existante.

### Option B — Éditeur SQL du dashboard (sans CLI)

Trois fichiers prêts à coller se trouvent dans **`supabase/sql-editor/`** :

1. **`01_schema_complet.sql`** — les 4 migrations concaténées, à coller d'un bloc
   puis à exécuter. Résultat attendu : `Success. No rows returned`.
2. **`02_verifications.sql`** — contrôle lecture seule de l'installation
   (10 vérifications). Tout doit renvoyer `OK`.
3. **`03_premier_administrateur.sql`** — promotion de ton compte en `admin`
   (remplacer `remplace-moi@exemple.fr`).

Ces scripts sont idempotents et transactionnels : ils peuvent être rejoués sans
risque. Ils ont été validés dans PostgreSQL réel avant livraison.
Voir [`supabase/sql-editor/README.md`](../supabase/sql-editor/README.md).

## 4. Vérifier le backend

Dans `SQL Editor` :

```sql
-- Les 5 tables doivent avoir rowsecurity = true
select relname, relrowsecurity
from pg_class
where relname in ('profiles','listings','listing_photos','favorites','inquiries');

-- Le trigger de création de profil doit exister
select tgname from pg_trigger where tgname = 'on_auth_user_created';

-- Le bucket doit être présent
select id, public, file_size_limit from storage.buckets where id = 'listing-photos';
```

Puis, depuis l'application :

1. Créez un compte « Bailleur » ; vérifiez qu'une ligne apparaît dans
   `public.profiles` avec `role = 'owner'`.
2. Créez une annonce : elle doit être enregistrée avec `status = 'pending'`.
3. Depuis le tableau de bord, passez `status` à `published` **ou** promouvez
   votre compte administrateur :
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'votre@email.fr');
   ```
4. L'annonce apparaît alors publiquement et peut être modérée depuis `/admin`.

## 5. Authentification

### URL de redirection

`Authentication → URL Configuration` :

- **Site URL** : `https://<votre-domaine>` (ou l'URL Netlify)
- **Redirect URLs** :
  - `http://localhost:5173/**`
  - `https://<votre-site>.netlify.app/**`
  - `https://<votre-domaine>/**` (si domaine personnalisé)

L'application utilise `emailRedirectTo = ${VITE_SITE_URL}/connexion?confirme=1`
et `flowType: 'pkce'` (pas de jeton dans le fragment d'URL).

### Fournisseur e-mail

Par défaut, Supabase limite fortement l'envoi d'e-mails. Pour un usage réel :

`Authentication → Emails → SMTP Settings` : renseignez un fournisseur
(Resend, Postmark, SendGrid, Amazon SES…), puis personnalisez les modèles.

Sans SMTP, l'inscription fonctionne mais l'e-mail de confirmation peut ne pas
arriver.

### Paramètres recommandés

- `Authentication → Providers → Email` : confirmation d'e-mail **activée**.
- Mot de passe minimum : **10 caractères** (cohérent avec
  `passwordSchema`). Cette règle est déjà vérifiée côté client ; renforcez-la
  côté serveur pour éviter tout contournement.
- `Authentication → Sessions` : durée de vie par défaut (1 h) + refresh token.

## 6. Stockage des photos

La migration `0004` crée le bucket `listing-photos` **si le schéma `storage`
existe** (cas normal sur Supabase). Elle définit :

- bucket public en lecture (URL publiques pour les `<img>`) ;
- écriture limitée au dossier `<auth.uid()>/…` ;
- 5 Mo maximum ; `image/jpeg`, `image/png`, `image/webp`.

Vérification manuelle : `Storage → listing-photos` doit exister avec la mention
« Public ». Si la migration a été exécutée sans droits suffisants, créez le
bucket à la main puis rejouez la section politiques de `0004`.

## 7. Données de démonstration (facultatif, LOCAL uniquement)

`supabase/seed.demo.sql` **n'est jamais exécuté automatiquement**.
Pour l'utiliser en local :

```bash
# 1. Créer le compte démo depuis l'application ou le dashboard :
#    demo.bailleur@hti-immo.test
# 2. Appliquer le jeu de données
supabase db execute --file supabase/seed.demo.sql
```

Toutes les annonces insérées portent `is_demo = true` et un titre `[EXEMPLE]`.

> ⚠️ Ne jamais exécuter ce fichier sur une base de production.

## 8. Sauvegardes et exploitation

- Activez les **sauvegardes quotidiennes** (offre payante) ou planifiez un
  `pg_dump` régulier.
- Surveillez `Database → Logs` pour repérer les tentatives d'accès refusées.
- En cas d'incident : `Project Settings → API → Rotate` pour régénérer les clés
  (pensez à mettre à jour Netlify et à redéployer).

## 9. Ce qui reste à faire par le propriétaire

- [ ] Créer le projet Supabase et noter les clés
- [ ] Appliquer les 4 migrations
- [ ] Configurer les URL de redirection d'authentification
- [ ] Configurer un fournisseur SMTP
- [ ] Vérifier le bucket `listing-photos`
- [ ] Créer le premier compte administrateur
- [ ] Activer les sauvegardes
- [ ] Renseigner la région d'hébergement dans la page « Mentions légales »
