import type { ReactNode } from 'react';
import { Loader2, SearchX, ServerCrash } from 'lucide-react';
import { Button } from './Button';

export function Spinner({ label = 'Chargement…' }: { label?: string }) {
  return (
    <span className="text-ink-600 inline-flex items-center gap-2 text-sm" role="status">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function PageLoader({ label = 'Chargement de la page…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3" role="status">
      <Loader2 className="text-ink-500 h-8 w-8 animate-spin" aria-hidden="true" />
      <p className="text-ink-600 text-sm font-medium">{label}</p>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-ink-100 animate-pulse rounded-lg ${className}`} aria-hidden="true" />;
}

export function ListingCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="h-52 w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>
  );
}

export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Chargement des annonces"
    >
      {Array.from({ length: count }, (_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-4 px-6 py-14 text-center">
      <div className="bg-ink-50 text-ink-500 rounded-full p-3">
        {icon ?? <SearchX className="h-7 w-7" aria-hidden="true" />}
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="font-display text-ink-950 text-xl font-semibold">{title}</h2>
        <p className="text-ink-600 text-sm leading-relaxed">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title = 'Une erreur est survenue',
  description = 'Le contenu n’a pas pu être chargé. Vérifiez votre connexion puis réessayez.',
  onRetry,
  retryLabel = 'Réessayer',
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="card flex flex-col items-center gap-4 px-6 py-14 text-center" role="alert">
      <div className="rounded-full bg-red-50 p-3 text-red-700">
        <ServerCrash className="h-7 w-7" aria-hidden="true" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="font-display text-ink-950 text-xl font-semibold">{title}</h2>
        <p className="text-ink-600 text-sm leading-relaxed">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
