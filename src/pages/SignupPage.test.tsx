import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/test/render-app';

describe('SignupPage', () => {
  it('affiche le formulaire et le choix du type de compte', () => {
    renderApp('/inscription');

    expect(screen.getByRole('heading', { level: 1, name: 'Créer un compte' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom complet/i)).toBeInTheDocument();
    expect(screen.getByText('Étudiant')).toBeInTheDocument();
    expect(screen.getByText('Bailleur')).toBeInTheDocument();
  });

  it('valide les champs côté client avant tout envoi', async () => {
    const user = userEvent.setup();
    renderApp('/inscription');

    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }));

    await waitFor(() => {
      expect(screen.getByText(/Indiquez votre nom complet/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Adresse e-mail/i)).toHaveAttribute('aria-invalid', 'true');
      expect(
        screen.getAllByText(/mot de passe doit contenir au moins 10 caractères/i).length,
      ).toBeGreaterThan(0);
      expect(screen.getByText(/accepter les Conditions Générales/i)).toBeInTheDocument();
    });
  });

  it('refuse un mot de passe sans chiffre', async () => {
    const user = userEvent.setup();
    renderApp('/inscription');

    await user.type(screen.getByLabelText(/Nom complet/i), 'Alex Martin');
    await user.type(screen.getByLabelText(/Adresse e-mail/i), 'alex@example.fr');
    await user.type(screen.getByLabelText(/Mot de passe/i), 'motdepassesanschiffre');
    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }));

    await waitFor(() => {
      expect(screen.getByText(/au moins un chiffre/i)).toBeInTheDocument();
    });
  });

  it('explique clairement que l’inscription réelle nécessite Supabase en mode démo', async () => {
    const user = userEvent.setup();
    renderApp('/inscription');

    expect(screen.getAllByText(/Mode démonstration actif/i).length).toBeGreaterThan(0);

    await user.type(screen.getByLabelText(/Nom complet/i), 'Alex Martin');
    await user.type(screen.getByLabelText(/Adresse e-mail/i), 'alex@example.fr');
    await user.type(screen.getByLabelText(/Mot de passe/i), 'MotDePasse2026');
    await user.click(screen.getByLabelText(/J’accepte les/i));
    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }));

    await waitFor(() => {
      expect(
        screen.getAllByText(/la création de compte réelle nécessite la configuration de Supabase/i)
          .length,
      ).toBeGreaterThan(0);
    });
  });
});
