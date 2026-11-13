import KycShell, { Field, Files } from "@/components/KycShell";
import { requireProfile } from "@/lib/auth";
import { sendPhoneCode, verifyPhone } from "../actions";

export default async function Phone({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { error, sent } = await searchParams;
  await requireProfile("landlord");
  return (
    <KycShell title="Verify your phone" intro="We’ll send a 6-digit code by SMS." error={error}>
      {sent ? (
        <form action={verifyPhone} className="grid gap-4">
          <input type="hidden" name="phone" value={sent} />
          <Field label={`Code sent to ${sent}`}><input name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} required autoComplete="one-time-code" className="field" /></Field>
          <button className="btn btn-p">Verify phone</button>
        </form>
      ) : (
        <form action={sendPhoneCode} className="grid gap-4">
          <Field label="Phone number" hint="For example 0803 123 4567"><input name="phone" type="tel" required autoComplete="tel" className="field" /></Field>
          <button className="btn btn-p">Send code</button>
        </form>
      )}
    </KycShell>
  );
}
