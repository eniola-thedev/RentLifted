-- Phase 6: card on file, landlord upfront payouts, card fallback attempts and email reminders.

-- Tenants must now also have a card saved before reaching Level 3 (monthly rent).
insert into public.kyc_requirements values ('tenant', 3, 'card');

-- Saved cards. The authorization code can charge the card, so the browser can never read it.
create table public.saved_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  authorization_code text not null, signature text not null,
  last4 text, brand text, exp_month text, exp_year text, bank text,
  created_at timestamptz not null default now(),
  unique (user_id, signature)
);
alter table public.saved_cards enable row level security;
create policy "own cards" on public.saved_cards for select using (user_id = auth.uid());
revoke all on public.saved_cards from anon, authenticated;
grant select (id, last4, brand, exp_month, exp_year, bank, created_at) on public.saved_cards to authenticated;

-- Upfront payout to the landlord, created when an application is approved. An admin starts the transfer.
create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  tenancy_id uuid not null unique references public.tenancies (id),
  landlord_id uuid not null references public.profiles (id),
  amount numeric(14, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'paid', 'failed')),
  attempt smallint not null default 0, reference text unique, recipient_code text, failure_reason text,
  created_at timestamptz not null default now(), paid_at timestamptz
);
alter table public.payouts enable row level security;
create policy "own payouts" on public.payouts for select using (landlord_id = auth.uid() or public.is_admin());

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
  insert into public.installments (tenancy_id, number, due_date, amount) select tid, n, start_on + (n * 30), a.monthly_rent from generate_series(1, 12) n;
  insert into public.payouts (tenancy_id, landlord_id, amount)
    select tid, pr.owner_id, coalesce(a.annual_rent, a.monthly_rent * 12) from public.properties pr where pr.id = a.property_id;
  update public.properties set status = 'rented' where id = a.property_id;
  update public.applications set status = 'declined', decided_at = now(), review_note = 'This property is no longer available.' where property_id = a.property_id and status = 'pending' and id <> aid;
end $$;

-- Server-only bookkeeping (no policies: only the service role can touch these).
create table public.charge_attempts (
  id uuid primary key default gen_random_uuid(),
  installment_id uuid not null references public.installments (id) on delete cascade,
  reference text not null unique, outcome text, created_at timestamptz not null default now()
);
create table public.reminders_sent (
  installment_id uuid not null references public.installments (id) on delete cascade,
  kind text not null, sent_at timestamptz not null default now(), primary key (installment_id, kind)
);
alter table public.charge_attempts enable row level security;
alter table public.reminders_sent enable row level security;

-- For each tenant, their earliest unpaid due installment that the wallet can't cover, with at most 3 card attempts, one per day.
create function public.due_shortfalls() returns table (installment_id uuid, tenant_id uuid, email text, shortfall numeric)
language sql stable security definer set search_path = '' as $$
  select distinct on (t.tenant_id) i.id, t.tenant_id, u.email::text, i.amount - coalesce(b.bal, 0)
  from public.installments i
  join public.tenancies t on t.id = i.tenancy_id
  join auth.users u on u.id = t.tenant_id
  left join (select user_id, sum(amount) bal from public.wallet_entries group by user_id) b on b.user_id = t.tenant_id
  where t.status = 'active' and i.status in ('scheduled', 'overdue')
    and i.due_date <= (now() at time zone 'Africa/Lagos')::date
    and i.amount > coalesce(b.bal, 0)
    and (select count(*) from public.charge_attempts c where c.installment_id = i.id) < 3
    and not exists (select 1 from public.charge_attempts c where c.installment_id = i.id and (c.created_at at time zone 'Africa/Lagos')::date = (now() at time zone 'Africa/Lagos')::date)
  order by t.tenant_id, i.due_date, i.number;
$$;

create function public.reminder_candidates() returns table (installment_id uuid, kind text, email text, full_name text, amount numeric, due_date date, balance numeric)
language sql stable security definer set search_path = '' as $$
  select * from (
    select i.id, case
        when i.status = 'scheduled' and i.due_date = (now() at time zone 'Africa/Lagos')::date + 3 then 'due_in_3'
        when i.status = 'scheduled' and i.due_date = (now() at time zone 'Africa/Lagos')::date then 'due_today'
        when i.status = 'overdue' and i.due_date < (now() at time zone 'Africa/Lagos')::date then 'overdue' end as kind,
      u.email::text, p.full_name, i.amount, i.due_date,
      coalesce((select sum(w.amount) from public.wallet_entries w where w.user_id = t.tenant_id), 0) as balance
    from public.installments i join public.tenancies t on t.id = i.tenancy_id
    join auth.users u on u.id = t.tenant_id join public.profiles p on p.id = t.tenant_id
    where t.status = 'active' and i.status in ('scheduled', 'overdue')
  ) x where kind is not null;
$$;
revoke all on function public.due_shortfalls(), public.reminder_candidates() from public, anon, authenticated;
