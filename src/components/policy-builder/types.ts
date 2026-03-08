export interface DocumentConfig {
  documentType: string;
  frameworks: string[];
  industry: string;
  orgSize: string;
  maturity: number; // 0-4
  outputFormat: string;
  classification: string;
  // Extended org context
  orgName?: string;
  dpoName?: string;
  date?: string;
  sdfClassification?: string;
  geographies?: string;
  processingActivities?: string[];
  maturityLevel?: string;
  sector?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export const DOCUMENT_TYPES = [
  { value: "info-security-policy", label: "Information Security Policy", category: "Policy" },
  { value: "data-privacy-policy", label: "Data Privacy Policy", category: "Policy" },
  { value: "acceptable-use-policy", label: "Acceptable Use Policy", category: "Policy" },
  { value: "incident-response-policy", label: "Incident Response Policy", category: "Policy" },
  { value: "business-continuity-policy", label: "Business Continuity Policy", category: "Policy" },
  { value: "vendor-risk-policy", label: "Vendor Risk Management Policy", category: "Policy" },
  { value: "access-control-policy", label: "Access Control Policy", category: "Policy" },
  { value: "data-classification-policy", label: "Data Classification Policy", category: "Policy" },
  { value: "sop-incident-response", label: "SOP — Incident Response", category: "SOP" },
  { value: "sop-breach-notification", label: "SOP — Data Breach Notification", category: "SOP" },
  { value: "sop-access-provisioning", label: "SOP — Access Provisioning", category: "SOP" },
  { value: "sop-vuln-management", label: "SOP — Vulnerability Management", category: "SOP" },
  { value: "sop-third-party-onboarding", label: "SOP — Third Party Onboarding", category: "SOP" },
] as const;

export const FRAMEWORKS = [
  { value: "nist-csf-2", label: "NIST CSF 2.0" },
  { value: "nist-sp-800-53", label: "NIST SP 800-53 Rev 5" },
  { value: "nist-sp-800-171", label: "NIST SP 800-171" },
  { value: "nist-privacy", label: "NIST Privacy Framework" },
  { value: "iso-27001", label: "ISO/IEC 27001:2022" },
  { value: "dpdp-act", label: "DPDP Act 2023" },
  { value: "gdpr", label: "GDPR" },
] as const;

export const INDUSTRIES = [
  "Financial Services",
  "Healthcare",
  "Technology",
  "Manufacturing",
  "Legal & Professional Services",
  "Government & PSU",
  "Retail & E-Commerce",
] as const;

export const ORG_SIZES = [
  { value: "sme", label: "SME" },
  { value: "mid-market", label: "Mid-Market" },
  { value: "enterprise", label: "Enterprise" },
  { value: "fortune-500", label: "Fortune 500" },
] as const;

export const MATURITY_LEVELS = [
  "Initial",
  "Developing",
  "Defined",
  "Managed",
  "Optimizing",
] as const;

export const OUTPUT_FORMATS = [
  { value: "docx", label: "DOCX-ready" },
  { value: "pdf", label: "PDF-ready" },
  { value: "markdown", label: "Markdown" },
] as const;

export const CLASSIFICATIONS = [
  { value: "public", label: "Public", color: "hsl(var(--primary))" },
  { value: "internal", label: "Internal", color: "hsl(var(--chart-4))" },
  { value: "confidential", label: "Confidential", color: "hsl(var(--amber))" },
  { value: "restricted", label: "Restricted", color: "hsl(var(--destructive))" },
] as const;

export const QUICK_PROMPTS = [
  "Draft an Information Security Policy aligned to NIST CSF 2.0 and ISO 27001",
  "Create an Incident Response SOP with NIST SP 800-61 workflow steps",
  "Generate a Data Privacy Policy for a FinTech under DPDP Act + GDPR",
  "Build a Vendor Risk Management Policy with third-party due diligence clauses",
  "Draft Access Control Policy with RBAC and zero-trust principles",
  "Create a Data Breach Notification SOP with regulatory timelines",
] as const;
