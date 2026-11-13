"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { paystackEnabled, resolveAccount } from "@/lib/paystack";
import { createClient } from "@/lib/supabase/server";

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
function go(path: string, key: "error" | "notice", msg: string): never { redirect(`${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(msg)}`); }
const ID_TYPES = ["nin", "drivers_licence", "passport", "voters_card"];
const DOC_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

// Uploads documents (ID, proof of ownership) into the private kyc-documents bucket, under the admin's folder.
async function uploadDocs(files: File[], folder: string) {
  const supabase = await createClient();
  const paths: string[] = [];
  for (const f of files) {
    if (!DOC_TYPES.includes(f.type)) throw new Error("Documents must be photos (JPG, PNG, WebP) or PDF.");
    if (f.size > 10 * 1024 * 1024) throw new Error("Each document must be under 10 MB.");
    const ext = f.type === "application/pdf" ? "pdf" : f.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from("kyc-documents").upload(path, f, { contentType: f.type });
    if (up.error) throw new Error("A document didn’t upload. Please try again.");
    paths.push(path);
  }
  return paths;
}
const filesOf = (fd: FormData, k: string) => fd.getAll(k).filter((f): f is File => f instanceof File && f.size > 0);

export async function saveLandlord(fd: FormData) {
  const { user } = await requireProfile("admin");
  const supabase = await createClient();
  const id = text(fd, "id"), back = id ? `/admin/landlords/${id}` : "/admin/landlords/new";
  const full_name = text(fd, "full_name"), phone = text(fd, "phone").replace(/\s/g, "");
  if (full_name.length < 3) go(back, "error", "Enter the landlord’s full name.");
  if (!/^(\+?234|0)\d{10}$/.test(phone)) go(back, "error", "Enter a valid Nigerian phone number, for example 08012345678.");
  const id_type = text(fd, "id_type");
  if (id_type && !ID_TYPES.includes(id_type)) go(back, "error", "Choose the ID type.");

  // Bank account: confirm the account name with Paystack when it's set up, so payouts go to the right person.
  const [bank_code, bank_name] = text(fd, "bank").split("|");
  const account_number = text(fd, "account_number");
  let account_name: string | null = text(fd, "account_name") || null;
  if (account_number && !/^\d{10}$/.test(account_number)) go(back, "error", "The account number must be 10 digits.");
  if (account_number && bank_code && paystackEnabled()) {
    account_name = await resolveAccount(account_number, bank_code);
    if (!account_name) go(back, "error", "We couldn’t find that account at the bank chosen. Check the bank and account number.");
  }

  const row = {
    full_name, phone, email: text(fd, "email") || null, address: text(fd, "address") || null,
    id_type: id_type || null, id_number: text(fd, "id_number") || null,
    ...(account_number ? { bank_code: bank_code || null, bank_name: bank_name || text(fd, "bank_name") || null, account_number, account_name } : {}),
  };
  const res = id ? await supabase.from("offline_landlords").update(row).eq("id", id).select("id, id_files").single()
    : await supabase.from("offline_landlords").insert({ ...row, created_by: user.id }).select("id, id_files").single();
  if (res.error || !res.data) go(back, "error", "Could not save the landlord.");
  const lid = res.data.id;

  const idPhotos = filesOf(fd, "id_files");
  if (idPhotos.length) {
    try {
      const paths = await uploadDocs(idPhotos, `${user.id}/offline/${lid}`);
      await supabase.from("offline_landlords").update({ id_files: [...(res.data.id_files ?? []), ...paths] }).eq("id", lid);
    } catch (e) { go(`/admin/landlords/${lid}`, "error", (e as Error).message); }
  }
  revalidatePath("/admin/landlords");
  const next = text(fd, "next");
  if (next === "list" && !id) redirect(`/admin/properties/new?landlord=${lid}`);
  go(`/admin/landlords/${lid}`, "notice", account_name && account_number ? `Saved. Bank account confirmed: ${account_name}.` : "Saved.");
}

// Proof that this landlord owns the property (C of O, deed, receipt, etc.), stored per listing.
export async function uploadOwnership(fd: FormData) {
  const { user } = await requireProfile("admin");
  const supabase = await createClient();
  const pid = text(fd, "id"), back = `/admin/properties/${pid}`;
  const files = filesOf(fd, "ownership_files");
  if (!files.length) go(back, "error", "Choose at least one document.");
  const { data: al } = await supabase.from("assisted_listings").select("ownership_files").eq("property_id", pid).single();
  if (!al) go(back, "error", "This listing isn’t linked to a landlord.");
  try {
    const paths = await uploadDocs(files, `${user.id}/ownership/${pid}`);
    await supabase.from("assisted_listings").update({ ownership_files: [...al.ownership_files, ...paths] }).eq("property_id", pid);
  } catch (e) { go(back, "error", (e as Error).message); }
  revalidatePath(back);
  go(back, "notice", "Proof of ownership added.");
}
