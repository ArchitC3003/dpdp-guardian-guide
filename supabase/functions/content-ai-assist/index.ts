import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const Body = z.object({
  task: z.enum(["outline", "seo", "faq", "summary"]),
  title: z.string().max(300).default(""),
  body: z.string().max(40000).default(""),
  keyword: z.string().max(120).default(""),
});
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const schemas: Record<string, unknown> = {
  outline: { type: "object", additionalProperties: false, required: ["markdown"], properties: { markdown: { type: "string" } } },
  seo: { type: "object", additionalProperties: false, required: ["seo_title", "seo_description", "keywords"],
    properties: { seo_title: { type: "string" }, seo_description: { type: "string" }, keywords: { type: "array", items: { type: "string" } } } },
  faq: { type: "object", additionalProperties: false, required: ["faq"], properties: { faq: { type: "array",
    items: { type: "object", additionalProperties: false, required: ["q", "a"], properties: { q: { type: "string" }, a: { type: "string" } } } } } },
  summary: { type: "object", additionalProperties: false, required: ["summary"], properties: { summary: { type: "string" } } },
};
const instructions: Record<string, string> = {
  outline: "Write a well-structured markdown article draft (H2/H3 headings, short paragraphs, bullet lists) for the title. Cite DPDP Act 2023 sections only where accurate. No placeholders.",
  seo: "Return an SEO title (max 60 chars) and meta description (140-155 chars) and 5-8 keywords for this content.",
  faq: "Return 4-6 FAQ question/answer pairs grounded only in the content. Answers under 60 words.",
  summary: "Return a factual 2-3 sentence summary of the content for AI assistants and search engines.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("authorization") || "" } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);
    const [{ data: a }, { data: m }] = await Promise.all([
      userClient.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      userClient.rpc("has_role", { _user_id: user.id, _role: "moderator" }),
    ]);
    if (!a && !m) return json({ error: "Forbidden" }, 403);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Invalid request" }, 400);
    const { task, title, body, keyword } = parsed.data;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        reasoning_effort: "low",
        messages: [
          { role: "system", content: "You are a senior content editor for PrivcybHub, an Indian privacy and cyber compliance platform (Pune). British English. Accurate, non-hyped, practitioner tone. " + instructions[task] },
          { role: "user", content: `Title: ${title}\nFocus keyword: ${keyword}\n\nContent:\n${body}` },
        ],
        response_format: { type: "json_schema", json_schema: { name: task, strict: true, schema: schemas[task] } },
      }),
    });
    if (r.status === 429) return json({ error: "AI is busy, try again shortly." }, 429);
    if (r.status === 402) return json({ error: "AI credits exhausted." }, 402);
    if (!r.ok) { console.error(await r.text()); return json({ error: "AI request failed" }, 502); }
    const out = await r.json();
    return json(JSON.parse(out.choices?.[0]?.message?.content || "{}"));
  } catch (e) {
    console.error("content-ai-assist", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
