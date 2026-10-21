import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/auth-context';
import { PageLoader } from '@/components/ui/Feedback';

/**
 * Protège une route côté client.
 *
 * ⚠️ Ce contrôle est un confort d'interface : la véritable autorisation est
 * appliquée par les politiques RLS de PostgreSQL. Un utilisateur qui
 * contournerait cette garde n'obtiendrait aucune donnée supplémentaire.
 */
export function ProtectedRoute({ staffOnly = false }: { staffOnly?: boolean }) {
  const { user, loading, isStaff } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/connexion?suivant=${redirect}`} replace />;
  }

  if (staffOnly && !isStaff) {
    return (
      <Navigate to="/acces-refuse" replace state={{ from: location.pathname, reason: 'staff' }} />
    );
  }

  return <Outlet />;
}
