import Link from "next/link";
import { LEVEL_UNLOCKS, type Role, type Step } from "@/lib/kyc";

const BADGE: Record<Step["state"], [string, string]> = {
  done: ["Done", "bg-maroon text-white"], pending: ["In review", "bg-copper/30 text-[#7a4a1e]"],
  rejected: ["Needs attention", "bg-red-100 text-red-800"], todo: ["To do", "border border-line bg-white text-mut"], soon: ["Coming soon", "border border-line bg-white text-mut"],
};

export default function KycCard({ role, level, steps }: { role: Role; level: number; steps: Step[] }) {
  return (
    <section className="rounded-xl border border-line bg-cream p-6" aria-labelledby="kyc">
      <h2 id="kyc" className="text-lg font-extrabold text-maroon">Verification (KYC): Level {level} of 3</h2>
      <div className="mt-4 grid gap-5">
        {([1, 2, 3] as const).map((lv) => (
          <div key={lv}>
            <h3 className="text-sm font-bold">Level {lv}<span className="font-medium text-mut"> · unlocks: {LEVEL_UNLOCKS[role][lv - 1]}</span></h3>
            <ul className="mt-2 grid gap-2">
              {steps.filter((s) => s.level === lv).map((s) => {
                const [label, cls] = BADGE[s.state];
                const body = (<><span><b className="block text-sm">{s.title}</b><span className="text-xs text-mut">{s.desc}</span>{s.note && <span className="mt-1 block text-xs text-red-800">Reviewer note: {s.note}</span>}</span><span className={`ml-auto flex-none rounded-full px-2.5 py-1 text-[11px] font-bold ${cls}`}>{label}</span></>);
                const canOpen = s.href && s.state !== "done" && s.state !== "pending" && s.state !== "soon";
                return <li key={s.title}>{canOpen ? <Link href={s.href!} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3 hover:border-maroon">{body}</Link> : <div className="flex items-center gap-3 rounded-lg border border-line bg-white p-3">{body}</div>}</li>;
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
