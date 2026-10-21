import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { ListingPhoto } from '@/types/domain';
import { resolvePhotoUrl } from '@/lib/listings-api';

const FALLBACK = '/images/demo/studio-lumiere.svg';

export function PhotoGallery({ photos, title }: { photos: ListingPhoto[]; title: string }) {
  const [selected, setSelected] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const safePhotos = photos.length > 0 ? photos : [];
  const count = safePhotos.length;
  const current = safePhotos[selected];

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false);
      if (event.key === 'ArrowRight' && count > 1) setSelected((index) => (index + 1) % count);
      if (event.key === 'ArrowLeft' && count > 1)
        setSelected((index) => (index - 1 + count) % count);
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, count]);

  return (
    <div className="space-y-3">
      <div className="bg-ink-100 relative overflow-hidden rounded-2xl">
        <button
          type="button"
          onClick={() => current && setLightboxOpen(true)}
          className="block w-full cursor-zoom-in"
          aria-label={`Agrandir la photo ${selected + 1} sur ${count || 1}`}
        >
          <img
            src={current ? resolvePhotoUrl(current.storage_path) : FALLBACK}
            alt={current?.alt_text ?? `Photo de l’annonce : ${title}`}
            className="aspect-16/10 w-full object-cover"
            width={1280}
            height={800}
            fetchPriority="high"
          />
        </button>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => setSelected((index) => (index - 1 + count) % count)}
              className="text-ink-900 absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md transition hover:bg-white"
              aria-label="Photo précédente"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setSelected((index) => (index + 1) % count)}
              className="text-ink-900 absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md transition hover:bg-white"
              aria-label="Photo suivante"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="bg-ink-950/80 absolute right-3 bottom-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white">
              {selected + 1} / {count}
            </span>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {safePhotos.map((photo, index) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-label={`Afficher la photo ${index + 1}`}
                aria-current={index === selected ? 'true' : undefined}
                className={`overflow-hidden rounded-lg border-2 transition ${
                  index === selected ? 'border-ink-800' : 'hover:border-ink-200 border-transparent'
                }`}
              >
                <img
                  src={resolvePhotoUrl(photo.storage_path)}
                  alt=""
                  loading="lazy"
                  className="h-16 w-24 object-cover"
                  width={96}
                  height={64}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {lightboxOpen && current ? (
        <div
          className="bg-ink-950/95 fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Galerie photo : ${title}`}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
            aria-label="Fermer la galerie"
            autoFocus
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
          <img
            src={resolvePhotoUrl(current.storage_path)}
            alt={current.alt_text ?? `Photo de l’annonce : ${title}`}
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
          />
          {count > 1 ? (
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full bg-white/10 px-4 py-2 text-white">
              <button
                type="button"
                onClick={() => setSelected((index) => (index - 1 + count) % count)}
                aria-label="Photo précédente"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <span className="text-sm font-medium">
                {selected + 1} / {count}
              </span>
              <button
                type="button"
                onClick={() => setSelected((index) => (index + 1) % count)}
                aria-label="Photo suivante"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
