import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/auth/auth-context';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { signUpSchema, validateWithSchema, type SignUpInput } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { TextField, CheckboxField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';

type AccountKind = 'student' | 'owner';

const INITIAL = {
  fullName: '',
  email: '',
  password: '',
  role: 'student' as AccountKind,
  acceptTerms: false,
};

export function SignupPage() {
  useDocumentTitle(
    'Créer un compte',
    'Créez votre compte HTI-IMMO pour enregistrer vos favoris, suivre vos demandes de logement ou publier une annonce.',
  );

  const { signUp, isDemo, startDemoSession } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const setField = <K extends keyof typeof INITIAL>(key: K, value: (typeof INITIAL)[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGlobalError(null);

    const validation = validateWithSchema(signUpSchema, values);
    if (!validation.success || !validation.data) {
      setErrors(validation.errors ?? {});
      return;
    }
    setErrors({});

    setSubmitting(true);
    const result = await signUp(validation.data as SignUpInput);
    setSubmitting(false);

    if (result.error) {
      setGlobalError(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      setNeedsConfirmation(true);
      return;
    }

    navigate('/mon-espace', { replace: true });
  };

  if (needsConfirmation) {
    return (
      <div className="container-page max-w-xl py-16">
        <Alert tone="success" title="Vérifiez votre boîte e-mail">
          <p>
            Un e-mail de confirmation vient d’être envoyé à <strong>{values.email}</strong>. Cliquez
            sur le lien qu’il contient pour activer votre compte, puis connectez-vous.
          </p>
          <p className="mt-2 text-xs">
            Pensez à vérifier vos courriers indésirables. Le lien expire au bout de 24 heures.
          </p>
        </Alert>
        <p className="mt-6 text-sm">
          <Link to="/connexion" className="font-semibold underline underline-offset-2">
            Aller à la page de connexion
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container-page grid max-w-5xl gap-10 py-14 lg:grid-cols-[1fr_1.1fr] lg:items-start">
      <div className="space-y-4">
        <h1 className="font-display text-ink-950 text-3xl font-bold">Créer un compte</h1>
        <p className="text-ink-600 text-sm leading-relaxed">
          Un compte gratuit pour enregistrer vos favoris, envoyer des demandes de logement et, si
          vous êtes bailleur, publier vos annonces.
        </p>

        <ul className="text-ink-700 space-y-2 text-sm">
          <li>• Recherche illimitée dans le catalogue</li>
          <li>• Favoris synchronisés sur tous vos appareils</li>
          <li>• Suivi des demandes envoyées</li>
          <li>• Publication d’annonces soumise à modération</li>
        </ul>

        {isDemo ? (
          <Alert tone="warning" title="Mode démonstration actif">
            <p>
              La création de compte réelle nécessite la configuration de Supabase. Vous pouvez
              explorer les parcours avec un profil local.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="accent" size="sm" onClick={() => startDemoSession('student')}>
                Étudiant (démo)
              </Button>
              <Button variant="secondary" size="sm" onClick={() => startDemoSession('owner')}>
                Bailleur (démo)
              </Button>
            </div>
          </Alert>
        ) : null}

        <p className="text-ink-600 text-sm">
          Déjà inscrit ?{' '}
          <Link to="/connexion" className="text-ink-900 font-semibold underline underline-offset-2">
            Se connecter
          </Link>
        </p>
      </div>

      <div className="card p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {globalError ? <Alert tone="error">{globalError}</Alert> : null}

          <fieldset>
            <legend className="label">Je suis…</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                {
                  value: 'student' as const,
                  title: 'Étudiant',
                  description: 'Je cherche un logement',
                },
                {
                  value: 'owner' as const,
                  title: 'Bailleur',
                  description: 'Je propose un logement',
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-xl border p-3 transition ${
                    values.role === option.value
                      ? 'border-ink-900 bg-ink-50 ring-ink-900 ring-1'
                      : 'border-ink-200 hover:border-ink-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={values.role === option.value}
                    onChange={() => setField('role', option.value)}
                    className="sr-only"
                  />
                  <span className="text-ink-950 block text-sm font-semibold">{option.title}</span>
                  <span className="text-ink-600 mt-0.5 block text-xs">{option.description}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <TextField
            label="Nom complet"
            required
            autoComplete="name"
            value={values.fullName}
            error={errors.fullName}
            onChange={(event) => setField('fullName', event.target.value)}
            maxLength={80}
          />

          <TextField
            label="Adresse e-mail"
            type="email"
            required
            autoComplete="email"
            value={values.email}
            error={errors.email}
            onChange={(event) => setField('email', event.target.value)}
            maxLength={254}
          />

          <TextField
            label="Mot de passe"
            type="password"
            required
            autoComplete="new-password"
            value={values.password}
            error={errors.password}
            hint="10 caractères minimum, avec au moins une lettre et un chiffre."
            onChange={(event) => setField('password', event.target.value)}
          />

          <CheckboxField
            label={
              <>
                J’accepte les{' '}
                <Link to="/cgu" className="underline underline-offset-2">
                  conditions générales d’utilisation
                </Link>{' '}
                et la{' '}
                <Link to="/confidentialite" className="underline underline-offset-2">
                  politique de confidentialité
                </Link>
                .
              </>
            }
            checked={values.acceptTerms}
            onChange={(checked) => setField('acceptTerms', checked)}
            error={errors.acceptTerms}
          />

          <Button
            type="submit"
            fullWidth
            loading={submitting}
            icon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
          >
            Créer mon compte
          </Button>
        </form>
      </div>
    </div>
  );
}
