import { DocumentConfig, FRAMEWORKS, DOCUMENT_TYPES } from "./types";

/* ──────────────────────────────────────────────
   Reference Numbers
   ────────────────────────────────────────────── */

const DOC_REF_MAP: Record<string, string> = {
  "info-security-policy": "POL-ISP-001",
  "data-privacy-policy": "POL-DPP-001",
  "acceptable-use-policy": "POL-AUP-001",
  "incident-response-policy": "POL-IRP-001",
  "business-continuity-policy": "POL-BCP-001",
  "vendor-risk-policy": "POL-VRM-001",
  "access-control-policy": "POL-ACP-001",
  "data-classification-policy": "POL-DCP-001",
  "sop-incident-response": "SOP-IR-001",
  "sop-breach-notification": "SOP-DBN-001",
  "sop-access-provisioning": "SOP-AP-001",
  "sop-vuln-management": "SOP-VM-001",
  "sop-third-party-onboarding": "SOP-TPO-001",
};

function getRef(config: DocumentConfig): string {
  return DOC_REF_MAP[config.documentType] ?? "POL-GEN-001";
}

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */

function getFrameworkLabels(ids: string[]): string[] {
  return ids.map((id) => FRAMEWORKS.find((f) => f.value === id)?.label ?? id);
}

function getDocTypeLabel(id: string): string {
  return DOCUMENT_TYPES.find((d) => d.value === id)?.label ?? "Policy Document";
}

function fwString(config: DocumentConfig): string {
  const labels = getFrameworkLabels(config.frameworks);
  return labels.length > 0 ? labels.join(", ") : "NIST CSF 2.0";
}

/* ──────────────────────────────────────────────
   Industry context injection
   ────────────────────────────────────────────── */

interface IndustryContext {
  extraRefs: string;
  scopeAdditions: string;
  industryLabel: string;
}

function detectIndustryContext(text: string, config: DocumentConfig): IndustryContext {
  const lower = text.toLowerCase();
  const industry = config.industry.toLowerCase();

  if (lower.includes("fintech") || lower.includes("rbi") || lower.includes("payment") || lower.includes("kyc") || lower.includes("nbfc") || lower.includes("sebi") || industry.includes("financial")) {
    return {
      extraRefs: "\n**Additional Regulatory References:** [RBI Cybersecurity Framework 2016] [RBI DPSS Circular 2021] [CERT-In Directions 2022] [SEBI Cybersecurity Circular 2023]",
      scopeAdditions: "\n  e) All payment processing systems, KYC databases, and core banking infrastructure\n  f) Payment aggregator and prepaid payment instrument (PPI) systems\n  g) All data processed under RBI/SEBI regulatory obligations",
      industryLabel: "Financial Services / FinTech",
    };
  }
  if (lower.includes("healthcare") || lower.includes("hospital") || lower.includes("patient") || industry.includes("health")) {
    return {
      extraRefs: "\n**Additional Regulatory References:** [DISHA (Digital Information Security in Healthcare Act)] [HIPAA (if US operations)] [NABH Accreditation Standards]",
      scopeAdditions: "\n  e) All electronic health records (EHR) and patient health information (PHI) systems\n  f) Telemedicine platforms and connected medical devices\n  g) Clinical research data and biobank information systems",
      industryLabel: "Healthcare",
    };
  }
  if (lower.includes("manufacturing") || lower.includes("ot") || lower.includes("ics") || lower.includes("scada") || industry.includes("manufacturing")) {
    return {
      extraRefs: "\n**Additional Regulatory References:** [IEC 62443 (Industrial Cybersecurity)] [NIST SP 800-82 (OT Security)]",
      scopeAdditions: "\n  e) All Operational Technology (OT) and Industrial Control Systems (ICS/SCADA)\n  f) Manufacturing Execution Systems (MES) and supply chain management platforms\n  g) IoT sensors and connected factory floor equipment",
      industryLabel: "Manufacturing",
    };
  }
  if (lower.includes("legal") || lower.includes("law firm") || lower.includes("attorney") || industry.includes("legal")) {
    return {
      extraRefs: "\n**Additional Regulatory References:** [Bar Council of India Rules] [Legal Professional Privilege] [Solicitor-Client Confidentiality Obligations]",
      scopeAdditions: "\n  e) All client matter management systems and legal databases\n  f) Privileged communications and attorney-client correspondence\n  g) Court filing systems and litigation support platforms",
      industryLabel: "Legal & Professional Services",
    };
  }

  return { extraRefs: "", scopeAdditions: "", industryLabel: config.industry || "Technology" };
}

/* ──────────────────────────────────────────────
   Template detection from user message
   ────────────────────────────────────────────── */

type TemplateKey = "isp" | "privacy" | "incident-sop" | "breach-sop" | "vendor" | "access" | "generic-policy" | "generic-sop";

function detectTemplate(text: string, config: DocumentConfig): TemplateKey {
  const lower = text.toLowerCase();

  // SOP templates
  if ((lower.includes("breach") && (lower.includes("notification") || lower.includes("sop"))) || lower.includes("sop-dbn") || config.documentType === "sop-breach-notification") return "breach-sop";
  if (lower.includes("incident response") || lower.includes("ir sop") || lower.includes("800-61") || config.documentType === "sop-incident-response") return "incident-sop";

  // Policy templates
  if (lower.includes("privacy") || lower.includes("personal data") || lower.includes("dpdp") || lower.includes("gdpr") || lower.includes("data protection") || config.documentType === "data-privacy-policy") return "privacy";
  if (lower.includes("vendor") || lower.includes("third party") || lower.includes("third-party") || lower.includes("supplier") || lower.includes("due diligence") || config.documentType === "vendor-risk-policy") return "vendor";
  if (lower.includes("access control") || lower.includes("rbac") || lower.includes("zero trust") || lower.includes("iam") || lower.includes("identity") || config.documentType === "access-control-policy") return "access";
  if (lower.includes("information security") || lower.includes("isp") || lower.includes("isms") || config.documentType === "info-security-policy") return "isp";

  // Fallback by config doc type
  if (config.documentType.startsWith("sop-")) return "generic-sop";
  return "generic-policy";
}

