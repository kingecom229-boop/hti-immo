import { describe, expect, it } from 'vitest';
import {
  formatAmenity,
  formatCityLine,
  formatDate,
  formatPrice,
  formatPropertyType,
  formatShortDate,
  formatSurface,
  normalizeText,
  pluralize,
  toDateInputValue,
} from './format';

describe('formatPrice', () => {
  it('convertit des centimes en euros formatés', () => {
    // Intl insère une espace insécable fine avant le symbole €.
    expect(formatPrice(62000).replace(/\s/g, ' ')).toBe('620 €');
  });

  it('gère les valeurs absentes', () => {
    expect(formatPrice(null)).toBe('—');
    expect(formatPrice(undefined)).toBe('—');
    expect(formatPrice(Number.NaN)).toBe('—');
  });

  it('gère zéro', () => {
    expect(formatPrice(0).replace(/\s/g, ' ')).toBe('0 €');
  });
});

describe('formatSurface', () => {
  it('ajoute l’unité m²', () => {
    expect(formatSurface(24)).toBe('24 m²');
  });

  it('accepte les décimales', () => {
    expect(formatSurface(24.5).replace(',', '.')).toBe('24.5 m²');
  });

  it('gère null', () => {
    expect(formatSurface(null)).toBe('—');
  });
});

describe('formatDate', () => {
  it('formate une date ISO', () => {
    expect(formatDate('2026-03-12T10:00:00.000Z')).toMatch(/2026/);
  });

  it('renvoie un tiret pour une date invalide', () => {
    expect(formatDate('pas-une-date')).toBe('—');
    expect(formatDate(null)).toBe('—');
  });

  it('produit un format court JJ/MM/AAAA', () => {
    expect(formatShortDate('2026-03-12T10:00:00.000Z')).toBe('12/03/2026');
  });

  it('convertit pour un input date', () => {
    expect(toDateInputValue('2026-03-12T10:00:00.000Z')).toBe('2026-03-12');
    expect(toDateInputValue(null)).toBe('');
  });
});

describe('normalizeText', () => {
  it('retire les accents et la casse', () => {
    expect(normalizeText('Étudiant à LYON')).toBe('etudiant a lyon');
  });

  it('supprime les espaces superflus', () => {
    expect(normalizeText('  Lyon  ')).toBe('lyon');
  });
});

describe('libellés', () => {
  it('traduit les types de logement', () => {
    expect(formatPropertyType('colocation')).toBe('Colocation');
    expect(formatPropertyType('residence')).toBe('Résidence étudiante');
  });

  it('traduit les équipements', () => {
    expect(formatAmenity('lave_linge')).toBe('Lave-linge');
  });

  it('compose une ligne ville / code postal', () => {
    expect(formatCityLine('Lyon', '69007')).toBe('Lyon (69007)');
  });
});

describe('pluralize', () => {
  it('accorde au singulier et au pluriel', () => {
    expect(pluralize(1, 'annonce')).toBe('annonce');
    expect(pluralize(3, 'annonce')).toBe('annonces');
    // Règle française : zéro et un s'écrivent au singulier.
    expect(pluralize(0, 'annonce')).toBe('annonce');
  });

  it('accepte un pluriel irrégulier', () => {
    expect(pluralize(2, 'correspond', 'correspondent')).toBe('correspondent');
  });
});
