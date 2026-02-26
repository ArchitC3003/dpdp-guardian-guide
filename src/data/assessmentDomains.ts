export interface AssessmentItem {
  id: string;
  description: string;
  risk: "critical" | "high" | "standard";
  evidence: string;
}

export interface Domain {
  code: string;
  name: string;
  section: string;
  penalty: string;
  items: AssessmentItem[];
  conditional?: "children" | "consentMgr" | "processor";
  sdfOnly?: string[]; // item IDs that are SDF-only
}

export const DOMAINS: Domain[] = [
  {
    code: "A", name: "Notice & Transparency", section: "Sec 5, Rule 3–4", penalty: "₹50 Cr",
    items: [
      { id: "A.1", description: "Published standalone privacy notice — data categories, purposes, rights, DPO contact, processor disclosures, cross-border", risk: "critical", evidence: "Policy Document" },
      { id: "A.2", description: "Notice in English + Eighth Schedule language, version control, change log", risk: "high", evidence: "Policy Document" },
      { id: "A.3", description: "Notice covers ALL processing streams — employee, vendor, CCTV, analytics", risk: "high", evidence: "Policy Document" },
      { id: "A.4", description: "Notice provided before/at time of data collection per stream (Sec 5(1))", risk: "high", evidence: "SOP/Workflow" },
    ],
  },
  {
    code: "B", name: "Consent Management", section: "Sec 6, Rule 3–4", penalty: "₹50 Cr",
    items: [
      { id: "B.1", description: "Documented legal basis for EVERY processing stream", risk: "critical", evidence: "Register" },
      { id: "B.2", description: "Operational consent mechanism — granular, purpose-wise, affirmative, timestamped", risk: "critical", evidence: "System/Platform" },
      { id: "B.3", description: "Consent withdrawal with equal ease, triggering processing stop + processor notification", risk: "critical", evidence: "System/Platform" },
      { id: "B.4", description: "No dark patterns — no pre-ticked boxes, forced bundling (Sec 6(3))", risk: "high", evidence: "UI/UX Review" },
      { id: "B.5", description: "CM Board registration, token storage, log reconciliation, interoperability (Rule 5)", risk: "high", evidence: "System Config" },
      { id: "B.6", description: "Re-consent mechanism for purpose changes", risk: "high", evidence: "SOP/Workflow" },
    ],
  },
  {
    code: "C", name: "Legitimate Use & Lawful Basis", section: "Sec 4, 7", penalty: "₹50 Cr",
    items: [
      { id: "C.1", description: "Each Sec 7 stream: documented basis, statutory ground (7a–i), scope boundary", risk: "critical", evidence: "Register" },
      { id: "C.2", description: "Employment data (Sec 7(i)): documented purposes, biometric justification, proportionality", risk: "high", evidence: "Assessment Record" },
      { id: "C.3", description: "Govt/legal obligation (Sec 7(b–e)): specific statute/order/court per activity", risk: "high", evidence: "Register" },
      { id: "C.4", description: "Medical/epidemic/disaster (Sec 7(f–h)): minimisation, scope, termination triggers", risk: "standard", evidence: "SOP" },
      { id: "C.5", description: "Legacy data: fresh notice + consent re-obtained or legitimate use documented", risk: "high", evidence: "Report" },
    ],
  },
  {
    code: "D", name: "Data Inventory & Quality", section: "Sec 4, 8(1)–(3)", penalty: "₹50 Cr",
    items: [
      { id: "D.1", description: "Complete data inventory mapping ALL PD stores, flows, access, systems", risk: "critical", evidence: "Register" },
      { id: "D.2", description: "Data minimisation per processing stream", risk: "high", evidence: "Assessment Record" },
      { id: "D.3", description: "Purpose-to-processing mapping with mission-creep controls", risk: "high", evidence: "Register" },
      { id: "D.4", description: "Data accuracy: verification, correction workflows, quality checks (Sec 8(2)–(3))", risk: "standard", evidence: "SOP" },
    ],
  },
  {
    code: "E", name: "Security Safeguards", section: "Sec 8(5), Rule 6", penalty: "₹250 Cr",
    items: [
      { id: "E.1", description: "Encryption at rest and in transit (Rule 6(a))", risk: "critical", evidence: "System Config" },
      { id: "E.2", description: "RBAC + periodic review + MFA (Rule 6(b)(c))", risk: "critical", evidence: "System Config" },
      { id: "E.3", description: "Access/processing logs ≥1 year, tamper-resistant (Rule 6(e))", risk: "critical", evidence: "System Config" },
      { id: "E.4", description: "Masking/tokenisation/anonymisation (Rule 6(a))", risk: "high", evidence: "System Config" },
      { id: "E.5", description: "Backups with integrity + tested restoration (Rule 6(d))", risk: "high", evidence: "System Config" },
      { id: "E.6", description: "Annual VAPT minimum (Rule 6(g))", risk: "high", evidence: "Report" },
      { id: "E.7", description: "Approved Information Security Policy (Rule 6(f))", risk: "high", evidence: "Policy Document" },
      { id: "E.8", description: "Continuous safeguard review (Rule 6(h))", risk: "high", evidence: "Report" },
    ],
  },
  {
    code: "F", name: "Breach Preparedness", section: "Sec 8(6), Rule 7", penalty: "₹200 Cr",
    items: [
      { id: "F.1", description: "Approved Breach Response Plan", risk: "critical", evidence: "Policy Document" },
      { id: "F.2", description: "Named breach team, escalation, 24/7 chain", risk: "critical", evidence: "SOP" },
      { id: "F.3", description: "Classification framework with SLAs per level", risk: "high", evidence: "SOP" },
      { id: "F.4", description: "Board notification template per Rule 7(2)", risk: "critical", evidence: "Template" },
      { id: "F.5", description: "Individual notification template per Rule 7(1)", risk: "critical", evidence: "Template" },
      { id: "F.6", description: "Detection: SIEM, IDS/IPS, alerting, monitoring", risk: "critical", evidence: "System Config" },
      { id: "F.7", description: "Processor breach SLA in contracts", risk: "high", evidence: "Contract" },
      { id: "F.8", description: "Evidence preservation: forensics, chain of custody", risk: "high", evidence: "SOP" },
      { id: "F.9", description: "Breach simulation/tabletop in last 12 months", risk: "high", evidence: "Report" },
      { id: "F.10", description: "Post-incident: RCA, lessons learned, actions tracked", risk: "high", evidence: "Report" },
    ],
  },
  {
    code: "G", name: "Data Principal Rights", section: "Sec 11–14, Rule 14", penalty: "₹50 Cr",
    items: [
      { id: "G.1", description: "Published mechanism for access, correction, erasure, grievance (Rule 14(1))", risk: "critical", evidence: "System/Platform" },
      { id: "G.2", description: "Identity verification before acting (Rule 14(1)(b))", risk: "high", evidence: "SOP" },
      { id: "G.3", description: "Grievance redress ≤90 days (Sec 13), tracking", risk: "critical", evidence: "System/Platform" },
      { id: "G.4", description: "End-to-end rights request tracking", risk: "high", evidence: "System/Platform" },
      { id: "G.5", description: "Nomination for death/incapacity (Sec 14)", risk: "standard", evidence: "SOP" },
    ],
  },
  {
    code: "H", name: "Retention & Erasure", section: "Sec 8(7)–(8), Rule 8", penalty: "₹50 Cr",
    items: [
      { id: "H.1", description: "Retention Policy with category-wise periods", risk: "high", evidence: "Policy Document" },
      { id: "H.2", description: "Retention schedule per category: purpose, basis, max period", risk: "critical", evidence: "Register" },
      { id: "H.3", description: "Automated/scheduled retention enforcement", risk: "high", evidence: "System Config" },
      { id: "H.4", description: "Permanent irreversible erasure — production, backups, processors", risk: "high", evidence: "SOP" },
      { id: "H.5", description: "Third Schedule: 48-hr pre-erasure notice", risk: "high", evidence: "SOP" },
      { id: "H.6", description: "Processing/retention logs ≥3 years (Rule 8(3))", risk: "critical", evidence: "System Config" },
    ],
  },
  {
    code: "I", name: "Children's Data", section: "Sec 9, Rule 10", penalty: "₹200 Cr",
    conditional: "children",
    items: [
      { id: "I.1", description: "Age verification/age-gating (Rule 10)", risk: "critical", evidence: "System/Platform" },
      { id: "I.2", description: "Verifiable parental consent with records", risk: "critical", evidence: "System/Platform" },
      { id: "I.3", description: "Tracking/profiling/targeting DISABLED for children (Sec 9(2))", risk: "critical", evidence: "System Config" },
      { id: "I.4", description: "Fourth Schedule exemption: documented justification", risk: "high", evidence: "Report" },
    ],
  },
  {
    code: "J", name: "Processor & Cross-Border", section: "Sec 8(4–5), 16", penalty: "₹250 Cr",
    items: [
      { id: "J.1", description: "Processor contracts with DPDP clauses (Sec 8(4))", risk: "critical", evidence: "Contract" },
      { id: "J.2", description: "Processor due diligence at onboarding + periodic", risk: "high", evidence: "Report" },
      { id: "J.3", description: "Processor register maintained", risk: "high", evidence: "Register" },
      { id: "J.4", description: "Sub-processing restricted without DF approval", risk: "high", evidence: "Contract" },
      { id: "J.5", description: "Processor deletes/returns data on termination (Sec 8(8))", risk: "critical", evidence: "Contract" },
      { id: "J.6", description: "Cross-border: flow map, restriction check (Sec 16(2))", risk: "high", evidence: "Register" },
    ],
  },
  {
    code: "K", name: "Processor Obligations", section: "Sec 8(4)", penalty: "₹250 Cr",
    conditional: "processor",
    items: [
      { id: "K.1", description: "Written contract with each DF client", risk: "critical", evidence: "Contract" },
      { id: "K.2", description: "Processing ONLY within DF instructions", risk: "critical", evidence: "SOP" },
      { id: "K.3", description: "Security per DF contract requirements", risk: "critical", evidence: "Report" },
      { id: "K.4", description: "Breach notification to DF within SLA", risk: "critical", evidence: "SOP" },
      { id: "K.5", description: "Data deleted/returned on termination", risk: "critical", evidence: "SOP" },
      { id: "K.6", description: "No sub-processing without DF approval", risk: "high", evidence: "Contract" },
    ],
  },
  {
    code: "L", name: "Governance & Accountability", section: "Sec 8(9), 10, 26", penalty: "₹50 Cr",
    sdfOnly: ["L.7", "L.8", "L.9", "L.10"],
    items: [
      { id: "L.1", description: "DPO appointed, published contact (Sec 8(9), Rule 9)", risk: "critical", evidence: "Letter" },
      { id: "L.2", description: "RoPA covering all operations", risk: "critical", evidence: "Register" },
      { id: "L.3", description: "Privacy governance structure with Board accountability", risk: "high", evidence: "Report" },
      { id: "L.4", description: "Govt info request SOP (Sec 36, Rule 23)", risk: "high", evidence: "SOP" },
      { id: "L.5", description: "Awareness of voluntary undertaking (Sec 26) + appellate (Sec 27–31)", risk: "standard", evidence: "Report" },
      { id: "L.6", description: "Change management triggers privacy reassessment", risk: "high", evidence: "SOP" },
      { id: "L.7", description: "[SDF only] Annual DPIA by qualified auditor", risk: "critical", evidence: "Report" },
      { id: "L.8", description: "[SDF only] Independent DPDP audit annually", risk: "critical", evidence: "Report" },
      { id: "L.9", description: "[SDF only] Algorithmic risk due diligence (Rule 13(3))", risk: "high", evidence: "Report" },
      { id: "L.10", description: "[SDF only] Data localisation (Rule 13(4))", risk: "high", evidence: "Report" },
    ],
  },
  {
    code: "M", name: "Consent Manager", section: "Sec 6(9), Rule 5", penalty: "₹50 Cr",
    conditional: "consentMgr",
    items: [
      { id: "M.1", description: "Registered with Board as CM", risk: "critical", evidence: "Certificate" },
      { id: "M.2", description: "Interoperable platform across DFs (Rule 5)", risk: "critical", evidence: "System/Platform" },
      { id: "M.3", description: "Single point of contact for DPs", risk: "critical", evidence: "SOP" },
      { id: "M.4", description: "Consent artefacts with fiduciary-level security", risk: "high", evidence: "System Config" },
    ],
  },
  {
    code: "N", name: "Training & Awareness", section: "N/A", penalty: "₹50 Cr",
    items: [
      { id: "N.1", description: "All PD-handling employees trained with completion records", risk: "high", evidence: "Report" },
      { id: "N.2", description: "Privacy in new-joiner onboarding", risk: "high", evidence: "SOP" },
      { id: "N.3", description: "Department-specific training", risk: "high", evidence: "Report" },
      { id: "N.4", description: "Annual refresher with tracked completion", risk: "high", evidence: "Report" },
      { id: "N.5", description: "Board/executive awareness session", risk: "high", evidence: "Report" },
      { id: "N.6", description: "Third-party contractors/temp staff: privacy acknowledgement", risk: "standard", evidence: "Report" },
    ],
  },
];

