import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACK_SYSTEM_INSTRUCTION = `You are a Principal GRC Counsel and Data Protection specialist with 25+ years advising Fortune 100 companies, Big Four consulting firms, and Indian regulatory bodies. You have deep expertise in DPDP Act 2023 implementation, sector-specific regulatory compliance, and enterprise policy drafting.

═══ CRITICAL DRAFTING RULES — FOLLOW WITHOUT EXCEPTION ═══

RULE 1 — ZERO PLACEHOLDERS: NEVER output placeholder text: [Insert], [TBD], [As applicable], [Organisation Name], [To be filled], or any bracketed unfilled content. Use the exact organisation name, DPO name, date, and sector details from the context provided. If a detail is missing, derive a reasonable professional default from the sector, size, and classification — do NOT leave blanks.

RULE 2 — COMPLETE, ENFORCEABLE PROSE: Generate the FULL document. Every section must contain 2–4 paragraphs of enforceable policy language — not bullet outlines, not skeleton headings. Each clause must be specific enough that an auditor can assess compliance against it. Use mandatory language ("shall", "must") for obligations and "may" only for discretionary provisions.

RULE 3 — FRAMEWORK-SPECIFIC CITATIONS: For EVERY compliance framework selected, cite ACTUAL section numbers, article numbers, rule numbers, or control IDs inline. Examples: [DPDP Act Sec 8(6)], [NIST CSF 2.0: GV.RM-01], [ISO 27001:2022 A.5.24], [CERT-In Directions Para 4(vi)].

RULE 4 — SECTOR-SPECIFIC TAILORING: This is NOT a generic template. You MUST:
  (a) Reference the SPECIFIC sectoral regulators and instruments applicable to the organisation's industry (e.g., RBI Master Directions for BFSI, NHA/ABDM for Healthcare, UGC for EdTech).
  (b) Include sector-specific data categories (e.g., KYC data for banking, EHR for healthcare, student records for education) with their SPECIFIC handling requirements.
  (c) Use sector-appropriate retention periods citing the ACTUAL legal basis (e.g., PMLA Rules for KYC = 5 years post-closure, not generic "as per applicable law").
  (d) Include ALL applicable breach notification timelines beyond DPDP (e.g., CERT-In 6hr, RBI CSITE, SEBI CSCRF).
  (e) Address sector-specific risk factors (e.g., multi-tenant data isolation for SaaS, patient re-identification for healthcare).

RULE 5 — MATURITY-CALIBRATED LANGUAGE: Match the obligation language and control expectations to the organisation's stated compliance maturity level:
  - Initial: "shall establish" — foundational controls, manual processes acceptable, 90-day implementation
  - Developing: "is formalising" — documented processes, automation roadmap, 6-month timeline
  - Defined: "has established and maintains" — standardised, tool-supported, annual audit cycle
  - Managed: "monitors and measures effectiveness of" — KPI-driven, continuous monitoring, quarterly metrics
  - Optimising: "continuously improves" — best-in-class, AI-assisted, proactive regulatory engagement

RULE 6 — SIZE-APPROPRIATE GOVERNANCE: Scale governance expectations to the organisation size:
  - Startup/SME: Privacy Champion (may be dual-role), external DPO option, proportionate resource allocation
  - Mid-Market/Enterprise: Dedicated DPO with team, Board reporting, cross-functional privacy committee
  - MNC: Global CPO structure, regional DPOs, privacy engineering team, SOC 2 Type II certification

RULE 7 — SDF-AWARE OBLIGATIONS: If the organisation is classified as Significant Data Fiduciary (SDF):
  - MUST include annual DPIA requirement (Rule 12, Sec 10(2))
  - MUST include independent data auditor requirement (Rule 13)
  - MUST include DPO with India residency requirement (Rule 9)
  - MUST include algorithmic risk due diligence for automated processing (Rule 13(3))
  - MUST include data localisation obligations (Rule 13(4))
  - MUST include Board-level accountability provisions

RULE 8 — DOCUMENT STRUCTURE: Every document must include:
  (a) Version History table with document reference number
  (b) Document metadata: Classification, Owner, Approver, Effective Date, Review Date
  (c) Executive Summary / Purpose (with statutory basis)
  (d) Scope and Applicability (with exclusions)
  (e) Definitions table (with DPDP Act statutory definitions where applicable)
  (f) Policy body with numbered sections and sub-sections
  (g) Roles & Responsibilities (RACI or equivalent)
  (h) Enforcement & Non-Compliance
  (i) Related Documents / Cross-References
  (j) Review & Approval section with signature block
  (k) Appendices where appropriate (e.g., data flow diagrams, retention schedules, incident classification)

RULE 9 — CROSS-REFERENCE INTEGRITY: Reference specific companion documents by their document reference codes (e.g., "refer to Breach Response Plan [SOP-BRP-001]", "as defined in Data Classification Policy [POL-DCP-001]"). Use the standard reference numbering: POL-xxx-001 for policies, SOP-xxx-001 for procedures, REG-xxx-001 for registers.

RULE 10 — PRACTICAL OPERABILITY: Every control statement must be implementable. Include:
  - WHO is responsible (role, not person)
  - WHAT specific action is required
  - WHEN it must be performed (frequency, trigger)
  - HOW compliance is evidenced (specific evidence artifact)
  Example: "The DPO shall conduct a quarterly review of the consent register to verify that all active processing activities have valid, unexpired consent records. Evidence: Signed quarterly consent audit report [REG-CON-001]."

Format output with clear numbered sections, sub-sections, and professional headings appropriate for an audit-ready compliance document.`;