/* ──────────────────────────────────────────────
   Template Generators
   ────────────────────────────────────────────── */

function templateISP(config: DocumentConfig, ctx: IndustryContext): string {
  const fw = fwString(config);
  const ref = getRef({ ...config, documentType: "info-security-policy" });
  return `# Information Security Policy

## Document Reference: ${ref}
**Aligned Frameworks:** ${fw}
**Industry:** ${ctx.industryLabel} | **Classification:** ${config.classification.charAt(0).toUpperCase() + config.classification.slice(1)}
${ctx.extraRefs}

---

## 1. Purpose

1.1 This policy establishes the organization's commitment to maintaining a comprehensive Information Security Management System (ISMS) aligned with ${fw} and applicable regulatory requirements for the ${ctx.industryLabel} sector.

1.2 This policy provides the governance framework for protecting the confidentiality, integrity, and availability of all organizational information assets.

**Control References:** [NIST CSF: GV.PO-01] [NIST CSF: GV.OC-01] [ISO 27001: A.5.1]

## 2. Scope

2.1 This policy applies to:
  a) All employees, contractors, consultants, and third-party service providers
  b) All information assets, systems, networks, and applications owned or managed by the organization
  c) All processing of personal data in capacity as Data Fiduciary or Data Processor
  d) All geographic locations and jurisdictions where the organization operates${ctx.scopeAdditions}

2.2 **Exclusions:** Physical security controls are addressed under the Physical Security Policy (POL-PHY-001).

## 3. Policy Statements

### 3.1 Information Security Governance
  a) The organization shall establish and maintain an ISMS aligned to ISO/IEC 27001:2022.
  b) A GRC Steering Committee shall convene quarterly to review security posture, risk register, and compliance status.
  c) Security objectives shall be defined annually and aligned to business strategy.

**Control References:** [NIST CSF: GV.OC-01] [ISO 27001: 5.1, 5.2] [NIST SP 800-53: PM-1]

### 3.2 Risk Management
  a) Formal risk assessments shall be conducted at least annually and upon significant change.
  b) Risk treatment plans shall have assigned owners, timelines, and Board-approved acceptance criteria.
  c) Residual risk exceeding defined appetite requires Board-level acceptance.

**Control References:** [NIST CSF: GV.RM-01] [NIST CSF: GV.RM-02] [ISO 27001: 6.1.2] [NIST SP 800-53: RA-3]

### 3.3 Asset Management
  a) All information assets shall be inventoried, classified, and assigned owners.
  b) Asset classification shall follow the four-tier model: Public, Internal, Confidential, Restricted.
  c) Asset disposal shall follow approved sanitization procedures per NIST SP 800-88.

**Control References:** [NIST CSF: ID.AM-01] [ISO 27001: A.5.9, A.5.10] [NIST SP 800-53: CM-8]

### 3.4 Access Control
  a) Access shall follow least privilege and role-based access control (RBAC).
  b) Multi-factor authentication (MFA) enforced for all privileged and remote access.
  c) Quarterly access reviews for critical systems; semi-annual for all others.

**Control References:** [NIST CSF: PR.AA-01] [NIST CSF: PR.AA-03] [ISO 27001: A.8.2, A.8.3]

### 3.5 Incident Management
  a) A documented Incident Response Plan shall be maintained and tested annually.
  b) Security incidents reported internally within 1 hour of detection.
  c) Data breaches notified to regulatory authorities within statutory timelines.

**Control References:** [NIST CSF: RS.MA-01] [NIST CSF: DE.CM-01] [ISO 27001: A.5.24, A.5.25] [DPDP Act: Section 8(6)]

### 3.6 Third-Party Security
  a) All third parties with access to organizational data shall undergo security assessment.
  b) Contractual requirements shall include DPA, audit rights, and breach notification SLAs.
  c) Critical vendors reassessed annually; all vendors at minimum upon contract renewal.

**Control References:** [NIST CSF: GV.SC-01] [ISO 27001: A.5.19, A.5.21, A.5.22]

### 3.7 Business Continuity
  a) Business Impact Analysis (BIA) conducted annually.
  b) Disaster Recovery Plans tested semi-annually with documented results.
  c) Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO) defined per system criticality.

**Control References:** [NIST CSF: PR.IR-01] [ISO 27001: A.5.29, A.5.30]

## 4. Definitions

| Term | Definition |
|------|-----------|
| ISMS | Information Security Management System per ISO/IEC 27001 |
| Data Fiduciary | Entity determining purpose and means of processing personal data (DPDP Act) |
| Data Principal | Individual whose personal data is processed |
| RBAC | Role-Based Access Control |
| MFA | Multi-Factor Authentication |
| BIA | Business Impact Analysis |

## 5. Roles & Responsibilities

| Role | Responsibility |
|------|---------------|
| Board of Directors | Oversight of cybersecurity risk and approval of security strategy |
| CISO | Policy ownership, security program management, risk reporting |
| Data Protection Officer | DPDP Act / GDPR compliance, DPA management, breach notification |
| IT Operations | Implementation of technical controls, system hardening |
| All Employees | Compliance with this policy, completion of security awareness training |
| Third-Party Vendors | Contractual compliance with security requirements |

## 6. Enforcement

6.1 Violations may result in disciplinary action up to and including termination.

6.2 Intentional violations involving personal data may result in regulatory penalties under DPDP Act 2023 (up to ₹250 Crore) or GDPR (up to €20M / 4% annual turnover).

## 7. Review & Approval

- **Policy Owner:** Chief Information Security Officer (CISO)
- **Review Frequency:** Annual (or upon significant regulatory/organizational change)
- **Next Review:** ${new Date(Date.now() + 365 * 86400000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
- **Approval Authority:** GRC Steering Committee / Board of Directors

### Approval Signatures

| Name | Title | Signature | Date |
|------|-------|-----------|------|
| __________________ | CISO | ____________ | ________ |
| __________________ | DPO | ____________ | ________ |
| __________________ | CEO / Board Chair | ____________ | ________ |

---
*This policy has been generated aligned to ${fw} controls. Always review with qualified legal and compliance counsel before adoption.*`;
}

