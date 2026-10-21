import { Link } from 'react-router-dom';
import { BedDouble, MapPin, Maximize, TrainFront } from 'lucide-react';
import type { ListingWithPhotos } from '@/types/domain';
import { formatPrice, formatPropertyType, formatSurface, formatAmenity } from '@/lib/format';
import { resolvePhotoUrl } from '@/lib/listings-api';
import { Badge } from '@/components/ui/Badge';
import { FavoriteButton } from './FavoriteButton';

/** Horodatage de chargement de l'application, pour un calcul stable hors rendu. */
const APP_LOADED_AT = Date.now();

export function ListingCard({ listing }: { listing: ListingWithPhotos }) {
  const cover = listing.listing_photos[0];
  const coverUrl = cover ? resolvePhotoUrl(cover.storage_path) : '/images/demo/studio-lumiere.svg';
  const isNew =
    listing.published_at !== null &&
    APP_LOADED_AT - new Date(listing.published_at).getTime() < 14 * 24 * 3600 * 1000;

  return (
    <article className="card group animate-fade-rise hover:shadow-lift overflow-hidden transition hover:-translate-y-0.5">
      <div className="bg-ink-100 relative aspect-4/3 overflow-hidden">
        <Link to={`/logements/${listing.id}`} tabIndex={-1} aria-hidden="true">
          <img
            src={coverUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            width={800}
            height={600}
          />
        </Link>

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {listing.is_demo ? <Badge tone="accent">Exemple</Badge> : null}
          {isNew ? <Badge tone="success">Nouveau</Badge> : null}
        </div>

        <div className="absolute top-3 right-3">
          <FavoriteButton listingId={listing.id} title={listing.title} />
        </div>

        <div className="bg-ink-950/90 absolute bottom-0 left-0 rounded-tr-xl px-3 py-1.5 text-sm font-bold text-white backdrop-blur">
          {formatPrice(listing.price_cents)}
          <span className="text-ink-200 text-xs font-medium">/mois</span>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div className="text-ink-500 flex items-center gap-2 text-xs font-medium">
          <span className="bg-ink-50 rounded-md px-2 py-0.5">
            {formatPropertyType(listing.property_type)}
          </span>
          {listing.charges_included ? (
            <span className="text-emerald-700">Charges comprises</span>
          ) : null}
        </div>

        <h3 className="font-display text-ink-950 text-lg leading-snug font-semibold">
          <Link
            to={`/logements/${listing.id}`}
            className="decoration-ink-300 underline-offset-4 hover:underline"
          >
            {listing.title}
          </Link>
        </h3>

        <p className="text-ink-600 flex items-center gap-1.5 text-sm">
          <MapPin className="text-ink-400 h-4 w-4 shrink-0" aria-hidden="true" />
          {listing.city} <span className="text-ink-400">({listing.postal_code})</span>
        </p>

        <ul className="text-ink-600 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          <li className="flex items-center gap-1.5">
            <Maximize className="text-ink-400 h-4 w-4" aria-hidden="true" />
            {formatSurface(listing.surface_m2)}
          </li>
          {listing.rooms ? (
            <li className="flex items-center gap-1.5">
              <BedDouble className="text-ink-400 h-4 w-4" aria-hidden="true" />
              {listing.rooms} pièce{listing.rooms > 1 ? 's' : ''}
            </li>
          ) : null}
          {listing.available_from ? (
            <li className="flex items-center gap-1.5">
              <TrainFront className="text-ink-400 h-4 w-4" aria-hidden="true" />
              Dès le{' '}
              {new Date(listing.available_from).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
              })}
            </li>
          ) : null}
        </ul>

        {listing.amenities.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {listing.amenities.slice(0, 3).map((amenity) => (
              <li
                key={amenity}
                className="bg-ink-50 text-ink-600 rounded-full px-2.5 py-1 text-xs font-medium"
              >
                {formatAmenity(amenity)}
              </li>
            ))}
            {listing.amenities.length > 3 ? (
              <li className="bg-ink-50 text-ink-500 rounded-full px-2.5 py-1 text-xs font-medium">
                +{listing.amenities.length - 3}
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
