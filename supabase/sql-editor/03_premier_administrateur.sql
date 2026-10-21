-- ============================================================================
-- HTI-IMMO — PREMIER COMPTE ADMINISTRATEUR
-- ============================================================================
--
-- ⚠️ À n'exécuter QU'APRÈS avoir créé ton compte depuis l'application
--    (page « Créer un compte »). Le compte doit déjà exister dans auth.users.
--
-- ⚠️ CE SCRIPT MODIFIE DES DONNÉES. Il change UNIQUEMENT la colonne `role`
--    d'un profil. Aucune suppression, aucune migration destructive.
--
-- Rappel de sécurité : cette opération est volontairement impossible depuis
-- l'application (le trigger `guard_profile_role` bloque toute auto-promotion).
-- Elle exige un accès SQL Editor, donc un accès administrateur à ton projet.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- ÉTAPE A — Identifier mon compte
-- Remplace l'adresse ci-dessous par celle utilisée à l'inscription,
-- puis clique sur « Run » pour vérifier que le compte est bien trouvé.
-- ----------------------------------------------------------------------------
select
  u.id,
  u.email,
  u.email_confirmed_at,
  p.role                as role_actuel,
  p.full_name,
  p.created_at::date    as inscrit_le
from auth.users u
left join public.profiles p on p.id = u.id
where lower(u.email) = lower('remplace-moi@exemple.fr');


-- ----------------------------------------------------------------------------
-- ÉTAPE B — Promouvoir ce compte en administrateur
-- Remplace l'adresse, puis « Run ». Résultat attendu : « Success. 1 row ».
-- ----------------------------------------------------------------------------
update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and lower(u.email) = lower('remplace-moi@exemple.fr');


-- ----------------------------------------------------------------------------
-- ÉTAPE C — Vérifier la promotion
-- Résultat attendu : role = admin
-- ----------------------------------------------------------------------------
select
  u.email,
  p.role,
  case when p.role = 'admin' then 'OK — accès /admin actif' else 'Rôle non modifié' end as statut
from auth.users u
join public.profiles p on p.id = u.id
where lower(u.email) = lower('remplace-moi@exemple.fr');


-- ----------------------------------------------------------------------------
-- ÉTAPE D — (Facultatif) Attribuer d'autres rôles
-- Décommente une ligne, adapte l'adresse, puis exécute.
-- Rôles disponibles : student | owner | moderator | admin
-- ----------------------------------------------------------------------------
-- update public.profiles p set role = 'owner'
--   from auth.users u where u.id = p.id and lower(u.email) = 'bailleur@exemple.fr';

-- update public.profiles p set role = 'moderator'
--   from auth.users u where u.id = p.id and lower(u.email) = 'moderateur@exemple.fr';


-- ----------------------------------------------------------------------------
-- ÉTAPE E — (Facultatif) Publier les annonces en attente de validation
-- Utile pour tes premiers tests. En fonctionnement normal, la validation se
-- fait depuis l'interface /admin, annonce par annonce.
-- ----------------------------------------------------------------------------
-- update public.listings
-- set status = 'published'
-- where status = 'pending';


-- ----------------------------------------------------------------------------
-- NOTE — Comptes de démonstration
-- Ne crée JAMAIS de fausses annonces en production : l'application les
-- distingue par `is_demo = true` et le préfixe « [EXEMPLE] ». Pour un
-- environnement de test local, utilise plutôt supabase/seed.demo.sql.
-- ----------------------------------------------------------------------------
