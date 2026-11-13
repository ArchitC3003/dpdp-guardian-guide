// Public intake for Data Principal rights requests and grievances.
// Works signed in or signed out: the tables stay closed to anonymous writes and
// every submission is validated and rate limited here before it is recorded.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const email = z.string().trim().toLowerCase().email().max(254);
const Body = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("rights"),
    email,
    request_type: z.string().trim().min(3).max(160),
    description: z.string().trim().min(1).max(500),
    confirmed: z.literal(true),
    website: z.string().optional().default(""), // honeypot
  }),
  z.object({
    kind: z.literal("grievance"),
    email,
    subject: z.string().trim().min(1).max(200),
    nature: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(1000),
    website: z.string().optional().default(""), // honeypot
  }),
]);

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function sha256(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Per-visitor limit: salted hash of IP + user agent, held in memory only (never stored).
const VISITOR_SALT = crypto.randomUUID();
const visits = new Map<string, number[]>();
function visitorAllowed(key: string, max = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const hits = (visits.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) { visits.set(key, hits); return false; }
  hits.push(now); visits.set(key, hits);
  if (visits.size > 5000) for (const [k, v] of visits) if (!v.some((t) => now - t < windowMs)) visits.delete(k);
  return true;
}

const reference = (kind: string, id: string) => `${kind === "rights" ? "RR" : "GR"}-${id.slice(0, 8).toUpperCase()}`;
const TOO_MANY = "Too many submissions. Please try again later or write to privacy@privcybhub.com.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Please complete every required field with a valid email address." }, 400);
    const d = parsed.data;
    if (d.website) return json({ ok: true, reference: reference(d.kind, crypto.randomUUID()) }); // bot: silently accept

    const ipRaw = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
    const visitor = await sha256(`${VISITOR_SALT}|${ipRaw}|${req.headers.get("user-agent") || ""}`);
    if (!visitorAllowed(visitor)) return json({ error: TOO_MANY }, 429);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Attach the account only when a real signed-in session token was sent.
    let userId: string | null = null;
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (token) {
      const { data } = await admin.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }

    const table = d.kind === "rights" ? "rights_requests" : "grievances";
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin.from(table).select("id", { count: "exact", head: true })
      .eq("user_email", d.email).gte("submitted_at", since);
    if ((count ?? 0) >= 3) return json({ error: TOO_MANY }, 429);

    const row = d.kind === "rights"
      ? { user_id: userId, user_email: d.email, request_type: d.request_type, description: d.description }
      : { user_id: userId, user_email: d.email, subject: d.subject, nature: d.nature, description: d.description };
    const { data: saved, error } = await admin.from(table).insert(row).select("id").single();
    if (error) throw error;

    const { error: auditError } = await admin.from("consent_audit_log").insert({
      actor_id: userId, actor_type: userId ? "user" : "system",
      action: d.kind === "rights" ? "Rights request submitted" : "Grievance submitted",
      entity_type: d.kind === "rights" ? "Rights Request" : "Grievance", entity_id: saved.id, new_state: "Submitted",
    });
    if (auditError) console.error("submit-privacy-request audit", auditError);

    return json({ ok: true, reference: reference(d.kind, saved.id) });
  } catch (e) {
    console.error("submit-privacy-request", e);
    return json({ error: "Could not submit right now. Please try again or write to privacy@privcybhub.com." }, 500);
  }
});
