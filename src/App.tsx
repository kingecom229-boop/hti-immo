import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { FavoritesProvider } from '@/favorites/FavoritesProvider';
import { HomePage } from '@/pages/HomePage';
import { ListingsPage } from '@/pages/ListingsPage';
import { ListingDetailPage } from '@/pages/ListingDetailPage';
import { HowItWorksPage } from '@/pages/HowItWorksPage';
import { ContactPage } from '@/pages/ContactPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { PasswordResetPage } from '@/pages/PasswordResetPage';
import { AccountPage } from '@/pages/AccountPage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { ListingFormPage } from '@/pages/ListingFormPage';
import { AdminPage } from '@/pages/AdminPage';
import { AccessDeniedPage } from '@/pages/AccessDeniedPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { MentionsLegalesPage } from '@/pages/legal/MentionsLegalesPage';
import { ConfidentialitePage } from '@/pages/legal/ConfidentialitePage';
import { CookiesPage } from '@/pages/legal/CookiesPage';
import { CguPage } from '@/pages/legal/CguPage';

export default function App() {
  return (
    <FavoritesProvider>
      <Routes>
        <Route element={<Layout />}>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/logements" element={<ListingsPage />} />
          <Route path="/logements/:id" element={<ListingDetailPage />} />
          <Route path="/comment-ca-marche" element={<HowItWorksPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Authentification */}
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<SignupPage />} />
          <Route path="/reinitialiser-mot-de-passe" element={<PasswordResetPage />} />

          {/* Espace connecté */}
          <Route element={<ProtectedRoute />}>
            <Route path="/mon-espace" element={<AccountPage />} />
            <Route path="/favoris" element={<FavoritesPage />} />
            <Route path="/mon-espace/annonces/nouvelle" element={<ListingFormPage />} />
            <Route path="/mon-espace/annonces/:id/modifier" element={<ListingFormPage />} />
          </Route>

          {/* Espace équipe */}
          <Route element={<ProtectedRoute staffOnly />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          {/* Informations légales */}
          <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
          <Route path="/confidentialite" element={<ConfidentialitePage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="/cgu" element={<CguPage />} />

          <Route path="/acces-refuse" element={<AccessDeniedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </FavoritesProvider>
  );
}
