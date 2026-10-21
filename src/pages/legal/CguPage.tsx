import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { LegalPage } from '@/components/layout/LegalPage';
import { Alert } from '@/components/ui/Alert';

export function CguPage() {
  useDocumentTitle('Conditions générales d’utilisation');
  return (
    <LegalPage title="Conditions générales d’utilisation" updatedAt="21 octobre 2026">
      <Alert tone="warning" title="Document à valider avant la mise en ligne">
        Ces conditions décrivent le fonctionnement réel de la plateforme et doivent être relues par
        un professionnel du droit avant publication.
      </Alert>

      <h2>1. Objet</h2>
      <p>
        Les présentes conditions régissent l’utilisation du service HTI-IMMO, plateforme de mise en
        relation entre des personnes proposant un logement et des étudiants recherchant un logement
        en France. L’utilisation du site vaut acceptation des présentes conditions.
      </p>

      <h2>2. Accès au service</h2>
      <p>
        La consultation du catalogue est libre. La création d’un compte est nécessaire pour
        enregistrer des favoris, suivre ses demandes ou publier une annonce. Le service est fourni «
        en l’état », sous réserve d’opérations de maintenance.
      </p>

      <h2>3. Compte utilisateur</h2>
      <ul>
        <li>Vous vous engagez à fournir des informations exactes et à jour.</li>
        <li>Vous êtes seul responsable de la confidentialité de votre mot de passe.</li>
        <li>
          Un compte est personnel. Toute utilisation frauduleuse doit être signalée sans délai à{' '}
          <Link to="/contact">l’équipe HTI-IMMO</Link>.
        </li>
        <li>Vous devez avoir au moins 18 ans pour créer un compte et publier une annonce.</li>
      </ul>

      <h2>4. Annonces publiées par les bailleurs</h2>
      <ul>
        <li>
          Le bailleur garantit détenir le droit de proposer le logement (propriétaire ou mandataire)
          et l’exactitude des informations publiées (loyer, charges, surface, disponibilité).
        </li>
        <li>
          Toute annonce est soumise à une relecture avant publication. HTI-IMMO peut refuser ou
          retirer une annonce non conforme, sans préavis.
        </li>
        <li>
          Sont interdits : les annonces fictives, les loyers manifestement trompeurs, les logements
          insalubres, la discrimination et toute demande de paiement avant visite.
        </li>
        <li>
          Les photos doivent être libres de droits ou appartenir au bailleur. Les images de
          démonstration ne peuvent être présentées comme des photos du bien.
        </li>
      </ul>

      <h2>5. Engagements des utilisateurs en recherche de logement</h2>
      <ul>
        <li>Utiliser les formulaires de contact de bonne foi, sans démarchage ni spam.</li>
        <li>
          Ne pas transmettre de données sensibles ni de documents bancaires par le formulaire.
        </li>
        <li>Respecter la vie privée des bailleurs et des autres utilisateurs.</li>
      </ul>

      <h2>6. Contenus interdits</h2>
      <p>
        Sont notamment interdits : les propos discriminatoires ou haineux, les contenus illicites,
        la usurpation d’identité, la diffusion de virus, l’extraction automatisée des données du
        site et toute tentative de contournement des mesures de sécurité.
      </p>

      <h2>7. Absence de paiement et de garantie locative</h2>
      <p>
        HTI-IMMO ne perçoit aucun frais de dossier, de visite ou de réservation, et ne conserve
        aucune somme au titre d’un dépôt de garantie. Aucun paiement ne doit être effectué via la
        plateforme.
      </p>

      <h2>8. Responsabilité</h2>
      <p>
        HTI-IMMO fournit un service d’intermédiation technique. Elle n’est pas partie au contrat de
        location et ne peut être tenue responsable de l’inexactitude d’une annonce, de l’issue d’une
        visite ou d’un litige entre un bailleur et un locataire. Les utilisateurs sont invités à
        vérifier l’identité de leur interlocuteur et à ne signer aucun document sans visite.
      </p>

      <h2>9. Suspension et résiliation</h2>
      <p>
        HTI-IMMO peut suspendre ou supprimer un compte en cas de manquement grave aux présentes
        conditions, notamment en cas d’annonce frauduleuse ou de comportement abusif. L’utilisateur
        peut demander la suppression de son compte à tout moment depuis son espace ou par e-mail.
      </p>

      <h2>10. Propriété intellectuelle</h2>
      <p>
        Le bailleur concède à HTI-IMMO une licence non exclusive et gratuite d’afficher ses contenus
        sur la plateforme pendant la durée de publication de l’annonce. HTI-IMMO conserve la
        propriété de son interface, de sa marque et de ses textes.
      </p>

      <h2>11. Droit applicable et litiges</h2>
      <p>
        Les présentes conditions sont soumises au droit français. En cas de litige, une solution
        amiable sera recherchée en priorité. À défaut, les tribunaux français sont compétents, sous
        réserve des règles protectrices applicables aux consommateurs.
      </p>

      <h2>12. Contact</h2>
      <p>
        Pour toute question relative aux présentes conditions, utilisez la page{' '}
        <Link to="/contact">Contact</Link>.
      </p>
    </LegalPage>
  );
}
