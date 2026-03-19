export interface StructuredBusinessContext {
  cloudProvider?: string;
  dsarSla?: string;
  breachNotificationSla?: string;
  paymentProcessors?: string;
  childrenDataProcessing?: "yes" | "no" | "";
  keyThirdPartyVendors?: string;
}

export interface OrgContext {
  orgName: string;
  /** @deprecated Use industries[] instead */
  industry: string;
  industries: string[];
  dpoName: string;
  date: string;
  orgSize: string;
  sdfClassification: string;
  geographies: string;
  processingActivities: string[];
  personalDataTypes: string[];
  maturityLevel: string;
  sector: string;
  additionalContext: string;
  structuredContext?: StructuredBusinessContext;
}

export const DEFAULT_ORG_CONTEXT: OrgContext = {
  orgName: "",
  industry: "",
  industries: [],
  dpoName: "",
  date: new Date().toISOString().split("T")[0],
  orgSize: "",
  sdfClassification: "",
  geographies: "",
  processingActivities: [],
  personalDataTypes: [],
  maturityLevel: "",
  sector: "",
  additionalContext: "",
  structuredContext: {
    cloudProvider: "",
    dsarSla: "",
    breachNotificationSla: "",
    paymentProcessors: "",
    childrenDataProcessing: "",
    keyThirdPartyVendors: "",
  },
};

export const INDUSTRY_OPTIONS = [
  "Technology/IT Services",
  "BFSI/Banking",
  "Insurance",
  "Healthcare/Healthtech",
  "EdTech/Education",
  "Manufacturing",
  "Retail/E-commerce",
  "Telecom",
  "Government/PSU",
  "Legal/Professional Services",
  "Hospitality & Travel",
  "Media & Entertainment",
  "Energy & Utilities",
  "Real Estate & PropTech",
  "Logistics & Supply Chain",
  "Agriculture & AgriTech",
  "Other",
] as const;

export const SECTOR_MAP: Record<string, string[]> = {
  "Technology/IT Services": ["SaaS/Cloud", "Cybersecurity", "AI/ML", "Fintech", "DevOps/Infrastructure", "Data Analytics", "IoT Platform", "Enterprise Software", "Consulting/Managed Services", "General"],
  "BFSI/Banking": ["Retail Banking", "Investment Banking", "NBFCs", "Payment Processors", "Microfinance", "Digital Lending", "Wealth Management", "Credit Bureaus", "General"],
  "Insurance": ["Life Insurance", "General Insurance", "Health Insurance", "Reinsurance", "InsurTech", "Broking", "General"],
  "Healthcare/Healthtech": ["Hospitals & Clinics", "Telemedicine", "Diagnostics & Labs", "MedTech/Devices", "Wearables", "Pharma & Life Sciences", "Health Insurance/TPA", "Mental Health Platforms", "General"],
  "EdTech/Education": ["K-12", "Higher Education", "Online Learning Platforms", "Test Prep", "Skill Development", "Proctoring Services", "Student Information Systems", "General"],
  "Manufacturing": ["Automotive", "Pharmaceuticals", "FMCG", "Electronics", "Textiles", "Heavy Engineering", "Defence & Aerospace", "General"],
  "Retail/E-commerce": ["B2C Marketplace", "D2C Brands", "Quick Commerce", "Grocery/Food Delivery", "Fashion & Lifestyle", "B2B Commerce", "Social Commerce", "General"],
  "Telecom": ["Mobile Operators", "ISPs/Broadband", "Tower Companies", "OTT/Streaming", "Unified Communications", "General"],
  "Government/PSU": ["Central Government", "State Government", "PSU Banks", "Defence", "e-Governance Platforms", "Smart City", "General"],
  "Legal/Professional Services": ["Law Firms", "CA/CS Firms", "Consulting", "HR/Staffing", "Compliance Advisory", "General"],
  "Hospitality & Travel": ["Hotels & Resorts", "Airlines", "OTA/Travel Aggregators", "Food & Beverage", "Tourism", "General"],
  "Media & Entertainment": ["OTT/Streaming", "News & Publishing", "Gaming", "Advertising/AdTech", "Social Media", "General"],
  "Energy & Utilities": ["Oil & Gas", "Renewable Energy", "Power Distribution", "Water Utilities", "Smart Grid/Metering", "General"],
  "Real Estate & PropTech": ["Residential", "Commercial", "Co-working/Managed Spaces", "Property Management Tech", "General"],
  "Logistics & Supply Chain": ["Warehousing", "Last-mile Delivery", "Freight/Shipping", "Fleet Management", "Supply Chain SaaS", "General"],
  "Agriculture & AgriTech": ["Precision Farming", "Supply Chain/Market Linkage", "Agri-Fintech", "Farm Management", "General"],
  "Other": ["General"],
};