// ── Sector Intelligence Helpers (Edge Function) ──────────────────

function buildSectorOverlay(sector: string, industry: string): string {
  const key = sector || industry || "";
  const lower = key.toLowerCase();

  if (lower.includes("bfsi") || lower.includes("banking") || lower.includes("financial") || lower.includes("nbfc") || lower.includes("payment")) {
    return `═══ SECTOR REGULATORY OVERLAY: BFSI / BANKING ═══
CRITICAL — This document MUST incorporate and cite ALL of the following sector-specific regulations in addition to DPDP Act 2023:

REGULATORY INSTRUMENTS (cite specific paragraphs in document clauses):
• RBI Master Direction on IT Governance, Risk, Controls & Assurance [RBI/2023-24/42] — Chapters 4-8
• RBI Cybersecurity Framework for Banks [DBS.CO/CSITE/BC.11/33.01.001/2015-16]
• SEBI CSCRF 2024 [SEBI/HO/ITD/ITD-PoD-1/P/CIR/2024/113] — if SEBI-regulated
• RBI Digital Payment Security Controls Directions [RBI/2020-21/74]
• CERT-In Directions 2022 [No. 20(3)/2022-CERT-In] — mandatory 6-hour reporting
• PMLA Rules — record retention (5yr KYC, 10yr transactions)

SPECIAL DATA CATEGORIES — Include specific handling controls for:
• KYC/Identity Data: Encrypted storage, CKYC integration, Video KYC retention per RBI/2022-23/15
• Financial Transaction Data: E2E encryption, 10-year retention (PMLA), real-time fraud monitoring
• Credit Bureau Data: Purpose-limited CICRA 2005 access, consent-specific CIC sharing
• Payment Card Data: PCI DSS v4.0, mandatory tokenisation per RBI circular
• Aadhaar/eKYC Data: Virtual ID only, biometric deletion within session, UIDAI audit

RETENTION SCHEDULE (use these EXACT periods):
• KYC Records: 5 years from account closure [PMLA Rules, Rule 3(1)]
• Transaction Records: 10 years from transaction date [PMLA Rules, Rule 3(1A)]
• STR Reports: 5 years from FIU-IND filing [PMLA Rules, Rule 7]
• IT Audit Logs: 5 years rolling [RBI IT Governance MD + CERT-In]
• Customer Communications: 8 years [RBI Customer Service Circular]

BREACH NOTIFICATION TIMELINE (include ALL):
• CERT-In: 6 hours from detection [CERT-In Directions 2022]
• RBI CSITE: 6 hours for cyber incidents; 2-6 hours for payment fraud
• SEBI: 6 hours for MIIs [CSCRF Annex-B]
• DPBI: 72 hours [DPDP Act Sec 8(6), Rule 7]

SECTOR RISK FACTORS (address in risk assessment section):
• Systemic risk from interconnected payment infrastructure
• Identity theft via social engineering on banking channels
• Third-party fintech/payment aggregator data exposure
• Cross-border SWIFT messaging data leakage
• Regulatory arbitrage in multi-jurisdictional operations`;
  }

  if (lower.includes("health") || lower.includes("hospital") || lower.includes("pharma") || lower.includes("diagnostic")) {
    return `═══ SECTOR REGULATORY OVERLAY: HEALTHCARE / HEALTHTECH ═══
CRITICAL — This document MUST incorporate and cite ALL of the following:

REGULATORY INSTRUMENTS:
• ABDM Health Data Management Policy [NHA/ABDM/HDMP/2022] — FHIR standards, Health ID
• ICMR National Ethical Guidelines for Biomedical Research [ICMR 2017]
• Telemedicine Practice Guidelines [MCI Notification 25.03.2020]
• Clinical Establishments Act 2010 [Act No. 11 of 2010]
• Mental Healthcare Act 2017 Sec 23 — enhanced confidentiality for mental health records

SPECIAL DATA CATEGORIES:
• EHR: ABDM-compliant FHIR format, AES-256 at rest, patient-controlled Health ID access
• Clinical Trial Data: Pseudonymisation mandatory, 15-year post-trial retention, ICMR consent
• Genomic/Genetic Data: Explicit informed consent, no secondary use, data localisation recommended
• Mental Health Records: Enhanced confidentiality per MHA 2017 Sec 23, restricted clinical access

RETENTION SCHEDULE:
• Patient Medical Records (adults): 3 years from last consultation (MCI: indefinite recommended)
• Patient Records (minors): Until age 25 (7 years post-majority)
• Clinical Trial Records: 15 years post-completion [ICMR, New Drugs Rules 2019]
• Prescription Records: 3 years from dispensing [Drugs & Cosmetics Rules]

BREACH NOTIFICATION:
• CERT-In: 6 hours [CERT-In Directions 2022]
• NHA (ABDM): 72 hours; affected patients within 7 days
• DPBI: 72 hours [DPDP Act Sec 8(6), Rule 7]

SECTOR RISK FACTORS:
• Patient data exposure through telemedicine platforms
• Ransomware targeting hospital OT and life-critical systems
• Research data re-identification through linkage attacks
• IoMT device vulnerabilities
• Cross-border clinical trial data transfer`;
  }

  if (lower.includes("edtech") || lower.includes("education") || lower.includes("university") || lower.includes("school")) {
    return `═══ SECTOR REGULATORY OVERLAY: EDTECH / EDUCATION ═══
CRITICAL — This document MUST address children's data obligations:

REGULATORY INSTRUMENTS:
• RTE Act 2009 — educational data handling for ages 6-14
• POCSO Act 2012 — mandatory reporting obligations for child safety
• UGC Online Programmes Regulations 2024
• NCPCR Guidelines on Children's Digital Safety 2023

SPECIAL DATA CATEGORIES:
• Children's Data (under 18): Verifiable parental consent, no tracking/profiling/targeting, age-gating
• Student Academic Records: Immutable audit trail, parent access for minors, portability per UGC
• Proctoring Data: Examination-only collection, 30-day post-result deletion, alternative mode option
• Learning Analytics: Aggregated only for platform improvement, no third-party advertiser sharing

RETENTION:
• Student Enrollment: Permanent (degree verification)
• Examination Records: Permanent (statutory)
• Proctoring Video: 30 days post-result; 90 if disputed
• Children's PD: Deleted on consent withdrawal or graduation

CRITICAL: DPDP Act Sec 9 + Rule 10 — Children's data processing requires:
  (a) Verifiable parental/guardian consent BEFORE any processing
  (b) Age verification mechanism proportionate to risk
  (c) COMPLETE prohibition on behavioural monitoring and targeted advertising
  (d) Purpose-limited to educational delivery only`;
  }

  if (lower.includes("tech") || lower.includes("it ") || lower.includes("saas") || lower.includes("software")) {
    return `═══ SECTOR REGULATORY OVERLAY: TECHNOLOGY / IT SERVICES ═══

REGULATORY INSTRUMENTS:
• IT Act 2000 Sec 43A (Reasonable Security Practices) + IT Amendment 2008
• IT (Reasonable Security Practices) Rules 2011 — ISO 27001 equivalence
• CERT-In Directions 2022 — 6-hour reporting, 180-day log retention, VPN/cloud obligations
• IT Intermediary Guidelines 2021 (if intermediary)

SPECIAL DATA CATEGORIES:
• Client PII (as Processor): Strict DPA adherence, no commingling, sub-processor chain, data isolation in multi-tenant SaaS
• Employee Monitoring Data: Proportionality assessment, pre-monitoring notice, explicit consent for keystroke/screen recording
• Log Data (with user IDs): Pseudonymise where possible, 180-day retention (CERT-In), tamper-proof SIEM

RETENTION:
• System Logs: 180 days rolling [CERT-In Directions Para 4(vi)]
• Employee HR Records: 8 years post-separation [PW Act, EPF Act]
• Client Data (Processor): Per DPA; default delete/return within 30 days of termination
• Contracts/NDAs: Limitation period + 3 years (6 years)

PROCESSOR-SPECIFIC (if applicable):
• Include Sec 8(4) obligations: processing only per DF instructions
• Breach notification to DF client within DPA SLA (24-48 hours typical)
• Data deletion/return on contract termination [Sec 8(8)]`;
  }

  if (lower.includes("insurance") || lower.includes("irdai")) {
    return `═══ SECTOR REGULATORY OVERLAY: INSURANCE ═══

REGULATORY INSTRUMENTS:
• IRDAI Information & Cyber Security Guidelines 2023
• IRDAI (Protection of Policyholders' Interests) Regulations 2017
• PMLA Rules (for money laundering reporting)
• CERT-In Directions 2022

SPECIAL DATA CATEGORIES:
• Health/Medical Data (claims): Enhanced encryption, purpose-limited to underwriting/claims, no marketing use without explicit consent
• Financial Data (premium/claims): E2E encryption, fraud monitoring, 8-year retention
• Policyholder Identity Data: KYC norms per IRDAI, Aadhaar usage per UIDAI guidelines
• Automated Underwriting Data: Algorithmic transparency, bias audit, right to human review`;
  }

  // Default for unmatched sectors
  return `═══ SECTOR CONTEXT ═══
Industry: ${key}
Apply DPDP Act 2023, DPDP Rules 2025, CERT-In Directions 2022, and IT Act 2000 Sec 43A as primary regulatory framework. Include sector-appropriate controls based on the nature of personal data processed.`;
}

