import { useEffect, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { ListingAmenity, PropertyType, SearchFilters } from '@/types/domain';
import { AMENITY_OPTIONS, countActiveFilters } from '@/lib/search-params';
import { Button } from '@/components/ui/Button';

const TYPES: { value: PropertyType | ''; label: string }[] = [
  { value: '', label: 'Tous les types' },
  { value: 'studio', label: 'Studio' },
  { value: 'appartement', label: 'Appartement' },
  { value: 'colocation', label: 'Colocation' },
  { value: 'chambre', label: 'Chambre' },
  { value: 'residence', label: 'Résidence étudiante' },
];

function toNumberOrNull(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function FiltersPanel({
  filters,
  onApply,
  onReset,
}: {
  filters: SearchFilters;
  onApply: (next: SearchFilters) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState<SearchFilters>(filters);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const activeCount = countActiveFilters(filters);

  const update = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const toggleAmenity = (amenity: ListingAmenity) => {
    setDraft((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply({ ...draft, page: 1 });
    setOpen(false);
  };

  const handleReset = () => {
    onReset();
    setOpen(false);
  };

  const body = (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Filtres de recherche">
      <div>
        <label className="label" htmlFor="filter-q">
          Mot-clé
        </label>
        <input
          id="filter-q"
          className="input"
          placeholder="Titre, quartier, équipement…"
          value={draft.q}
          onChange={(event) => update('q', event.target.value)}
          maxLength={120}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div>
          <label className="label" htmlFor="filter-city">
            Ville
          </label>
          <input
            id="filter-city"
            className="input"
            placeholder="Ex. Lyon"
            value={draft.city}
            onChange={(event) => update('city', event.target.value)}
            maxLength={80}
          />
        </div>
        <div>
          <label className="label" htmlFor="filter-cp">
            Code postal
          </label>
          <input
            id="filter-cp"
            className="input"
            placeholder="Ex. 69007"
            inputMode="numeric"
            value={draft.postalCode}
            onChange={(event) =>
              update('postalCode', event.target.value.replace(/\D/g, '').slice(0, 5))
            }
            maxLength={5}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="filter-type">
          Type de logement
        </label>
        <select
          id="filter-type"
          className="input"
          value={draft.type}
          onChange={(event) => update('type', event.target.value as PropertyType | '')}
        >
          {TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="label">Loyer mensuel (€)</legend>
        <div className="flex items-center gap-2">
          <input
            aria-label="Loyer minimum en euros"
            className="input"
            type="number"
            min={0}
            max={10000}
            step={50}
            placeholder="Min"
            value={draft.minPrice ?? ''}
            onChange={(event) => update('minPrice', toNumberOrNull(event.target.value))}
          />
          <span className="text-ink-400">—</span>
          <input
            aria-label="Loyer maximum en euros"
            className="input"
            type="number"
            min={0}
            max={10000}
            step={50}
            placeholder="Max"
            value={draft.maxPrice ?? ''}
            onChange={(event) => update('maxPrice', toNumberOrNull(event.target.value))}
          />
        </div>
        {draft.minPrice !== null && draft.maxPrice !== null && draft.minPrice > draft.maxPrice ? (
          <p className="error-text">Le loyer minimum dépasse le maximum.</p>
        ) : null}
      </fieldset>

      <div>
        <label className="label" htmlFor="filter-surface">
          Surface minimale (m²)
        </label>
        <input
          id="filter-surface"
          className="input"
          type="number"
          min={0}
          max={1000}
          step={1}
          placeholder="Ex. 20"
          value={draft.minSurface ?? ''}
          onChange={(event) => update('minSurface', toNumberOrNull(event.target.value))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div>
          <label className="label" htmlFor="filter-furnished">
            Meublé
          </label>
          <select
            id="filter-furnished"
            className="input"
            value={draft.furnished === null ? '' : draft.furnished ? '1' : '0'}
            onChange={(event) =>
              update('furnished', event.target.value === '' ? null : event.target.value === '1')
            }
          >
            <option value="">Peu importe</option>
            <option value="1">Meublé</option>
            <option value="0">Non meublé</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="filter-pets">
            Animaux acceptés
          </label>
          <select
            id="filter-pets"
            className="input"
            value={draft.petsAllowed === null ? '' : draft.petsAllowed ? '1' : '0'}
            onChange={(event) =>
              update('petsAllowed', event.target.value === '' ? null : event.target.value === '1')
            }
          >
            <option value="">Peu importe</option>
            <option value="1">Oui</option>
            <option value="0">Non</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="filter-available">
          Disponible à partir du
        </label>
        <input
          id="filter-available"
          className="input"
          type="date"
          value={draft.availableFrom ?? ''}
          onChange={(event) => update('availableFrom', event.target.value || null)}
        />
      </div>

      <fieldset>
        <legend className="label">Équipements</legend>
        <div className="grid grid-cols-1 gap-2">
          {AMENITY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="text-ink-700 flex items-center gap-2.5 text-sm"
              htmlFor={`amenity-${option.value}`}
            >
              <input
                id={`amenity-${option.value}`}
                type="checkbox"
                className="border-ink-300 accent-ink-900 h-4 w-4 rounded"
                checked={draft.amenities.includes(option.value)}
                onChange={() => toggleAmenity(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="submit" fullWidth>
          Appliquer les filtres
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={handleReset}
          fullWidth
          disabled={activeCount === 0}
        >
          Réinitialiser
        </Button>
      </div>
    </form>
  );

  return (
    <div className="lg:sticky lg:top-24">
      <div className="mb-3 flex items-center justify-between lg:hidden">
        <Button
          variant="secondary"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="filters-body"
          icon={<SlidersHorizontal className="h-4 w-4" aria-hidden="true" />}
        >
          Filtres
          {activeCount > 0 ? (
            <span className="bg-ink-900 ml-1 rounded-full px-1.5 py-0.5 text-xs text-white">
              {activeCount}
            </span>
          ) : null}
        </Button>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={handleReset}
            className="text-ink-600 hover:text-ink-950 inline-flex items-center gap-1 text-sm font-medium"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Effacer
          </button>
        ) : null}
      </div>

      <div
        id="filters-body"
        className={`card p-5 ${open ? 'block' : 'hidden'} lg:block`}
        aria-label="Panneau de filtres"
      >
        <div className="mb-4 hidden items-center justify-between lg:flex">
          <h2 className="font-display text-ink-950 text-lg font-semibold">Filtrer</h2>
          {activeCount > 0 ? (
            <button
              type="button"
              onClick={handleReset}
              className="text-ink-600 hover:text-ink-950 text-xs font-semibold underline underline-offset-2"
            >
              Tout effacer
            </button>
          ) : null}
        </div>
        {body}
      </div>
    </div>
  );
}
