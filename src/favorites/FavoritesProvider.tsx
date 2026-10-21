import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/auth/auth-context';
import { getFavoriteIds, toggleFavorite } from '@/lib/favorites-api';
import { toUserMessage } from '@/lib/api-error';
import { FavoritesContext, type FavoritesContextValue } from './favorites-context';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (authLoading) return;
    if (!user) {
      setIds([]);
      setError(null);
      return;
    }

    setLoading(true);
    getFavoriteIds(user.id)
      .then((nextIds) => {
        if (active) setIds(nextIds);
      })
      .catch((cause: unknown) => {
        if (active) setError(toUserMessage(cause, 'Impossible de charger vos favoris.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  const isFavorite = useCallback((listingId: string) => ids.includes(listingId), [ids]);

  const toggle = useCallback(
    async (listingId: string): Promise<{ error: string | null }> => {
      if (!user) {
        return { error: 'Connectez-vous pour enregistrer une annonce dans vos favoris.' };
      }

      // Mise à jour optimiste, annulée en cas d'échec.
      const wasFavorite = ids.includes(listingId);
      setIds((current) =>
        wasFavorite ? current.filter((id) => id !== listingId) : [...current, listingId],
      );

      try {
        const result = await toggleFavorite(user.id, listingId);
        setIds((current) => {
          const without = current.filter((id) => id !== listingId);
          return result.isFavorite ? [...without, listingId] : without;
        });
        return { error: null };
      } catch (cause) {
        setIds((current) =>
          wasFavorite
            ? [...current.filter((id) => id !== listingId), listingId]
            : current.filter((id) => id !== listingId),
        );
        return { error: toUserMessage(cause, 'Impossible de mettre à jour le favori.') };
      }
    },
    [ids, user],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({ ids, loading, error, isFavorite, toggle }),
    [ids, loading, error, isFavorite, toggle],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}