function buildMaturityCalibration(maturity: string): string {
  const lower = (maturity || "defined").toLowerCase();

  const map: Record<string, string> = {
    initial: `═══ MATURITY CALIBRATION: INITIAL ═══
Obligation language: Use "shall establish and implement" throughout.
Control posture: Foundational stage — this document establishes baseline requirements to be operationalised within 90 days.
Evidence standard: Documented policies (manual acceptable), signed acknowledgements, meeting records.
Automation: Manual processes acceptable; include a roadmap for automation within 12-18 months.
Governance: Privacy Champion (may be dual-role) with documented additional responsibility.`,

    developing: `═══ MATURITY CALIBRATION: DEVELOPING ═══
Obligation language: Use "is in the process of formalising and shall complete implementation of" throughout.
Control posture: Progressing towards documented, repeatable processes. Gaps are being actively remediated.
Evidence standard: Approved policies, process flows, training records, initial risk assessments.
Automation: Documented workflows with target automation within 6-12 months for consent, DSR, breach detection.
Governance: Formally appointed DPO with documented responsibilities and senior management reporting.`,

    defined: `═══ MATURITY CALIBRATION: DEFINED ═══
Obligation language: Use "has established and maintains" throughout.
Control posture: Documented, standardised processes consistently implemented across all business units.
Evidence standard: Versioned policies, RACI matrices, competency-assessed training, risk register with treatment plans, audit reports.
Automation: Tool-supported core processes — consent platform, automated DSR workflow, SIEM-integrated breach detection.
Governance: Dedicated DPO with Board reporting. Cross-functional privacy committee. Quarterly GRC reviews.`,

    managed: `═══ MATURITY CALIBRATION: MANAGED ═══
Obligation language: Use "monitors, measures, and assures the effectiveness of" throughout.
Control posture: Metrics-driven programme. KPIs/KRIs with deviation-triggered corrective action.
Evidence standard: All 'defined' evidence plus KPI dashboards, trend analysis, independent audit findings, benchmarking.
Automation: Fully automated consent lifecycle, real-time DSAR, automated discovery/classification, continuous monitoring.
Governance: Dedicated privacy team. DPO with Board reporting and independent budget. Enterprise risk integration.`,

    optimising: `═══ MATURITY CALIBRATION: OPTIMISING ═══
Obligation language: Use "continuously improves and optimises" throughout.
Control posture: Best-in-class, proactively enhanced based on threat intelligence, benchmarks, emerging regulation.
Evidence standard: Continuous improvement documentation, innovation initiatives, external certifications, peer benchmarking.
Automation: AI-powered privacy operations — automated flow mapping, predictive risk scoring, self-healing consent, automated regulatory change analysis.
Governance: Privacy as strategic enabler. Board-level committee. Privacy engineering in product dev. External advisory board.`,
  };

  return map[lower] || map.defined;
}

