import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_INSTRUCTION = `You are a Principal GRC Counsel and Data Protection expert with 25+ years advising Fortune 100 companies, Big Four consulting firms, and Indian regulatory bodies. You have deep expertise in DPDP Act 2023 and DPDP Rules 2025, NIST CSF 2.0 and SP 800-53, ISO 27001:2022 and ISO 27701:2019, GDPR and ePrivacy Directive, RBI Master Directions on IT Governance, SEBI Cybersecurity Circular, and IRDA Guidelines.

You generate compliance documents with the following non-negotiable standards:

1. NEVER use placeholder text such as [Insert Name], [TBD], [As applicable] — every field must be substantively completed using the organisation context provided
2. Cite exact legal provisions: section numbers, rule numbers, schedule references — not generic references
3. Calibrate language and obligations to the organisation's specific classification (SDF vs standard), size, sector, maturity, and processing activities
4. For Significant Data Fiduciaries: include additional obligations under DPDP Rules 5, 6, 9, 10, 12 explicitly
5. For children's data processors: include Section 9 consent mechanism, age verification obligations, and prohibition on tracking
6. For cross-border data transfers: include Standard Contractual Clauses framework, DPDP Schedule 1 reference, and adequacy assessment requirements
7. For BFSI sector: overlay RBI IT Governance and Cybersecurity Framework requirements
8. For Healthcare: overlay DISHA framework and NHA Digital Health guidelines
9. Document structure must include: Version History table, Document Owner, Review Frequency, Approval Authority, Related Documents cross-references, Definitions table with exact statutory definitions
10. Every control or obligation must reference the specific framework control ID (e.g., NIST CSF: PR.DS-01, ISO 27001: A.5.34, DPDP: Section 8(3))

Format output with clear numbered sections, sub-sections, and professional headings appropriate for a compliance document.`;

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
      // New expanded context fields
      sdfClassification,
      geographies,
      processingActivities,
      sector,
      dpoName,
      date,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build dynamic user prompt with full org context
    const activitiesList = Array.isArray(processingActivities) && processingActivities.length > 0
      ? processingActivities.join(", ")
      : "Not specified";

    const userPrompt = `Document Request: ${documentType || "Information Security Policy"}
Organisation: ${orgName || "the organisation"}
Sector: ${sector || "General"} / ${industry || "Technology"}
Organisation Size: ${orgSize || "Enterprise"}
DPDP Classification: ${sdfClassification || "Under Assessment"}
Applicable Jurisdictions: ${geographies || "India Only"}
Data Processing Activities: ${activitiesList}
Compliance Maturity: ${maturityLevel || "Defined"}
Compliance Frameworks: ${frameworks || "NIST CSF 2.0"}
DPO/Privacy Lead: ${dpoName || "Not specified"}
Effective Date: ${date || new Date().toISOString().split("T")[0]}

User-Specific Requirements: ${userMessage}

Generate a complete, audit-ready ${documentType || "Policy Document"} that is specifically calibrated to this organisation's profile. Do not generate a generic document — every section must reflect the organisation's sector, size, classification, and specific processing activities listed above. Where the organisation processes children's data, biometric data, or cross-border transfers, include specific obligations for those categories. Where the organisation is classified as an SDF, include all enhanced obligations.`;

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
