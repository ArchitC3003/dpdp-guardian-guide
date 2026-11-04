import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const Body = z.object({
  lead_type: z.enum(["contact", "newsletter", "demo"]).default("contact"),
  name: z.string().trim().max(120).optional().default(""),
  email: z.string().trim().email().max(254),
  organisation: z.string().trim().max(160).optional().default(""),
  message: z.string().trim().max(2000).optional().default(""),
  source_slug: z.string().trim().max(160).optional().default(""),
  consent_given: z.literal(true),
  consent_text: z.string().trim().min(10).max(600),
  consent_version: z.string().trim().max(20).optional(),
  website: z.string().optional().default(""), // honeypot
});

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function sha256(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const UNIFORM = { ok: true, message: "Thanks. Check your inbox if this is a new subscription." };
const VISITOR_SALT = crypto.randomUUID(); // rotates on every cold start (well under 24h)
const visits = new Map<string, number[]>();
function visitorAllowed(key: string, max = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const hits = (visits.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) { visits.set(key, hits); return false; }
  hits.push(now); visits.set(key, hits);
  if (visits.size > 5000) for (const [k, v] of visits) if (!v.some((t) => now - t < windowMs)) visits.delete(k);
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Please check the form fields and consent box." }, 400);
    const d = parsed.data;
    if (d.website) return json(d.lead_type === "newsletter" ? UNIFORM : { ok: true }); // bot: silently accept

    if (d.lead_type === "newsletter") {
      // Per-visitor limit: salted hash of IP + user agent, held in memory only (never stored).
      const ipRaw = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
      const visitor = await sha256(`${VISITOR_SALT}|${ipRaw}|${req.headers.get("user-agent") || ""}`);
      if (!visitorAllowed(visitor)) return json({ error: "Too many submissions. Please try again later." }, 429);

      const started = Date.now();
      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const email = d.email.toLowerCase();
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await admin.from("marketing_leads").select("id", { count: "exact", head: true })
        .eq("email", email).eq("purpose", "dpdp_newsletter").gte("created_at", since);
      // Current status = most recent record for this email.
      const { data: latest } = await admin.from("marketing_leads").select("status").eq("email", email)
        .eq("purpose", "dpdp_newsletter").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if ((count ?? 0) < 3 && latest?.status !== "subscribed") {
        const tok = Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("");
        // Append-only: always a new consent record; earlier (withdrawn) records are never changed.
        const { error } = await admin.from("marketing_leads").insert({
          lead_type: "newsletter", email, consent_given: true, consent_text: d.consent_text,
          consent_version: d.consent_version || "v1.0", purpose: "dpdp_newsletter",
          consent_at: new Date().toISOString(), source: "learn_page", status: "subscribed",
          unsubscribe_token_hash: await sha256(tok),
        });
        if (error) throw error;
        // tok is only ever placed in the email's unsubscribe link once sending is built.
      }
      // Same response and similar timing for new, subscribed, withdrawn or rate-limited emails.
      const wait = 400 - (Date.now() - started);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait + Math.random() * 100));
      return json(UNIFORM);
    }

    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
    const ip_hash = await sha256(ip + "|privcybhub-leads");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin.from("marketing_leads").select("id", { count: "exact", head: true })
      .eq("ip_hash", ip_hash).gte("created_at", since);
    if ((count ?? 0) >= 5) return json({ error: "Too many submissions. Please try again later." }, 429);

    const { error } = await admin.from("marketing_leads").insert({
      lead_type: d.lead_type, name: d.name || null, email: d.email.toLowerCase(),
      organisation: d.organisation || null, message: d.message || null,
      source_slug: d.source_slug || null, consent_given: true, consent_text: d.consent_text,
      user_agent: (req.headers.get("user-agent") || "").slice(0, 300), ip_hash,
    });
    if (error) throw error;
    return json({ ok: true });
  } catch (e) {
    console.error("submit-lead", e);
    return json({ error: "Could not submit right now." }, 500);
  }
});
