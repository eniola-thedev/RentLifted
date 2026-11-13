# RENTLIFTED

Next.js (App Router) + TypeScript + Tailwind + Supabase.

## Run it
1. Create a Supabase project. In the SQL editor, run `supabase/migrations/0001_init.sql`, then `0002_monthly_rent.sql`, `0003_kyc.sql`, `0004_smile_id.sql` `0005_listings.sql` and `0006_applications_wallet.sql`, `0007_exact_income.sql`, `0008_payouts_cards_reminders.sql`, `0009_monthly_due_dates_grace.sql`, `0010_more_property_types.sql`, `0011_listing_fee_videos.sql`, `0012_admin_listings.sql`, `0013_assisted_listings.sql` and `0014_support_messages.sql`.
   Messages from `/contact` and `/complaints` arrive in the admin inbox at `/admin/messages`. Company contact details live in `src/lib/company.ts`; FAQ answers in `src/lib/faqs.ts`.
   Assisted listings: for landlords met in person, an admin records their details, ID and bank account at `/admin/landlords`, then lists the property for them (no fee). It can only be published once the ID, a Paystack-confirmed bank account and proof of ownership are on file. Their upfront rent is paid from `/admin/payouts`.
   Admins post RENTLIFTED's own listings at `/admin/properties`: no fee, no review, same photo and video rules, published directly.
   Listings need a one-time listing fee (`listing_fee` in `platform_settings`, default ₦2,000, paid by Paystack on the same webhook), 2 to 5 photos and 1 to 2 videos (up to 50 MB each, in the public `property-videos` bucket) before they can be sent for review.
   Rent is due on the same day each month, with a grace period (`rent_grace_days` in `platform_settings`, default 5) before it is overdue and the saved card is charged.
2. Copy `.env.example` to `.env.local` and fill in the project URL and anon key.
3. `npm install` then `npm run dev`, and open http://localhost:3000.
4. To make an admin: sign up normally, then in the SQL editor run
   `update public.profiles set role = 'admin' where id = '<user id>';`

For quick local testing, turn off "Confirm email" in Supabase Auth settings.

## Supabase settings for KYC
- Run `0003_kyc.sql` after the other migrations.
- Email confirmation is by link. Authentication > URL Configuration: set Site URL to your site and add `<your site>/auth/confirm` (and `http://localhost:3000/auth/confirm` for local testing) to Redirect URLs.
- Authentication > Email Templates > "Confirm signup": use this link so it works even when opened on another device:
  `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>`
  (The default `{{ .ConfirmationURL }}` also works, but only in the same browser the person signed up in.)
- Landlord phone codes need an SMS provider under Authentication > Providers > Phone (Twilio, MessageBird, Vonage or TextLocal). For local testing, add a test phone number with a fixed code in the same place.
- Identity checks use Smile ID (Biometric KYC with BVN or NIN and a selfie). If the Smile ID variables are empty, the identity step falls back to manual admin review.
- Levels are calculated by the database from approved submissions and the rules in the `kyc_requirements` table.

## Smile ID setup
1. Create a Smile ID account (portal.usesmileid.com) and copy the sandbox Partner ID and API key into `.env.local` (`SMILE_ID_PARTNER_ID`, `SMILE_ID_API_KEY`). Also add `SUPABASE_SERVICE_ROLE_KEY` (server-only) and `NEXT_PUBLIC_SITE_URL`.
2. In the Smile ID dashboard, go to Developer > Security Settings > Callback URLs, switch to Sandbox and add `<your site>/api/smile/webhook`. It must be public HTTPS. For local testing, use a tunnel such as Cloudflare Tunnel or ngrok and set `NEXT_PUBLIC_SITE_URL` to the tunnel address.
3. Ask Smile ID to enable Biometric KYC for Nigeria with BVN and NIN on the account. Test with the sandbox ID numbers listed in the Smile ID docs.
4. Results: `clear` marks the identity step approved. `attention`, or any fraud flag, goes to `/admin/kyc` for a person to review. `block` or `error` lets the user try again. Webhooks are signature-checked, and repeats are ignored.
5. Going live: switch `SMILE_ID_ENV` to `production`, use the production Partner ID and API key, and add the production callback URL. Replace the placeholder text at `/privacy` with the client's approved policy.

## Applications, wallet and the daily rent job
- Affordability: monthly rent must be at most 30% of the tenant's income (25% or less is "comfortable"). The income used is the bottom of the tenant's approved salary range. Change the percentages in the `platform_settings` table.
- Wallet funding uses Paystack. Add `PAYSTACK_SECRET_KEY`, and in the Paystack dashboard (Settings > API Keys & Webhooks) set the webhook URL to `<your site>/api/paystack/webhook`. Use test keys first.
- Rent is taken from tenant wallets by `process_rent_due()`. On Vercel, set `CRON_SECRET` and the schedule in `vercel.json` calls `/api/cron/rent-due` every day at 6am Lagos time. Elsewhere, schedule `select public.process_rent_due();` with pg_cron.
- Card on file: a tenant adds money by card once (from the wallet page); Paystack returns a reusable card token, which we store server-side. It's now required for tenant Level 3. If the wallet can't cover rent on the due date, the daily job charges the shortfall to the card (at most one attempt a day, 3 in total per installment) and then takes the rent from the wallet.
- Reminders: with `RESEND_API_KEY` and `EMAIL_FROM` set, tenants get an email 3 days before rent is due, on the due date, and once when it's overdue.
- Landlord payouts: approving an application creates a payout for the property's annual rent. An admin starts the transfer at `/admin/payouts` (Paystack Transfers). The landlord needs Level 3 with a bank account that Paystack could resolve. In the Paystack dashboard, Transfers must be enabled, the balance must cover the amount, and either disable transfer OTP (Settings > Preferences) or approve each transfer there. Results arrive on the same webhook (`transfer.success`, `transfer.failed`, `transfer.reversed`).

## Phases
1. Foundation (done): auth with tenant/landlord roles, route protection, KYC levels shown, database schema with row-level security.
2. Public site (done): full homepage, property search and detail pages. Set `NEXT_PUBLIC_DEMO_DATA=true` to show sample properties before real listings exist.
3. KYC flows (done): tenant and landlord steps, document upload, admin review at `/admin/kyc`. The card step for tenants arrives with Phase 6. 4. Landlord dashboard (done): add and edit listings, upload up to 8 photos, submit for review. An admin approves at `/admin/listings` and sets the monthly rent amount. 5. Tenant applications, affordability check, landlord/tenant contact reveal and the tenant wallet (done). Admin approves at `/admin/applications`. 6. Payments (Paystack). 7. Admin panel. 8. Hardening and launch.
