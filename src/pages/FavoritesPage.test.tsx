import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderApp, seedDemoSession } from '@/test/render-app';
import { DEMO_LISTINGS } from '@/data/demo-listings';

describe('FavoritesPage', () => {
  it('affiche un état vide lorsqu’aucune annonce n’est enregistrée', async () => {
    seedDemoSession('student');
    renderApp('/favoris');

    expect(await screen.findByText(/Aucun favori pour le moment/i)).toBeInTheDocument();
  });

  it('affiche les annonces enregistrées localement', async () => {
    const profile = seedDemoSession('student');
    window.localStorage.setItem(
      'hti-immo-demo-favorites',
      JSON.stringify(
        DEMO_LISTINGS.slice(0, 2).map((listing) => ({
          id: `fav-${listing.id}`,
          user_id: profile.id,
          listing_id: listing.id,
          created_at: new Date().toISOString(),
        })),
      ),
    );

    renderApp('/favoris');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: DEMO_LISTINGS[0]!.title })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: DEMO_LISTINGS[1]!.title })).toBeInTheDocument();
    expect(screen.queryByText(/Aucun favori pour le moment/i)).not.toBeInTheDocument();
  });
});
