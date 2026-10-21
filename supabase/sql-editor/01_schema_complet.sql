-- ============================================================================
-- HTI-IMMO — INSTALLATION COMPLÈTE DE LA BASE DE DONNÉES
-- ============================================================================
--
-- À COLLER TEL QUEL DANS SUPABASE > SQL EDITOR, PUIS « RUN ».
--
-- Ce fichier regroupe, dans l'ordre et sans modification, les 4 migrations
-- versionnées du dépôt (supabase/migrations/). Il est idempotent : le rejouer
-- ne détruit aucune donnée et ne recrée pas les objets existants.
--
-- AVANT DE LANCER
--   • Projet Supabase créé, région européenne (ex. Francfort) recommandée
--   • Aucune table existante n'est supprimée ou modifiée par ce script
--
-- APRÈS EXÉCUTION
--   • Exécuter ensuite 02_verifications.sql pour contrôler l'installation
--   • Exécuter 03_premier_administrateur.sql pour obtenir un accès /admin
--
-- Contenu : 4 blocs transactionnels indépendants (BEGIN … COMMIT).
-- En cas d'erreur, seul le bloc concerné est annulé : corrigez, puis relancez
-- le fichier entier (sans risque).
-- ============================================================================


-- ############################################################################
-- ## ÉTAPE 1 / 4 — Schéma de base : types, tables, contraintes, index, recherche plein texte
-- ## Fichier source : supabase/migrations/20261021000001_init_schema.sql
-- ############################################################################

-- ============================================================================
-- HTI-IMMO — Migration 0001 : schéma de base
-- ----------------------------------------------------------------------------
-- Cible : PostgreSQL 15+ (Supabase)
-- Idempotence : les objets sont créés avec `if not exists` quand c'est possible.
-- Aucune donnée n'est insérée ici : les données de démonstration vivent dans
-- `supabase/seed.sql` et portent explicitement `is_demo = true`.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
-- gen_random_uuid() est natif depuis PostgreSQL 13, aucune extension requise.

-- ----------------------------------------------------------------------------
-- Types énumérés
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'user_role' and n.nspname = 'public') then
    create type public.user_role as enum ('student', 'owner', 'moderator', 'admin');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'property_type' and n.nspname = 'public') then
    create type public.property_type as enum ('studio', 'appartement', 'colocation', 'chambre', 'residence');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'listing_status' and n.nspname = 'public') then
    create type public.listing_status as enum ('draft', 'pending', 'published', 'rented', 'archived');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'inquiry_status' and n.nspname = 'public') then
    create type public.inquiry_status as enum ('new', 'read', 'answered', 'closed');
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- Fonctions utilitaires
-- ----------------------------------------------------------------------------

-- Met à jour `updated_at` à chaque écriture.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Table : profiles
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        public.user_role not null default 'student',
  phone       text,
  city        text,
  postal_code text,
  school      text,
  bio         text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint profiles_full_name_len   check (full_name is null or char_length(full_name) between 2 and 80),
  constraint profiles_phone_format    check (phone is null or phone ~ '^(\+33|0)[1-9]([ .-]?[0-9]{2}){4}$'),
  constraint profiles_postal_format   check (postal_code is null or postal_code ~ '^[0-9]{5}$'),
  constraint profiles_city_len        check (city is null or char_length(city) <= 80),
  constraint profiles_school_len      check (school is null or char_length(school) <= 120),
  constraint profiles_bio_len         check (bio is null or char_length(bio) <= 600)
);

