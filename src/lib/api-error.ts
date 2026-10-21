/** Erreur applicative normalisée, avec un message directement affichable. */
export class ApiError extends Error {
  readonly code: string;

  constructor(message: string, code = 'unknown') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

/** Convertit une erreur inconnue en message utilisateur sûr. */
export function toUserMessage(
  error: unknown,
  fallback = 'Une erreur inattendue est survenue.',
): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
