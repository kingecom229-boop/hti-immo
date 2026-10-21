import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { searchListings } from '@/lib/listings-api';
import { filtersToParams, parseFilters, countActiveFilters } from '@/lib/search-params';
import type { PaginatedListings, SearchFilters } from '@/types/domain';
import { ListingCard } from '@/components/listings/ListingCard';
import { FiltersPanel } from '@/components/listings/FiltersPanel';
import { Pagination } from '@/components/ui/Pagination';
import { Alert } from '@/components/ui/Alert';
import { EmptyState, ErrorState, ListingGridSkeleton } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { pluralize } from '@/lib/format';

const SORT_OPTIONS: { value: SearchFilters['sort']; label: string }[] = [
  { value: 'recent', label: 'Plus récentes' },
  { value: 'price_asc', label: 'Loyer croissant' },
  { value: 'price_desc', label: 'Loyer décroissant' },
  { value: 'surface_desc', label: 'Surface décroissante' },
];

export function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const serializedParams = searchParams.toString();
  const filters = useMemo(
    () => parseFilters(new URLSearchParams(serializedParams)),
    [serializedParams],
  );

  const [result, setResult] = useState<PaginatedListings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const activeCount = countActiveFilters(filters);

  useDocumentTitle(
    filters.city ? `Logements étudiants à ${filters.city}` : 'Annonces de logements étudiants',
    'Catalogue HTI-IMMO : studios, appartements, colocations et résidences étudiantes. Filtrez par ville, code postal, loyer et équipements.',
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    searchListings(filters)
      .then((next) => {
        if (active) setResult(next);
      })
      .catch(() => {
        if (active) {
          setError('Le catalogue n’a pas pu être chargé. Vérifiez votre connexion puis réessayez.');
          setResult(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters, reloadToken]);

  const applyFilters = (next: SearchFilters) => {
    setSearchParams(filtersToParams(next), { replace: false });
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: false });
  };

  const changePage = (page: number) => {
    setSearchParams(filtersToParams({ ...filters, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const changeSort = (sort: SearchFilters['sort']) => {
    setSearchParams(filtersToParams({ ...filters, sort, page: 1 }));
  };

  return (
    <div className="container-page py-10">
      <nav aria-label="Fil d’Ariane" className="text-ink-500 mb-4 text-sm">
        <Link to="/" className="hover:text-ink-900 hover:underline">
          Accueil
        </Link>
        <span className="text-ink-300 mx-2">/</span>
        <span className="text-ink-800 font-medium">Annonces</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-display text-ink-950 text-3xl font-bold sm:text-4xl">
          {filters.city ? (
            <span className="inline-flex items-center gap-2">
              <MapPin className="text-ink-500 h-7 w-7" aria-hidden="true" />
              Logements étudiants à {filters.city}
            </span>
          ) : (
            'Trouvez votre logement étudiant'
          )}
        </h1>
        <p className="text-ink-600 mt-2 max-w-2xl text-sm leading-relaxed">
          {result && !loading
            ? `${result.total} ${pluralize(result.total, 'annonce')} ${pluralize(result.total, 'correspond', 'correspondent')} à votre recherche.`
            : 'Parcourez les annonces disponibles et affinez votre recherche avec les filtres.'}
        </p>
        {activeCount > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="info">{activeCount} filtre(s) actif(s)</Badge>
            <button
              type="button"
              onClick={resetFilters}
              className="text-ink-600 hover:text-ink-950 text-xs font-semibold underline underline-offset-2"
            >
              Tout effacer
            </button>
          </div>
        ) : null}
      </header>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <aside aria-label="Filtres">
          <FiltersPanel filters={filters} onApply={applyFilters} onReset={resetFilters} />
        </aside>

        <section aria-label="Résultats de recherche">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-ink-600 text-sm" role="status" aria-live="polite">
              {loading
                ? 'Recherche en cours…'
                : `${result?.total ?? 0} ${pluralize(result?.total ?? 0, 'résultat')}`}
            </p>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-ink-600 text-sm">
                Trier par
              </label>
              <select
                id="sort"
                className="input w-auto py-2 text-sm"
                value={filters.sort}
                onChange={(event) => changeSort(event.target.value as SearchFilters['sort'])}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? <ListingGridSkeleton count={6} /> : null}

          {!loading && error ? (
            <ErrorState
              title="Catalogue indisponible"
              description={error}
              onRetry={() => setReloadToken((token) => token + 1)}
            />
          ) : null}

          {!loading && !error && result && result.items.length === 0 ? (
            <EmptyState
              title="Aucune annonce ne correspond"
              description="Essayez d’élargir votre budget, de retirer un filtre ou de rechercher une ville voisine."
              icon={<Search className="h-7 w-7" aria-hidden="true" />}
              action={
                activeCount > 0 ? (
                  <Button variant="secondary" onClick={resetFilters}>
                    Réinitialiser les filtres
                  </Button>
                ) : (
                  <Link
                    to="/comment-ca-marche"
                    className="text-sm font-semibold underline underline-offset-2"
                  >
                    Comment fonctionne HTI-IMMO ?
                  </Link>
                )
              }
            />
          ) : null}

          {!loading && result && result.items.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              <div className="mt-10">
                <Pagination
                  page={result.page}
                  totalPages={result.totalPages}
                  onChange={changePage}
                />
              </div>
            </>
          ) : null}

          {filters.q || filters.city ? (
            <div className="mt-10">
              <Alert tone="info" title="Vous ne trouvez pas ?">
                Élargissez la recherche à{' '}
                <button
                  type="button"
                  className="font-semibold underline underline-offset-2"
                  onClick={() => setSearchParams(new URLSearchParams())}
                >
                  toutes les villes
                </button>{' '}
                ou consultez{' '}
                <Link to="/contact" className="font-semibold underline underline-offset-2">
                  notre guide
                </Link>{' '}
                pour préparer votre dossier.
              </Alert>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