comment on table public.profiles is 'Profil applicatif, en 1-1 avec auth.users. Le rôle y est protégé par trigger.';
comment on column public.profiles.role is 'Rôle applicatif. Modifiable uniquement par un administrateur (trigger).';

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Table : listings
-- ----------------------------------------------------------------------------
create table if not exists public.listings (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references public.profiles (id) on delete cascade,
  title            text not null,
  description      text,
  property_type    public.property_type not null,
  status           public.listing_status not null default 'draft',

  -- Montants en centimes d'euro : jamais de flottant pour de l'argent.
  price_cents      integer not null,
  charges_included boolean not null default false,
  deposit_cents    integer,
  surface_m2       numeric(6, 1),
  rooms            smallint,
  bedrooms         smallint,
  furnished        boolean not null default false,
  pets_allowed     boolean not null default false,
  available_from   date,

  address_line     text,
  postal_code      text not null,
  city             text not null,
  latitude         numeric(9, 6),
  longitude        numeric(9, 6),

  amenities        text[] not null default '{}',
  nearby_schools   text[] not null default '{}',

  contact_name     text,
  contact_email    text,
  contact_phone    text,

  -- Une annonce de démonstration ne doit jamais être confondue avec une offre réelle.
  is_demo          boolean not null default false,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  published_at     timestamptz,

  search_vector    tsvector generated always as (
    setweight(to_tsvector('french', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(city, '') || ' ' || coalesce(postal_code, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(description, '')), 'C')
  ) stored,

  constraint listings_title_len        check (char_length(title) between 10 and 120),
  constraint listings_description_len  check (description is null or char_length(description) between 50 and 4000),
  constraint listings_price_positive   check (price_cents between 10000 and 1000000),
  constraint listings_deposit_range    check (deposit_cents is null or deposit_cents between 0 and 2000000),
  constraint listings_surface_range    check (surface_m2 is null or surface_m2 between 5 and 1000),
  constraint listings_rooms_range      check (rooms is null or rooms between 1 and 20),
  constraint listings_bedrooms_range   check (bedrooms is null or bedrooms between 0 and 20),
  constraint listings_postal_format    check (postal_code ~ '^[0-9]{5}$'),
  constraint listings_city_len         check (char_length(city) between 2 and 80),
  constraint listings_lat_range        check (latitude is null or latitude between -90 and 90),
  constraint listings_lng_range        check (longitude is null or longitude between -180 and 180),
  constraint listings_contact_email    check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint listings_contact_name_len check (contact_name is null or char_length(contact_name) <= 80),

  -- Liste blanche des équipements : empêche l'injection de valeurs arbitraires.
  constraint listings_amenities_allowed check (
    amenities <@ array[
      'wifi','lave_linge','cuisine_equipee','ascenseur','balcon',
      'parking','chauffage','meuble','digicode','handicap_access'
    ]::text[]
  )
);

comment on table public.listings is 'Annonces immobilières. Visibilité contrôlée par RLS + statut de publication.';
comment on column public.listings.is_demo is 'true = donnée de démonstration, jamais une offre réelle.';
comment on column public.listings.price_cents is 'Loyer mensuel en centimes d''euro.';

drop trigger if exists trg_listings_updated_at on public.listings;
create trigger trg_listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Table : listing_photos
-- ----------------------------------------------------------------------------
create table if not exists public.listing_photos (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings (id) on delete cascade,
  storage_path text not null,
  alt_text     text,
  position     smallint not null default 0,
  created_at   timestamptz not null default now(),

  constraint listing_photos_path_len check (char_length(storage_path) between 3 and 512),
  constraint listing_photos_alt_len  check (alt_text is null or char_length(alt_text) <= 200),
  constraint listing_photos_position check (position between 0 and 50),
  -- Empêche un chemin absolu ou une remontée de répertoire dans le stockage.
  constraint listing_photos_path_safe check (
    storage_path !~ '^/' and storage_path !~ '\.\.' and storage_path !~ '^[a-z]+://'
  ),
  constraint listing_photos_unique_path unique (storage_path)
);

comment on table public.listing_photos is 'Photos stockées dans le bucket Supabase `listing-photos`.';
comment on column public.listing_photos.storage_path is 'Chemin relatif dans le bucket, ex. "<user_id>/<listing_id>/photo-1.webp".';

drop trigger if exists trg_listing_photos_updated_at on public.listing_photos;

-- ----------------------------------------------------------------------------
-- Table : favorites
-- ----------------------------------------------------------------------------
create table if not exists public.favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint favorites_unique_user_listing unique (user_id, listing_id)
);

