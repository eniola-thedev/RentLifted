-- KYC: one submission per step, a configurable requirements table, and automatic level calculation.
alter table public.kyc_submissions drop column level, drop column doc_type, drop column provider_ref;
alter table public.kyc_submissions
  add column kind text not null check (kind in ('identity', 'work', 'card', 'ownership', 'bank_account')),
  add column data jsonb not null default '{}',   -- form answers (company, salary range, guarantor, etc.)
  add column files text[] not null default '{}'; -- paths in the private kyc-documents bucket

-- Users can submit only the steps that belong to their role. Cards are added by the payments system, not by hand.
drop policy "submit own kyc" on public.kyc_submissions;
create policy "submit own kyc" on public.kyc_submissions for insert with check (
  user_id = auth.uid() and status = 'pending' and exists (
    select 1 from public.profiles p where p.id = auth.uid() and (
      (p.role = 'tenant' and kind in ('identity', 'work')) or (p.role = 'landlord' and kind in ('identity', 'ownership', 'bank_account')))));

-- What each level needs, beyond the verified email (and phone for landlords) that gives Level 1.
create table public.kyc_requirements (
  role public.user_role not null, level smallint not null check (level in (2, 3)), kind text not null,
  primary key (role, level, kind)
);
insert into public.kyc_requirements values
  ('tenant', 2, 'identity'), ('tenant', 3, 'work'),
  ('landlord', 2, 'identity'), ('landlord', 3, 'ownership'), ('landlord', 3, 'bank_account');
-- Phase 6 (payments) adds: ('tenant', 3, 'card').
alter table public.kyc_requirements enable row level security;
create policy "anyone reads requirements" on public.kyc_requirements for select using (true);
create policy "admin edits requirements" on public.kyc_requirements for all using (public.is_admin()) with check (public.is_admin());

create function public.sync_kyc_level(uid uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.user_role; u record; lvl smallint := 0; l smallint; missing int;
begin
  select role into r from public.profiles where id = uid;
  if r is null or r = 'admin' then return; end if;
  select email_confirmed_at, phone_confirmed_at into u from auth.users where id = uid;
  if u.email_confirmed_at is not null and (r = 'tenant' or u.phone_confirmed_at is not null) then
    lvl := 1;
    for l in 2..3 loop
      select count(*) into missing from public.kyc_requirements q
        where q.role = r and q.level = l and not exists (
          select 1 from public.kyc_submissions s where s.user_id = uid and s.kind = q.kind and s.status = 'approved');
      exit when missing > 0;
      lvl := l;
    end loop;
  end if;
  update public.profiles set kyc_level = lvl where id = uid;
end $$;
revoke all on function public.sync_kyc_level(uuid) from public, anon, authenticated;

create function public.trg_kyc_submission() returns trigger language plpgsql security definer set search_path = '' as $$
begin perform public.sync_kyc_level(new.user_id); return new; end $$;
create trigger kyc_submission_sync after insert or update of status on public.kyc_submissions for each row execute function public.trg_kyc_submission();

create function public.trg_auth_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin perform public.sync_kyc_level(new.id); return new; end $$;
create trigger auth_user_kyc_sync after update of email_confirmed_at, phone_confirmed_at on auth.users for each row execute function public.trg_auth_user();

-- Admin decision. Also wipes the full BVN/NIN from the submission once reviewed (only the last 4 digits stay).
create function public.review_kyc(sid uuid, decision public.review_status, note text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if decision = 'pending' then raise exception 'invalid decision'; end if;
  update public.kyc_submissions set status = decision, reviewer_note = note, reviewed_at = now(), data = data - 'id_number' where id = sid;
end $$;
revoke all on function public.review_kyc(uuid, public.review_status, text) from public, anon;
grant execute on function public.review_kyc(uuid, public.review_status, text) to authenticated;
