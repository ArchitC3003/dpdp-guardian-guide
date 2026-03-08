import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_INSTRUCTION = `You are a senior GRC (Governance, Risk & Compliance) specialist and privacy lawyer with 20+ years of experience advising Fortune 100 companies and Indian organisations. You specialise in DPDP Act 2023, NIST CSF 2.0, ISO 27001:2022, and GDPR compliance. Your task is to generate comprehensive, audit-ready compliance policy documents and Standard Operating Procedures. All documents must: use precise legal and regulatory language; cite specific DPDP Act sections, Rules, and Schedule references where applicable; be proportionate to the organisation's industry, size, and maturity level; include implementation guidance, document owner roles, review cycles, and version history tables; be structured for board-level review and regulatory audit; never use placeholder text - every section must be substantive and directly implementable. Format output with clear numbered sections, sub-sections, and professional headings appropriate for a compliance document.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      documentType,
      frameworks,
      orgName,
      industry,
      orgSize,
      maturityLevel,
      userMessage,
      conversationHistory,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the user prompt
    const userPrompt = `Generate a ${documentType || "Information Security Policy"} for ${orgName || "the organisation"}, a ${industry || "Technology"} organisation with ${orgSize || "Enterprise"} employees at ${maturityLevel || "Defined"} maturity level. Frameworks: ${frameworks || "NIST CSF 2.0"}. User request: ${userMessage}`;

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: SYSTEM_INSTRUCTION },
    ];

    // Add conversation history
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current user message
    messages.push({ role: "user", content: userPrompt });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
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

    // Stream the response back to the client
    return new Response(response.body, {
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
