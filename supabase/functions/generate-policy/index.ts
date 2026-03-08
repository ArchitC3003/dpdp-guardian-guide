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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured. Please add it in your project secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the user prompt
    const userPrompt = `Generate a ${documentType || "Information Security Policy"} for ${orgName || "the organisation"}, a ${industry || "Technology"} organisation with ${orgSize || "Enterprise"} employees at ${maturityLevel || "Defined"} maturity level. Frameworks: ${frameworks || "NIST CSF 2.0"}. User request: ${userMessage}`;

    // Build conversation contents for Gemini API
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    // Add the current user message
    contents.push({
      role: "user",
      parts: [{ text: userPrompt }],
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorText);

      if (geminiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded on Gemini API. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again shortly." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();

    // Extract text from Gemini response
    const content =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Unable to generate content. Please try again with a more specific request.";

    return new Response(
      JSON.stringify({ content }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-policy error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
