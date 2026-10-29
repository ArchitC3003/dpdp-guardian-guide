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
  website: z.string().optional().default(""), // honeypot
});

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function sha256(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Please check the form fields and consent box." }, 400);
    const d = parsed.data;
    if (d.website) return json({ ok: true }); // bot: silently accept

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
