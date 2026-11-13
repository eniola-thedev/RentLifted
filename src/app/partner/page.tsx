import Link from "next/link";
import { InfoCta, InfoHero, InfoSection, Points } from "@/components/InfoPage";

export const metadata = { title: "Partner with us – RENTLIFTED", description: "Landlords, estate managers, developers and employers: partner with RENTLIFTED." };

export default function Partner() {
  return (
    <main>
      <InfoHero eyebrow="Partner with us" title="Grow with RENTLIFTED" intro="We work with landlords, estate managers, developers and employers who want to make housing easier to access, and fill properties faster.">
        <Link href="/contact" className="btn btn-p">Start a conversation</Link>
        <Link href="/signup?role=landlord" className="btn btn-o">List a property</Link>
      </InfoHero>

      <InfoSection title="Who we partner with">
        <Points cols={2} items={[
          ["home", "Landlords", "List one property or many. For monthly-rent tenancies we pay you the year’s rent upfront."],
          ["grid", "Estate managers and agents", "Bring the properties you manage onto RENTLIFTED and reach verified tenants who can pay monthly."],
          ["key", "Developers", "Let buyers and renters discover new developments, with video walk-throughs and checked listings."],
          ["users", "Employers", "Help your staff find homes near work, with rent they pay monthly instead of a year upfront."],
        ]} />
      </InfoSection>

      <InfoSection title="How a partnership starts" tone="cream">
        <ol className="grid max-w-2xl gap-3 text-mut">
          <li><b className="text-ink">1. Tell us about you.</b> Send a message with the properties or people you’d like to bring.</li>
          <li><b className="text-ink">2. We meet.</b> We’ll talk through what works for you, in person or by phone.</li>
          <li><b className="text-ink">3. We set it up.</b> We list your properties, often visiting to photograph them, and agree how we’ll work together.</li>
        </ol>
      </InfoSection>

      <InfoCta title="Let’s talk" text="Tell us what you have in mind. Choose “Partnership” as the topic.">
        <Link href="/contact" className="btn bg-copper text-[#2a1206] hover:bg-[#d48d57]">Contact us</Link>
      </InfoCta>
    </main>
  );
}
