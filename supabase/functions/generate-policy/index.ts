import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACK_SYSTEM_INSTRUCTION = `You are a Principal GRC Counsel, Legal Drafting Expert, and Data Protection specialist with 25+ years advising Fortune 100 companies, Big Four consulting firms, and Indian regulatory bodies.

CRITICAL DRAFTING RULES — FOLLOW WITHOUT EXCEPTION:

RULE 1 — NO PLACEHOLDERS: You must NEVER use placeholder text such as [Insert Name], [TBD], [As applicable], [Organisation Name], [Insert details here], [To be filled], [Date], [Insert], or any text enclosed in square brackets that represents unfilled content. Every field MUST be substantively completed using the organisation context provided below. If a specific detail is not provided, use a reasonable professional default based on the organisation's sector, size, and classification — do NOT leave blanks.

RULE 2 — COMPLETE DOCUMENT: Generate the FULL document in one response. Do NOT truncate, summarise, or omit any section. Every section listed in the document structure must have complete prose with substantive content — no skeleton headings, no bullet-point outlines without explanation, no '[To be filled]' entries. Each section must contain at minimum 2-3 detailed paragraphs of enforceable policy language.

RULE 3 — FRAMEWORK-SPECIFIC CITATIONS: For EVERY selected compliance framework, you MUST include specific, statute-cited clauses referencing actual section numbers, article numbers, rule numbers, or control IDs.

RULE 4 — ORGANISATION-SPECIFIC TAILORING: This is NOT a generic template. Every clause must be written specifically for the organisation described in the context.

RULE 5 — DOCUMENT STRUCTURE: Every document must include Version History table, Document metadata, Definitions table, Related Documents cross-references, Clear numbered sections, Appendices where appropriate.

Format output with clear numbered sections, sub-sections, and professional headings appropriate for an audit-ready compliance document.`;

function sanitisePlaceholders(text: string, context: Record<string, string>): string {
  let result = text;
  const placeholderMap: Record<string, string> = {
    "[Organisation Name]": context.orgName || "the Organisation",
    "[Organization Name]": context.orgName || "the Organisation",
    "[Org Name]": context.orgName || "the Organisation",
    "[Company Name]": context.orgName || "the Organisation",
    "[DPO Name]": context.dpoName || "the designated Data Protection Officer",
    "[Date]": context.date || new Date().toISOString().split("T")[0],
    "[Effective Date]": context.date || new Date().toISOString().split("T")[0],
    "[Industry]": context.industry || context.sector || "the applicable industry",
    "[Sector]": context.sector || context.industry || "the applicable sector",
  };

  for (const [placeholder, replacement] of Object.entries(placeholderMap)) {
    result = result.split(placeholder).join(replacement);
  }

  result = result.replace(/\[Insert[^\]]*\]/gi, context.orgName || "the Organisation");
  result = result.replace(/\[To be filled[^\]]*\]/gi, context.orgName || "as determined by the Organisation");
  result = result.replace(/\[TBD[^\]]*\]/gi, "as determined during implementation");
  result = result.replace(/\[As applicable[^\]]*\]/gi, "as applicable to the Organisation's operations");

  return result;
}

