import type { ListingAmenity, ListingWithPhotos, PropertyType } from '@/types/domain';

/**
 * Jeu de données de DÉMONSTRATION.
 *
 * ⚠️ Ces annonces sont fictives et affichées uniquement lorsque Supabase n'est
 * pas configuré (ou avec VITE_DEMO_MODE=true). Elles portent toutes
 * `is_demo: true` et un titre préfixé « [EXEMPLE] » : elles ne doivent jamais
 * être présentées comme de véritables offres de logement.
 */

interface DemoSeed {
  slug: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  priceCents: number;
  chargesIncluded: boolean;
  depositCents: number;
  surface: number;
  rooms: number;
  bedrooms: number;
  furnished: boolean;
  petsAllowed: boolean;
  availableInDays: number;
  addressLine: string;
  postalCode: string;
  city: string;
  amenities: ListingAmenity[];
  schools: string[];
  images: string[];
}

const IMG = {
  studio: '/images/demo/studio-lumiere.svg',
  salon: '/images/demo/salon-colocation.svg',
  cuisine: '/images/demo/cuisine-equipee.svg',
  chambre: '/images/demo/chambre-etudiante.svg',
  residence: '/images/demo/residence-facade.svg',
  balcon: '/images/demo/balcon-vue.svg',
} as const;

