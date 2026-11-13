export type Role = "tenant" | "landlord" | "admin";
// Fully verified = KYC level 3: needed to apply for monthly rent (tenants) or receive payouts (landlords).
export const isVerified = (level: number) => level >= 3;
// Each role's home. Link here directly rather than through /dashboard, which only redirects.
export const homeFor = (role: string) => (role === "landlord" ? "/landlord" : role === "tenant" ? "/tenant" : "/admin/kyc");
export type Profile = { id: string; role: Role; full_name: string | null; phone: string | null; kyc_level: number };
