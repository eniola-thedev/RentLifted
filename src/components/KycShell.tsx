import Link from "next/link";

export default function KycShell({ title, intro, error, children }: { title: string; intro?: string; error?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <Link href="/kyc" className="text-sm font-bold text-maroon">← Back to verification</Link>
      <h1 className="mt-4 text-3xl font-extrabold text-maroon">{title}</h1>
      {intro && <p className="mt-2 text-sm text-mut">{intro}</p>}
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="mt-6 grid gap-4">{children}</div>
    </main>
  );
}
export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="grid gap-1 text-sm font-semibold">{label}{children}{hint && <span className="text-xs font-normal text-mut">{hint}</span>}</label>;
}
export const Files = "text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-cream file:px-3 file:py-2 file:font-bold file:text-maroon";
