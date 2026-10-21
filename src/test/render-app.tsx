import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';
import { AuthProvider } from '@/auth/AuthProvider';
import type { Profile, UserRole } from '@/types/domain';

/**
 * Utilitaires de test : rendu complet de l'application en mode démonstration.
 * Aucun appel réseau n'est effectué (Supabase non configuré dans les tests).
 */

const DEMO_ROLE_IDS: Record<UserRole, string> = {
  student: 'demo-student',
  owner: 'demo-owner',
  moderator: 'demo-moderator',
  admin: 'demo-admin',
};

export function seedDemoSession(role: UserRole = 'student'): Profile {
  const now = new Date().toISOString();
  const profile: Profile = {
    id: DEMO_ROLE_IDS[role],
    full_name:
      role === 'owner'
        ? 'Camille Bailleur'
        : role === 'admin'
          ? 'Sam Administrateur'
          : 'Alex Étudiant',
    role,
    phone: null,
    city: 'Lyon',
    postal_code: '69007',
    school: role === 'student' ? 'Université Lyon 2' : null,
    bio: null,
    avatar_url: null,
    created_at: now,
    updated_at: now,
  };

  window.localStorage.setItem(
    'hti-immo-demo-session',
    JSON.stringify({
      user: { id: profile.id, email: `${role}@demo.hti-immo.test` },
      profile,
    }),
  );

  return profile;
}

export function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}
