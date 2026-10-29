import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const CONSENT_TEXT =
  "I consent to PrivcybHub processing my name, email and organisation to respond to this request and send related updates. I can withdraw consent at any time via the unsubscribe link or privacy preferences.";

export function LeadForm({ sourceSlug, type = "contact", heading = "Talk to a privacy specialist", compact = false }:
  { sourceSlug?: string; type?: "contact" | "newsletter" | "demo"; heading?: string; compact?: boolean }) {
  const [f, setF] = useState({ name: "", email: "", organisation: "", message: "", website: "" });
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) { setErr("Please tick the consent box."); return; }
    setState("sending"); setErr("");
    const { data, error } = await supabase.functions.invoke("submit-lead", {
      body: { ...f, lead_type: type, source_slug: sourceSlug, consent_given: true, consent_text: CONSENT_TEXT },
    });
    if (error || data?.error) { setState("error"); setErr(data?.error || "Could not submit. Please try again."); return; }
    setState("done");
  };

  if (state === "done") return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
      <p className="font-semibold">Thank you — we'll be in touch.</p>
      <p className="text-sm text-muted-foreground mt-1">Your consent was recorded with a timestamp.</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6 space-y-3" noValidate>
      <h3 className="text-lg font-semibold">{heading}</h3>
      {!compact && <Input placeholder="Full name" maxLength={120} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-label="Full name" />}
      <Input type="email" required placeholder="Work email" maxLength={254} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} aria-label="Work email" />
      {!compact && <Input placeholder="Organisation" maxLength={160} value={f.organisation} onChange={(e) => setF({ ...f, organisation: e.target.value })} aria-label="Organisation" />}
      {!compact && <Textarea placeholder="How can we help?" maxLength={2000} rows={3} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} aria-label="Message" />}
      <input tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} name="website" />
      <label className="flex gap-3 items-start text-xs text-muted-foreground">
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" aria-label="Consent" />
        <span>{CONSENT_TEXT} See our <Link to="/privacy" className="underline">privacy policy</Link>.</span>
      </label>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <Button type="submit" disabled={state === "sending" || !f.email} className="w-full">{state === "sending" ? "Sending…" : type === "newsletter" ? "Subscribe" : "Submit"}</Button>
    </form>
  );
}