function templatePrivacy(config: DocumentConfig, ctx: IndustryContext): string {
  const fw = fwString(config);
  const ref = getRef({ ...config, documentType: "data-privacy-policy" });
  return `# Data Privacy and Protection Policy

## Document Reference: ${ref}
**Aligned Frameworks:** ${fw}
**Industry:** ${ctx.industryLabel} | **Classification:** ${config.classification.charAt(0).toUpperCase() + config.classification.slice(1)}
${ctx.extraRefs}

---

## 1. Purpose

1.1 This policy establishes the organization's commitment to the protection of personal data and privacy rights of Data Principals in accordance with the Digital Personal Data Protection Act 2023 (DPDP Act), GDPR, and ${fw}.

1.2 This policy defines the governance framework for lawful, fair, and transparent processing of personal data.

**Control References:** [DPDP Act: Section 4] [GDPR: Article 5] [NIST Privacy: CT.PO-P1] [ISO 27001: A.5.34]

## 2. Scope

2.1 This policy applies to:
  a) All personal data processed by the organization in capacity as Data Fiduciary or Data Processor
  b) All Data Principals whose personal data is collected, stored, processed, or transferred
  c) All employees, contractors, and third parties involved in personal data processing
  d) All digital and physical processing activities across all jurisdictions${ctx.scopeAdditions}

## 3. Lawful Basis for Processing

3.1 Personal data shall only be processed based on:
  a) **Consent** — Valid, informed, specific consent obtained from Data Principal [DPDP Act: Section 6]
  b) **Legitimate Uses** — Processing necessary for stated purposes [DPDP Act: Section 7]
  c) **Legal Obligation** — Processing required by applicable law
  d) **Vital Interest** — Processing necessary to protect life or health

**Control References:** [DPDP Act: Sections 6, 7] [GDPR: Article 6] [NIST Privacy: CT.PO-P1]

## 4. Data Minimisation & Purpose Limitation

4.1 Personal data collected shall be adequate, relevant, and limited to what is necessary.
4.2 Data shall not be processed for purposes incompatible with the original collection purpose.
4.3 Data retention shall not exceed the period necessary for the stated purpose.

**Control References:** [DPDP Act: Section 8(4)] [GDPR: Article 5(1)(b)(c)] [ISO 27001: A.5.33]

## 5. Data Principal Rights

5.1 The organization shall facilitate the following rights:
  a) **Right to Access** — Data Principals may request confirmation and access to their personal data [DPDP Act: Section 11]
  b) **Right to Correction** — Right to correct inaccurate or incomplete personal data [DPDP Act: Section 12]
  c) **Right to Erasure** — Right to request deletion when data is no longer necessary [DPDP Act: Section 12(3)]
  d) **Right to Grievance Redressal** — Data Principals may raise grievances with the Consent Manager or DPO [DPDP Act: Section 13]
  e) **Right to Portability** — Where applicable under GDPR [GDPR: Article 20]

**Control References:** [DPDP Act: Sections 11, 12, 13] [GDPR: Articles 12-23] [NIST Privacy: CM.AW-P1]

## 6. Cross-Border Data Transfer

6.1 Personal data shall not be transferred outside India to countries notified as restricted by the Central Government [DPDP Act: Section 16].
6.2 EU personal data transfers shall comply with GDPR Chapter V (adequacy, SCCs, or BCRs).

**Control References:** [DPDP Act: Section 16] [GDPR: Articles 44-49]

## 7. Consent Management

7.1 Consent notices shall be clear, in plain language, and specify the purpose of processing.
7.2 Consent withdrawal mechanisms shall be as accessible as consent provision.
7.3 Records of consent shall be maintained with timestamps and version history.

**Control References:** [DPDP Act: Sections 5, 6] [GDPR: Articles 7, 8]

## 8. Data Retention

8.1 Personal data shall be retained only for the period necessary to fulfil the stated purpose.
8.2 Retention schedules shall be documented and reviewed annually.
8.3 Upon expiry, data shall be securely erased per NIST SP 800-88 guidelines.

**Control References:** [DPDP Act: Section 8(7)] [GDPR: Article 5(1)(e)] [NIST SP 800-88]

## 9. Breach Notification

9.1 Personal data breaches shall be reported to the Data Protection Board within 72 hours [DPDP Act: Section 8(6)].
9.2 Affected Data Principals shall be notified without undue delay.
9.3 Breach records maintained for a minimum of 5 years.

**Control References:** [DPDP Act: Section 8(6)] [GDPR: Articles 33, 34] [NIST CSF: RS.CO-02]

## 10. Definitions

| Term | Definition |
|------|-----------|
| Data Fiduciary | Entity that determines purpose and means of processing personal data |
| Data Principal | Individual whose personal data is processed |
| Data Processor | Entity processing data on behalf of the Data Fiduciary |
| Consent Manager | Registered entity facilitating consent management [DPDP Act: Section 9] |
| DPO | Data Protection Officer |
| Personal Data | Any data about an identifiable individual [DPDP Act: Section 2(t)] |

## 11. Roles & Responsibilities

| Role | Responsibility |
|------|---------------|
| Data Protection Officer (DPO) | DPDP / GDPR compliance oversight, DPIA management, regulatory liaison |
| CISO | Technical controls for data protection, encryption, access management |
| Legal Counsel | Regulatory interpretation, DPA drafting, cross-border transfer assessment |
| Business Units | Data inventory, purpose definition, consent collection |
| HR | Employee data processing compliance, privacy training |
| All Employees | Compliance with data handling procedures, incident reporting |

## 12. Enforcement

12.1 Violations may result in disciplinary action up to termination.
12.2 Penalties under DPDP Act 2023: up to ₹250 Crore. Under GDPR: up to €20M or 4% global turnover.

## 13. Review & Approval

- **Policy Owner:** Data Protection Officer / CISO
- **Review Frequency:** Annual
- **Next Review:** ${new Date(Date.now() + 365 * 86400000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
- **Approval Authority:** GRC Steering Committee

---
*This policy has been generated aligned to ${fw} controls. Always review with qualified legal counsel before adoption.*`;
}

