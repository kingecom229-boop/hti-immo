import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CalendarDays,
  Check,
  Euro,
  Home,
  MapPin,
  PawPrint,
  Ruler,
  ShieldAlert,
  Sofa,
  X,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getListingById } from '@/lib/listings-api';
import {
  formatDate,
  formatPrice,
  formatPropertyType,
  formatSurface,
  AMENITY_LABELS,
  PROPERTY_TYPE_LABELS,
} from '@/lib/format';
import type { ListingWithPhotos } from '@/types/domain';
import { PhotoGallery } from '@/components/listings/PhotoGallery';
import { FavoriteButton } from '@/components/listings/FavoriteButton';
import { InquiryForm } from '@/components/listings/InquiryForm';
import { Badge } from '@/components/ui/Badge';
import { PageLoader, ErrorState } from '@/components/ui/Feedback';
import { Alert } from '@/components/ui/Alert';

function KeyFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Ruler;
  label: string;
  value: string;
}) {
  return (
    <div className="border-ink-100 flex items-start gap-3 rounded-xl border bg-white p-4">
      <span className="bg-ink-50 text-ink-700 grid h-9 w-9 shrink-0 place-items-center rounded-lg">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-ink-500 text-xs tracking-wide uppercase">{label}</dt>
        <dd className="text-ink-950 mt-0.5 text-sm font-semibold">{value}</dd>
      </div>
    </div>
  );
}

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<ListingWithPhotos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useDocumentTitle(listing?.title ?? 'Annonce', listing?.description?.slice(0, 155) ?? undefined);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    setNotFound(false);

    getListingById(id)
      .then((found) => {
        if (!active) return;
        if (!found) {
          setNotFound(true);
          setListing(null);
        } else {
          setListing(found);
        }
      })
      .catch(() => {
        if (active) setError('Cette annonce n’a pas pu être chargée. Réessayez dans un instant.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, reloadToken]);

  if (loading) {
    return (
      <div className="container-page">
        <PageLoader label="Chargement de l’annonce…" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container-page py-16">
        <ErrorState
          title="Annonce introuvable"
          description="Cette annonce n’existe pas, a été retirée ou n’est plus publiée. Le catalogue reste disponible."
          retryLabel="Retour au catalogue"
          onRetry={() => {
            window.location.href = '/logements';
          }}
        />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container-page py-16">
        <ErrorState
          description={error ?? 'Annonce indisponible.'}
          onRetry={() => setReloadToken((token) => token + 1)}
        />
      </div>
    );
  }

  const monthlyTotal = listing.price_cents;
  const typeLabel =
    PROPERTY_TYPE_LABELS[listing.property_type] ?? formatPropertyType(listing.property_type);

  return (
    <div className="container-page py-8">
      <nav
        aria-label="Fil d’Ariane"
        className="text-ink-500 mb-5 flex flex-wrap items-center gap-x-2 text-sm"
      >
        <Link to="/" className="hover:text-ink-900 hover:underline">
          Accueil
        </Link>
        <span className="text-ink-300">/</span>
        <Link to="/logements" className="hover:text-ink-900 hover:underline">
          Annonces
        </Link>
        <span className="text-ink-300">/</span>
        <span className="text-ink-800 font-medium">{listing.city}</span>
      </nav>

      {listing.is_demo ? (
        <Alert tone="warning" className="mb-6" title="Annonce de démonstration">
          Ce contenu est un exemple fictif destiné à illustrer l’interface. Il ne correspond à aucun
          logement réel et aucune démarche locative ne peut être engagée.
        </Alert>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-8">
          <PhotoGallery photos={listing.listing_photos} title={listing.title} />

          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{typeLabel}</Badge>
              {listing.charges_included ? <Badge tone="success">Charges comprises</Badge> : null}
              {listing.furnished ? <Badge tone="info">Meublé</Badge> : null}
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-display text-ink-950 text-2xl leading-tight font-bold sm:text-3xl">
                  {listing.title}
                </h1>
                <p className="text-ink-600 mt-2 flex items-center gap-1.5 text-sm">
                  <MapPin className="text-ink-400 h-4 w-4" aria-hidden="true" />
                  {listing.address_line ? `${listing.address_line}, ` : ''}
                  {listing.city} ({listing.postal_code})
                </p>
              </div>

              <div className="text-right">
                <p className="font-display text-ink-950 text-3xl font-bold">
                  {formatPrice(monthlyTotal)}
                  <span className="text-ink-500 text-sm font-medium">/mois</span>
                </p>
                {listing.deposit_cents !== null ? (
                  <p className="text-ink-500 mt-1 text-xs">
                    Dépôt de garantie : {formatPrice(listing.deposit_cents)}
                  </p>
                ) : null}
              </div>
            </div>
          </header>

          <section aria-labelledby="caracteristiques">
            <h2
              id="caracteristiques"
              className="font-display text-ink-950 mb-3 text-xl font-semibold"
            >
              Caractéristiques
            </h2>
            <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <KeyFact icon={Ruler} label="Surface" value={formatSurface(listing.surface_m2)} />
              <KeyFact
                icon={Home}
                label="Pièces"
                value={
                  listing.rooms
                    ? `${listing.rooms} pièce${listing.rooms > 1 ? 's' : ''}${
                        listing.bedrooms
                          ? ` · ${listing.bedrooms} chambre${listing.bedrooms > 1 ? 's' : ''}`
                          : ''
                      }`
                    : '—'
                }
              />
              <KeyFact
                icon={CalendarDays}
                label="Disponible à partir du"
                value={formatDate(listing.available_from)}
              />
              <KeyFact
                icon={Euro}
                label="Charges"
                value={listing.charges_included ? 'Incluses dans le loyer' : 'Non incluses'}
              />
              <KeyFact
                icon={Sofa}
                label="Ameublement"
                value={listing.furnished ? 'Meublé' : 'Non meublé'}
              />
              <KeyFact
                icon={PawPrint}
                label="Animaux"
                value={listing.pets_allowed ? 'Acceptés' : 'Non acceptés'}
              />
            </dl>
          </section>

          {listing.description ? (
            <section aria-labelledby="description">
              <h2 id="description" className="font-display text-ink-950 mb-3 text-xl font-semibold">
                Description
              </h2>
              <div className="card p-6">
                <p className="text-ink-700 text-sm leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
              </div>
            </section>
          ) : null}

          {listing.amenities.length > 0 ? (
            <section aria-labelledby="equipements">
              <h2 id="equipements" className="font-display text-ink-950 mb-3 text-xl font-semibold">
                Équipements et services
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {listing.amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="border-ink-100 text-ink-700 flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm"
                  >
                    <Check className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                    {AMENITY_LABELS[amenity] ?? amenity}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="securite">
            <h2 id="securite" className="font-display text-ink-950 mb-3 text-xl font-semibold">
              Avant de vous engager
            </h2>
            <div className="card text-ink-700 space-y-3 p-6 text-sm leading-relaxed">
              <p className="flex items-start gap-2">
                <ShieldAlert
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                  aria-hidden="true"
                />
                Ne versez jamais d’argent avant d’avoir visité le logement et signé un bail écrit.
              </p>
              <ul className="space-y-2 pl-6">
                <li className="flex items-start gap-2">
                  <Check
                    className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-700"
                    aria-hidden="true"
                  />
                  Demandez une visite avant tout engagement.
                </li>
                <li className="flex items-start gap-2">
                  <Check
                    className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-700"
                    aria-hidden="true"
                  />
                  Vérifiez que le bailleur est bien propriétaire ou mandataire.
                </li>
                <li className="flex items-start gap-2">
                  <X className="mt-1 h-3.5 w-3.5 shrink-0 text-red-700" aria-hidden="true" />
                  Refusez tout paiement en espèces, en coupon ou par transfert non traçable.
                </li>
              </ul>
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="font-display text-ink-950 text-lg font-semibold">
              Contacter le bailleur
            </h2>
            {listing.contact_name ? (
              <p className="text-ink-600 mt-1 text-sm">{listing.contact_name}</p>
            ) : null}
            {listing.contact_phone ? (
              <p className="text-ink-700 mt-1 text-sm">
                <a className="underline underline-offset-2" href={`tel:${listing.contact_phone}`}>
                  {listing.contact_phone}
                </a>
              </p>
            ) : null}

            <div className="border-ink-100 mt-4 border-t pt-4">
              {listing.is_demo ? (
                <Alert tone="info">
                  Formulaire désactivé sur une annonce de démonstration — aucune donnée n’est
                  transmise à un tiers.
                </Alert>
              ) : null}
              {!listing.is_demo ? (
                <InquiryForm listingId={listing.id} listingTitle={listing.title} />
              ) : null}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-ink-950 text-sm font-semibold">Récapitulatif</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-600">Loyer mensuel</dt>
                <dd className="text-ink-950 font-semibold">{formatPrice(listing.price_cents)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-600">Charges</dt>
                <dd className="text-ink-950 font-semibold">
                  {listing.charges_included ? 'Comprises' : 'En sus'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-600">Dépôt de garantie</dt>
                <dd className="text-ink-950 font-semibold">{formatPrice(listing.deposit_cents)}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <FavoriteButton
                listingId={listing.id}
                title={listing.title}
                withLabel
                className="[&>button]:w-full [&>button]:justify-center"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
