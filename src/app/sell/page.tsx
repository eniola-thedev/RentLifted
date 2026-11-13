import Link from "next/link";
import { InfoCta, InfoHero, InfoSection, Points, Steps } from "@/components/InfoPage";

export const metadata = { title: "Sell your property – RENTLIFTED", description: "List a house or apartment for sale on RENTLIFTED and reach serious buyers." };

export default function Sell() {
  return (
    <main>
      <InfoHero eyebrow="Sell property" title="Sell your home to serious buyers" intro="List a house or apartment for sale on RENTLIFTED. Every listing is checked by our team, so buyers can trust what they see.">
        <Link href="/signup?role=landlord" className="btn btn-p">List a property for sale</Link>
        <Link href="/property-management#visit" className="btn btn-o">Have us list it for you</Link>
      </InfoHero>

      <InfoSection title="How to list">
        <Steps items={[
          ["Create a landlord account", "Sign up, confirm your email and verify your identity with your BVN or NIN and a selfie."],
          ["Add the details", "Choose “For sale”, then add the price, location, bedrooms and a clear description."],
          ["Add photos and video", "Upload 2 to 5 photos and 1 or 2 short videos. Bright, tidy rooms get the most interest."],
          ["Pay and submit", "Pay the one-time ₦2,000 listing fee and submit. We review it and publish it, usually within 2 working days."],
        ]} />
      </InfoSection>

      <InfoSection title="Why sell with RENTLIFTED" tone="cream">
        <Points items={[
          ["shield", "Trusted listings", "Sellers are verified, which gives buyers confidence to make contact."],
          ["home", "Shown at its best", "Photos and video walk-throughs let buyers see the property before visiting."],
          ["pay", "A small, fixed fee", "₦2,000 per property, paid once. Edits and resubmissions are free."],
        ]} />
      </InfoSection>

      <InfoCta title="Selling land?" text="Land sales are coming soon, with verified titles and safe payments.">
        <Link href="/land" className="btn bg-copper text-[#2a1206] hover:bg-[#d48d57]">Learn more</Link>
      </InfoCta>
    </main>
  );
}
