import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import {
  asAnon,
  asService,
  asUser,
  countRows,
  createTestDatabase,
  createUser,
  expectDbError,
  IDS,
  insertListingAsService,
} from './harness';

/**
 * Vérification des politiques Row Level Security.
 *
 * Chaque test change de rôle PostgreSQL puis interroge les tables comme le
 * ferait PostgREST pour un visiteur, un étudiant, un bailleur ou le staff.
 */

let db: PGlite;
let publishedId: string;
let draftId: string;
let pendingId: string;
let otherOwnerPublishedId: string;
let otherOwnerDraftId: string;

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

  await asService(db);
  await db.query("update public.profiles set role = 'admin' where id = $1", [IDS.admin]);
  await db.query("update public.profiles set role = 'moderator' where id = $1", [IDS.moderator]);

  publishedId = await insertListingAsService(db, {
    ownerId: IDS.owner,
    status: 'published',
    title: 'Studio publié visible par tous les visiteurs',
    city: 'Lyon',
  });
  draftId = await insertListingAsService(db, {
    ownerId: IDS.owner,
    status: 'draft',
    title: 'Brouillon privé du bailleur principal',
    city: 'Lyon',
  });
  pendingId = await insertListingAsService(db, {
    ownerId: IDS.owner,
    status: 'pending',
    title: 'Annonce en attente de validation par le staff',
    city: 'Villeurbanne',
  });
  otherOwnerPublishedId = await insertListingAsService(db, {
    ownerId: IDS.otherOwner,
    status: 'published',
    title: 'Appartement publié par un autre bailleur',
    city: 'Nantes',
  });
  otherOwnerDraftId = await insertListingAsService(db, {
    ownerId: IDS.otherOwner,
    status: 'draft',
    title: 'Brouillon privé d’un autre bailleur',
    city: 'Nantes',
  });
});

afterAll(async () => {
  await db.close();
});

// ---------------------------------------------------------------------------
describe('Visiteur non authentifié (anon)', () => {
  it('ne voit que les annonces publiées', async () => {
    await asAnon(db);
    const result = await db.query<{ id: string }>('select id from public.listings');
    const ids = result.rows.map((row) => row.id);

    expect(ids).toContain(publishedId);
    expect(ids).toContain(otherOwnerPublishedId);
    expect(ids).not.toContain(draftId);
    expect(ids).not.toContain(pendingId);
  });

  it('n’a aucun droit de lecture sur les profils (privilège refusé)', async () => {
    await asAnon(db);
    // `anon` ne possède même pas le privilège SELECT : refus au niveau du rôle,
    // avant même l'évaluation des politiques RLS.
    await expectDbError(() => db.query('select * from public.profiles'), '42501');
  });

  it('n’a aucun droit de lecture sur les demandes de logement', async () => {
    await asAnon(db);
    await expectDbError(() => db.query('select * from public.inquiries'), '42501');
  });

  it('ne peut pas créer d’annonce', async () => {
    await asAnon(db);
    await expectDbError(() =>
      db.query(
        `insert into public.listings
             (owner_id,title,description,property_type,price_cents,postal_code,city)
           values ($1,'Annonce déposée par un visiteur anonyme','Description suffisamment longue pour satisfaire la contrainte de longueur minimale.','studio',60000,'69007','Lyon')`,
        [IDS.owner],
      ),
    );
  });

  it('peut envoyer une demande sur une annonce publiée', async () => {
    await asAnon(db);
    await db.query(
      `insert into public.inquiries (listing_id, sender_name, sender_email, message)
       values ($1,'Visiteur Anonyme','visiteur@example.fr','Bonjour, je souhaite visiter ce studio disponible prochainement.')`,
      [publishedId],
    );

    await asService(db);
    expect(
      await countRows(db, 'select count(*) as count from public.inquiries where listing_id = $1', [
        publishedId,
      ]),
    ).toBeGreaterThan(0);
  });

  it('ne peut pas envoyer de demande sur un brouillon', async () => {
    await asAnon(db);
    await expectDbError(
      () =>
        db.query(
          `insert into public.inquiries (listing_id, sender_name, sender_email, message)
           values ($1,'Visiteur Anonyme','visiteur@example.fr','Bonjour, je souhaite visiter ce logement en brouillon.')`,
          [draftId],
        ),
      '42501',
    );
  });

  it('ne peut pas consulter les favoris', async () => {
    await asAnon(db);
    await expectDbError(() => db.query('select * from public.favorites'), '42501');
  });
});

