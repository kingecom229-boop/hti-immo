export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950 focus-visible:outline-ink-900 shadow-sm',
  secondary:
    'border border-ink-200 bg-white text-ink-900 hover:border-ink-300 hover:bg-ink-50 focus-visible:outline-ink-600',
  ghost: 'text-ink-700 hover:bg-ink-50 hover:text-ink-950 focus-visible:outline-ink-600',
  danger: 'bg-red-700 text-white hover:bg-red-800 focus-visible:outline-red-700',
  accent:
    'bg-amber-accent text-ink-950 hover:bg-[#f0b93a] focus-visible:outline-ink-900 shadow-sm font-bold',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

/** Classes utilitaires partagées entre `<Button>` et les liens React Router. */
export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  extra = '',
): string {
  return [BASE, VARIANTS[variant], SIZES[size], extra].filter(Boolean).join(' ');
}
