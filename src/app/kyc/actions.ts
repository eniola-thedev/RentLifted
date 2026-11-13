"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Kind } from "@/lib/kyc";
import { paystackEnabled, resolveAccount } from "@/lib/paystack";

function back(path: string, msg: string): never { redirect(`${path}?error=${encodeURIComponent(msg)}`); }
function done(msg: string): never { redirect(`/kyc?notice=${encodeURIComponent(msg)}`); }
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const files = (fd: FormData, k: string) => fd.getAll(k).filter((f): f is File => f instanceof File && f.size > 0);
function phoneNG(v: string) {
  const d = v.replace(/[\s()-]/g, "");
  if (/^\+234\d{10}$/.test(d)) return d;
  if (/^0\d{10}$/.test(d)) return "+234" + d.slice(1);
  if (/^234\d{10}$/.test(d)) return "+" + d;
  return null;
}
async function me() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}
type Ctx = Awaited<ReturnType<typeof me>>;

async function upload({ supabase, user }: Ctx, file: File, label: string) {
  if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) throw new Error("Upload JPG, PNG or PDF files only.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Each file must be under 5 MB.");
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${user.id}/${label}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("kyc-documents").upload(path, file, { contentType: file.type });
  if (error) throw new Error("Upload failed. Please try again.");
  return path;
}
async function save(ctx: Ctx, kind: Kind, data: Record<string, unknown>, paths: string[]) {
  const { error } = await ctx.supabase.from("kyc_submissions").insert({ user_id: ctx.user.id, kind, data, files: paths });
  if (error) throw new Error("Could not save your submission. Please try again.");
}
async function run(path: string, work: () => Promise<void>, ok: string): Promise<never> {
  let err = "";
  try { await work(); } catch (e) { err = (e as Error).message; }
  if (err) back(path, err);
  done(ok);
}

export async function sendPhoneCode(fd: FormData) {
  const { supabase } = await me();
  const phone = phoneNG(s(fd, "phone"));
  if (!phone) back("/kyc/phone", "Enter a valid Nigerian phone number.");
  const { error } = await supabase.auth.updateUser({ phone });
  if (error) back("/kyc/phone", error.message);
  redirect(`/kyc/phone?sent=${encodeURIComponent(phone)}`);
}
export async function verifyPhone(fd: FormData) {
  const { supabase } = await me();
  const phone = s(fd, "phone");
  const { error } = await supabase.auth.verifyOtp({ phone, token: s(fd, "code"), type: "phone_change" });
  if (error) redirect(`/kyc/phone?sent=${encodeURIComponent(phone)}&error=${encodeURIComponent("That code is wrong or has expired.")}`);
  done("Phone verified.");
}

export async function submitIdentity(fd: FormData) {
  const ctx = await me(); const P = "/kyc/identity";
  const idType = s(fd, "id_type"), num = s(fd, "id_number"), [selfie] = files(fd, "selfie");
  if (!["bvn", "nin"].includes(idType)) back(P, "Choose BVN or NIN.");
  if (!/^\d{11}$/.test(num)) back(P, "Enter your 11-digit BVN or NIN.");
  if (!selfie) back(P, "Take or upload a selfie.");
  return run(P, async () => save(ctx, "identity", { id_type: idType, id_last4: num.slice(-4), id_number: num }, [await upload(ctx, selfie, "selfie")]), "Identity submitted for review.");
}

export async function submitWork(fd: FormData) {
  const ctx = await me();
  const type = s(fd, "employment_type") === "self_employed" ? "self_employed" : "employed";
  const P = `/kyc/work`, Q = (m: string): never => redirect(`${P}?type=${type}&error=${encodeURIComponent(m)}`);
  const income = Number(s(fd, "monthly_income").replace(/[,\s₦]/g, "")), address = s(fd, "address"), gName = s(fd, "guarantor_name"), gPhone = phoneNG(s(fd, "guarantor_phone"));
  const statements = files(fd, "statements");
  if (!Number.isFinite(income) || income < 10000 || income > 1e9) Q("Enter your monthly income in naira (at least ₦10,000).");
  if (address.length < 8) Q("Enter your full address.");
  if (gName.length < 3 || !gPhone) Q("Enter your guarantor’s name and a valid Nigerian phone number.");
  if (!statements.length) Q(type === "employed" ? "Upload your last 3 to 6 months of bank statements." : "Upload your last 6 to 12 months of bank statements.");
  if (statements.length > 12) Q("Upload at most 12 files.");
  const data: Record<string, unknown> = { employment_type: type, monthly_income: income, address, guarantor_name: gName, guarantor_phone: gPhone };
  if (type === "employed") {
    const company = s(fd, "company"), title = s(fd, "job_title"), staff = s(fd, "staff_id");
    if (!company || !title || !staff) Q("Enter your company, job title and staff ID.");
    Object.assign(data, { company, job_title: title, staff_id: staff });
  } else Object.assign(data, { business_name: s(fd, "business_name"), cac_number: s(fd, "cac_number") });
  const cac = files(fd, "cac_doc");
  return run(`${P}?type=${type}`.split("?")[0], async () => {
    const paths: string[] = [];
    for (const f of statements) paths.push(await upload(ctx, f, "statement"));
    for (const f of cac.slice(0, 1)) paths.push(await upload(ctx, f, "cac"));
    await save(ctx, "work", data, paths);
  }, "Work details submitted for review.");
}

export async function submitOwnership(fd: FormData) {
  const ctx = await me(); const P = "/kyc/ownership";
  const role = s(fd, "capacity") === "agent" ? "agent" : "owner", address = s(fd, "property_address"), docs = files(fd, "documents");
  if (address.length < 8) back(P, "Enter the property address.");
  if (!docs.length || docs.length > 3) back(P, "Upload 1 to 3 documents.");
  return run(P, async () => {
    const paths: string[] = [];
    for (const f of docs) paths.push(await upload(ctx, f, "ownership"));
    await save(ctx, "ownership", { capacity: role, property_address: address }, paths);
  }, "Ownership documents submitted for review.");
}

export async function submitBank(fd: FormData) {
  const ctx = await me(); const P = "/kyc/bank";
  const num = s(fd, "account_number");
  if (!/^\d{10}$/.test(num)) back(P, "Account number must be 10 digits.");
  let data: Record<string, unknown>;
  if (paystackEnabled()) {
    const [code, ...rest] = s(fd, "bank").split("|"), bankName = rest.join("|");
    if (!code || !bankName) back(P, "Choose your bank.");
    const name = await resolveAccount(num, code);
    if (!name) back(P, "We couldn’t verify that account. Check the account number and the bank.");
    data = { bank_name: bankName, bank_code: code, account_number: num, account_name: name, name_verified: true };
  } else {
    const bank = s(fd, "bank_name"), name = s(fd, "account_name");
    if (!bank || !name) back(P, "Enter the bank name and the account name.");
    data = { bank_name: bank, account_number: num, account_name: name };
  }
  return run(P, () => save(ctx, "bank_account", data, []), "Bank account submitted for review.");
}
