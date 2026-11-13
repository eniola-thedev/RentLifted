-- Smile ID identity checks are written by the server (service role) from Smile ID's signed webhook.
alter table public.kyc_submissions add column provider text, add column provider_ref text;
-- One row per Smile ID job, so a repeated webhook delivery never creates a duplicate.
alter table public.kyc_submissions add constraint kyc_provider_ref_unique unique (provider, provider_ref);
