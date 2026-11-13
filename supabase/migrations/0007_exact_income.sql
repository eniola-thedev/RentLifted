-- Affordability now uses the tenant's exact monthly income (checked by an admin against bank statements), not a salary range.
create or replace function public.affordability(pid uuid, uid uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare rent numeric; sal numeric; cap numeric; comf numeric; ratio numeric;
begin
  select monthly_rent into rent from public.properties where id = pid and status = 'published' and monthly_rent_available and monthly_rent is not null;
  if rent is null then return jsonb_build_object('available', false); end if;
  select coalesce((data ->> 'monthly_income')::numeric, (data ->> 'salary_min')::numeric, 0) into sal from public.kyc_submissions
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
