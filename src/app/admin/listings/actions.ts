"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MEDIA } from "@/lib/format";

export async function reviewListing(fd: FormData) {
  const id = String(fd.get("id")), approve = fd.get("decision") === "approve";
  const note = String(fd.get("note") ?? "").trim();
  const supabase = await createClient();
  const fail = (m: string): never => redirect(`/admin/listings?error=${encodeURIComponent(m)}`);
  if (approve) {
    const [{ count: photos }, { count: videos }] = await Promise.all([
      supabase.from("property_images").select("id", { count: "exact", head: true }).eq("property_id", id),
      supabase.from("property_videos").select("id", { count: "exact", head: true }).eq("property_id", id),
    ]);
    if ((photos ?? 0) < MEDIA.minPhotos || (photos ?? 0) > MEDIA.maxPhotos) fail(`A listing needs ${MEDIA.minPhotos} to ${MEDIA.maxPhotos} photos before approval.`);
    if ((videos ?? 0) < MEDIA.minVideos || (videos ?? 0) > MEDIA.maxVideos) fail(`A listing needs ${MEDIA.minVideos} to ${MEDIA.maxVideos} videos before approval.`);
    const { data: p } = await supabase.from("properties").select("monthly_rent_available").eq("id", id).single();
    const monthly = Number(String(fd.get("monthly_rent") ?? "").replace(/[,\s₦]/g, ""));
    if (p?.monthly_rent_available && !(monthly > 0)) fail("Enter the monthly rent amount for this listing.");
    const { error } = await supabase.from("properties").update({ status: "published", review_note: null, ...(p?.monthly_rent_available ? { monthly_rent: monthly } : {}) }).eq("id", id);
    if (error) fail("Could not approve this listing.");
  } else {
    const { error } = await supabase.from("properties").update({ status: "draft", review_note: note || "Please review your listing and submit it again." }).eq("id", id);
    if (error) fail("Could not send this listing back.");
  }
  revalidatePath("/admin/listings");
  redirect("/admin/listings");
}
