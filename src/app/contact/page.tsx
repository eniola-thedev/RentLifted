import Link from "next/link";
import Icon from "@/components/Icon";
import { InfoHero } from "@/components/InfoPage";
import SupportForm from "@/components/SupportForm";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Contact us – RENTLIFTED", description: "Call, email or visit RENTLIFTED in Ibadan, or send us a message." };
const TOPICS = ["Renting monthly", "Listing a property", "Property management", "Payments or my wallet", "Verification", "Partnership", "Something else"] as const;

export default async function Contact({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { error, sent } = await searchParams;
  const ways = [
    ["pay", "Call us", COMPANY.phone, `tel:${COMPANY.phoneIntl}`],
    ["doc", "Email us", COMPANY.email, `mailto:${COMPANY.email}`],
    ["pin", "Visit our office", COMPANY.address, `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY.address)}`],
  ] as const;
  return (
    <main>
      <InfoHero eyebrow="Contact us" title="We’re here to help" intro="Questions about renting monthly, listing a property or a payment? Call, email or send us a message and a real person will get back to you." />
      <div className="mx-auto grid max-w-4xl gap-10 px-5 py-12 lg:grid-cols-[1fr_1.4fr]">
        <section aria-labelledby="ways">
          <h2 id="ways" className="text-xl font-extrabold text-maroon">Reach us directly</h2>
          <ul className="mt-5 grid gap-3">
            {ways.map(([icon, t, v, href]) => (
              <li key={t}>
                <a href={href} {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})} className="flex gap-3 rounded-xl border border-line p-4 hover:border-maroon">
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-cream text-maroon"><Icon name={icon} className="h-5 w-5" /></span>
                  <span className="min-w-0"><b className="block text-sm">{t}</b><span className="break-words text-sm text-mut">{v}</span></span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-mut"><b className="text-ink">Office hours:</b> {COMPANY.hours}</p>
          <p className="mt-4 text-sm text-mut">Something went wrong? <Link href="/complaints" className="font-bold text-maroon underline">Make a complaint</Link> and we’ll track it until it’s fixed.</p>
        </section>
        <section id="form" aria-labelledby="msg" className="scroll-mt-24">
          <h2 id="msg" className="text-xl font-extrabold text-maroon">Send us a message</h2>
          <div className="mt-5"><SupportForm kind="contact" topics={TOPICS} error={error} sent={!!sent} /></div>
        </section>
      </div>
    </main>
  );
}
