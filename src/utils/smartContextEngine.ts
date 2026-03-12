/**
 * Smart Context Inference Engine
 *
 * Deterministic mapping matrix that auto-deduces Processing Activities,
 * Personal Data Types, and recommended Compliance Maturity based on
 * Industry, Jurisdiction, DPDP Classification, AND Document Type selections.
 */

export interface InferenceResult {
  processingActivities: string[];
  personalDataTypes: string[];
  maturityLevel: string;
}

interface RuleKey {
  industry: string;
  geographies: string;
  sdfClassification: string;
}

interface Rule extends RuleKey {
  result: InferenceResult;
}

// ── Artefact-Specific Data Mapping ──────────────────────────────────
export interface ArtefactMapping {
  personalDataTypes: string[];
  processingActivities: string[];
}

const ARTEFACT_MAP: Record<string, ArtefactMapping> = {
  // ── Policies ────────────────────────────────────────────────────
  "info-security-policy": {
    personalDataTypes: ["System Access Credentials", "Audit Logs", "Network Identifiers", "Security Tokens"],
    processingActivities: ["Access Control Management", "Security Monitoring", "Vulnerability Management"],
  },
  "data-privacy-policy": {
    personalDataTypes: ["Customer Personal Data", "Consent Records", "Data Subject Requests", "Processing Logs"],
    processingActivities: ["Consent Management", "Data Subject Rights Fulfilment", "Privacy Impact Assessment"],
  },
  "acceptable-use-policy": {
    personalDataTypes: ["Employee Device Data", "Internet Usage Logs", "Email Metadata", "Application Access Logs"],
    processingActivities: ["Employee Monitoring", "IT Asset Management", "Acceptable Use Enforcement"],
  },
  "incident-response-policy": {
    personalDataTypes: ["Incident Logs", "Forensic Images", "Affected Data Subject Records", "Communication Records"],
    processingActivities: ["Incident Detection & Triage", "Forensic Analysis", "Regulatory Reporting", "Stakeholder Notification"],
  },
  "business-continuity-policy": {
    personalDataTypes: ["Backup Data Sets", "Recovery Test Records", "Emergency Contact Details"],
    processingActivities: ["Disaster Recovery", "Business Impact Analysis", "Continuity Testing"],
  },
  "vendor-risk-policy": {
    personalDataTypes: ["Vendor Contact Details", "Sub-processor Records", "Due Diligence Reports", "Contract Data"],
    processingActivities: ["Third-Party Due Diligence", "Vendor Onboarding", "Sub-processor Monitoring", "Data Processing Agreement Management"],
  },
  "access-control-policy": {
    personalDataTypes: ["User Identity Records", "Role Assignments", "Authentication Logs", "Privileged Access Logs"],
    processingActivities: ["Identity & Access Management", "Privileged Access Management", "Access Certification Reviews"],
  },
  "data-classification-policy": {
    personalDataTypes: ["Data Inventory Records", "Classification Labels", "Data Flow Maps"],
    processingActivities: ["Data Discovery & Classification", "Data Inventory Management", "Labelling & Handling"],
  },

  // ── SOPs ────────────────────────────────────────────────────────
  "sop-incident-response": {
    personalDataTypes: ["Incident Logs", "Forensic Images", "System Snapshots", "Communication Trails"],
    processingActivities: ["Forensic Analysis", "Log Review", "Regulatory Reporting", "Evidence Preservation"],
  },
  "sop-breach-notification": {
    personalDataTypes: ["Affected Data Subject Records", "Breach Impact Assessment Data", "Notification Records", "Regulatory Correspondence"],
    processingActivities: ["Breach Classification", "DPBI Notification (72-hr)", "CERT-In Notification (6-hr)", "Data Subject Communication"],
  },
  "sop-access-provisioning": {
    personalDataTypes: ["User Identity Records", "Role Definitions", "Approval Workflow Logs", "De-provisioning Records"],
    processingActivities: ["Joiner-Mover-Leaver Processing", "Access Request Approval", "Periodic Access Review"],
  },
  "sop-vuln-management": {
    personalDataTypes: ["Vulnerability Scan Reports", "Asset Inventory", "Patch Records", "Risk Scores"],
    processingActivities: ["Vulnerability Scanning", "Patch Management", "Risk Prioritisation", "Remediation Tracking"],
  },
  "sop-third-party-onboarding": {
    personalDataTypes: ["Vendor Contact Details", "Due Diligence Questionnaires", "Contract & DPA Records", "Compliance Certificates"],
    processingActivities: ["Vendor Risk Assessment", "DPA Negotiation", "Ongoing Vendor Monitoring", "Vendor Off-boarding"],
  },

  // ── Extended Document Types (for Assessment Repository Generator) ──
  "employee-privacy-policy": {
    personalDataTypes: ["Salary Details", "Performance Reviews", "Background Checks", "Bank Account Details", "Employee Contact Information", "Leave Records"],
    processingActivities: ["Payroll Processing", "HR Management", "Performance Evaluation", "Background Verification"],
  },
  "cookie-tracking-policy": {
    personalDataTypes: ["IP Address", "Device IDs", "Browsing History", "Cookie Identifiers", "Geo-location Data"],
    processingActivities: ["Web Analytics", "Targeted Advertising", "Session Management", "User Preference Tracking"],
  },
  "cctv-physical-security-sop": {
    personalDataTypes: ["Video Recordings", "Facial Imagery", "Entry/Exit Logs", "Visitor Records", "Vehicle Number Plates"],
    processingActivities: ["Premises Surveillance", "Security Monitoring", "Visitor Management", "Incident Investigation"],
  },
  "data-breach-incident-sop": {
    personalDataTypes: ["Incident Logs", "Forensic Evidence", "Affected Data Subject Records", "Regulatory Filings"],
    processingActivities: ["Forensic Analysis", "Log Review", "Regulatory Reporting", "Root Cause Analysis", "Post-Incident Review"],
  },
  "consent-management-policy": {
    personalDataTypes: ["Consent Records", "Data Principal Identifiers", "Purpose Descriptions", "Withdrawal Records"],
    processingActivities: ["Consent Collection", "Consent Lifecycle Management", "Purpose Limitation Enforcement"],
  },
  "data-retention-policy": {
    personalDataTypes: ["Data Inventory", "Retention Schedule Records", "Deletion Logs", "Archive Manifests"],
    processingActivities: ["Retention Schedule Management", "Secure Deletion", "Archive Management", "Litigation Hold"],
  },
  "dsar-sop": {
    personalDataTypes: ["Data Subject Identity Records", "Request Logs", "Response Records", "Verification Documents"],
    processingActivities: ["Identity Verification", "Data Retrieval & Compilation", "Response Delivery", "Request Tracking"],
  },
};

