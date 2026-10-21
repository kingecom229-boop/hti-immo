import { supabase, isSupabaseConfigured } from './supabase';
import { config } from './config';
import { ApiError } from './api-error';
import { translateDataError } from './auth-errors';
import {
  sanitizeFilterValue,
  sanitizeSearchQuery,
  filterAndPaginateListings,
} from './listing-filters';
import { allDemoListings, removeDemoListing, upsertDemoListing } from './demo-store';
import type {
  Listing,
  ListingStatus,
  ListingWithPhotos,
  PaginatedListings,
  SearchFilters,
} from '@/types/domain';
import type { ListingInput } from './validation';

const LISTING_SELECT = '*, listing_photos(*)';

function isDemo(): boolean {
  return config.demoMode || !isSupabaseConfigured || !supabase;
}

/** Vérifie qu'un identifiant est un UUID (évite les requêtes inutiles). */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Construit l'URL publique d'une photo.
 * Les chemins commençant par « / » sont des illustrations locales
 * (mode démonstration).
 */
export function resolvePhotoUrl(storagePath: string): string {
  if (!storagePath) return '/images/demo/studio-lumiere.svg';
  if (storagePath.startsWith('/') || storagePath.startsWith('http')) return storagePath;
  if (!config.hasSupabase) return '/images/demo/studio-lumiere.svg';
  return `${config.supabaseUrl}/storage/v1/object/public/listing-photos/${storagePath}`;
}

/** Tri des photos par position, avec repli sur la date de création. */
export function sortPhotos<T extends { position: number; created_at: string }>(photos: T[]): T[] {
  return [...photos].sort((a, b) =>
    a.position === b.position ? a.created_at.localeCompare(b.created_at) : a.position - b.position,
  );
}

