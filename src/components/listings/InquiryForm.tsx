import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import { useAuth } from '@/auth/auth-context';
import { createInquiry } from '@/lib/inquiries-api';
import { toUserMessage } from '@/lib/api-error';
import { inquirySchema, validateWithSchema, type InquiryInput } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { TextField, TextAreaField, CheckboxField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';

const INITIAL: InquiryInput = {
  senderName: '',
  senderEmail: '',
  senderPhone: '',
  message: '',
  consent: false as unknown as true,
};

export function InquiryForm({
  listingId,
  listingTitle,
}: {
  listingId: string;
  listingTitle: string;
}) {
  const { user, profile, isDemo } = useAuth();
  const [values, setValues] = useState<InquiryInput>({
    ...INITIAL,
    senderName: profile?.full_name ?? '',
    senderEmail: user?.email ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [globalError, setGlobalError] = useState<string | null>(null);

  const setField = <K extends keyof InquiryInput>(key: K, value: InquiryInput[K]) => {
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

    const validation = validateWithSchema(inquirySchema, values);
    if (!validation.success || !validation.data) {
      setErrors(validation.errors ?? {});
      return;
    }

    setStatus('sending');
    try {
      await createInquiry(listingId, validation.data, user?.id ?? null);
      setStatus('sent');
    } catch (cause) {
      setStatus('idle');
      setGlobalError(toUserMessage(cause, 'L’envoi de la demande a échoué. Réessayez.'));
    }
  };

  if (status === 'sent') {
    return (
      <Alert tone="success" title="Demande envoyée">
        <p>
          Votre demande a bien été enregistrée pour l’annonce « {listingTitle} ». Le bailleur pourra
          vous répondre à l’adresse indiquée.
        </p>
        {isDemo ? (
          <p className="mt-2 text-xs">
            Mode démonstration : la demande est conservée localement dans votre navigateur.
          </p>
        ) : null}
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-busy={status === 'sending'}>
      {globalError ? <Alert tone="error">{globalError}</Alert> : null}

      <TextField
        label="Votre nom"
        required
        autoComplete="name"
        value={values.senderName}
        error={errors.senderName}
        onChange={(event) => setField('senderName', event.target.value)}
        maxLength={80}
      />

      <TextField
        label="Votre e-mail"
        type="email"
        required
        autoComplete="email"
        value={values.senderEmail}
        error={errors.senderEmail}
        onChange={(event) => setField('senderEmail', event.target.value)}
        maxLength={254}
      />

      <TextField
        label="Téléphone (facultatif)"
        type="tel"
        autoComplete="tel"
        placeholder="06 12 34 56 78"
        value={values.senderPhone ?? ''}
        error={errors.senderPhone}
        onChange={(event) => setField('senderPhone', event.target.value)}
      />

      <TextAreaField
        label="Votre message"
        required
        rows={5}
        placeholder="Présentez-vous : votre formation, vos dates souhaitées, vos questions sur le logement…"
        value={values.message}
        error={errors.message}
        hint="20 caractères minimum. Ne communiquez jamais d’informations bancaires."
        onChange={(event) => setField('message', event.target.value)}
        maxLength={2000}
      />

      <CheckboxField
        label={
          <>
            J’accepte que mes coordonnées soient transmises au bailleur afin de traiter ma demande.
            Voir la{' '}
            <Link to="/confidentialite" className="underline underline-offset-2">
              politique de confidentialité
            </Link>
            .
          </>
        }
        checked={values.consent === true}
        onChange={(checked) => setField('consent', checked as unknown as true)}
        error={errors.consent}
      />

      <Button
        type="submit"
        fullWidth
        loading={status === 'sending'}
        icon={<Send className="h-4 w-4" aria-hidden="true" />}
      >
        Envoyer ma demande
      </Button>

      <p className="text-ink-500 text-xs leading-relaxed">
        HTI-IMMO transmet votre demande au bailleur de l’annonce. Nous ne demandons jamais de
        paiement, de caution ni de pièce d’identité avant une visite.
      </p>
    </form>
  );
}
