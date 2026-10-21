import { DEFAULT_FILTERS, type ListingAmenity, type SearchFilters } from '@/types/domain';

/** Équipements acceptés dans l'URL (liste blanche stricte). */
export const AMENITY_OPTIONS: { value: ListingAmenity; label: string }[] = [
  { value: 'wifi', label: 'Wi-Fi inclus' },
  { value: 'lave_linge', label: 'Lave-linge' },
  { value: 'cuisine_equipee', label: 'Cuisine équipée' },
  { value: 'ascenseur', label: 'Ascenseur' },
  { value: 'balcon', label: 'Balcon / terrasse' },
  { value: 'parking', label: 'Parking' },
  { value: 'chauffage', label: 'Chauffage inclus' },
  { value: 'meuble', label: 'Meublé' },
  { value: 'digicode', label: 'Digicode' },
  { value: 'handicap_access', label: 'Accessible PMR' },
];

const SORT_VALUES: SearchFilters['sort'][] = ['recent', 'price_asc', 'price_desc', 'surface_desc'];
const TYPE_VALUES = ['studio', 'appartement', 'colocation', 'chambre', 'residence'] as const;

function parsePositiveNumber(raw: string | null, max: number): number | null {
  if (!raw) return null;
  const value = Number(raw.replace(',', '.'));
  if (!Number.isFinite(value) || value < 0 || value > max) return null;
  return value;
}

function parseBoolean(raw: string | null): boolean | null {
  if (raw === '1' || raw === 'true') return true;
  if (raw === '0' || raw === 'false') return false;
  return null;
}

function parseDate(raw: string | null): string | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return raw;
}

/**
 * Lit les filtres depuis l'URL.
 * Toute valeur invalide est ignorée (retour au comportement par défaut) :
 * l'URL est une entrée non fiable.
 */
export function parseFilters(params: URLSearchParams): SearchFilters {
  const type = params.get('type');
  const sort = params.get('tri');
  const amenities = (params.get('equipements') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is ListingAmenity =>
      AMENITY_OPTIONS.some((option) => option.value === value),
    );

  const pageRaw = Number(params.get('page') ?? '1');

  return {
    q: (params.get('q') ?? '').slice(0, 120),
    city: (params.get('ville') ?? '').slice(0, 80),
    postalCode: (params.get('cp') ?? '').replace(/\D/g, '').slice(0, 5),
    type: TYPE_VALUES.includes(type as (typeof TYPE_VALUES)[number])
      ? (type as SearchFilters['type'])
      : '',
    minPrice: parsePositiveNumber(params.get('min'), 10_000),
    maxPrice: parsePositiveNumber(params.get('max'), 10_000),
    minSurface: parsePositiveNumber(params.get('surface'), 1_000),
    furnished: parseBoolean(params.get('meuble')),
    petsAllowed: parseBoolean(params.get('animaux')),
    amenities: Array.from(new Set(amenities)),
    availableFrom: parseDate(params.get('dispo')),
    sort: SORT_VALUES.includes(sort as SearchFilters['sort'])
      ? (sort as SearchFilters['sort'])
      : 'recent',
    page: Number.isFinite(pageRaw) ? Math.min(Math.max(1, Math.floor(pageRaw)), 500) : 1,
    pageSize: DEFAULT_FILTERS.pageSize,
  };
}

/** Sérialise les filtres en paramètres d'URL (les valeurs par défaut sont omises). */
export function filtersToParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.q) params.set('q', filters.q);
  if (filters.city) params.set('ville', filters.city);
  if (filters.postalCode) params.set('cp', filters.postalCode);
  if (filters.type) params.set('type', filters.type);
  if (filters.minPrice !== null) params.set('min', String(filters.minPrice));
  if (filters.maxPrice !== null) params.set('max', String(filters.maxPrice));
  if (filters.minSurface !== null) params.set('surface', String(filters.minSurface));
  if (filters.furnished !== null) params.set('meuble', filters.furnished ? '1' : '0');
  if (filters.petsAllowed !== null) params.set('animaux', filters.petsAllowed ? '1' : '0');
  if (filters.amenities.length > 0) params.set('equipements', filters.amenities.join(','));
  if (filters.availableFrom) params.set('dispo', filters.availableFrom);
  if (filters.sort !== 'recent') params.set('tri', filters.sort);
  if (filters.page > 1) params.set('page', String(filters.page));

  return params;
}

/** Compte les filtres actifs, pour l'affichage du badge « Filtres (3) ». */
export function countActiveFilters(filters: SearchFilters): number {
  let count = 0;
  if (filters.q) count += 1;
  if (filters.city) count += 1;
  if (filters.postalCode) count += 1;
  if (filters.type) count += 1;
  if (filters.minPrice !== null) count += 1;
  if (filters.maxPrice !== null) count += 1;
  if (filters.minSurface !== null) count += 1;
  if (filters.furnished !== null) count += 1;
  if (filters.petsAllowed !== null) count += 1;
  count += filters.amenities.length;
  if (filters.availableFrom) count += 1;
  return count;
}
