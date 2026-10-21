import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Save, Trash2 } from 'lucide-react';
import { useAuth } from '@/auth/auth-context';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  attachPhoto,
  createListing,
  getListingById,
  listingToInput,
  removePhoto,
  resolvePhotoUrl,
  updateListing,
  uploadListingPhoto,
  validatePhotoFile,
} from '@/lib/listings-api';
import { toUserMessage } from '@/lib/api-error';
import { listingSchema, validateWithSchema } from '@/lib/validation';
import { AMENITY_LABELS } from '@/lib/format';
import type { ListingAmenity, ListingPhoto, ListingWithPhotos, PropertyType } from '@/types/domain';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { TextField, TextAreaField, SelectField, CheckboxField } from '@/components/ui/FormField';
import { PageLoader, ErrorState } from '@/components/ui/Feedback';

interface FormState {
  title: string;
  description: string;
  propertyType: PropertyType;
  priceEuros: string;
  chargesIncluded: boolean;
  depositEuros: string;
  surfaceM2: string;
  rooms: string;
  bedrooms: string;
  furnished: boolean;
  petsAllowed: boolean;
  availableFrom: string;
  addressLine: string;
  postalCode: string;
  city: string;
  amenities: ListingAmenity[];
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  propertyType: 'studio',
  priceEuros: '',
  chargesIncluded: false,
  depositEuros: '',
  surfaceM2: '',
  rooms: '1',
  bedrooms: '0',
  furnished: false,
  petsAllowed: false,
  availableFrom: '',
  addressLine: '',
  postalCode: '',
  city: '',
  amenities: [],
};