function buildSizeCalibration(size: string): string {
  const lower = (size || "enterprise").toLowerCase();

  const map: Record<string, string> = {
    startup: `═══ SIZE CALIBRATION: STARTUP (1-50) ═══
Governance: Privacy Champion (founder/CTO with additional responsibility). External DPO services permitted.
Resources: Minimum 0.5 FTE equivalent for privacy. Proportionate to processing volume.
Timeline: Core controls within 60 days. Full programme maturity within 12 months.
Audit: Annual self-assessment. External audit upon SDF threshold.`,

    sme: `═══ SIZE CALIBRATION: SME (51-500) ═══
Governance: Designated DPO (internal or external) reporting to MD. Quarterly Privacy Working Group (IT, Legal, HR).
Resources: Minimum 1 FTE for privacy + cross-functional champions per department.
Timeline: Core controls within 90 days. Full compliance within 6 months. Continuous improvement from Month 7.
Audit: Annual internal audit. External audit every 2 years or upon SDF notification.`,

    "mid-market": `═══ SIZE CALIBRATION: MID-MARKET (501-5000) ═══
Governance: Dedicated DPO with 2-4 member team. Privacy Committee chaired by CLO/GC with CTO, CHRO, CMO. Board reporting quarterly.
Resources: 2-4 FTE privacy team. Champions network. Dedicated privacy tooling budget.
Timeline: Core controls within 60 days. Advanced controls (automation) within 6 months.
Audit: Annual internal + biennial external (CERT-In empanelled/Big Four). Quarterly control testing.`,

    enterprise: `═══ SIZE CALIBRATION: ENTERPRISE (5001-50000) ═══
Governance: CPO/DPO reporting to Board. Privacy Office with Privacy Counsel, Privacy Engineer, Compliance Analysts, DSR Operations. Enterprise Privacy Governance Committee.
Resources: 5-15 FTE privacy team. Dedicated privacy technology stack. Per-employee training budget.
Timeline: Phase 1 (90 days) governance + critical controls. Phase 2 (180 days) automation. Phase 3 (365 days) optimisation.
Audit: Quarterly control testing. Annual comprehensive internal audit. Annual external audit. Continuous GRC platform monitoring.`,

    mnc: `═══ SIZE CALIBRATION: MNC (50000+) ═══
Governance: Global Privacy Office with regional DPOs. India DPO → Global CPO + India Board. Cross-jurisdictional Governance Council. Privacy Engineering team in product dev.
Resources: India Privacy Office 8-20 FTE. Global shared services. Enterprise GRC platform. Dedicated privacy legal counsel.
Timeline: DPDP alignment within 90 days. India-specific implementation within 180 days. Cross-border mechanisms within 120 days.
Audit: Continuous automated monitoring. Monthly testing. Quarterly management review. Annual Big Four audit. SOC 2 Type II maintained.`,
  };

  return map[lower] || map.enterprise;
}

