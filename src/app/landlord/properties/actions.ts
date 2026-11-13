"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NG_STATES } from "@/lib/ng";
import { isPropertyType } from "@/lib/properties";
import { MEDIA } from "@/lib/format";
import { initListingFee, paystackEnabled } from "@/lib/paystack";
import { siteUrl } from "@/lib/smile";

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
function num(fd: FormData, k: string) {
  const v = text(fd, k).replace(/[,\s₦]/g, "");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n < 1e12 ? n : NaN;
}
function go(path: string, key: "error" | "notice", msg: string): never { redirect(`${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(msg)}`); }
async function me() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "landlord" && prof?.role !== "admin") redirect("/dashboard");
  const isAdmin = prof.role === "admin";
  // Landlords and admins share these actions; each works under their own pages.
  return { supabase, user, isAdmin, base: isAdmin ? "/admin/properties" : "/landlord/properties" };
}

function parse(fd: FormData) {
  const purpose = text(fd, "purpose"), type = text(fd, "property_type"), title = text(fd, "title"), state = text(fd, "state"), city = text(fd, "city");
  const [annual, price, beds, baths, size] = ["annual_rent", "sale_price", "bedrooms", "bathrooms", "land_size_sqm"].map((k) => num(fd, k));
  const err = (e: string) => ({ error: e } as const);
  if (!["rent", "sale"].includes(purpose)) return err("Choose rent or sale.");
  if (!isPropertyType(type)) return err("Choose a property type.");
  if (purpose === "rent" && type === "land") return err("Land can only be listed for sale.");
  if (title.length < 5) return err("Enter a title of at least 5 characters.");
  if (!NG_STATES.includes(state) || !city) return err("Enter the state and city.");
  if ([annual, price, beds, baths, size].some((n) => Number.isNaN(n))) return err("Use numbers only in the number fields.");
  if (purpose === "rent" && !annual) return err("Enter the annual rent.");
  if (purpose === "sale" && !price) return err("Enter the sale price.");
  if (type === "land" && !size) return err("Enter the land size in sqm.");
  if (type !== "land" && (beds == null || beds > 50)) return err("Enter the number of bedrooms.");
  const isLand = type === "land";
  return { row: {
    title, purpose, property_type: type, state, city,
    description: text(fd, "description") || null, area: text(fd, "area") || null, address: text(fd, "address") || null,
    bedrooms: isLand ? null : beds, bathrooms: isLand ? null : baths, land_size_sqm: isLand ? size : null,
    annual_rent: purpose === "rent" ? annual : null, sale_price: purpose === "sale" ? price : null,
    monthly_rent_available: purpose === "rent" && fd.get("monthly_rent_available") === "on",
  } } as const;
}
const target = (fd: FormData) => (text(fd, "intent") === "submit" ? "pending_review" : "draft");
const GATE = "Complete verification Level 2 to submit listings for review.";

export async function createProperty(fd: FormData) {
  const { supabase, user, base, isAdmin } = await me();
  const p = parse(fd);
  if ("error" in p) go(`${base}/new`, "error", p.error);
  // New listings always start as drafts: photos and videos (and, for landlords, the listing fee) come next.
  const monthly = isAdmin && p.row.monthly_rent_available ? num(fd, "monthly_rent") : null;
  const { data, error } = await supabase.from("properties").insert({ ...p.row, owner_id: user.id, status: "draft", ...(monthly ? { monthly_rent: monthly } : {}) }).select("id").single();
  if (error || !data) go(`${base}/new`, "error", isAdmin ? "Could not save this listing." : "Complete your email and phone verification before adding listings.");
  const offline = isAdmin ? text(fd, "offline_landlord_id") : "";
  if (offline) { // listed by an admin for a landlord met in person
    const link = await supabase.from("assisted_listings").insert({ property_id: data.id, landlord_id: offline });
    if (link.error) { await supabase.from("properties").delete().eq("id", data.id); go(`${base}/new`, "error", "Could not link this listing to the landlord."); }
  }
  revalidatePath(base);
  go(`${base}/${data.id}`, "notice", isAdmin ? "Draft saved. Now add photos and videos, then publish." : "Draft saved. Now add photos and videos, and pay the listing fee.");
}

