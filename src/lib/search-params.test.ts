import { describe, expect, it } from 'vitest';
import { countActiveFilters, filtersToParams, parseFilters } from './search-params';
import { DEFAULT_FILTERS } from '@/types/domain';

describe('parseFilters', () => {
  it('retourne les valeurs par défaut sans paramètre', () => {
    const filters = parseFilters(new URLSearchParams());
    expect(filters).toEqual(DEFAULT_FILTERS);
  });

  it('lit les champs texte', () => {
    const filters = parseFilters(new URLSearchParams('?q=studio&ville=Lyon&cp=69007&type=studio'));
    expect(filters.q).toBe('studio');
    expect(filters.city).toBe('Lyon');
    expect(filters.postalCode).toBe('69007');
    expect(filters.type).toBe('studio');
  });

  it('convertit les prix et surfaces en nombres', () => {
    const filters = parseFilters(new URLSearchParams('?min=400&max=800&surface=20'));
    expect(filters.minPrice).toBe(400);
    expect(filters.maxPrice).toBe(800);
    expect(filters.minSurface).toBe(20);
  });

  it('ignore les nombres invalides ou hors bornes', () => {
    const filters = parseFilters(new URLSearchParams('?min=abc&max=-5&surface=99999'));
    expect(filters.minPrice).toBeNull();
    expect(filters.maxPrice).toBeNull();
    expect(filters.minSurface).toBeNull();
  });

  it('ignore un tri inconnu', () => {
    expect(parseFilters(new URLSearchParams('?tri=aleatoire')).sort).toBe('recent');
    expect(parseFilters(new URLSearchParams('?tri=price_asc')).sort).toBe('price_asc');
  });

  it('ignore un type de logement inconnu', () => {
    expect(parseFilters(new URLSearchParams('?type=chateau')).type).toBe('');
  });

  it('filtre les équipements sur une liste blanche', () => {
    const filters = parseFilters(new URLSearchParams('?equipements=wifi,jacuzzi,meuble'));
    expect(filters.amenities).toEqual(['wifi', 'meuble']);
  });

  it('déduplique les équipements', () => {
    const filters = parseFilters(new URLSearchParams('?equipements=wifi,wifi'));
    expect(filters.amenities).toEqual(['wifi']);
  });

  it('normalise le code postal', () => {
    expect(parseFilters(new URLSearchParams('?cp=69a007')).postalCode).toBe('69007');
  });

  it('borne la page', () => {
    expect(parseFilters(new URLSearchParams('?page=0')).page).toBe(1);
    expect(parseFilters(new URLSearchParams('?page=-3')).page).toBe(1);
    expect(parseFilters(new URLSearchParams('?page=9999')).page).toBe(500);
    expect(parseFilters(new URLSearchParams('?page=abc')).page).toBe(1);
  });

  it('ignore une date de disponibilité invalide', () => {
    expect(parseFilters(new URLSearchParams('?dispo=2026-13-45')).availableFrom).toBeNull();
    expect(parseFilters(new URLSearchParams('?dispo=2026-09-01')).availableFrom).toBe('2026-09-01');
  });

  it('accepte les booléens 1/0/true/false', () => {
    expect(parseFilters(new URLSearchParams('?meuble=1')).furnished).toBe(true);
    expect(parseFilters(new URLSearchParams('?meuble=0')).furnished).toBe(false);
    expect(parseFilters(new URLSearchParams('?animaux=true')).petsAllowed).toBe(true);
    expect(parseFilters(new URLSearchParams('?animaux=peut-etre')).petsAllowed).toBeNull();
  });
});

describe('filtersToParams', () => {
  it('omet les valeurs par défaut', () => {
    expect(filtersToParams(DEFAULT_FILTERS).toString()).toBe('');
  });

  it('sérialise les filtres actifs', () => {
    const params = filtersToParams({
      ...DEFAULT_FILTERS,
      city: 'Lyon',
      maxPrice: 800,
      amenities: ['wifi', 'meuble'],
      sort: 'price_asc',
      page: 2,
    });
    expect(params.get('ville')).toBe('Lyon');
    expect(params.get('max')).toBe('800');
    expect(params.get('equipements')).toBe('wifi,meuble');
    expect(params.get('tri')).toBe('price_asc');
    expect(params.get('page')).toBe('2');
  });

  it('effectue un aller-retour stable', () => {
    const filters = {
      ...DEFAULT_FILTERS,
      q: 'studio',
      city: 'Nantes',
      postalCode: '44300',
      type: 'studio' as const,
      minPrice: 300,
      maxPrice: 900,
      minSurface: 18,
      furnished: true,
      petsAllowed: false,
      amenities: ['wifi'] as const,
      availableFrom: '2026-09-01',
      sort: 'surface_desc' as const,
      page: 3,
    };
    const roundTrip = parseFilters(
      filtersToParams({ ...filters, amenities: [...filters.amenities] }),
    );
    expect(roundTrip).toEqual({ ...filters, amenities: [...filters.amenities] });
  });
});

describe('countActiveFilters', () => {
  it('compte zéro sans filtre', () => {
    expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0);
  });

  it('compte chaque critère et chaque équipement', () => {
    expect(
      countActiveFilters({
        ...DEFAULT_FILTERS,
        city: 'Lyon',
        maxPrice: 800,
        amenities: ['wifi', 'meuble'],
      }),
    ).toBe(4);
  });

  it('ne compte pas la pagination ni le tri', () => {
    expect(countActiveFilters({ ...DEFAULT_FILTERS, page: 4, sort: 'price_asc' })).toBe(0);
  });
});
