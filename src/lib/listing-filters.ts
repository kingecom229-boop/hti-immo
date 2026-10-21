import type {
  ListingWithPhotos,
  PaginatedListings,
  SearchFilters,
  PropertyType,
} from '@/types/domain';
import { normalizeText } from './format';

/**
 * Application locale des filtres de recherche.
 *
 * Cette fonction pure sert à deux usages :
 *  1. mode démonstration (aucun backend) ;
 *  2. tests unitaires de la logique de filtrage/tri/pagination.
 *
 * Les mêmes règles sont appliquées côté SQL en production (voir
 * `src/lib/listings-api.ts`), afin que le comportement reste cohérent.
 */
export function filterAndPaginateListings(
  listings: ListingWithPhotos[],
  filters: SearchFilters,
): PaginatedListings {
  const query = normalizeText(filters.q);
  const city = normalizeText(filters.city);

  const filtered = listings.filter((listing) => {
    if (listing.status !== 'published') return false;

    if (query) {
      const haystack = normalizeText(
        [
          listing.title,
          listing.city,
          listing.postal_code,
          listing.description ?? '',
          ...listing.amenities,
        ].join(' '),
      );
      if (!haystack.includes(query)) return false;
    }

    if (city && !normalizeText(listing.city).includes(city)) return false;

    if (filters.postalCode && !listing.postal_code.startsWith(filters.postalCode)) return false;

    if (filters.type && listing.property_type !== (filters.type as PropertyType)) return false;

    if (filters.minPrice !== null && listing.price_cents < filters.minPrice * 100) return false;
    if (filters.maxPrice !== null && listing.price_cents > filters.maxPrice * 100) return false;

    if (filters.minSurface !== null && (listing.surface_m2 ?? 0) < filters.minSurface) return false;

    if (filters.furnished !== null && listing.furnished !== filters.furnished) return false;
    if (filters.petsAllowed !== null && listing.pets_allowed !== filters.petsAllowed) return false;

    if (
      filters.amenities.length > 0 &&
      !filters.amenities.every((amenity) => listing.amenities.includes(amenity))
    ) {
      return false;
    }

    if (filters.availableFrom && listing.available_from) {
      if (listing.available_from > filters.availableFrom) return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (filters.sort) {
      case 'price_asc':
        return a.price_cents - b.price_cents;
      case 'price_desc':
        return b.price_cents - a.price_cents;
      case 'surface_desc':
        return (b.surface_m2 ?? 0) - (a.surface_m2 ?? 0);
      case 'recent':
      default:
        return (b.published_at ?? b.created_at).localeCompare(a.published_at ?? a.created_at);
    }
  });

  const total = sorted.length;
  const pageSize = Math.max(1, filters.pageSize);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, filters.page), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: sorted.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

/** Nettoie une valeur destinée à un filtre PostgREST (anti-injection de syntaxe). */
export function sanitizeFilterValue(value: string): string {
  return value
    .replace(/[,()*:\\]/g, ' ')
    .replace(/[%_]/g, ' ')
    .trim();
}

/** Nettoie une requête de recherche plein texte (tsquery). */
export function sanitizeSearchQuery(value: string): string {
  return value
    .replace(/[':&|!<>()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}
