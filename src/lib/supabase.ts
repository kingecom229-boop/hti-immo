import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';

/**
 * Client Supabase côté navigateur.
 *
 * Sécurité :
 *  - seule la clé publique `anon` est utilisée ici ; elle est protégée par RLS ;
 *  - `detectSessionInUrl` + `flowType: 'pkce'` pour un flux d'authentification
 *    adapté au web (code challenge, pas de jeton dans le fragment d'URL) ;
 *  - la session est persistée et rafraîchie automatiquement.
 *
 * Si Supabase n'est pas configuré, `supabase` vaut `null` : l'application bascule
 * en mode démonstration local (voir `config.demoMode`).
 */
const client: SupabaseClient | null = config.hasSupabase
  ? createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'hti-immo-auth',
      },
      global: {
        headers: { 'x-client-info': 'hti-immo-web/1.0.0' },
      },
    })
  : null;

export const supabase = client;

/** Indique si un backend Supabase est disponible pour les appels réseau. */
export const isSupabaseConfigured = config.hasSupabase;

/** Récupère le client ou lève une erreur explicite (jamais de `undefined` silencieux). */
export function requireSupabase(): SupabaseClient {
  if (!client) {
    throw new Error(
      'Supabase n’est pas configuré. Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.',
    );
  }
  return client;
}
