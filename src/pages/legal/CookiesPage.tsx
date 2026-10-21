import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { LegalPage } from '@/components/layout/LegalPage';
import { Alert } from '@/components/ui/Alert';

export function CookiesPage() {
  useDocumentTitle('Cookies et traceurs');
  return (
    <LegalPage title="Cookies et traceurs" updatedAt="21 octobre 2026">
      <Alert tone="info" title="Aucun traceur publicitaire">
        HTI-IMMO n’utilise ni cookie publicitaire, ni pixel de réseaux sociaux, ni outil de mesure
        d’audience tiers. Seul le stockage local strictement nécessaire au fonctionnement est
        utilisé.
      </Alert>

      <h2>1. Qu’est-ce qu’un traceur ?</h2>
      <p>
        Un traceur est une information déposée sur votre terminal (cookie, stockage local) lors de
        la consultation d’un site. Certains sont indispensables au fonctionnement du service ;
        d’autres, soumis à votre consentement, servent à la mesure d’audience ou à la publicité.
      </p>

      <h2>2. Traceurs strictement nécessaires</h2>
      <p>
        Ces traceurs sont exemptés de consentement car ils sont indispensables à la fourniture du
        service demandé (article 82 de la loi Informatique et Libertés).
      </p>
      <ul>
        <li>
          <strong>hti-immo-auth</strong> — stockage local contenant la session d’authentification
          Supabase (jeton d’accès et de rafraîchissement). Durée : jusqu’à déconnexion ou expiration
          du jeton.
        </li>
        <li>
          <strong>hti-immo-demo-session</strong> — stockage local utilisé <em>uniquement</em>{' '}
          lorsque la plateforme tourne en mode démonstration, afin de simuler une session. Durée :
          jusqu’à la déconnexion.
        </li>
        <li>
          <strong>hti-immo-demo-favorites, hti-immo-demo-listings, hti-immo-demo-inquiries</strong>{' '}
          — stockage local du mode démonstration, contenant les données fictives de test. Durée :
          jusqu’à réinitialisation.
        </li>
      </ul>

      <h2>3. Traceurs soumis à consentement</h2>
      <p>
        Aucun. Si un outil de mesure d’audience était ajouté ultérieurement, un bandeau de
        consentement conforme serait mis en place et cette page serait mise à jour.
      </p>

      <h2>4. Comment les supprimer</h2>
      <p>Vous pouvez supprimer ces données à tout moment :</p>
      <ul>
        <li>en vous déconnectant depuis l’en-tête du site ;</li>
        <li>
          via les paramètres de votre navigateur (« Données des sites » ou « Cookies et données de
          site ») ;
        </li>
        <li>
          en mode démonstration, via le bouton « Réinitialiser les données de démonstration » de
          votre espace.
        </li>
      </ul>
      <p>
        La suppression de la session d’authentification entraîne la déconnexion, sans suppression du
        compte.
      </p>

      <h2>5. Pour en savoir plus</h2>
      <p>
        Consultez la <Link to="/confidentialite">politique de confidentialité</Link> ou écrivez-nous
        depuis la page <Link to="/contact">Contact</Link>.
      </p>
    </LegalPage>
  );
}
