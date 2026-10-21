import { useEffect } from 'react';

const SUFFIX = 'HTI-IMMO';

/**
 * Met à jour le titre du document et, si fournie, la meta description.
 * Améliore l'accessibilité (annonce du changement de page) et le SEO.
 */
export function useDocumentTitle(title?: string, description?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${SUFFIX}` : `${SUFFIX} — Le logement étudiant, simplifié`;

    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', description);
    }
  }, [title, description]);
}