function templateIncidentResponseSOP(config: DocumentConfig, ctx: IndustryContext): string {
  const fw = fwString(config);
  const ref = getRef({ ...config, documentType: "sop-incident-response" });
  return `# Standard Operating Procedure — Incident Response

## SOP Reference: ${ref}
**Aligned Frameworks:** ${fw}
**Industry:** ${ctx.industryLabel} | **Classification:** ${config.classification.charAt(0).toUpperCase() + config.classification.slice(1)}
${ctx.extraRefs}

---

## 1. Purpose & Objective

This SOP establishes the mandatory operational workflow for identifying, containing, eradicating, and recovering from information security incidents. It aligns with NIST SP 800-61 Rev 2 incident handling methodology and ${fw}.

**Control References:** [NIST SP 800-61 Rev 2] [NIST CSF: RS.MA-01] [ISO 27001: A.5.24]

## 2. Scope

This SOP applies to:
  a) All personnel with incident response responsibilities
  b) The Security Operations Center (SOC) and Computer Security Incident Response Team (CSIRT)
  c) All information systems, networks, and data assets
  d) Third-party managed services and cloud environments${ctx.scopeAdditions}

## 3. Prerequisites & Tools

| Requirement | Details |
|-------------|---------|
| Training | Annual IR tabletop exercises and certification |
| Access Level | SOC team RBAC roles per access matrix |
| Tools | SIEM, EDR, Ticketing System, Forensic Toolkit, Communication Platform |
| Contact List | Updated quarterly — internal escalation + regulatory contacts |

## 4. Incident Response Phases

### Phase 1: Preparation
**Step 1.1** — Maintain and update incident response plan, playbooks, and contact lists quarterly.
**Step 1.2** — Ensure forensic toolkit readiness (disk imaging, memory capture, network packet capture).
**Step 1.3** — Conduct tabletop exercises minimum bi-annually; full simulation annually.
**Step 1.4** — Maintain escalation matrix with 24/7 contact details for all stakeholders.

**Control References:** [NIST SP 800-61: Section 3.1] [NIST CSF: RS.MA-01] [ISO 27001: A.5.24]

### Phase 2: Detection & Analysis
**Step 2.1** — Monitor security event feeds continuously (24×7 SOC coverage).
**Step 2.2** — Classify incident severity using the following matrix:

| Priority | Description | Response SLA | Escalation |
|----------|-------------|-------------|------------|
| P1 — Critical | Confirmed breach, ransomware, system-wide compromise | Immediate | CISO + Legal + Board within 15 min |
| P2 — High | Targeted attack, privilege escalation, data exposure risk | 30 minutes | SOC Lead + IT Director |
| P3 — Medium | Suspicious activity requiring investigation | 4 hours | SOC Lead |
| P4 — Low | Informational event for trend analysis | Next business day | Logged for review |

**Step 2.3** — Preserve initial evidence: screenshots, log snapshots, alert metadata.
**Step 2.4** — Document initial findings in incident ticket with timeline.

**Control References:** [NIST SP 800-61: Section 3.2] [NIST CSF: RS.AN-01] [ISO 27001: A.5.25]

### Phase 3: Containment
**Step 3.1** — Short-term containment: Network isolation, disable compromised accounts, block malicious IPs.
**Step 3.2** — Long-term containment: Apply emergency patches, rebuild from known-good baselines, implement additional monitoring.
**Step 3.3** — Preserve forensic evidence before any remediation (disk images, memory dumps, full packet captures).

**Control References:** [NIST SP 800-61: Section 3.3] [NIST CSF: RS.MI-01]

### Phase 4: Eradication
**Step 4.1** — Identify root cause through forensic analysis.
**Step 4.2** — Remove all artifacts of compromise: malware, backdoors, unauthorized accounts.
**Step 4.3** — Verify eradication through comprehensive scanning and log review.

**Control References:** [NIST SP 800-61: Section 3.4]

### Phase 5: Recovery
**Step 5.1** — Restore systems from validated clean backups.
**Step 5.2** — Implement enhanced monitoring for minimum 72 hours post-recovery.
**Step 5.3** — Notify stakeholders per communication matrix.
**Step 5.4** — Verify system integrity and business function restoration.

**Control References:** [NIST SP 800-61: Section 3.5] [NIST CSF: RC.RP-01]

### Phase 6: Post-Incident Review
**Step 6.1** — Conduct lessons-learned review within 5 business days of incident closure.
**Step 6.2** — Document Post-Incident Review (PIR) report with root cause, timeline, and improvement actions.
**Step 6.3** — Update playbooks, detection rules, and this SOP based on findings.
**Step 6.4** — Report metrics to GRC dashboard and risk register.

**Control References:** [NIST SP 800-61: Section 3.6] [NIST CSF: RS.IM-01] [ISO 27001: A.5.27]

## 5. Regulatory Notification Requirements

Per **DPDP Act Section 8(6)**: Breach notification to Data Protection Board within **72 hours**.
Per **CERT-In Directions 2022**: Incident reporting within **6 hours** of detection.

## 6. Review & Continuous Improvement

- **Review Frequency:** Quarterly (or after every P1/P2 incident)
- **SOP Owner:** Chief Information Security Officer (CISO)
- **Approval Authority:** GRC Steering Committee

---
*This SOP has been generated aligned to ${fw} controls. Review with qualified legal counsel before adoption.*`;
}

