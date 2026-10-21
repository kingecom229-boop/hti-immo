import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { LegalPage } from '@/components/layout/LegalPage';
import { config } from '@/lib/config';
import { Alert } from '@/components/ui/Alert';

export function ConfidentialitePage() {
  useDocumentTitle('Politique de confidentialité');
  return (
    <LegalPage title="Politique de confidentialité" updatedAt="21 octobre 2026">
      <Alert tone="warning" title="Document à valider avant la mise en ligne">
        Ce texte décrit fidèlement le fonctionnement technique de l’application. Il doit être
        complété par l’identité du responsable de traitement et validé juridiquement avant
        publication.
      </Alert>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement est <strong>[À COMPLÉTER : dénomination sociale]</strong>,
        joignable à l’adresse <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>.
      </p>

      <h2>2. Données collectées</h2>
      <ul>
        <li>
          <strong>Compte :</strong> adresse e-mail, mot de passe (stocké sous forme de hachage par
          Supabase Auth), nom complet, rôle (étudiant ou bailleur).
        </li>
        <li>
          <strong>Profil facultatif :</strong> téléphone, ville, code postal, établissement, courte
          présentation.
        </li>
        <li>
          <strong>Annonces (bailleurs) :</strong> description du logement, adresse, loyer, surface,
          équipements, photos, coordonnées de contact.
        </li>
        <li>
          <strong>Demandes de logement (étudiants et visiteurs) :</strong> nom, e-mail, téléphone
          facultatif, message.
        </li>
        <li>
          <strong>Favoris :</strong> identifiants des annonces enregistrées.
        </li>
      </ul>
      <p>
        Aucune donnée bancaire n’est collectée. Aucun outil de mesure d’audience ou de publicité
        n’est intégré à ce jour.
      </p>

      <h2>3. Finalités et bases légales</h2>
      <ul>
        <li>
          <strong>Gestion des comptes et de l’authentification</strong> — exécution du contrat
          (article 6.1.b du RGPD).
        </li>
        <li>
          <strong>Publication d’annonces et mise en relation</strong> — exécution du contrat.
        </li>
        <li>
          <strong>Traitement des demandes de logement</strong> — consentement de la personne qui
          envoie le formulaire (article 6.1.a).
        </li>
        <li>
          <strong>Sécurité, prévention des abus et modération</strong> — intérêt légitime (article
          6.1.f).
        </li>
        <li>
          <strong>Respect des obligations légales</strong> — obligation légale (article 6.1.c).
        </li>
      </ul>

      <h2>4. Destinataires</h2>
      <p>
        Les données sont accessibles au personnel habilité de HTI-IMMO (administration et
        modération). Les demandes de logement sont transmises au bailleur de l’annonce concernée.
      </p>
      <p>Sous-traitants techniques :</p>
      <ul>
        <li>
          <strong>Supabase Inc.</strong> — base de données PostgreSQL, authentification et stockage
          des images.
        </li>
        <li>
          <strong>Netlify, Inc.</strong> — hébergement du site et diffusion des fichiers statiques.
        </li>
      </ul>

      <h2>5. Transferts hors Union européenne</h2>
      <p>
        Selon la région choisie pour le projet Supabase et la localisation des serveurs Netlify, un
        transfert hors UE peut avoir lieu. Le responsable de traitement doit s’assurer que des
        garanties appropriées sont en place (clauses contractuelles types de la Commission
        européenne). Région d’hébergement retenue : <strong>[À COMPLÉTER]</strong>.
      </p>

      <h2>6. Durées de conservation</h2>
      <ul>
        <li>Compte actif : pendant la durée d’utilisation, puis suppression sur demande.</li>
        <li>Annonces : pendant leur publication, puis conservation limitée pour la modération.</li>
        <li>
          Demandes de logement : 12 mois après le dernier échange avec le bailleur, sauf obligation
          légale contraire.
        </li>
        <li>Journaux techniques : 6 mois maximum.</li>
      </ul>

      <h2>7. Vos droits</h2>
      <p>
        Vous disposez des droits d’accès, de rectification, d’effacement, de limitation,
        d’opposition et de portabilité. Vous pouvez les exercer en écrivant à{' '}
        <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>. Une réponse vous sera
        apportée dans un délai d’un mois.
      </p>
      <p>
        Vous pouvez également introduire une réclamation auprès de la CNIL (3 place de Fontenoy, TSA
        80715, 75334 Paris Cedex 07 —{' '}
        <a href="https://www.cnil.fr" target="_blank" rel="noreferrer noopener">
          www.cnil.fr
        </a>
        ).
      </p>

      <h2>8. Sécurité</h2>
      <p>
        L’accès aux données est contrôlé par des politiques Row Level Security (RLS) appliquées au
        niveau de la base de données. Les secrets d’administration ne sont jamais exposés au
        navigateur. Les mots de passe sont hachés par Supabase Auth. Les échanges sont chiffrés en
        transit (HTTPS).
      </p>

      <h2>9. Cookies et traceurs</h2>
      <p>
        Voir la page <Link to="/cookies">Cookies et traceurs</Link>.
      </p>

      <h2>10. Modifications</h2>
      <p>
        Cette politique peut être mise à jour. La date de dernière modification figure en tête de
        page. En cas de changement substantiel, les utilisateurs connectés sont informés.
      </p>
    </LegalPage>
  );
}
