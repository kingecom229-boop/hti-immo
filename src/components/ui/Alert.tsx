import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

type AlertTone = 'info' | 'success' | 'warning' | 'error';

const STYLES: Record<AlertTone, { wrapper: string; icon: ReactNode }> = {
  info: {
    wrapper: 'border-sky-200 bg-sky-50 text-sky-950',
    icon: <Info className="h-5 w-5 shrink-0 text-sky-700" aria-hidden="true" />,
  },
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    icon: <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />,
  },
  warning: {
    wrapper: 'border-amber-300 bg-amber-50 text-amber-950',
    icon: <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />,
  },
  error: {
    wrapper: 'border-red-200 bg-red-50 text-red-950',
    icon: <XCircle className="h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />,
  },
};

export function Alert({
  tone = 'info',
  title,
  children,
  className = '',
}: {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const style = STYLES[tone];
  const assertive = tone === 'error';
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${style.wrapper} ${className}`}
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
    >
      {style.icon}
      <div className="min-w-0 space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="leading-relaxed">{children}</div> : null}
      </div>
    </div>
  );
}
