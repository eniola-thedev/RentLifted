-- Monthly rent amount shown on listings. Set by an admin (or SQL/service role), never by landlords.
alter table public.properties add column monthly_rent numeric(14, 2);
alter table public.properties add constraint monthly_rent_needs_flag check (monthly_rent is null or monthly_rent_available);

create function public.guard_monthly_rent() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.monthly_rent := case when tg_op = 'INSERT' then null else old.monthly_rent end;
  end if;
  return new;
end $$;
create trigger guard_monthly_rent before insert or update on public.properties for each row execute function public.guard_monthly_rent();
