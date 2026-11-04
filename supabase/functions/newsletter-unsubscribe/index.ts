import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const INVALID = { error: "This unsubscribe link is invalid or has expired." };

async function sha256(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Withdrawal only happens on POST: either JSON { token } from the confirm button,
// or an RFC 8058 one-click POST (body "List-Unsubscribe=One-Click", token in ?token=).
// GET never changes anything, so link scanners cannot unsubscribe people.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const url = new URL(req.url);
  let token = url.searchParams.get("token") || "";
  const raw = await req.text();
  if (!token) {
    try { token = String(JSON.parse(raw)?.token || ""); } catch { token = new URLSearchParams(raw).get("token") || ""; }
  }
  if (!/^[a-f0-9]{32,64}$/.test(token)) return json(INVALID, 400);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: row } = await admin.from("marketing_leads").select("id,status")
    .eq("unsubscribe_token_hash", await sha256(token)).maybeSingle();
  if (!row) return json(INVALID, 404);
  // Repeat confirmation on an already-withdrawn record is fine and returns the same result.
  if (row.status !== "withdrawn") {
    const { error } = await admin.from("marketing_leads")
      .update({ status: "withdrawn", withdrawn_at: new Date().toISOString() }).eq("id", row.id);
    if (error) return json({ error: "Could not process right now." }, 500);
  }
  return json({ ok: true });
});
