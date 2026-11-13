"use client";

import { submitIdentity } from "@/app/kyc/actions";
import AuthSubmitButton from "@/components/AuthSubmitButton";
import SelfieCapture from "@/components/SelfieCapture";
import { useRef, useState, type FormEvent } from "react";

export default function IdentityForm() {
  const [captured, setCaptured] = useState(false);
  const [selfieError, setSelfieError] = useState(false);
  const cameraButtonRef = useRef<HTMLButtonElement>(null);

  function validateSelfie(event: FormEvent<HTMLFormElement>) {
    if (!captured) {
      event.preventDefault();
      setSelfieError(true);
      cameraButtonRef.current?.focus();
    }
  }

  return (
    <form action={submitIdentity} onSubmit={validateSelfie} className="grid gap-4">
      <label className="grid gap-1 text-sm font-semibold">
        ID type
        <select name="id_type" className="field text-base sm:text-sm" required>
          <option value="bvn">BVN</option>
          <option value="nin">NIN</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        BVN or NIN
        <input name="id_number" inputMode="numeric" pattern="\d{11}" maxLength={11} required autoComplete="off" className="field text-base sm:text-sm" />
        <span className="text-xs font-normal text-mut">11 digits. Only the last 4 digits are kept after review.</span>
      </label>
      <div className="grid gap-1 text-sm font-semibold">
        <span>Selfie</span>
        <span className="text-xs font-normal text-mut">Face the camera in good light. Your photo is saved as a JPG for review.</span>
        <SelfieCapture
          captured={captured}
          onCaptured={(value) => { setCaptured(value); if (value) setSelfieError(false); }}
          onCameraButtonRef={cameraButtonRef}
        />
        {selfieError && <p role="alert" className="text-sm font-normal text-red-800">Take a selfie before submitting your identity details.</p>}
      </div>
      <AuthSubmitButton label="Submit for review" />
    </form>
  );
}
