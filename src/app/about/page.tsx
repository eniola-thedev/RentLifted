import Link from "next/link";
import { InfoCta, InfoHero, InfoSection, Points } from "@/components/InfoPage";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "About us – RENTLIFTED", description: "RENTLIFTED makes renting and owning property in Nigeria more accessible." };

export default function About() {
  return (
    <main>
      <InfoHero eyebrow="About us" title="Elevating the way we live" intro="RENTLIFTED is a Nigeria-based property company. We help people rent, buy and manage property, starting with the problem that holds most renters back: paying a whole year’s rent at once." />

      <InfoSection title="Why we started">
        <div className="grid max-w-2xl gap-4 text-pretty leading-relaxed text-mut">
          <p>Most landlords in Nigeria ask for one or two years’ rent upfront. For many working people, that means borrowing, waiting years to save, or settling for a home that doesn’t suit them, even when they could easily afford the rent month by month.</p>
          <p>RENTLIFTED closes that gap. We pay the landlord the year upfront, and verified tenants pay us back monthly. Landlords get their money and reliable tenants; tenants get a home they can afford, on terms that match how they’re paid.</p>
        </div>
      </InfoSection>

      <InfoSection id="mission" title="Our mission" tone="cream">
        <p className="max-w-2xl text-balance text-xl font-bold leading-snug text-ink sm:text-2xl">To make quality housing accessible to more Nigerians, by making property fair, flexible and transparent for tenants and landlords alike.</p>
      </InfoSection>

      <InfoSection title="What we stand for">
        <Points cols={2} items={[
          ["key", "Accessibility", "Housing shouldn’t depend on having a year’s salary saved. We make renting possible on a monthly budget."],
          ["shield", "Transparency", "Clear prices, clear payment dates and no hidden charges. You always know what you owe and when."],
          ["users", "Trust on both sides", "We verify tenants and landlords, so everyone knows who they’re dealing with."],
          ["hand", "Partnership", "We succeed when tenants stay happy and landlords get paid. We work for both."],
        ]} />
      </InfoSection>

      <InfoCta title="Come and see us" text={`Our office is at ${COMPANY.address}.`}>
        <Link href="/contact" className="btn bg-copper text-[#2a1206] hover:bg-[#d48d57]">Contact us</Link>
        <Link href="/careers" className="btn border border-white/40 text-white hover:bg-white/10">Work with us</Link>
      </InfoCta>
    </main>
  );
}
