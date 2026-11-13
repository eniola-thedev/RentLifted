-- Admins can post RENTLIFTED's own listings (no fee, published directly; the app enforces 2-5 photos and 1-2 videos).
-- Approving a tenant for an admin-owned property creates no landlord payout: the rent belongs to RENTLIFTED.
create or replace function public.approve_application(aid uuid, start_on date, note text) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.applications; tid uuid;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select * into a from public.applications where id = aid for update;
  if a.id is null or a.status <> 'pending' then raise exception 'not pending'; end if;
  if not exists (select 1 from public.properties where id = a.property_id and status = 'published') then raise exception 'property not available'; end if;
  update public.applications set status = 'approved', decided_at = now(), review_note = nullif(trim(note), '') where id = aid;
  insert into public.tenancies (application_id, tenant_id, property_id, monthly_rent, start_date) values (a.id, a.tenant_id, a.property_id, a.monthly_rent, start_on) returning id into tid;
  insert into public.installments (tenancy_id, number, due_date, amount)
    select tid, n, (start_on + make_interval(months => n))::date, a.monthly_rent from generate_series(1, 12) n;
  insert into public.payouts (tenancy_id, landlord_id, amount)
    select tid, pr.owner_id, coalesce(a.annual_rent, a.monthly_rent * 12)
    from public.properties pr join public.profiles o on o.id = pr.owner_id
    where pr.id = a.property_id and o.role <> 'admin';
  update public.properties set status = 'rented' where id = a.property_id;
  update public.applications set status = 'declined', decided_at = now(), review_note = 'This property is no longer available.' where property_id = a.property_id and status = 'pending' and id <> aid;
end $$;