export const POLICY_ITEMS = {
  P: {
    label: "Policies & Notices",
    items: [
      { id: "P.01", name: "Privacy Notice (website/app)" },
      { id: "P.02", name: "Information Security Policy" },
      { id: "P.03", name: "Data Retention & Erasure Policy" },
      { id: "P.04", name: "Data Classification Policy" },
      { id: "P.05", name: "Cross-Border Transfer Policy" },
      { id: "P.06", name: "Acceptable Use Policy" },
      { id: "P.07", name: "Third-Party/Processor DPP" },
      { id: "P.08", name: "Children's Data Protection Policy" },
      { id: "P.09", name: "BYOD/Remote Access Policy" },
      { id: "P.10", name: "Cloud/SaaS DP Policy" },
      { id: "P.11", name: "Cookie & Tracking Consent Policy" },
    ],
  },
  S: {
    label: "SOPs & Procedures",
    items: [
      { id: "S.01", name: "Consent Management SOP" },
      { id: "S.02", name: "Breach/Incident Response Plan" },
      { id: "S.03", name: "Rights Request Handling SOP" },
      { id: "S.04", name: "Grievance Redress Procedure" },
      { id: "S.05", name: "Data Erasure Procedure" },
      { id: "S.06", name: "Processor Onboarding SOP" },
      { id: "S.07", name: "Govt Info Request SOP" },
      { id: "S.08", name: "DPIA Procedure" },
      { id: "S.09", name: "Data Discovery Procedure" },
      { id: "S.10", name: "Legitimate Use Documentation SOP" },
      { id: "S.11", name: "Privacy Violation/Whistleblower SOP" },
      { id: "S.12", name: "Board/Regulatory Correspondence SOP" },
    ],
  },
  R: {
    label: "Registers & Records",
    items: [
      { id: "R.01", name: "RoPA" },
      { id: "R.02", name: "Consent Log" },
      { id: "R.03", name: "Retention Schedule" },
      { id: "R.04", name: "Processor Register" },
      { id: "R.05", name: "Data Flow Map" },
      { id: "R.06", name: "Rights Request Tracker" },
      { id: "R.07", name: "Breach Incident Register" },
      { id: "R.08", name: "Training Records" },
      { id: "R.09", name: "Data Discovery Register" },
    ],
  },
  C: {
    label: "Contracts & Templates",
    items: [
      { id: "C.01", name: "Processor/Vendor DPA Template" },
      { id: "C.02", name: "Board Breach Notification Template" },
      { id: "C.03", name: "Individual Breach Notification Template" },
      { id: "C.04", name: "CM Integration Agreement" },
      { id: "C.05", name: "DPO Appointment Letter" },
    ],
  },
};