// ---------------------------------------------------------------------------
describe('Étudiant authentifié', () => {
  it('ne voit que les annonces publiées', async () => {
    await asUser(db, IDS.student);
    const result = await db.query<{ id: string }>('select id from public.listings');
    const ids = result.rows.map((row) => row.id);
    expect(ids).toContain(publishedId);
    expect(ids).not.toContain(draftId);
    expect(ids).not.toContain(pendingId);
  });

  it('voit uniquement son propre profil', async () => {
    await asUser(db, IDS.student);
    const result = await db.query<{ id: string }>('select id from public.profiles');

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.id).toBe(IDS.student);
  });

  it('peut modifier ses propres informations', async () => {
    await asUser(db, IDS.student);
    await db.query("update public.profiles set city = 'Villeurbanne' where id = $1", [IDS.student]);

    await asService(db);
    const result = await db.query<{ city: string }>(
      'select city from public.profiles where id = $1',
      [IDS.student],
    );
    expect(result.rows[0]?.city).toBe('Villeurbanne');
  });

  it('ne peut pas modifier le profil d’un autre utilisateur', async () => {
    await asUser(db, IDS.student);
    const result = await db.query("update public.profiles set city = 'Piraté' where id = $1", [
      IDS.otherStudent,
    ]);
    expect(result.affectedRows ?? 0).toBe(0);

    await asService(db);
    const check = await db.query<{ city: string | null }>(
      'select city from public.profiles where id = $1',
      [IDS.otherStudent],
    );
    expect(check.rows[0]?.city).toBeNull();
  });

  it('ne peut pas créer d’annonce (rôle étudiant)', async () => {
    await asUser(db, IDS.student);
    await expectDbError(
      () =>
        db.query(
          `insert into public.listings
             (owner_id,title,description,property_type,price_cents,postal_code,city)
           values ($1,'Annonce déposée par un étudiant sans droit','Description suffisamment longue pour satisfaire la contrainte de longueur minimale.','studio',60000,'69007','Lyon')`,
          [IDS.student],
        ),
      '42501',
    );
  });

  it('peut ajouter une annonce publiée à ses favoris', async () => {
    await asUser(db, IDS.student);
    await db.query('insert into public.favorites (user_id, listing_id) values ($1,$2)', [
      IDS.student,
      publishedId,
    ]);
    const result = await db.query<{ listing_id: string }>(
      'select listing_id from public.favorites',
    );
    expect(result.rows.map((row) => row.listing_id)).toContain(publishedId);
  });

  it('ne peut pas ajouter un brouillon à ses favoris', async () => {
    await asUser(db, IDS.student);
    await expectDbError(
      () =>
        db.query('insert into public.favorites (user_id, listing_id) values ($1,$2)', [
          IDS.student,
          draftId,
        ]),
      '42501',
    );
  });

  it('ne peut pas créer un favori au nom d’un autre utilisateur', async () => {
    await asUser(db, IDS.student);
    await expectDbError(
      () =>
        db.query('insert into public.favorites (user_id, listing_id) values ($1,$2)', [
          IDS.otherStudent,
          otherOwnerPublishedId,
        ]),
      '42501',
    );
  });

  it('ne voit que ses propres favoris', async () => {
    await asUser(db, IDS.otherStudent);
    expect(await countRows(db, 'select count(*) as count from public.favorites')).toBe(0);
  });

  it('ne voit pas les demandes des autres utilisateurs', async () => {
    await asUser(db, IDS.otherStudent);
    expect(await countRows(db, 'select count(*) as count from public.inquiries')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
describe('Bailleur authentifié', () => {
  it('voit ses brouillons et annonces en attente', async () => {
    await asUser(db, IDS.owner);
    const result = await db.query<{ id: string }>('select id from public.listings');
    const ids = result.rows.map((row) => row.id);
    expect(ids).toContain(draftId);
    expect(ids).toContain(pendingId);
    expect(ids).toContain(publishedId);
    // Les annonces publiées des autres bailleurs sont publiques…
    expect(ids).toContain(otherOwnerPublishedId);
    // … mais leurs brouillons restent invisibles.
    expect(ids).not.toContain(otherOwnerDraftId);
  });

  it('ne peut pas publier lui-même son annonce (modération obligatoire)', async () => {
    await asUser(db, IDS.owner);
    await expectDbError(
      () => db.query("update public.listings set status = 'published' where id = $1", [pendingId]),
      '42501',
    );
  });

  it('peut modifier son propre brouillon', async () => {
    await asUser(db, IDS.owner);
    await db.query(
      "update public.listings set title = 'Brouillon modifié par son bailleur' where id = $1",
      [draftId],
    );

    await asService(db);
    const result = await db.query<{ title: string }>(
      'select title from public.listings where id = $1',
      [draftId],
    );
    expect(result.rows[0]?.title).toBe('Brouillon modifié par son bailleur');
  });

  it('ne peut pas modifier l’annonce d’un autre bailleur', async () => {
    await asUser(db, IDS.owner);
    const result = await db.query(
      "update public.listings set title = 'Annonce détournée par un tiers' where id = $1",
      [otherOwnerPublishedId],
    );
    expect(result.affectedRows ?? 0).toBe(0);
  });

  it('ne peut pas supprimer l’annonce d’un autre bailleur', async () => {
    await asUser(db, IDS.owner);
    const result = await db.query('delete from public.listings where id = $1', [
      otherOwnerPublishedId,
    ]);
    expect(result.affectedRows ?? 0).toBe(0);
  });

  it('ne peut pas modifier le marqueur de démonstration', async () => {
    await asUser(db, IDS.owner);
    await expectDbError(
      () => db.query('update public.listings set is_demo = true where id = $1', [publishedId]),
      '42501',
    );
  });

  it('ne peut pas changer le propriétaire de son annonce', async () => {
    await asUser(db, IDS.owner);
    await expectDbError(
      () =>
        db.query('update public.listings set owner_id = $1 where id = $2', [
          IDS.otherOwner,
          publishedId,
        ]),
      '42501',
    );
  });

  it('peut archiver son annonce publiée', async () => {
    const tempId = await insertListingAsService(db, {
      ownerId: IDS.owner,
      status: 'published',
      title: 'Annonce temporaire destinée à être archivée',
    });
    await asUser(db, IDS.owner);
    await db.query("update public.listings set status = 'archived' where id = $1", [tempId]);

    await asService(db);
    const result = await db.query<{ status: string }>(
      'select status from public.listings where id = $1',
      [tempId],
    );
    expect(result.rows[0]?.status).toBe('archived');
  });

  it('ne voit pas le profil d’un étudiant', async () => {
    await asUser(db, IDS.owner);
    const result = await db.query('select id from public.profiles where id = $1', [IDS.student]);
    expect(result.rows).toHaveLength(0);
  });

  it('ne peut pas lire les demandes adressées à un autre bailleur', async () => {
    await asUser(db, IDS.otherOwner);
    // Une demande existe pourtant sur l'annonce de IDS.owner.
    expect(await countRows(db, 'select count(*) as count from public.inquiries')).toBe(0);
  });

  it('peut insérer une photo dans son propre dossier', async () => {
    await asUser(db, IDS.owner);
    await db.query('insert into public.listing_photos (listing_id, storage_path) values ($1,$2)', [
      draftId,
      `${IDS.owner}/${draftId}/photo-1.webp`,
    ]);
    const result = await db.query('select id from public.listing_photos where listing_id = $1', [
      draftId,
    ]);
    expect(result.rows).toHaveLength(1);
  });

  it('ne peut pas insérer de photo sur l’annonce d’un autre bailleur', async () => {
    await asUser(db, IDS.owner);
    await expectDbError(
      () =>
        db.query('insert into public.listing_photos (listing_id, storage_path) values ($1,$2)', [
          otherOwnerPublishedId,
          `${IDS.otherOwner}/${otherOwnerPublishedId}/photo-pirate.webp`,
        ]),
      '42501',
    );
  });
});

// ---------------------------------------------------------------------------
describe('Staff (modérateur / administrateur)', () => {
  it('un modérateur voit toutes les annonces, y compris les brouillons', async () => {
    await asUser(db, IDS.moderator);
    const ids = (await db.query<{ id: string }>('select id from public.listings')).rows.map(
      (row) => row.id,
    );
    expect(ids).toEqual(
      expect.arrayContaining([draftId, pendingId, publishedId, otherOwnerPublishedId]),
    );
  });

  it('un administrateur peut publier une annonce en attente', async () => {
    await asUser(db, IDS.admin);
    await db.query("update public.listings set status = 'published' where id = $1", [pendingId]);

    await asService(db);
    const result = await db.query<{ status: string; published_at: string | null }>(
      'select status, published_at from public.listings where id = $1',
      [pendingId],
    );
    expect(result.rows[0]?.status).toBe('published');
    expect(result.rows[0]?.published_at).not.toBeNull();
  });

  it('un administrateur voit toutes les demandes de logement', async () => {
    await asUser(db, IDS.admin);
    expect(await countRows(db, 'select count(*) as count from public.inquiries')).toBeGreaterThan(
      0,
    );
  });

  it('un administrateur peut modifier le rôle d’un utilisateur', async () => {
    await asUser(db, IDS.admin);
    const update = await db.query("update public.profiles set role = 'moderator' where id = $1", [
      IDS.otherStudent,
    ]);
    expect(update.affectedRows).toBe(1);

    await asService(db);
    const result = await db.query<{ role: string }>(
      'select role from public.profiles where id = $1',
      [IDS.otherStudent],
    );
    expect(result.rows[0]?.role).toBe('moderator');
  });

  it('un modérateur ne peut pas modifier le rôle d’un utilisateur', async () => {
    await asUser(db, IDS.moderator);
    // La politique RLS restreint la mise à jour des profils tiers aux
    // administrateurs : la requête réussit mais ne touche aucune ligne.
    const update = await db.query("update public.profiles set role = 'admin' where id = $1", [
      IDS.student,
    ]);
    expect(update.affectedRows).toBe(0);

    await asService(db);
    const check = await db.query<{ role: string }>(
      'select role from public.profiles where id = $1',
      [IDS.student],
    );
    expect(check.rows[0]?.role).toBe('student');
  });
});

// ---------------------------------------------------------------------------
describe('Cohérence globale des politiques', () => {
  it('aucune table du schéma public ne reste sans RLS', async () => {
    await asService(db);
    const result = await db.query<{ relname: string }>(
      `select c.relname
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false`,
    );
    expect(result.rows).toEqual([]);
  });

  it('les fonctions internes ne sont pas exécutables par les clients', async () => {
    await asAnon(db);
    await expectDbError(() => db.query('select public.handle_new_user()'), '42501');
  });

  it('les fonctions publiques utiles restent accessibles', async () => {
    await asAnon(db);
    const result = await db.query<{ is_staff: boolean }>('select public.is_staff() as is_staff');
    expect(result.rows[0]?.is_staff).toBe(false);
  });
});
