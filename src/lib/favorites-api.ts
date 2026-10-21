import { supabase, isSupabaseConfigured } from './supabase';
import { config } from './config';
import { ApiError } from './api-error';
import { translateDataError } from './auth-errors';
import { allDemoListings, readDemoFavorites, writeDemoFavorites } from './demo-store';
import { isUuid, sortPhotos } from './listings-api';
import type { ListingWithPhotos } from '@/types/domain';

function isDemo(): boolean {
  return config.demoMode || !isSupabaseConfigured || !supabase;
}

/** Identifiants des annonces favorites d'un utilisateur. */
export async function getFavoriteIds(userId: string): Promise<string[]> {
  if (isDemo()) {
    return readDemoFavorites()
      .filter((favorite) => favorite.user_id === userId)
      .map((favorite) => favorite.listing_id);
  }

  const client = supabase;
  if (!client) throw new ApiError('Supabase n’est pas configuré.');

  const { data, error } = await client.from('favorites').select('listing_id').eq('user_id', userId);

  if (error) throw new ApiError(translateDataError(error), error.code);
  return ((data ?? []) as { listing_id: string }[]).map((row) => row.listing_id);
}

/** Annonces favorites complètes (pour la page « Mes favoris »). */
export async function getFavoriteListings(userId: string): Promise<ListingWithPhotos[]> {
  if (isDemo()) {
    const ids = new Set(await getFavoriteIds(userId));
    return allDemoListings().filter((listing) => ids.has(listing.id));
  }

  const client = supabase;
  if (!client) throw new ApiError('Supabase n’est pas configuré.');

  const { data, error } = await client
    .from('favorites')
    .select('created_at, listings(*, listing_photos(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new ApiError(translateDataError(error), error.code);

  return ((data ?? []) as unknown as { listings: ListingWithPhotos | null }[])
    .map((row) => row.listings)
    .filter((listing): listing is ListingWithPhotos => Boolean(listing))
    .map((listing) => ({
      ...listing,
      listing_photos: sortPhotos(listing.listing_photos ?? []),
    }));
}

/** Ajoute ou retire un favori. Renvoie le nouvel état. */
export async function toggleFavorite(
  userId: string,
  listingId: string,
): Promise<{ isFavorite: boolean }> {
  const current = await getFavoriteIds(userId);
  const exists = current.includes(listingId);

  if (isDemo()) {
    const favorites = readDemoFavorites();
    writeDemoFavorites(
      exists
        ? favorites.filter(
            (favorite) => !(favorite.user_id === userId && favorite.listing_id === listingId),
          )
        : [
            ...favorites,
            {
              id: `demo-fav-${userId}-${listingId}`,
              user_id: userId,
              listing_id: listingId,
              created_at: new Date().toISOString(),
            },
          ],
    );
    return { isFavorite: !exists };
  }

  const client = supabase;
  if (!client) throw new ApiError('Supabase n’est pas configuré.');
  if (!isUuid(listingId)) throw new ApiError('Identifiant d’annonce invalide.', 'invalid_id');

  if (exists) {
    const { error } = await client
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);
    if (error) throw new ApiError(translateDataError(error), error.code);
    return { isFavorite: false };
  }

  const { error } = await client
    .from('favorites')
    .insert({ user_id: userId, listing_id: listingId });
  if (error) throw new ApiError(translateDataError(error), error.code);
  return { isFavorite: true };
}