function templateBreachNotificationSOP(config: DocumentConfig, ctx: IndustryContext): string {
  const fw = fwString(config);
  const ref = getRef({ ...config, documentType: "sop-breach-notification" });
  return `# Standard Operating Procedure — Data Breach Notification

## SOP Reference: ${ref}
**Aligned Frameworks:** ${fw}
**Industry:** ${ctx.industryLabel} | **Classification:** ${config.classification.charAt(0).toUpperCase() + config.classification.slice(1)}
${ctx.extraRefs}

---

## 1. Purpose

This SOP establishes the mandatory workflow for identifying, assessing, and notifying relevant authorities and affected individuals following a personal data breach, in compliance with ${fw} and applicable regulatory requirements.

**Control References:** [DPDP Act: Section 8(6)] [GDPR: Article 33] [NIST CSF: RS.CO-02]

## 2. Scope

This SOP applies to all incidents involving unauthorized access, disclosure, loss, or destruction of personal data processed by the organization as Data Fiduciary or Data Processor.${ctx.scopeAdditions}

## 3. Trigger Criteria — What Constitutes a Reportable Breach

A reportable breach includes:
  a) Unauthorized access to personal data (external attack or insider threat)
  b) Accidental disclosure of personal data to unauthorized recipients
  c) Loss of unencrypted devices or media containing personal data
  d) Ransomware encryption of systems containing personal data
  e) Failure of technical controls leading to personal data exposure

## 4. Regulatory Notification Timeline

| Regulator | Timeline | Obligation | Reference |
|-----------|----------|------------|-----------|
| Data Protection Board (India) | Within 72 hours | Mandatory notification by Data Fiduciary | DPDP Act Section 8(6) |
| RBI (Banks/NBFCs/Payment Aggregators) | Within 6 hours of detection | Cybersecurity incident reporting | RBI Cybersecurity Framework 2016 / DPSS 2021 |
| SEBI (Regulated entities) | Within 6 hours | Cyber incident reporting | SEBI Circular 2023 |
| CERT-In | Within 6 hours | All organizations | CERT-In Directions 2022 |
| GDPR Supervisory Authority | Within 72 hours | If EU data subjects affected | GDPR Article 33 |
| Affected Data Principals | Without undue delay | If high risk to rights and freedoms | GDPR Article 34 / DPDP Act |

## 5. Notification Procedure

### Step 1: Initial Assessment (0–2 hours)
**5.1** — Confirm the breach and assess scope: number of records, data categories, affected individuals.
**5.2** — Activate Incident Response Team and assign Breach Lead.
**5.3** — Begin breach log with timestamps.

### Step 2: Impact Classification (2–6 hours)
**5.4** — Classify severity: Critical / High / Medium / Low.
**5.5** — Determine regulatory notification obligations based on data type, jurisdiction, and regulator.
**5.6** — Engage Legal Counsel and DPO.

### Step 3: Regulatory Notification (within statutory timelines)
**5.7** — Prepare notification using approved templates.
**5.8** — Submit to relevant regulators per timeline table above.
**5.9** — Document submission receipts and acknowledgments.

### Step 4: Affected Individual Notification
**5.10** — Draft communication in clear, plain language.
**5.11** — Include: nature of breach, data affected, remedial actions, contact details for grievance.
**5.12** — Deliver via appropriate channel (email, portal notification, registered post).

### Step 5: Post-Breach Actions
**5.13** — Conduct root cause analysis within 5 business days.
**5.14** — Update risk register and security controls.
**5.15** — Submit Post-Breach Report to GRC Steering Committee.

## 6. Internal Escalation Matrix

| Severity | First Responder | Escalation To | Timeline |
|----------|----------------|---------------|----------|
| Critical | SOC Lead | CISO + DPO + Legal + Board | Immediate |
| High | SOC Analyst | SOC Lead + IT Director + DPO | 30 minutes |
| Medium | SOC Analyst | SOC Lead + DPO | 4 hours |
| Low | SOC Analyst | Logged for DPO review | Next business day |

## 7. Communication Templates

7.1 **Regulatory Notification Template** — Pre-approved template including: organization details, breach description, data categories, estimated affected individuals, containment measures, and remediation plan.

7.2 **Data Principal Notification Template** — Plain language template including: nature of breach, data affected, recommended protective actions, and DPO contact details.

7.3 **Internal Stakeholder Briefing** — Executive summary format for Board and senior management.

## 8. Review & Approval

- **SOP Owner:** Data Protection Officer / CISO
- **Review Frequency:** Quarterly (or after every breach incident)
- **Approval Authority:** GRC Steering Committee

**Control References:** [DPDP Act: Section 8(6)] [RBI Cybersecurity Framework] [CERT-In Directions 2022] [GDPR: Articles 33, 34] [NIST CSF: RS.CO-02, RS.CO-03]

---
*This SOP has been generated aligned to ${fw} controls. Always review with qualified legal counsel before adoption.*`;
}

