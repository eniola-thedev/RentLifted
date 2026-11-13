import Link from "next/link";
import { InfoCta, InfoHero, InfoSection, Points, Steps } from "@/components/InfoPage";

export const metadata = { title: "Monthly rent – RENTLIFTED", description: "Rent a home and pay monthly. We pay the landlord the year upfront; you pay us back each month." };

export default function MonthlyRent() {
  return (
    <main>
      <InfoHero eyebrow="Monthly rent" title="Pay rent monthly, not all at once" intro="In most of Nigeria, landlords want a full year’s rent upfront. With RENTLIFTED, we pay your landlord the year in advance and you pay us back in 12 monthly instalments.">
        <Link href="/properties?type=rent" className="btn btn-p">Browse homes</Link>
        <Link href="/signup?role=tenant" className="btn btn-o">Create a tenant account</Link>
      </InfoHero>

      <InfoSection title="How it works">
        <Steps items={[
          ["Create an account and verify", "Confirm your email, then your identity with your BVN or NIN and a selfie, then your work and income."],
          ["Find a home and apply", "Choose a home marked “Monthly Rent Available” and apply. We check the rent is affordable for you."],
          ["We pay the landlord", "Once you’re approved, the landlord receives the year’s rent upfront and you get their contact details to move in."],
          ["Pay monthly from your wallet", "Add money to your RENTLIFTED wallet. Each month’s rent is taken from it automatically on the due date."],
        ]} />
      </InfoSection>

      <InfoSection title="Who can rent monthly" tone="cream" intro="We want monthly rent to help you, not stretch you. So we check affordability before you commit.">
        <Points cols={2} items={[
          ["shield", "Fully verified", "Your identity, work and income are confirmed, and you’ve saved a payment card."],
          ["pay", "Rent you can afford", "The monthly rent must be no more than 30% of your verified monthly income. At 25% or less, it’s rated comfortable."],
        ]} />
      </InfoSection>

      <InfoSection title="Paying each month">
        <Points items={[
          ["pay", "Same day every month", "If your rent started on the 14th, it’s due on the 14th of every month."],
          ["doc", "Reminders before it’s due", "We email you 3 days before, on the day, and if a payment is missed."],
          ["shield", "5 days’ grace", "If your wallet is short on the due date, you have 5 extra days to top up before it counts as late."],
          ["key", "Card as a backup", "After the grace period, we charge your saved card for whatever your wallet is missing."],
          ["home", "Top up any time", "Add money to your wallet whenever suits you, a little at a time or all at once."],
          ["users", "Talk to us early", "If you’re struggling to pay, contact us before the due date. It’s easier to help early."],
        ]} />
      </InfoSection>

      <InfoCta title="Ready to find your home?" text="Browse homes that offer monthly rent, or check the FAQs for more detail.">
        <Link href="/properties?type=rent" className="btn bg-copper text-[#2a1206] hover:bg-[#d48d57]">Browse homes</Link>
        <Link href="/faq#tenants" className="btn border border-white/40 text-white hover:bg-white/10">Read the FAQs</Link>
      </InfoCta>
    </main>
  );
}
