import { Link } from 'react-router-dom';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
      aria-label="HTI-IMMO — retour à l’accueil"
    >
      <span className="bg-ink-900 group-hover:bg-ink-800 grid h-10 w-10 place-items-center rounded-xl shadow-sm transition">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" focusable="false">
          <path d="M12 3 3 10.2V21h6.2v-6.4h5.6V21H21V10.2L12 3Z" fill="#f5c451" />
          <rect x="9.4" y="11.2" width="5.2" height="3.4" rx="1" fill="#0f2f3d" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-ink-950 text-lg font-bold tracking-tight">
          HTI<span className="text-ink-600">·</span>IMMO
        </span>
        {!compact ? (
          <span className="text-ink-500 mt-1 text-[11px] font-medium tracking-wide uppercase">
            Logement étudiant
          </span>
        ) : null}
      </span>
    </Link>
  );
}
