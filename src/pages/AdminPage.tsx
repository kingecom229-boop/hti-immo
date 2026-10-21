import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Eye, Inbox, ShieldCheck, XCircle } from 'lucide-react';
import { useAuth } from '@/auth/auth-context';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getAllListingsForStaff, updateListingStatus } from '@/lib/listings-api';
import { getAllInquiriesForStaff, type InquiryWithListing } from '@/lib/inquiries-api';
import { toUserMessage } from '@/lib/api-error';
import { STATUS_LABELS, formatDate, formatPrice, formatPropertyType } from '@/lib/format';
import type { ListingWithPhotos } from '@/types/domain';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';

export function AdminPage() {
  useDocumentTitle('Administration');
  const { isDemo } = useAuth();

  const [listings, setListings] = useState<ListingWithPhotos[]>([]);
  const [inquiries, setInquiries] = useState<InquiryWithListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [allListings, allInquiries] = await Promise.all([
        getAllListingsForStaff(),
        getAllInquiriesForStaff(),
      ]);
      setListings(allListings);
      setInquiries(allInquiries);
    } catch {
      setError('Les données d’administration n’ont pas pu être chargées.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const pending = listings.filter((listing) => listing.status === 'pending');
  const published = listings.filter((listing) => listing.status === 'published');

  const moderate = async (listing: ListingWithPhotos, status: ListingWithPhotos['status']) => {
    setActionError(null);
    setBusyId(listing.id);
    try {
      await updateListingStatus(listing.id, status);
      setListings((current) =>
        current.map((item) =>
          item.id === listing.id
            ? {
                ...item,
                status,
                published_at: status === 'published' ? new Date().toISOString() : null,
              }
            : item,
        ),
      );
    } catch (cause) {
      setActionError(toUserMessage(cause, 'La modération a échoué.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container-page py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-ink-500 inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Espace réservé
          </p>
          <h1 className="font-display text-ink-950 mt-1 text-3xl font-bold">Administration</h1>
          <p className="text-ink-600 mt-1 text-sm">
            Modération des annonces et suivi des demandes de logement.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void load()} loading={loading}>
          Actualiser
        </Button>
      </header>

      {isDemo ? (
        <Alert tone="warning" className="mb-6" title="Mode démonstration">
          Les actions de modération sont simulées localement et n’ont aucun effet sur une base
          réelle.
        </Alert>
      ) : null}

      {error ? <ErrorState description={error} onRetry={() => void load()} /> : null}
      {actionError ? (
        <Alert tone="error" className="mb-6">
          {actionError}
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <>
          <dl className="mb-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'En attente', value: pending.length, tone: 'warning' as const },
              { label: 'Publiées', value: published.length, tone: 'success' as const },
              { label: 'Demandes', value: inquiries.length, tone: 'info' as const },
            ].map((stat) => (
              <div key={stat.label} className="card p-5">
                <dt className="text-ink-500 text-xs font-semibold tracking-wide uppercase">
                  {stat.label}
                </dt>
                <dd className="mt-1 flex items-center gap-2">
                  <span className="font-display text-ink-950 text-3xl font-bold">{stat.value}</span>
                  <Badge tone={stat.tone}> </Badge>
                </dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="attente-titre" className="mb-10">
            <h2 id="attente-titre" className="font-display text-ink-950 mb-3 text-xl font-semibold">
              Annonces à valider
            </h2>

            {pending.length === 0 ? (
              <EmptyState
                title="Aucune annonce en attente"
                description="Toutes les annonces soumises ont été traitées."
                icon={<CheckCircle2 className="h-7 w-7" aria-hidden="true" />}
              />
            ) : (
              <ul className="space-y-3">
                {pending.map((listing) => (
                  <li
                    key={listing.id}
                    className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="warning">{STATUS_LABELS[listing.status]}</Badge>
                        <Badge tone="neutral">{formatPropertyType(listing.property_type)}</Badge>
                        {listing.is_demo ? <Badge tone="accent">Exemple</Badge> : null}
                      </div>
                      <h3 className="font-display text-ink-950 mt-1.5 text-base font-semibold">
                        {listing.title}
                      </h3>
                      <p className="text-ink-600 text-sm">
                        {listing.city} ({listing.postal_code}) · {formatPrice(listing.price_cents)}
                        /mois · soumis le {formatDate(listing.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/logements/${listing.id}`}
                        className="border-ink-200 text-ink-700 hover:bg-ink-50 inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        Examiner
                      </Link>
                      <Button
                        size="sm"
                        loading={busyId === listing.id}
                        onClick={() => void moderate(listing, 'published')}
                        icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                      >
                        Publier
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void moderate(listing, 'archived')}
                        icon={<XCircle className="h-4 w-4" aria-hidden="true" />}
                      >
                        Refuser
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="demandes-titre" className="mb-10">
            <h2
              id="demandes-titre"
              className="font-display text-ink-950 mb-3 text-xl font-semibold"
            >
              Demandes de logement
            </h2>
            {inquiries.length === 0 ? (
              <EmptyState
                title="Aucune demande"
                description="Les demandes envoyées depuis les annonces apparaîtront ici."
                icon={<Inbox className="h-7 w-7" aria-hidden="true" />}
              />
            ) : (
              <ul className="space-y-3">
                {inquiries.map((inquiry) => (
                  <li key={inquiry.id} className="card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-ink-500 text-xs">
                          {inquiry.listing_title} · {inquiry.listing_city}
                        </p>
                        <h3 className="text-ink-950 mt-1 text-sm font-semibold">
                          {inquiry.sender_name} — {inquiry.sender_email}
                        </h3>
                      </div>
                      <span className="text-ink-500 text-xs">{formatDate(inquiry.created_at)}</span>
                    </div>
                    <p className="text-ink-600 mt-2 line-clamp-3 text-sm">{inquiry.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="toutes-titre">
            <h2 id="toutes-titre" className="font-display text-ink-950 mb-3 text-xl font-semibold">
              Toutes les annonces ({listings.length})
            </h2>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Liste de toutes les annonces avec leur statut</caption>
                <thead className="border-ink-100 bg-ink-50/60 border-b text-left">
                  <tr>
                    <th scope="col" className="text-ink-700 px-4 py-3 font-semibold">
                      Annonce
                    </th>
                    <th scope="col" className="text-ink-700 px-4 py-3 font-semibold">
                      Ville
                    </th>
                    <th scope="col" className="text-ink-700 px-4 py-3 font-semibold">
                      Loyer
                    </th>
                    <th scope="col" className="text-ink-700 px-4 py-3 font-semibold">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing) => (
                    <tr key={listing.id} className="border-ink-50 border-b last:border-0">
                      <td className="max-w-xs px-4 py-3">
                        <Link
                          to={`/logements/${listing.id}`}
                          className="text-ink-900 line-clamp-2 font-medium hover:underline"
                        >
                          {listing.title}
                        </Link>
                      </td>
                      <td className="text-ink-600 px-4 py-3">{listing.city}</td>
                      <td className="text-ink-600 px-4 py-3">{formatPrice(listing.price_cents)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={listing.status === 'published' ? 'success' : 'neutral'}>
                          {STATUS_LABELS[listing.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
