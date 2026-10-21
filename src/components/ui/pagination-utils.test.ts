import { describe, expect, it } from 'vitest';
import { buildPageItems } from './pagination-utils';

describe('buildPageItems', () => {
  it('renvoie [1] pour une seule page', () => {
    expect(buildPageItems(1, 1)).toEqual([1]);
  });

  it('affiche toutes les pages jusqu’à 7', () => {
    expect(buildPageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('insère une ellipse à droite au début du parcours', () => {
    expect(buildPageItems(1, 20)).toEqual([1, 2, 'ellipsis', 20]);
    expect(buildPageItems(2, 20)).toEqual([1, 2, 3, 'ellipsis', 20]);
  });

  it('insère deux ellipses au milieu', () => {
    expect(buildPageItems(10, 20)).toEqual([1, 'ellipsis', 9, 10, 11, 'ellipsis', 20]);
  });

  it('insère une ellipse à gauche en fin de parcours', () => {
    expect(buildPageItems(20, 20)).toEqual([1, 'ellipsis', 19, 20]);
  });

  it('ne duplique jamais la première ou la dernière page', () => {
    for (let page = 1; page <= 25; page += 1) {
      const items = buildPageItems(page, 25);
      const numbers = items.filter((item): item is number => item !== 'ellipsis');
      expect(new Set(numbers).size).toBe(numbers.length);
      expect(numbers[0]).toBe(1);
      expect(numbers[numbers.length - 1]).toBe(25);
    }
  });
});
