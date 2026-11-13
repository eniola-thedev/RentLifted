import KycShell, { Field, Files } from "@/components/KycShell";
import { requireProfile } from "@/lib/auth";
import { submitOwnership } from "../actions";

export default async function Ownership({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  await requireProfile("landlord");
  return (
    <KycShell title="Proof of ownership" intro="Show that you own the property, or are authorised to let it." error={error}>
      <form action={submitOwnership} className="grid gap-4">
        <Field label="I am the"><select name="capacity" className="field"><option value="owner">Owner</option><option value="agent">Agent or caretaker (upload the owner’s signed authorisation letter)</option></select></Field>
        <Field label="Property address"><input name="property_address" required className="field" /></Field>
        <Field label="Documents" hint="Certificate of Occupancy, deed, survey plan or authorisation letter. Up to 3 files (JPG, PNG or PDF, under 5 MB each)."><input type="file" name="documents" accept="image/*,application/pdf" multiple required className={Files} /></Field>
        <button className="btn btn-p">Submit for review</button>
      </form>
    </KycShell>
  );
}
