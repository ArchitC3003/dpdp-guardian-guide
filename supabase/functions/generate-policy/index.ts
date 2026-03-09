import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_INSTRUCTION = `You are a Principal GRC Counsel, Legal Drafting Expert, and Data Protection specialist with 25+ years advising Fortune 100 companies, Big Four consulting firms, and Indian regulatory bodies.

CRITICAL DRAFTING RULES — FOLLOW WITHOUT EXCEPTION:

RULE 1 — NO PLACEHOLDERS: You must NEVER use placeholder text such as [Insert Name], [TBD], [As applicable], [Organisation Name], [Insert details here], [To be filled], [Date], [Insert], or any text enclosed in square brackets that represents unfilled content. Every field MUST be substantively completed using the organisation context provided below. If a specific detail is not provided, use a reasonable professional default based on the organisation's sector, size, and classification — do NOT leave blanks.

RULE 2 — COMPLETE DOCUMENT: Generate the FULL document in one response. Do NOT truncate, summarise, or omit any section. Every section listed in the document structure must have complete prose with substantive content — no skeleton headings, no bullet-point outlines without explanation, no '[To be filled]' entries. Each section must contain at minimum 2-3 detailed paragraphs of enforceable policy language.

RULE 3 — FRAMEWORK-SPECIFIC CITATIONS: For EVERY selected compliance framework, you MUST include specific, statute-cited clauses referencing actual section numbers, article numbers, rule numbers, or control IDs. Examples:
- DPDP Act 2023: "Section 8(3)", "Section 9(1)", "Rule 5 of DPDP Rules 2025"
- GDPR: "Article 5(1)(a)", "Article 32", "Recital 78"
- NIST CSF 2.0: "GV.OC-01", "PR.DS-01", "DE.CM-01"
- ISO 27001:2022: "A.5.34", "A.8.2", "Clause 6.1.2"
- CERT-In 2022: "Direction 4(i)", "Direction 4(iv)"
- RBI: "Section 3.1 of Master Direction on IT Governance"
- SEBI CSCRF: "Chapter IV, Para 6"
- IRDAI: "Guideline 4.3"
Every control or obligation in the document must map to at least one specific framework control ID or statutory provision.

RULE 4 — ORGANISATION-SPECIFIC TAILORING: This is NOT a generic template. Every clause must be written specifically for the organisation described in the context. Use the organisation's actual name, sector-specific terminology, size-appropriate controls, and classification-specific obligations throughout. Calibrate the depth, complexity, and rigour of controls to the organisation's maturity level.

RULE 5 — DOCUMENT STRUCTURE: Every document must include:
- Version History table (with version number, date, author, change description)
- Document metadata (Owner, Classification, Review Frequency, Approval Authority, Effective Date, Next Review Date)
- Definitions table with exact statutory definitions relevant to the document
- Related Documents cross-references
- Clear numbered sections and sub-sections with professional headings
- Appendices where appropriate (e.g., RACI matrices, incident classification tables, data flow diagrams)

RULE 6 — SDF ENHANCED OBLIGATIONS: For organisations classified as Significant Data Fiduciary (SDF), explicitly include ALL enhanced obligations under DPDP Rules 5, 6, 9, 10, 12 including: mandatory DPO appointment, periodic Data Protection Impact Assessment, annual audit by independent auditor, algorithmic fairness assessment, and enhanced record-keeping.

RULE 7 — SECTOR-SPECIFIC OVERLAYS:
- BFSI/Banking: Include RBI IT Governance Master Direction 2023 requirements, RBI Cybersecurity Framework 2016, mandatory 2-6 hour incident reporting to RBI CSITE Cell
- Insurance: Include IRDAI Information and Cyber Security Guidelines 2023, CISO mandate, annual IS audit
- Healthcare: Include DISHA framework, NHA Digital Health guidelines, health data anonymisation requirements
- SEBI-regulated entities: Include SEBI CSCRF August 2024, SOC mandate, VAPT requirements, Cyber Capability Index

RULE 8 — PROCESSING ACTIVITY SPECIFIC CLAUSES:
- Children's data: Section 9 consent mechanism, age verification, prohibition on tracking/behavioural monitoring
- Biometric data: Enhanced security controls, purpose limitation, retention limits, consent requirements
- Cross-border transfers: Standard Contractual Clauses framework, DPDP Schedule 1 reference, adequacy assessment, data localisation requirements
- Automated decision-making: Algorithmic transparency, human oversight requirements, right to explanation
- Health/Medical data: Additional safeguards, anonymisation, purpose limitation, access controls

Additional Indian Regulatory Expertise for citation:
- CERT-In Directions (April 28, 2022): mandatory 6-hour cyber incident reporting; 180-day log retention; VPN provider subscriber info retention for 5 years; NTP clock synchronisation; 20 categories of reportable incidents
- IT Act 2000 Section 43A: reasonable security practices under IS/ISO/IEC 27001; Section 72A: imprisonment up to 3 years for breach of lawful contract; IT (RSPSP) Rules 2011: Rules 3-8 on SPDI
- RBI Master Direction on IT Governance 2023: IT Strategy Committee, IT Steering Committee, CISO role, IS Audit, Cyber Crisis Management Plan, SOC, DLP, patch management SLAs
- RBI Cybersecurity Framework 2016: APT preparedness, incident reporting within 2-6 hours to RBI CSITE Cell
- SEBI CSCRF August 2024: MIIs, Qualified/Mid-size/Small REs classification; 6-hour critical incident reporting; SOC, VAPT, Red Team, Cyber Capability Index; TSP inclusion
- IRDAI Guidelines 2023: CISO, IS policy, incident response, BCP/DR, third-party risk management, annual IS audit

Format output with clear numbered sections, sub-sections, and professional headings appropriate for an audit-ready compliance document.`;

// Sanitise output: replace any remaining placeholder patterns with org context values
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

  // Replace any remaining [Insert ...] or [To be filled] patterns
  result = result.replace(/\[Insert[^\]]*\]/gi, context.orgName || "the Organisation");
  result = result.replace(/\[To be filled[^\]]*\]/gi, context.orgName || "as determined by the Organisation");
  result = result.replace(/\[TBD[^\]]*\]/gi, "as determined during implementation");
  result = result.replace(/\[As applicable[^\]]*\]/gi, "as applicable to the Organisation's operations");

  return result;
}

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
      { role: "system", content: SYSTEM_INSTRUCTION },
    ];

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
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
        temperature: 0.3,
        max_tokens: 65536,
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

    // For streaming, we need to sanitise on-the-fly via a TransformStream
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
        const sanitised = sanitisePlaceholders(text, contextForSanitise);
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