comment on table public.favorites is 'Favoris : un utilisateur ne voit et ne gère que les siens (RLS).';

-- ----------------------------------------------------------------------------
-- Table : inquiries
-- ----------------------------------------------------------------------------
create table if not exists public.inquiries (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings (id) on delete cascade,
  student_id   uuid references public.profiles (id) on delete set null,
  sender_name  text not null,
  sender_email text not null,
  sender_phone text,
  message      text not null,
  status       public.inquiry_status not null default 'new',
  created_at   timestamptz not null default now(),

  constraint inquiries_sender_name_len  check (char_length(sender_name) between 2 and 80),
  constraint inquiries_sender_email_fmt check (sender_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint inquiries_sender_phone_fmt check (sender_phone is null or sender_phone ~ '^(\+33|0)[1-9]([ .-]?[0-9]{2}){4}$'),
  constraint inquiries_message_len      check (char_length(message) between 20 and 2000)
);

comment on table public.inquiries is 'Demandes de logement envoyées depuis une annonce. Lecture réservée au bailleur et au staff.';

-- ----------------------------------------------------------------------------
-- Index
-- ----------------------------------------------------------------------------
create index if not exists listings_status_published_idx on public.listings (status, published_at desc);
create index if not exists listings_city_idx               on public.listings (lower(city));
create index if not exists listings_postal_code_idx        on public.listings (postal_code);
create index if not exists listings_price_idx              on public.listings (price_cents);
create index if not exists listings_type_idx               on public.listings (property_type);
create index if not exists listings_owner_idx              on public.listings (owner_id);
create index if not exists listings_search_idx             on public.listings using gin (search_vector);
create index if not exists listings_amenities_idx          on public.listings using gin (amenities);
create index if not exists listing_photos_listing_idx      on public.listing_photos (listing_id, position);
create index if not exists favorites_user_idx              on public.favorites (user_id);
create index if not exists inquiries_listing_idx           on public.inquiries (listing_id, created_at desc);
create index if not exists inquiries_student_idx           on public.inquiries (student_id);

commit;


-- ############################################################################
-- ## ÉTAPE 2 / 4 — Fonctions métier, triggers et garde-fous de sécurité
-- ## Fichier source : supabase/migrations/20261021000002_functions_triggers.sql
-- ############################################################################

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


-- ############################################################################
-- ## ÉTAPE 3 / 4 — Row Level Security et privilèges par rôle
-- ## Fichier source : supabase/migrations/20261021000003_rls_policies.sql
-- ############################################################################

-- ============================================================================
-- HTI-IMMO — Migration 0003 : Row Level Security et privilèges
-- ----------------------------------------------------------------------------
-- Principe : RLS est ACTIVÉE sur toutes les tables du schéma public.
-- Le rôle `service_role` (jamais exposé au navigateur) contourne RLS par
-- conception : c'est la seule voie d'administration complète.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- Activation de RLS (refus par défaut si aucune politique ne s'applique)
-- ----------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.listings       enable row level security;
alter table public.listing_photos enable row level security;
alter table public.favorites      enable row level security;
alter table public.inquiries      enable row level security;

-- ----------------------------------------------------------------------------
-- Privilèges de base (least privilege)
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on public.listings       to anon, authenticated;
grant insert, update, delete on public.listings to authenticated;

grant select on public.listing_photos to anon, authenticated;
grant insert, update, delete on public.listing_photos to authenticated;

grant select, insert, delete on public.favorites to authenticated;

-- Formulaires de contact : ouverts au public en écriture, jamais en lecture.
grant insert on public.inquiries to anon, authenticated;
grant select, update, delete on public.inquiries to authenticated;

grant select, insert, update on public.profiles to authenticated;

-- ----------------------------------------------------------------------------
-- PROFILS
-- ----------------------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_staff());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Un administrateur peut mettre à jour n'importe quel profil (modération).
-- Le changement de rôle reste verrouillé par le trigger `guard_profile_role`,
-- qui n'autorise que le rôle `admin`.
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin
  on public.profiles for update
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Aucune politique DELETE : la suppression passe par la suppression du compte
-- (cascade depuis auth.users) ou par le service_role.

-- ----------------------------------------------------------------------------
-- ANNONCES
-- ----------------------------------------------------------------------------
-- Lecture publique limitée aux annonces publiées ; un bailleur voit les siennes ;
-- le staff voit tout.
drop policy if exists listings_select_visible on public.listings;
create policy listings_select_visible
  on public.listings for select
  to anon, authenticated
  using (
    status = 'published'
    or owner_id = auth.uid()
    or public.is_staff()
  );

-- Seuls les comptes « owner », « moderator » et « admin » créent des annonces.
drop policy if exists listings_insert_owner on public.listings;
create policy listings_insert_owner
  on public.listings for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and public.current_user_role() in ('owner', 'moderator', 'admin')
  );

