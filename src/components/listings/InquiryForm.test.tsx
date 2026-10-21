import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthProvider';
import { InquiryForm } from './InquiryForm';

function renderForm() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <InquiryForm listingId="demo-listing-1" listingTitle="Studio de test" />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('InquiryForm', () => {
  it('affiche les champs nécessaires et l’avertissement de sécurité', () => {
    renderForm();

    expect(screen.getByLabelText(/Votre nom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Votre e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Votre message/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Nous ne demandons jamais de paiement, de caution/i),
    ).toBeInTheDocument();
  });

  it('valide les champs obligatoires', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /Envoyer ma demande/i }));

    await waitFor(() => {
      expect(screen.getByText(/Indiquez votre nom/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Votre message doit contenir au moins 20 caractères/i),
    ).toBeInTheDocument();
  });

  it('refuse un message trop court et un consentement absent', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/Votre nom/i), 'Alex Martin');
    await user.type(screen.getByLabelText(/Votre e-mail/i), 'alex@example.fr');
    await user.type(screen.getByLabelText(/Votre message/i), 'Bonjour');
    await user.click(screen.getByRole('button', { name: /Envoyer ma demande/i }));

    await waitFor(() => {
      expect(screen.getByText(/au moins 20 caractères/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Vous devez accepter le traitement/i)).toBeInTheDocument();
  });

  it('enregistre la demande et confirme l’envoi', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/Votre nom/i), 'Alex Martin');
    await user.type(screen.getByLabelText(/Votre e-mail/i), 'alex@example.fr');
    await user.type(
      screen.getByLabelText(/Votre message/i),
      'Bonjour, je suis étudiant en deuxième année et je souhaite visiter ce logement rapidement.',
    );
    await user.click(screen.getByLabelText(/J’accepte que mes coordonnées/i));
    await user.click(screen.getByRole('button', { name: /Envoyer ma demande/i }));

    expect(await screen.findByText(/Demande envoyée/i)).toBeInTheDocument();
    expect(window.localStorage.getItem('hti-immo-demo-inquiries')).toContain('alex@example.fr');
  });
});
