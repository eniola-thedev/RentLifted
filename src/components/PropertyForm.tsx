import { NG_STATES } from "@/lib/ng";
import { PROPERTY_TYPES } from "@/lib/properties";
import { Field } from "@/components/KycShell";

export type PropertyDraft = {
  id?: string; title?: string; description?: string | null; purpose?: string; property_type?: string; bedrooms?: number | null; bathrooms?: number | null;
  land_size_sqm?: number | null; state?: string; city?: string; area?: string | null; address?: string | null;
  annual_rent?: number | null; sale_price?: number | null; monthly_rent_available?: boolean; monthly_rent?: number | null;
};

// admin: the admin sets the monthly rent and publishes directly instead of submitting for review.
export default function PropertyForm({ action, d = {}, canSubmit, hideSubmit = false, admin = false, children }: { action: (fd: FormData) => Promise<void>; d?: PropertyDraft; canSubmit: boolean; hideSubmit?: boolean; admin?: boolean; children?: React.ReactNode }) {
  return (
    <form action={action} className="grid gap-4">
      {children /* extra fields placed first, such as who owns the property */}
      {d.id && <input type="hidden" name="id" value={d.id} />}
      <Field label="Title"><input name="title" defaultValue={d.title} required minLength={5} placeholder="3 Bedroom Apartment" className="field" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Listing for"><select name="purpose" defaultValue={d.purpose ?? "rent"} className="field"><option value="rent">Rent</option><option value="sale">Sale</option></select></Field>
        <Field label="Property type"><select name="property_type" defaultValue={d.property_type ?? "apartment"} className="field">{PROPERTY_TYPES.filter(([v]) => v !== "land" || d.property_type === "land").map(([v, l]) => <option key={v} value={v}>{l}</option>)/* land: coming soon, kept only for old drafts */}</select></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Bedrooms" hint="Not for land"><input name="bedrooms" type="number" min={0} max={50} defaultValue={d.bedrooms ?? ""} className="field" /></Field>
        <Field label="Bathrooms" hint="Not for land"><input name="bathrooms" type="number" min={0} max={50} defaultValue={d.bathrooms ?? ""} className="field" /></Field>
        <Field label="Land size (sqm)" hint="For land"><input name="land_size_sqm" inputMode="decimal" defaultValue={d.land_size_sqm ?? ""} className="field" /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Annual rent (₦)" hint="For rentals"><input name="annual_rent" inputMode="numeric" defaultValue={d.annual_rent ?? ""} className="field" /></Field>
        <Field label="Sale price (₦)" hint="For sales"><input name="sale_price" inputMode="numeric" defaultValue={d.sale_price ?? ""} className="field" /></Field>
      </div>
      <label className="flex items-start gap-3 rounded-lg bg-cream p-3 text-sm"><input type="checkbox" name="monthly_rent_available" defaultChecked={d.monthly_rent_available} className="mt-1" /><span><b>Offer monthly rent</b><span className="block text-xs text-mut">{admin ? "Eligible tenants can pay monthly. Enter the monthly amount below." : "Eligible tenants can pay monthly. RENTLIFTED sets the monthly amount when the listing is approved."}</span></span></label>
      {admin && <Field label="Monthly rent (₦)" hint="Needed to publish with monthly rent"><input name="monthly_rent" inputMode="numeric" defaultValue={d.monthly_rent ?? ""} className="field" /></Field>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="State"><select name="state" defaultValue={d.state ?? "Oyo"} className="field">{NG_STATES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="City"><input name="city" defaultValue={d.city ?? "Ibadan"} required className="field" /></Field>
        <Field label="Area" hint="For example Bodija"><input name="area" defaultValue={d.area ?? ""} className="field" /></Field>
        <Field label="Street address" hint="Shown only to approved applicants"><input name="address" defaultValue={d.address ?? ""} className="field" /></Field>
      </div>
      <Field label="Description"><textarea name="description" rows={5} defaultValue={d.description ?? ""} className="field" /></Field>
      <div className="flex flex-wrap gap-3">
        <button name="intent" value="draft" className={hideSubmit ? "btn btn-p" : "btn btn-o"}>{hideSubmit ? "Save and continue" : "Save as draft"}</button>
        {!hideSubmit && <button name="intent" value={admin ? "publish" : "submit"} disabled={!canSubmit} className="btn btn-p disabled:opacity-50">{admin ? "Publish" : "Submit for review"}</button>}
      </div>
      {!canSubmit && !hideSubmit && <p className="text-xs text-mut">Finish the checklist at the top of this page to {admin ? "publish" : "submit for review"}.</p>}
    </form>
  );
}
