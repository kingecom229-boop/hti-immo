/**
 * Types métier HTI-IMMO.
 *
 * Ces types reflètent le schéma PostgreSQL défini dans
 * `supabase/migrations/`. Toute évolution du schéma doit être répercutée ici
 * ET dans `supabase/migrations/` (source de vérité versionnée).
 */

/** Rôles applicatifs. `admin` et `moderator` sont attribués côté serveur uniquement. */
export type UserRole = 'student' | 'owner' | 'moderator' | 'admin';

/** Type de logement proposé. */
export type PropertyType = 'studio' | 'appartement' | 'colocation' | 'chambre' | 'residence';

/** État de publication d'une annonce. */
export type ListingStatus = 'draft' | 'pending' | 'published' | 'rented' | 'archived';

/** Statut d'une demande de logement. */
export type InquiryStatus = 'new' | 'read' | 'answered' | 'closed';

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  city: string | null;
  postal_code: string | null;
  school: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingPhoto {
  id: string;
  listing_id: string;
  storage_path: string;
  alt_text: string | null;
  position: number;
  created_at: string;
}

export interface Listing {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  property_type: PropertyType;
  status: ListingStatus;
  price_cents: number;
  charges_included: boolean;
  deposit_cents: number | null;
  surface_m2: number | null;
  rooms: number | null;
  bedrooms: number | null;
  furnished: boolean;
  pets_allowed: boolean;
  available_from: string | null;

  address_line: string | null;
  postal_code: string;
  city: string;
  latitude: number | null;
  longitude: number | null;

  /** Liste des équipements (ex. "wifi", "lave_linge"). */
  amenities: ListingAmenity[];
  /** Slugs des établissements d'enseignement à proximité. */
  nearby_schools: string[];

  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;

  /** Drapeau indiquant une annonce de démonstration (jamais une vraie offre). */
  is_demo: boolean;

  created_at: string;
  updated_at: string;
  published_at: string | null;
}

/** Annonce enrichie de son agence/photo principale, pour les listes. */
export interface ListingWithPhotos extends Listing {
  listing_photos: ListingPhoto[];
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface Inquiry {
  id: string;
  listing_id: string;
  student_id: string | null;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  message: string;
  status: InquiryStatus;
  created_at: string;
}

export type ListingAmenity =
  | 'wifi'
  | 'lave_linge'
  | 'cuisine_equipee'
  | 'ascenseur'
  | 'balcon'
  | 'parking'
  | 'chauffage'
  | 'meuble'
  | 'digicode'
  | 'handicap_access';

/** Paramètres de recherche du catalogue. */
export interface SearchFilters {
  /** Texte libre : ville, code postal ou titre. */
  q: string;
  city: string;
  postalCode: string;
  type: PropertyType | '';
  minPrice: number | null;
  maxPrice: number | null;
  minSurface: number | null;
  furnished: boolean | null;
  petsAllowed: boolean | null;
  amenities: ListingAmenity[];
  availableFrom: string | null;
  /** Tri appliqué côté base de données. */
  sort: 'recent' | 'price_asc' | 'price_desc' | 'surface_desc';
  page: number;
  pageSize: number;
}

export const DEFAULT_FILTERS: SearchFilters = {
  q: '',
  city: '',
  postalCode: '',
  type: '',
  minPrice: null,
  maxPrice: null,
  minSurface: null,
  furnished: null,
  petsAllowed: null,
  amenities: [],
  availableFrom: null,
  sort: 'recent',
  page: 1,
  pageSize: 12,
};

export interface PaginatedListings {
  items: ListingWithPhotos[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
