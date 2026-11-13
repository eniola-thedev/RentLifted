import Link from "next/link";
import { InfoCta, InfoHero } from "@/components/InfoPage";
import { FAQS } from "@/lib/faqs";

export const metadata = { title: "FAQs – RENTLIFTED", description: "Answers to common questions about monthly rent, listing a property and your account." };

export default function Faq() {
  return (
    <main>
      <InfoHero eyebrow="FAQs" title="Questions, answered" intro="Everything people usually ask about renting monthly, listing a property and keeping your account safe." />
      <div className="mx-auto max-w-4xl px-5 py-10">
        <nav aria-label="FAQ sections" className="flex flex-wrap gap-2">
          {FAQS.map((s) => <a key={s.id} href={`#${s.id}`} className="rounded-full border border-line px-4 py-1.5 text-sm font-bold text-maroon hover:border-maroon">{s.title}</a>)}
        </nav>
        {FAQS.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="mt-10 scroll-mt-24">
            <h2 id={`${s.id}-h`} className="text-2xl font-extrabold text-maroon">{s.title}</h2>
            <div className="mt-4 divide-y divide-line rounded-xl border border-line">
              {s.items.map(([q, a]) => (
                <details key={q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-bold hover:bg-cream/60">
                    {q}<span aria-hidden="true" className="flex-none text-xl leading-none text-maroon transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="max-w-2xl px-5 pb-5 text-pretty leading-relaxed text-mut">{a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
      <InfoCta title="Still have a question?" text="Send us a message or give us a call. We’re happy to help.">
        <Link href="/contact" className="btn bg-copper text-[#2a1206] hover:bg-[#d48d57]">Contact us</Link>
      </InfoCta>
    </main>
  );
}
