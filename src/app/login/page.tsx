import { signIn } from "@/app/actions";
import AuthSubmitButton from "@/components/AuthSubmitButton";
import PasswordField from "@/components/PasswordField";
import Link from "next/link";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string; next?: string }> }) {
  const { error, notice, next } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-5 py-14">
      <h1 className="text-3xl font-extrabold text-maroon">Welcome back</h1>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-lg bg-cream p-3 text-sm text-maroon">{notice}</p>}
      <form action={signIn} className="mt-6 grid gap-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <label htmlFor="login_email" className="grid gap-1 text-sm font-semibold">
          Email
          <input id="login_email" name="email" type="email" required autoComplete="email" className="field text-base sm:text-sm" />
        </label>
        <PasswordField id="login_password" name="password" label="Password" autoComplete="current-password" />
        <AuthSubmitButton label="Sign in" />
      </form>
      <p className="mt-5 text-sm text-mut">New here? <Link href="/signup" className="font-bold text-maroon">Create an account</Link></p>
    </main>
  );
}
