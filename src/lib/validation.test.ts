import { describe, expect, it } from 'vitest';
import {
  containsHtml,
  emailSchema,
  inquirySchema,
  listingSchema,
  passwordSchema,
  phoneSchema,
  postalCodeSchema,
  profileSchema,
  sanitizeText,
  signUpSchema,
  validateWithSchema,
} from './validation';

describe('passwordSchema', () => {
  it('accepte un mot de passe conforme', () => {
    expect(passwordSchema.safeParse('Etudiant2026!').success).toBe(true);
  });

  it('refuse les mots de passe trop courts', () => {
    expect(passwordSchema.safeParse('Ab1').success).toBe(false);
  });

  it('exige au moins une lettre et un chiffre', () => {
    expect(passwordSchema.safeParse('1234567890').success).toBe(false);
    expect(passwordSchema.safeParse('motdepasseuniquement').success).toBe(false);
  });

  it('refuse les mots de passe trop longs', () => {
    expect(passwordSchema.safeParse(`${'a1'.repeat(70)}`).success).toBe(false);
  });
});

describe('postalCodeSchema', () => {
  it('accepte un code postal français', () => {
    expect(postalCodeSchema.safeParse('69007').success).toBe(true);
    expect(postalCodeSchema.safeParse('97400').success).toBe(true);
  });

  it('refuse un code postal invalide', () => {
    expect(postalCodeSchema.safeParse('6900').success).toBe(false);
    expect(postalCodeSchema.safeParse('ABCDE').success).toBe(false);
    expect(postalCodeSchema.safeParse('69007 ').success).toBe(true); // trim
  });
});

describe('phoneSchema', () => {
  it('accepte les formats français courants', () => {
    expect(phoneSchema.safeParse('0612345678').success).toBe(true);
    expect(phoneSchema.safeParse('06 12 34 56 78').success).toBe(true);
    expect(phoneSchema.safeParse('+33612345678').success).toBe(true);
  });

  it('refuse un numéro manifestement invalide', () => {
    expect(phoneSchema.safeParse('1234').success).toBe(false);
    expect(phoneSchema.safeParse('00 12 34 56 78').success).toBe(false);
  });
});

describe('emailSchema', () => {
  it('accepte une adresse correcte', () => {
    expect(emailSchema.safeParse('etudiant@example.fr').success).toBe(true);
  });

  it('refuse une adresse incorrecte', () => {
    expect(emailSchema.safeParse('etudiant@').success).toBe(false);
    expect(emailSchema.safeParse('sans-arobase.fr').success).toBe(false);
  });
});

describe('signUpSchema', () => {
  const valid = {
    fullName: 'Alex Martin',
    email: 'alex@example.fr',
    password: 'MotDePasse2026',
    role: 'student',
    acceptTerms: true,
  };

  it('accepte une inscription valide', () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it('exige l’acceptation des CGU', () => {
    const result = signUpSchema.safeParse({ ...valid, acceptTerms: false });
    expect(result.success).toBe(false);
  });

  it('refuse un rôle privilégié', () => {
    expect(signUpSchema.safeParse({ ...valid, role: 'admin' }).success).toBe(false);
  });
});

describe('profileSchema', () => {
  it('accepte un profil vide', () => {
    expect(profileSchema.safeParse({}).success).toBe(true);
  });

  it('refuse un code postal invalide', () => {
    expect(profileSchema.safeParse({ postalCode: '123' }).success).toBe(false);
  });

  it('refuse une présentation trop longue', () => {
    expect(profileSchema.safeParse({ bio: 'a'.repeat(601) }).success).toBe(false);
  });
});

describe('inquirySchema', () => {
  const valid = {
    senderName: 'Alex Martin',
    senderEmail: 'alex@example.fr',
    senderPhone: '',
    message: 'Bonjour, je suis intéressé par ce studio pour la rentrée prochaine.',
    consent: true,
  };

  it('accepte une demande valide', () => {
    expect(inquirySchema.safeParse(valid).success).toBe(true);
  });

  it('refuse un message trop court', () => {
    expect(inquirySchema.safeParse({ ...valid, message: 'Bonjour' }).success).toBe(false);
  });

  it('exige le consentement RGPD', () => {
    expect(inquirySchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  });
});

describe('listingSchema', () => {
  const base = {
    title: 'Studio meublé proche du campus',
    description:
      'Studio de 24 m² entièrement meublé, cuisine équipée et Wi-Fi inclus, situé à dix minutes à pied de l’université.',
    propertyType: 'studio',
    priceEuros: '620',
    chargesIncluded: true,
    surfaceM2: '24',
    rooms: '1',
    bedrooms: '0',
    furnished: true,
    petsAllowed: false,
    postalCode: '69007',
    city: 'Lyon',
    amenities: ['wifi', 'meuble'],
  };

  it('convertit les champs numériques saisis en texte', () => {
    const result = listingSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priceEuros).toBe(620);
      expect(result.data.surfaceM2).toBe(24);
      expect(result.data.rooms).toBe(1);
    }
  });

  it('refuse un loyer négatif ou nul', () => {
    expect(listingSchema.safeParse({ ...base, priceEuros: '0' }).success).toBe(false);
    expect(listingSchema.safeParse({ ...base, priceEuros: '-100' }).success).toBe(false);
  });

  it('refuse un loyer excessif', () => {
    expect(listingSchema.safeParse({ ...base, priceEuros: '20000' }).success).toBe(false);
  });

  it('refuse une description trop courte', () => {
    expect(listingSchema.safeParse({ ...base, description: 'Trop court' }).success).toBe(false);
  });

  it('refuse un équipement inconnu', () => {
    expect(listingSchema.safeParse({ ...base, amenities: ['wifi', 'jacuzzi'] }).success).toBe(
      false,
    );
  });

  it('refuse un type de logement inconnu', () => {
    expect(listingSchema.safeParse({ ...base, propertyType: 'chateau' }).success).toBe(false);
  });

  it('refuse un code postal invalide', () => {
    expect(listingSchema.safeParse({ ...base, postalCode: '7500' }).success).toBe(false);
  });
});

describe('validateWithSchema', () => {
  it('retourne les données validées', () => {
    const result = validateWithSchema(emailSchema, 'test@example.fr');
    expect(result.success).toBe(true);
    expect(result.data).toBe('test@example.fr');
  });

  it('retourne un dictionnaire d’erreurs par champ', () => {
    const result = validateWithSchema(signUpSchema, {
      fullName: 'A',
      email: 'invalide',
      password: 'court',
      role: 'student',
      acceptTerms: false,
    });
    expect(result.success).toBe(false);
    expect(Object.keys(result.errors ?? {})).toEqual(
      expect.arrayContaining(['fullName', 'email', 'password', 'acceptTerms']),
    );
  });
});

describe('sanitizeText', () => {
  it('retire les balises HTML', () => {
    expect(sanitizeText('<script>alert(1)</script>Bonjour')).toBe('alert(1)Bonjour');
  });

  it('remplace les caractères de contrôle', () => {
    expect(sanitizeText('Bonjour\u0000le monde')).toBe('Bonjour le monde');
  });

  it('nettoie les espaces autour', () => {
    expect(sanitizeText('   Lyon   ')).toBe('Lyon');
  });
});

describe('containsHtml', () => {
  it('détecte une balise', () => {
    expect(containsHtml('<b>test</b>')).toBe(true);
  });

  it('accepte du texte simple', () => {
    expect(containsHtml('Studio 24 m² à Lyon')).toBe(false);
  });
});
