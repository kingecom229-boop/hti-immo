/**
 * Principales villes étudiantes de France, utilisées comme suggestions de
 * recherche et pour les liens internes de la page d'accueil.
 * Cette liste n'est pas une source de vérité sur les annonces disponibles.
 */
export interface CitySuggestion {
  name: string;
  slug: string;
  postalCode: string;
  region: string;
  studentCount: string;
}

export const STUDENT_CITIES: CitySuggestion[] = [
  {
    name: 'Paris',
    slug: 'paris',
    postalCode: '75013',
    region: 'Île-de-France',
    studentCount: '700 000',
  },
  {
    name: 'Lyon',
    slug: 'lyon',
    postalCode: '69007',
    region: 'Auvergne-Rhône-Alpes',
    studentCount: '180 000',
  },
  {
    name: 'Toulouse',
    slug: 'toulouse',
    postalCode: '31400',
    region: 'Occitanie',
    studentCount: '130 000',
  },
  {
    name: 'Lille',
    slug: 'lille',
    postalCode: '59000',
    region: 'Hauts-de-France',
    studentCount: '120 000',
  },
  {
    name: 'Bordeaux',
    slug: 'bordeaux',
    postalCode: '33800',
    region: 'Nouvelle-Aquitaine',
    studentCount: '110 000',
  },
  {
    name: 'Nantes',
    slug: 'nantes',
    postalCode: '44300',
    region: 'Pays de la Loire',
    studentCount: '100 000',
  },
  {
    name: 'Marseille',
    slug: 'marseille',
    postalCode: '13005',
    region: "Provence-Alpes-Côte d'Azur",
    studentCount: '95 000',
  },
  {
    name: 'Strasbourg',
    slug: 'strasbourg',
    postalCode: '67000',
    region: 'Grand Est',
    studentCount: '85 000',
  },
  {
    name: 'Rennes',
    slug: 'rennes',
    postalCode: '35000',
    region: 'Bretagne',
    studentCount: '75 000',
  },
  {
    name: 'Montpellier',
    slug: 'montpellier',
    postalCode: '34000',
    region: 'Occitanie',
    studentCount: '75 000',
  },
  {
    name: 'Grenoble',
    slug: 'grenoble',
    postalCode: '38000',
    region: 'Auvergne-Rhône-Alpes',
    studentCount: '65 000',
  },
  {
    name: 'Nice',
    slug: 'nice',
    postalCode: '06000',
    region: "Provence-Alpes-Côte d'Azur",
    studentCount: '40 000',
  },
];

/** Suggestions triées pour un `<datalist>` HTML. */
export const CITY_NAMES = STUDENT_CITIES.map((city) => city.name);
