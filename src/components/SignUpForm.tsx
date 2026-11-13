"use client";

import { signUp } from "@/app/actions";
import AuthSubmitButton from "@/components/AuthSubmitButton";
import PasswordField from "@/components/PasswordField";
import { useRef, useState, type FormEvent } from "react";

export default function SignUpForm({ role }: { role?: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const confirmationRef = useRef<HTMLInputElement>(null);
  const passwordsDoNotMatch = submitted && password !== confirmation;

  function validatePasswords(event: FormEvent<HTMLFormElement>) {
    setSubmitted(true);
    if (password !== confirmation) {
      event.preventDefault();
      confirmationRef.current?.focus();
    }
  }

  return (
    <form action={signUp} onSubmit={validatePasswords} className="mt-6 grid gap-4">
      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="sr-only">Account type</legend>
        {(["tenant", "landlord"] as const).map((accountRole) => (
          <label
            key={accountRole}
            className="cursor-pointer rounded-xl border border-line p-4 text-sm focus-within:ring-2 focus-within:ring-maroon focus-within:ring-offset-2 has-[:checked]:border-maroon has-[:checked]:bg-cream"
          >
            <input
              type="radio"
              name="role"
              value={accountRole}
              defaultChecked={(role ?? "tenant") === accountRole}
              className="peer sr-only"
            />
            <b className="block capitalize">{accountRole === "tenant" ? "I’m a tenant" : "I’m a landlord"}</b>
            <span className="text-xs text-mut">{accountRole === "tenant" ? "Find a home, pay monthly" : "List and manage properties"}</span>
          </label>
        ))}
      </fieldset>
      <label htmlFor="full_name" className="grid gap-1 text-sm font-semibold">
        Full name
        <input id="full_name" name="full_name" required autoComplete="name" className="field text-base sm:text-sm" />
      </label>
      <label htmlFor="phone" className="grid gap-1 text-sm font-semibold">
        Phone
        <input id="phone" name="phone" type="tel" required autoComplete="tel" className="field text-base sm:text-sm" />
      </label>
      <label htmlFor="signup_email" className="grid gap-1 text-sm font-semibold">
        Email
        <input id="signup_email" name="email" type="email" required autoComplete="email" className="field text-base sm:text-sm" />
      </label>
      <PasswordField
        id="signup_password"
        name="password"
        label="Password"
        autoComplete="new-password"
        minLength={8}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <div>
        <PasswordField
          id="confirm_password"
          name="confirm_password"
          label="Confirm password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          invalid={passwordsDoNotMatch}
          describedBy={passwordsDoNotMatch ? "confirm_password_error" : undefined}
          inputRef={confirmationRef}
        />
        {passwordsDoNotMatch && (
          <p id="confirm_password_error" className="mt-1 text-sm font-normal text-red-800">
            Passwords do not match. Enter the same password in both fields.
          </p>
        )}
      </div>
      <AuthSubmitButton label="Create account" />
    </form>
  );
}