export const DEPARTMENTS = [
  "HR", "IT/Engg", "Legal/Compliance", "Marketing", "Product", "Operations", "Finance", "Admin", "Customer Service"
];

export const DEPT_CONTROLS = [
  { id: 1, label: "Privacy notice covers dept's processing", risk: "high" as const },
  { id: 2, label: "Consent/legal basis documented for dept's data use", risk: "critical" as const },
  { id: 3, label: "Data minimisation practiced", risk: "high" as const },
  { id: 4, label: "Access controls enforced", risk: "critical" as const },
  { id: 5, label: "Staff trained on DPDP", risk: "high" as const },
  { id: 6, label: "Knows how to handle rights requests", risk: "high" as const },
  { id: 7, label: "Knows breach reporting procedure", risk: "critical" as const },
  { id: 8, label: "Retention rules followed", risk: "high" as const },
  { id: 9, label: "Vendor contracts include DPA clauses", risk: "critical" as const },
  { id: 10, label: "Participates in privacy governance", risk: "standard" as const },
  { id: 11, label: "Privacy champion/SPOC designated", risk: "high" as const },
  { id: 12, label: "Privacy review in launch process", risk: "high" as const },
  { id: 13, label: "Cross-border transfers identified", risk: "high" as const },
  { id: 14, label: "Privacy incidents in last 12 months?", risk: "high" as const },
];