// ---------------------------------------------------------------------------
// Recherche
// ---------------------------------------------------------------------------
export async function searchListings(filters: SearchFilters): Promise<PaginatedListings> {
  if (isDemo()) {
    return filterAndPaginateListings(allDemoListings(), filters);
  }

  const client = supabase;
  if (!client) throw new ApiError('Supabase n’est pas configuré.');

  let query = client
    .from('listings')
    .select(LISTING_SELECT, { count: 'exact' })
    .eq('status', 'published');

  const searchTerm = sanitizeSearchQuery(filters.q);
  if (searchTerm) {
    query = query.textSearch('search_vector', searchTerm, { type: 'websearch' });
  }

  const city = sanitizeFilterValue(filters.city);
  if (city) query = query.ilike('city', `%${city}%`);

  const postal = filters.postalCode.replace(/\D/g, '').slice(0, 5);
  if (postal) query = query.like('postal_code', `${postal}%`);

  if (filters.type) query = query.eq('property_type', filters.type);
  if (filters.minPrice !== null)
    query = query.gte('price_cents', Math.round(filters.minPrice * 100));
  if (filters.maxPrice !== null)
    query = query.lte('price_cents', Math.round(filters.maxPrice * 100));
  if (filters.minSurface !== null) query = query.gte('surface_m2', filters.minSurface);
  if (filters.furnished !== null) query = query.eq('furnished', filters.furnished);
  if (filters.petsAllowed !== null) query = query.eq('pets_allowed', filters.petsAllowed);
  if (filters.amenities.length > 0) query = query.contains('amenities', filters.amenities);
  if (filters.availableFrom) query = query.lte('available_from', filters.availableFrom);

  switch (filters.sort) {
    case 'price_asc':
      query = query.order('price_cents', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price_cents', { ascending: false });
      break;
    case 'surface_desc':
      query = query.order('surface_m2', { ascending: false, nullsFirst: false });
      break;
    case 'recent':
    default:
      query = query.order('published_at', { ascending: false, nullsFirst: false });
      break;
  }

  const pageSize = Math.max(1, Math.min(48, filters.pageSize));
  const page = Math.max(1, filters.page);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new ApiError(translateDataError(error), error.code);
  }

  const items = ((data ?? []) as ListingWithPhotos[]).map((listing) => ({
    ...listing,
    listing_photos: sortPhotos(listing.listing_photos ?? []),
  }));

  const total = count ?? items.length;

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// ---------------------------------------------------------------------------
// Détail
// ---------------------------------------------------------------------------
export async function getListingById(id: string): Promise<ListingWithPhotos | null> {
  if (isDemo()) {
    return allDemoListings().find((listing) => listing.id === id) ?? null;
  }

  if (!isUuid(id)) return null;
  const client = supabase;
  if (!client) throw new ApiError('Supabase n’est pas configuré.');

  const { data, error } = await client
    .from('listings')
    .select(LISTING_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new ApiError(translateDataError(error), error.code);
  if (!data) return null;

  const listing = data as ListingWithPhotos;
  return { ...listing, listing_photos: sortPhotos(listing.listing_photos ?? []) };
}

// ---------------------------------------------------------------------------
// Annonces du bailleur
// ---------------------------------------------------------------------------
export async function getMyListings(ownerId: string): Promise<ListingWithPhotos[]> {
  if (isDemo()) {
    return allDemoListings()
      .filter((listing) => listing.owner_id === ownerId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const client = supabase;
  if (!client) throw new ApiError('Supabase n’est pas configuré.');

  const { data, error } = await client
    .from('listings')
    .select(LISTING_SELECT)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) throw new ApiError(translateDataError(error), error.code);
  return ((data ?? []) as ListingWithPhotos[]).map((listing) => ({
    ...listing,
    listing_photos: sortPhotos(listing.listing_photos ?? []),
  }));
}

/** Convertit la saisie du formulaire en colonnes PostgreSQL. */
export function toListingRow(input: ListingInput) {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    property_type: input.propertyType,
    price_cents: Math.round(input.priceEuros * 100),
    charges_included: input.chargesIncluded,
    deposit_cents: input.depositEuros === undefined ? null : Math.round(input.depositEuros * 100),
    surface_m2: input.surfaceM2,
    rooms: input.rooms,
    bedrooms: input.bedrooms,
    furnished: input.furnished,
    pets_allowed: input.petsAllowed,
    available_from: input.availableFrom ?? null,
    address_line: input.addressLine?.trim() || null,
    postal_code: input.postalCode.trim(),
    city: input.city.trim(),
    amenities: input.amenities,
  };
}

export async function createListing(input: ListingInput, ownerId: string): Promise<{ id: string }> {
  if (isDemo()) {
    const id = `demo-listing-local-${Date.now()}`;
    const now = new Date().toISOString();
    const listing: ListingWithPhotos = {
      id,
      owner_id: ownerId,
      status: 'pending',
      is_demo: true,
      contact_name: 'Annonce locale de démonstration',
      contact_email: null,
      contact_phone: null,
      latitude: null,
      longitude: null,
      nearby_schools: [],
      created_at: now,
      updated_at: now,
      published_at: null,
      listing_photos: [],
      ...toListingRow(input),
      available_from: input.availableFrom ?? null,
    };
    upsertDemoListing(listing);
    return { id };
  }

  const client = supabase;
  if (!client) throw new ApiError('Supabase n’est pas configuré.');

  const { data, error } = await client
    .from('listings')
    .insert({ ...toListingRow(input), owner_id: ownerId, status: 'pending' })
    .select('id')
    .single();

  if (error) throw new ApiError(translateDataError(error), error.code);
  return { id: (data as { id: string }).id };
}

export async function updateListing(
  id: string,
  input: ListingInput,
  ownerId: string,
): Promise<void> {
  if (isDemo()) {
    const existing = allDemoListings().find((listing) => listing.id === id);
    if (!existing) throw new ApiError('Annonce introuvable.', 'not_found');
    upsertDemoListing({
      ...existing,
      ...toListingRow(input),
      status: existing.status === 'published' ? 'pending' : existing.status,
      updated_at: new Date().toISOString(),
    });
    return;
  }

  const client = supabase;
  if (!client) throw new ApiError('Supabase n’est pas configuré.');
  if (!isUuid(id)) throw new ApiError('Identifiant d’annonce invalide.', 'invalid_id');

  const { error } = await client
    .from('listings')
    .update({ ...toListingRow(input), owner_id: ownerId })
    .eq('id', id)
    .eq('owner_id', ownerId);

  if (error) throw new ApiError(translateDataError(error), error.code);
}

export async function updateListingStatus(id: string, status: ListingStatus): Promise<void> {
  if (isDemo()) {
    const existing = allDemoListings().find((listing) => listing.id === id);
    if (!existing) throw new ApiError('Annonce introuvable.', 'not_found');
    upsertDemoListing({
      ...existing,
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    });
    return;
  }

  const client = supabase;
  if (!client) throw new ApiError('Supabase n’est pas configuré.');
  if (!isUuid(id)) throw new ApiError('Identifiant d’annonce invalide.', 'invalid_id');

  const { error } = await client.from('listings').update({ status }).eq('id', id);
  if (error) throw new ApiError(translateDataError(error), error.code);
}

export async function deleteListing(id: string): Promise<void> {
  if (isDemo()) {
    removeDemoListing(id);
    return;
  }

  const client = supabase;
  if (!client) throw new ApiError('Supabase n’est pas configuré.');
  if (!isUuid(id)) throw new ApiError('Identifiant d’annonce invalide.', 'invalid_id');

  const { error } = await client.from('listings').delete().eq('id', id);
  if (error) throw new ApiError(translateDataError(error), error.code);
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export interface PhotoValidation {
  valid: boolean;
  message?: string;
}

/** Valide un fichier avant tout envoi (type MIME, extension et taille). */
export function validatePhotoFile(file: File): PhotoValidation {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_TYPES)[number])) {
    return { valid: false, message: 'Format accepté : JPEG, PNG ou WebP.' };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { valid: false, message: 'La photo ne doit pas dépasser 5 Mo.' };
  }
  if (file.size === 0) {
    return { valid: false, message: 'Le fichier sélectionné est vide.' };
  }
  return { valid: true };
}

