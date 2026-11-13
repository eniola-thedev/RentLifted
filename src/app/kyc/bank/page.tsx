import KycShell, { Field } from "@/components/KycShell";
import { requireProfile } from "@/lib/auth";
import { listBanks, paystackEnabled } from "@/lib/paystack";
import { submitBank } from "../actions";

export default async function Bank({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  await requireProfile("landlord");
  const banks = paystackEnabled() ? await listBanks() : [];
  return (
    <KycShell title="Bank account" intro="Upfront rent is paid into this account. The account name must match the name on your ID." error={error}>
      <form action={submitBank} className="grid gap-4">
        {banks.length ? (
          <Field label="Bank"><select name="bank" required className="field" defaultValue="">
            <option value="" disabled>Choose your bank</option>
            {banks.map((b) => <option key={b.code} value={`${b.code}|${b.name}`}>{b.name}</option>)}
          </select></Field>
        ) : <Field label="Bank name"><input name="bank_name" required className="field" /></Field>}
        <Field label="Account number"><input name="account_number" inputMode="numeric" pattern="\d{10}" maxLength={10} required className="field" /></Field>
        {!banks.length && <Field label="Account name"><input name="account_name" required className="field" /></Field>}
        {banks.length > 0 && <p className="text-xs text-mut">We look up the account name from your bank to confirm it.</p>}
        <button className="btn btn-p">Submit for review</button>
      </form>
    </KycShell>
  );
}
