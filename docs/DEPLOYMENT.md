# Déploiement Netlify — HTI-IMMO

> ⚠️ **Aucun site Netlify n'a été créé, connecté ou déployé par l'agent.**
> Ces étapes sont à réaliser par le propriétaire du dépôt.

---

## 1. Ce qui est déjà prêt dans le dépôt

| Élément              | Fichier                                                 | Rôle                                       |
| -------------------- | ------------------------------------------------------- | ------------------------------------------ |
| Build                | `netlify.toml`                                          | `npm run build` → `dist/`, Node 22         |
| Routage SPA          | `netlify.toml` + `public/_redirects`                    | `/ *` → `/index.html` (200)                |
| En-têtes de sécurité | `netlify.toml`                                          | CSP, anti-clickjacking, nosniff            |
| Cache                | `netlify.toml`                                          | assets immuables, HTML jamais mis en cache |
| SEO                  | `index.html`, `public/robots.txt`, `public/sitemap.xml` | métadonnées, indexation                    |
| Variables            | `.env.example`                                          | documentation complète                     |

`netlify.toml` déclare aussi des contextes `deploy-preview` et `branch-deploy`
avec `VITE_DEMO_MODE=true`, afin qu'une prévisualisation ne affiche jamais de
fausses annonces comme de vraies offres **et** ne dépende pas d'une base de
production.

## 2. Créer le site (première fois)

### Option A — Via l'interface Netlify

1. <https://app.netlify.com> → **Add new site → Import an existing project**.
2. Autorisez GitHub, choisissez `kingecom229-boop/hti-immo`.
3. Netlify lit `netlify.toml` : build `npm run build`, publish `dist`.
4. **Ne validez pas encore le déploiement de production** : renseignez d'abord
   les variables d'environnement (étape 3).

### Option B — Via la CLI

```bash
npm install -g netlify-cli
netlify login
netlify init          # crée le site lié au dépôt
netlify env:set VITE_SUPABASE_URL "https://<ref>.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "<clé anon>"
netlify env:set VITE_SITE_URL "https://<votre-site>.netlify.app"
netlify env:set VITE_DEMO_MODE "false"
```

## 3. Variables d'environnement (Site configuration → Environment variables)

| Variable                 | Production         | Deploy preview | Secret ?            |
| ------------------------ | ------------------ | -------------- | ------------------- |
| `VITE_SUPABASE_URL`      | URL du projet      | URL du projet  | Non                 |
| `VITE_SUPABASE_ANON_KEY` | clé anon           | clé anon       | Non (publique, RLS) |
| `VITE_SITE_URL`          | URL publique       | URL du preview | Non                 |
| `VITE_APP_NAME`          | `HTI-IMMO`         | idem           | Non                 |
| `VITE_CONTACT_EMAIL`     | adresse de contact | idem           | Non                 |
| `VITE_DEMO_MODE`         | `false`            | `true`         | Non                 |

> Ne créez **jamais** de variable `VITE_` contenant un secret : tout ce qui
> commence par `VITE_` est inclus dans le bundle public.

## 4. Premier déploiement contrôlé

1. Poussez votre branche de travail (`main` reste sous votre contrôle).
2. Dans Netlify : **Deploys → Deploy manually** ou laissez le déploiement de
   branche se déclencher sur la branche de développement.
3. **Vérifiez la prévisualisation** (URL `deploy-preview-…`) avant toute mise
   en production.
4. Quand tout est validé, fusionnez vous-même dans `main` : le déploiement de
   production se déclenchera alors selon votre configuration.

### Liste de contrôle après déploiement

- [ ] La page d'accueil s'affiche, le bandeau « Mode démonstration » est absent.
- [ ] `/logements` liste les annonces réelles (aucune mention `[EXEMPLE]`).
- [ ] Une URL profonde (ex. `/logements/<uuid>`) se recharge correctement
      (redirection SPA).
- [ ] Inscription → e-mail reçu → confirmation → connexion.
- [ ] Création d'annonce → statut « En attente de validation ».
- [ ] Envoi d'une demande de logement depuis une annonce publiée.
- [ ] `https://<site>/robots.txt` et `/sitemap.xml` répondent 200.
- [ ] Les en-têtes de sécurité sont présents :
      `curl -I https://<site>/ | grep -i content-security-policy`.

## 5. Domaine et HTTPS

1. **Domain management → Add a domain**.
2. Créez les enregistrements DNS demandés (Netlify DNS ou votre registrar) :
   - apex `A` vers l'IP Netlify, ou `CNAME` vers `<site>.netlify.app` ;
   - `www` en `CNAME`.
3. Netlify provisionne automatiquement un certificat **Let's Encrypt**
   (HTTPS forcé : activez « Force HTTPS »).
4. Mettez à jour **dans cet ordre** :
   - `VITE_SITE_URL` (Netlify) puis redéploiement ;
   - **Site URL** et **Redirect URLs** dans Supabase (sinon les liens de
     confirmation pointent vers l'ancien domaine) ;
   - `public/sitemap.xml` et `public/robots.txt` (URL absolues) ;
   - `netlify.toml` → CSP si vous utilisez un domaine Supabase personnalisé.

## 6. Prévisualisations

- **Deploy previews** : utiles pour relire une branche. `VITE_DEMO_MODE=true`
  y est appliqué, donc les données sont fictives et locales.
- **Branch deploys** : désactivés par défaut. Activez-les uniquement si vous
  acceptez que la branche soit publiquement accessible.
- Aucun déploiement de prévisualisation ne modifie la production.

## 7. Retour arrière

### Revenir à une version précédente

1. Netlify → **Deploys**.
2. Repérez le dernier déploiement stable (message + commit SHA).
3. **Options → Publish deploy**.

L'opération est immédiate et ne touche pas au code source.

### Revenir à un état de code antérieur

```bash
git revert <sha>          # crée un commit inverse, historique préservé
# ou
git checkout <sha> -- .   # récupère les fichiers d'un commit précis
```

> Évitez `git push --force` sur `main` : cela rend les retours arrière plus
> difficiles à auditer.

### En cas d'incident côté backend

1. Désactivez temporairement le site (`Site configuration → Build & deploy →
Stop builds`) ou repointez vers un déploiement sain.
2. Si la base est en cause, restaurez une sauvegarde Supabase
   (`Database → Backups`) — **opération destructive, à ne faire qu'en dernier
   recours et après sauvegarde**.
3. Régénérez les clés compromises (`Project Settings → API → Rotate`), puis
   mettez à jour Netlify et redéployez.

## 8. Supervision

- **Netlify → Analytics / Functions logs** pour les erreurs 5xx.
- **Supabase → Logs** pour les erreurs PostgREST (codes 401/403 = RLS, 23514 =
  contrainte violée, 42501 = action non autorisée).
- Surveillez les 403 en rafale : tentative de contournement ou bug de politique.
