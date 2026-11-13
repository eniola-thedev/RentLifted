import { InfoHero, InfoSection, Steps } from "@/components/InfoPage";
import SupportForm from "@/components/SupportForm";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Complaints – RENTLIFTED", description: "How to make a complaint to RENTLIFTED and what happens next." };
const TOPICS = ["A payment or my wallet", "A landlord or tenant", "A property listing", "My application", "Verification", "Our service or staff", "Something else"] as const;

export default async function Complaints({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { error, sent } = await searchParams;
  return (
    <main>
      <InfoHero eyebrow="Complaints" title="Tell us what went wrong" intro="If something hasn’t gone the way it should, we want to know. Every complaint is logged, looked into by our team and followed through until it’s resolved." />
      <InfoSection title="What happens next">
        <Steps items={[
          ["We acknowledge it", "You’ll hear from us within 1 working day to confirm we have your complaint and who is handling it."],
          ["We look into it", "We check the records, payments and messages involved, and speak to the landlord or tenant if needed."],
          ["We explain what we found", "We aim to give you a full answer within 10 working days. If it takes longer, we’ll tell you why."],
          ["We put it right", "If we got something wrong, we’ll say so and fix it, including refunds where they’re due."],
        ]} />
      </InfoSection>
      <InfoSection id="form" title="Make a complaint" intro={`Prefer to talk? Call ${COMPANY.phone}. For something urgent, like a payment taken in error, calling is fastest.`} tone="cream">
        <div className="max-w-2xl rounded-2xl bg-white p-6 sm:p-8"><SupportForm kind="complaint" topics={TOPICS} error={error} sent={!!sent} /></div>
      </InfoSection>
    </main>
  );
}