function templateVendorRisk(config: DocumentConfig, ctx: IndustryContext): string {
  const fw = fwString(config);
  const ref = getRef({ ...config, documentType: "vendor-risk-policy" });
  return `# Vendor and Third-Party Risk Management Policy

## Document Reference: ${ref}
**Aligned Frameworks:** ${fw}
**Industry:** ${ctx.industryLabel} | **Classification:** ${config.classification.charAt(0).toUpperCase() + config.classification.slice(1)}
${ctx.extraRefs}

---

## 1. Purpose

1.1 This policy establishes the governance framework for identifying, assessing, monitoring, and managing risks arising from third-party vendors, service providers, and business partners.

1.2 This policy ensures that third-party relationships do not compromise the organization's security posture, regulatory compliance, or data protection obligations under ${fw}.

**Control References:** [NIST CSF: GV.SC-01] [ISO 27001: A.5.19] [DPDP Act: Section 8(2)]

## 2. Scope

2.1 This policy applies to:
  a) All third-party vendors, service providers, suppliers, and business partners
  b) All contractual relationships involving access to organizational data, systems, or facilities
  c) Cloud service providers, managed security service providers, and SaaS platforms
  d) Sub-processors and fourth-party dependencies${ctx.scopeAdditions}

## 3. Vendor Classification

| Tier | Classification | Data Access | Regulatory Exposure | Assessment Frequency |
|------|---------------|-------------|--------------------|--------------------|
| Tier 1 — Critical | Strategic partners with direct access to sensitive data or critical systems | Confidential / Restricted | High regulatory exposure | Quarterly |
| Tier 2 — High | Vendors with access to internal data or significant systems | Internal / Confidential | Moderate regulatory exposure | Semi-annually |
| Tier 3 — Medium | Vendors with limited system access | Internal only | Low regulatory exposure | Annually |
| Tier 4 — Low | Vendors with no data or system access | None | Minimal | At onboarding + renewal |

**Control References:** [NIST CSF: GV.SC-04] [ISO 27001: A.5.21]

## 4. Due Diligence Requirements

### 4.1 Pre-Engagement Assessment
  a) Security questionnaire (SIG Lite or SIG Full based on tier)
  b) SOC 2 Type II report review (or ISO 27001 certificate)
  c) Financial stability assessment for Tier 1/2 vendors
  d) Regulatory compliance verification (DPDP Act, GDPR, industry-specific)

### 4.2 Technical Assessment (Tier 1 and 2)
  a) Penetration test results (within last 12 months)
  b) Vulnerability management program review
  c) Data encryption standards (at rest and in transit)
  d) Incident response capability assessment

**Control References:** [NIST CSF: GV.SC-06] [ISO 27001: A.5.22] [GDPR: Article 28]

## 5. Contractual Requirements

5.1 All vendor contracts shall include:
  a) **Data Processing Agreement (DPA)** with DPDP Act / GDPR clauses
  b) **Right to Audit** — organization's right to audit vendor security controls
  c) **Breach Notification SLA** — vendor must notify within 24 hours of becoming aware of a breach
  d) **Right to Terminate** — upon material security breach or non-compliance
  e) **Data Return/Destruction** — obligations upon contract termination
  f) **Sub-processor Approval** — prior written consent for sub-processor engagement

**Control References:** [DPDP Act: Section 8(2)] [GDPR: Article 28] [NIST CSF: GV.SC-05]

## 6. Ongoing Monitoring

6.1 Continuous monitoring shall include:
  a) Automated security rating platforms (e.g., BitSight, SecurityScorecard)
  b) Periodic reassessment per vendor tier schedule
  c) Incident and breach tracking for all active vendors
  d) Annual certification/compliance document refresh

**Control References:** [NIST CSF: GV.SC-09] [ISO 27001: A.5.22]

## 7. Vendor Offboarding

7.1 Upon contract termination:
  a) Revoke all system access within 24 hours
  b) Obtain certificate of data destruction/return
  c) Conduct final security review
  d) Update vendor register and risk records

**Control References:** [NIST CSF: GV.SC-10] [ISO 27001: A.5.19]

## 8. Roles & Responsibilities

| Role | Responsibility |
|------|---------------|
| CISO | Policy ownership, vendor risk oversight |
| Procurement | Vendor selection, contract management |
| Third-Party Risk Manager | Due diligence execution, ongoing monitoring |
| Legal | DPA review, contractual compliance |
| DPO | Data protection impact assessment for high-risk vendors |
| Business Owners | Vendor relationship management, risk acceptance |

## 9. Enforcement

9.1 Non-compliance with vendor assessment requirements may result in vendor engagement suspension.
9.2 Business owners accepting vendor risk outside appetite require CISO and Board-level approval.

## 10. Review & Approval

- **Policy Owner:** CISO / Third-Party Risk Manager
- **Review Frequency:** Annual
- **Next Review:** ${new Date(Date.now() + 365 * 86400000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
- **Approval Authority:** GRC Steering Committee

---
*This policy has been generated aligned to ${fw} controls. Always review with qualified legal counsel before adoption.*`;
}

