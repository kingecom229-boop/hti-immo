import type { PropertyType, ListingAmenity, ListingStatus } from '@/types/domain';

const eurFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/** Formate un montant en centimes vers « 650 € ». */
export function formatPrice(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || Number.isNaN(cents)) return '—';
  return eurFormatter.format(cents / 100);
}

/** Formate un montant en euros (déjà en euros) — usage interne. */
export function formatEuros(euros: number): string {
  return eurFormatter.format(euros);
}

/** « 25 m² » ou « — ». */
export function formatSurface(m2: number | null | undefined): string {
  if (m2 === null || m2 === undefined) return '—';
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(m2)} m²`;
}

/** « 12 mars 2026 » ; renvoie « — » si absent ou invalide. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateFormatter.format(date);
}

/** « 12/03/2026 ». */
export function formatShortDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return shortDateFormatter.format(date);
}

/** Convertit un timestamp en valeur pour `<input type="date">`. */
export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  studio: 'Studio',
  appartement: 'Appartement',
  colocation: 'Colocation',
  chambre: 'Chambre',
  residence: 'Résidence étudiante',
};

export const AMENITY_LABELS: Record<ListingAmenity, string> = {
  wifi: 'Wi-Fi inclus',
  lave_linge: 'Lave-linge',
  cuisine_equipee: 'Cuisine équipée',
  ascenseur: 'Ascenseur',
  balcon: 'Balcon / terrasse',
  parking: 'Parking',
  chauffage: 'Chauffage inclus',
  meuble: 'Meublé',
  digicode: 'Digicode / sécurisé',
  handicap_access: 'Accessible PMR',
};

export const STATUS_LABELS: Record<ListingStatus, string> = {
  draft: 'Brouillon',
  pending: 'En attente de validation',
  published: 'Publiée',
  rented: 'Louée',
  archived: 'Archivée',
};

/** Normalise une chaîne pour la recherche (minuscules, sans accents). */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function formatPropertyType(type: PropertyType): string {
  return PROPERTY_TYPE_LABELS[type] ?? type;
}

export function formatAmenity(amenity: ListingAmenity): string {
  return AMENITY_LABELS[amenity] ?? amenity;
}

/** Pluralisation simple à la française. */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count > 1 ? (plural ?? `${singular}s`) : singular;
}

/** Construit un libellé court d'adresse : « Ville (75001) ». */
export function formatCityLine(city: string, postalCode: string): string {
  return `${city} (${postalCode})`;
}
