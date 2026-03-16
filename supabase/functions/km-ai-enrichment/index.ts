import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { industries, subSector, contextType, regulatorySources, artefactSnippets } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sourcesText = (regulatorySources || [])
      .map((s: any) => `- ${s.authority}: ${s.framework} — ${s.description}`)
      .join("\n");

    const artefactsText = (artefactSnippets || [])
      .map((a: any) => `- ${a.title}: ${a.content}`)
      .join("\n");

    const systemPrompt = `You are a Senior Data Protection Officer and privacy compliance expert with deep knowledge of India's DPDP Act 2023, GDPR, IT Act 2000, and sector-specific regulations. You are assisting in generating compliance-grade content for a privacy management platform (PrivCybHub). You have access to the following authoritative sources and internal artefact excerpts to inform your answer. Always cite which framework or source your answer is based on.`;

    const userPrompt = `Generate a comprehensive, DPDP-compliant knowledge context for an organization operating in: ${(industries || []).join(", ")}. Sub-Sector: ${subSector || "General"}. Context type: ${contextType || "policy-gen"}.

Authoritative sources available:
${sourcesText || "None provided"}

Internal artefact excerpts:
${artefactsText || "None available"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "km_enrichment_result",
              description: "Return structured KM enrichment data for the specified industry and sub-sector.",
              parameters: {
                type: "object",
                properties: {
                  personalDataTypes: {
                    type: "array",
                    items: { type: "string" },
                    description: "15-25 comprehensive personal data types for this industry + sub-sector",
                  },
                  processingActivities: {
                    type: "array",
                    items: { type: "string" },
                    description: "12-20 processing activities",
                  },
                  sensitiveDataFlags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Items from personalDataTypes that are sensitive under DPDP Act Section 8 or GDPR Article 9",
                  },
                  subSectorInsights: {
                    type: "string",
                    description: "3-4 sentences describing key privacy risks, applicable regulations, and compliance priorities",
                  },
                  mandatoryCompliances: {
                    type: "array",
                    items: { type: "string" },
                    description: "5-8 specific compliance obligations most critical for this sector",
                  },
                  recommendedFrameworks: {
                    type: "array",
                    items: { type: "string" },
                    description: "Top 3-5 frameworks applicable",
                  },
                },
                required: [
                  "personalDataTypes",
                  "processingActivities",
                  "sensitiveDataFlags",
                  "subSectorInsights",
                  "mandatoryCompliances",
                  "recommendedFrameworks",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "km_enrichment_result" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI enrichment failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();

    // Extract tool call result
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    // Fallback: try to extract from content
    const content = result.choices?.[0]?.message?.content || "";
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch { /* ignore */ }

    return new Response(
      JSON.stringify({
        personalDataTypes: [],
        processingActivities: [],
        sensitiveDataFlags: [],
        subSectorInsights: "",
        mandatoryCompliances: [],
        recommendedFrameworks: [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("km-ai-enrichment error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
