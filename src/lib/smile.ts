export const smileEnabled = () =>
  !!(process.env.SMILE_ID_PARTNER_ID && process.env.SMILE_ID_API_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
export const smileEnv = () => (process.env.SMILE_ID_ENV === "production" ? "production" : "sandbox");
export const smileBase = () => (smileEnv() === "production" ? "https://api.smileidentity.com" : "https://testapi.smileidentity.com");
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
