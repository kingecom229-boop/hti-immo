import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';
import { DEMO_LISTINGS } from './data/demo-listings';

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('Application — parcours publics (mode démonstration)', () => {
  it('affiche la page d’accueil et le bandeau de démonstration', () => {
    renderApp();
    expect(
      screen.getByRole('heading', { level: 1, name: /Votre logement étudiant/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Mode démonstration/i)).toBeInTheDocument();
  });

  it('affiche des annonces récentes issues du jeu de démonstration', async () => {
    renderApp();
    const heading = await screen.findByRole('heading', { name: /Annonces récentes/i });
    expect(heading).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText(/\[EXEMPLE\]/).length).toBeGreaterThan(0);
    });
  });

  it('navigue vers le catalogue depuis le menu', async () => {
    const user = userEvent.setup();
    renderApp();

    const nav = screen.getByRole('navigation', { name: 'Navigation principale' });
    await user.click(within(nav).getByRole('link', { name: 'Annonces' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: /Trouvez votre logement étudiant/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(new RegExp(`${DEMO_LISTINGS.length} annonces`))).toBeInTheDocument();
    });
  });

  it('filtre le catalogue par ville via l’URL', async () => {
    renderApp('/logements?ville=Lyon');

    expect(
      await screen.findByRole('heading', { level: 1, name: /Logements étudiants à Lyon/i }),
    ).toBeInTheDocument();
  });

  it('affiche une page 404 explicite pour une URL inconnue', () => {
    renderApp('/page-qui-nexiste-pas');
    expect(screen.getByRole('heading', { name: /Cette page n’existe pas/i })).toBeInTheDocument();
  });

  it('affiche la page de contact avec ses informations', () => {
    renderApp('/contact');
    expect(screen.getByRole('heading', { level: 1, name: 'Contact' })).toBeInTheDocument();
    expect(screen.getAllByText(/contact@hti-immo.fr/).length).toBeGreaterThan(0);
  });

  it('affiche les mentions légales et les compléments à fournir', () => {
    renderApp('/mentions-legales');
    expect(
      screen.getByRole('heading', { level: 1, name: /Mentions légales/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/À COMPLÉTER/i).length).toBeGreaterThan(0);
  });

  it('propose le mode démonstration sur la page de connexion', () => {
    renderApp('/connexion');
    expect(screen.getByRole('button', { name: /Étudiant \(démo\)/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bailleur \(démo\)/ })).toBeInTheDocument();
  });

  it('ouvre une session de démonstration et affiche l’espace personnel', async () => {
    const user = userEvent.setup();
    renderApp('/connexion');

    await user.click(screen.getByRole('button', { name: /Étudiant \(démo\)/ }));

    await waitFor(() => {
      // Le lien apparaît dans l'en-tête (bureau et menu mobile).
      expect(
        screen.getAllByRole('link', { name: /Bonjour Alex|Mon espace/i }).length,
      ).toBeGreaterThan(0);
    });

    await user.click(screen.getAllByRole('link', { name: /Bonjour Alex|Mon espace/i })[0]!);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Mon espace' }),
    ).toBeInTheDocument();
  });

  it('protège la route /mon-espace pour un visiteur', async () => {
    renderApp('/mon-espace');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Connexion' })).toBeInTheDocument();
    });
  });
});
