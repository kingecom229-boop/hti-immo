import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthProvider';
import { FavoritesProvider } from '@/favorites/FavoritesProvider';
import { DEMO_LISTINGS } from '@/data/demo-listings';
import { ListingCard } from './ListingCard';

function renderCard(listing = DEMO_LISTINGS[0]!) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <FavoritesProvider>
          <ListingCard listing={listing} />
        </FavoritesProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ListingCard', () => {
  it('affiche le titre, le loyer et la ville de l’annonce', () => {
    const listing = DEMO_LISTINGS[0]!;
    renderCard(listing);

    expect(screen.getByRole('heading', { name: listing.title })).toBeInTheDocument();
    expect(screen.getByText(/620/)).toBeInTheDocument();
    expect(screen.getByText(listing.city)).toBeInTheDocument();
    expect(screen.getByText(`(${listing.postal_code})`)).toBeInTheDocument();
  });

  it('signale explicitement une annonce de démonstration', () => {
    renderCard();
    expect(screen.getByText('Exemple')).toBeInTheDocument();
  });

  it('ne signale pas « Exemple » sur une annonce réelle', () => {
    renderCard({ ...DEMO_LISTINGS[0]!, is_demo: false, id: 'reelle' });
    expect(screen.queryByText('Exemple')).not.toBeInTheDocument();
  });

  it('pointe vers la page de détail', () => {
    const listing = DEMO_LISTINGS[0]!;
    renderCard(listing);
    const links = screen.getAllByRole('link');
    expect(links.some((link) => link.getAttribute('href') === `/logements/${listing.id}`)).toBe(
      true,
    );
  });

  it('demande la connexion lorsqu’un visiteur tente d’ajouter un favori', async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('button', { name: /Ajouter « .* » aux favoris/ }));

    await waitFor(() => {
      expect(
        screen.getByText(/Connectez-vous pour enregistrer une annonce dans vos favoris/),
      ).toBeInTheDocument();
    });
  });

  it('affiche les équipements principaux, limités à trois', () => {
    renderCard(DEMO_LISTINGS[3]!);
    // L'annonce parisienne possède 5 équipements : 3 sont affichés + un compteur.
    expect(screen.getByText('Wi-Fi inclus')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });
});
