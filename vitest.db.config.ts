import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

/**
 * Configuration dédiée aux tests de base de données.
 *
 * Ces tests exécutent les vraies migrations SQL dans PGlite (PostgreSQL compilé
 * en WebAssembly) puis vérifient le schéma, les contraintes et les politiques
 * Row Level Security en changeant de rôle (`anon`, `authenticated`).
 *
 * Aucune connexion à une base Supabase réelle n'est nécessaire : aucun risque
 * pour la production.
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['supabase/tests/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    pool: 'forks',
  },
});
