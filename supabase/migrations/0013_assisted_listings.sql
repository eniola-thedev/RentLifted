-- Assisted listings: an admin meets a landlord in person, records their details, ID, proof of ownership and bank
-- account, and lists the property for them. These landlords have no account; admins manage the listing. No listing fee.

-- Landlords without an account. Admin-only: ID numbers and bank details are private.
create table public.offline_landlords (
  id uuid primary key default gen_random_uuid(),
  full_name text not null, phone text not null, email text, address text,
  id_type text check (id_type in ('nin', 'drivers_licence', 'passport', 'voters_card')), id_number text,
  id_files text[] not null default '{}',          -- photos in the private kyc-documents bucket
  bank_code text, bank_name text, account_number text, account_name text, -- account_name is confirmed with Paystack
  created_by uuid references public.profiles (id), created_at timestamptz not null default now()
);
alter table public.offline_landlords enable row level security;
create policy "admins manage offline landlords" on public.offline_landlords for all using (public.is_admin()) with check (public.is_admin());

-- Which listings were made for which offline landlord, plus that property's proof of ownership. Admin-only.
create table public.assisted_listings (
  property_id uuid primary key references public.properties (id) on delete cascade,
  landlord_id uuid not null references public.offline_landlords (id),
  ownership_files text[] not null default '{}',   -- photos in the private kyc-documents bucket
  created_at timestamptz not null default now()
);
alter table public.assisted_listings enable row level security;
create policy "admins manage assisted listings" on public.assisted_listings for all using (public.is_admin()) with check (public.is_admin());

-- Any admin can manage photos and videos on admin-made listings, not just the admin who created them.
create policy "admins manage images" on public.property_images for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage videos" on public.property_videos for all using (public.is_admin()) with check (public.is_admin());
create policy "admins delete listing media files" on storage.objects for delete to authenticated
  using (bucket_id in ('property-images', 'property-videos') and public.is_admin());

-- A payout goes to either a landlord with an account or an offline landlord.
alter table public.payouts alter column landlord_id drop not null;
alter table public.payouts add column offline_landlord_id uuid references public.offline_landlords (id);
alter table public.payouts add constraint payout_has_one_landlord check ((landlord_id is null) <> (offline_landlord_id is null));

create or replace function public.approve_application(aid uuid, start_on date, note text) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.applications; tid uuid; owner_role public.user_role; offline uuid; annual numeric;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select * into a from public.applications where id = aid for update;
  if a.id is null or a.status <> 'pending' then raise exception 'not pending'; end if;
  if not exists (select 1 from public.properties where id = a.property_id and status = 'published') then raise exception 'property not available'; end if;
  update public.applications set status = 'approved', decided_at = now(), review_note = nullif(trim(note), '') where id = aid;
  insert into public.tenancies (application_id, tenant_id, property_id, monthly_rent, start_date) values (a.id, a.tenant_id, a.property_id, a.monthly_rent, start_on) returning id into tid;
  insert into public.installments (tenancy_id, number, due_date, amount)
    select tid, n, (start_on + make_interval(months => n))::date, a.monthly_rent from generate_series(1, 12) n;
  annual := coalesce(a.annual_rent, a.monthly_rent * 12);
  select o.role into owner_role from public.properties pr join public.profiles o on o.id = pr.owner_id where pr.id = a.property_id;
  select landlord_id into offline from public.assisted_listings where property_id = a.property_id;
  if offline is not null then          -- listed by an admin for an offline landlord: pay that landlord
    insert into public.payouts (tenancy_id, offline_landlord_id, amount) values (tid, offline, annual);
  elsif owner_role <> 'admin' then     -- a landlord's own listing
    insert into public.payouts (tenancy_id, landlord_id, amount) select tid, owner_id, annual from public.properties where id = a.property_id;
  end if;                              -- otherwise RENTLIFTED's own property: no payout
  update public.properties set status = 'rented' where id = a.property_id;
  update public.applications set status = 'declined', decided_at = now(), review_note = 'This property is no longer available.' where property_id = a.property_id and status = 'pending' and id <> aid;
end $$;

-- Approved tenants see the real landlord's name and phone, including for assisted listings.
create or replace view public.tenant_applications as
  select a.id, a.property_id, pr.title as property_title, pr.area, pr.city, a.status, a.monthly_rent, a.affordability, a.review_note, a.created_at,
         case when a.status = 'approved' then pr.address end as address,
         case when a.status = 'approved' then coalesce(ol.full_name, lp.full_name) end as landlord_name,
         case when a.status = 'approved' then coalesce(ol.phone, lp.phone) end as landlord_phone
  from public.applications a join public.properties pr on pr.id = a.property_id join public.profiles lp on lp.id = pr.owner_id
  left join public.assisted_listings al on al.property_id = pr.id left join public.offline_landlords ol on ol.id = al.landlord_id
  where a.tenant_id = auth.uid();
