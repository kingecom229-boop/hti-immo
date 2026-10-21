import { Info } from 'lucide-react';

/**
 * Bandeau affiché en mode démonstration.
 * Il rend explicite le fait que les annonces sont fictives : aucune confusion
 * possible avec une véritable offre de logement.
 */
export function DemoBanner() {
  return (
    <div className="bg-amber-soft text-ink-900 border-b border-amber-300 px-4 py-2 text-center text-xs font-medium">
      <Info className="-mt-0.5 mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
      <strong>Mode démonstration</strong> — les annonces affichées sont des exemples fictifs et ne
      correspondent à aucun logement réel.
    </div>
  );
}
