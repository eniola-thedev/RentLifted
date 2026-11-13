import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { Field } from "@/components/KycShell";
import PropertyForm from "@/components/PropertyForm";
import { createProperty } from "@/app/landlord/properties/actions";
import { requireProfile } from "@/lib/auth";
import { MEDIA } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function AdminNewProperty({ searchParams }: { searchParams: Promise<{ error?: string; landlord?: string }> }) {
  const { error, landlord } = await searchParams;
  await requireProfile("admin");
  const supabase = await createClient();
  const { data: landlords } = await supabase.from("offline_landlords").select("id, full_name, phone").order("full_name");
  const assisted = !!landlord && (landlords ?? []).some((l) => l.id === landlord);
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <AdminNav />
      <Link href="/admin/properties" className="text-sm font-bold text-maroon">← Our listings</Link>
      <h1 className="mt-4 text-3xl font-extrabold text-maroon">Post a property</h1>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <ol className="mt-4 grid gap-1 rounded-xl bg-cream p-4 text-sm text-mut">
        <li><b className="text-ink">1.</b> Choose who owns it, enter the details and save.</li>
        <li><b className="text-ink">2.</b> Add {MEDIA.minPhotos} to {MEDIA.maxPhotos} photos and {MEDIA.minVideos} to {MEDIA.maxVideos} videos{assisted ? ", and photograph the proof of ownership" : ""}.</li>
        <li><b className="text-ink">3.</b> Publish. It goes live straight away, with no listing fee.</li>
      </ol>
      <div className="mt-6">
        <PropertyForm action={createProperty} canSubmit={false} hideSubmit admin>
          <Field label="Who owns this property?" hint="For a landlord you met, add them first under Landlords">
            <select name="offline_landlord_id" defaultValue={assisted ? landlord : ""} className="field">
              <option value="">RENTLIFTED</option>
              {(landlords ?? []).map((l) => <option key={l.id} value={l.id}>{l.full_name} · {l.phone}</option>)}
            </select>
          </Field>
          <Link href="/admin/landlords/new" className="-mt-2 text-sm font-bold text-maroon underline">Add a new landlord</Link>
        </PropertyForm>
      </div>
    </main>
  );
}
