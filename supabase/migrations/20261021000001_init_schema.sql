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
