import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  ExternalLink,
  Inbox,
  Mail,
  RotateCcw,
  Save,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/auth/auth-context';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getMyListings, deleteListing, updateListingStatus } from '@/lib/listings-api';
import { getMyInquiries, getReceivedInquiries, type InquiryWithListing } from '@/lib/inquiries-api';
import { toUserMessage } from '@/lib/api-error';
import { resetDemoData } from '@/lib/demo-store';
import { profileSchema, validateWithSchema } from '@/lib/validation';
import { formatDate, formatPrice, STATUS_LABELS } from '@/lib/format';
import type { ListingWithPhotos } from '@/types/domain';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { TextField, TextAreaField } from '@/components/ui/FormField';
import { EmptyState, PageLoader, Skeleton } from '@/components/ui/Feedback';

type Tab = 'profil' | 'annonces' | 'demandes';

function statusTone(status: ListingWithPhotos['status']) {
  switch (status) {
    case 'published':
      return 'success' as const;
    case 'pending':
      return 'warning' as const;
    case 'rented':
      return 'info' as const;
    case 'archived':
      return 'neutral' as const;
    default:
      return 'neutral' as const;
  }
}

export function AccountPage() {
  useDocumentTitle('Mon espace');
  const { user, profile, role, isOwner, isStaff, isDemo, updateProfile, refreshProfile } =
    useAuth();

  const [tab, setTab] = useState<Tab>('profil');
  const [listings, setListings] = useState<ListingWithPhotos[]>([]);
  const [received, setReceived] = useState<InquiryWithListing[]>([]);
  const [sent, setSent] = useState<InquiryWithListing[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    city: '',
    postalCode: '',
    school: '',
    bio: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setForm({
      fullName: profile.full_name ?? '',
      phone: profile.phone ?? '',
      city: profile.city ?? '',
      postalCode: profile.postal_code ?? '',
      school: profile.school ?? '',
      bio: profile.bio ?? '',
    });
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setDataLoading(true);
    setDataError(null);

    const tasks: Promise<void>[] = [];

    if (isOwner || isStaff) {
      tasks.push(
        getMyListings(user.id).then((rows) => {
          if (active) setListings(rows);
        }),
        getReceivedInquiries(user.id).then((rows) => {
          if (active) setReceived(rows);
        }),
      );
    }

    tasks.push(
      getMyInquiries(user.id).then((rows) => {
        if (active) setSent(rows);
      }),
    );

    Promise.all(tasks)
      .catch(() => {
        if (active) setDataError('Certaines données de votre espace n’ont pas pu être chargées.');
      })
      .finally(() => {
        if (active) setDataLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, isOwner, isStaff]);

  if (!user) return <PageLoader label="Chargement de votre espace…" />;

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError(null);

    const validation = validateWithSchema(profileSchema, form);
    if (!validation.success || !validation.data) {
      setErrors(validation.errors ?? {});
      return;
    }
    setErrors({});

    setSaveState('saving');
    const result = await updateProfile({
      fullName: validation.data.fullName ?? '',
      phone: validation.data.phone ?? '',
      city: validation.data.city ?? '',
      postalCode: validation.data.postalCode ?? '',
      school: validation.data.school ?? '',
      bio: validation.data.bio ?? '',
    });

    if (result.error) {
      setSaveState('idle');
      setSaveError(result.error);
      return;
    }
    setSaveState('saved');
    window.setTimeout(() => setSaveState('idle'), 2500);
  };

  const handleStatus = async (id: string, status: ListingWithPhotos['status']) => {
    try {
      await updateListingStatus(id, status);
      const rows = await getMyListings(user.id);
      setListings(rows);
    } catch (cause) {
      setDataError(toUserMessage(cause, 'Le changement de statut a échoué.'));
    }
  };

  const handleDelete = async (listing: ListingWithPhotos) => {
    const confirmed = window.confirm(
      `Supprimer définitivement l’annonce « ${listing.title} » ? Cette action est irréversible.`,
    );
    if (!confirmed) return;

    try {
      await deleteListing(listing.id);
      setListings((current) => current.filter((item) => item.id !== listing.id));
    } catch (cause) {
      setDataError(toUserMessage(cause, 'La suppression a échoué.'));
    }
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'profil', label: 'Profil' },
    ...(isOwner || isStaff
      ? [{ id: 'annonces' as Tab, label: 'Mes annonces', count: listings.length }]
      : []),
    {
      id: 'demandes',
      label: isOwner || isStaff ? 'Demandes reçues' : 'Mes demandes',
      count: isOwner || isStaff ? received.length : sent.length,
    },
  ];

  return (
    <div className="container-page py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-ink-950 text-3xl font-bold">Mon espace</h1>
          <p className="text-ink-600 mt-1 text-sm">
            {profile?.full_name ? profile.full_name : user.email} ·{' '}
            <span className="text-ink-800 font-medium">
              {role === 'admin'
                ? 'Administrateur'
                : role === 'moderator'
                  ? 'Modérateur'
                  : role === 'owner'
                    ? 'Bailleur'
                    : 'Étudiant'}
            </span>
          </p>
        </div>

        {isOwner || isStaff ? (
          <Link
            to="/mon-espace/annonces/nouvelle"
            className="bg-ink-900 hover:bg-ink-800 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition"
          >
            <Building2 className="h-4 w-4" aria-hidden="true" />
            Nouvelle annonce
          </Link>
        ) : null}
      </header>

      {dataError ? (
        <Alert tone="error" className="mb-6">
          {dataError}
        </Alert>
      ) : null}

      <div
        role="tablist"
        aria-label="Sections de mon espace"
        className="border-ink-100 mb-6 flex flex-wrap gap-1 border-b"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            onClick={() => setTab(item.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              tab === item.id
                ? 'border-ink-900 text-ink-950'
                : 'text-ink-500 hover:text-ink-800 border-transparent'
            }`}
          >
            {item.label}
            {typeof item.count === 'number' && item.count > 0 ? (
              <span className="bg-ink-100 text-ink-700 ml-2 rounded-full px-1.5 py-0.5 text-xs">
                {item.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------- PROFIL */}
      {tab === 'profil' ? (
        <section
          role="tabpanel"
          id="panel-profil"
          aria-labelledby="tab-profil"
          className="grid gap-6 lg:grid-cols-[1.3fr_1fr]"
        >
          <form onSubmit={handleSave} className="card space-y-4 p-6" noValidate>
            <div className="flex items-center gap-2">
              <UserRound className="text-ink-600 h-5 w-5" aria-hidden="true" />
              <h2 className="font-display text-ink-950 text-lg font-semibold">Mes informations</h2>
            </div>

            {saveError ? <Alert tone="error">{saveError}</Alert> : null}
            {saveState === 'saved' ? (
              <Alert tone="success">Vos informations ont été enregistrées.</Alert>
            ) : null}

            <TextField
              label="Nom complet"
              value={form.fullName}
              error={errors.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              maxLength={80}
            />

            <TextField
              label="Adresse e-mail"
              value={user.email}
              disabled
              hint="L’adresse e-mail ne peut pas être modifiée depuis cette page."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Téléphone"
                type="tel"
                placeholder="06 12 34 56 78"
                value={form.phone}
                error={errors.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
              <TextField
                label="Code postal"
                inputMode="numeric"
                value={form.postalCode}
                error={errors.postalCode}
                onChange={(event) =>
                  setForm({
                    ...form,
                    postalCode: event.target.value.replace(/\D/g, '').slice(0, 5),
                  })
                }
              />
            </div>

            <TextField
              label="Ville"
              value={form.city}
              error={errors.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
              maxLength={80}
            />

            <TextField
              label="Établissement ou école"
              value={form.school}
              error={errors.school}
              onChange={(event) => setForm({ ...form, school: event.target.value })}
              maxLength={120}
            />

            <TextAreaField
              label="Présentation"
              rows={4}
              value={form.bio}
              error={errors.bio}
              hint="600 caractères maximum. Visible uniquement par vous et l’équipe."
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
              maxLength={600}
            />

            <Button
              type="submit"
              loading={saveState === 'saving'}
              icon={<Save className="h-4 w-4" aria-hidden="true" />}
            >
              Enregistrer
            </Button>
          </form>

          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="font-display text-ink-950 text-lg font-semibold">Récapitulatif</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-ink-600">Annonces</dt>
                  <dd className="text-ink-950 font-semibold">
                    {isOwner || isStaff ? listings.length : '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-ink-600">
                    {isOwner || isStaff ? 'Demandes reçues' : 'Demandes envoyées'}
                  </dt>
                  <dd className="text-ink-950 font-semibold">
                    {isOwner || isStaff ? received.length : sent.length}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-ink-600">Compte créé le</dt>
                  <dd className="text-ink-950 font-semibold">{formatDate(profile?.created_at)}</dd>
                </div>
              </dl>
            </div>

            {isDemo ? (
              <div className="card bg-amber-soft border-amber-200 p-6">
                <h2 className="font-display text-ink-950 flex items-center gap-2 text-base font-semibold">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  Mode démonstration
                </h2>
                <p className="text-ink-700 mt-2 text-sm leading-relaxed">
                  Vos données sont stockées localement dans ce navigateur. Elles ne sont transmises
                  à aucun service.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => {
                    resetDemoData();
                    void refreshProfile();
                    window.location.reload();
                  }}
                >
                  Réinitialiser les données de démonstration
                </Button>
              </div>
            ) : null}

            <div className="card p-6">
              <h2 className="font-display text-ink-950 text-base font-semibold">Sécurité</h2>
              <ul className="text-ink-600 mt-3 space-y-2 text-sm">
                <li>• Mot de passe haché et géré par Supabase Auth.</li>
                <li>• Session stockée dans votre navigateur uniquement.</li>
                <li>• Aucune donnée bancaire collectée.</li>
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------------------------------------------------------- ANNONCES */}
      {tab === 'annonces' && (isOwner || isStaff) ? (
        <section role="tabpanel" id="panel-annonces" aria-labelledby="tab-annonces">
          {dataLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : listings.length === 0 ? (
            <EmptyState
              title="Aucune annonce pour le moment"
              description="Publiez votre premier logement : il sera relu par notre équipe avant sa mise en ligne."
              icon={<Building2 className="h-7 w-7" aria-hidden="true" />}
              action={
                <Link
                  to="/mon-espace/annonces/nouvelle"
                  className="bg-ink-900 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Créer une annonce
                </Link>
              }
            />
          ) : (
            <ul className="space-y-4">
              {listings.map((listing) => (
                <li
                  key={listing.id}
                  className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                >
                  <img
                    src={
                      listing.listing_photos[0]
                        ? listing.listing_photos[0].storage_path.startsWith('/')
                          ? listing.listing_photos[0].storage_path
                          : `/images/demo/studio-lumiere.svg`
                        : '/images/demo/studio-lumiere.svg'
                    }
                    alt=""
                    className="h-24 w-full rounded-xl object-cover sm:h-20 sm:w-28"
                    loading="lazy"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={statusTone(listing.status)}>
                        {STATUS_LABELS[listing.status]}
                      </Badge>
                      {listing.is_demo ? <Badge tone="accent">Exemple</Badge> : null}
                    </div>
                    <h3 className="font-display text-ink-950 mt-1.5 truncate text-base font-semibold">
                      {listing.title}
                    </h3>
                    <p className="text-ink-600 text-sm">
                      {listing.city} ({listing.postal_code}) · {formatPrice(listing.price_cents)}
                      /mois
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/logements/${listing.id}`}
                      className="border-ink-200 text-ink-700 hover:bg-ink-50 inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      Voir
                    </Link>
                    <Link
                      to={`/mon-espace/annonces/${listing.id}/modifier`}
                      className="border-ink-200 text-ink-700 hover:bg-ink-50 rounded-lg border px-3 py-2 text-sm font-medium"
                    >
                      Modifier
                    </Link>
                    {listing.status === 'published' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void handleStatus(listing.id, 'rented')}
                      >
                        Marquer loué
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDelete(listing)}
                      icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                      aria-label={`Supprimer l’annonce ${listing.title}`}
                    >
                      Supprimer
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {/* ---------------------------------------------------------- DEMANDES */}
      {tab === 'demandes' ? (
        <section role="tabpanel" id="panel-demandes" aria-labelledby="tab-demandes">
          {dataLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            (() => {
              const rows = isOwner || isStaff ? received : sent;
              if (rows.length === 0) {
                return (
                  <EmptyState
                    title={isOwner || isStaff ? 'Aucune demande reçue' : 'Aucune demande envoyée'}
                    description={
                      isOwner || isStaff
                        ? 'Les demandes envoyées depuis vos annonces apparaîtront ici.'
                        : 'Les demandes envoyées depuis une annonce apparaîtront ici.'
                    }
                    icon={<Inbox className="h-7 w-7" aria-hidden="true" />}
                    action={
                      isOwner || isStaff ? undefined : (
                        <Link
                          to="/logements"
                          className="text-sm font-semibold underline underline-offset-2"
                        >
                          Parcourir les annonces
                        </Link>
                      )
                    }
                  />
                );
              }

              return (
                <ul className="space-y-3">
                  {rows.map((inquiry) => (
                    <li key={inquiry.id} className="card p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-ink-500 text-xs">
                            {inquiry.listing_title} · {inquiry.listing_city}
                          </p>
                          <h3 className="text-ink-950 mt-1 font-semibold">{inquiry.sender_name}</h3>
                          <a
                            href={`mailto:${inquiry.sender_email}`}
                            className="text-ink-600 inline-flex items-center gap-1 text-sm underline underline-offset-2"
                          >
                            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                            {inquiry.sender_email}
                          </a>
                        </div>
                        <div className="text-right">
                          <Badge tone={inquiry.status === 'new' ? 'warning' : 'neutral'}>
                            {inquiry.status === 'new'
                              ? 'Nouvelle'
                              : inquiry.status === 'read'
                                ? 'Lue'
                                : inquiry.status === 'answered'
                                  ? 'Répondue'
                                  : 'Clôturée'}
                          </Badge>
                          <p className="text-ink-500 mt-1 text-xs">
                            {formatDate(inquiry.created_at)}
                          </p>
                        </div>
                      </div>
                      <p className="border-ink-100 text-ink-700 mt-3 border-t pt-3 text-sm leading-relaxed whitespace-pre-line">
                        {inquiry.message}
                      </p>
                    </li>
                  ))}
                </ul>
              );
            })()
          )}
        </section>
      ) : null}
    </div>
  );
}
