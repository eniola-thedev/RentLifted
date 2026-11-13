import { Field } from "@/components/KycShell";
import { saveLandlord } from "@/app/admin/landlords/actions";
import { listBanks, paystackEnabled } from "@/lib/paystack";

export type OfflineLandlord = {
  id: string; full_name: string; phone: string; email: string | null; address: string | null;
  id_type: string | null; id_number: string | null; id_files: string[];
  bank_code: string | null; bank_name: string | null; account_number: string | null; account_name: string | null;
};
export const ID_LABEL: Record<string, string> = { nin: "NIN slip or card", drivers_licence: "Driver’s licence", passport: "International passport", voters_card: "Voter’s card" };

// Filled in by an admin during a visit. Fields are grouped in the order they're collected.
export default async function LandlordForm({ d }: { d?: OfflineLandlord }) {
  const banks = paystackEnabled() ? await listBanks() : [];
  return (
    <form action={saveLandlord} className="grid gap-6">
      {d && <input type="hidden" name="id" value={d.id} />}
      <fieldset className="grid gap-4">
        <legend className="mb-2 text-lg font-extrabold">Contact details</legend>
        <Field label="Full name" hint="As it appears on their ID"><input name="full_name" defaultValue={d?.full_name} required minLength={3} autoComplete="off" className="field" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone"><input name="phone" type="tel" inputMode="tel" defaultValue={d?.phone} required placeholder="08012345678" className="field" /></Field>
          <Field label="Email" hint="Optional"><input name="email" type="email" defaultValue={d?.email ?? ""} className="field" /></Field>
        </div>
        <Field label="Home or office address" hint="Optional"><input name="address" defaultValue={d?.address ?? ""} className="field" /></Field>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-lg font-extrabold">ID</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ID type"><select name="id_type" defaultValue={d?.id_type ?? ""} className="field"><option value="">Choose</option>{Object.entries(ID_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          <Field label="ID number"><input name="id_number" defaultValue={d?.id_number ?? ""} autoComplete="off" className="field" /></Field>
        </div>
        <Field label={d?.id_files.length ? "Add more ID photos" : "Photo of the ID"} hint="Front and back. JPG, PNG or PDF, up to 10 MB each">
          <input type="file" name="id_files" accept="image/*,application/pdf" multiple className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-cream file:px-3 file:py-2 file:font-bold file:text-maroon" />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-lg font-extrabold">Bank account for upfront rent</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {banks.length ? (
            <Field label="Bank"><select name="bank" defaultValue={d?.bank_code ? `${d.bank_code}|${d.bank_name}` : ""} className="field">
              <option value="">Choose the bank</option>
              {banks.map((b) => <option key={b.code} value={`${b.code}|${b.name}`}>{b.name}</option>)}
            </select></Field>
          ) : <Field label="Bank name"><input name="bank_name" defaultValue={d?.bank_name ?? ""} className="field" /></Field>}
          <Field label="Account number"><input name="account_number" inputMode="numeric" pattern="\d{10}" maxLength={10} defaultValue={d?.account_number ?? ""} className="field tabular-nums" /></Field>
        </div>
        {!banks.length && <Field label="Account name"><input name="account_name" defaultValue={d?.account_name ?? ""} className="field" /></Field>}
        {banks.length > 0 && <p className="text-xs text-mut">{d?.account_name ? `Confirmed account name: ${d.account_name}.` : "We look up the account name from the bank to confirm it. Check it matches the name on the ID."}</p>}
      </fieldset>

      <div className="flex flex-wrap gap-3">
        {!d && <button name="next" value="list" className="btn btn-p">Save and list a property</button>}
        <button name="next" value="stay" className={d ? "btn btn-p" : "btn btn-o"}>{d ? "Save changes" : "Save landlord"}</button>
      </div>
    </form>
  );
}
