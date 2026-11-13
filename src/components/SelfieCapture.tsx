"use client";

import { useEffect, useRef, useState, type Ref } from "react";

type SelfieCaptureProps = {
  captured: boolean;
  onCaptured: (captured: boolean) => void;
  onCameraButtonRef?: Ref<HTMLButtonElement>;
};

function cameraError(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Camera access was blocked. Allow camera access in your browser settings, then try again.";
    }
    if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
      return "No usable camera was found on this device.";
    }
    if (error.name === "NotReadableError") {
      return "The camera is already in use. Close other apps using it and try again.";
    }
  }
  return "Could not open the camera. Check your camera connection and try again.";
}

export default function SelfieCapture({ captured, onCaptured, onCameraButtonRef }: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewUrlRef = useRef("");
  const mountedRef = useRef(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!cameraOpen || !streamRef.current || !videoRef.current) return;
    const stream = streamRef.current;
    videoRef.current.srcObject = stream;
    void videoRef.current.play().catch(() => {
      setError("Could not display the camera preview. Close it and try again.");
      stopCamera();
    });
    return () => {
      if (videoRef.current?.srcObject === stream) videoRef.current.srcObject = null;
    };
  }, [cameraOpen]);

  async function startCamera() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access requires a secure connection and a browser that supports camera capture.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
      });
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      setCameraOpen(true);
    } catch (cameraFailure) {
      setError(cameraError(cameraFailure));
    }
  }

  async function captureSelfie() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setError("The camera is not ready yet. Wait for the preview, then try again.");
      return;
    }

    const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) {
      setError("Could not capture the photo. Please try again.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) {
      setError("Could not capture the photo. Please try again.");
      return;
    }
    if (blob.size > 5 * 1024 * 1024) {
      setError("The photo is too large to upload. Move closer to the camera and try again.");
      return;
    }

    const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    if (fileRef.current) fileRef.current.files = transfer.files;

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = URL.createObjectURL(blob);
    setPreviewUrl(previewUrlRef.current);
    onCaptured(true);
    setError("");
    stopCamera();
  }

  function clearCapture() {
    if (fileRef.current) fileRef.current.value = "";
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = "";
    setPreviewUrl("");
    onCaptured(false);
    setError("");
  }

  return (
    <div className="grid gap-3">
      <input ref={fileRef} type="file" name="selfie" accept="image/jpeg" className="sr-only" tabIndex={-1} aria-hidden="true" />
      {cameraOpen && (
        <div className="selfie-camera">
          <video ref={videoRef} autoPlay playsInline muted className="selfie-camera__video" aria-label="Live selfie camera preview" />
          <p className="selfie-camera__live"><span aria-hidden="true" /> Camera is on</p>
        </div>
      )}
      {!cameraOpen && previewUrl && (
        <div className="selfie-camera">
          {/* This preview is the image the user just captured. */}
          <img src={previewUrl} alt="Captured selfie preview" className="selfie-camera__video" />
        </div>
      )}

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-normal text-red-800">{error}</p>}

      {cameraOpen ? (
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn btn-p min-h-11" onClick={captureSelfie}>Capture selfie</button>
          <button type="button" className="btn btn-o min-h-11" onClick={() => { stopCamera(); setError(""); }}>Close camera</button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            ref={onCameraButtonRef}
            type="button"
            className="btn btn-p selfie-take min-h-11"
            onClick={() => { if (captured) clearCapture(); void startCamera(); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <path d="M4 7h3l1.5-2h7L17 7h3v12H4z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            {captured ? "Retake selfie" : "Take a selfie"}
          </button>
        </div>
      )}
      <p className="text-xs font-normal text-mut">
        Your browser will ask for camera permission. The camera turns on only when you choose “Take a selfie.”
      </p>
    </div>
  );
}
