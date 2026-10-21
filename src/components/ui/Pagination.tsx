import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildPageItems } from './pagination-utils';

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const items = buildPageItems(page, totalPages);

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-1.5"
      aria-label="Pagination des annonces"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="border-ink-200 text-ink-700 hover:bg-ink-50 inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Page précédente"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Précédent</span>
      </button>

      {items.map((item, index) =>
        item === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="text-ink-400 px-2 text-sm" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={`min-w-10 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              item === page
                ? 'border-ink-900 bg-ink-900 text-white'
                : 'border-ink-200 text-ink-700 hover:bg-ink-50 bg-white'
            }`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="border-ink-200 text-ink-700 hover:bg-ink-50 inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Page suivante"
      >
        <span className="hidden sm:inline">Suivant</span>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
