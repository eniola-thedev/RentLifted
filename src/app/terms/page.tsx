import { COMPANY } from "@/lib/company";

export const metadata = { title: "Terms and conditions – RENTLIFTED" };

const SECTIONS = [
  ["Using RENTLIFTED", "You must be 18 or over and give true, complete information when you sign up and verify your account. Keep your password private; you are responsible for activity on your account."],
  ["Monthly rent", "When we approve a monthly-rent application, we pay the landlord the agreed annual rent and you agree to repay it in 12 monthly instalments on the due dates shown in your account. Rent is taken from your wallet on the due date. If your wallet is short, you have a 5-day grace period, after which we may charge your saved card."],
  ["Listings", "Landlords must have the right to rent or sell any property they list, and listings must be accurate. A one-time listing fee applies to each property listed by a landlord. We review every listing and may decline or remove any listing."],
  ["Payments", "Payments are processed by Paystack. Listing fees are non-refundable once a listing has been submitted, except where we have made an error."],
  ["Our responsibilities", "We work to keep RENTLIFTED available and accurate, and we verify users and listings. We are not a party to the condition of a property, which remains the landlord’s responsibility."],
  ["Changes and contact", `We may update these terms and will tell you about important changes. Questions: ${COMPANY.email}.`],
] as const;

export default function Terms() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-3xl font-extrabold text-maroon">Terms and conditions</h1>
      <p className="mt-4 rounded-lg bg-cream p-3 text-sm text-mut">Draft placeholder. RENTLIFTED should replace this with terms approved by its lawyer before launch.</p>
      <div className="mt-6 grid gap-6">
        {SECTIONS.map(([h, t], i) => (
          <section key={h} aria-labelledby={`t${i}`}>
            <h2 id={`t${i}`} className="font-extrabold text-ink">{i + 1}. {h}</h2>
            <p className="mt-1.5 text-pretty text-sm leading-relaxed text-mut">{t}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
