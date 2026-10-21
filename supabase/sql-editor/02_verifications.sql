-- ============================================================================
-- HTI-IMMO — VÉRIFICATIONS APRÈS INSTALLATION
-- ============================================================================
--
-- À exécuter dans Supabase > SQL Editor APRÈS 01_schema_complet.sql.
-- Ce script ne modifie RIEN : il ne fait que lire le catalogue.
--
-- Chaque requête affiche un indicateur « OK » ou « À CORRIGER ».
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Les 5 tables existent et RLS est active sur chacune
--    Attendu : 5 lignes, toutes avec rls_active = true
-- ----------------------------------------------------------------------------
select
  relname                              as table_name,
  relrowsecurity                       as rls_active,
  case when relrowsecurity then 'OK' else 'À CORRIGER' end as statut
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('profiles', 'listings', 'listing_photos', 'favorites', 'inquiries')
order by relname;

-- ----------------------------------------------------------------------------
-- 2. Aucune table du schéma public sans RLS
--    Attendu : 0 ligne
-- ----------------------------------------------------------------------------
select c.relname as table_sans_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity = false;

-- ----------------------------------------------------------------------------
-- 3. Nombre de politiques RLS par table
--    Attendu : profiles 3, listings 4, listing_photos 2, favorites 3, inquiries 4
-- ----------------------------------------------------------------------------
select
  tablename                as table_name,
  count(*)                 as nb_politiques,
  case when count(*) >= 2 then 'OK' else 'À CORRIGER' end as statut
from pg_policies
where schemaname = 'public'
group by tablename
order by tablename;

-- ----------------------------------------------------------------------------
-- 4. Triggers critiques
--    Attendu : on_auth_user_created, trg_profiles_guard_role,
--              trg_listings_guard_write, trg_listings_published_at,
--              trg_listing_photos_path
-- ----------------------------------------------------------------------------
select
  t.tgname                 as trigger_name,
  c.relname                as table_name,
  p.proname                as fonction,
  case when t.tgenabled <> 'D' then 'OK' else 'À CORRIGER' end as statut
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_proc  p on p.oid = t.tgfoid
where not t.tgisinternal
  and t.tgname in (
    'on_auth_user_created',
    'trg_profiles_updated_at',
    'trg_profiles_guard_role',
    'trg_listings_updated_at',
    'trg_listings_guard_write',
    'trg_listings_published_at',
    'trg_listing_photos_path'
  )
order by t.tgname;

-- ----------------------------------------------------------------------------
-- 5. Fonctions exposées aux clients
--    Attendu : current_user_role et is_staff accessibles ;
--              handle_new_user NON accessible
-- ----------------------------------------------------------------------------
select
  p.proname                                             as fonction,
  has_function_privilege('anon', p.oid, 'EXECUTE')       as accessible_anon,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as accessible_authenticated
from pg_proc p
where p.pronamespace = 'public'::regnamespace
  and p.proname in ('current_user_role', 'is_staff', 'handle_new_user', 'guard_listing_write')
order by p.proname;

-- ----------------------------------------------------------------------------
-- 6. Recherche plein texte : le vecteur doit être généré en français
--    Attendu : aucune erreur (la colonne search_vector existe et s'alimente)
-- ----------------------------------------------------------------------------
select
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'listings'
      and column_name = 'search_vector'
      and is_generated = 'ALWAYS'
  ) as search_vector_genere;

-- ----------------------------------------------------------------------------
-- 7. Bucket de stockage des photos
--    Attendu : 1 ligne, public = true, file_size_limit = 5242880
-- ----------------------------------------------------------------------------
select
  id,
  public,
  file_size_limit,
  allowed_mime_types,
  case
    when public and file_size_limit = 5242880 then 'OK'
    else 'À CORRIGER'
  end as statut
from storage.buckets
where id = 'listing-photos';

-- ----------------------------------------------------------------------------
-- 8. Politiques Storage (4 attendues)
-- ----------------------------------------------------------------------------
select
  policyname,
  cmd,
  case when policyname like 'listing_photos_%' then 'OK' else '?' end as statut
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'listing_photos_%'
order by policyname;

-- ----------------------------------------------------------------------------
-- 9. Comptes existants et rôles applicatifs
--    Attendu : après ta première inscription, role = 'student' ou 'owner'
-- ----------------------------------------------------------------------------
select
  u.email,
  p.role,
  p.full_name,
  p.created_at::date as inscrit_le
from auth.users u
join public.profiles p on p.id = u.id
order by p.created_at desc
limit 20;

-- ----------------------------------------------------------------------------
-- 10. État du catalogue
-- ----------------------------------------------------------------------------
select
  status,
  count(*) as nb_annonces,
  count(*) filter (where is_demo) as dont_demonstration
from public.listings
group by status
order by status;
