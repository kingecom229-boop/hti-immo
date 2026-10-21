import { describe, expect, it } from 'vitest';
import { isValidHttpUrl, looksLikeSecretKey, resolveConfig, type AppConfig } from './config';

function env(overrides: Partial<ImportMetaEnv>): ImportMetaEnv {
  return { ...overrides } as ImportMetaEnv;
}

/** Construit un faux JWT Supabase avec le rôle indiqué. */
function fakeJwt(payload: Record<string, unknown>): string {
  const encoded = btoa(JSON.stringify(payload));
  return `header.${encoded}.signature`;
}

const VALID_URL = 'https://abcdefgh.supabase.co';
const VALID_ANON_KEY = fakeJwt({ role: 'anon', iss: 'supabase' });

describe('isValidHttpUrl', () => {
  it('accepte http et https', () => {
    expect(isValidHttpUrl('https://exemple.fr')).toBe(true);
    expect(isValidHttpUrl('http://localhost:5173')).toBe(true);
  });

  it('refuse les autres schémas et les chaînes vides', () => {
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isValidHttpUrl('pas une url')).toBe(false);
    expect(isValidHttpUrl('')).toBe(false);
  });
});

describe('looksLikeSecretKey', () => {
  it('détecte une clé service_role encodée en JWT', () => {
    expect(looksLikeSecretKey(fakeJwt({ role: 'service_role' }))).toBe(true);
  });

  it('détecte les nouvelles clés secrètes sb_secret_', () => {
    expect(looksLikeSecretKey('sb_secret_abcdef123456')).toBe(true);
  });

  it('n’alerte pas sur une clé anon', () => {
    expect(looksLikeSecretKey(fakeJwt({ role: 'anon' }))).toBe(false);
  });

  it('ne casse pas sur une valeur quelconque', () => {
    expect(looksLikeSecretKey('cle-aleatoire')).toBe(false);
    expect(looksLikeSecretKey('')).toBe(false);
  });
});

describe('resolveConfig', () => {
  it('active le mode démonstration sans configuration Supabase', () => {
    const config: AppConfig = resolveConfig(env({}));
    expect(config.hasSupabase).toBe(false);
    expect(config.demoMode).toBe(true);
    expect(config.supabaseUrl).toBe('');
  });

  it('active Supabase avec une URL et une clé anon valides', () => {
    const config = resolveConfig(
      env({ VITE_SUPABASE_URL: VALID_URL, VITE_SUPABASE_ANON_KEY: VALID_ANON_KEY }),
    );
    expect(config.hasSupabase).toBe(true);
    expect(config.demoMode).toBe(false);
    expect(config.supabaseUrl).toBe(VALID_URL);
  });

  it('refuse une clé service_role comme clé publique', () => {
    const config = resolveConfig(
      env({
        VITE_SUPABASE_URL: VALID_URL,
        VITE_SUPABASE_ANON_KEY: fakeJwt({ role: 'service_role' }),
      }),
    );
    expect(config.hasSupabase).toBe(false);
    expect(config.demoMode).toBe(true);
  });

  it('refuse une URL Supabase invalide', () => {
    const config = resolveConfig(
      env({ VITE_SUPABASE_URL: 'javascript:alert(1)', VITE_SUPABASE_ANON_KEY: VALID_ANON_KEY }),
    );
    expect(config.hasSupabase).toBe(false);
  });

  it('respecte la désactivation explicite du mode démonstration', () => {
    const config = resolveConfig(
      env({
        VITE_SUPABASE_URL: VALID_URL,
        VITE_SUPABASE_ANON_KEY: VALID_ANON_KEY,
        VITE_DEMO_MODE: 'false',
      }),
    );
    expect(config.demoMode).toBe(false);
  });

  it('applique les valeurs par défaut de la marque', () => {
    const config = resolveConfig(env({}));
    expect(config.appName).toBe('HTI-IMMO');
    expect(config.contactEmail).toBe('contact@hti-immo.fr');
  });

  it('lit le nom et l’e-mail de contact personnalisés', () => {
    const config = resolveConfig(
      env({ VITE_APP_NAME: 'TestImmo', VITE_CONTACT_EMAIL: 'hello@test.fr' }),
    );
    expect(config.appName).toBe('TestImmo');
    expect(config.contactEmail).toBe('hello@test.fr');
  });
});
