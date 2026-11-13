import { redirect } from "next/navigation";
import { resendLink } from "@/app/actions";
import Icon from "@/components/Icon";

export default async function Verify({ searchParams }: { searchParams: Promise<{ email?: string; error?: string; notice?: string }> }) {
  const { email, error, notice } = await searchParams;
  if (!email) redirect("/login");
  return (
    <main className="mx-auto max-w-md px-5 py-14 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-cream text-maroon"><Icon name="doc" className="h-7 w-7" /></span>
      <h1 className="mt-5 text-3xl font-extrabold text-maroon">Confirm your email</h1>
      <p className="mt-2 text-pretty text-mut">We sent a confirmation link to <b className="break-all text-ink">{email}</b>. Open the email and click the link to activate your account.</p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-lg bg-cream p-3 text-sm text-maroon">{notice}</p>}
      <p className="mt-6 text-sm text-mut">Can’t find it? Check your spam or promotions folder. The link expires after an hour.</p>
      <form action={resendLink} className="mt-4"><input type="hidden" name="email" value={email} /><button className="btn btn-o">Send a new link</button></form>
    </main>
  );
}