export const ORG_SIZE_OPTIONS = [
  { value: "startup", label: "Startup (1–50)" },
  { value: "sme", label: "SME (51–500)" },
  { value: "mid-market", label: "Mid-Market (501–5000)" },
  { value: "enterprise", label: "Enterprise (5001–50000)" },
  { value: "mnc", label: "MNC (50000+)" },
] as const;

export const SDF_OPTIONS = [
  { value: "sdf", label: "Significant Data Fiduciary (SDF)" },
  { value: "standard", label: "Standard Data Fiduciary" },
  { value: "processor", label: "Data Processor Only" },
  { value: "under-assessment", label: "Under Assessment" },
] as const;

export const GEOGRAPHY_OPTIONS = [
  { value: "india-only", label: "India Only" },
  { value: "india-eu", label: "India + EU/GDPR" },
  { value: "india-us", label: "India + US/CCPA" },
  { value: "india-apac", label: "India + APAC" },
  { value: "global", label: "Global/Multi-jurisdiction" },
] as const;

export interface ProcessingActivity {
  id: string;
  label: string;
  legalBasis: string;
  dpdpSection: string;
  isSensitive: boolean;
  industries: string[];
}

export const PROCESSING_ACTIVITIES_CATALOGUE: ProcessingActivity[] = [
  { id: "pa-01", label: "Employee Onboarding & HR Management", legalBasis: "Legitimate Use – Employment", dpdpSection: "S.4(1)", isSensitive: false, industries: ["All"] },
  { id: "pa-02", label: "Payroll & Benefits Administration", legalBasis: "Legitimate Use – Employment", dpdpSection: "S.4(1)", isSensitive: false, industries: ["All"] },
  { id: "pa-03", label: "Customer Account Creation & KYC", legalBasis: "Consent + Statutory Obligation", dpdpSection: "S.6, S.4(2)", isSensitive: false, industries: ["BFSI/Banking", "Insurance", "Retail/E-commerce", "Telecom"] },
  { id: "pa-04", label: "Payment Processing & Transaction Records", legalBasis: "Contractual Necessity", dpdpSection: "S.4(1)", isSensitive: false, industries: ["BFSI/Banking", "Retail/E-commerce", "Hospitality & Travel"] },
  { id: "pa-05", label: "Biometric Attendance & Access Control", legalBasis: "Explicit Consent (Sensitive)", dpdpSection: "S.8(5)", isSensitive: true, industries: ["All"] },
  { id: "pa-06", label: "CCTV Surveillance & Physical Security", legalBasis: "Legitimate Use – Security", dpdpSection: "S.4(1)", isSensitive: false, industries: ["All"] },
  { id: "pa-07", label: "Health Data Processing & Medical Records", legalBasis: "Explicit Consent (Sensitive)", dpdpSection: "S.8(5)", isSensitive: true, industries: ["Healthcare/Healthtech", "Insurance"] },
  { id: "pa-08", label: "Marketing Communications & Profiling", legalBasis: "Consent", dpdpSection: "S.6", isSensitive: false, industries: ["Retail/E-commerce", "Media & Entertainment", "Technology/IT Services"] },
  { id: "pa-09", label: "Automated Decision Making & AI Scoring", legalBasis: "Consent + Safeguards", dpdpSection: "S.6, S.12", isSensitive: false, industries: ["BFSI/Banking", "Insurance", "Technology/IT Services"] },
  { id: "pa-10", label: "Cross-border Data Transfer", legalBasis: "Government Notification", dpdpSection: "S.16", isSensitive: false, industries: ["All"] },
  { id: "pa-11", label: "Third-Party/Vendor Data Sharing", legalBasis: "Consent + Contractual", dpdpSection: "S.8(2)", isSensitive: false, industries: ["All"] },
  { id: "pa-12", label: "Cookie Tracking & Web Analytics", legalBasis: "Consent", dpdpSection: "S.6", isSensitive: false, industries: ["Retail/E-commerce", "Media & Entertainment", "Technology/IT Services", "EdTech/Education"] },
  { id: "pa-13", label: "Children's Data Processing", legalBasis: "Verifiable Parental Consent", dpdpSection: "S.9", isSensitive: true, industries: ["EdTech/Education", "Media & Entertainment", "Healthcare/Healthtech"] },
  { id: "pa-14", label: "Data Subject Access Request (DSAR) Handling", legalBasis: "Statutory Obligation", dpdpSection: "S.11, S.12, S.13", isSensitive: false, industries: ["All"] },
  { id: "pa-15", label: "Data Breach Detection & Notification", legalBasis: "Statutory Obligation", dpdpSection: "S.8(6)", isSensitive: false, industries: ["All"] },
  { id: "pa-16", label: "Consent Collection & Lifecycle Management", legalBasis: "Core DPDP Requirement", dpdpSection: "S.6, S.7", isSensitive: false, industries: ["All"] },
  { id: "pa-17", label: "Data Retention & Disposal", legalBasis: "Purpose Limitation", dpdpSection: "S.8(7)", isSensitive: false, industries: ["All"] },
  { id: "pa-18", label: "Credit Scoring & Financial Profiling", legalBasis: "Consent + RBI Guidelines", dpdpSection: "S.6", isSensitive: false, industries: ["BFSI/Banking"] },
  { id: "pa-19", label: "Insurance Underwriting & Claims Processing", legalBasis: "Consent + IRDAI Regulations", dpdpSection: "S.6, S.8(5)", isSensitive: true, industries: ["Insurance"] },
  { id: "pa-20", label: "Student Records & Academic Administration", legalBasis: "Consent + RTE/UGC", dpdpSection: "S.6", isSensitive: false, industries: ["EdTech/Education"] },
  { id: "pa-21", label: "Telemedicine & Remote Patient Monitoring", legalBasis: "Explicit Consent (Health)", dpdpSection: "S.8(5)", isSensitive: true, industries: ["Healthcare/Healthtech"] },
  { id: "pa-22", label: "Supply Chain & Logistics Data Processing", legalBasis: "Contractual Necessity", dpdpSection: "S.4(1)", isSensitive: false, industries: ["Manufacturing", "Logistics & Supply Chain", "Retail/E-commerce"] },
  { id: "pa-23", label: "Guest Registration & Hospitality Records", legalBasis: "Contractual + Statutory", dpdpSection: "S.4(1)", isSensitive: false, industries: ["Hospitality & Travel"] },
  { id: "pa-24", label: "Content Personalisation & Recommendation", legalBasis: "Consent", dpdpSection: "S.6", isSensitive: false, industries: ["Media & Entertainment", "Retail/E-commerce", "EdTech/Education"] },
  { id: "pa-25", label: "Grievance Redressal & Complaint Management", legalBasis: "Statutory Obligation", dpdpSection: "S.8(4)", isSensitive: false, industries: ["All"] },
  { id: "pa-26", label: "Internal Audit & Compliance Monitoring", legalBasis: "Legitimate Use", dpdpSection: "S.4(1)", isSensitive: false, industries: ["All"] },
  { id: "pa-27", label: "Research & Development (Anonymised)", legalBasis: "Legitimate Use (Anonymised)", dpdpSection: "S.4(1)", isSensitive: false, industries: ["Healthcare/Healthtech", "Technology/IT Services", "Agriculture & AgriTech"] },
  { id: "pa-28", label: "Government Reporting & Regulatory Filing", legalBasis: "Statutory Obligation", dpdpSection: "S.4(2)", isSensitive: false, industries: ["All"] },
];

