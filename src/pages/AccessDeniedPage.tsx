import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { buttonClasses } from '@/components/ui/button-styles';

export function AccessDeniedPage() {
  useDocumentTitle('Accès refusé');
  return (
    <div className="container-page flex max-w-2xl flex-col items-center py-24 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-700">
        <Lock className="h-8 w-8" aria-hidden="true" />
      </span>
      <h1 className="font-display text-ink-950 mt-6 text-3xl font-bold">Accès refusé</h1>
      <p className="text-ink-600 mt-3 max-w-md text-sm leading-relaxed">
        Cette page est réservée aux membres de l’équipe HTI-IMMO. Si vous pensez qu’il s’agit d’une
        erreur, contactez-nous depuis la page dédiée.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonClasses('primary', 'md')}>
          Retour à l’accueil
        </Link>
        <Link to="/contact" className={buttonClasses('secondary', 'md')}>
          Contacter l’équipe
        </Link>
      </div>
    </div>
  );
}