export async function updateProperty(fd: FormData) {
  const { supabase, base, isAdmin } = await me();
  const id = text(fd, "id"), back = `${base}/${id}`;
  const p = parse(fd);
  if ("error" in p) go(back, "error", p.error);
  const { data: cur } = await supabase.from("properties").select("status").eq("id", id).single();
  if (!cur || ["rented", "sold"].includes(cur.status)) go(back, "error", "This listing can’t be edited.");

  if (isAdmin) { // admins publish their own listings directly: no fee, same photo and video rules
    const publish = text(fd, "intent") === "publish";
    const monthly = p.row.monthly_rent_available ? num(fd, "monthly_rent") : null;
    if (publish) {
      const [{ count: photos }, { count: videos }] = await Promise.all([
        supabase.from("property_images").select("id", { count: "exact", head: true }).eq("property_id", id),
        supabase.from("property_videos").select("id", { count: "exact", head: true }).eq("property_id", id),
      ]);
      if ((photos ?? 0) < MEDIA.minPhotos || (photos ?? 0) > MEDIA.maxPhotos || (videos ?? 0) < MEDIA.minVideos || (videos ?? 0) > MEDIA.maxVideos)
        go(back, "error", `Add ${MEDIA.minPhotos} to ${MEDIA.maxPhotos} photos and ${MEDIA.minVideos} to ${MEDIA.maxVideos} videos before publishing.`);
      if (p.row.monthly_rent_available && !(Number(monthly) > 0)) go(back, "error", "Enter the monthly rent amount.");
      const { data: al } = await supabase.from("assisted_listings").select("ownership_files, offline_landlords(id_files, account_number, account_name)").eq("property_id", id).maybeSingle();
      if (al) { // listed for a landlord met in person: their verification must be complete
        const l = (Array.isArray(al.offline_landlords) ? al.offline_landlords[0] : al.offline_landlords) as { id_files: string[]; account_number: string | null; account_name: string | null } | null;
        if (!l?.id_files.length) go(back, "error", "Add a photo of the landlord’s ID before publishing.");
        if (!l?.account_number || !l.account_name) go(back, "error", "Add the landlord’s bank account before publishing.");
        if (!al.ownership_files.length) go(back, "error", "Add the proof of ownership before publishing.");
      }
    }
    const { error } = await supabase.from("properties").update({ ...p.row, monthly_rent: monthly || null, review_note: null, status: publish ? "published" : "draft" }).eq("id", id);
    if (error) go(back, "error", "Could not save your changes.");
    revalidatePath(base);
    go(back, "notice", publish ? "Published. The listing is live." : "Saved as a draft.");
  }

  const { error } = await supabase.from("properties").update({ ...p.row, status: target(fd) }).eq("id", id);
  if (error?.message.includes("listing not ready")) go(back, "error", "Before submitting, pay the listing fee and add 2 to 5 photos and 1 to 2 videos.");
  if (error) go(back, "error", target(fd) === "pending_review" ? GATE : "Could not save your changes.");
  revalidatePath(base);
  go(back, "notice", target(fd) === "pending_review" ? "Submitted for review." : "Saved as a draft.");
}

export async function archiveProperty(fd: FormData) {
  const { supabase, base } = await me();
  const id = text(fd, "id");
  await supabase.from("properties").update({ status: "archived" }).eq("id", id);
  revalidatePath(base);
  redirect(base);
}

