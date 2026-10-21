import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '@/auth/auth-context';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { emailSchema } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';

export function PasswordResetPage() {
  useDocumentTitle('Réinitialiser mon mot de passe');
  const { requestPasswordReset, isDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGlobalError(null);

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Adresse e-mail invalide.');
      return;
    }
    setError(undefined);

    setSubmitting(true);
    const result = await requestPasswordReset(parsed.data);
    setSubmitting(false);

    if (result.error) {
      setGlobalError(result.error);
      return;
    }
    setSent(true);
  };

  return (
    <div className="container-page max-w-md py-16">
      <h1 className="font-display text-ink-950 text-3xl font-bold">Mot de passe oublié</h1>
      <p className="text-ink-600 mt-2 text-sm leading-relaxed">
        Indiquez l’adresse e-mail associée à votre compte. Si un compte existe, vous recevrez un
        lien de réinitialisation valable 24 heures.
      </p>

      <div className="card mt-6 p-6">
        {sent ? (
          <Alert tone="success" title="Demande envoyée">
            Consultez votre boîte de réception (et vos courriers indésirables). Le lien de
            réinitialisation expire au bout de 24 heures.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {globalError ? <Alert tone="error">{globalError}</Alert> : null}
            {isDemo ? (
              <Alert tone="warning">
                Le mode démonstration est actif : l’envoi d’e-mails nécessite la configuration de
                Supabase.
              </Alert>
            ) : null}

            <TextField
              label="Adresse e-mail"
              type="email"
              required
              autoComplete="email"
              value={email}
              error={error}
              onChange={(event) => setEmail(event.target.value)}
            />

            <Button
              type="submit"
              fullWidth
              loading={submitting}
              icon={<Mail className="h-4 w-4" aria-hidden="true" />}
            >
              Recevoir le lien
            </Button>
          </form>
        )}
      </div>

      <p className="mt-6 text-sm">
        <Link to="/connexion" className="font-semibold underline underline-offset-2">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
