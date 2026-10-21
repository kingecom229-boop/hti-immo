import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  FileText,
  MessageSquare,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Alert } from '@/components/ui/Alert';
import { buttonClasses } from '@/components/ui/button-styles';

const STUDENT_STEPS = [
  {
    icon: Search,
    title: '1. Recherchez',
    text: 'Filtrez le catalogue par ville, code postal, loyer maximum, surface, type de logement et équipements.',
  },
  {
    icon: CheckCircle2,
    title: '2. Comparez',
    text: 'Chaque annonce détaille le loyer, les charges, le dépôt de garantie, la surface et la date de disponibilité.',
  },
  {
    icon: MessageSquare,
    title: '3. Contactez',
    text: 'Envoyez une demande structurée au bailleur depuis l’annonce. Vos coordonnées ne sont transmises qu’à lui.',
  },
  {
    icon: UserRound,
    title: '4. Suivez vos demandes',
    text: 'Créez un compte pour retrouver vos favoris et l’historique de vos demandes dans votre espace personnel.',
  },
];

const OWNER_STEPS = [
  {
    icon: UserRound,
    title: '1. Créez un compte bailleur',
    text: 'Choisissez « Bailleur » à l’inscription pour accéder à l’espace de publication.',
  },
  {
    icon: FileText,
    title: '2. Rédigez votre annonce',
    text: 'Décrivez le logement, indiquez la surface, les charges, le dépôt de garantie et les équipements.',
  },
  {
    icon: ShieldCheck,
    title: '3. Attendez la validation',
    text: 'Chaque annonce est relue par notre équipe avant publication : nombre de pièces, cohérence du loyer et du code postal.',
  },
  {
    icon: MessageSquare,
    title: '4. Répondez aux demandes',
    text: 'Les demandes arrivent dans votre espace. Vous gardez le contrôle total sur les visites et la sélection des candidats.',
  },
];

export function HowItWorksPage() {
  useDocumentTitle(
    'Comment ça marche',
    'Découvrez le fonctionnement de HTI-IMMO pour les étudiants et pour les bailleurs : recherche, comparaison, contact et publication.',
  );

  return (
    <div className="container-page py-12">
      <header className="max-w-3xl">
        <p className="text-ink-500 text-xs font-bold tracking-wider uppercase">Fonctionnement</p>
        <h1 className="font-display text-ink-950 mt-2 text-3xl font-bold sm:text-4xl">
          Comment fonctionne HTI-IMMO
        </h1>
        <p className="text-ink-600 mt-3 text-sm leading-relaxed">
          Une plateforme conçue pour rendre la recherche de logement étudiant plus lisible : des
          annonces structurées, des informations comparables et une mise en relation directe, sans
          intermédiaire payant.
        </p>
      </header>

      <section className="mt-12" aria-labelledby="etudiants">
        <h2 id="etudiants" className="font-display text-ink-950 text-2xl font-bold">
          Vous êtes étudiant
        </h2>
        <ol className="mt-6 grid gap-5 sm:grid-cols-2">
          {STUDENT_STEPS.map((step) => (
            <li key={step.title} className="card p-6">
              <span className="bg-ink-900 text-amber-accent grid h-10 w-10 place-items-center rounded-lg">
                <step.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="font-display text-ink-950 mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="text-ink-600 mt-2 text-sm leading-relaxed">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12" aria-labelledby="bailleurs">
        <h2 id="bailleurs" className="font-display text-ink-950 text-2xl font-bold">
          Vous proposez un logement
        </h2>
        <ol className="mt-6 grid gap-5 sm:grid-cols-2">
          {OWNER_STEPS.map((step) => (
            <li key={step.title} className="card p-6">
              <span className="bg-ink-50 text-ink-800 grid h-10 w-10 place-items-center rounded-lg">
                <step.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="font-display text-ink-950 mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="text-ink-600 mt-2 text-sm leading-relaxed">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12" aria-labelledby="securite-titre">
        <h2 id="securite-titre" className="font-display text-ink-950 text-2xl font-bold">
          Nos engagements
        </h2>
        <div className="mt-4 space-y-3">
          <Alert tone="info" title="Annonces de démonstration identifiées">
            Lorsque la plateforme fonctionne sans base de données connectée, les annonces affichées
            sont des exemples fictifs, explicitement marqués « Exemple ». Elles ne constituent
            jamais une offre de location.
          </Alert>
          <Alert tone="success" title="Aucun paiement sur la plateforme">
            HTI-IMMO ne demande jamais de frais de dossier, de réservation ou de visite. Toute
            demande de paiement anticipé doit être considérée comme suspecte.
          </Alert>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link to="/logements" className={buttonClasses('primary', 'lg')}>
          Consulter les annonces
        </Link>
        <Link to="/inscription" className={buttonClasses('secondary', 'lg')}>
          <Building2 className="h-4 w-4" aria-hidden="true" />
          Publier un logement
        </Link>
      </div>
    </div>
  );
}
