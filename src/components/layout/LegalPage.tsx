import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <div className="container-page max-w-3xl py-12">
      <nav aria-label="Fil d’Ariane" className="text-ink-500 mb-4 text-sm">
        <Link to="/" className="hover:text-ink-900 hover:underline">
          Accueil
        </Link>
        <span className="text-ink-300 mx-2">/</span>
        <span className="text-ink-800 font-medium">{title}</span>
      </nav>

      <h1 className="font-display text-ink-950 text-3xl font-bold">{title}</h1>
      <p className="text-ink-500 mt-2 text-xs">Dernière mise à jour : {updatedAt}</p>

      <div className="prose-legal mt-8">{children}</div>
    </div>
  );
}
