import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';
import { config } from '@/lib/config';
import { Logo } from './Logo';

const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-ink-100 bg-ink-950 text-ink-100 mt-20 border-t">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-4 md:col-span-2">
          <div className="[&_span]:text-white">
            <Logo />
          </div>
          <p className="text-ink-200 max-w-sm text-sm leading-relaxed">
            HTI-IMMO aide les étudiants à trouver un logement vérifié en France : recherche par
            ville et code postal, filtres précis, annonces détaillées et mise en relation directe
            avec le bailleur.
          </p>
          <ul className="text-ink-200 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Mail className="text-amber-accent h-4 w-4 shrink-0" aria-hidden="true" />
              <a
                className="hover:text-white hover:underline"
                href={`mailto:${config.contactEmail}`}
              >
                {config.contactEmail}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="text-amber-accent h-4 w-4 shrink-0" aria-hidden="true" />
              France métropolitaine
            </li>
          </ul>
        </div>

        <nav aria-label="Liens utiles" className="space-y-3 text-sm">
          <h2 className="text-ink-300 text-xs font-semibold tracking-wider uppercase">Explorer</h2>
          <ul className="space-y-2">
            {[
              { to: '/logements', label: 'Toutes les annonces' },
              { to: '/comment-ca-marche', label: 'Comment ça marche' },
              { to: '/inscription', label: 'Créer un compte' },
              { to: '/contact', label: 'Nous contacter' },
            ].map((link) => (
              <li key={link.to}>
                <Link className="text-ink-200 hover:text-white hover:underline" to={link.to}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Informations légales" className="space-y-3 text-sm">
          <h2 className="text-ink-300 text-xs font-semibold tracking-wider uppercase">
            Informations
          </h2>
          <ul className="space-y-2">
            {[
              { to: '/mentions-legales', label: 'Mentions légales' },
              { to: '/confidentialite', label: 'Politique de confidentialité' },
              { to: '/cookies', label: 'Cookies et traceurs' },
              { to: '/cgu', label: 'Conditions générales d’utilisation' },
            ].map((link) => (
              <li key={link.to}>
                <Link className="text-ink-200 hover:text-white hover:underline" to={link.to}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10 py-6">
        <div className="container-page text-ink-300 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {YEAR} HTI-IMMO — Tous droits réservés.</p>
          <p>
            Les annonces marquées « exemple » sont des données de démonstration et ne constituent
            pas une offre de location.
          </p>
        </div>
      </div>
    </footer>
  );
}
