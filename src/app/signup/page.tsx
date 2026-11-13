import SignUpForm from "@/components/SignUpForm";
import Link from "next/link";

export default async function SignUp({ searchParams }: { searchParams: Promise<{ error?: string; role?: string }> }) {
  const { error, role } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-5 py-14">
      <h1 className="text-3xl font-extrabold text-maroon">Create your account</h1>
      <p className="mt-2 text-sm text-mut">Choose how you want to use RENTLIFTED.</p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <SignUpForm role={role} />
      <p className="mt-5 text-sm text-mut">Already have an account? <Link href="/login" className="font-bold text-maroon">Sign in</Link></p>
    </main>
  );
}
