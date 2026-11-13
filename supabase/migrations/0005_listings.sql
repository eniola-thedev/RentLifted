-- Listings: review notes, KYC gates for landlords, and photo deletion.
alter table public.properties add column review_note text;

-- Level 1 can save drafts; level 2 can send a listing for review. Only an admin can publish.
drop policy "landlord creates" on public.properties;
create policy "landlord creates" on public.properties for insert with check (
  owner_id = auth.uid() and status in ('draft', 'pending_review')
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'landlord'
              and p.kyc_level >= case when status = 'pending_review' then 2 else 1 end));
drop policy "landlord edits own" on public.properties;
create policy "landlord edits own" on public.properties for update using (owner_id = auth.uid()) with check (
  owner_id = auth.uid() and status in ('draft', 'pending_review', 'archived')
  and (status <> 'pending_review' or exists (select 1 from public.profiles p where p.id = auth.uid() and p.kyc_level >= 2)));

-- Landlords can't set the monthly rent amount or the admin's review note.
create or replace function public.guard_monthly_rent() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.monthly_rent := case when tg_op = 'INSERT' then null else old.monthly_rent end;
    new.review_note := case when tg_op = 'INSERT' then null else old.review_note end;
  end if;
  return new;
end $$;

create policy "delete own property images" on storage.objects for delete to authenticated
  using (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);
