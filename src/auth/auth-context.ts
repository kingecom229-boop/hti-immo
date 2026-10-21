import { createContext, useContext } from 'react';
import type { Profile, UserRole } from '@/types/domain';
import type { SignInInput, SignUpInput, ProfileInput } from '@/lib/validation';

/** Utilisateur minimal exposé à l'interface (jamais de jeton ici). */
export interface AuthUser {
  id: string;
  email: string;
}

export interface UpdateProfilePayload extends ProfileInput {
  fullName?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  profile: Profile | null;
  /** `true` tant que la session initiale n'est pas résolue. */
  loading: boolean;
  /** `true` si l'application tourne sans backend Supabase. */
  isDemo: boolean;
  /** Rôle effectif (profil, ou « étudiant » par défaut). */
  role: UserRole;
  isStaff: boolean;
  isOwner: boolean;
  signIn: (input: SignInInput) => Promise<{ error: string | null }>;
  signUp: (
    input: SignUpInput,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<{ error: string | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  /** Ouvre une session locale de démonstration (aucun appel réseau). */
  startDemoSession: (role?: UserRole) => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé à l’intérieur de <AuthProvider>.');
  }
  return ctx;
}
