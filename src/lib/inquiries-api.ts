import { supabase, isSupabaseConfigured } from './supabase';
import { config } from './config';
import { ApiError } from './api-error';
import { translateDataError } from './auth-errors';
import { readDemoInquiries, writeDemoInquiries, allDemoListings } from './demo-store';
import { isUuid } from './listings-api';
import type { Inquiry, InquiryStatus } from '@/types/domain';
import type { InquiryInput } from './validation';

function isDemo(): boolean {
  return config.demoMode || !isSupabaseConfigured || !supabase;
}

export interface InquiryWithListing extends Inquiry {
  listing_title: string;
  listing_city: string;
}

/** Enregistre une demande de logement. Fonctionne sans compte (visiteur). */
export async function createInquiry(
  listingId: string,
  input: InquiryInput,
  studentId: string | null,
): Promise<void> {
  const payload = {
    listing_id: listingId,
    student_id: studentId,
    sender_name: input.senderName.trim(),
    sender_email: input.senderEmail.trim().toLowerCase(),
    sender_phone: input.senderPhone?.trim() || null,
    message: input.message.trim(),
  };

  if (isDemo()) {
    const inquiries = readDemoInquiries();
    writeDemoInquiries([
      {
        id: `demo-inquiry-${Date.now()}`,
        status: 'new',
        created_at: new Date().toISOString(),
        ...payload,
      },
      ...inquiries,
    ]);
    return;
  }

  const client = supabase;
  if (!client) throw new ApiError('Supabase n’est pas configuré.');
  if (!isUuid(listingId)) throw new ApiError('Identifiant d’annonce invalide.', 'invalid_id');

  const { error } = await client.from('inquiries').insert(payload);
  if (error) throw new ApiError(translateDataError(error), error.code);
}

/** Demandes envoyées par un étudiant connecté. */
export async function getMyInquiries(studentId: string): Promise<InquiryWithListing[]> {
  if (isDemo()) {
    const listings = allDemoListings();
    return readDemoInquiries()
      .filter((inquiry) => inquiry.student_id === studentId)
      .map((inquiry) => {
        const listing = listings.find((item) => item.id === inquiry.listing_id);
        return {
          ...inquiry,
          listing_title: listing?.title ?? 'Annonce supprimée',
          listing_city: listing?.city ?? '—',
        };
      });
  }

  const client = supabase;
  if (!client) throw new ApiError('Supabase n’est pas configuré.');

  const { data, error } = await client
    .from('inquiries')
    .select('*, listings(title, city)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw new ApiError(translateDataError(error), error.code);

  return ((data ?? []) as (Inquiry & { listings: { title: string; city: string } | null })[]).map(
    (row) => ({
      ...row,
      listing_title: row.listings?.title ?? 'Annonce supprimée',
      listing_city: row.listings?.city ?? '—',
    }),
  );
}

/** Demandes reçues par un bailleur, toutes annonces confondues. */
export async function getReceivedInquiries(ownerId: string): Promise<InquiryWithListing[]> {
  if (isDemo()) {
    const myListings = allDemoListings().filter((listing) => listing.owner_id === ownerId);
    const ids = new Set(myListings.map((listing) => listing.id));
    return readDemoInquiries()
      .filter((inquiry) => ids.has(inquiry.listing_id))
      .map((inquiry) => {
        const listing = myListings.find((item) => item.id === inquiry.listing_id);
        return {
          ...inquiry,
          listing_title: listing?.title ?? 'Annonce supprimée',
          listing_city: listing?.city ?? '—',
        };
      });
  }

  const client = supabase;
  if (!client) throw new ApiError('Supabase n’est pas configuré.');

  // RLS restreint déjà l'accès aux demandes des annonces du bailleur.
  const { data, error } = await client
    .from('inquiries')
    .select('*, listings!inner(title, city, owner_id)')
    .eq('listings.owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) throw new ApiError(translateDataError(error), error.code);

  return ((data ?? []) as (Inquiry & { listings: { title: string; city: string } | null })[]).map(
    (row) => ({
      ...row,
      listing_title: row.listings?.title ?? 'Annonce supprimée',
      listing_city: row.listings?.city ?? '—',
    }),
  );
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
  if (isDemo()) {
    const inquiries = readDemoInquiries();
    writeDemoInquiries(
      inquiries.map((inquiry) => (inquiry.id === id ? { ...inquiry, status } : inquiry)),
    );
    return;
  }

  const client = supabase;
  if (!client) throw new ApiError('Supabase n’est pas configuré.');
  if (!isUuid(id)) throw new ApiError('Identifiant de demande invalide.', 'invalid_id');

  const { error } = await client.from('inquiries').update({ status }).eq('id', id);
  if (error) throw new ApiError(translateDataError(error), error.code);
}

/** Toutes les demandes, pour la modération. Réservé au staff (RLS). */
export async function getAllInquiriesForStaff(): Promise<InquiryWithListing[]> {
  if (isDemo()) {
    const listings = allDemoListings();
    return readDemoInquiries().map((inquiry) => {
      const listing = listings.find((item) => item.id === inquiry.listing_id);
      return {
        ...inquiry,
        listing_title: listing?.title ?? 'Annonce supprimée',
        listing_city: listing?.city ?? '—',
      };
    });
  }

  const client = supabase;
  if (!client) throw new ApiError('Supabase n’est pas configuré.');

  const { data, error } = await client
    .from('inquiries')
    .select('*, listings(title, city)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw new ApiError(translateDataError(error), error.code);

  return ((data ?? []) as (Inquiry & { listings: { title: string; city: string } | null })[]).map(
    (row) => ({
      ...row,
      listing_title: row.listings?.title ?? 'Annonce supprimée',
      listing_city: row.listings?.city ?? '—',
    }),
  );
}
