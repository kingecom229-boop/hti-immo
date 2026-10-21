import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { config } from '@/lib/config';
import { translateAuthError } from '@/lib/auth-errors';
import type { Profile, UserRole } from '@/types/domain';
import type { SignInInput, SignUpInput } from '@/lib/validation';
import {
  AuthContext,
  type AuthContextValue,
  type AuthUser,
  type UpdateProfilePayload,
} from './auth-context';

const DEMO_STORAGE_KEY = 'hti-immo-demo-session';

interface DemoSession {
  user: AuthUser;
  profile: Profile;
}

function buildDemoProfile(user: AuthUser, role: UserRole): Profile {
  const now = new Date().toISOString();
  return {
    id: user.id,
    full_name: role === 'owner' ? 'Camille Bailleur (démo)' : 'Alex Étudiant (démo)',
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
}

function readDemoSession(): DemoSession | null {
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DemoSession>;
    if (!parsed.user?.id || !parsed.profile) return null;
    return { user: parsed.user as AuthUser, profile: parsed.profile as Profile };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const isDemo = config.demoMode || !supabase;

  const loadProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[HTI-IMMO] Impossible de charger le profil :', error.code);
      return null;
    }
    return (data as Profile | null) ?? null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (!supabase) {
      const demo = readDemoSession();
      setUser(demo?.user ?? null);
      setProfile(demo?.profile ?? null);
      setLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    const client = supabase;

    const applySession = async (nextUserId: string | null, email: string | null) => {
      if (!mountedRef.current) return;
      if (!nextUserId) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setUser({ id: nextUserId, email: email ?? '' });
      const nextProfile = await loadProfile(nextUserId);
      if (!mountedRef.current) return;
      setProfile(nextProfile);
      setLoading(false);
    };

    client.auth
      .getSession()
      .then(({ data }) => {
        const session = data.session;
        void applySession(session?.user.id ?? null, session?.user.email ?? null);
      })
      .catch(() => {
        if (mountedRef.current) setLoading(false);
      });

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      void applySession(session?.user.id ?? null, session?.user.email ?? null);
    });

    return () => {
      mountedRef.current = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const startDemoSession = useCallback((role: UserRole = 'student') => {
    const demoUser: AuthUser = {
      id: role === 'owner' ? 'demo-owner' : role === 'admin' ? 'demo-admin' : 'demo-student',
      email: `${role}@demo.hti-immo.test`,
    };
    const demoProfile = buildDemoProfile(demoUser, role);
    try {
      window.localStorage.setItem(
        DEMO_STORAGE_KEY,
        JSON.stringify({ user: demoUser, profile: demoProfile }),
      );
    } catch {
      /* stockage indisponible (navigation privée stricte) : session en mémoire */
    }
    setUser(demoUser);
    setProfile(demoProfile);
  }, []);

  const signIn = useCallback(
    async (input: SignInInput): Promise<{ error: string | null }> => {
      if (isDemo || !supabase) {
        return {
          error:
            'Le mode démonstration est actif : l’authentification réelle nécessite la configuration de Supabase. Utilisez « Explorer en mode démonstration ».',
        };
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      return { error: error ? translateAuthError(error) : null };
    },
    [isDemo],
  );

  const signUp = useCallback(
    async (
      input: SignUpInput,
    ): Promise<{ error: string | null; needsEmailConfirmation: boolean }> => {
      if (isDemo || !supabase) {
        return {
          error:
            'Le mode démonstration est actif : la création de compte réelle nécessite la configuration de Supabase.',
          needsEmailConfirmation: false,
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.fullName,
            // Le trigger `handle_new_user` filtre cette valeur sur une liste blanche.
            role: input.role,
          },
          emailRedirectTo: `${config.siteUrl}/connexion?confirme=1`,
        },
      });

      if (error) {
        return { error: translateAuthError(error), needsEmailConfirmation: false };
      }
      return { error: null, needsEmailConfirmation: !data.session };
    },
    [isDemo],
  );

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    try {
      window.localStorage.removeItem(DEMO_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id || !supabase) return;
    const nextProfile = await loadProfile(user.id);
    if (mountedRef.current) setProfile(nextProfile);
  }, [user?.id, loadProfile]);

  const updateProfile = useCallback(
    async (payload: UpdateProfilePayload): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Vous devez être connecté.' };

      const patch = {
        full_name: payload.fullName?.trim() || null,
        phone: payload.phone?.trim() || null,
        city: payload.city?.trim() || null,
        postal_code: payload.postalCode?.trim() || null,
        school: payload.school?.trim() || null,
        bio: payload.bio?.trim() || null,
      };

      if (isDemo || !supabase) {
        setProfile((current) =>
          current
            ? {
                ...current,
                ...patch,
                updated_at: new Date().toISOString(),
              }
            : current,
        );
        return { error: null };
      }

      const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
      if (error) {
        console.error('[HTI-IMMO] Mise à jour du profil impossible :', error.code);
        return { error: 'La mise à jour du profil a échoué. Vérifiez les champs puis réessayez.' };
      }
      await refreshProfile();
      return { error: null };
    },
    [user, isDemo, refreshProfile],
  );

  const requestPasswordReset = useCallback(
    async (email: string): Promise<{ error: string | null }> => {
      if (isDemo || !supabase) {
        return { error: 'La réinitialisation par e-mail nécessite la configuration de Supabase.' };
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${config.siteUrl}/connexion?reinitialisation=1`,
      });
      return { error: error ? translateAuthError(error) : null };
    },
    [isDemo],
  );

  const role: UserRole = profile?.role ?? 'student';

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      isDemo,
      role,
      isStaff: role === 'admin' || role === 'moderator',
      isOwner: role === 'owner',
      signIn,
      signUp,
      signOut,
      updateProfile,
      requestPasswordReset,
      startDemoSession,
      refreshProfile,
    }),
    [
      user,
      profile,
      loading,
      isDemo,
      role,
      signIn,
      signUp,
      signOut,
      updateProfile,
      requestPasswordReset,
      startDemoSession,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