const SEEDS: DemoSeed[] = [
  {
    slug: 'lyon-studio',
    title: '[EXEMPLE] Studio meublé proche du campus — Lyon 7e',
    description:
      'Annonce de démonstration. Studio meublé de 24 m² à dix minutes à pied de l’université. Cuisine équipée, Wi-Fi inclus, lave-linge partagé dans la résidence. Charges comprises et digicode. Ce contenu illustre uniquement l’interface de HTI-IMMO : il ne correspond à aucune offre réelle et aucune visite ne peut être organisée.',
    propertyType: 'studio',
    priceCents: 62000,
    chargesIncluded: true,
    depositCents: 62000,
    surface: 24,
    rooms: 1,
    bedrooms: 0,
    furnished: true,
    petsAllowed: false,
    availableInDays: 24,
    addressLine: '12 rue de la Démocratie',
    postalCode: '69007',
    city: 'Lyon',
    amenities: ['wifi', 'cuisine_equipee', 'lave_linge', 'meuble', 'digicode'],
    schools: ['universite-lyon-2', 'ens-lyon'],
    images: [IMG.studio, IMG.cuisine, IMG.balcon],
  },
  {
    slug: 'toulouse-coloc',
    title: '[EXEMPLE] Colocation 3 chambres proche métro — Toulouse',
    description:
      'Annonce de démonstration. Chambre de 14 m² dans une colocation de trois personnes, à cinq minutes du métro et du campus. Espaces communs meublés, balcon, internet fibre. Les photos sont des illustrations. Aucune démarche locative n’est possible sur cette annonce fictive.',
    propertyType: 'colocation',
    priceCents: 45000,
    chargesIncluded: false,
    depositCents: 45000,
    surface: 14,
    rooms: 1,
    bedrooms: 1,
    furnished: true,
    petsAllowed: true,
    availableInDays: 40,
    addressLine: '8 avenue des Sciences',
    postalCode: '31400',
    city: 'Toulouse',
    amenities: ['wifi', 'cuisine_equipee', 'balcon', 'meuble'],
    schools: ['universite-toulouse-capitole'],
    images: [IMG.salon, IMG.chambre],
  },
  {
    slug: 'nantes-t2',
    title: '[EXEMPLE] Appartement T2 avec parking — Nantes',
    description:
      'Annonce de démonstration. Appartement de 42 m² composé de deux pièces, cuisine équipée et parking privatif en sous-sol. Idéal pour deux étudiants. Ascenseur et chauffage collectif. Ces informations sont fictives et servent à valider la mise en page du catalogue.',
    propertyType: 'appartement',
    priceCents: 78000,
    chargesIncluded: true,
    depositCents: 78000,
    surface: 42,
    rooms: 2,
    bedrooms: 1,
    furnished: false,
    petsAllowed: false,
    availableInDays: 18,
    addressLine: '25 boulevard de la Démocratie',
    postalCode: '44300',
    city: 'Nantes',
    amenities: ['cuisine_equipee', 'parking', 'ascenseur', 'chauffage'],
    schools: ['ecole-centrale-nantes'],
    images: [IMG.salon, IMG.cuisine],
  },
  {
    slug: 'paris-residence',
    title: '[EXEMPLE] Chambre en résidence étudiante — Paris 13e',
    description:
      'Annonce de démonstration. Chambre de 18 m² en résidence avec espaces communs, salle de sport, Wi-Fi haut débit et accès PMR. Loyer charges comprises. Données fictives destinées à l’évaluation de la plateforme HTI-IMMO, sans lien avec un logement existant.',
    propertyType: 'residence',
    priceCents: 89000,
    chargesIncluded: true,
    depositCents: 0,
    surface: 18,
    rooms: 1,
    bedrooms: 1,
    furnished: true,
    petsAllowed: false,
    availableInDays: 12,
    addressLine: '4 rue de la Démocratie',
    postalCode: '75013',
    city: 'Paris',
    amenities: ['wifi', 'lave_linge', 'ascenseur', 'digicode', 'handicap_access'],
    schools: ['universite-paris-saclay', 'sciences-po'],
    images: [IMG.residence, IMG.chambre],
  },
  {
    slug: 'bordeaux-studio',
    title: '[EXEMPLE] Studio 20 m² proche tramway — Bordeaux',
    description:
      'Annonce de démonstration. Studio lumineux de 20 m² à trois minutes du tramway, entièrement meublé, avec kitchenette équipée et chauffage individuel. Photo d’illustration. Contenu fictif : aucune visite et aucune réservation ne sont possibles.',
    propertyType: 'studio',
    priceCents: 55000,
    chargesIncluded: false,
    depositCents: 55000,
    surface: 20,
    rooms: 1,
    bedrooms: 0,
    furnished: true,
    petsAllowed: false,
    availableInDays: 55,
    addressLine: '19 rue de la Démocratie',
    postalCode: '33800',
    city: 'Bordeaux',
    amenities: ['wifi', 'meuble', 'cuisine_equipee', 'chauffage'],
    schools: ['universite-bordeaux'],
    images: [IMG.studio, IMG.cuisine],
  },
  {
    slug: 'lille-coloc',
    title: '[EXEMPLE] Appartement T3 en colocation — Lille',
    description:
      'Annonce de démonstration. Appartement de 65 m² partagé par trois étudiants, deux chambres disponibles, cuisine équipée, balcon et cave. Proche des facultés et du métro. Contenu fictif destiné à tester les filtres et le tri du catalogue.',
    propertyType: 'colocation',
    priceCents: 52000,
    chargesIncluded: true,
    depositCents: 52000,
    surface: 65,
    rooms: 3,
    bedrooms: 3,
    furnished: true,
    petsAllowed: true,
    availableInDays: 35,
    addressLine: '31 rue de la Démocratie',
    postalCode: '59000',
    city: 'Lille',
    amenities: ['wifi', 'lave_linge', 'cuisine_equipee', 'balcon', 'meuble'],
    schools: ['universite-lille'],
    images: [IMG.salon, IMG.chambre, IMG.balcon],
  },
  {
    slug: 'marseille-studio',
    title: '[EXEMPLE] Studio cosy proche fac de médecine — Marseille',
    description:
      'Annonce de démonstration. Studio de 22 m² rénové, cuisine équipée, Wi-Fi et lave-linge dans l’immeuble. Situé à sept minutes à pied de la faculté. Illustration non contractuelle, annonce fictive sans possibilité de contact réel.',
    propertyType: 'studio',
    priceCents: 58000,
    chargesIncluded: false,
    depositCents: 58000,
    surface: 22,
    rooms: 1,
    bedrooms: 0,
    furnished: true,
    petsAllowed: false,
    availableInDays: 28,
    addressLine: '6 rue de la Démocratie',
    postalCode: '13005',
    city: 'Marseille',
    amenities: ['wifi', 'cuisine_equipee', 'lave_linge', 'meuble'],
    schools: ['universite-aix-marseille'],
    images: [IMG.studio, IMG.balcon],
  },
  {
    slug: 'strasbourg-chambre',
    title: '[EXEMPLE] Chambre meublée en maison étudiante — Strasbourg',
    description:
      'Annonce de démonstration. Chambre de 16 m² meublée dans une maison étudiante de six chambres, avec cuisine commune et jardin. Charges comprises, internet inclus. Données fictives créées pour la démonstration de HTI-IMMO.',
    propertyType: 'chambre',
    priceCents: 42000,
    chargesIncluded: true,
    depositCents: 42000,
    surface: 16,
    rooms: 1,
    bedrooms: 1,
    furnished: true,
    petsAllowed: true,
    availableInDays: 48,
    addressLine: '14 rue de la Démocratie',
    postalCode: '67000',
    city: 'Strasbourg',
    amenities: ['wifi', 'cuisine_equipee', 'meuble', 'chauffage'],
    schools: ['universite-strasbourg'],
    images: [IMG.chambre, IMG.cuisine],
  },
  {
    slug: 'rennes-appart',
    title: '[EXEMPLE] Appartement T2 proche Beaulieu — Rennes',
    description:
      'Annonce de démonstration. Appartement de 38 m² au deuxième étage, deux pièces, cuisine ouverte équipée et balcon exposé sud. À dix minutes en bus du campus de Beaulieu. Contenu fictif, aucune offre réelle.',
    propertyType: 'appartement',
    priceCents: 69000,
    chargesIncluded: true,
    depositCents: 69000,
    surface: 38,
    rooms: 2,
    bedrooms: 1,
    furnished: false,
    petsAllowed: false,
    availableInDays: 21,
    addressLine: '52 rue de la Démocratie',
    postalCode: '35000',
    city: 'Rennes',
    amenities: ['cuisine_equipee', 'balcon', 'ascenseur', 'chauffage'],
    schools: ['universite-rennes-1'],
    images: [IMG.salon, IMG.balcon],
  },
  {
    slug: 'montpellier-studio',
    title: '[EXEMPLE] Studio neuf à deux pas du centre — Montpellier',
    description:
      'Annonce de démonstration. Studio neuf de 26 m², cuisine équipée, climatisation et accès digicode. À cinq minutes du centre historique et quinze minutes du campus. Illustration de démonstration, aucune démarche possible.',
    propertyType: 'studio',
    priceCents: 64000,
    chargesIncluded: false,
    depositCents: 64000,
    surface: 26,
    rooms: 1,
    bedrooms: 0,
    furnished: true,
    petsAllowed: false,
    availableInDays: 33,
    addressLine: '3 rue de la Démocratie',
    postalCode: '34000',
    city: 'Montpellier',
    amenities: ['wifi', 'cuisine_equipee', 'meuble', 'digicode'],
    schools: ['universite-montpellier'],
    images: [IMG.studio, IMG.cuisine],
  },
  {
    slug: 'grenoble-coloc',
    title: '[EXEMPLE] Colocation étudiante 4 chambres — Grenoble',
    description:
      'Annonce de démonstration. Colocation de quatre chambres proche de la gare, une chambre disponible. Grande cuisine équipée, lave-linge, cave et local vélo. Annonce fictive : les informations ne décrivent aucun logement réel.',
    propertyType: 'colocation',
    priceCents: 47000,
    chargesIncluded: true,
    depositCents: 47000,
    surface: 15,
    rooms: 1,
    bedrooms: 1,
    furnished: true,
    petsAllowed: false,
    availableInDays: 39,
    addressLine: '88 rue de la Démocratie',
    postalCode: '38000',
    city: 'Grenoble',
    amenities: ['wifi', 'lave_linge', 'cuisine_equipee', 'meuble'],
    schools: ['universite-grenoble-alpes'],
    images: [IMG.salon, IMG.chambre],
  },
  {
    slug: 'nice-appart',
    title: '[EXEMPLE] Appartement T3 lumineux — Nice',
    description:
      'Annonce de démonstration. Appartement de 58 m² avec trois pièces, deux chambres, balcon avec vue dégagée et parking. Proche du tramway et de la faculté. Contenu fictif créé pour évaluer la plateforme, sans lien avec une annonce réelle.',
    propertyType: 'appartement',
    priceCents: 95000,
    chargesIncluded: false,
    depositCents: 95000,
    surface: 58,
    rooms: 3,
    bedrooms: 2,
    furnished: false,
    petsAllowed: true,
    availableInDays: 26,
    addressLine: '11 rue de la Démocratie',
    postalCode: '06000',
    city: 'Nice',
    amenities: ['cuisine_equipee', 'balcon', 'parking', 'ascenseur'],
    schools: ['universite-cote-azur'],
    images: [IMG.balcon, IMG.salon],
  },
];

