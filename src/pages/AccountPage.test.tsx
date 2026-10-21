import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderApp, seedDemoSession } from '@/test/render-app';

describe('AccountPage', () => {
  it('affiche le profil d’un étudiant connecté', async () => {
    seedDemoSession('student');
    renderApp('/mon-espace');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Mon espace' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Alex Étudiant/)).toBeInTheDocument();
    expect(screen.getByText('Étudiant')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Profil/i })).toBeInTheDocument();
  });

  it('affiche les onglets bailleur et les annonces de démonstration', async () => {
    seedDemoSession('owner');
    renderApp('/mon-espace');

    expect(await screen.findByRole('tab', { name: /Mes annonces/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Demandes reçues/i })).toBeInTheDocument();
    });
    expect(screen.getByText('Bailleur')).toBeInTheDocument();
  });

  it('valide le formulaire de profil avant enregistrement', async () => {
    seedDemoSession('student');
    renderApp('/mon-espace');

    const phone = await screen.findByLabelText(/Téléphone/i);
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    await user.clear(phone);
    await user.type(phone, '1234');
    await user.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => {
      expect(screen.getByText(/Numéro de téléphone français invalide/i)).toBeInTheDocument();
    });
  });

  it('propose de réinitialiser les données de démonstration', async () => {
    seedDemoSession('student');
    renderApp('/mon-espace');

    expect(
      await screen.findByRole('button', { name: /Réinitialiser les données de démonstration/i }),
    ).toBeInTheDocument();
  });
});
