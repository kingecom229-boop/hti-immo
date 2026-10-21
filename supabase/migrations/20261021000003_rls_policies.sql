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
