import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASSESSMENT_DOMAINS = [
  { code: "A", name: "Notice & Transparency", section: "Sec 5, Rule 3–4", penalty: "₹50 Cr" },
  { code: "B", name: "Consent Management", section: "Sec 6, Rule 3–4", penalty: "₹50 Cr" },
  { code: "C", name: "Legitimate Use & Lawful Basis", section: "Sec 4, 7", penalty: "₹50 Cr" },
  { code: "D", name: "Data Inventory & Quality", section: "Sec 4, 8(1)–(3)", penalty: "₹50 Cr" },
  { code: "E", name: "Security Safeguards", section: "Sec 8(5), Rule 6", penalty: "₹250 Cr" },
  { code: "F", name: "Breach Preparedness", section: "Sec 8(6), Rule 7", penalty: "₹200 Cr" },
  { code: "G", name: "Data Principal Rights", section: "Sec 11–14, Rule 14", penalty: "₹50 Cr" },
  { code: "H", name: "Retention & Erasure", section: "Sec 8(7)–(8), Rule 8", penalty: "₹50 Cr" },
  { code: "I", name: "Children's Data", section: "Sec 9, Rule 10", penalty: "₹200 Cr" },
  { code: "J", name: "Processor & Cross-Border", section: "Sec 8(4–5), 16", penalty: "₹250 Cr" },
  { code: "K", name: "Processor Obligations", section: "Sec 8(4)", penalty: "₹250 Cr" },
  { code: "L", name: "Governance & Accountability", section: "Sec 8(9), 10, 26", penalty: "₹50 Cr" },
  { code: "M", name: "Consent Manager", section: "Sec 6(9), Rule 5", penalty: "₹50 Cr" },
  { code: "N", name: "Training & Awareness", section: "N/A", penalty: "₹50 Cr" },
  { code: "O", name: "Privacy by Design & Default", section: "Sec 4(2), 8(1), Rule 6", penalty: "₹50 Cr" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentPage } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate user from request
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await sb.auth.getUser();

    // ── Fetch user context data ──────────────────────────────────
    let userContextBlock = "";
    let hasAssessments = false;
    let kmContextBlock = "";

    if (user) {
      // 1. Fetch user profile
      const { data: profile } = await sb
        .from("profiles")
        .select("full_name, organisation, job_title, role")
        .eq("id", user.id)
        .maybeSingle();

      // 2. Fetch user's assessments
      const { data: assessments } = await sb
        .from("assessments")
        .select("id, org_name, org_industry, status, version, created_at, updated_at, org_employees, org_entity_type, org_locations, special_status")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(10);

      // 3. Fetch assessment checks for all user assessments
      let checksData: any[] = [];
      if (assessments && assessments.length > 0) {
        hasAssessments = true;
        const assessmentIds = assessments.map(a => a.id);
        const { data: checks } = await sb
          .from("assessment_checks")
          .select("assessment_id, domain, check_id, status, observation, priority, evidence_status, owner")
          .in("assessment_id", assessmentIds);
        checksData = checks || [];
      }

      // 4. Fetch policy documents
      const { data: policyDocs } = await sb
        .from("policy_documents")
        .select("id, title, document_type, status, classification, current_version, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20);

      // 5. Fetch policy items for assessments
      let policyItemsData: any[] = [];
      if (assessments && assessments.length > 0) {
        const assessmentIds = assessments.map(a => a.id);
        const { data: policyItems } = await sb
          .from("policy_items")
          .select("assessment_id, item_id, status, observation, approved, review_cycle, last_reviewed")
          .in("assessment_id", assessmentIds);
        policyItemsData = policyItems || [];
      }

      // ── Build context block ────────────────────────────────────
      userContextBlock += `\n\n═══ AUTHENTICATED USER CONTEXT ═══\n`;
      if (profile) {
        userContextBlock += `User: ${profile.full_name || "Unknown"}\n`;
        userContextBlock += `Organisation: ${profile.organisation || "Not set"}\n`;
        userContextBlock += `Role: ${profile.job_title || profile.role || "Not set"}\n`;
      }

      if (assessments && assessments.length > 0) {
        userContextBlock += `\n── USER'S ASSESSMENTS (${assessments.length}) ──\n`;
        for (const a of assessments) {
          const assessmentChecks = checksData.filter(c => c.assessment_id === a.id);
          const total = assessmentChecks.length;
          const compliant = assessmentChecks.filter(c => c.status === "compliant").length;
          const nonCompliant = assessmentChecks.filter(c => c.status === "non-compliant").length;
          const partial = assessmentChecks.filter(c => c.status === "partial").length;
          const notAssessed = total - compliant - nonCompliant - partial;
          const score = total > 0 ? Math.round((compliant / total) * 100) : 0;

          userContextBlock += `\nAssessment: ${a.org_name || "Unnamed"} (${a.org_industry || "No industry"})\n`;
          userContextBlock += `  Status: ${a.status} | Version: ${a.version} | Last Updated: ${a.updated_at}\n`;
          userContextBlock += `  Entity Type: ${a.org_entity_type || "N/A"} | Employees: ${a.org_employees || "N/A"} | Locations: ${a.org_locations || "N/A"}\n`;
          if (a.special_status) {
            const ss = typeof a.special_status === 'string' ? JSON.parse(a.special_status) : a.special_status;
            const activeFlags = Object.entries(ss).filter(([_, v]) => v === true).map(([k]) => k);
            if (activeFlags.length > 0) {
              userContextBlock += `  Special Flags: ${activeFlags.join(", ")}\n`;
            }
          }
          userContextBlock += `  Compliance Score: ${score}% (${compliant} compliant, ${partial} partial, ${nonCompliant} non-compliant, ${notAssessed} not assessed out of ${total} checks)\n`;

          // Domain-level breakdown
          if (assessmentChecks.length > 0) {
            const domainMap: Record<string, any[]> = {};
            for (const c of assessmentChecks) {
              if (!domainMap[c.domain]) domainMap[c.domain] = [];
              domainMap[c.domain].push(c);
            }
            userContextBlock += `  Domain Breakdown:\n`;
            for (const [domain, checks] of Object.entries(domainMap)) {
              const dc = checks.filter(c => c.status === "compliant").length;
              const dnc = checks.filter(c => c.status === "non-compliant").length;
              const dp = checks.filter(c => c.status === "partial").length;
              const domainInfo = ASSESSMENT_DOMAINS.find(d => d.code === domain);
              userContextBlock += `    ${domain} (${domainInfo?.name || domain}): ${dc}/${checks.length} compliant, ${dnc} non-compliant, ${dp} partial\n`;
            }

            // List non-compliant and partial findings
            const gaps = assessmentChecks.filter(c => c.status === "non-compliant" || c.status === "partial");
            if (gaps.length > 0) {
              userContextBlock += `  KEY GAPS & FINDINGS:\n`;
              for (const g of gaps.slice(0, 30)) {
                const domainInfo = ASSESSMENT_DOMAINS.find(d => d.code === g.domain);
                userContextBlock += `    - [${g.check_id}] ${domainInfo?.name || g.domain}: Status=${g.status}${g.priority ? `, Priority=${g.priority}` : ""}${g.observation ? `, Note: ${g.observation}` : ""}${g.evidence_status ? `, Evidence: ${g.evidence_status}` : ""}\n`;
              }
              if (gaps.length > 30) {
                userContextBlock += `    ... and ${gaps.length - 30} more gaps\n`;
              }
            }
          }
        }
      } else {
        userContextBlock += `\n── NO ASSESSMENTS FOUND ──\nThe user has not yet created any compliance assessments.\n`;
      }

      // Policy items status
      if (policyItemsData.length > 0) {
        const approved = policyItemsData.filter(p => p.status === "approved" || p.approved === "yes").length;
        const draft = policyItemsData.filter(p => p.status === "draft" || p.status === "in-progress").length;
        const missing = policyItemsData.filter(p => !p.status || p.status === "missing" || p.status === "not-started").length;
        userContextBlock += `\n── POLICY & ARTEFACT STATUS ──\n`;
        userContextBlock += `Total tracked: ${policyItemsData.length} | Approved: ${approved} | In Progress: ${draft} | Missing/Not Started: ${missing}\n`;
      }

      // Generated policy documents
      if (policyDocs && policyDocs.length > 0) {
        userContextBlock += `\n── GENERATED POLICY DOCUMENTS (${policyDocs.length}) ──\n`;
        for (const doc of policyDocs.slice(0, 10)) {
          userContextBlock += `  - ${doc.title} [${doc.document_type}] — Status: ${doc.status}, Version: ${doc.current_version}, Updated: ${doc.updated_at}\n`;
        }
      }
    } else {
      userContextBlock = "\n\n═══ USER NOT AUTHENTICATED ═══\nThe user is not logged in. Guide them to sign in to access personalised compliance data.\n";
    }

    // ── Fetch KM artefacts for context enrichment ──────────────────
    try {
      const { data: kmArtefacts } = await sb
        .from("km_artefact_index")
        .select("title, content, doc_type, industry_verticals, frameworks, source_authority")
        .eq("is_active", true)
        .limit(10);

      if (kmArtefacts && kmArtefacts.length > 0) {
        kmContextBlock += "\n\n═══ KNOWLEDGE MANAGEMENT ARTEFACTS ═══\n";
        kmContextBlock += `${kmArtefacts.length} compliance knowledge artefacts available:\n`;
        for (const art of kmArtefacts) {
          kmContextBlock += `- ${art.title} [${art.doc_type}] (${(art.frameworks || []).join(", ")}): ${art.content.substring(0, 200)}...\n`;
        }
      }

      const { data: regSources } = await sb
        .from("regulatory_source_map")
        .select("industry_vertical, framework, authority, description")
        .eq("is_active", true)
        .limit(20);

      if (regSources && regSources.length > 0) {
        kmContextBlock += "\n── REGULATORY SOURCE MAP ──\n";
        for (const src of regSources) {
          kmContextBlock += `- ${src.authority}: ${src.framework} (${src.industry_vertical}) — ${src.description}\n`;
        }
      }
    } catch (e) {
      console.error("KM context fetch error:", e);
      // Non-blocking — chatbot works without KM context
    }

    // ── Available assessment domains reference ────────────────────
    let domainsRef = "\n\n═══ AVAILABLE ASSESSMENT DOMAINS (DPDP Act 2023 Readiness) ═══\n";
    for (const d of ASSESSMENT_DOMAINS) {
      domainsRef += `${d.code}. ${d.name} — ${d.section} (Max Penalty: ${d.penalty})\n`;
    }

    // ── Build system prompt ──────────────────────────────────────
    const systemPrompt = `You are a **Context-Aware Data Privacy Compliance Assistant** inside the PrivcybHub application. You have FULL ACCESS to the user's compliance data provided below.

## YOUR ROLE
You are a senior privacy compliance advisor specialising in India's Digital Personal Data Protection (DPDP) Act 2023 and DPDP Rules 2025. You help users understand their compliance posture, identify gaps, prioritise remediation, and navigate the platform features.

## CRITICAL RULES
1. **ALWAYS reference the user's ACTUAL data** when answering questions about their compliance status, scores, gaps, or assessments. Never give generic answers when specific data is available.
2. **Cite specific check IDs and domain names** when discussing gaps (e.g., "Check A.1 in Notice & Transparency is non-compliant").
3. **Be actionable** — don't just list problems, provide specific next steps and link to relevant platform features.
4. **If the user has no assessments**, proactively guide them to start one and explain the 15-domain DPDP readiness framework.
5. **Never hallucinate data** — if specific information isn't in the context below, say so clearly.
6. **Format responses with markdown** — use headers, bullet points, bold text, and tables for readability.

## CURRENT PAGE CONTEXT
The user is currently on: ${currentPage || "Unknown page"}

## QUERY HANDLING
- **Summary queries** ("What's my compliance status?", "Summarise my assessment"): Provide an executive summary with overall score, top gaps by domain, and priority actions.
- **Gap queries** ("What are my high-priority risks?", "Where am I non-compliant?"): Filter and present non-compliant/partial findings, sorted by risk level (critical > high > standard).
- **General queries** ("What assessments are available?", "What does this app do?"): Explain the 15-domain DPDP assessment framework and platform features.
- **Advisory queries** ("How do I fix this?", "What does Sec 8(6) require?"): Provide expert guidance with statutory references.
- **Navigation queries** ("Where do I upload evidence?", "How do I generate a policy?"): Guide the user to the correct page/feature.

## PLATFORM FEATURES (for navigation guidance)
- **Dashboard** (/dashboard): Overview of assessments, compliance scores, quick actions
- **Organisation Profile** (/assessment/org-profile): Set up org details for assessment
- **Rapid Assessment** (/assessment/rapid): 15-domain DPDP compliance check
- **Policy Matrix** (/assessment/policy-matrix): Track 37 policies, SOPs, registers, contracts
- **Department Grid** (/assessment/dept-grid): Per-department control assessment
- **Policy & SOP Builder** (/policy-sop-builder): AI-powered document generation
- **Policy Library** (/policy-library): Browse and manage generated documents
- **Artefact Repository** (/repository): Upload and manage compliance evidence
- **Compliance Dashboard** (/assessment/dashboard): Visual compliance analytics
${domainsRef}
${userContextBlock}
${kmContextBlock}

## FALLBACK BEHAVIOUR
${!hasAssessments && user ? `The user hasn't completed any assessments yet. Be encouraging and guide them:
"It looks like you haven't started a compliance assessment yet. I'd recommend beginning with the **DPDP Readiness Assessment** — it covers all 15 compliance domains across ${ASSESSMENT_DOMAINS.length} areas. Head to the **Organisation Profile** page to set up your org details, then proceed to the **Rapid Assessment** to evaluate your current posture. Would you like me to explain any specific domain?"` : ""}
${!user ? `The user is not authenticated. Politely ask them to sign in: "To provide personalised compliance insights, I need access to your assessment data. Please sign in first, and I'll be able to help you with your specific compliance posture."` : ""}`;

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: allMessages,
        stream: true,
        temperature: 0.4,
        max_tokens: 8192,
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
          JSON.stringify({ error: "AI usage credits exhausted. Please contact your administrator." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("privacy-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
