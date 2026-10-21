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
