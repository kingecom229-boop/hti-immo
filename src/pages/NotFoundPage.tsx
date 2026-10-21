import { Link } from 'react-router-dom';
import { Compass, Home, Search } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { buttonClasses } from '@/components/ui/button-styles';

export function NotFoundPage() {
  useDocumentTitle('Page introuvable');
  return (
    <div className="container-page flex max-w-2xl flex-col items-center py-24 text-center">
      <span className="bg-ink-900 text-amber-accent grid h-16 w-16 place-items-center rounded-2xl">
        <Compass className="h-8 w-8" aria-hidden="true" />
      </span>
      <p className="font-display text-ink-200 mt-6 text-6xl font-bold">404</p>
      <h1 className="font-display text-ink-950 mt-2 text-3xl font-bold">Cette page n’existe pas</h1>
      <p className="text-ink-600 mt-3 max-w-md text-sm leading-relaxed">
        Le lien est peut-être obsolète ou la page a été déplacée. Vous pouvez revenir à l’accueil ou
        reprendre votre recherche de logement.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonClasses('primary', 'md')}>
          <Home className="h-4 w-4" aria-hidden="true" />
          Accueil
        </Link>
        <Link to="/logements" className={buttonClasses('secondary', 'md')}>
          <Search className="h-4 w-4" aria-hidden="true" />
          Voir les annonces
        </Link>
      </div>
    </div>
  );
}