// Also sanitise using dynamic banned phrases from config
function sanitiseBannedPhrases(text: string, bannedPhrases: string[], context: Record<string, string>): string {
  let result = text;
  for (const phrase of bannedPhrases) {
    if (phrase.startsWith("[") && phrase.endsWith("]")) {
      result = result.split(phrase).join(context.orgName || "the Organisation");
    } else {
      result = result.split(phrase).join("");
    }
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      documentType, frameworks, orgName, industry, orgSize, maturityLevel,
      userMessage, conversationHistory, sdfClassification, geographies,
      processingActivities, sector, dpoName, date,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch dynamic config from ai_prompt_config
    let systemPrompt = FALLBACK_SYSTEM_INSTRUCTION;
    let model = "google/gemini-2.5-flash";
    let temperature = 0.3;
    let maxTokens = 65536;
    let outputRules: string[] = [];
    let bannedPhrases: string[] = [];
    let fewShotExamples: Array<{ input_context: string; expected_output: string }> = [];

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);

      const { data: configData } = await sb
        .from("ai_prompt_config")
        .select("*")
        .eq("module_name", "policy-generator")
        .maybeSingle();

      if (configData && configData.system_prompt) {
        systemPrompt = configData.system_prompt;
        model = configData.model || model;
        temperature = Number(configData.temperature) || temperature;
        maxTokens = configData.max_tokens || maxTokens;
        outputRules = Array.isArray(configData.output_rules) ? configData.output_rules : [];
        bannedPhrases = Array.isArray(configData.banned_phrases) ? configData.banned_phrases : [];
      }

      // Fetch few-shot examples
      const { data: examplesData } = await sb
        .from("ai_training_examples")
        .select("input_context, expected_output")
        .eq("module_name", "policy-generator")
        .eq("is_active", true)
        .limit(3);

      if (examplesData) fewShotExamples = examplesData;
    } catch (configErr) {
      console.error("Failed to fetch AI config, using fallback:", configErr);
    }

    // Append output rules to system prompt
    if (outputRules.length > 0) {
      systemPrompt += "\n\nMANDATORY OUTPUT RULES:\n" + outputRules.map((r, i) => `${i + 1}. ${r}`).join("\n");
    }

    const activitiesList = Array.isArray(processingActivities) && processingActivities.length > 0
      ? processingActivities.join(", ")
      : "General personal data processing";

    const effectiveOrgName = orgName || "the Organisation";
    const effectiveSector = sector || industry || "General";
    const effectiveSize = orgSize || "Enterprise";
    const effectiveSdf = sdfClassification || "Under Assessment";
    const effectiveGeo = geographies || "India Only";
    const effectiveMaturity = maturityLevel || "Defined";
    const effectiveFrameworks = frameworks || "NIST CSF 2.0";
    const effectiveDpo = dpoName || "the designated Data Protection Officer";
    const effectiveDate = date || new Date().toISOString().split("T")[0];
    const effectiveDocType = documentType || "Information Security Policy";

    const userPrompt = `MANDATORY ORGANISATION CONTEXT — USE THESE EXACT VALUES THROUGHOUT THE DOCUMENT:
- Organisation Name: ${effectiveOrgName}
- Document Type: ${effectiveDocType}
- Sector: ${effectiveSector} / ${industry || "Technology"}
- Organisation Size: ${effectiveSize}
- DPDP Classification: ${effectiveSdf}
- Applicable Jurisdictions: ${effectiveGeo}
- Data Processing Activities: ${activitiesList}
- Compliance Maturity Level: ${effectiveMaturity}
- Compliance Frameworks: ${effectiveFrameworks}
- DPO/Privacy Lead: ${effectiveDpo}
- Effective Date: ${effectiveDate}

DRAFTING INSTRUCTION: You are generating a complete, specific, and enforceable ${effectiveDocType} for ${effectiveOrgName}, a ${effectiveSize} ${effectiveSector} organisation classified as ${effectiveSdf} under the DPDP Act 2023. All clauses must be tailored to this organisation's actual processing activities: ${activitiesList}. The document must comply with: ${effectiveFrameworks}. Operating jurisdictions: ${effectiveGeo}. Current maturity: ${effectiveMaturity}.

Do NOT use generic placeholders — use "${effectiveOrgName}" wherever the organisation name is needed, "${effectiveDpo}" for the DPO, and "${effectiveDate}" for dates.

Generate the FULL document. Do not truncate or summarise. Every section must contain complete, enforceable prose.

User-Specific Requirements: ${userMessage}`;

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add few-shot examples
    for (const ex of fewShotExamples) {
      messages.push({ role: "user", content: ex.input_context });
      messages.push({ role: "assistant", content: ex.expected_output });
    }

    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: "user", content: userPrompt });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage credits exhausted. Please add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contextForSanitise = {
      orgName: effectiveOrgName,
      dpoName: effectiveDpo,
      date: effectiveDate,
      industry: industry || "",
      sector: effectiveSector,
    };

    const { readable, writable } = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        let sanitised = sanitisePlaceholders(text, contextForSanitise);
        sanitised = sanitiseBannedPhrases(sanitised, bannedPhrases, contextForSanitise);
        controller.enqueue(new TextEncoder().encode(sanitised));
      },
    });

    response.body?.pipeTo(writable);

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-policy error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
