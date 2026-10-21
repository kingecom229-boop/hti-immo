import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Send } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { config } from '@/lib/config';
import { contactSchema, validateWithSchema } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { TextField, TextAreaField, CheckboxField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';

const SUBJECTS = [
  'Question sur une annonce',
  'Problème technique',
  'Signaler une annonce suspecte',
  'Devenir bailleur',
  'Protection des données',
  'Autre demande',
];

export function ContactPage() {
  useDocumentTitle(
    'Contact',
    'Contactez l’équipe HTI-IMMO : questions sur une annonce, signalement, assistance ou demande relative à vos données personnelles.',
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0] ?? '');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [opened, setOpened] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateWithSchema(contactSchema, {
      name,
      email,
      subject,
      message,
      consent,
    });

    if (!validation.success || !validation.data) {
      setErrors(validation.errors ?? {});
      return;
    }
    setErrors({});

    const body = [
      `Nom : ${validation.data.name}`,
      `E-mail : ${validation.data.email}`,
      '',
      validation.data.message,
    ].join('\n');

    const mailto = `mailto:${config.contactEmail}?subject=${encodeURIComponent(
      `[HTI-IMMO] ${validation.data.subject}`,
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
    setOpened(true);
  };

  return (
    <div className="container-page grid max-w-5xl gap-10 py-12 lg:grid-cols-[1fr_1.15fr]">
      <div className="space-y-5">
        <div>
          <p className="text-ink-500 text-xs font-bold tracking-wider uppercase">Nous écrire</p>
          <h1 className="font-display text-ink-950 mt-2 text-3xl font-bold">Contact</h1>
          <p className="text-ink-600 mt-3 text-sm leading-relaxed">
            Une question sur une annonce, un signalement ou une demande relative à vos données
            personnelles ? Écrivez-nous, nous répondons sous deux jours ouvrés.
          </p>
        </div>

        <ul className="space-y-3 text-sm">
          <li className="border-ink-100 flex items-start gap-3 rounded-xl border bg-white p-4">
            <Mail className="text-ink-600 mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-ink-950 font-semibold">E-mail</p>
              <a
                href={`mailto:${config.contactEmail}`}
                className="text-ink-700 break-all underline underline-offset-2"
              >
                {config.contactEmail}
              </a>
            </div>
          </li>
          <li className="border-ink-100 flex items-start gap-3 rounded-xl border bg-white p-4">
            <MapPin className="text-ink-600 mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-ink-950 font-semibold">Zone couverte</p>
              <p className="text-ink-600">France métropolitaine</p>
            </div>
          </li>
        </ul>

        <Alert tone="warning" title="Signaler une annonce suspecte">
          Si un bailleur vous demande un paiement avant visite, signalez-le immédiatement avec le
          lien de l’annonce. Ne transférez jamais d’argent ni de copie de pièce d’identité.
        </Alert>

        <p className="text-ink-600 text-sm">
          Consultez aussi{' '}
          <Link to="/comment-ca-marche" className="font-semibold underline underline-offset-2">
            le fonctionnement de la plateforme
          </Link>{' '}
          ou la{' '}
          <Link to="/confidentialite" className="font-semibold underline underline-offset-2">
            politique de confidentialité
          </Link>
          .
        </p>
      </div>

      <div className="card p-6 sm:p-8">
        <h2 className="font-display text-ink-950 text-lg font-semibold">Formulaire de contact</h2>
        <p className="text-ink-500 mt-1 text-xs">
          Ce formulaire ouvre votre logiciel de messagerie avec un message prérempli : aucune donnée
          n’est stockée par nos serveurs.
        </p>

        {opened ? (
          <Alert tone="success" className="mt-4" title="Message préparé">
            Votre client de messagerie devrait s’ouvrir. Si ce n’est pas le cas, écrivez directement
            à{' '}
            <a className="underline underline-offset-2" href={`mailto:${config.contactEmail}`}>
              {config.contactEmail}
            </a>
            .
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
          <TextField
            label="Votre nom"
            required
            autoComplete="name"
            value={name}
            error={errors.name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
          />

          <TextField
            label="Votre e-mail"
            type="email"
            required
            autoComplete="email"
            value={email}
            error={errors.email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={254}
          />

          <div>
            <label className="label" htmlFor="contact-subject">
              Objet
              <span className="ml-1 text-red-700" aria-hidden="true">
                *
              </span>
            </label>
            <select
              id="contact-subject"
              className="input"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            >
              {SUBJECTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <TextAreaField
            label="Votre message"
            required
            rows={6}
            value={message}
            error={errors.message}
            hint="20 caractères minimum. N’incluez pas de données bancaires."
            onChange={(event) => setMessage(event.target.value)}
            maxLength={2000}
          />

          <CheckboxField
            label={
              <>
                J’accepte que mes données soient utilisées pour traiter ma demande, conformément à
                la{' '}
                <Link to="/confidentialite" className="underline underline-offset-2">
                  politique de confidentialité
                </Link>
                .
              </>
            }
            checked={consent}
            onChange={setConsent}
            error={errors.consent}
          />

          <Button type="submit" fullWidth icon={<Send className="h-4 w-4" aria-hidden="true" />}>
            Préparer le message
          </Button>
        </form>
      </div>
    </div>
  );
}