export async function uploadPhotos(fd: FormData) {
  const { supabase, user, base } = await me();
  const id = text(fd, "id"), back = `${base}/${id}`;
  const files = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) go(back, "error", "Choose at least one photo.");
  const { count } = await supabase.from("property_images").select("id", { count: "exact", head: true }).eq("property_id", id);
  if ((count ?? 0) + files.length > MEDIA.maxPhotos) go(back, "error", `A listing can have up to ${MEDIA.maxPhotos} photos.`);
  let err = "";
  try {
    let pos = count ?? 0;
    for (const f of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) throw new Error("Photos must be JPG, PNG or WebP.");
      if (f.size > 5 * 1024 * 1024) throw new Error("Each photo must be under 5 MB.");
      const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/${id}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("property-images").upload(path, f, { contentType: f.type });
      if (up.error) throw new Error("Upload failed. Please try again.");
      const ins = await supabase.from("property_images").insert({ property_id: id, path, position: pos++ });
      if (ins.error) { await supabase.storage.from("property-images").remove([path]); throw new Error("Could not save the photo."); }
    }
  } catch (e) { err = (e as Error).message; }
  revalidatePath(back);
  if (err) go(back, "error", err);
  go(back, "notice", "Photos added.");
}

export async function deletePhoto(fd: FormData) {
  const { supabase, base } = await me();
  const imageId = text(fd, "image_id"), id = text(fd, "id");
  const { data } = await supabase.from("property_images").select("path").eq("id", imageId).single();
  if (data) {
    await supabase.storage.from("property-images").remove([data.path]);
    await supabase.from("property_images").delete().eq("id", imageId);
  }
  revalidatePath(`${base}/${id}`);
  go(`${base}/${id}`, "notice", "Photo removed.");
}

// Starts the Paystack checkout for this listing's fee. Paystack returns to the listing page, which confirms it.
export async function payListingFee(fd: FormData) {
  const { supabase, user, base } = await me();
  const id = text(fd, "id"), back = `${base}/${id}`;
  if (!paystackEnabled()) go(back, "error", "Payments aren’t set up yet. Please try again later.");
  const { data: p } = await supabase.from("properties").select("id").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!p) go(base, "error", "Listing not found.");
  const { data: fee } = await supabase.from("listing_fees").select("status").eq("property_id", id).maybeSingle();
  if (fee?.status === "paid") go(back, "notice", "The listing fee is already paid.");
  const { data: s } = await supabase.from("platform_settings").select("value").eq("key", "listing_fee").maybeSingle();
  const url = await initListingFee({ email: user.email!, propertyId: id, userId: user.id, naira: Number(s?.value ?? 2000), callbackUrl: `${siteUrl()}${back}` });
  if (!url) go(back, "error", "We couldn’t start the payment. Please try again.");
  redirect(url);
}

// Videos are uploaded straight from the browser to storage (they're too big for a form post); this records the upload.
export async function registerVideo(id: string, path: string): Promise<{ error?: string }> {
  const { supabase, user, base } = await me();
  if (!path.startsWith(`${user.id}/${id}/`) || path.includes("..")) return { error: "That upload isn’t valid." };
  const { count } = await supabase.from("property_videos").select("id", { count: "exact", head: true }).eq("property_id", id);
  const { error } = await supabase.from("property_videos").insert({ property_id: id, path, position: count ?? 0 });
  if (error) {
    await supabase.storage.from("property-videos").remove([path]);
    return { error: error.message.includes("up to 2") ? `A listing can have up to ${MEDIA.maxVideos} videos.` : "Could not save the video." };
  }
  revalidatePath(`${base}/${id}`);
  return {};
}

export async function deleteVideo(fd: FormData) {
  const { supabase, base } = await me();
  const videoId = text(fd, "video_id"), id = text(fd, "id");
  const { data } = await supabase.from("property_videos").select("path").eq("id", videoId).single();
  if (data) {
    await supabase.storage.from("property-videos").remove([data.path]);
    await supabase.from("property_videos").delete().eq("id", videoId);
  }
  revalidatePath(`${base}/${id}`);
  go(`${base}/${id}`, "notice", "Video removed.");
}
