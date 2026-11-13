-- Applications, affordability, tenancies with monthly installments, and the tenant wallet.

create table public.platform_settings (key text primary key, value numeric not null);
insert into public.platform_settings values ('rent_income_comfortable_pct', 25), ('rent_income_max_pct', 30);
alter table public.platform_settings enable row level security;
create policy "anyone reads settings" on public.platform_settings for select using (true);
create policy "admin edits settings" on public.platform_settings for all using (public.is_admin()) with check (public.is_admin());

-- One source of truth for the rule: monthly rent must be at most 30% of the tenant's verified salary (25% or less is "comfortable").
-- The salary used is the bottom of the tenant's approved salary range, so the check is conservative.
create function public.affordability(pid uuid, uid uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare rent numeric; sal numeric; cap numeric; comf numeric; ratio numeric;
begin
  select monthly_rent into rent from public.properties where id = pid and status = 'published' and monthly_rent_available and monthly_rent is not null;
  if rent is null then return jsonb_build_object('available', false); end if;
  select coalesce((data ->> 'salary_min')::numeric, 0) into sal from public.kyc_submissions
    where user_id = uid and kind = 'work' and status = 'approved' order by created_at desc limit 1;
  sal := coalesce(sal, 0);
  select value into cap from public.platform_settings where key = 'rent_income_max_pct';
  select value into comf from public.platform_settings where key = 'rent_income_comfortable_pct';
  ratio := case when sal > 0 then round(rent / sal * 100, 1) end;
  return jsonb_build_object('available', true, 'monthly_rent', rent, 'salary_min', sal, 'ratio', ratio, 'max_pct', cap, 'comfortable_pct', comf,
    'max_monthly', floor(sal * cap / 100),
    'level', case when ratio is null then 'not_eligible' when ratio <= comf then 'comfortable' when ratio <= cap then 'eligible' else 'not_eligible' end);
end $$;
revoke all on function public.affordability(uuid, uuid) from public, anon, authenticated;
create function public.check_affordability(pid uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  select public.affordability(pid, auth.uid());
$$;
revoke all on function public.check_affordability(uuid) from public, anon;
grant execute on function public.check_affordability(uuid) to authenticated;

create type public.application_status as enum ('pending', 'approved', 'declined', 'withdrawn');
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  tenant_id uuid not null references public.profiles (id) on delete cascade,
  status public.application_status not null default 'pending',
  monthly_rent numeric(14, 2) not null, annual_rent numeric(14, 2),
  salary_min numeric(14, 2) not null, rent_to_income numeric(5, 1) not null, affordability text not null,
  message text, review_note text,
  created_at timestamptz not null default now(), decided_at timestamptz
);
create unique index one_open_application on public.applications (property_id, tenant_id) where status in ('pending', 'approved');
alter table public.applications enable row level security;
create policy "tenant reads own applications" on public.applications for select using (tenant_id = auth.uid() or public.is_admin());
create policy "admin updates applications" on public.applications for update using (public.is_admin());
-- No insert policy: tenants apply through apply_for_property(), which re-checks everything.

create function public.apply_for_property(pid uuid, msg text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); a jsonb; annual numeric; aid uuid;
begin
  if uid is null then raise exception 'sign_in'; end if;
  if not exists (select 1 from public.profiles where id = uid and role = 'tenant' and kyc_level >= 3) then raise exception 'verification'; end if;
  a := public.affordability(pid, uid);
  if not (a ->> 'available')::boolean then raise exception 'unavailable'; end if;
  if a ->> 'level' = 'not_eligible' then raise exception 'not_eligible'; end if;
  select annual_rent into annual from public.properties where id = pid;
  insert into public.applications (property_id, tenant_id, monthly_rent, annual_rent, salary_min, rent_to_income, affordability, message)
  values (pid, uid, (a ->> 'monthly_rent')::numeric, annual, (a ->> 'salary_min')::numeric, (a ->> 'ratio')::numeric, a ->> 'level', nullif(left(trim(msg), 1000), ''))
  returning id into aid;
  return aid;
exception when unique_violation then raise exception 'already_applied';
end $$;
revoke all on function public.apply_for_property(uuid, text) from public, anon;
grant execute on function public.apply_for_property(uuid, text) to authenticated;

create function public.withdraw_application(aid uuid) returns void language sql security definer set search_path = '' as $$
  update public.applications set status = 'withdrawn', decided_at = now() where id = aid and tenant_id = auth.uid() and status = 'pending';
$$;
revoke all on function public.withdraw_application(uuid) from public, anon;
grant execute on function public.withdraw_application(uuid) to authenticated;

-- Landlords see a limited view of applications on their own properties. The tenant's phone appears only once approved.
create view public.landlord_applications as
  select a.id, a.property_id, pr.title as property_title, a.status, a.affordability, a.message, a.created_at, tp.full_name as tenant_name,
         case when a.status = 'approved' then tp.phone end as tenant_phone
  from public.applications a join public.properties pr on pr.id = a.property_id join public.profiles tp on tp.id = a.tenant_id
  where pr.owner_id = auth.uid();
-- Tenants see the landlord's name, phone and the street address only once approved.
create view public.tenant_applications as
  select a.id, a.property_id, pr.title as property_title, pr.area, pr.city, a.status, a.monthly_rent, a.affordability, a.review_note, a.created_at,
         case when a.status = 'approved' then pr.address end as address,
         case when a.status = 'approved' then lp.full_name end as landlord_name,
         case when a.status = 'approved' then lp.phone end as landlord_phone
  from public.applications a join public.properties pr on pr.id = a.property_id join public.profiles lp on lp.id = pr.owner_id
  where a.tenant_id = auth.uid();
revoke all on public.landlord_applications, public.tenant_applications from anon;
grant select on public.landlord_applications, public.tenant_applications to authenticated;

create table public.tenancies (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id),
  tenant_id uuid not null references public.profiles (id), property_id uuid not null references public.properties (id),
  monthly_rent numeric(14, 2) not null, months smallint not null default 12, start_date date not null,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')), created_at timestamptz not null default now()
);
create table public.installments (
  id uuid primary key default gen_random_uuid(),
  tenancy_id uuid not null references public.tenancies (id) on delete cascade,
  number smallint not null, due_date date not null, amount numeric(14, 2) not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'paid', 'overdue')), paid_at timestamptz,
  unique (tenancy_id, number)
);
alter table public.tenancies enable row level security;
alter table public.installments enable row level security;
create policy "own tenancies" on public.tenancies for select using (tenant_id = auth.uid() or public.is_admin());
create policy "own installments" on public.installments for select using (public.is_admin() or exists (select 1 from public.tenancies t where t.id = tenancy_id and t.tenant_id = auth.uid()));