export const SPECIAL_STATUS_OPTIONS = [
  { key: "sdf", label: "Significant Data Fiduciary (SDF)", hint: "DPIA, audit, DPO, data localisation (Sec 10, Rule 13)" },
  { key: "consentMgr", label: "Consent Manager", hint: "Board registration, interoperability (Sec 6(9), Rule 5)" },
  { key: "children", label: "Children's Data (under 18)", hint: "Parental consent, age verification (Sec 9, Rule 10)" },
  { key: "crossBorder", label: "Cross-Border Transfers", hint: "Transfer policy, restriction check (Sec 16, Rule 15)" },
  { key: "legacy", label: "Pre-Act (Legacy) Data", hint: "Fresh notice, consent revalidation required" },
  { key: "thirdSchedule", label: "Third Schedule Entity", hint: "48-hr pre-erasure notification (e-commerce, social media, gaming)" },
  { key: "intermediary", label: "IT Act Intermediary", hint: "Blocking directions under Sec 32–33" },
  { key: "startup", label: "Startup Exemption Eligible", hint: "Sec 17(3) relaxations per notification" },
];

export function getRiskMultiplier(risk: "critical" | "high" | "standard"): number {
  return risk === "critical" ? 3 : risk === "high" ? 2 : 1;
}

export function getStatusPct(status: string | null): number | null {
  if (status === "Yes") return 100;
  if (status === "Partial") return 50;
  if (status === "No") return 0;
  return null; // N/A or null — excluded
}