/** @deprecated Use PROCESSING_ACTIVITIES_CATALOGUE instead */
export const PROCESSING_ACTIVITIES = PROCESSING_ACTIVITIES_CATALOGUE.map(pa => pa.label);

export const MATURITY_OPTIONS = [
  { value: "initial", label: "Initial" },
  { value: "developing", label: "Developing" },
  { value: "defined", label: "Defined" },
  { value: "managed", label: "Managed" },
  { value: "optimising", label: "Optimising" },
] as const;

// ── Quality Score System ──

export interface FieldQualityItem {
  fieldName: string;
  label: string;
  weight: number;
  filled: boolean;
  impact: string;
  sectionRef?: string;
}

function hasAnyStructuredContext(sc?: StructuredBusinessContext): boolean {
  if (!sc) return false;
  return !!(sc.cloudProvider?.trim() || sc.dsarSla?.trim() || sc.breachNotificationSla?.trim() || sc.paymentProcessors?.trim() || sc.childrenDataProcessing || sc.keyThirdPartyVendors?.trim());
}

export function getOrgProfileQualityScore(ctx: OrgContext, docType?: string): {
  score: number;
  maxScore: number;
  percentage: number;
  colour: "red" | "amber" | "green";
  fields: FieldQualityItem[];
} {
  const fields: FieldQualityItem[] = [
    { fieldName: "orgName", label: "Organisation Name", weight: 10, filled: !!ctx.orgName?.trim(), impact: "Document header and all references will show placeholder text", sectionRef: "org-basics" },
    { fieldName: "industries", label: "Industry Selection", weight: 15, filled: ctx.industries?.length > 0, impact: "No sector-specific clauses, regulatory references, or data type recommendations", sectionRef: "org-industry" },
    { fieldName: "sector", label: "Sub-Sector", weight: 10, filled: !!ctx.sector?.trim(), impact: "Generic instead of sub-sector-specific processing activities and risk factors", sectionRef: "org-subsector" },
    { fieldName: "orgSize", label: "Organisation Size", weight: 5, filled: !!ctx.orgSize, impact: "Governance structure and DPO requirements won't be calibrated to org scale", sectionRef: "org-basics" },
    { fieldName: "dpoName", label: "DPO / Contact Name", weight: 5, filled: !!ctx.dpoName?.trim(), impact: "Contact sections will have placeholder names requiring manual replacement", sectionRef: "org-basics" },
    { fieldName: "geographies", label: "Operating Geographies", weight: 8, filled: !!ctx.geographies?.trim(), impact: "Cross-border transfer clauses and jurisdiction-specific requirements will be missing", sectionRef: "org-geography" },
    { fieldName: "sdfClassification", label: "SDF Classification", weight: 5, filled: !!ctx.sdfClassification, impact: "Significant Data Fiduciary obligations may not be included if applicable", sectionRef: "org-classification" },
    { fieldName: "processingActivities", label: "Processing Activities", weight: 15, filled: ctx.processingActivities?.length > 0, impact: "No legal basis mapping, no activity-specific clauses in the document", sectionRef: "org-activities" },
    { fieldName: "personalDataTypes", label: "Personal Data Types", weight: 10, filled: ctx.personalDataTypes?.length > 0, impact: "Data inventory section will be generic with no sensitivity classification", sectionRef: "org-datatypes" },
    { fieldName: "maturityLevel", label: "Compliance Maturity", weight: 7, filled: !!ctx.maturityLevel, impact: "Document depth and governance complexity won't match your actual maturity stage", sectionRef: "org-maturity" },
    { fieldName: "structuredContext", label: "Quick Business Facts", weight: 8, filled: hasAnyStructuredContext(ctx.structuredContext), impact: "No organisation-specific SLAs, vendor names, or cloud provider references in the document", sectionRef: "org-structured-context" },
    { fieldName: "additionalContext", label: "Business Context", weight: 10, filled: !!(ctx.additionalContext || "").trim(), impact: "No organisation-specific facts, vendor names, or SLA timelines in the document", sectionRef: "org-context" },
  ];

  const score = fields.filter(f => f.filled).reduce((sum, f) => sum + f.weight, 0);
  const maxScore = fields.reduce((sum, f) => sum + f.weight, 0);
  const percentage = Math.round((score / maxScore) * 100);
  const colour = percentage >= 75 ? "green" : percentage >= 40 ? "amber" : "red";

  return { score, maxScore, percentage, colour, fields };
}

/** @deprecated Use getOrgProfileQualityScore instead */
export function getOrgProfileCompleteness(ctx: OrgContext): { filled: number; total: number } {
  const { fields } = getOrgProfileQualityScore(ctx);
  return { filled: fields.filter(f => f.filled).length, total: fields.length };
}
