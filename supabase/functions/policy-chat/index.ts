import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACK_SYSTEM_PROMPT = `You are **PolicyArchitect AI** — a senior GRC (Governance, Risk & Compliance) and Legal drafting expert with 20+ years of experience at Big 4 consulting firms (Deloitte, PwC, EY, KPMG) and top-tier law firms.

## YOUR ROLE
You draft **board-ready, audit-proof, legally defensible** compliance documents: Policies, Standard Operating Procedures (SOPs), Registers, Templates, and Contract Clauses.

## ANTI-HALLUCINATION CONTROLS — CRITICAL
1. Only cite real, verifiable framework controls.
2. Never fabricate control IDs.
3. Cite the specific section/article number for legislation.
4. Use real penalty amounts.
5. Do NOT reference non-existent frameworks, standards, or control IDs.

## OUTPUT FORMAT
Always use structured markdown with numbered clauses, control references in square brackets, tables for Roles & Responsibilities and Definitions, document reference numbers, and approval signature blocks.

## QUALITY CONTROLS
- Every section must have at least one verifiable control reference
- Never use filler text, lorem ipsum, or placeholder content
- Every clause must be actionable and implementable`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, config } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch dynamic config from ai_prompt_config (sop-builder module)
    let systemPrompt = FALLBACK_SYSTEM_PROMPT;
    let model = "google/gemini-2.5-flash";
    let temperature = 0.3;
    let maxTokens = 65536;
    let outputRules: string[] = [];
    let fewShotExamples: Array<{ input_context: string; expected_output: string }> = [];

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);

      const { data: configData } = await sb
        .from("ai_prompt_config")
        .select("*")
        .eq("module_name", "sop-builder")
        .maybeSingle();

      if (configData && configData.system_prompt) {
        systemPrompt = configData.system_prompt;
        model = configData.model || model;
        temperature = Number(configData.temperature) || temperature;
        maxTokens = configData.max_tokens || maxTokens;
        outputRules = Array.isArray(configData.output_rules) ? configData.output_rules : [];
      }

      const { data: examplesData } = await sb
        .from("ai_training_examples")
        .select("input_context, expected_output")
        .eq("module_name", "sop-builder")
        .eq("is_active", true)
        .limit(3);

      if (examplesData) fewShotExamples = examplesData;
    } catch (configErr) {
      console.error("Failed to fetch AI config, using fallback:", configErr);
    }

    // Append output rules
    if (outputRules.length > 0) {
      systemPrompt += "\n\nMANDATORY OUTPUT RULES:\n" + outputRules.map((r, i) => `${i + 1}. ${r}`).join("\n");
    }

    // Build context from config
    const configContext = config
      ? `\n\n## CURRENT DOCUMENT CONFIGURATION
- Document Type: ${config.documentType || "Information Security Policy"}
- Aligned Frameworks: ${Array.isArray(config.frameworks) ? config.frameworks.join(", ") : (config.frameworks || "NIST CSF 2.0")}
- Industry: ${config.industry || "Technology"}
- Organization Size: ${config.orgSize || "Enterprise"}
- Compliance Maturity Level: ${(config.maturity ?? 2) + 1} of 5 (${["Initial", "Developing", "Defined", "Managed", "Optimizing"][config.maturity ?? 2]})
- Output Format: ${config.outputFormat || "DOCX-ready"}
- Classification: ${config.classification || "Confidential"}

Tailor ALL output to match this maturity level, industry, and framework selection.`
      : "";

    const fullSystemPrompt = systemPrompt + configContext;

    const allMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: fullSystemPrompt },
    ];

    // Add few-shot examples
    for (const ex of fewShotExamples) {
      allMessages.push({ role: "user", content: ex.input_context });
      allMessages.push({ role: "assistant", content: ex.expected_output });
    }

    allMessages.push(...messages);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: allMessages,
          stream: true,
          temperature,
          max_tokens: maxTokens,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage credits exhausted. Please add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("policy-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
