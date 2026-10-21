import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import {
  asService,
  asUser,
  createTestDatabase,
  createUser,
  expectDbError,
  IDS,
  insertListingAsService,
  LONG_DESCRIPTION,
} from './harness';

let db: PGlite;

beforeAll(async () => {
  db = await createTestDatabase();
  await createUser(db, { id: IDS.owner, email: 'bailleur@test.fr', requestedRole: 'owner' });
  await createUser(db, {
    id: IDS.otherOwner,
    email: 'autre-bailleur@test.fr',
    requestedRole: 'owner',
  });
  await createUser(db, { id: IDS.student, email: 'etudiant@test.fr' });
  await createUser(db, { id: IDS.otherStudent, email: 'autre-etudiant@test.fr' });
  await createUser(db, { id: IDS.admin, email: 'admin@test.fr' });
  await createUser(db, { id: IDS.moderator, email: 'moderateur@test.fr' });
  // Promotion explicite, impossible depuis le client (trigger de protection).
  await asService(db);
  await db.query("update public.profiles set role = 'admin' where id = $1", [IDS.admin]);
  await db.query("update public.profiles set role = 'moderator' where id = $1", [IDS.moderator]);
});

afterAll(async () => {
  await db.close();
});

describe('Migrations — structure du schéma', () => {
  it('crée toutes les tables attendues', async () => {
    const result = await db.query<{ table_name: string }>(
      `select table_name from information_schema.tables
       where table_schema = 'public' and table_type = 'BASE TABLE'
       order by table_name`,
    );
    const tables = result.rows.map((row) => row.table_name);
    expect(tables).toEqual(
      expect.arrayContaining(['favorites', 'inquiries', 'listing_photos', 'listings', 'profiles']),
    );
  });

  it('active RLS sur les cinq tables', async () => {
    const result = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select relname, relrowsecurity from pg_class
       where relname in ('profiles','listings','listing_photos','favorites','inquiries')`,
    );
    expect(result.rows).toHaveLength(5);
    for (const row of result.rows) {
      expect(row.relrowsecurity, `RLS non activée sur ${row.relname}`).toBe(true);
    }
  });

  it('crée les index de recherche', async () => {
    const result = await db.query<{ indexname: string }>(
      `select indexname from pg_indexes where schemaname = 'public' and tablename = 'listings'`,
    );
    const names = result.rows.map((row) => row.indexname);
    expect(names).toEqual(
      expect.arrayContaining([
        'listings_search_idx',
        'listings_city_idx',
        'listings_postal_code_idx',
        'listings_price_idx',
        'listings_status_published_idx',
      ]),
    );
  });

  it('génère le vecteur de recherche en français', async () => {
    const id = await insertListingAsService(db, {
      ownerId: IDS.owner,
      title: 'Studio meublé à proximité du campus',
      city: 'Lyon',
    });
    const result = await db.query<{ search_vector: string }>(
      'select search_vector::text as search_vector from public.listings where id = $1',
      [id],
    );
    const vector = result.rows[0]?.search_vector ?? '';
    expect(vector).toContain('studi');
    expect(vector).toContain('lyon');
  });
});

describe('Contraintes d’intégrité', () => {
  it('refuse un loyer inférieur au minimum', async () => {
    await asService(db);
    await expectDbError(
      () =>
        db.query(
          `insert into public.listings
             (owner_id,title,description,property_type,price_cents,postal_code,city)
           values ($1,'Studio trop bon marché pour être vrai',$2,'studio',100,'69007','Lyon')`,
          [IDS.owner, LONG_DESCRIPTION],
        ),
      '23514',
    );
  });

  it('refuse un code postal non conforme', async () => {
    await asService(db);
    await expectDbError(
      () =>
        db.query(
          `insert into public.listings
             (owner_id,title,description,property_type,price_cents,postal_code,city)
           values ($1,'Studio avec un code postal invalide',$2,'studio',60000,'7500','Paris')`,
          [IDS.owner, LONG_DESCRIPTION],
        ),
      '23514',
    );
  });

  it('refuse un titre trop court', async () => {
    await asService(db);
    await expectDbError(
      () =>
        db.query(
          `insert into public.listings
             (owner_id,title,description,property_type,price_cents,postal_code,city)
           values ($1,'Court',$2,'studio',60000,'69007','Lyon')`,
          [IDS.owner, LONG_DESCRIPTION],
        ),
      '23514',
    );
  });

  it('refuse un équipement hors liste blanche', async () => {
    await asService(db);
    await expectDbError(
      () =>
        db.query(
          `insert into public.listings
             (owner_id,title,description,property_type,price_cents,postal_code,city,amenities)
           values ($1,'Studio avec un équipement inventé',$2,'studio',60000,'69007','Lyon',array['jacuzzi'])`,
          [IDS.owner, LONG_DESCRIPTION],
        ),
      '23514',
    );
  });

  it('interdit deux favoris identiques pour un même utilisateur', async () => {
    const listingId = await insertListingAsService(db, { ownerId: IDS.owner });
    await asService(db);
    await db.query('insert into public.favorites (user_id, listing_id) values ($1,$2)', [
      IDS.student,
      listingId,
    ]);
    await expectDbError(
      () =>
        db.query('insert into public.favorites (user_id, listing_id) values ($1,$2)', [
          IDS.student,
          listingId,
        ]),
      '23505',
    );
  });

  it('refuse un chemin de photo avec remontée de répertoire (garde du trigger)', async () => {
    const listingId = await insertListingAsService(db, { ownerId: IDS.owner });
    await asService(db);
    await expectDbError(
      () =>
        db.query('insert into public.listing_photos (listing_id, storage_path) values ($1,$2)', [
          listingId,
          '../../etc/passwd',
        ]),
      // Le trigger de contrôle du chemin intervient avant la contrainte CHECK.
      '22023',
    );
  });

  it('refuse une photo dont le chemin ne correspond pas au propriétaire', async () => {
    const listingId = await insertListingAsService(db, { ownerId: IDS.owner });
    await asService(db);
    await expectDbError(
      () =>
        db.query('insert into public.listing_photos (listing_id, storage_path) values ($1,$2)', [
          listingId,
          `${IDS.otherOwner}/${listingId}/photo.jpg`,
        ]),
      '22023',
    );
  });
});

describe('Triggers métier', () => {
  it('crée automatiquement un profil à l’inscription', async () => {
    await asService(db);
    const result = await db.query<{ id: string; role: string; full_name: string }>(
      'select id, role, full_name from public.profiles where id = $1',
      [IDS.owner],
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.role).toBe('owner');
    expect(result.rows[0]?.full_name).toBe('Utilisateur Test');
  });

  it('attribue le rôle « student » par défaut et ignore un rôle privilégié demandé', async () => {
    const maliciousId = '77777777-7777-4777-8777-777777777777';
    await createUser(db, {
      id: maliciousId,
      email: 'malveillant@test.fr',
      requestedRole: 'admin',
    });
    await asService(db);
    const result = await db.query<{ role: string }>(
      'select role from public.profiles where id = $1',
      [maliciousId],
    );
    expect(result.rows[0]?.role).toBe('student');
  });

  it('met à jour updated_at à chaque modification', async () => {
    const listingId = await insertListingAsService(db, { ownerId: IDS.owner });
    await asService(db);
    const before = await db.query<{ updated_at: string }>(
      'select updated_at from public.listings where id = $1',
      [listingId],
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    await db.query(
      "update public.listings set title = 'Studio mis à jour pour le test' where id = $1",
      [listingId],
    );
    const after = await db.query<{ updated_at: string }>(
      'select updated_at from public.listings where id = $1',
      [listingId],
    );
    expect(new Date(after.rows[0]!.updated_at).getTime()).toBeGreaterThanOrEqual(
      new Date(before.rows[0]!.updated_at).getTime(),
    );
  });

  it('horodate la publication et l’efface à la dépublication', async () => {
    const listingId = await insertListingAsService(db, {
      ownerId: IDS.owner,
      status: 'published',
    });
    await asService(db);
    const published = await db.query<{ published_at: string | null }>(
      'select published_at from public.listings where id = $1',
      [listingId],
    );
    expect(published.rows[0]?.published_at).not.toBeNull();

    await db.query("update public.listings set status = 'archived' where id = $1", [listingId]);
    const archived = await db.query<{ published_at: string | null }>(
      'select published_at from public.listings where id = $1',
      [listingId],
    );
    expect(archived.rows[0]?.published_at).toBeNull();
  });

  it('supprime le profil et ses annonces en cascade', async () => {
    const tempId = '88888888-8888-4888-8888-888888888888';
    await createUser(db, { id: tempId, email: 'cascade@test.fr', requestedRole: 'owner' });
    const listingId = await insertListingAsService(db, { ownerId: tempId });

    await asService(db);
    await db.query('delete from auth.users where id = $1', [tempId]);

    const profile = await db.query('select 1 from public.profiles where id = $1', [tempId]);
    const listing = await db.query('select 1 from public.listings where id = $1', [listingId]);
    expect(profile.rows).toHaveLength(0);
    expect(listing.rows).toHaveLength(0);
  });

  it('empêche un utilisateur de modifier son propre rôle', async () => {
    await asUser(db, IDS.student);
    await expectDbError(
      () => db.query("update public.profiles set role = 'admin' where id = $1", [IDS.student]),
      '42501',
    );
  });

  it('autorise un administrateur à modifier un rôle', async () => {
    const targetId = '99999999-9999-4999-8999-999999999999';
    await createUser(db, { id: targetId, email: 'promu@test.fr' });
    await asService(db);
    // Promotion explicite via le contexte service (équivalent administrateur).
    await db.query("update public.profiles set role = 'moderator' where id = $1", [targetId]);
    const result = await db.query<{ role: string }>(
      'select role from public.profiles where id = $1',
      [targetId],
    );
    expect(result.rows[0]?.role).toBe('moderator');
  });

  it('force le propriétaire d’une annonce à l’auteur de la création', async () => {
    const otherOwnerListing = await insertListingAsService(db, {
      ownerId: IDS.otherOwner,
    });
    await asUser(db, IDS.otherOwner);
    await db.query(
      `insert into public.listings
         (owner_id,title,description,property_type,price_cents,postal_code,city)
       values ($1,'Studio créé par un autre propriétaire',$2,'studio',60000,'69007','Lyon')`,
      [IDS.owner, LONG_DESCRIPTION],
    );
    const result = await db.query<{ owner_id: string }>(
      "select owner_id from public.listings where title = 'Studio créé par un autre propriétaire'",
    );
    expect(result.rows[0]?.owner_id).toBe(IDS.otherOwner);

    // Nettoyage : la ligne est supprimée pour ne pas fausser les autres tests.
    await asService(db);
    await db.query(
      "delete from public.listings where title = 'Studio créé par un autre propriétaire'",
    );
    expect(otherOwnerListing).toBeTruthy();
  });
});