function templateAccessControl(config: DocumentConfig, ctx: IndustryContext): string {
  const fw = fwString(config);
  const ref = getRef({ ...config, documentType: "access-control-policy" });
  return `# Access Control and Identity Management Policy

## Document Reference: ${ref}
**Aligned Frameworks:** ${fw}
**Industry:** ${ctx.industryLabel} | **Classification:** ${config.classification.charAt(0).toUpperCase() + config.classification.slice(1)}
${ctx.extraRefs}

---

## 1. Purpose

1.1 This policy establishes the principles, requirements, and controls for managing user access to organizational information systems, data, and resources.

1.2 This policy ensures access is granted, reviewed, and revoked following the principles of Least Privilege, Need-to-Know, Zero Trust, and Separation of Duties, aligned with ${fw}.

**Control References:** [NIST CSF: PR.AA-01] [NIST SP 800-53: AC-1] [ISO 27001: A.8.2]

## 2. Scope

2.1 This policy applies to:
  a) All employees, contractors, consultants, and temporary personnel
  b) All information systems, applications, databases, and network resources
  c) All access methods: on-premise, remote, VPN, cloud, and API access
  d) Privileged, administrative, and service accounts${ctx.scopeAdditions}

## 3. Principles

### 3.1 Least Privilege
Access rights limited to the minimum necessary for job function.

### 3.2 Need-to-Know
Information access restricted to individuals with legitimate business need.

### 3.3 Zero Trust
No implicit trust based on network location; verify every access request.

### 3.4 Separation of Duties
Critical functions divided among individuals to prevent fraud and error.

**Control References:** [NIST CSF: PR.AA-01 to PR.AA-06] [NIST SP 800-53: AC-3, AC-5, AC-6] [NIST SP 800-171: 3.1.1 to 3.1.5]

## 4. User Lifecycle Management (Joiner-Mover-Leaver)

### 4.1 Joiner (Onboarding)
  a) Access provisioned via approved request workflow with manager authorization
  b) RBAC role assigned based on job function and department
  c) Access activated only after identity verification and security training completion

### 4.2 Mover (Role Change)
  a) Access review triggered upon role change, department transfer, or promotion
  b) Previous role access revoked within 5 business days
  c) New access provisioned per updated role requirements

### 4.3 Leaver (Offboarding)
  a) All access revoked within 4 hours of termination notification
  b) Shared credentials rotated immediately
  c) Mobile devices wiped and hardware recovered
  d) Access logs preserved for 12 months minimum

**Control References:** [NIST SP 800-53: AC-2] [NIST SP 800-171: 3.1.1] [ISO 27001: A.8.2, A.8.18]

## 5. Privileged Access Management (PAM)

  a) Privileged accounts inventoried and approved by CISO
  b) Just-In-Time (JIT) access for administrative tasks
  c) Session recording for all privileged access to critical systems
  d) Privileged accounts excluded from email and web browsing
  e) Emergency access (break-glass) procedures documented and audited

**Control References:** [NIST SP 800-53: AC-6] [NIST CSF: PR.AA-05] [ISO 27001: A.8.2]

## 6. Multi-Factor Authentication (MFA)

MFA shall be enforced for:
  a) All privileged and administrative access
  b) Remote access (VPN, cloud console, remote desktop)
  c) Access to systems processing Confidential or Restricted data
  d) All cloud service administration portals
  e) Email access from untrusted devices or locations

**Control References:** [NIST SP 800-53: IA-2] [NIST CSF: PR.AA-03] [NIST SP 800-171: 3.5.3]

## 7. Remote Access Controls

  a) Remote access only via approved VPN or zero-trust network access (ZTNA) solution
  b) Device posture check required before connection (patch level, AV status, disk encryption)
  c) Split tunneling prohibited for connections to corporate resources
  d) Session timeout: 15 minutes idle for privileged; 30 minutes for standard

**Control References:** [NIST SP 800-53: AC-17] [NIST SP 800-171: 3.1.12]

## 8. Access Review Cadence

| Access Type | Review Frequency | Reviewer | Escalation |
|-------------|-----------------|----------|------------|
| Privileged accounts | Monthly | CISO / PAM Team | Immediate revocation if unvalidated |
| Critical systems | Quarterly | System Owners + CISO | 5 business days to remediate |
| Standard access | Semi-annually | Department Managers | 10 business days to remediate |
| Service accounts | Quarterly | IT Operations + CISO | Immediate review |

**Control References:** [NIST SP 800-53: AC-2(3)] [ISO 27001: A.8.2] [DPDP Act: Section 8]

## 9. Exceptions Process

9.1 Access exceptions require:
  a) Written business justification
  b) Risk assessment by Information Security team
  c) CISO approval (time-limited, maximum 90 days)
  d) Documented compensating controls
  e) Quarterly review and re-approval

## 10. Roles & Responsibilities

| Role | Responsibility |
|------|---------------|
| CISO | Policy ownership, privileged access oversight, exception approval |
| IT Operations | Access provisioning/deprovisioning, MFA administration |
| IAM Team | RBAC design, access review coordination, PAM management |
| Department Managers | Access request approval, periodic review certification |
| HR | Joiner/Mover/Leaver notifications, role change triggers |
| All Users | Credential protection, reporting unauthorized access |

## 11. Enforcement

11.1 Unauthorized access attempts will be investigated and may result in disciplinary action.
11.2 Sharing of credentials is strictly prohibited and constitutes a policy violation.

## 12. Review & Approval

- **Policy Owner:** CISO
- **Review Frequency:** Annual
- **Next Review:** ${new Date(Date.now() + 365 * 86400000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
- **Approval Authority:** GRC Steering Committee

---
*This policy has been generated aligned to ${fw} controls. Always review with qualified legal counsel before adoption.*`;
}

/* ──────────────────────────────────────────────
   Fallback generic templates (kept short)
   ────────────────────────────────────────────── */

