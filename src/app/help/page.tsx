import Link from "next/link";
import Icon from "@/components/Icon";
import { InfoHero, InfoSection } from "@/components/InfoPage";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Help centre – RENTLIFTED", description: "Guides and support for tenants and landlords using RENTLIFTED." };

const TOPICS = [
  ["home", "Renting monthly", "How monthly rent works, who qualifies and paying each month.", "/monthly-rent"],
  ["shield", "Verifying your account", "What you need for each verification level and why.", "/faq#tenants"],
  ["pay", "Wallet and payments", "Funding your wallet, due dates, grace period and your saved card.", "/faq#tenants"],
  ["key", "Listing a property", "Fees, photos and videos, and getting your listing approved.", "/faq#landlords"],
  ["tool", "Property management", "Let us find tenants and look after your property, or list it for you.", "/property-management"],
  ["doc", "Account and safety", "Confirmation emails, privacy and keeping your account secure.", "/faq#account"],
] as const;

export default function Help() {
  return (
    <main>
      <InfoHero eyebrow="Help centre" title="How can we help?" intro="Find a guide below, or get in touch and we’ll sort it out with you." />
      <InfoSection title="Browse by topic">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map(([icon, t, d, href]) => (
            <li key={t}>
              <Link href={href} className="flex h-full flex-col gap-3 rounded-xl border border-line bg-white p-5 transition-colors hover:border-maroon">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-cream text-maroon"><Icon name={icon} className="h-5 w-5" /></span>
                <span><b className="block">{t}</b><span className="mt-1 block text-sm leading-relaxed text-mut">{d}</span></span>
              </Link>
            </li>
          ))}
        </ul>
      </InfoSection>
      <InfoSection title="Still need help?" tone="cream">
        <div className="grid gap-4 sm:grid-cols-3">
          <a href={`tel:${COMPANY.phoneIntl}`} className="rounded-xl bg-white p-5 hover:ring-2 hover:ring-maroon/30"><b className="block">Call us</b><span className="text-sm text-mut tabular-nums">{COMPANY.phone}</span></a>
          <Link href="/contact" className="rounded-xl bg-white p-5 hover:ring-2 hover:ring-maroon/30"><b className="block">Send a message</b><span className="text-sm text-mut">We usually reply within 1 working day</span></Link>
          <Link href="/complaints" className="rounded-xl bg-white p-5 hover:ring-2 hover:ring-maroon/30"><b className="block">Make a complaint</b><span className="text-sm text-mut">We’ll track it until it’s resolved</span></Link>
        </div>
      </InfoSection>
    </main>
  );
}
