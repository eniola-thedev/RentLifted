import { InfoHero, InfoSection, Points } from "@/components/InfoPage";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Careers – RENTLIFTED", description: "Work with RENTLIFTED and help make housing more accessible in Nigeria." };

export default function Careers() {
  const mail = `mailto:${COMPANY.email}?subject=${encodeURIComponent("Job application – RENTLIFTED")}`;
  return (
    <main>
      <InfoHero eyebrow="Careers" title="Help more people find a home" intro="We’re a small team in Ibadan building a fairer way to rent. If you care about people, property and doing things properly, we’d like to hear from you." />

      <InfoSection title="Open roles">
        <div className="max-w-2xl rounded-xl border border-line p-6">
          <p className="font-bold">We don’t have any open roles right now.</p>
          <p className="mt-2 text-sm leading-relaxed text-mut">We still want to hear from good people. Send your CV and a few lines about the work you’d like to do, and we’ll keep it on file for when a role opens.</p>
          <a href={mail} className="btn btn-p mt-4">Send your CV</a>
          <p className="mt-3 text-xs text-mut">Or email it to <a href={mail} className="font-bold text-maroon underline">{COMPANY.email}</a> with “Job application” in the subject.</p>
        </div>
      </InfoSection>

      <InfoSection title="Who we look for" tone="cream">
        <Points items={[
          ["users", "Field and property staff", "People who know Ibadan, enjoy meeting landlords and can inspect, photograph and list properties."],
          ["doc", "Customer support", "Patient, clear communicators who help tenants and landlords by phone, email and in person."],
          ["shield", "Verification and finance", "Careful people who review documents, check payments and keep records accurate."],
        ]} />
      </InfoSection>
    </main>
  );
}
