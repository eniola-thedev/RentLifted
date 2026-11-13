import { Field } from "@/components/KycShell";
import Icon from "@/components/Icon";
import { sendMessage } from "@/app/support/actions";

type Props = { kind: "contact" | "complaint"; topics: readonly string[]; error?: string; sent?: boolean; defaults?: { name?: string; email?: string } };

// Contact and complaint form. Plain server form: works without JavaScript; errors and success come back in the URL.
export default function SupportForm({ kind, topics, error, sent, defaults = {} }: Props) {
  const complaint = kind === "complaint";
  if (sent) return (
    <div role="status" className="flex gap-3 rounded-xl border border-line bg-cream p-6">
      <Icon name="check" className="h-6 w-6 flex-none text-maroon" />
      <div>
        <p className="font-extrabold text-maroon">{complaint ? "Complaint received" : "Message sent"}</p>
        <p className="mt-1 text-sm text-mut">{complaint ? "Thank you for telling us. We’ll acknowledge it within 1 working day and keep you updated by email until it’s resolved." : "Thanks for getting in touch. We usually reply within 1 working day."}</p>
      </div>
    </div>
  );
  return (
    <form action={sendMessage} className="grid gap-4" noValidate={false}>
      <input type="hidden" name="kind" value={kind} />
      {/* Honeypot: hidden from people, filled by bots */}
      <div aria-hidden="true" className="absolute left-[-9999px]"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name"><input name="full_name" required minLength={2} autoComplete="name" defaultValue={defaults.name} className="field" /></Field>
        <Field label="Email"><input name="email" type="email" required autoComplete="email" defaultValue={defaults.email} className="field" /></Field>
        <Field label="Phone" hint="Optional, if you’d like a call back"><input name="phone" type="tel" autoComplete="tel" className="field" /></Field>
        <Field label={complaint ? "What is it about?" : "Topic"}>
          <select name="topic" className="field" defaultValue="">
            <option value="" disabled>Choose one</option>
            {topics.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      {complaint && <Field label="Property, payment or application" hint="Optional. A title, address or the date of a payment helps us find it"><input name="reference" className="field" /></Field>}
      <Field label={complaint ? "What happened?" : "Message"} hint={complaint ? "Include dates and what you’d like us to do" : undefined}>
        <textarea name="message" required minLength={10} rows={6} className="field" />
      </Field>
      <div><button className="btn btn-p">{complaint ? "Submit complaint" : "Send message"}</button></div>
      <p className="text-xs text-mut">We use your details only to reply to you. See our <a href="/privacy" className="font-bold text-maroon underline">privacy policy</a>.</p>
    </form>
  );
}