function buildSdfOverlay(orgName: string, dpoName: string): string {
  return `═══ SDF-SPECIFIC REQUIREMENTS ═══
${orgName} is classified as a Significant Data Fiduciary. The following ENHANCED OBLIGATIONS must be addressed in EVERY relevant section:

1. DPO APPOINTMENT [DPDP Act Sec 10(2)(a), Rule 9]:
   ${dpoName} must be an Indian resident, with direct Board reporting line, independent budget, and no conflict of interest.

2. ANNUAL DPIA [DPDP Act Sec 10(2)(b), Rule 12]:
   Mandatory Data Protection Impact Assessment by qualified independent auditor. DPIA summary published on website.

3. INDEPENDENT DATA AUDIT [Rule 13]:
   Annual audit by independent data auditor. Audit report submitted to DPBI within 30 days of completion.

4. ALGORITHMIC RISK ASSESSMENT [Rule 13(3)]:
   Due diligence on all automated decision-making systems processing personal data. Bias and fairness audit.

5. DATA LOCALISATION [Rule 13(4)]:
   Critical personal data categories stored in India. Cross-border mirroring with adequacy documentation.

6. BOARD ACCOUNTABILITY:
   Board-level quarterly privacy risk reporting. Board approval for DPIA scope and findings.
   Personal liability awareness under DPDP Act Sec 33.`;
}

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
      processingActivities, personalDataTypes, sector, dpoName, date,
      additionalContext,
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

    // ── Sector Intelligence: regulatory overlay for the AI ──────────
    const sectorIntel = buildSectorOverlay(effectiveSector, industry);
    const maturityIntel = buildMaturityCalibration(effectiveMaturity);
    const sizeIntel = buildSizeCalibration(effectiveSize);
    const sdfIntel = effectiveSdf === "sdf" ? buildSdfOverlay(effectiveOrgName, effectiveDpo) : "";

    const userPrompt = `═══ MANDATORY ORGANISATION CONTEXT ═══
Use these EXACT values throughout the document — do NOT generalise or substitute:

Organisation Name: ${effectiveOrgName}
Document Type: ${effectiveDocType}
Sector: ${effectiveSector} / ${industry || "Technology"}
Organisation Size: ${effectiveSize}
DPDP Classification: ${effectiveSdf}
Applicable Jurisdictions: ${effectiveGeo}
Data Processing Activities: ${activitiesList}
Compliance Maturity Level: ${effectiveMaturity}
Compliance Frameworks: ${effectiveFrameworks}
DPO/Privacy Lead: ${effectiveDpo}
Effective Date: ${effectiveDate}

═══ DRAFTING INSTRUCTION ═══
Generate a complete, specific, and enforceable ${effectiveDocType} for ${effectiveOrgName}, a ${effectiveSize} ${effectiveSector} organisation classified as ${effectiveSdf} under the DPDP Act 2023.

Every clause must be tailored to this organisation's actual processing activities: ${activitiesList}.
The document must comply with: ${effectiveFrameworks}.
Operating jurisdictions: ${effectiveGeo}.
Current maturity: ${effectiveMaturity}.

Use "${effectiveOrgName}" for the organisation name, "${effectiveDpo}" for the DPO, and "${effectiveDate}" for dates. Never use generic placeholders.

${maturityIntel}

${sizeIntel}

${sectorIntel}

${sdfIntel}

═══ QUALITY GATE ═══
Before outputting each section, verify:
1. Does this clause reference ${effectiveOrgName} by name (not "the organisation")?
2. Does it cite specific statutory sections (not "applicable law")?
3. Does it include sector-specific controls for ${effectiveSector}?
4. Is the obligation language calibrated to ${effectiveMaturity} maturity?
5. Can an auditor assess compliance against this clause?
6. Does every control state WHO, WHAT, WHEN, and EVIDENCE?

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