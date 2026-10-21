import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { searchListings } from '@/lib/listings-api';
import { DEFAULT_FILTERS, type ListingWithPhotos } from '@/types/domain';
import { STUDENT_CITIES } from '@/data/cities';
import { SearchBar } from '@/components/listings/SearchBar';
import { ListingCard } from '@/components/listings/ListingCard';
import { buttonClasses } from '@/components/ui/button-styles';
import { ListingGridSkeleton } from '@/components/ui/Feedback';
import { Alert } from '@/components/ui/Alert';

const STEPS = [
  {
    icon: Search,
    title: 'Cherchez par ville ou code postal',
    text: 'Filtrez par loyer, surface, type de logement et équipements pour ne voir que les annonces qui vous correspondent.',
  },
  {
    icon: BadgeCheck,
    title: 'Comparez des annonces complètes',
    text: 'Photos, charges, dépôt de garantie, date de disponibilité : toutes les informations utiles sont sur une seule page.',
  },
  {
    icon: MessageSquare,
    title: 'Contactez le bailleur',
    text: 'Envoyez une demande de logement structurée depuis l’annonce. Le bailleur reçoit directement vos coordonnées.',
  },
];

const TRUST = [
  { icon: ShieldCheck, label: 'Annonces modérées avant publication' },
  { icon: Users, label: 'Pensé pour les étudiants' },
  { icon: CalendarCheck, label: 'Disponibilités explicites' },
  { icon: Building2, label: 'Bailleurs identifiés' },
];