drop policy if exists listings_update_owner on public.listings;
create policy listings_update_owner
  on public.listings for update
  to authenticated
  using (owner_id = auth.uid() or public.is_staff())
  with check (owner_id = auth.uid() or public.is_staff());

drop policy if exists listings_delete_owner on public.listings;
create policy listings_delete_owner
  on public.listings for delete
  to authenticated
  using (owner_id = auth.uid() or public.is_staff());

-- ----------------------------------------------------------------------------
-- PHOTOS
-- ----------------------------------------------------------------------------
drop policy if exists listing_photos_select_visible on public.listing_photos;
create policy listing_photos_select_visible
  on public.listing_photos for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_photos.listing_id
        and (l.status = 'published' or l.owner_id = auth.uid() or public.is_staff())
    )
  );

drop policy if exists listing_photos_write_owner on public.listing_photos;
create policy listing_photos_write_owner
  on public.listing_photos for all
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_photos.listing_id
        and (l.owner_id = auth.uid() or public.is_staff())
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_photos.listing_id
        and (l.owner_id = auth.uid() or public.is_staff())
    )
  );

-- ----------------------------------------------------------------------------
-- FAVORIS
-- ----------------------------------------------------------------------------
drop policy if exists favorites_select_own on public.favorites;
create policy favorites_select_own
  on public.favorites for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists favorites_insert_own on public.favorites;
create policy favorites_insert_own
  on public.favorites for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.listings l
      where l.id = favorites.listing_id and l.status = 'published'
    )
  );

drop policy if exists favorites_delete_own on public.favorites;
create policy favorites_delete_own
  on public.favorites for delete
  to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- DEMANDES DE LOGEMENT
-- ----------------------------------------------------------------------------
-- Écriture publique possible (formulaire sans compte), mais uniquement sur une
-- annonce publiée. `student_id` reste facultatif et ne peut désigner que soi.
drop policy if exists inquiries_insert_public on public.inquiries;
create policy inquiries_insert_public
  on public.inquiries for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.listings l
      where l.id = inquiries.listing_id and l.status = 'published'
    )
    and (student_id is null or student_id = auth.uid())
  );

-- Lecture : bailleur de l'annonce, auteur de la demande, ou staff.
drop policy if exists inquiries_select_involved on public.inquiries;
create policy inquiries_select_involved
  on public.inquiries for select
  to authenticated
  using (
    student_id = auth.uid()
    or public.is_staff()
    or exists (
      select 1 from public.listings l
      where l.id = inquiries.listing_id and l.owner_id = auth.uid()
    )
  );

