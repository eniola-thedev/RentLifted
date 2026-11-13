"use client";

import { useFormStatus } from "react-dom";

export default function AuthSubmitButton({ label, className = "" }: { label: string; className?: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={`btn btn-p auth-submit w-full ${className}`} disabled={pending} aria-busy={pending}>
      {pending && <span className="auth-submit__spinner motion-safe:animate-spin motion-reduce:animate-none" aria-hidden="true" />}
      {label}
    </button>
  );
}
