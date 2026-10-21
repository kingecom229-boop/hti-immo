import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '@/auth/auth-context';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { signInSchema, validateWithSchema } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';

export function LoginPage() {
  useDocumentTitle('Connexion');
  const { signIn, startDemoSession, isDemo, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nextPath = searchParams.get('suivant') ?? '/mon-espace';
  const confirmed = searchParams.get('confirme') === '1';
  const resetRequested = searchParams.get('reinitialisation') === '1';

  if (user) {
    return (
      <div className="container-page max-w-md py-16">
        <Alert tone="success" title="Vous êtes déjà connecté">
          <Link to="/mon-espace" className="font-semibold underline underline-offset-2">
            Accéder à mon espace
          </Link>
        </Alert>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGlobalError(null);

    const validation = validateWithSchema(signInSchema, { email, password });
    if (!validation.success || !validation.data) {
      setErrors(validation.errors ?? {});
      return;
    }
    setErrors({});

    setSubmitting(true);
    const result = await signIn(validation.data);
    setSubmitting(false);

    if (result.error) {
      setGlobalError(result.error);
      return;
    }
    navigate(nextPath.startsWith('/') ? nextPath : '/mon-espace', { replace: true });
  };

  return (
    <div className="container-page grid max-w-5xl gap-10 py-14 lg:grid-cols-2 lg:items-center">
      <div className="space-y-4">
        <h1 className="font-display text-ink-950 text-3xl font-bold">Connexion</h1>
        <p className="text-ink-600 text-sm leading-relaxed">
          Retrouvez vos favoris, suivez vos demandes de logement et gérez vos annonces.
        </p>

        {confirmed ? (
          <Alert tone="success" title="Adresse confirmée">
            Votre compte est désormais actif. Vous pouvez vous connecter.
          </Alert>
        ) : null}
        {resetRequested ? (
          <Alert tone="info" title="Réinitialisation">
            Si un compte existe pour cette adresse, un e-mail de réinitialisation vous a été envoyé.
          </Alert>
        ) : null}

        {isDemo ? (
          <Alert tone="warning" title="Mode démonstration actif">
            <p>
              Supabase n’est pas configuré : l’authentification réelle est désactivée. Vous pouvez
              explorer l’application avec un profil local de démonstration.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="accent" size="sm" onClick={() => startDemoSession('student')}>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Étudiant (démo)
              </Button>
              <Button variant="secondary" size="sm" onClick={() => startDemoSession('owner')}>
                Bailleur (démo)
              </Button>
              <Button variant="secondary" size="sm" onClick={() => startDemoSession('admin')}>
                Administrateur (démo)
              </Button>
            </div>
          </Alert>
        ) : null}
      </div>

      <div className="card p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {globalError ? <Alert tone="error">{globalError}</Alert> : null}

          <TextField
            label="Adresse e-mail"
            type="email"
            required
            autoComplete="email"
            value={email}
            error={errors.email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <TextField
            label="Mot de passe"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            error={errors.password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <Button
            type="submit"
            fullWidth
            loading={submitting}
            icon={<LogIn className="h-4 w-4" aria-hidden="true" />}
          >
            Se connecter
          </Button>
        </form>

        <div className="border-ink-100 text-ink-600 mt-6 space-y-2 border-t pt-4 text-sm">
          <p>
            Pas encore de compte ?{' '}
            <Link
              to="/inscription"
              className="text-ink-900 font-semibold underline underline-offset-2"
            >
              Créer un compte
            </Link>
          </p>
          <p>
            Mot de passe oublié ?{' '}
            <Link
              to="/reinitialiser-mot-de-passe"
              className="text-ink-900 font-semibold underline underline-offset-2"
            >
              Recevoir un lien
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
