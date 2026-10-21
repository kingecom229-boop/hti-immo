import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Heart, LayoutDashboard, LogIn, Menu, ShieldCheck, UserRound, X } from 'lucide-react';
import { useAuth } from '@/auth/auth-context';
import { buttonClasses } from '@/components/ui/button-styles';
import { Logo } from './Logo';
import { DemoBanner } from './DemoBanner';

const NAV_LINKS = [
  { to: '/logements', label: 'Annonces' },
  { to: '/comment-ca-marche', label: 'Comment ça marche' },
  { to: '/contact', label: 'Contact' },
];

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return [
    'rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive ? 'bg-ink-50 text-ink-950' : 'text-ink-700 hover:bg-ink-50 hover:text-ink-950',
  ].join(' ');
}

export function Header() {
  const { user, profile, isStaff, isOwner, isDemo, signOut, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  const firstName = profile?.full_name?.split(' ')[0] ?? null;

  return (
    <header className="border-ink-100 bg-sand-50/95 sticky top-0 z-50 border-b backdrop-blur">
      {isDemo ? <DemoBanner /> : null}

      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!loading && user ? (
            <div className="hidden items-center gap-2 md:flex">
              {isOwner ? (
                <Link
                  to="/mon-espace/annonces/nouvelle"
                  className={buttonClasses('secondary', 'sm')}
                >
                  Publier une annonce
                </Link>
              ) : null}
              {isStaff ? (
                <Link
                  to="/admin"
                  className="text-ink-700 hover:bg-ink-50 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Administration
                </Link>
              ) : null}
              <Link
                to="/favoris"
                className="text-ink-700 hover:bg-ink-50 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition"
              >
                <Heart className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Mes favoris</span>
              </Link>
              <Link
                to="/mon-espace"
                className="border-ink-200 text-ink-800 hover:bg-ink-50 inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-sm font-medium transition"
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
                {firstName ? `Bonjour ${firstName}` : 'Mon espace'}
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="text-ink-600 hover:bg-ink-50 hover:text-ink-950 rounded-lg px-3 py-2 text-sm font-medium transition"
              >
                Déconnexion
              </button>
            </div>
          ) : null}

          {!loading && !user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/connexion" className={buttonClasses('ghost', 'sm')}>
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Connexion
              </Link>
              <Link to="/inscription" className={buttonClasses('primary', 'sm')}>
                Créer un compte
              </Link>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="border-ink-200 text-ink-800 inline-flex items-center justify-center rounded-lg border bg-white p-2 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div id="mobile-menu" className="border-ink-100 bg-sand-50 border-t md:hidden">
          <nav className="container-page flex flex-col gap-1 py-4" aria-label="Navigation mobile">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}

            <div className="bg-ink-100 my-2 h-px" />

            {user ? (
              <>
                <NavLink to="/mon-espace" className={navLinkClass}>
                  <span className="inline-flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Mon espace
                  </span>
                </NavLink>
                <NavLink to="/favoris" className={navLinkClass}>
                  Mes favoris
                </NavLink>
                {isOwner ? (
                  <NavLink to="/mon-espace/annonces/nouvelle" className={navLinkClass}>
                    Publier une annonce
                  </NavLink>
                ) : null}
                {isStaff ? (
                  <NavLink to="/admin" className={navLinkClass}>
                    Administration
                  </NavLink>
                ) : null}
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="text-ink-600 hover:bg-ink-50 rounded-lg px-3 py-2 text-left text-sm font-medium"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <NavLink to="/connexion" className={navLinkClass}>
                  Connexion
                </NavLink>
                <NavLink to="/inscription" className={navLinkClass}>
                  Créer un compte
                </NavLink>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
