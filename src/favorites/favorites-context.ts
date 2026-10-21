import { createContext, useContext } from 'react';

export interface FavoritesContextValue {
  ids: string[];
  loading: boolean;
  error: string | null;
  isFavorite: (listingId: string) => boolean;
  toggle: (listingId: string) => Promise<{ error: string | null }>;
}

export const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites doit être utilisé dans <FavoritesProvider>.');
  return ctx;
}
