import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderApp, seedDemoSession } from '@/test/render-app';

describe('AdminPage', () => {
  it('refuse l’accès à un étudiant', async () => {
    seedDemoSession('student');
    renderApp('/admin');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Accès refusé/i })).toBeInTheDocument();
    });
  });

  it('affiche le tableau de bord à un administrateur', async () => {
    seedDemoSession('admin');
    renderApp('/admin');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Administration' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Annonces à valider/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Demandes de logement/i).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Toutes les annonces/i)).length).toBeGreaterThan(0);
  });

  it('signale le caractère simulé des actions en mode démonstration', async () => {
    seedDemoSession('admin');
    renderApp('/admin');

    expect(
      await screen.findByText(/Les actions de modération sont simulées localement/i),
    ).toBeInTheDocument();
  });
});
