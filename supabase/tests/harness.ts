import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Banc d'essai PostgreSQL pour HTI-IMMO.
 *
 * PGlite est PostgreSQL compilé en WebAssembly : le schéma, les contraintes,
 * les triggers et les politiques RLS sont donc testés par un VRAI moteur
 * PostgreSQL, sans aucune connexion à la base Supabase de production.
 *
 * Le bootstrap reproduit le minimum du contexte Supabase :
 *   - les rôles `anon`, `authenticated` et `service_role` ;
 *   - le schéma `auth` avec `auth.users` et `auth.uid()` (lecture de
 *     `request.jwt.claims`, comme PostgREST).
 */

const MIGRATIONS_DIR = fileURLToPath(new URL('../migrations', import.meta.url));

export const IDS = {
  student: '11111111-1111-4111-8111-111111111111',
  otherStudent: '22222222-2222-4222-8222-222222222222',
  owner: '33333333-3333-4333-8333-333333333333',
  otherOwner: '44444444-4444-4444-8444-444444444444',
  admin: '55555555-5555-4555-8555-555555555555',
  moderator: '66666666-6666-4666-8666-666666666666',
};

const BOOTSTRAP_SQL = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;

  create schema if not exists auth;

  create table auth.users (
    id uuid primary key,
    email text unique,
    raw_user_meta_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );

  -- Reproduit auth.uid() de Supabase : identifiant issu des claims JWT.
  create or replace function auth.uid()
  returns uuid
  language sql
  stable
  as $$
    select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
  $$;

  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
`;

/** Crée une base PostgreSQL éphémère et y applique toutes les migrations. */
export async function createTestDatabase(): Promise<PGlite> {
  const db = new PGlite();

  await db.exec(BOOTSTRAP_SQL);

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    throw new Error('Aucune migration trouvée dans supabase/migrations.');
  }

  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    try {
      await db.exec(sql);
    } catch (error) {
      throw new Error(`Échec de la migration ${file} : ${(error as Error).message}`, {
        cause: error,
      });
    }
  }

  return db;
}

/** Exécute les requêtes en tant que service (équivalent `service_role`). */
export async function asService(db: PGlite): Promise<void> {
  await db.exec('reset role');
  await db.exec("select set_config('request.jwt.claims', '', false)");
}

/** Exécute les requêtes en tant que visiteur non authentifié. */
export async function asAnon(db: PGlite): Promise<void> {
  await db.exec('reset role');
  await db.exec("select set_config('request.jwt.claims', '', false)");
  await db.exec('set role anon');
}

/** Exécute les requêtes en tant qu'utilisateur authentifié (rôle `authenticated`). */
export async function asUser(db: PGlite, userId: string): Promise<void> {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claims', $1, false)", [
    JSON.stringify({ sub: userId, role: 'authenticated' }),
  ]);
  await db.exec('set role authenticated');
}

export interface NewUser {
  id: string;
  email: string;
  fullName?: string;
  requestedRole?: string;
}

/** Crée un compte dans `auth.users` : le trigger crée automatiquement le profil. */
export async function createUser(db: PGlite, user: NewUser): Promise<void> {
  await asService(db);
  await db.query('insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)', [
    user.id,
    user.email,
    JSON.stringify({
      full_name: user.fullName ?? 'Utilisateur Test',
      role: user.requestedRole ?? 'student',
    }),
  ]);
}

export const LONG_DESCRIPTION =
  'Annonce de test décrivant un logement étudiant fictif utilisé uniquement pour vérifier le schéma et les politiques de sécurité.';

export interface ListingSeed {
  ownerId: string;
  status?: 'draft' | 'pending' | 'published' | 'rented' | 'archived';
  title?: string;
  city?: string;
  postalCode?: string;
  priceCents?: number;
  amenities?: string[];
  isDemo?: boolean;
  description?: string;
}

let listingCounter = 0;

/** Insère une annonce en contournant RLS (contexte service), pour préparer un test. */
export async function insertListingAsService(db: PGlite, seed: ListingSeed): Promise<string> {
  await asService(db);
  listingCounter += 1;
  const result = await db.query<{ id: string }>(
    `insert into public.listings
       (owner_id, title, description, property_type, status, price_cents,
        surface_m2, rooms, postal_code, city, amenities, is_demo)
     values ($1, $2, $3, 'studio', $4, $5, 24.0, 1, $6, $7, $8::text[], $9)
     returning id`,
    [
      seed.ownerId,
      seed.title ?? `Studio de test numéro ${listingCounter} proche du campus`,
      seed.description ?? LONG_DESCRIPTION,
      seed.status ?? 'published',
      seed.priceCents ?? 62000,
      seed.postalCode ?? '69007',
      seed.city ?? 'Lyon',
      seed.amenities ?? ['wifi', 'meuble'],
      seed.isDemo ?? false,
    ],
  );

  const row = result.rows[0];
  if (!row) throw new Error('Insertion d’annonce impossible.');
  return row.id;
}

export interface DbError {
  code?: string;
  message?: string;
}

/** Vérifie qu'une requête est rejetée, avec le code d'erreur PostgreSQL attendu. */
export async function expectDbError(
  operation: () => Promise<unknown>,
  expectedCode?: string,
): Promise<DbError> {
  try {
    await operation();
  } catch (error) {
    const dbError = error as DbError;
    if (expectedCode && dbError.code !== expectedCode) {
      throw new Error(
        `Code PostgreSQL inattendu : ${String(dbError.code)} (attendu ${expectedCode}) — ${String(
          dbError.message,
        )}`,
      );
    }
    return dbError;
  }
  throw new Error('La requête aurait dû être rejetée, mais elle a réussi.');
}

/** Renvoie le nombre de lignes visibles par une requête `select count(*)`. */
export async function countRows(db: PGlite, sql: string, params: unknown[] = []): Promise<number> {
  const result = await db.query<{ count: string | number }>(sql, params);
  const raw = result.rows[0]?.count ?? 0;
  return typeof raw === 'string' ? Number.parseInt(raw, 10) : raw;
}
