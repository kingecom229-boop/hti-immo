import { z } from 'zod';

/**
 * Schémas de validation partagés (formulaires + normalisation des entrées).
 *
 * Ces schémas sont la première barrière côté client. La seconde barrière est
 * constituée des contraintes PostgreSQL et des politiques RLS : le client ne
 * doit jamais être la seule protection.
 */

/** Code postal français : 5 chiffres, commence par 0-9 (DOM inclus : 97xxx). */
export const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, 'Le code postal doit contenir exactement 5 chiffres.');

export const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}$/,
    'Numéro de téléphone français invalide (ex. 06 12 34 56 78).',
  );

/** Mot de passe : 10 caractères minimum, au moins une lettre et un chiffre. */
export const passwordSchema = z
  .string()
  .min(10, 'Le mot de passe doit contenir au moins 10 caractères.')
  .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères.')
  .regex(/[A-Za-z]/, 'Le mot de passe doit contenir au moins une lettre.')
  .regex(/\d/, 'Le mot de passe doit contenir au moins un chiffre.');

export const emailSchema = z
  .string()
  .trim()
  .min(1, "L'adresse e-mail est obligatoire.")
  .max(254, "L'adresse e-mail est trop longue.")
  .email('Adresse e-mail invalide.');

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Le mot de passe est obligatoire.'),
});

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Indiquez votre nom complet.')
    .max(80, 'Le nom ne peut pas dépasser 80 caractères.'),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['student', 'owner']).default('student'),
  acceptTerms: z.literal(true, {
    error: 'Vous devez accepter les Conditions Générales d’Utilisation.',
  }),
});

export const profileSchema = z.object({
  fullName: z.string().trim().max(80, 'Le nom ne peut pas dépasser 80 caractères.').optional(),
  phone: z.union([phoneSchema, z.literal('')]).optional(),
  city: z.string().trim().max(80).optional(),
  postalCode: z.union([postalCodeSchema, z.literal('')]).optional(),
  school: z.string().trim().max(120).optional(),
  bio: z
    .string()
    .trim()
    .max(600, 'La présentation ne peut pas dépasser 600 caractères.')
    .optional(),
});

export const inquirySchema = z.object({
  senderName: z
    .string()
    .trim()
    .min(2, 'Indiquez votre nom.')
    .max(80, 'Le nom ne peut pas dépasser 80 caractères.'),
  senderEmail: emailSchema,
  senderPhone: z.union([phoneSchema, z.literal('')]).optional(),
  message: z
    .string()
    .trim()
    .min(20, 'Votre message doit contenir au moins 20 caractères.')
    .max(2000, 'Votre message ne peut pas dépasser 2000 caractères.'),
  /** Consentement RGPD explicite pour le traitement de la demande. */
  consent: z.literal(true, { error: 'Vous devez accepter le traitement de vos données.' }),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Indiquez votre nom.').max(80),
  email: emailSchema,
  subject: z.string().trim().min(3, 'Précisez l’objet de votre message.').max(120),
  message: z
    .string()
    .trim()
    .min(20, 'Votre message doit contenir au moins 20 caractères.')
    .max(2000, 'Votre message ne peut pas dépasser 2000 caractères.'),
  consent: z.literal(true, { error: 'Vous devez accepter le traitement de vos données.' }),
});

const AMENITY_VALUES = [
  'wifi',
  'lave_linge',
  'cuisine_equipee',
  'ascenseur',
  'balcon',
  'parking',
  'chauffage',
  'meuble',
  'digicode',
  'handicap_access',
] as const;

const PROPERTY_TYPE_VALUES = [
  'studio',
  'appartement',
  'colocation',
  'chambre',
  'residence',
] as const;

/**
 * Annonce côté propriétaire.
 * Les prix sont saisis en euros dans le formulaire puis convertis en centimes.
 */
export const listingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(10, 'Le titre doit contenir au moins 10 caractères.')
    .max(120, 'Le titre ne peut pas dépasser 120 caractères.'),
  description: z
    .string()
    .trim()
    .min(50, 'La description doit contenir au moins 50 caractères.')
    .max(4000, 'La description ne peut pas dépasser 4000 caractères.'),
  propertyType: z.enum(PROPERTY_TYPE_VALUES, { error: 'Sélectionnez un type de logement.' }),
  priceEuros: z.coerce
    .number({ error: 'Indiquez un loyer valide.' })
    .int('Le loyer doit être un nombre entier d’euros.')
    .min(100, 'Le loyer doit être supérieur à 100 €.')
    .max(10_000, 'Le loyer ne peut pas dépasser 10 000 €.'),
  chargesIncluded: z.boolean().default(false),
  depositEuros: z.coerce
    .number({ error: 'Indiquez un dépôt de garantie valide.' })
    .int()
    .min(0)
    .max(20_000)
    .optional(),
  surfaceM2: z.coerce
    .number({ error: 'Indiquez une surface valide.' })
    .min(5, 'La surface doit être d’au moins 5 m².')
    .max(1000, 'La surface ne peut pas dépasser 1000 m².'),
  rooms: z.coerce.number().int().min(1).max(20).default(1),
  bedrooms: z.coerce.number().int().min(0).max(20).default(0),
  furnished: z.boolean().default(false),
  petsAllowed: z.boolean().default(false),
  availableFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Indiquez une date de disponibilité valide.')
    .optional(),
  addressLine: z.string().trim().max(160).optional(),
  postalCode: postalCodeSchema,
  city: z
    .string()
    .trim()
    .min(2, 'Indiquez la ville.')
    .max(80, 'La ville ne peut pas dépasser 80 caractères.'),
  amenities: z.array(z.enum(AMENITY_VALUES)).max(12).default([]),
});

export type ListingInput = z.infer<typeof listingSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type InquiryInput = z.infer<typeof inquirySchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ContactInput = z.infer<typeof contactSchema>;

/** Résultat exploitable d'une validation de formulaire. */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

/**
 * Valide des données et convertit les erreurs Zod en dictionnaire
 * `champ -> message`, directement consommable par les formulaires.
 */
export function validateWithSchema<S extends z.ZodType>(
  schema: S,
  input: unknown,
): ValidationResult<z.infer<S>> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_form';
    if (!errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}

/** Nettoie une chaîne destinée à un affichage texte (neutralise les balises). */
export function sanitizeText(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[\p{Cc}]/gu, ' ')
    .trim();
}

/** Vérifie qu'une chaîne ne contient pas de balise HTML (détection basique). */
export function containsHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}
