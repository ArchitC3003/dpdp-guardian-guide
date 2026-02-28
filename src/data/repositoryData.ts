export interface Artefact {
  name: string;
  status: "Missing" | "Draft" | "Under Review" | "Approved";
  owner: string;
  lastUpdated: string;
}

export interface SubFolder {
  label: string;
  artefacts: Artefact[];
}

export interface RepositoryFolder {
  phase: number;
  name: string;
  artefacts?: Artefact[];
  subFolders?: SubFolder[];
}

const missing = (name: string): Artefact => ({ name, status: "Missing", owner: "Unassigned", lastUpdated: "—" });

export const REPOSITORY_FOLDERS: RepositoryFolder[] = [
  {
    phase: 1,
    name: "Org Profile",
    artefacts: [
      "Certificate of Incorporation / Registration",
      "Organisation Chart (with data roles annotated)",
      "Data Flow Diagram (entity-level)",
      "DPO / Privacy Officer Appointment Letter",
      "Key Management / Board Resolution on Data Governance",
      "List of Third-Party Data Processors & Sub-processors",
      "Joint Controller Agreement (if applicable)",
      "Regulatory Licences & Sector Filings",
    ].map(missing),
  },
  {
    phase: 2,
    name: "Policy Matrix",
    artefacts: [
      "Privacy Notice – Website / App",
      "Privacy Notice – Employees / Job Applicants",
      "Privacy Notice – CCTV / Physical Surveillance",
      "Consent Management Policy",
      "Consent Artefact Records & Logs",
      "Cookie Policy & Consent Banner",
      "Data Processing Agreement (DPA) – Template",
      "Data Processing Agreement – Executed Copies",
      "Data Sharing Agreement",
      "Controller-to-Controller Agreement",
      "Data Retention & Deletion Policy",
      "Data Deletion / Erasure Procedure SOP",
      "Records of Processing Activities (RoPA)",
      "Data Protection Impact Assessment (DPIA) Framework",
      "DPIA Register",
      "Legitimate Use Register (Sec 4 Basis)",
      "Children's Data Processing Policy",
      "Parental / Guardian Consent Procedure",
      "Data Principal Rights Request Procedure",
      "Rights Request Log / Tracker",
      "Grievance Redressal Policy & Escalation Matrix",
      "Data Breach / Incident Response Policy",
      "Breach Notification SOP (to DPBI)",
      "Breach Register",
      "Information Security Policy",
      "Access Control & IAM Policy",
      "Vendor Due Diligence Questionnaire",
      "Third-Party Risk Assessment Register",
      "Cross-Border Transfer Risk Assessment",
      "Standard Contractual Clauses / Transfer Safeguards",
      "Employee Training & Awareness Policy",
      "Training Attendance Records",
      "Internal Audit Charter – Privacy",
      "Audit Findings & Corrective Action Register",
      "Whistleblower / Disclosure Policy",
      "AI & Automated Decision-Making Policy",
      "Privacy by Design Checklist",
    ].map(missing),
  },
  {
    phase: 3,
    name: "Rapid Assessment Evidence",
    subFolders: [
      { label: "Domain A – Lawful Processing", artefacts: ["Consent records", "Legitimate use documentation"].map(missing) },
      { label: "Domain B – Notice & Transparency", artefacts: ["Published privacy notices", "Notice delivery logs"].map(missing) },
      { label: "Domain C – Purpose Limitation", artefacts: ["Purpose specification register", "Compatible use analysis"].map(missing) },
      { label: "Domain D – Data Minimisation", artefacts: ["Field-level data inventory", "Minimisation review reports"].map(missing) },
      { label: "Domain E – Accuracy & Quality", artefacts: ["Data quality policy", "Correction logs"].map(missing) },
      { label: "Domain F – Storage Limitation", artefacts: ["Retention schedule", "Automated deletion evidence"].map(missing) },
      { label: "Domain G – Data Principal Rights", artefacts: ["Rights request tracker", "DSR response templates"].map(missing) },
      { label: "Domain H – Security Safeguards", artefacts: ["Pen test reports", "ISO 27001 cert or SOC 2 report", "Encryption policy"].map(missing) },
      { label: "Domain I – Breach Management", artefacts: ["Incident log", "DPBI notification evidence", "RCA reports"].map(missing) },
      { label: "Domain J – Third-Party & Processors", artefacts: ["Signed DPAs", "Vendor assessment reports"].map(missing) },
      { label: "Domain K – Cross-Border Transfers", artefacts: ["Transfer risk assessments", "Adequacy notes"].map(missing) },
      { label: "Domain L – Children & Special Categories", artefacts: ["Age-verification evidence", "Parental consent logs"].map(missing) },
      { label: "Domain M – Accountability & Governance", artefacts: ["DPO reports", "Governance meeting minutes"].map(missing) },
      { label: "Domain N – Training & Awareness", artefacts: ["LMS completion records", "Training materials"].map(missing) },
      { label: "Domain O – Privacy by Design & Default", artefacts: ["PbD checklists", "DPIA outcomes", "Design review evidence"].map(missing) },
    ],
  },
  {
    phase: 4,
    name: "Dept Grid",
    artefacts: [
      "Department-wise Data Inventory Matrix",
      "Departmental Data Flow Maps",
      "RACI Matrix – Data Processing Responsibilities",
      "Department Self-Assessment Responses",
      "Dept-level Gap Analysis Reports",
      "Corrective Action Plans per Department",
    ].map(missing),
  },
  {
    phase: 5,
    name: "File References",
    artefacts: [
      "Master Evidence Index (hyperlinked)",
      "External Regulatory Reference Links (MEITY, DPBI circulars)",
      "Sector-Specific Guidelines Index",
      "Court Judgements & Precedent Register",
      "Internal Policy Version History Log",
      "Archived Superseded Documents",
    ].map(missing),
  },
  {
    phase: 6,
    name: "Compliance Dashboard Reports",
    artefacts: [
      "Compliance Score Report (versioned)",
      "Domain-wise Risk Heat Map Export",
      "Penalty Exposure Map",
      "Audit Trail / Activity Log Export",
      "Board/Management Compliance Summary Report",
      "Shared Report Links / Access Log",
      "Assessment Version History Archive",
    ].map(missing),
  },
];

export function getAllArtefacts(folders: RepositoryFolder[]): Artefact[] {
  const all: Artefact[] = [];
  for (const f of folders) {
    if (f.artefacts) all.push(...f.artefacts);
    if (f.subFolders) {
      for (const sf of f.subFolders) all.push(...sf.artefacts);
    }
  }
  return all;
}

export function getFolderArtefactCount(folder: RepositoryFolder): number {
  if (folder.artefacts) return folder.artefacts.length;
  if (folder.subFolders) return folder.subFolders.reduce((s, sf) => s + sf.artefacts.length, 0);
  return 0;
}
