import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp, seedDemoSession } from '@/test/render-app';

describe('ListingFormPage', () => {
  it('refuse l’accès à un étudiant', async () => {
    seedDemoSession('student');
    renderApp('/mon-espace/annonces/nouvelle');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Accès réservé aux bailleurs/i }),
      ).toBeInTheDocument();
    });
  });

  it('affiche le formulaire complet à un bailleur', async () => {
    seedDemoSession('owner');
    renderApp('/mon-espace/annonces/nouvelle');

    expect(
      await screen.findByRole('heading', { level: 1, name: /Publier une annonce/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Titre de l’annonce/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Type de logement/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Loyer mensuel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Code postal/i)).toBeInTheDocument();
    expect(screen.getByText(/Équipements/i)).toBeInTheDocument();
  });

  it('valide les champs obligatoires avant enregistrement', async () => {
    const user = userEvent.setup();
    seedDemoSession('owner');
    renderApp('/mon-espace/annonces/nouvelle');

    await screen.findByRole('heading', { level: 1, name: /Publier une annonce/i });
    await user.click(screen.getByRole('button', { name: /Soumettre l’annonce/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Le titre doit contenir au moins 10 caractères/i),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(/La description doit contenir au moins 50 caractères/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Indiquez la ville/i)).toBeInTheDocument();
  });

  it('crée une annonce et l’affiche en attente de validation', async () => {
    const user = userEvent.setup();
    seedDemoSession('owner');
    renderApp('/mon-espace/annonces/nouvelle');

    await screen.findByRole('heading', { level: 1, name: /Publier une annonce/i });

    await user.type(
      screen.getByLabelText(/Titre de l’annonce/i),
      'Studio meublé de test proche du campus',
    );
    await user.type(
      screen.getByLabelText(/Description/i),
      'Studio de 24 m² entièrement meublé, cuisine équipée, Wi-Fi inclus. Situé à dix minutes à pied de l’université et des transports en commun.',
    );
    await user.type(screen.getByLabelText(/Surface/i), '24');
    await user.type(screen.getByLabelText(/Loyer mensuel/i), '620');
    await user.type(screen.getByLabelText(/Code postal/i), '69007');
    await user.type(screen.getByLabelText(/^Ville/i), 'Lyon');

    await user.click(screen.getByRole('button', { name: /Soumettre l’annonce/i }));

    await waitFor(() => {
      expect(screen.getByText(/En attente de validation/i)).toBeInTheDocument();
    });
    expect(
      screen.getByRole('heading', { level: 1, name: /Modifier l’annonce/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Aucune photo pour le moment/i)).toBeInTheDocument();
  });
});
