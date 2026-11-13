-- RENTLIFTED: foundation schema (profiles, KYC, properties) with row-level security.
create type public.user_role as enum ('tenant', 'landlord', 'admin');
create type public.review_status as enum ('pending', 'approved', 'rejected');
create type public.property_type as enum ('apartment', 'house', 'duplex', 'land');
create type public.listing_purpose as enum ('rent', 'sale');
create type public.listing_status as enum ('draft', 'pending_review', 'published', 'rented', 'sold', 'archived');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'tenant',
  full_name text,
  phone text,
  kyc_level smallint not null default 0 check (kyc_level between 0 and 3),
  created_at timestamptz not null default now()
);

-- Admin check used by policies. SECURITY DEFINER avoids recursive RLS on profiles.
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Create a profile on signup. Only tenant or landlord can be chosen; admin is set by hand in the database.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'role' = 'landlord' then 'landlord'::public.user_role else 'tenant'::public.user_role end,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
-- Users may only change name and phone. Role and kyc_level change only through the service role or an admin.
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

create table public.kyc_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  level smallint not null check (level between 1 and 3),
  doc_type text not null,
  document_path text,          -- file in the private kyc-documents bucket
  provider_ref text,           -- reference from the KYC provider, if used
  status public.review_status not null default 'pending',
  reviewer_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
alter table public.kyc_submissions enable row level security;
create policy "read own kyc" on public.kyc_submissions for select using (user_id = auth.uid() or public.is_admin());
create policy "submit own kyc" on public.kyc_submissions for insert with check (user_id = auth.uid() and status = 'pending');
create policy "admin reviews kyc" on public.kyc_submissions for update using (public.is_admin());

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  purpose public.listing_purpose not null,
  property_type public.property_type not null,
  bedrooms smallint, bathrooms smallint, land_size_sqm numeric(12, 2),
  state text not null, city text not null, area text, address text,
  annual_rent numeric(14, 2),
  monthly_rent_available boolean not null default false,
  sale_price numeric(16, 2),
  status public.listing_status not null default 'draft',
  created_at timestamptz not null default now(),
  check (purpose <> 'rent' or annual_rent is not null),
  check (purpose <> 'sale' or sale_price is not null),
  check (not monthly_rent_available or purpose = 'rent')
);
create index on public.properties (status, purpose, city);
alter table public.properties enable row level security;
create policy "public reads published" on public.properties for select using (status = 'published');
create policy "owner reads own" on public.properties for select using (owner_id = auth.uid() or public.is_admin());
-- Landlords need KYC level 1 to create listings, and can never publish: an admin approves.
create policy "landlord creates" on public.properties for insert with check (
  owner_id = auth.uid() and status in ('draft', 'pending_review')
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'landlord' and p.kyc_level >= 1)
);
create policy "landlord edits own" on public.properties for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid() and status in ('draft', 'pending_review', 'archived'));
create policy "admin manages listings" on public.properties for all using (public.is_admin()) with check (public.is_admin());

create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  path text not null,
  position smallint not null default 0
);
alter table public.property_images enable row level security;
create policy "images follow property read" on public.property_images for select
  using (exists (select 1 from public.properties p where p.id = property_id and (p.status = 'published' or p.owner_id = auth.uid() or public.is_admin())));
create policy "owner manages images" on public.property_images for all
  using (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()));

-- Storage: public property photos, private KYC documents (each user writes only into a folder named by their user id).
insert into storage.buckets (id, name, public) values ('property-images', 'property-images', true), ('kyc-documents', 'kyc-documents', false);
create policy "upload own property images" on storage.objects for insert to authenticated
  with check (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own kyc files" on storage.objects for all to authenticated
  using (bucket_id = 'kyc-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()))
  with check (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);
