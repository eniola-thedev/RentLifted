import KycShell, { Field, Files } from "@/components/KycShell";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { submitWork } from "../actions";

export default async function Work({ searchParams }: { searchParams: Promise<{ error?: string; type?: string }> }) {
  const { error, type } = await searchParams;
  await requireProfile("tenant");
  const self = type === "self_employed";
  const tab = (on: boolean) => `rounded-lg border px-4 py-2 text-sm font-bold ${on ? "border-maroon bg-maroon text-white" : "border-line"}`;
  return (
    <KycShell title="Proof of work and income" intro="This lets us offer you a monthly rent that fits your income." error={error}>
      <div className="flex gap-2"><Link href="/kyc/work" className={tab(!self)}>I’m employed</Link><Link href="/kyc/work?type=self_employed" className={tab(self)}>I’m self-employed</Link></div>
      <form action={submitWork} className="grid gap-4">
        <input type="hidden" name="employment_type" value={self ? "self_employed" : "employed"} />
        {self ? (<>
          <Field label="Business name (optional)"><input name="business_name" className="field" /></Field>
          <Field label="CAC registration number (optional)"><input name="cac_number" className="field" /></Field>
          <Field label="CAC certificate (optional)"><input type="file" name="cac_doc" accept="image/*,application/pdf" className={Files} /></Field>
        </>) : (<>
          <Field label="Company"><input name="company" required className="field" /></Field>
          <Field label="Job title"><input name="job_title" required className="field" /></Field>
          <Field label="Staff ID"><input name="staff_id" required className="field" /></Field>
        </>)}
        <Field label={self ? "Average monthly income (₦)" : "Monthly salary (₦)"} hint="Your take-home pay each month. We check it against your bank statements, and your monthly rent will be about 25% to 30% of it at most."><input name="monthly_income" inputMode="numeric" required placeholder="150000" className="field" /></Field>
        <Field label="Home address"><input name="address" required autoComplete="street-address" className="field" /></Field>
        <Field label={self ? "Bank statements (last 6 to 12 months)" : "Bank statements (last 3 to 6 months)"} hint="JPG, PNG or PDF, under 5 MB each. You can choose several files."><input type="file" name="statements" accept="image/*,application/pdf" multiple required className={Files} /></Field>
        <fieldset className="grid gap-3 rounded-xl border border-line p-4"><legend className="px-1 text-sm font-bold">Guarantor</legend>
          <Field label="Full name"><input name="guarantor_name" required className="field" /></Field>
          <Field label="Phone number"><input name="guarantor_phone" type="tel" required className="field" /></Field>
        </fieldset>
        <p className="text-xs text-mut">Adding a card for monthly payments comes with the payments feature.</p>
        <button className="btn btn-p">Submit for review</button>
      </form>
    </KycShell>
  );
}
