import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/auth/auth-context';
import { useFavorites } from '@/favorites/favorites-context';

export function FavoriteButton({
  listingId,
  title,
  className = '',
  withLabel = false,
}: {
  listingId: string;
  title: string;
  className?: string;
  withLabel?: boolean;
}) {
  const { user } = useAuth();
  const { isFavorite, toggle } = useFavorites();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const active = isFavorite(listingId);

  const handleClick = async () => {
    setPending(true);
    setMessage(null);
    const result = await toggle(listingId);
    if (result.error) setMessage(result.error);
    setPending(false);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void handleClick();
        }}
        disabled={pending}
        aria-pressed={active}
        aria-label={
          active ? `Retirer « ${title} » des favoris` : `Ajouter « ${title} » aux favoris`
        }
        title={user ? undefined : 'Connectez-vous pour enregistrer vos favoris'}
        className={`inline-flex items-center gap-2 rounded-full border p-2.5 transition ${
          active
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-ink-200 text-ink-600 hover:border-ink-300 hover:text-ink-900 bg-white/95'
        } disabled:opacity-60`}
      >
        <Heart className="h-4 w-4" fill={active ? 'currentColor' : 'none'} aria-hidden="true" />
        {withLabel ? (
          <span className="pr-1 text-sm font-medium">
            {active ? 'En favori' : 'Ajouter aux favoris'}
          </span>
        ) : null}
      </button>
      {message ? (
        <p className="mt-1 max-w-56 text-xs font-medium text-red-700" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
