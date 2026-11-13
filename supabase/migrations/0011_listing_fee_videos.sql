-- Listing fee (default ₦2,000 per property, paid once before the first review) and listing media rules:
-- 2 to 5 photos and 1 to 2 videos before a listing can be sent for review.

insert into public.platform_settings values ('listing_fee', 2000) on conflict (key) do nothing;

-- One fee per property. Written only by the server (service role) after Paystack confirms the payment.
create table public.listing_fees (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null unique references public.properties (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(14, 2) not null,
  reference text not null unique,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz not null default now(), paid_at timestamptz
);
alter table public.listing_fees enable row level security;
create policy "own listing fees" on public.listing_fees for select using (owner_id = auth.uid() or public.is_admin());

-- Videos, stored like photos but in their own public bucket with a 50 MB limit.
create table public.property_videos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  path text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);
alter table public.property_videos enable row level security;
create policy "videos follow property read" on public.property_videos for select
  using (exists (select 1 from public.properties p where p.id = property_id and (p.status = 'published' or p.owner_id = auth.uid() or public.is_admin())));
create policy "owner manages videos" on public.property_videos for all
  using (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-videos', 'property-videos', true, 52428800, array['video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do nothing;
create policy "upload own property videos" on storage.objects for insert to authenticated
  with check (bucket_id = 'property-videos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own property videos" on storage.objects for delete to authenticated
  using (bucket_id = 'property-videos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Caps: at most 5 photos and 2 videos per listing.
create function public.cap_listing_media() returns trigger language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if tg_table_name = 'property_images' then
    select count(*) into n from public.property_images where property_id = new.property_id;
    if n >= 5 then raise exception 'A listing can have up to 5 photos.'; end if;
  else
    select count(*) into n from public.property_videos where property_id = new.property_id;
    if n >= 2 then raise exception 'A listing can have up to 2 videos.'; end if;
  end if;
  return new;
end $$;
create trigger cap_images before insert on public.property_images for each row execute function public.cap_listing_media();
create trigger cap_videos before insert on public.property_videos for each row execute function public.cap_listing_media();

-- What a listing still needs before review, as a list of short codes (empty = ready).
create function public.listing_missing(pid uuid) returns text[] language sql stable security definer set search_path = '' as $$
  select array_remove(array[
    case when not exists (select 1 from public.listing_fees f where f.property_id = pid and f.status = 'paid') then 'fee' end,
    case when (select count(*) from public.property_images where property_id = pid) not between 2 and 5 then 'photos' end,
    case when (select count(*) from public.property_videos where property_id = pid) not between 1 and 2 then 'videos' end
  ], null);
$$;
grant execute on function public.listing_missing(uuid) to authenticated;

-- A landlord can only send a listing for review once it has the fee and the right media.
create function public.guard_listing_submit() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'pending_review' and auth.uid() is not null and not public.is_admin() then
    if tg_op = 'INSERT' or cardinality(public.listing_missing(new.id)) > 0 then
      raise exception 'listing not ready';
    end if;
  end if;
  return new;
end $$;
create trigger guard_listing_submit before insert or update on public.properties for each row execute function public.guard_listing_submit();