function genericPolicy(config: DocumentConfig, ctx: IndustryContext): string {
  const fw = fwString(config);
  const docLabel = getDocTypeLabel(config.documentType);
  const ref = getRef(config);
  return `# ${docLabel}

## Document Reference: ${ref}
**Aligned Frameworks:** ${fw}
**Industry:** ${ctx.industryLabel} | **Classification:** ${config.classification.charAt(0).toUpperCase() + config.classification.slice(1)}
${ctx.extraRefs}

---

## 1. Purpose

1.1 This policy establishes the organization's governance framework for ${docLabel.toLowerCase()} aligned with ${fw} and applicable regulatory requirements for the ${ctx.industryLabel} sector.

1.2 This policy provides mandatory requirements for all personnel and systems within scope.

**Control References:** [NIST CSF: GV.PO-01] [ISO 27001: A.5.1] [DPDP Act: Section 4]

## 2. Scope

2.1 This policy applies to:
  a) All employees, contractors, consultants, and third-party service providers
  b) All information assets, systems, networks, and applications
  c) All processing of personal data in capacity as Data Fiduciary or Data Processor
  d) All geographic locations and jurisdictions where the organization operates${ctx.scopeAdditions}

## 3. Policy Statements

### 3.1 Governance & Oversight
  a) Senior management shall provide oversight and approve this policy annually.
  b) A designated policy owner shall ensure implementation and compliance monitoring.
  c) Policy effectiveness metrics shall be reported quarterly to the GRC Steering Committee.

**Control References:** [NIST CSF: GV.OC-01] [ISO 27001: 5.1]

### 3.2 Implementation Requirements
  a) All personnel shall receive training on this policy within 30 days of onboarding.
  b) Technical controls shall be implemented per the organization's security architecture.
  c) Compliance shall be verified through periodic internal audits.

**Control References:** [NIST CSF: PR.AT-01] [ISO 27001: A.6.3]

### 3.3 Monitoring & Compliance
  a) Continuous monitoring mechanisms shall track adherence to policy requirements.
  b) Non-compliance events shall be logged, investigated, and remediated.
  c) Metrics reported to GRC dashboard monthly.

**Control References:** [NIST CSF: DE.CM-01] [ISO 27001: A.8.16]

## 4. Definitions

| Term | Definition |
|------|-----------|
| Data Fiduciary | Entity determining purpose and means of processing personal data |
| ISMS | Information Security Management System per ISO/IEC 27001 |
| GRC | Governance, Risk Management, and Compliance |

## 5. Roles & Responsibilities

| Role | Responsibility |
|------|---------------|
| Policy Owner | Policy maintenance, updates, and compliance oversight |
| CISO | Security program management and risk reporting |
| All Employees | Compliance with policy requirements |

## 6. Enforcement

6.1 Violations may result in disciplinary action up to and including termination.

## 7. Review & Approval

- **Policy Owner:** CISO
- **Review Frequency:** Annual
- **Next Review:** ${new Date(Date.now() + 365 * 86400000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
- **Approval Authority:** GRC Steering Committee

---
*This policy has been generated aligned to ${fw} controls. Review with qualified legal counsel before adoption.*`;
}

function genericSOP(config: DocumentConfig, ctx: IndustryContext): string {
  const fw = fwString(config);
  const docLabel = getDocTypeLabel(config.documentType);
  const ref = getRef(config);
  return `# Standard Operating Procedure: ${docLabel}

## SOP Reference: ${ref}
**Aligned Frameworks:** ${fw}
**Industry:** ${ctx.industryLabel} | **Classification:** ${config.classification.charAt(0).toUpperCase() + config.classification.slice(1)}
${ctx.extraRefs}

---

## 1. Purpose & Objective

This SOP establishes the mandatory operational workflow for ${docLabel.toLowerCase()} activities. It ensures compliance with ${fw} and industry best practices for ${ctx.industryLabel} organizations.

**Control References:** [NIST CSF: RS.RP-01] [ISO 27001: A.5.24]

## 2. Scope

This SOP applies to:
  a) All personnel with responsibility for ${docLabel.toLowerCase()} operations
  b) Third-party service providers and managed service providers
  c) All information systems and data assets classified as Internal or above${ctx.scopeAdditions}

## 3. Prerequisites

| Requirement | Details |
|-------------|---------|
| Training | Annual SOP training certification required |
| Access Level | Role-based access per RBAC matrix |
| Tools | As defined in operational toolkit |
| Authorization | Department Head approval for escalation |

## 4. Procedure Steps

### Step 1: Initiation
**4.1** — Verify prerequisites and authorization.
**4.2** — Log activity in tracking system with timestamp.

### Step 2: Execution
**4.3** — Follow documented workflow per operational playbook.
**4.4** — Escalate exceptions per escalation matrix.

### Step 3: Verification
**4.5** — Validate outcomes against acceptance criteria.
**4.6** — Obtain sign-off from designated approver.

### Step 4: Documentation
**4.7** — Record all actions with timestamps.
**4.8** — Update relevant registers and dashboards.

## 5. Review

- **Review Frequency:** Quarterly
- **SOP Owner:** CISO
- **Approval Authority:** GRC Steering Committee

---
*This SOP has been generated aligned to ${fw} controls. Review with qualified legal counsel before adoption.*`;
}

/* ──────────────────────────────────────────────
   Main export
   ────────────────────────────────────────────── */

export function generateMockResponse(userMessage: string, config: DocumentConfig): string {
  const ctx = detectIndustryContext(userMessage, config);
  const template = detectTemplate(userMessage, config);

  switch (template) {
    case "isp": return templateISP(config, ctx);
    case "privacy": return templatePrivacy(config, ctx);
    case "incident-sop": return templateIncidentResponseSOP(config, ctx);
    case "breach-sop": return templateBreachNotificationSOP(config, ctx);
    case "vendor": return templateVendorRisk(config, ctx);
    case "access": return templateAccessControl(config, ctx);
    case "generic-sop": return genericSOP(config, ctx);
    case "generic-policy":
    default: return genericPolicy(config, ctx);
  }
}
