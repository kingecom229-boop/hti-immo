import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { CITY_NAMES } from '@/data/cities';
import { Button } from '@/components/ui/Button';

const TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'studio', label: 'Studio' },
  { value: 'appartement', label: 'Appartement' },
  { value: 'colocation', label: 'Colocation' },
  { value: 'chambre', label: 'Chambre' },
  { value: 'residence', label: 'Résidence étudiante' },
];

/** Recherche rapide de la page d'accueil. Redirige vers le catalogue. */
export function SearchBar({
  variant = 'hero',
  initialCity = '',
  initialType = '',
}: {
  variant?: 'hero' | 'compact';
  initialCity?: string;
  initialType?: string;
}) {
  const navigate = useNavigate();
  const [city, setCity] = useState(initialCity);
  const [type, setType] = useState(initialType);
  const [maxPrice, setMaxPrice] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (city.trim()) params.set('ville', city.trim());
    if (type) params.set('type', type);
    const price = Number(maxPrice);
    if (maxPrice && Number.isFinite(price) && price > 0)
      params.set('max', String(Math.round(price)));
    navigate(`/logements${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const isHero = variant === 'hero';

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Rechercher un logement étudiant"
      className={
        isHero
          ? 'border-ink-100 shadow-lift grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_0.8fr_auto]'
          : 'grid gap-2 sm:grid-cols-4'
      }
    >
      <div>
        <label htmlFor="search-city" className="sr-only">
          Ville ou code postal
        </label>
        <input
          id="search-city"
          name="city"
          className="input"
          placeholder="Ville (ex. Lyon, 69007)"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          list="city-suggestions"
          autoComplete="address-level2"
          maxLength={80}
        />
        <datalist id="city-suggestions">
          {CITY_NAMES.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </div>

      <div>
        <label htmlFor="search-type" className="sr-only">
          Type de logement
        </label>
        <select
          id="search-type"
          name="type"
          className="input"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          {TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="search-max" className="sr-only">
          Loyer maximum par mois, en euros
        </label>
        <div className="relative">
          <input
            id="search-max"
            name="maxPrice"
            type="number"
            inputMode="numeric"
            min={0}
            max={10000}
            step={50}
            className="input pr-10"
            placeholder="Loyer max."
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
          />
          <span className="text-ink-400 pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
            €
          </span>
        </div>
      </div>

      <Button
        type="submit"
        size={isHero ? 'lg' : 'md'}
        icon={<Search className="h-4 w-4" aria-hidden="true" />}
      >
        Rechercher
      </Button>
    </form>
  );
}
