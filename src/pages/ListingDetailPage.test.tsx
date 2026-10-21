import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderApp } from '@/test/render-app';
import { DEMO_LISTINGS } from '@/data/demo-listings';

const listing = DEMO_LISTINGS[0]!;

describe('ListingDetailPage', () => {
  it('affiche le détail complet d’une annonce', async () => {
    renderApp(`/logements/${listing.id}`);

    expect(
      await screen.findByRole('heading', { level: 1, name: listing.title }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/620/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Caractéristiques/i)).toBeInTheDocument();
    expect(screen.getByText(/Équipements et services/i)).toBeInTheDocument();
    expect(screen.getByText(/Avant de vous engager/i)).toBeInTheDocument();
    expect(screen.getAllByText(listing.city).length).toBeGreaterThan(0);
  });

  it('signale explicitement une annonce de démonstration et désactive le formulaire', async () => {
    renderApp(`/logements/${listing.id}`);

    expect((await screen.findAllByText(/Annonce de démonstration/i)).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Formulaire désactivé sur une annonce de démonstration/i),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Votre message/i)).not.toBeInTheDocument();
  });

  it('affiche un récapitulatif financier', async () => {
    renderApp(`/logements/${listing.id}`);

    expect(await screen.findByText(/Récapitulatif/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Loyer mensuel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Dépôt de garantie/i).length).toBeGreaterThan(0);
  });

  it('affiche une page d’erreur explicite pour une annonce inexistante', async () => {
    renderApp('/logements/annonce-qui-nexiste-pas');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Annonce introuvable/i })).toBeInTheDocument();
    });
  });

  it('propose d’ajouter l’annonce aux favoris', async () => {
    renderApp(`/logements/${listing.id}`);
    await screen.findByRole('heading', { level: 1, name: listing.title });

    expect(screen.getByRole('button', { name: /Ajouter « .* » aux favoris/ })).toBeInTheDocument();
  });
});
