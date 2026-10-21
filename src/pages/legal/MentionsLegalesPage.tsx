import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { LegalPage } from '@/components/layout/LegalPage';
import { config } from '@/lib/config';
import { Alert } from '@/components/ui/Alert';

export function MentionsLegalesPage() {
  useDocumentTitle('Mentions légales');
  return (
    <LegalPage title="Mentions légales" updatedAt="21 octobre 2026">
      <Alert tone="warning" title="Informations à compléter avant la mise en ligne">
        Les champs signalés « [À COMPLÉTER] » relèvent d’obligations légales (article 6 III de la
        loi LCEN). Ils doivent être renseignés par l’éditeur du site avant toute publication.
      </Alert>

      <h2>1. Éditeur du site</h2>
      <p>
        Le site HTI-IMMO est édité par : <strong>[À COMPLÉTER : dénomination sociale]</strong>,
        <strong> [À COMPLÉTER : forme juridique]</strong> au capital de{' '}
        <strong>[À COMPLÉTER : montant]</strong> euros, immatriculée au Registre du commerce et des
        sociétés sous le numéro <strong>[À COMPLÉTER : SIREN/SIRET]</strong>.
      </p>
      <ul>
        <li>Siège social : [À COMPLÉTER : adresse postale complète]</li>
        <li>Numéro de TVA intracommunautaire : [À COMPLÉTER]</li>
        <li>
          Contact : <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>
        </li>
        <li>Directeur de la publication : [À COMPLÉTER : nom du responsable]</li>
      </ul>

      <h2>2. Hébergement</h2>
      <p>
        Le site est hébergé par <strong>Netlify, Inc.</strong>, 512 2nd Street, Suite 200, San
        Francisco, CA 94107, États-Unis —{' '}
        <a href="https://www.netlify.com" target="_blank" rel="noreferrer noopener">
          www.netlify.com
        </a>
        .
      </p>
      <p>
        Les données applicatives (comptes, annonces, demandes) sont hébergées par{' '}
        <strong>Supabase Inc.</strong> sur l’infrastructure du fournisseur choisi lors de la
        création du projet. La région d’hébergement retenue doit être précisée ici :{' '}
        <strong>
          [À COMPLÉTER : région Supabase, par exemple « Union européenne (Francfort) »]
        </strong>
        .
      </p>

      <h2>3. Propriété intellectuelle</h2>
      <p>
        L’ensemble des éléments du site (structure, textes, interface, logo) est protégé par le
        droit d’auteur. Toute reproduction ou représentation, totale ou partielle, sans autorisation
        écrite préalable est interdite.
      </p>
      <p>
        Les annonces publiées restent la propriété de leurs auteurs, qui concèdent à HTI-IMMO une
        licence non exclusive d’affichage sur la plateforme pour la durée de leur publication.
      </p>

      <h2>4. Nature du service</h2>
      <p>
        HTI-IMMO est une plateforme de mise en relation entre des personnes proposant un logement et
        des étudiants à la recherche d’un logement. HTI-IMMO n’est ni agence immobilière, ni
        mandataire, et n’intervient pas dans la conclusion du contrat de location.
      </p>
      <p>
        Les annonces marquées « Exemple » sont des données de démonstration. Elles ne correspondent
        à aucun bien réel et ne constituent pas une offre de location.
      </p>

      <h2>5. Signalement</h2>
      <p>
        Pour signaler un contenu illicite ou une annonce suspecte, écrivez à{' '}
        <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a> en précisant l’adresse
        de la page concernée.
      </p>

      <h2>6. Données personnelles et cookies</h2>
      <p>
        Le traitement des données personnelles est décrit dans la{' '}
        <Link to="/confidentialite">politique de confidentialité</Link>. L’usage des traceurs est
        détaillé dans la page <Link to="/cookies">Cookies et traceurs</Link>.
      </p>

      <h2>7. Droit applicable</h2>
      <p>
        Les présentes mentions sont soumises au droit français. En cas de litige, les tribunaux
        français sont compétents, sous réserve des règles impératives protégeant les consommateurs.
      </p>
    </LegalPage>
  );
}
