-- ============================================================================
-- HTI-IMMO — Migration 0002 : fonctions métier, triggers et garde-fous
-- ----------------------------------------------------------------------------
-- Toutes les fonctions `security definer` fixent explicitement `search_path`
-- afin d'éviter les attaques par détournement de schéma.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- Lecture du rôle applicatif
-- ----------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, auth
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    (select p.role in ('moderator', 'admin') from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

comment on function public.is_staff() is 'true si l''utilisateur courant est modérateur ou administrateur.';

-- ----------------------------------------------------------------------------
-- Création automatique du profil à l'inscription
-- ----------------------------------------------------------------------------
-- Le rôle provient de `raw_user_meta_data`, contrôlé par le client : il est donc
-- filtré sur une liste blanche stricte. Aucun utilisateur ne peut s'octroyer
-- `admin` ou `moderator` via les métadonnées d'inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  safe_role      public.user_role;
  safe_name      text;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'student');

  if requested_role in ('student', 'owner') then
    safe_role := requested_role::public.user_role;
  else
    safe_role := 'student';
  end if;

  safe_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  if safe_name is not null and char_length(safe_name) > 80 then
    safe_name := left(safe_name, 80);
  end if;

  insert into public.profiles (id, full_name, role)
  values (new.id, safe_name, safe_role)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Protection du champ `role` dans profiles
-- ----------------------------------------------------------------------------
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller public.user_role;
begin
  if new.id is distinct from old.id then
    raise exception 'L''identifiant du profil est immuable.' using errcode = '42501';
  end if;

  if new.role is distinct from old.role then
    select p.role into caller from public.profiles p where p.id = auth.uid();

    -- `caller` vaut NULL dans un contexte de service (service_role, tâche
    -- d'administration, migration) : l'opération est alors déjà protégée par
    -- l'absence d'accès client à la clé service_role.
    if caller is not null and caller is distinct from 'admin' then
      raise exception 'Seul un administrateur peut modifier un rôle.' using errcode = '42501';
    end if;
  end if;

  -- Champs techniques non modifiables par l'utilisateur.
  new.created_at := old.created_at;

  return new;
end;
$$;

drop trigger if exists trg_profiles_guard_role on public.profiles;
create trigger trg_profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ----------------------------------------------------------------------------
-- Garde-fous d'écriture sur les annonces
-- ----------------------------------------------------------------------------
-- Règles appliquées lorsqu'un utilisateur authentifié écrit (auth.uid() non nul).
-- Les opérations de service (seed, tâches d'administration, service_role) ne
-- passent pas par ces règles : elles sont déjà protégées par l'absence d'accès
-- client à la clé service_role.
create or replace function public.guard_listing_write()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller uuid := auth.uid();
  caller_role public.user_role;
begin
  -- Contexte de service (pas d'utilisateur authentifié) : aucune règle client.
  if caller is null then
    return new;
  end if;

  select p.role into caller_role from public.profiles p where p.id = caller;
  if caller_role is null then
    caller_role := 'student';
  end if;

  if tg_op = 'INSERT' then
    -- Le propriétaire est toujours l'auteur de la création.
    new.owner_id := caller;

    if caller_role not in ('moderator', 'admin') then
      -- Un bailleur ne publie pas lui-même : il soumet à validation.
      if new.status not in ('draft', 'pending') then
        new.status := 'pending';
      end if;
      new.is_demo := false;
      new.published_at := null;
    end if;

    return new;
  end if;

  -- UPDATE
  if new.owner_id is distinct from old.owner_id then
    raise exception 'Le propriétaire d''une annonce est immuable.' using errcode = '42501';
  end if;

  if caller_role not in ('moderator', 'admin') then
    if new.is_demo is distinct from old.is_demo then
      raise exception 'Le marqueur de démonstration est réservé au staff.' using errcode = '42501';
    end if;

    -- Un bailleur peut dépublier (archiver) ou passer une annonce louée en
    -- « louée », mais ne peut jamais (re)publier lui-même.
    if new.status is distinct from old.status then
      if new.status in ('draft', 'pending') then
        null; -- autorisé
      elsif new.status = 'rented' and old.status = 'published' then
        null; -- autorisé
      elsif new.status = 'archived' then
        null; -- autorisé (retrait de l'annonce)
      else
        raise exception 'Publication soumise à validation par l''équipe HTI-IMMO.'
          using errcode = '42501';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_listings_guard_write on public.listings;
create trigger trg_listings_guard_write
  before insert or update on public.listings
  for each row execute function public.guard_listing_write();

-- Horodatage de publication : cohérent quel que soit l'auteur (staff ou service).
create or replace function public.set_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and (old.status is distinct from 'published' or new.published_at is null) then
    new.published_at := coalesce(new.published_at, now());
  elsif new.status <> 'published' then
    new.published_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_listings_published_at on public.listings;
create trigger trg_listings_published_at
  before insert or update on public.listings
  for each row execute function public.set_published_at();

-- ----------------------------------------------------------------------------
-- Cohérence des photos : le chemin de stockage doit appartenir au propriétaire
-- ----------------------------------------------------------------------------
create or replace function public.guard_listing_photo_path()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  owner uuid;
begin
  select l.owner_id into owner from public.listings l where l.id = new.listing_id;

  if owner is null then
    raise exception 'Annonce inexistante.' using errcode = '23503';
  end if;

  -- Structure imposée : <owner_id>/<listing_id>/<fichier>
  if new.storage_path !~ ('^' || owner::text || '/' || new.listing_id::text || '/[A-Za-z0-9._-]+$') then
    raise exception 'Chemin de photo invalide : attendu <owner_id>/<listing_id>/<fichier>.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_listing_photos_path on public.listing_photos;
create trigger trg_listing_photos_path
  before insert or update on public.listing_photos
  for each row execute function public.guard_listing_photo_path();

commit;
