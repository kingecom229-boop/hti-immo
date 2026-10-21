import type { Favorite, Inquiry, ListingWithPhotos } from '@/types/domain';
import { DEMO_LISTINGS } from '@/data/demo-listings';

/**
 * Persistance locale du mode démonstration.
 *
 * Les données restent dans le navigateur (localStorage) : aucune donnée n'est
 * envoyée sur un serveur. Elles permettent de tester les parcours bailleur
 * (création d'annonce) et étudiant (favoris, demandes) sans backend.
 */

const LISTINGS_KEY = 'hti-immo-demo-listings';
const FAVORITES_KEY = 'hti-immo-demo-favorites';
const INQUIRIES_KEY = 'hti-immo-demo-inquiries';

const isBrowser = typeof window !== 'undefined';

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota dépassé ou navigation privée : on ignore silencieusement */
  }
}

export function readDemoOverlayListings(): ListingWithPhotos[] {
  return readJson<ListingWithPhotos[]>(LISTINGS_KEY, []);
}

export function writeDemoOverlayListings(listings: ListingWithPhotos[]): void {
  writeJson(LISTINGS_KEY, listings);
}

/** Liste complète : annonces d'exemple + annonces créées localement. */
export function allDemoListings(): ListingWithPhotos[] {
  const overlay = readDemoOverlayListings();
  const overlayIds = new Set(overlay.map((listing) => listing.id));
  return [...overlay, ...DEMO_LISTINGS.filter((listing) => !overlayIds.has(listing.id))];
}

export function upsertDemoListing(listing: ListingWithPhotos): void {
  const overlay = readDemoOverlayListings().filter((item) => item.id !== listing.id);
  writeDemoOverlayListings([listing, ...overlay]);
}

export function removeDemoListing(id: string): void {
  writeDemoOverlayListings(readDemoOverlayListings().filter((item) => item.id !== id));
}

export function readDemoFavorites(): Favorite[] {
  return readJson<Favorite[]>(FAVORITES_KEY, []);
}

export function writeDemoFavorites(favorites: Favorite[]): void {
  writeJson(FAVORITES_KEY, favorites);
}

export function readDemoInquiries(): Inquiry[] {
  return readJson<Inquiry[]>(INQUIRIES_KEY, []);
}

export function writeDemoInquiries(inquiries: Inquiry[]): void {
  writeJson(INQUIRIES_KEY, inquiries);
}

/** Réinitialise toutes les données locales de démonstration. */
export function resetDemoData(): void {
  if (!isBrowser) return;
  window.localStorage.removeItem(LISTINGS_KEY);
  window.localStorage.removeItem(FAVORITES_KEY);
  window.localStorage.removeItem(INQUIRIES_KEY);
}