// ── Industry Macro Mapping (existing rules refactored) ─────────────

const RULES: Rule[] = [
  // Healthcare
  { industry: "HealthTech/Healthcare", geographies: "india-only", sdfClassification: "sdf", result: { processingActivities: ["Health & Medical Data", "Customer Personal Data", "Biometric Data", "Sensitive Personal Data"], personalDataTypes: ["Patient Health Records (EHR)", "Diagnostic Reports", "Insurance Claim Data", "Prescription Data"], maturityLevel: "defined" } },
  { industry: "HealthTech/Healthcare", geographies: "india-eu", sdfClassification: "sdf", result: { processingActivities: ["Health & Medical Data", "Customer Personal Data", "Biometric Data", "Cross-border Data Transfers", "Sensitive Personal Data"], personalDataTypes: ["Patient Health Records (EHR)", "Genomic Data", "Clinical Trial Data", "Cross-border Patient Data"], maturityLevel: "managed" } },
  { industry: "HealthTech/Healthcare", geographies: "india-only", sdfClassification: "standard", result: { processingActivities: ["Health & Medical Data", "Customer Personal Data", "Employee/HR Data"], personalDataTypes: ["Patient Records", "Staff HR Data", "Appointment Data"], maturityLevel: "developing" } },

  // BFSI / Banking
  { industry: "BFSI/Banking", geographies: "india-only", sdfClassification: "sdf", result: { processingActivities: ["Financial & Payment Data", "Customer Personal Data", "Biometric Data", "Cross-border Data Transfers", "Automated Decision Making"], personalDataTypes: ["KYC Documents", "Transaction Records", "Credit Scores", "Aadhaar/eKYC Data", "Account Details"], maturityLevel: "managed" } },
  { industry: "BFSI/Banking", geographies: "global", sdfClassification: "sdf", result: { processingActivities: ["Financial & Payment Data", "Customer Personal Data", "Biometric Data", "Cross-border Data Transfers", "Automated Decision Making", "Third-Party/Vendor Data"], personalDataTypes: ["KYC Documents", "SWIFT Transaction Data", "Credit Bureau Data", "Payment Card Data", "Wealth Management Records"], maturityLevel: "managed" } },
  { industry: "BFSI/Banking", geographies: "india-only", sdfClassification: "standard", result: { processingActivities: ["Financial & Payment Data", "Customer Personal Data", "Employee/HR Data"], personalDataTypes: ["Customer Account Data", "Basic KYC", "Staff Records"], maturityLevel: "developing" } },

  // Insurance
  { industry: "Insurance", geographies: "india-only", sdfClassification: "sdf", result: { processingActivities: ["Health & Medical Data", "Financial & Payment Data", "Customer Personal Data", "Sensitive Personal Data", "Automated Decision Making"], personalDataTypes: ["Policyholder Data", "Claims Records", "Medical Underwriting Data", "Agent/Broker Data"], maturityLevel: "managed" } },
  { industry: "Insurance", geographies: "india-only", sdfClassification: "standard", result: { processingActivities: ["Customer Personal Data", "Financial & Payment Data", "Employee/HR Data"], personalDataTypes: ["Policyholder Contact Data", "Premium Records", "Staff HR Data"], maturityLevel: "developing" } },

  // Technology / IT Services
  { industry: "Technology/IT Services", geographies: "global", sdfClassification: "processor", result: { processingActivities: ["Employee/HR Data", "Third-Party/Vendor Data", "Cross-border Data Transfers", "Customer Personal Data"], personalDataTypes: ["Client PII (as Processor)", "Employee Data", "System Logs", "API Access Tokens"], maturityLevel: "defined" } },
  { industry: "Technology/IT Services", geographies: "india-eu", sdfClassification: "processor", result: { processingActivities: ["Employee/HR Data", "Third-Party/Vendor Data", "Cross-border Data Transfers", "Customer Personal Data"], personalDataTypes: ["Client PII (as Processor)", "GDPR Subject Data", "Employee Data", "Cloud Tenant Data"], maturityLevel: "defined" } },
  { industry: "Technology/IT Services", geographies: "india-only", sdfClassification: "sdf", result: { processingActivities: ["Customer Personal Data", "Employee/HR Data", "Automated Decision Making", "Third-Party/Vendor Data", "Cross-border Data Transfers"], personalDataTypes: ["User Account Data", "Behavioural Analytics", "Employee Records", "API/Integration Data"], maturityLevel: "managed" } },
  { industry: "Technology/IT Services", geographies: "india-only", sdfClassification: "standard", result: { processingActivities: ["Customer Personal Data", "Employee/HR Data", "Third-Party/Vendor Data"], personalDataTypes: ["User Contact Data", "Employee HR Data", "Vendor Contact Data"], maturityLevel: "developing" } },

  // EdTech / Education
  { industry: "EdTech/Education", geographies: "india-only", sdfClassification: "sdf", result: { processingActivities: ["Children's Data (under 18)", "Customer Personal Data", "Employee/HR Data", "Sensitive Personal Data"], personalDataTypes: ["Student Academic Records", "Parent/Guardian Data", "Learning Analytics", "Proctoring Data"], maturityLevel: "defined" } },
  { industry: "EdTech/Education", geographies: "india-only", sdfClassification: "standard", result: { processingActivities: ["Children's Data (under 18)", "Customer Personal Data", "Employee/HR Data"], personalDataTypes: ["Student Enrollment Data", "Parent Contact Data", "Staff Records"], maturityLevel: "developing" } },

  // Telecom
  { industry: "Telecom", geographies: "india-only", sdfClassification: "sdf", result: { processingActivities: ["Customer Personal Data", "Biometric Data", "Automated Decision Making", "Cross-border Data Transfers", "Third-Party/Vendor Data"], personalDataTypes: ["Subscriber Data", "CDR/Call Records", "Location Data", "eKYC/Biometric Data"], maturityLevel: "managed" } },

  // Retail / E-commerce
  { industry: "Retail/E-commerce", geographies: "india-only", sdfClassification: "sdf", result: { processingActivities: ["Customer Personal Data", "Financial & Payment Data", "Automated Decision Making", "Third-Party/Vendor Data"], personalDataTypes: ["Customer Profiles", "Order/Transaction Data", "Delivery Address Data", "Payment Information"], maturityLevel: "defined" } },
  { industry: "Retail/E-commerce", geographies: "global", sdfClassification: "sdf", result: { processingActivities: ["Customer Personal Data", "Financial & Payment Data", "Automated Decision Making", "Third-Party/Vendor Data", "Cross-border Data Transfers"], personalDataTypes: ["Customer Profiles", "Cross-border Order Data", "Payment Card Data", "Behavioural/Recommendation Data"], maturityLevel: "managed" } },

  // Government / PSU
  { industry: "Government/PSU", geographies: "india-only", sdfClassification: "sdf", result: { processingActivities: ["Customer Personal Data", "Biometric Data", "Sensitive Personal Data", "Children's Data (under 18)", "Automated Decision Making"], personalDataTypes: ["Citizen Identity Data", "Aadhaar Data", "Beneficiary Records", "Grievance Records"], maturityLevel: "defined" } },

  // Manufacturing
  { industry: "Manufacturing", geographies: "india-only", sdfClassification: "standard", result: { processingActivities: ["Employee/HR Data", "Third-Party/Vendor Data", "Customer Personal Data"], personalDataTypes: ["Worker Safety Records", "Contractor Data", "Supply Chain Contact Data"], maturityLevel: "developing" } },

  // Legal / Professional Services
  { industry: "Legal/Professional Services", geographies: "india-only", sdfClassification: "standard", result: { processingActivities: ["Customer Personal Data", "Sensitive Personal Data", "Employee/HR Data", "Third-Party/Vendor Data"], personalDataTypes: ["Client Case Data", "Privileged Communications", "Witness/Party Data", "Staff Records"], maturityLevel: "defined" } },
];

