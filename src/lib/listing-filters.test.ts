import { describe, expect, it } from 'vitest';
import {
  filterAndPaginateListings,
  sanitizeFilterValue,
  sanitizeSearchQuery,
} from './listing-filters';
import { DEFAULT_FILTERS } from '@/types/domain';
import { DEMO_LISTINGS } from '@/data/demo-listings';

const base = { ...DEFAULT_FILTERS, pageSize: 50 };

describe('filterAndPaginateListings', () => {
  it('retourne toutes les annonces publiées sans filtre', () => {
    const result = filterAndPaginateListings(DEMO_LISTINGS, base);
    expect(result.total).toBe(DEMO_LISTINGS.length);
    expect(result.items).toHaveLength(DEMO_LISTINGS.length);
  });

  it('exclut les annonces non publiées', () => {
    const withDraft = [
      ...DEMO_LISTINGS,
      { ...DEMO_LISTINGS[0]!, id: 'brouillon', status: 'draft' as const },
    ];
    const result = filterAndPaginateListings(withDraft, base);
    expect(result.items.find((item) => item.id === 'brouillon')).toBeUndefined();
    expect(result.total).toBe(DEMO_LISTINGS.length);
  });

  it('filtre par ville sans tenir compte de la casse', () => {
    const result = filterAndPaginateListings(DEMO_LISTINGS, { ...base, city: 'lyON' });
    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((item) => item.city === 'Lyon')).toBe(true);
  });

  it('filtre par préfixe de code postal', () => {
    const result = filterAndPaginateListings(DEMO_LISTINGS, { ...base, postalCode: '69' });
    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((item) => item.postal_code.startsWith('69'))).toBe(true);
  });

  it('filtre par type de logement', () => {
    const result = filterAndPaginateListings(DEMO_LISTINGS, { ...base, type: 'colocation' });
    expect(result.items.every((item) => item.property_type === 'colocation')).toBe(true);
  });

  it('filtre par fourchette de prix (euros → centimes)', () => {
    const result = filterAndPaginateListings(DEMO_LISTINGS, {
      ...base,
      minPrice: 450,
      maxPrice: 600,
    });
    expect(result.total).toBeGreaterThan(0);
    expect(
      result.items.every((item) => item.price_cents >= 45000 && item.price_cents <= 60000),
    ).toBe(true);
  });

  it('filtre par surface minimale', () => {
    const result = filterAndPaginateListings(DEMO_LISTINGS, { ...base, minSurface: 40 });
    expect(result.items.every((item) => (item.surface_m2 ?? 0) >= 40)).toBe(true);
  });

  it('filtre sur meublé et animaux', () => {
    const furnished = filterAndPaginateListings(DEMO_LISTINGS, { ...base, furnished: true });
    expect(furnished.items.every((item) => item.furnished)).toBe(true);

    const pets = filterAndPaginateListings(DEMO_LISTINGS, { ...base, petsAllowed: true });
    expect(pets.items.every((item) => item.pets_allowed)).toBe(true);
  });

  it('exige tous les équipements demandés (ET logique)', () => {
    const result = filterAndPaginateListings(DEMO_LISTINGS, {
      ...base,
      amenities: ['wifi', 'lave_linge'],
    });
    expect(
      result.items.every(
        (item) => item.amenities.includes('wifi') && item.amenities.includes('lave_linge'),
      ),
    ).toBe(true);
  });

  it('recherche en texte libre sans accents', () => {
    const result = filterAndPaginateListings(DEMO_LISTINGS, { ...base, q: 'ETUDIANTE' });
    expect(result.total).toBeGreaterThan(0);
  });

  it('trie par loyer croissant', () => {
    const result = filterAndPaginateListings(DEMO_LISTINGS, { ...base, sort: 'price_asc' });
    const prices = result.items.map((item) => item.price_cents);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('trie par loyer décroissant', () => {
    const result = filterAndPaginateListings(DEMO_LISTINGS, { ...base, sort: 'price_desc' });
    const prices = result.items.map((item) => item.price_cents);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  it('trie par surface décroissante', () => {
    const result = filterAndPaginateListings(DEMO_LISTINGS, { ...base, sort: 'surface_desc' });
    const surfaces = result.items.map((item) => item.surface_m2 ?? 0);
    expect(surfaces).toEqual([...surfaces].sort((a, b) => b - a));
  });

  it('pagine correctement', () => {
    const first = filterAndPaginateListings(DEMO_LISTINGS, { ...base, pageSize: 5, page: 1 });
    expect(first.items).toHaveLength(5);
    expect(first.totalPages).toBe(Math.ceil(DEMO_LISTINGS.length / 5));

    const second = filterAndPaginateListings(DEMO_LISTINGS, { ...base, pageSize: 5, page: 2 });
    const firstIds = first.items.map((item) => item.id);
    expect(second.items.some((item) => firstIds.includes(item.id))).toBe(false);
  });

  it('ramène une page hors bornes sur la dernière page', () => {
    const result = filterAndPaginateListings(DEMO_LISTINGS, { ...base, pageSize: 5, page: 99 });
    expect(result.page).toBe(result.totalPages);
  });

  it('retourne une liste vide si aucun résultat', () => {
    const result = filterAndPaginateListings(DEMO_LISTINGS, {
      ...base,
      minPrice: 9000,
      maxPrice: 9500,
    });
    expect(result.total).toBe(0);
    expect(result.items).toEqual([]);
    expect(result.totalPages).toBe(1);
  });

  it('ne modifie pas le tableau d’origine (tri immuable)', () => {
    const copy = [...DEMO_LISTINGS];
    filterAndPaginateListings(DEMO_LISTINGS, { ...base, sort: 'price_asc' });
    expect(DEMO_LISTINGS).toEqual(copy);
  });
});

describe('sanitizeFilterValue', () => {
  it('neutralise la syntaxe PostgREST', () => {
    expect(sanitizeFilterValue('Lyon),price.gt.0')).not.toContain(',');
    expect(sanitizeFilterValue('Lyon),price.gt.0')).not.toContain(')');
    expect(sanitizeFilterValue('Lyon),price.gt.0')).not.toContain('(');
  });

  it('retire les jokers SQL', () => {
    expect(sanitizeFilterValue('Ly%on_')).toBe('Ly on');
  });

  it('conserve les accents et les espaces internes', () => {
    expect(sanitizeFilterValue('Saint-Étienne du Rouvray')).toBe('Saint-Étienne du Rouvray');
  });
});

describe('sanitizeSearchQuery', () => {
  it('retire les opérateurs tsquery', () => {
    expect(sanitizeSearchQuery("studio & (lyon | nice) !'")).toBe('studio lyon nice');
  });

  it('limite la longueur', () => {
    expect(sanitizeSearchQuery('a'.repeat(400)).length).toBe(120);
  });
});
