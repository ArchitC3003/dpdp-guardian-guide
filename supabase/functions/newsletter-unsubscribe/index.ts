import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// One-click, no-login newsletter withdrawal. Accepts ?token= (GET, RFC 8058 POST) or JSON { token }.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);
  let token = url.searchParams.get("token") || "";
  if (!token && req.method === "POST") {
    try { token = String((await req.json())?.token || ""); } catch { /* form post */ }
  }
  if (!/^[a-f0-9]{48}$/.test(token)) return json({ error: "Invalid unsubscribe link." }, 400);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: row } = await admin.from("marketing_leads").select("id,email").eq("unsubscribe_token", token).maybeSingle();
  if (!row) return json({ error: "Invalid unsubscribe link." }, 404);
  const now = new Date().toISOString();
  await admin.from("marketing_leads").update({ status: "withdrawn", withdrawn_at: now })
    .eq("email", row.email).eq("purpose", "dpdp_newsletter").neq("status", "withdrawn");
  // Stop all further sends to this address.
  await admin.from("suppressed_emails").upsert({ email: row.email, reason: "unsubscribe", metadata: { purpose: "dpdp_newsletter" } }, { onConflict: "email", ignoreDuplicates: true });
  return json({ ok: true });
});