-- Approving creates the tenancy and 12 monthly installments, due every 30 days from the start date.
create function public.approve_application(aid uuid, start_on date, note text) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.applications; tid uuid;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select * into a from public.applications where id = aid for update;
  if a.id is null or a.status <> 'pending' then raise exception 'not pending'; end if;
  if not exists (select 1 from public.properties where id = a.property_id and status = 'published') then raise exception 'property not available'; end if;
  update public.applications set status = 'approved', decided_at = now(), review_note = nullif(trim(note), '') where id = aid;
  insert into public.tenancies (application_id, tenant_id, property_id, monthly_rent, start_date) values (a.id, a.tenant_id, a.property_id, a.monthly_rent, start_on) returning id into tid;
  insert into public.installments (tenancy_id, number, due_date, amount) select tid, n, start_on + (n * 30), a.monthly_rent from generate_series(1, 12) n;
  update public.properties set status = 'rented' where id = a.property_id;
  update public.applications set status = 'declined', decided_at = now(), review_note = 'This property is no longer available.' where property_id = a.property_id and status = 'pending' and id <> aid;
end $$;
create function public.decline_application(aid uuid, note text) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  update public.applications set status = 'declined', decided_at = now(), review_note = nullif(trim(note), '') where id = aid and status = 'pending';
end $$;
revoke all on function public.approve_application(uuid, date, text), public.decline_application(uuid, text) from public, anon;
grant execute on function public.approve_application(uuid, date, text), public.decline_application(uuid, text) to authenticated;

-- Wallet: an append-only ledger. Positive = money in, negative = money out. Only the server writes to it.
create table public.wallet_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(14, 2) not null check (amount <> 0),
  kind text not null check (kind in ('funding', 'rent_payment', 'refund', 'adjustment')),
  reference text not null unique,           -- Paystack reference or inst_<id>; makes every write idempotent
  installment_id uuid references public.installments (id),
  created_at timestamptz not null default now()
);
create index on public.wallet_entries (user_id, created_at desc);
alter table public.wallet_entries enable row level security;
create policy "own wallet entries" on public.wallet_entries for select using (user_id = auth.uid() or public.is_admin());
create function public.my_wallet_balance() returns numeric language sql stable security definer set search_path = '' as $$
  select coalesce(sum(amount), 0) from public.wallet_entries where user_id = auth.uid();
$$;
revoke all on function public.my_wallet_balance() from public, anon;
grant execute on function public.my_wallet_balance() to authenticated;

-- Runs daily. For each due installment, takes the rent from the tenant's wallet if the balance covers it; otherwise marks it overdue.
create function public.process_rent_due() returns int language plpgsql security definer set search_path = '' as $$
declare i record; bal numeric; n int := 0; today date := (now() at time zone 'Africa/Lagos')::date;
begin
  for i in select inst.id, inst.amount, inst.due_date, t.tenant_id from public.installments inst join public.tenancies t on t.id = inst.tenancy_id
           where inst.status in ('scheduled', 'overdue') and inst.due_date <= today and t.status = 'active' order by inst.due_date, inst.number loop
    perform pg_advisory_xact_lock(hashtext(i.tenant_id::text));
    select coalesce(sum(amount), 0) into bal from public.wallet_entries where user_id = i.tenant_id;
    if bal >= i.amount then
      insert into public.wallet_entries (user_id, amount, kind, reference, installment_id) values (i.tenant_id, -i.amount, 'rent_payment', 'inst_' || i.id, i.id) on conflict (reference) do nothing;
      update public.installments set status = 'paid', paid_at = now() where id = i.id;
      n := n + 1;
    elsif i.due_date < today then
      update public.installments set status = 'overdue' where id = i.id and status = 'scheduled';
    end if;
  end loop;
  return n;
end $$;
revoke all on function public.process_rent_due() from public, anon, authenticated;
