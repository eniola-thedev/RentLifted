import KycShell from "@/components/KycShell";
import IdentityForm from "@/components/IdentityForm";
import SmileVerify from "@/components/SmileVerify";
import { requireProfile } from "@/lib/auth";
import { smileEnabled } from "@/lib/smile";

export default async function Identity({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  await requireProfile();
  if (smileEnabled()) {
    return <KycShell title="Verify your identity" intro="We check your BVN or NIN and selfie with Smile ID." error={error}><SmileVerify /></KycShell>;
  }
  // Fallback when Smile ID isn't configured yet: manual review by an admin.
  return (
    <KycShell title="Verify your identity" intro="Enter your BVN or NIN and take a clear selfie. A team member will review it." error={error}>
      <IdentityForm />
    </KycShell>
  );
}
