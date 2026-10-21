import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '@/auth/auth-context';
import { useFavorites } from '@/favorites/favorites-context';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getFavoriteListings } from '@/lib/favorites-api';
import type { ListingWithPhotos } from '@/types/domain';
import { ListingCard } from '@/components/listings/ListingCard';
import { EmptyState, ListingGridSkeleton, ErrorState } from '@/components/ui/Feedback';
import { buttonClasses } from '@/components/ui/button-styles';

export function FavoritesPage() {
  useDocumentTitle('Mes favoris');
  const { user } = useAuth();
  const { ids } = useFavorites();
  const [listings, setListings] = useState<ListingWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);

    getFavoriteListings(user.id)
      .then((rows) => {
        if (active) setListings(rows);
      })
      .catch(() => {
        if (active) setError('Vos favoris n’ont pas pu être chargés.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, ids.length]);

  // On masque immédiatement les favoris retirés sans rechargement complet.
  const visible = listings.filter((listing) => ids.includes(listing.id) || ids.length === 0);

  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <h1 className="font-display text-ink-950 text-3xl font-bold">Mes favoris</h1>
        <p className="text-ink-600 mt-1 text-sm">
          Les annonces que vous avez enregistrées pour les comparer plus tard.
        </p>
      </header>

      {loading ? <ListingGridSkeleton count={3} /> : null}

      {!loading && error ? <ErrorState description={error} /> : null}

      {!loading && !error && visible.length === 0 ? (
        <EmptyState
          title="Aucun favori pour le moment"
          description="Parcourez le catalogue et utilisez le cœur pour enregistrer les annonces qui vous intéressent."
          icon={<Heart className="h-7 w-7" aria-hidden="true" />}
          action={
            <Link to="/logements" className={buttonClasses('primary', 'md')}>
              Parcourir les annonces
            </Link>
          }
        />
      ) : null}

      {!loading && visible.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