export async function uploadListingPhoto(
  listingId: string,
  ownerId: string,
  file: File,
): Promise<{ storagePath: string }> {
  const check = validatePhotoFile(file);
  if (!check.valid) throw new ApiError(check.message ?? 'Fichier invalide.', 'invalid_file');

  if (isDemo()) {
    return { storagePath: '/images/demo/studio-lumiere.svg' };
  }

  const client = supabase;
  if (!client) throw new ApiError('Supabase n’est pas configuré.');

  const extension =
    file.name
      .split('.')
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${ownerId}/${listingId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await client.storage
    .from('listing-photos')
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });

  if (error) {
    throw new ApiError('L’envoi de la photo a échoué. Réessayez avec un fichier plus léger.');
  }

  return { storagePath: path };
}

export async function attachPhoto(
  listingId: string,
  storagePath: string,
  position: number,
  altText?: string,
): Promise<void> {
  if (isDemo()) return;
  const client = supabase;
  if (!client) throw new ApiError('Supabase n’est pas configuré.');

  const { error } = await client.from('listing_photos').insert({
    listing_id: listingId,
    storage_path: storagePath,
    position,
    alt_text: altText ?? null,
  });
  if (error) throw new ApiError(translateDataError(error), error.code);
}

export async function removePhoto(photoId: string, storagePath: string): Promise<void> {
  if (isDemo()) return;
  const client = supabase;
  if (!client) throw new ApiError('Supabase n’est pas configuré.');

  const { error } = await client.from('listing_photos').delete().eq('id', photoId);
  if (error) throw new ApiError(translateDataError(error), error.code);

  if (!storagePath.startsWith('/')) {
    await client.storage.from('listing-photos').remove([storagePath]);
  }
}

/** Convertit une annonce complète en saisie de formulaire (édition). */
export function listingToInput(listing: Listing): ListingInput {
  return {
    title: listing.title,
    description: listing.description ?? '',
    propertyType: listing.property_type,
    priceEuros: Math.round(listing.price_cents / 100),
    chargesIncluded: listing.charges_included,
    depositEuros:
      listing.deposit_cents === null ? undefined : Math.round(listing.deposit_cents / 100),
    surfaceM2: listing.surface_m2 ?? 0,
    rooms: listing.rooms ?? 1,
    bedrooms: listing.bedrooms ?? 0,
    furnished: listing.furnished,
    petsAllowed: listing.pets_allowed,
    availableFrom: listing.available_from ?? undefined,
    addressLine: listing.address_line ?? undefined,
    postalCode: listing.postal_code,
    city: listing.city,
    amenities: listing.amenities,
  };
}

// ---------------------------------------------------------------------------
// Administration (modérateurs et administrateurs uniquement)
// ---------------------------------------------------------------------------
/** Toutes les annonces, tous statuts confondus. Réservé au staff (RLS). */
export async function getAllListingsForStaff(): Promise<ListingWithPhotos[]> {
  if (isDemo()) {
    return allDemoListings().sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const client = supabase;
  if (!client) throw new ApiError('Supabase n’est pas configuré.');

  const { data, error } = await client
    .from('listings')
    .select(LISTING_SELECT)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw new ApiError(translateDataError(error), error.code);

  return ((data ?? []) as ListingWithPhotos[]).map((listing) => ({
    ...listing,
    listing_photos: sortPhotos(listing.listing_photos ?? []),
  }));
}
