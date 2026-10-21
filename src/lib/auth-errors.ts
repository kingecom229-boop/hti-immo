/**
 * Traduction des erreurs d'authentification Supabase en messages français,
 * explicites et non divulgatifs.
 *
 * Règle de sécurité : on ne révèle jamais si une adresse e-mail existe déjà
 * lors d'une tentative de connexion (protection contre l'énumération de comptes).
 */
export function translateAuthError(error: unknown): string {
  const fallback =
    'Une erreur est survenue. Vérifiez votre connexion puis réessayez dans quelques instants.';

  if (!error) return fallback;

  const message =
    typeof error === 'string' ? error : ((error as { message?: string }).message ?? '');
  const code = (error as { code?: string }).code ?? '';
  const normalized = `${code} ${message}`.toLowerCase();

  if (normalized.includes('invalid_credentials') || normalized.includes('invalid login')) {
    return 'Adresse e-mail ou mot de passe incorrect.';
  }
  if (normalized.includes('email_not_confirmed')) {
    return 'Votre adresse e-mail n’est pas encore confirmée. Consultez votre boîte de réception.';
  }
  if (normalized.includes('user_already_exists') || normalized.includes('already registered')) {
    return 'Un compte existe déjà avec cette adresse. Connectez-vous ou réinitialisez votre mot de passe.';
  }
  if (normalized.includes('weak_password')) {
    return 'Mot de passe trop faible : utilisez au moins 10 caractères avec des lettres et des chiffres.';
  }
  if (normalized.includes('over_email_send_rate_limit')) {
    return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
  }
  if (normalized.includes('signup_disabled')) {
    return 'Les inscriptions sont temporairement fermées.';
  }
  if (normalized.includes('same_password')) {
    return 'Le nouveau mot de passe doit être différent de l’ancien.';
  }
  if (normalized.includes('network') || normalized.includes('fetch')) {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion internet.';
  }
  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return 'Trop de tentatives. Merci de patienter quelques instants.';
  }

  return fallback;
}

/**
 * Traduction des erreurs PostgreSQL / PostgREST les plus fréquentes,
 * en évitant d'exposer des détails internes au visiteur.
 */
export function translateDataError(error: unknown): string {
  const code = (error as { code?: string }).code ?? '';

  switch (code) {
    case '42501':
      return 'Action non autorisée.';
    case '23505':
      return 'Cette entrée existe déjà.';
    case '23503':
      return 'Référence invalide : la ressource liée est introuvable.';
    case '23514':
    case '22023':
      return 'Données invalides : vérifiez le formulaire.';
    case 'PGRST116':
      return 'Élément introuvable.';
    default:
      return 'Impossible de traiter la demande pour le moment. Réessayez plus tard.';
  }
}
