import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/test/render-app';

describe('PasswordResetPage', () => {
  it('affiche le formulaire et explique la procédure', () => {
    renderApp('/reinitialiser-mot-de-passe');

    expect(
      screen.getByRole('heading', { level: 1, name: /Mot de passe oublié/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Adresse e-mail/i)).toBeInTheDocument();
  });

  it('refuse une adresse e-mail invalide', async () => {
    const user = userEvent.setup();
    renderApp('/reinitialiser-mot-de-passe');

    await user.type(screen.getByLabelText(/Adresse e-mail/i), 'pas-une-adresse');
    await user.click(screen.getByRole('button', { name: /Recevoir le lien/i }));

    expect(await screen.findByText(/Adresse e-mail invalide/i)).toBeInTheDocument();
  });

  it('signale que l’envoi nécessite Supabase en mode démonstration', async () => {
    const user = userEvent.setup();
    renderApp('/reinitialiser-mot-de-passe');

    expect(
      screen.getByText(/l’envoi d’e-mails nécessite la configuration de Supabase/i),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Adresse e-mail/i), 'etudiant@example.fr');
    await user.click(screen.getByRole('button', { name: /Recevoir le lien/i }));

    expect(
      await screen.findByText(
        /La réinitialisation par e-mail nécessite la configuration de Supabase/i,
      ),
    ).toBeInTheDocument();
  });
});