-- Mise à jour du statut : bailleur de l'annonce ou staff.
drop policy if exists inquiries_update_involved on public.inquiries;
create policy inquiries_update_involved
  on public.inquiries for update
  to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.listings l
      where l.id = inquiries.listing_id and l.owner_id = auth.uid()
    )
  )
  with check (
    public.is_staff()
    or exists (
      select 1 from public.listings l
      where l.id = inquiries.listing_id and l.owner_id = auth.uid()
    )
  );

drop policy if exists inquiries_delete_staff on public.inquiries;
create policy inquiries_delete_staff
  on public.inquiries for delete
  to authenticated
  using (public.is_staff());

-- ----------------------------------------------------------------------------
-- Les fonctions internes ne doivent pas être exécutables pour forger un rôle.
-- ----------------------------------------------------------------------------
revoke all on function public.handle_new_user() from public;
revoke all on function public.guard_listing_write() from public;
revoke all on function public.guard_profile_role() from public;
revoke all on function public.guard_listing_photo_path() from public;
revoke all on function public.set_published_at() from public;

grant execute on function public.current_user_role() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;

commit;


-- ############################################################################
-- ## ÉTAPE 4 / 4 — Stockage des photos (bucket listing-photos)
-- ## Fichier source : supabase/migrations/20261021000004_storage.sql
-- ############################################################################

-- ============================================================================
-- HTI-IMMO — Migration 0004 : stockage des photos
-- ----------------------------------------------------------------------------
-- Ce bloc est conditionnel : il ne s'exécute que si le schéma `storage`
-- existe (cas de Supabase). Il reste donc inoffensif dans un PostgreSQL nu
-- ou dans PGlite (tests).
-- ============================================================================

do $do$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then

    ------------------------------------------------------------------------
    -- Bucket public en lecture, en écriture contrôlée par RLS.
    ------------------------------------------------------------------------
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'listing-photos',
      'listing-photos',
      true,
      5242880, -- 5 Mo
      array['image/jpeg', 'image/png', 'image/webp']
    )
    on conflict (id) do nothing;

    ------------------------------------------------------------------------
    -- Lecture : le bucket est public (URL publiques), la policy reste utile
    -- pour les accès authentifiés à l'API Storage.
    ------------------------------------------------------------------------
    execute $pol$drop policy if exists "listing_photos_public_read" on storage.objects$pol$;
    execute $pol$
      create policy "listing_photos_public_read"
        on storage.objects for select
        to anon, authenticated
        using (bucket_id = 'listing-photos')
    $pol$;

    ------------------------------------------------------------------------
    -- Écriture : chaque utilisateur n'écrit que dans son propre dossier
    --     <auth.uid()>/<listing_id>/<fichier>
    ------------------------------------------------------------------------
    execute $pol$drop policy if exists "listing_photos_owner_insert" on storage.objects$pol$;
    execute $pol$
      create policy "listing_photos_owner_insert"
        on storage.objects for insert
        to authenticated
        with check (
          bucket_id = 'listing-photos'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
    $pol$;

    execute $pol$drop policy if exists "listing_photos_owner_update" on storage.objects$pol$;
    execute $pol$
      create policy "listing_photos_owner_update"
        on storage.objects for update
        to authenticated
        using (
          bucket_id = 'listing-photos'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
        with check (
          bucket_id = 'listing-photos'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
    $pol$;

    execute $pol$drop policy if exists "listing_photos_owner_delete" on storage.objects$pol$;
    execute $pol$
      create policy "listing_photos_owner_delete"
        on storage.objects for delete
        to authenticated
        using (
          bucket_id = 'listing-photos'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
    $pol$;

  end if;
end
$do$;


-- ============================================================================
-- FIN DE L'INSTALLATION
-- ----------------------------------------------------------------------------
-- Étape suivante : exécuter supabase/sql-editor/02_verifications.sql
-- ============================================================================