export function HomePage() {
  useDocumentTitle(
    'Le logement étudiant, simplifié',
    'Trouvez un logement étudiant en France : recherche par ville et code postal, filtres précis, annonces détaillées et contact direct avec le bailleur.',
  );

  const [featured, setFeatured] = useState<ListingWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    searchListings({ ...DEFAULT_FILTERS, pageSize: 3, sort: 'recent' })
      .then((result) => {
        if (active) setFeatured(result.items);
      })
      .catch(() => {
        if (active) setError('Les annonces récentes n’ont pas pu être chargées pour le moment.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      {/* ---------------------------------------------------------------- HÉRO */}
      <section className="border-ink-100 from-ink-950 via-ink-900 to-ink-800 relative overflow-hidden border-b bg-gradient-to-br text-white">
        <div
          className="bg-amber-accent/15 pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full blur-3xl"
          aria-hidden="true"
        />
        <div className="container-page relative grid gap-10 py-16 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:py-24">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="text-amber-accent h-3.5 w-3.5" aria-hidden="true" />
              Plateforme immobilière étudiante
            </p>

            <h1 className="font-display text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Votre logement étudiant,
              <span className="text-amber-accent"> sans mauvaise surprise</span>.
            </h1>

            <p className="text-ink-100 max-w-xl text-base leading-relaxed sm:text-lg">
              HTI-IMMO rassemble des annonces claires et vérifiées près des campus français.
              Recherchez par ville ou code postal, comparez les loyers réels et contactez le
              bailleur en quelques minutes.
            </p>

            <ul className="grid gap-3 sm:grid-cols-2">
              {TRUST.map((item) => (
                <li key={item.label} className="text-ink-100 flex items-center gap-2 text-sm">
                  <item.icon className="text-amber-accent h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/logements" className={buttonClasses('accent', 'lg')}>
                Voir les annonces
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/inscription"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Créer un compte
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <div className="shadow-lift rounded-2xl bg-white p-5">
              <h2 className="font-display text-ink-950 mb-3 text-lg font-semibold">
                Trouver un logement
              </h2>
              <SearchBar variant="compact" />
              <p className="text-ink-500 mt-3 text-xs">
                Astuce : saisissez un code postal (ex. 69007) pour cibler un quartier précis.
              </p>
            </div>

            <dl className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Villes couvertes', value: `${STUDENT_CITIES.length}+` },
                { label: 'Filtres utiles', value: '10' },
                { label: 'Mise en relation', value: 'Directe' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/15 bg-white/5 px-2 py-3"
                >
                  <dt className="text-ink-200 text-[11px] tracking-wide uppercase">{stat.label}</dt>
                  <dd className="font-display mt-1 text-xl font-bold text-white">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- COMMENT ÇA MARCHE */}
      <section className="container-page py-16" aria-labelledby="etapes-titre">
        <div className="max-w-2xl">
          <p className="text-ink-500 text-xs font-bold tracking-wider uppercase">
            Simple et rapide
          </p>
          <h2 id="etapes-titre" className="font-display text-ink-950 mt-2 text-3xl font-bold">
            Trois étapes pour trouver votre logement
          </h2>
        </div>

        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="card relative p-6">
              <span className="font-display text-ink-100 absolute top-5 right-5 text-4xl font-bold">
                {index + 1}
              </span>
              <span className="bg-ink-900 text-amber-accent grid h-11 w-11 place-items-center rounded-xl">
                <step.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="font-display text-ink-950 mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="text-ink-600 mt-2 text-sm leading-relaxed">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* --------------------------------------------------------------- VILLES */}
      <section className="border-ink-100 border-y bg-white py-16" aria-labelledby="villes-titre">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-ink-500 text-xs font-bold tracking-wider uppercase">
                Les grandes villes étudiantes
              </p>
              <h2 id="villes-titre" className="font-display text-ink-950 mt-2 text-3xl font-bold">
                Où cherchez-vous ?
              </h2>
            </div>
            <Link
              to="/logements"
              className="text-ink-700 hover:text-ink-950 inline-flex items-center gap-1.5 text-sm font-semibold"
            >
              Toutes les annonces <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {STUDENT_CITIES.map((city) => (
              <li key={city.slug}>
                <Link
                  to={`/logements?ville=${encodeURIComponent(city.name)}`}
                  className="group border-ink-100 bg-sand-50 hover:border-ink-300 hover:shadow-card flex h-full flex-col justify-between rounded-xl border p-4 transition hover:bg-white"
                >
                  <span className="font-display text-ink-950 text-base font-semibold">
                    {city.name}
                  </span>
                  <span className="text-ink-500 mt-1 text-xs">
                    {city.region} · {city.postalCode}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------ ANNONCES */}
      <section className="container-page py-16" aria-labelledby="recentes-titre">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-ink-500 text-xs font-bold tracking-wider uppercase">
              Dernières publications
            </p>
            <h2 id="recentes-titre" className="font-display text-ink-950 mt-2 text-3xl font-bold">
              Annonces récentes
            </h2>
          </div>
          <Link
            to="/logements"
            className="text-ink-700 hover:text-ink-950 inline-flex items-center gap-1.5 text-sm font-semibold"
          >
            Voir tout le catalogue <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-8">
          {loading ? <ListingGridSkeleton count={3} /> : null}

          {!loading && error ? (
            <Alert tone="warning" title="Chargement partiel">
              {error} Vous pouvez tout de même consulter le catalogue.
            </Alert>
          ) : null}

          {!loading && !error && featured.length === 0 ? (
            <Alert tone="info" title="Aucune annonce publiée pour le moment">
              Le catalogue est vide. Les bailleurs peuvent publier une annonce depuis leur espace.
            </Alert>
          ) : null}

          {!loading && featured.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ---------------------------------------------------------------- CTA */}
      <section className="container-page pb-16">
        <div className="bg-ink-900 overflow-hidden rounded-2xl px-6 py-12 text-white sm:px-12">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl space-y-3">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                Vous proposez un logement étudiant ?
              </h2>
              <p className="text-ink-100 text-sm leading-relaxed">
                Publiez votre annonce gratuitement, recevez des demandes qualifiées et gardez la
                main sur votre calendrier de disponibilité. Chaque annonce est relue avant
                publication.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/inscription" className={buttonClasses('accent', 'lg')}>
                Devenir bailleur
              </Link>
              <Link
                to="/comment-ca-marche"
                className="inline-flex items-center justify-center rounded-xl border border-white/25 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
              >
                En savoir plus
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