export function ListingFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user, isOwner, isStaff } = useAuth();

  useDocumentTitle(isEdit ? 'Modifier une annonce' : 'Publier une annonce');

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [listing, setListing] = useState<ListingWithPhotos | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setLoadError(null);

    getListingById(id)
      .then((found) => {
        if (!active) return;
        if (!found) {
          setNotFound(true);
          return;
        }
        setListing(found);
        const input = listingToInput(found);
        setForm({
          title: input.title,
          description: input.description,
          propertyType: input.propertyType,
          priceEuros: String(input.priceEuros),
          chargesIncluded: input.chargesIncluded,
          depositEuros: input.depositEuros === undefined ? '' : String(input.depositEuros),
          surfaceM2: input.surfaceM2 ? String(input.surfaceM2) : '',
          rooms: String(input.rooms),
          bedrooms: String(input.bedrooms),
          furnished: input.furnished,
          petsAllowed: input.petsAllowed,
          availableFrom: input.availableFrom ?? '',
          addressLine: input.addressLine ?? '',
          postalCode: input.postalCode,
          city: input.city,
          amenities: input.amenities,
        });
      })
      .catch(() => {
        if (active) setLoadError('Cette annonce n’a pas pu être chargée.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  };

  const toggleAmenity = (amenity: ListingAmenity) => {
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGlobalError(null);

    if (!user) {
      setGlobalError('Vous devez être connecté.');
      return;
    }

    // Les champs facultatifs laissés vides ne doivent pas être envoyés comme
    // chaînes vides (sinon la validation de date ou le montant serait faussé).
    const payload = {
      ...form,
      availableFrom: form.availableFrom || undefined,
      depositEuros: form.depositEuros.trim() === '' ? undefined : form.depositEuros,
      addressLine: form.addressLine.trim() === '' ? undefined : form.addressLine,
    };

    const validation = validateWithSchema(listingSchema, payload);
    if (!validation.success || !validation.data) {
      setErrors(validation.errors ?? {});
      setGlobalError('Certains champs nécessitent votre attention.');
      return;
    }
    setErrors({});

    setSaving(true);
    try {
      if (isEdit && id) {
        await updateListing(id, validation.data, user.id);
        navigate(`/mon-espace/annonces/${id}/modifier`, { replace: true });
        const refreshed = await getListingById(id);
        setListing(refreshed);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const created = await createListing(validation.data, user.id);
        navigate(`/mon-espace/annonces/${created.id}/modifier`, { replace: true });
      }
    } catch (cause) {
      setGlobalError(toUserMessage(cause, 'L’enregistrement de l’annonce a échoué.'));
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !listing || !user) return;

    const check = validatePhotoFile(file);
    if (!check.valid) {
      setPhotoError(check.message ?? 'Fichier invalide.');
      return;
    }

    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      const { storagePath } = await uploadListingPhoto(listing.id, user.id, file);
      await attachPhoto(
        listing.id,
        storagePath,
        listing.listing_photos.length,
        `Photo de ${listing.title}`,
      );
      const refreshed = await getListingById(listing.id);
      setListing(refreshed);
    } catch (cause) {
      setPhotoError(toUserMessage(cause, 'L’envoi de la photo a échoué.'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async (photo: ListingPhoto) => {
    if (!window.confirm('Supprimer cette photo ?')) return;
    try {
      await removePhoto(photo.id, photo.storage_path);
      const refreshed = listing ? await getListingById(listing.id) : null;
      setListing(refreshed);
    } catch (cause) {
      setPhotoError(toUserMessage(cause, 'La suppression de la photo a échoué.'));
    }
  };

  if (!isOwner && !isStaff) {
    return (
      <div className="container-page py-16">
        <ErrorState
          title="Accès réservé aux bailleurs"
          description="La publication d’annonces est réservée aux comptes de type « Bailleur ». Créez un compte bailleur pour continuer."
        />
        <p className="mt-6 text-center">
          <Link to="/inscription" className="text-sm font-semibold underline underline-offset-2">
            Créer un compte bailleur
          </Link>
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-page">
        <PageLoader label="Chargement de l’annonce…" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container-page py-16">
        <ErrorState
          title="Annonce introuvable"
          description="Cette annonce n’existe pas ou ne vous appartient pas."
        />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container-page py-16">
        <ErrorState description={loadError} />
      </div>
    );
  }

  return (
    <div className="container-page max-w-4xl py-10">
      <Link
        to="/mon-espace"
        className="text-ink-600 hover:text-ink-950 mb-6 inline-flex items-center gap-1.5 text-sm font-medium"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour à mon espace
      </Link>

      <header className="mb-6">
        <h1 className="font-display text-ink-950 text-3xl font-bold">
          {isEdit ? 'Modifier l’annonce' : 'Publier une annonce'}
        </h1>
        <p className="text-ink-600 mt-1 text-sm">
          Votre annonce sera relue par notre équipe avant publication. Comptez jusqu’à 48 heures.
        </p>
      </header>

      {listing?.status === 'published' ? (
        <Alert tone="success" className="mb-6" title="Annonce publiée">
          Toute modification la repassera en attente de validation.
        </Alert>
      ) : null}
      {listing?.status === 'pending' ? (
        <Alert tone="warning" className="mb-6" title="En attente de validation">
          Votre annonce est en cours de relecture.
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        {globalError ? <Alert tone="error">{globalError}</Alert> : null}

        <section className="card space-y-4 p-6">
          <h2 className="font-display text-ink-950 text-lg font-semibold">Le logement</h2>

          <TextField
            label="Titre de l’annonce"
            required
            value={form.title}
            error={errors.title}
            hint="10 à 120 caractères. Ex. « Studio meublé de 24 m² proche du campus »."
            onChange={(event) => setField('title', event.target.value)}
            maxLength={120}
          />

          <TextAreaField
            label="Description"
            required
            rows={7}
            value={form.description}
            error={errors.description}
            hint="50 à 4000 caractères. Décrivez le logement, le quartier, les transports et les charges."
            onChange={(event) => setField('description', event.target.value)}
            maxLength={4000}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Type de logement"
              required
              value={form.propertyType}
              error={errors.propertyType}
              onChange={(event) => setField('propertyType', event.target.value as PropertyType)}
            >
              <option value="studio">Studio</option>
              <option value="appartement">Appartement</option>
              <option value="colocation">Colocation</option>
              <option value="chambre">Chambre</option>
              <option value="residence">Résidence étudiante</option>
            </SelectField>

            <TextField
              label="Surface (m²)"
              required
              type="number"
              min={5}
              max={1000}
              step={0.5}
              value={form.surfaceM2}
              error={errors.surfaceM2}
              onChange={(event) => setField('surfaceM2', event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Nombre de pièces"
              type="number"
              min={1}
              max={20}
              value={form.rooms}
              error={errors.rooms}
              onChange={(event) => setField('rooms', event.target.value)}
            />
            <TextField
              label="Nombre de chambres"
              type="number"
              min={0}
              max={20}
              value={form.bedrooms}
              error={errors.bedrooms}
              onChange={(event) => setField('bedrooms', event.target.value)}
            />
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="font-display text-ink-950 text-lg font-semibold">Loyer et conditions</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Loyer mensuel (€)"
              required
              type="number"
              min={100}
              max={10000}
              step={1}
              value={form.priceEuros}
              error={errors.priceEuros}
              onChange={(event) => setField('priceEuros', event.target.value)}
            />
            <TextField
              label="Dépôt de garantie (€)"
              type="number"
              min={0}
              max={20000}
              step={1}
              value={form.depositEuros}
              error={errors.depositEuros}
              hint="Laissez vide si non applicable."
              onChange={(event) => setField('depositEuros', event.target.value)}
            />
          </div>

          <CheckboxField
            label="Les charges sont comprises dans le loyer"
            checked={form.chargesIncluded}
            onChange={(checked) => setField('chargesIncluded', checked)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Disponible à partir du"
              type="date"
              value={form.availableFrom}
              error={errors.availableFrom}
              onChange={(event) => setField('availableFrom', event.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <CheckboxField
              label="Logement meublé"
              checked={form.furnished}
              onChange={(checked) => setField('furnished', checked)}
            />
            <CheckboxField
              label="Animaux acceptés"
              checked={form.petsAllowed}
              onChange={(checked) => setField('petsAllowed', checked)}
            />
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="font-display text-ink-950 text-lg font-semibold">Localisation</h2>

          <TextField
            label="Adresse (facultatif)"
            value={form.addressLine}
            error={errors.addressLine}
            hint="L’adresse exacte n’est affichée qu’aux utilisateurs connectés si vous le souhaitez."
            onChange={(event) => setField('addressLine', event.target.value)}
            maxLength={160}
          />

          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <TextField
              label="Code postal"
              required
              inputMode="numeric"
              value={form.postalCode}
              error={errors.postalCode}
              onChange={(event) =>
                setField('postalCode', event.target.value.replace(/\D/g, '').slice(0, 5))
              }
              maxLength={5}
            />
            <TextField
              label="Ville"
              required
              value={form.city}
              error={errors.city}
              onChange={(event) => setField('city', event.target.value)}
              maxLength={80}
            />
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="font-display text-ink-950 text-lg font-semibold">Équipements</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(AMENITY_LABELS) as ListingAmenity[]).map((amenity) => (
              <CheckboxField
                key={amenity}
                label={AMENITY_LABELS[amenity]}
                checked={form.amenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
              />
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            loading={saving}
            icon={<Save className="h-4 w-4" aria-hidden="true" />}
          >
            {isEdit ? 'Enregistrer les modifications' : 'Soumettre l’annonce'}
          </Button>
          <Link
            to="/mon-espace"
            className="text-ink-600 hover:text-ink-950 text-sm font-medium underline underline-offset-2"
          >
            Annuler
          </Link>
        </div>
      </form>

      {isEdit && listing ? (
        <section className="card mt-8 space-y-4 p-6">
          <div>
            <h2 className="font-display text-ink-950 text-lg font-semibold">Photos</h2>
            <p className="text-ink-500 mt-1 text-xs">
              JPEG, PNG ou WebP — 5 Mo maximum par image. La première photo sert de vignette.
            </p>
          </div>

          {photoError ? <Alert tone="error">{photoError}</Alert> : null}

          {listing.listing_photos.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-3">
              {listing.listing_photos.map((photo) => (
                <li
                  key={photo.id}
                  className="group border-ink-100 relative overflow-hidden rounded-xl border"
                >
                  <img
                    src={resolvePhotoUrl(photo.storage_path)}
                    alt={photo.alt_text ?? 'Photo de l’annonce'}
                    className="h-32 w-full object-cover"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    onClick={() => void handlePhotoDelete(photo)}
                    className="absolute top-2 right-2 rounded-full bg-white/95 p-1.5 text-red-700 shadow-sm transition hover:bg-white"
                    aria-label="Supprimer cette photo"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-500 text-sm">Aucune photo pour le moment.</p>
          )}

          <label
            className={`border-ink-200 text-ink-800 hover:bg-ink-50 inline-flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold transition ${
              uploadingPhoto ? 'cursor-wait opacity-60' : ''
            }`}
          >
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {uploadingPhoto ? 'Envoi en cours…' : 'Ajouter une photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={uploadingPhoto}
              onChange={(event) => void handlePhoto(event)}
            />
          </label>

          {!isEdit ? (
            <p className="text-ink-500 text-xs">
              Enregistrez d’abord l’annonce pour pouvoir ajouter des photos.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
