import Link from "next/link";
import { InfoCta, InfoHero, InfoSection, Points, Steps } from "@/components/InfoPage";

export const metadata = { title: "Property management – RENTLIFTED", description: "Let RENTLIFTED find tenants, collect rent and look after your property." };

export default function PropertyManagement() {
  return (
    <main>
      <InfoHero eyebrow="For landlords" title="Your property, looked after" intro="Whether you manage everything yourself or would rather hand it over, RENTLIFTED helps you find good tenants, get your rent and keep your property in shape.">
        <Link href="/signup?role=landlord" className="btn btn-p">List your property</Link>
        <Link href="/contact" className="btn btn-o">Talk to us</Link>
      </InfoHero>

      <InfoSection title="What we do for you">
        <Points items={[
          ["users", "Verified tenants", "Every tenant who rents monthly has confirmed their identity, work and income."],
          ["pay", "A year’s rent upfront", "When we approve a tenant for monthly rent, we pay you the full year in advance, straight to your bank."],
          ["home", "Listings that sell the space", "Photos and video walk-throughs, reviewed by our team before they go live."],
          ["tool", "Maintenance coordination", "We arrange repairs and keep you updated, so small problems don’t become big ones."],
          ["doc", "Clear records", "See your listings, applications and payments in one dashboard."],
          ["shield", "Checked listings", "We verify ownership before a property goes live, which protects you and your tenants."],
        ]} />
      </InfoSection>

      <InfoSection id="visit" title="Can’t list it yourself? We’ll come to you" tone="cream" intro="Not everyone wants to set up an account and upload photos. Our team can visit, and do it for you.">
        <Steps items={[
          ["Book a visit", "Call or message us with your property’s location and a good time."],
          ["We meet you", "We take your details, a photo of your ID, proof of ownership and your bank account."],
          ["We photograph and film", "We take photos and a short video walk-through of the property."],
          ["We list it, free", "There’s no listing fee when we list for you. We’ll call you when a tenant applies."],
        ]} />
        <div className="mt-6"><Link href="/contact" className="btn btn-p">Book a visit</Link></div>
      </InfoSection>

      <InfoCta title="Prefer to do it yourself?" text="Create a landlord account and list in minutes. There’s a one-time ₦2,000 listing fee per property.">
        <Link href="/signup?role=landlord" className="btn bg-copper text-[#2a1206] hover:bg-[#d48d57]">Create a landlord account</Link>
        <Link href="/faq#landlords" className="btn border border-white/40 text-white hover:bg-white/10">Landlord FAQs</Link>
      </InfoCta>
    </main>
  );
}
