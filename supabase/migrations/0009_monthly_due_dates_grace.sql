-- Rent is due on the same day each month (14 Feb -> 14 Mar), with a grace period (default 5 days) before it counts as overdue.
-- During grace the wallet is still debited as soon as it covers the rent; the card fallback and "overdue" only start after grace.

insert into public.platform_settings values ('rent_grace_days', 5) on conflict (key) do nothing;

create function public.rent_grace_days() returns int language sql stable security definer set search_path = '' as $$
  select coalesce((select value::int from public.platform_settings where key = 'rent_grace_days'), 5);
$$;
grant execute on function public.rent_grace_days() to authenticated;

-- Same calendar day each month, counted from the start date (31 Jan -> 28 Feb -> 31 Mar).
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
    select tid, pr.owner_id, coalesce(a.annual_rent, a.monthly_rent * 12) from public.properties pr where pr.id = a.property_id;
  update public.properties set status = 'rented' where id = a.property_id;
  update public.applications set status = 'declined', decided_at = now(), review_note = 'This property is no longer available.' where property_id = a.property_id and status = 'pending' and id <> aid;
end $$;

-- Overdue only once the grace period has passed.
create or replace function public.process_rent_due() returns int language plpgsql security definer set search_path = '' as $$
declare i record; bal numeric; n int := 0; today date := (now() at time zone 'Africa/Lagos')::date; grace int := public.rent_grace_days();
begin
  for i in select inst.id, inst.amount, inst.due_date, t.tenant_id from public.installments inst join public.tenancies t on t.id = inst.tenancy_id
           where inst.status in ('scheduled', 'overdue') and inst.due_date <= today and t.status = 'active' order by inst.due_date, inst.number loop
    perform pg_advisory_xact_lock(hashtext(i.tenant_id::text));
    select coalesce(sum(amount), 0) into bal from public.wallet_entries where user_id = i.tenant_id;
    if bal >= i.amount then
      insert into public.wallet_entries (user_id, amount, kind, reference, installment_id) values (i.tenant_id, -i.amount, 'rent_payment', 'inst_' || i.id, i.id) on conflict (reference) do nothing;
      update public.installments set status = 'paid', paid_at = now() where id = i.id;
      n := n + 1;
    elsif i.due_date + grace < today then
      update public.installments set status = 'overdue' where id = i.id and status = 'scheduled';
    end if;
  end loop;
  return n;
end $$;
revoke all on function public.process_rent_due() from public, anon, authenticated;

-- The saved card is only charged after the grace period ends.
create or replace function public.due_shortfalls() returns table (installment_id uuid, tenant_id uuid, email text, shortfall numeric)
language sql stable security definer set search_path = '' as $$
  select distinct on (t.tenant_id) i.id, t.tenant_id, u.email::text, i.amount - coalesce(b.bal, 0)
  from public.installments i
  join public.tenancies t on t.id = i.tenancy_id
  join auth.users u on u.id = t.tenant_id
  left join (select user_id, sum(amount) bal from public.wallet_entries group by user_id) b on b.user_id = t.tenant_id
  where t.status = 'active' and i.status in ('scheduled', 'overdue')
    and i.due_date + public.rent_grace_days() < (now() at time zone 'Africa/Lagos')::date
    and i.amount > coalesce(b.bal, 0)
    and (select count(*) from public.charge_attempts c where c.installment_id = i.id) < 3
    and not exists (select 1 from public.charge_attempts c where c.installment_id = i.id and (c.created_at at time zone 'Africa/Lagos')::date = (now() at time zone 'Africa/Lagos')::date)
  order by t.tenant_id, i.due_date, i.number;
$$;

-- Adds a "last day of grace" reminder.
create or replace function public.reminder_candidates() returns table (installment_id uuid, kind text, email text, full_name text, amount numeric, due_date date, balance numeric)
language sql stable security definer set search_path = '' as $$
  select * from (
    select i.id, case
        when i.status = 'scheduled' and i.due_date = (now() at time zone 'Africa/Lagos')::date + 3 then 'due_in_3'
        when i.status = 'scheduled' and i.due_date = (now() at time zone 'Africa/Lagos')::date then 'due_today'
        when i.status = 'scheduled' and i.due_date + public.rent_grace_days() = (now() at time zone 'Africa/Lagos')::date then 'grace_last_day'
        when i.status = 'overdue' then 'overdue' end as kind,
      u.email::text, p.full_name, i.amount, i.due_date,
      coalesce((select sum(w.amount) from public.wallet_entries w where w.user_id = t.tenant_id), 0) as balance
    from public.installments i join public.tenancies t on t.id = i.tenancy_id
    join auth.users u on u.id = t.tenant_id join public.profiles p on p.id = t.tenant_id
    where t.status = 'active' and i.status in ('scheduled', 'overdue')
  ) x where kind is not null;
$$;
revoke all on function public.due_shortfalls(), public.reminder_candidates() from public, anon, authenticated;

-- Move existing unpaid installments onto monthly dates, and clear "overdue" where the tenant is now still within grace.
update public.installments i set due_date = (t.start_date + make_interval(months => i.number))::date
  from public.tenancies t where t.id = i.tenancy_id and i.status in ('scheduled', 'overdue');
update public.installments set status = 'scheduled'
  where status = 'overdue' and due_date + public.rent_grace_days() >= (now() at time zone 'Africa/Lagos')::date;