// ── Fuzzy fallback (unchanged logic) ─────────────────────────────────
function scoreMatch(rule: RuleKey, input: RuleKey): number {
  let score = 0;
  if (rule.industry === input.industry) score += 3;
  if (rule.sdfClassification === input.sdfClassification) score += 2;
  if (rule.geographies === input.geographies) score += 1;
  return score;
}

function findIndustryMatch(industry: string, geographies: string, sdfClassification: string): Rule["result"] | null {
  if (!industry || !geographies || !sdfClassification) return null;

  const input: RuleKey = { industry, geographies, sdfClassification };

  const exact = RULES.find(
    (r) => r.industry === input.industry && r.geographies === input.geographies && r.sdfClassification === input.sdfClassification
  );
  if (exact) return exact.result;

  let bestScore = 0;
  let bestRule: Rule | null = null;
  for (const rule of RULES) {
    const s = scoreMatch(rule, input);
    if (s > bestScore) { bestScore = s; bestRule = rule; }
  }

  if (bestScore >= 3 && bestRule) return bestRule.result;
  return null;
}

/**
 * Get artefact-specific data mapping for a given document type.
 */
export function getArtefactMapping(documentType: string): ArtefactMapping | null {
  return ARTEFACT_MAP[documentType] || null;
}

/**
 * Main inference function.
 * Accepts optional documentType to merge artefact-specific data.
 * Returns null when no reasonable match is found.
 */
export function inferSmartContext(
  industry: string,
  geographies: string,
  sdfClassification: string,
  documentType?: string
): InferenceResult | null {
  const industryResult = findIndustryMatch(industry, geographies, sdfClassification);
  const artefactResult = documentType ? ARTEFACT_MAP[documentType] : null;

  // If neither matched, return null
  if (!industryResult && !artefactResult) return null;

  // Set-union merge: industry (macro) + artefact (micro), no duplicates
  const mergedActivities = Array.from(new Set([
    ...(industryResult?.processingActivities || []),
    ...(artefactResult?.processingActivities || []),
  ]));

  const mergedDataTypes = Array.from(new Set([
    ...(industryResult?.personalDataTypes || []),
    ...(artefactResult?.personalDataTypes || []),
  ]));

  return {
    processingActivities: mergedActivities,
    personalDataTypes: mergedDataTypes,
    maturityLevel: industryResult?.maturityLevel || "developing",
  };
}
