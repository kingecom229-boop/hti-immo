import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/test/render-app';

describe('ContactPage', () => {
  it('affiche les coordonnées et les avertissements de sécurité', () => {
    renderApp('/contact');

    expect(screen.getAllByText(/contact@hti-immo.fr/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Signaler une annonce suspecte/i).length).toBeGreaterThan(0);
  });

  it('valide le formulaire avant de préparer le message', async () => {
    const user = userEvent.setup();
    renderApp('/contact');

    await user.click(screen.getByRole('button', { name: /Préparer le message/i }));

    expect(await screen.findByText(/Indiquez votre nom/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Votre message doit contenir au moins 20 caractères/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Vous devez accepter le traitement de vos données/i),
    ).toBeInTheDocument();
  });

  it('prépare un message une fois le formulaire valide', async () => {
    const user = userEvent.setup();
    renderApp('/contact');

    await user.type(screen.getByLabelText(/Votre nom/i), 'Alex Martin');
    await user.type(screen.getByLabelText(/Votre e-mail/i), 'alex@example.fr');
    await user.type(
      screen.getByLabelText(/Votre message/i),
      'Bonjour, je souhaite signaler une annonce qui me semble suspecte sur le catalogue.',
    );
    await user.click(screen.getByLabelText(/J’accepte que mes données/i));
    await user.click(screen.getByRole('button', { name: /Préparer le message/i }));

    expect(await screen.findByText(/Message préparé/i)).toBeInTheDocument();
  });
});
