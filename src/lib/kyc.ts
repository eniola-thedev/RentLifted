export type Role = "tenant" | "landlord";
export type Kind = "identity" | "work" | "card" | "ownership" | "bank_account";
export type Submission = { id: string; kind: Kind; status: "pending" | "approved" | "rejected"; reviewer_note: string | null };
export type StepState = "done" | "pending" | "rejected" | "todo" | "soon";
export type Step = { level: 1 | 2 | 3; title: string; desc: string; href?: string; state: StepState; note?: string | null };

export const LEVEL_UNLOCKS: Record<Role, string[]> = {
  tenant: ["Save properties", "Apply for a property", "Eligible for monthly rent"],
  landlord: ["Save draft listings", "Publish listings", "Upfront rent payment"],
};

function stateOf(subs: Submission[], kind: Kind): { state: StepState; note: string | null } {
  const mine = subs.filter((s) => s.kind === kind); // newest first
  if (mine.some((s) => s.status === "approved")) return { state: "done", note: null };
  if (mine[0]?.status === "pending") return { state: "pending", note: null };
  if (mine[0]?.status === "rejected") return { state: "rejected", note: mine[0].reviewer_note };
  return { state: "todo", note: null };
}

export function buildSteps(role: Role, subs: Submission[], emailOk: boolean, phoneOk: boolean): Step[] {
  const email: Step = { level: 1, title: "Verify your email", desc: "Click the confirmation link we emailed you.", href: "/verify", state: emailOk ? "done" : "todo" };
  const ident = (): Step => ({ level: 2, title: "BVN or NIN and selfie", desc: "Confirm who you are.", href: "/kyc/identity", ...stateOf(subs, "identity") });
  if (role === "tenant") return [
    email, ident(),
    { level: 3, title: "Proof of work and income", desc: "Employer or business details, bank statements, salary range, address and a guarantor.", href: "/kyc/work", ...stateOf(subs, "work") },
    { level: 3, title: "Add a card for monthly payments", desc: "Add money by card once. We keep the card to cover any rent your wallet can’t.", href: "/tenant/wallet", ...stateOf(subs, "card") },
  ];
  return [
    email, { level: 1, title: "Verify your phone", desc: "Enter the code we send by SMS.", href: "/kyc/phone", state: phoneOk ? "done" : "todo" }, ident(),
    { level: 3, title: "Proof of ownership", desc: "Upload a document showing you own, or are authorised to let, the property.", href: "/kyc/ownership", ...stateOf(subs, "ownership") },
    { level: 3, title: "Bank account", desc: "Where upfront rent will be paid to you.", href: "/kyc/bank", ...stateOf(subs, "bank_account") },
  ];
}