const DEMO_OWNER_ID = 'demo-owner';
const BASE_DATE = new Date('2026-09-01T09:00:00.000Z');

function addDays(date: Date, days: number): string {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

export const DEMO_LISTINGS: ListingWithPhotos[] = SEEDS.map((seed, index) => {
  const createdAt = addDays(BASE_DATE, index * 2);
  return {
    id: `demo-listing-${index + 1}`,
    owner_id: DEMO_OWNER_ID,
    title: seed.title,
    description: seed.description,
    property_type: seed.propertyType,
    status: 'published',
    price_cents: seed.priceCents,
    charges_included: seed.chargesIncluded,
    deposit_cents: seed.depositCents,
    surface_m2: seed.surface,
    rooms: seed.rooms,
    bedrooms: seed.bedrooms,
    furnished: seed.furnished,
    pets_allowed: seed.petsAllowed,
    available_from: addDays(BASE_DATE, seed.availableInDays).slice(0, 10),
    address_line: seed.addressLine,
    postal_code: seed.postalCode,
    city: seed.city,
    latitude: null,
    longitude: null,
    amenities: seed.amenities,
    nearby_schools: seed.schools,
    contact_name: 'Équipe démonstration HTI-IMMO',
    contact_email: 'demo@hti-immo.test',
    contact_phone: null,
    is_demo: true,
    created_at: createdAt,
    updated_at: createdAt,
    published_at: createdAt,
    listing_photos: seed.images.map((path, photoIndex) => ({
      id: `demo-photo-${index + 1}-${photoIndex + 1}`,
      listing_id: `demo-listing-${index + 1}`,
      storage_path: path,
      alt_text: `${seed.title} — illustration ${photoIndex + 1}`,
      position: photoIndex,
      created_at: createdAt,
    })),
  };
});

/** Liste des villes du jeu de démonstration, pour les suggestions de recherche. */
export const DEMO_CITIES = Array.from(new Set(DEMO_LISTINGS.map((listing) => listing.city))).sort(
  (a, b) => a.localeCompare(b, 'fr'),
);
