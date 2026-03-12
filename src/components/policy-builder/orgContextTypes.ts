export interface OrgContext {
  orgName: string;
  industry: string;
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
}

export const DEFAULT_ORG_CONTEXT: OrgContext = {
  orgName: "",
  industry: "",
  dpoName: "",
  date: new Date().toISOString().split("T")[0],
  orgSize: "",
  sdfClassification: "",
  geographies: "",
  processingActivities: [],
  personalDataTypes: [],
  maturityLevel: "",
  sector: "",
};

export const INDUSTRY_OPTIONS = [
  "Technology/IT Services",
  "BFSI/Banking",
  "Insurance",
  "HealthTech/Healthcare",
  "EdTech/Education",
  "Manufacturing",
  "Retail/E-commerce",
  "Telecom",
  "Government/PSU",
  "Legal/Professional Services",
  "Other",
] as const;

export const SECTOR_MAP: Record<string, string[]> = {
  "Technology/IT Services": ["SaaS", "Fintech", "Cybersecurity", "IT Services/BPO", "Product"],
  "BFSI/Banking": ["Retail Banking", "Investment Banking", "NBFC", "Payment Gateway", "Wealth Management"],
  "Insurance": ["Life Insurance", "General Insurance", "Health Insurance", "Reinsurance"],
  "HealthTech/Healthcare": ["Hospital", "Pharma", "HealthTech", "Diagnostics"],
  "EdTech/Education": ["K-12", "Higher Education", "EdTech Platform", "Online Learning"],
  "Manufacturing": ["General"],
  "Retail/E-commerce": ["General"],
  "Telecom": ["General"],
  "Government/PSU": ["General"],
  "Legal/Professional Services": ["General"],
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

export const PROCESSING_ACTIVITIES = [
  "Employee/HR Data",
  "Customer Personal Data",
  "Financial & Payment Data",
  "Health & Medical Data",
  "Biometric Data",
  "Children's Data (under 18)",
  "Sensitive Personal Data",
  "Third-Party/Vendor Data",
  "Cross-border Data Transfers",
  "Automated Decision Making",
] as const;

export const MATURITY_OPTIONS = [
  { value: "initial", label: "Initial" },
  { value: "developing", label: "Developing" },
  { value: "defined", label: "Defined" },
  { value: "managed", label: "Managed" },
  { value: "optimising", label: "Optimising" },
] as const;

export function getOrgProfileCompleteness(ctx: OrgContext): { filled: number; total: number } {
  const total = 10;
  let filled = 0;
  if (ctx.orgName.trim()) filled++;
  if (ctx.industry) filled++;
  if (ctx.dpoName.trim()) filled++;
  if (ctx.date) filled++;
  if (ctx.orgSize) filled++;
  if (ctx.sdfClassification) filled++;
  if (ctx.geographies) filled++;
  if (ctx.processingActivities.length > 0) filled++;
  if (ctx.maturityLevel) filled++;
  if (ctx.sector) filled++;
  return { filled, total };
}
