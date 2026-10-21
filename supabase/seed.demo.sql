-- ============================================================================
-- HTI-IMMO — Données de DÉMONSTRATION (développement uniquement)
-- ----------------------------------------------------------------------------
-- ⚠️  CE FICHIER N'EST PAS UNE MIGRATION ET N'EST JAMAIS EXÉCUTÉ AUTOMATIQUEMENT.
--
-- Objectif : peupler un environnement de test avec des annonces explicitement
-- marquées `is_demo = true` et préfixées « [EXEMPLE] » afin qu'elles ne soient
-- JAMAIS confondues avec de véritables offres de logement.
--
-- Prérequis : un compte bailleur doit exister avec l'e-mail ci-dessous.
--   1. Créez-le depuis l'application (inscription « Je propose un logement »)
--      ou depuis le dashboard Supabase : demo.bailleur@hti-immo.test
--   2. Exécutez ensuite, en LOCAL uniquement :
--      supabase db execute --file supabase/seed.demo.sql
--
-- Aucune donnée réelle n'est lue, modifiée ou supprimée par ce script.
-- ============================================================================

do $seed$
declare
  v_owner uuid;
  v_count int := 0;
begin
  select u.id into v_owner
  from auth.users u
  where lower(u.email) = 'demo.bailleur@hti-immo.test'
  limit 1;

  if v_owner is null then
    raise notice 'Compte demo.bailleur@hti-immo.test absent : aucune donnée de démonstration insérée.';
    return;
  end if;

  insert into public.listings (
    owner_id, title, description, property_type, status,
    price_cents, charges_included, deposit_cents, surface_m2, rooms, bedrooms,
    furnished, pets_allowed, available_from,
    address_line, postal_code, city, amenities, nearby_schools,
    contact_name, contact_email, is_demo, published_at
  )
  select
    v_owner, d.title, d.description, d.property_type::public.property_type, 'published',
    d.price_cents, d.charges_included, d.deposit_cents, d.surface_m2, d.rooms, d.bedrooms,
    d.furnished, d.pets_allowed, current_date + d.available_in_days,
    d.address_line, d.postal_code, d.city, d.amenities::text[], d.schools::text[],
    'Équipe démonstration HTI-IMMO', 'demo.bailleur@hti-immo.test', true, now()
  from (values
    (
      '[EXEMPLE] Studio meublé proche du campus — Lyon',
      'Annonce de démonstration. Studio meublé de 24 m², situé à dix minutes à pied de la fac. Cuisine équipée, Wi-Fi inclus, lave-linge dans la résidence. Charges comprises. Ce contenu illustre l''interface et ne correspond à aucune offre réelle.',
      'studio', 62000, true, 62000, 24.0, 1::smallint, 0::smallint,
      true, false, 30,
      '12 rue de la Démocratie', '69007', 'Lyon',
      '{wifi,cuisine_equipee,lave_linge,meuble}', '{universite-lyon-2}'
    ),
    (
      '[EXEMPLE] Colocation 3 chambres — Toulouse',
      'Annonce de démonstration. Chambre de 14 m² dans une colocation de trois personnes, proche du métro. Espaces communs meublés, balcon, internet fibre. Aucune visite ne peut être organisée pour cette annonce fictive.',
      'colocation', 45000, false, 45000, 14.0, 1::smallint, 1::smallint,
      true, true, 45,
      '8 avenue des Sciences', '31400', 'Toulouse',
      '{wifi,cuisine_equipee,balcon,meuble}', '{universite-toulouse-capitole}'
    ),
    (
      '[EXEMPLE] Appartement T2 — Nantes',
      'Annonce de démonstration. Appartement de 42 m² avec deux pièces, cuisine équipée et parking privatif. Idéal pour deux étudiants. Ce texte sert uniquement à valider la mise en page du catalogue.',
      'appartement', 78000, true, 78000, 42.0, 2::smallint, 1::smallint,
      false, false, 20,
      '25 boulevard de la Démocratie', '44300', 'Nantes',
      '{cuisine_equipee,parking,ascenseur,chauffage}', '{ecole-centrale-nantes}'
    ),
    (
      '[EXEMPLE] Chambre en résidence étudiante — Paris 13e',
      'Annonce de démonstration. Chambre de 18 m² en résidence avec espaces communs, salle de sport et Wi-Fi haut débit. Données fictives destinées à l''évaluation de la plateforme.',
      'residence', 89000, true, 0, 18.0, 1::smallint, 1::smallint,
      true, false, 15,
      '4 rue de la Démocratie', '75013', 'Paris',
      '{wifi,lave_linge,ascenseur,digicode,handicap_access}', '{universite-paris-saclay}'
    ),
    (
      '[EXEMPLE] Studio 20 m² — Bordeaux',
      'Annonce de démonstration. Studio lumineux de 20 m² proche du tramway, entièrement meublé, avec kitchenette équipée. Contenu fictif, aucune démarche locative possible.',
      'studio', 55000, false, 55000, 20.0, 1::smallint, 0::smallint,
      true, false, 60,
      '19 rue de la Démocratie', '33800', 'Bordeaux',
      '{wifi,meuble,cuisine_equipee,chauffage}', '{universite-bordeaux}'
    ),
    (
      '[EXEMPLE] Appartement T3 en colocation — Lille',
      'Annonce de démonstration. Appartement de 65 m² partagé par trois étudiants, deux chambres disponibles, cuisine équipée, balcon et cave. Contenu fictif pour tester les filtres du catalogue.',
      'colocation', 52000, true, 52000, 65.0, 3::smallint, 3::smallint,
      true, true, 40,
      '31 rue de la Démocratie', '59000', 'Lille',
      '{wifi,lave_linge,cuisine_equipee,balcon,meuble}', '{universite-lille}'
    )
  ) as d(
    title, description, property_type, price_cents, charges_included, deposit_cents,
    surface_m2, rooms, bedrooms, furnished, pets_allowed, available_in_days,
    address_line, postal_code, city, amenities, schools
  )
  where not exists (
    select 1 from public.listings l where l.title = d.title
  );

  get diagnostics v_count = row_count;
  raise notice '% annonce(s) de démonstration insérée(s).', v_count;
end
$seed$;
