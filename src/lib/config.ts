/**
 * Configuration applicative.
 *
 * Règle de sécurité : seules les variables préfixées `VITE_` sont exposées au
 * navigateur. Aucun secret (service_role, mot de passe base de données) ne doit
 * jamais être lu ici ni stocké dans ce fichier.
 */

export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  siteUrl: string;
  appName: string;
  contactEmail: string;
  /**
   * `true` = données de démonstration locales, aucun appel réseau.
   * Activé explicitement via VITE_DEMO_MODE, ou automatiquement si Supabase
   * n'est pas configuré (le site reste alors navigable pour évaluation).
   */
  demoMode: boolean;
  /** `true` si Supabase est configuré (URL + clé publique anon). */
  hasSupabase: boolean;
}

function readEnv(value: string | undefined): string {
  return (value ?? '').trim();
}

/** Vérifie grossièrement qu'une chaîne ressemble à une URL http(s) valide. */
export function isValidHttpUrl(value: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Détecte une clé `service_role` ou une clé secrète Supabase nouvelle
 * génération (`sb_secret_...`). Ces clés ne doivent jamais être côté client.
 */
export function looksLikeSecretKey(value: string): boolean {
  if (!value) return false;
  if (value.startsWith('sb_secret_')) return true;
  // Les JWT Supabase encodent le rôle dans leur payload.
  try {
    const payload = JSON.parse(atob(value.split('.')[1] ?? '')) as { role?: string };
    return payload.role === 'service_role';
  } catch {
    return false;
  }
}

export function resolveConfig(env: ImportMetaEnv): AppConfig {
  const supabaseUrl = readEnv(env.VITE_SUPABASE_URL);
  const supabaseAnonKey = readEnv(env.VITE_SUPABASE_ANON_KEY);

  const hasSupabase =
    isValidHttpUrl(supabaseUrl) &&
    supabaseAnonKey.length > 20 &&
    !looksLikeSecretKey(supabaseAnonKey);

  const explicitDemo = readEnv(env.VITE_DEMO_MODE).toLowerCase();
  const demoMode = explicitDemo === 'true' || explicitDemo === '1' || !hasSupabase;

  const siteUrl = readEnv(env.VITE_SITE_URL) || window.location.origin;

  return {
    supabaseUrl: hasSupabase ? supabaseUrl : '',
    supabaseAnonKey: hasSupabase ? supabaseAnonKey : '',
    siteUrl,
    appName: readEnv(env.VITE_APP_NAME) || 'HTI-IMMO',
    contactEmail: readEnv(env.VITE_CONTACT_EMAIL) || 'contact@hti-immo.fr',
    demoMode,
    hasSupabase,
  };
}

export const config: AppConfig = resolveConfig(import.meta.env);

/**
 * Avertit une seule fois dans la console si une clé manifestement secrète est
 * présente dans les variables publiques. On ne l'affiche jamais.
 */
export function warnOnLeakedSecret(): void {
  const key = readEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);
  if (looksLikeSecretKey(key)) {
    console.error(
      '[HTI-IMMO][SECURITE] VITE_SUPABASE_ANON_KEY contient une clé secrète (service_role / sb_secret). ' +
        "Retirez-la immédiatement de vos variables d'environnement et régénérez la clé.",
    );
  }
}
