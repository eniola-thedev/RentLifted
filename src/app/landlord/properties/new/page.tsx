import Link from "next/link";
import PropertyForm from "@/components/PropertyForm";
import { requireProfile } from "@/lib/auth";
import { MEDIA, naira } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { createProperty } from "../actions";

export default async function NewProperty({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  await requireProfile("landlord");
  const supabase = await createClient();
  const { data: s } = await supabase.from("platform_settings").select("value").eq("key", "listing_fee").maybeSingle();
  const fee = Number(s?.value ?? 2000);
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/landlord" className="text-sm font-bold text-maroon">← Dashboard</Link>
      <h1 className="mt-4 text-3xl font-extrabold text-maroon">Add a property</h1>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <ol className="mt-4 grid gap-1 rounded-xl bg-cream p-4 text-sm text-mut">
        <li><b className="text-ink">1.</b> Enter the details below and save.</li>
        <li><b className="text-ink">2.</b> Add {MEDIA.minPhotos} to {MEDIA.maxPhotos} photos and {MEDIA.minVideos} to {MEDIA.maxVideos} videos.</li>
        <li><b className="text-ink">3.</b> Pay the {naira(fee)} listing fee, then submit for review.</li>
      </ol>
      <div className="mt-6"><PropertyForm action={createProperty} canSubmit={false} hideSubmit /></div>
    </main>
  );
}
