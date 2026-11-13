import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import PropertyForm from "@/components/PropertyForm";
import VideoUpload from "@/components/VideoUpload";
import { archiveProperty, deletePhoto, deleteVideo, payListingFee, updateProperty, uploadPhotos } from "@/app/landlord/properties/actions";
import { uploadOwnership } from "@/app/admin/landlords/actions";
import { createClient } from "@/lib/supabase/server";
import { confirmListingFee } from "@/lib/paystack";
import { MEDIA, naira, photoUrl, STATUS_LABEL, videoUrl } from "@/lib/format";
import type { Profile } from "@/lib/types";

type Media = { id: string; path: string; position: number };
type Props = { id: string; userId: string; profile: Profile; base: string; error?: string; notice?: string; reference?: string };

// Shared listing editor. Landlords pay the listing fee and submit for review; admins publish directly with no fee.
// Both need 2 to 5 photos and 1 to 2 videos.
export default async function ListingEditor({ id, userId, profile, base, error, notice, reference }: Props) {
  const admin = profile.role === "admin";
  let paidNow = false;
  if (reference && !admin) { try { paidNow = await confirmListingFee(reference); } catch { paidNow = false; } } // covers a slow webhook
  const supabase = await createClient();
  const [{ data: p }, { data: fee }, { data: setting }, { data: al }] = await Promise.all([
    // Admins can edit any admin-made listing; landlords only their own.
    admin ? supabase.from("properties").select("*, property_images(id, path, position), property_videos(id, path, position), profiles!properties_owner_id_fkey!inner(role)").eq("id", id).eq("profiles.role", "admin").maybeSingle()
      : supabase.from("properties").select("*, property_images(id, path, position), property_videos(id, path, position)").eq("id", id).eq("owner_id", userId).maybeSingle(),
    supabase.from("listing_fees").select("status, amount, paid_at").eq("property_id", id).maybeSingle(),
    supabase.from("platform_settings").select("value").eq("key", "listing_fee").maybeSingle(),
    admin ? supabase.from("assisted_listings").select("ownership_files, offline_landlords(id, full_name, phone, id_files, account_number, account_name, bank_name)").eq("property_id", id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if (!p) notFound();
  type Offline = { id: string; full_name: string; phone: string; id_files: string[]; account_number: string | null; account_name: string | null; bank_name: string | null };
  const assisted = al as { ownership_files: string[]; offline_landlords: Offline | Offline[] | null } | null;
  const owner = assisted ? (Array.isArray(assisted.offline_landlords) ? assisted.offline_landlords[0] : assisted.offline_landlords) : null;
  const ownershipLinks = assisted?.ownership_files.length ? (await supabase.storage.from("kyc-documents").createSignedUrls(assisted.ownership_files, 600)).data ?? [] : [];
  const sort = (m: Media[]) => [...m].sort((a, b) => a.position - b.position);
  const photos = sort(p.property_images as Media[]), videos = sort((p.property_videos ?? []) as Media[]);
  const [label, cls] = STATUS_LABEL[p.status] ?? [p.status, ""];
  const locked = ["rented", "sold"].includes(p.status);
  const feePaid = fee?.status === "paid", feeAmount = Number(fee?.amount ?? setting?.value ?? 2000);

  const checks: [boolean, string][] = [
    ...(admin ? [] : [[profile.kyc_level >= 2, "Verification Level 2 (BVN or NIN and selfie)"], [feePaid, `Listing fee of ${naira(feeAmount)} paid`]] as [boolean, string][]),
    ...(assisted ? [[!!owner?.id_files.length, "Landlord’s ID photo"], [!!(owner?.account_number && owner.account_name), "Landlord’s bank account confirmed"], [assisted.ownership_files.length > 0, "Proof of ownership"]] as [boolean, string][] : []),
    [photos.length >= MEDIA.minPhotos && photos.length <= MEDIA.maxPhotos, `${MEDIA.minPhotos} to ${MEDIA.maxPhotos} photos`],
    [videos.length >= MEDIA.minVideos && videos.length <= MEDIA.maxVideos, `${MEDIA.minVideos} to ${MEDIA.maxVideos} videos`],
  ];
  const ready = checks.every(([ok]) => ok);
  const showChecklist = !locked && (admin ? p.status !== "published" : !["published", "pending_review"].includes(p.status));
  const action = admin ? "publish" : "submit for review";

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Link href={base} className="text-sm font-bold text-maroon">← {admin ? "Our listings" : "My properties"}</Link>
      <div className="mt-4 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-extrabold text-maroon">{p.title}</h1><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${cls}`}>{label}</span></div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {(notice || paidNow) && <p role="status" className="mt-4 rounded-lg bg-cream p-3 text-sm text-maroon">{paidNow ? "Listing fee paid. Thank you." : notice}</p>}
      {p.status === "draft" && p.review_note && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">Changes requested: {p.review_note}</p>}
      {p.status === "published" && <p className="mt-4 rounded-lg bg-cream p-3 text-sm text-mut">{admin ? "This listing is live. Click Publish to save changes and keep it live, or Save as draft to take it offline." : "This listing is live. Saving changes sends it back for review and takes it offline until it’s approved again."}</p>}

      {showChecklist && (
        <section className="mt-6 rounded-xl border border-line p-5" aria-labelledby="ready">
          <h2 id="ready" className="font-extrabold">{ready ? `Ready to ${action}` : `Before you ${action}`}</h2>
          <ul className="mt-3 grid gap-2 text-sm">
            {checks.map(([ok, t]) => (
              <li key={t} className="flex items-center gap-2">
                <Icon name={ok ? "check" : "alert"} className={`h-4 w-4 flex-none ${ok ? "text-maroon" : "text-[#9a5a2c]"}`} />
                <span className={ok ? "" : "text-mut"}>{t}<span className="sr-only">{ok ? ", done" : ", still needed"}</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {assisted && (
        <section className="mt-6 rounded-xl bg-cream p-5" aria-labelledby="owner">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="owner" className="font-extrabold">Listed for {owner?.full_name ?? "a landlord"}</h2>
              <p className="text-sm text-mut tabular-nums">{owner?.phone}{owner?.account_name ? ` · Pays to ${owner.account_name}, ${owner.bank_name ?? ""} ${owner.account_number}` : " · No bank account yet"}</p>
            </div>
            {owner && <Link href={`/admin/landlords/${owner.id}`} className="btn btn-o !py-2">Landlord details</Link>}
          </div>
          <h3 className="mt-4 text-sm font-bold">Proof of ownership</h3>
          <p className="text-xs text-mut">Certificate of Occupancy, deed of assignment, survey plan or purchase receipt. Photos or PDF.</p>
          {ownershipLinks.length > 0 && <ul className="mt-2 flex flex-wrap gap-2">{ownershipLinks.map((s, i) => s.signedUrl && <li key={s.path}><a href={s.signedUrl} target="_blank" rel="noreferrer" className="btn btn-o !py-1.5 text-xs">Document {i + 1}</a></li>)}</ul>}
          {!locked && (
            <form action={uploadOwnership} className="mt-3 flex flex-wrap items-center gap-3">
              <input type="hidden" name="id" value={id} />
              <label className="sr-only" htmlFor="own">Choose ownership documents</label>
              <input id="own" type="file" name="ownership_files" accept="image/*,application/pdf" multiple required className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-bold file:text-maroon" />
              <button className="btn btn-o !py-2">Upload</button>
            </form>
          )}
        </section>
      )}

      {!admin && (
        <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-cream p-5" aria-labelledby="fee">
          <div>
            <h2 id="fee" className="font-extrabold">Listing fee</h2>
            <p className="text-sm text-mut">{feePaid ? `${naira(feeAmount)} paid. Edits and resubmissions are free.` : `${naira(feeAmount)}, paid once for this property.`}</p>
          </div>
          {feePaid ? <span className="inline-flex items-center gap-1 rounded-full bg-maroon px-3 py-1 text-xs font-bold text-white"><Icon name="check" className="h-3.5 w-3.5" />Paid</span>
            : !locked && <form action={payListingFee}><input type="hidden" name="id" value={id} /><button className="btn btn-p !py-2">Pay {naira(feeAmount)}</button></form>}
        </section>
      )}

      <section className="mt-8" aria-labelledby="ph">
        <h2 id="ph" className="text-lg font-extrabold">Photos <span className="font-medium text-mut tabular-nums">({photos.length}/{MEDIA.maxPhotos})</span></h2>
        <p className="text-sm text-mut">Add {MEDIA.minPhotos} to {MEDIA.maxPhotos} photos. The first one is the cover. JPG, PNG or WebP, up to {MEDIA.photoMB} MB each.</p>
        {photos.length > MEDIA.maxPhotos && <p className="mt-2 text-sm text-red-800">Remove {photos.length - MEDIA.maxPhotos} photo{photos.length - MEDIA.maxPhotos > 1 ? "s" : ""} to {action}.</p>}
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {photos.map((ph, i) => (
            <li key={ph.id} className="overflow-hidden rounded-lg border border-line">
              <img src={photoUrl(ph.path)} alt={`Photo ${i + 1}${i === 0 ? " (cover)" : ""}`} className="h-24 w-full object-cover" />
              {!locked && <form action={deletePhoto}><input type="hidden" name="id" value={id} /><input type="hidden" name="image_id" value={ph.id} /><button className="w-full py-1.5 text-xs font-bold text-red-800 hover:bg-red-50">Remove<span className="sr-only"> photo {i + 1}</span></button></form>}
            </li>
          ))}
        </ul>
        {!locked && photos.length < MEDIA.maxPhotos && (
          <form action={uploadPhotos} className="mt-3 flex flex-wrap items-center gap-3">
            <input type="hidden" name="id" value={id} />
            <label className="sr-only" htmlFor="photos">Choose photos</label>
            <input id="photos" type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple required className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-cream file:px-3 file:py-2 file:font-bold file:text-maroon" />
            <button className="btn btn-o !py-2">Upload photos</button>
          </form>
        )}
      </section>

      <section className="mt-8" aria-labelledby="vid">
        <h2 id="vid" className="text-lg font-extrabold">Videos <span className="font-medium text-mut tabular-nums">({videos.length}/{MEDIA.maxVideos})</span></h2>
        <p className="text-sm text-mut">Add {MEDIA.minVideos} or {MEDIA.maxVideos} videos so tenants can see the space.</p>
        {videos.length > 0 && (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {videos.map((v, i) => (
              <li key={v.id} className="overflow-hidden rounded-lg border border-line">
                <video src={videoUrl(v.path)} controls preload="metadata" className="aspect-video w-full bg-ink" aria-label={`Video ${i + 1}`} />
                {!locked && <form action={deleteVideo}><input type="hidden" name="id" value={id} /><input type="hidden" name="video_id" value={v.id} /><button className="w-full py-1.5 text-xs font-bold text-red-800 hover:bg-red-50">Remove<span className="sr-only"> video {i + 1}</span></button></form>}
              </li>
            ))}
          </ul>
        )}
        {!locked && videos.length < MEDIA.maxVideos && <VideoUpload propertyId={id} userId={userId} />}
      </section>

      {!locked && <section className="mt-10"><h2 className="mb-3 text-lg font-extrabold">Details</h2><PropertyForm action={updateProperty} d={p} canSubmit={ready} admin={admin} /></section>}
      {!locked && p.status !== "archived" && <form action={archiveProperty} className="mt-8"><input type="hidden" name="id" value={id} /><button className="text-sm font-bold text-red-800 underline">Archive this listing</button></form>}
    </main>
  );
}
