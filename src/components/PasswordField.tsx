"use client";

import { useState, type ChangeEventHandler, type Ref } from "react";

type PasswordFieldProps = {
  id: string;
  label: string;
  name: string;
  autoComplete: string;
  required?: boolean;
  minLength?: number;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  invalid?: boolean;
  describedBy?: string;
  inputRef?: Ref<HTMLInputElement>;
};

export default function PasswordField({
  id,
  label,
  name,
  autoComplete,
  required = true,
  minLength,
  value,
  onChange,
  invalid = false,
  describedBy,
  inputRef,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="grid gap-1 text-sm font-semibold">
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="field text-base pr-14 sm:text-sm"
        />
        <button
          type="button"
          className="auth-password-toggle absolute inset-y-0 right-1 my-auto inline-flex h-11 w-11 items-center justify-center rounded-lg text-mut hover:text-maroon"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
              <path d="M9.9 5.2A11 11 0 0112 5c5 0 8.5 4.5 9.5 7-.4 1.1-1.3 2.5-2.7 3.8M6.2 6.2C3.9 7.7 2.8 9.8 2.5 12c.5 1.3 1.4 2.6 2.7 3.8A10.7 10.7 0 0012 19c1.2 0 2.3-.2 3.3-.6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
