import { DocumentConfig, FRAMEWORKS, DOCUMENT_TYPES } from "./types";

function getFrameworkLabels(ids: string[]): string[] {
  return ids.map(
    (id) => FRAMEWORKS.find((f) => f.value === id)?.label ?? id
  );
}

function getDocTypeLabel(id: string): string {
  return DOCUMENT_TYPES.find((d) => d.value === id)?.label ?? "Policy Document";
}

export function generateMockResponse(
  userMessage: string,
  config: DocumentConfig
): string {
  const fwLabels = getFrameworkLabels(config.frameworks);
  const fwString = fwLabels.length > 0 ? fwLabels.join(", ") : "NIST CSF 2.0";
  const docLabel = getDocTypeLabel(config.documentType);
  const industry = config.industry || "Technology";
  const lower = userMessage.toLowerCase();

  const isSOP = lower.includes("sop") || config.documentType.startsWith("sop-");

  if (isSOP) {
    return `# Standard Operating Procedure: ${docLabel}

## SOP Reference: SOP-${Date.now().toString(36).toUpperCase().slice(-6)}
**Aligned Frameworks:** ${fwString}
**Industry:** ${industry} | **Classification:** ${config.classification.charAt(0).toUpperCase() + config.classification.slice(1)}

---

## 1. Purpose & Objective

This Standard Operating Procedure establishes the mandatory operational workflow for ${docLabel.toLowerCase()} activities within the organization. This SOP ensures compliance with ${fwString} requirements and industry best practices for ${industry} organizations.

**Control References:** [NIST CSF: RS.RP-01] [ISO 27001: A.5.24] [DPDP Act: Section 8(6)]

## 2. Scope & Applicability

This SOP applies to:
a) All personnel with responsibility for security operations and incident management
b) Third-party service providers and managed security service providers (MSSPs)
c) All information systems, networks, and data assets classified as Internal or above
d) Cloud-hosted environments, on-premise infrastructure, and hybrid deployments

## 3. Prerequisites & Access Requirements

| Requirement | Details |
|-------------|---------|
| Training | Annual SOP training certification required |
| Access Level | Role-based access per RBAC matrix |
| Tools | SIEM, Ticketing System, Communication Platform |
| Authorization | Department Head approval for escalation |

## 4. Step-by-Step Procedure

### Phase 1: Identification & Triage
**Step 1.1** — Monitor security event feeds and alerting mechanisms continuously (24×7 SOC coverage recommended).
**Step 1.2** — Classify event severity using the organization's incident classification matrix:
  - **P1 (Critical):** Confirmed data breach, ransomware, or system-wide compromise
  - **P2 (High):** Targeted attack, privilege escalation, or policy violation with data exposure risk
  - **P3 (Medium):** Suspicious activity requiring investigation
  - **P4 (Low):** Informational event for trend analysis

**Control Reference:** [NIST SP 800-53: IR-4] [ISO 27001: A.5.25]

### Phase 2: Containment & Mitigation
**Step 2.1** — Execute containment procedures per the incident classification:
  a) Network isolation of affected systems
  b) Credential rotation for compromised accounts
  c) Preservation of forensic evidence (disk images, memory dumps, log snapshots)

**Step 2.2** — Notify designated stakeholders per the communication matrix within SLA timelines.

**Control Reference:** [NIST CSF: RS.MI-01] [DPDP Act: Section 8(6)]

### Phase 3: Recovery & Restoration
**Step 3.1** — Validate system integrity prior to restoration using approved baseline configurations.
**Step 3.2** — Implement enhanced monitoring for 72 hours post-recovery.
**Step 3.3** — Document all actions taken with timestamps in the incident management system.

### Phase 4: Post-Incident Review
**Step 4.1** — Conduct lessons-learned review within 5 business days of incident closure.
**Step 4.2** — Update this SOP based on findings.
**Step 4.3** — Report metrics to GRC dashboard.

## 5. Escalation Matrix

| Severity | Initial Response | Escalation To | Timeline |
|----------|-----------------|---------------|----------|
| P1 - Critical | SOC Lead | CISO + Legal + Board | Immediate |
| P2 - High | SOC Analyst | SOC Lead + IT Director | 30 minutes |
| P3 - Medium | SOC Analyst | SOC Lead | 4 hours |
| P4 - Low | SOC Analyst | Logged for review | Next business day |

## 6. Regulatory Notification Requirements

Per **DPDP Act Section 8(6)** and **GDPR Article 33**: Data breach notification to the supervisory authority must be made within **72 hours** of becoming aware of a qualifying personal data breach.

## 7. Review & Continuous Improvement

- **Review Frequency:** Quarterly (or after every P1/P2 incident)
- **SOP Owner:** Chief Information Security Officer (CISO)
- **Next Review Date:** Auto-scheduled per organizational review calendar
- **Approval Authority:** GRC Steering Committee

---
*This SOP has been generated aligned to ${fwString} controls. Review with qualified legal counsel before adoption.*`;
  }

  return `# ${docLabel}

## Document Reference: POL-${Date.now().toString(36).toUpperCase().slice(-6)}
**Aligned Frameworks:** ${fwString}
**Industry:** ${industry} | **Classification:** ${config.classification.charAt(0).toUpperCase() + config.classification.slice(1)}

---

## 1. Purpose

1.1 This policy establishes the organization's commitment to maintaining a comprehensive information security and data governance program aligned with ${fwString} and applicable regulatory requirements for the ${industry} sector.

1.2 This policy provides the governance framework for protecting the confidentiality, integrity, and availability of organizational information assets, including personal data processed under the DPDP Act 2023 and GDPR.

**Control References:** [NIST CSF: GV.PO-01] [ISO 27001: A.5.1] [DPDP Act: Section 4]

## 2. Scope

2.1 This policy applies to:
  a) All employees, contractors, consultants, and third-party service providers
  b) All information assets, systems, networks, and applications owned, operated, or managed by the organization
  c) All processing of personal data in capacity as Data Fiduciary or Data Processor
  d) All geographic locations and jurisdictions where the organization operates

2.2 **Exclusions:** This policy does not cover physical security controls, which are addressed separately under the Physical Security Policy (POL-PHY).

## 3. Policy Statements

### 3.1 Information Security Governance
  a) The organization shall establish and maintain an Information Security Management System (ISMS) aligned to ISO/IEC 27001:2022 requirements.
  b) A GRC Steering Committee shall convene quarterly to review security posture, risk register, and compliance status.
  c) Security objectives shall be defined annually and aligned to business strategy and regulatory obligations.

**Control Reference:** [NIST CSF: GV.OC-01] [ISO 27001: 5.1, 5.2]

### 3.2 Risk Management
  a) The organization shall conduct formal risk assessments at least annually, and upon significant changes to the operating environment.
  b) Risk treatment plans shall be documented with assigned owners, timelines, and acceptance criteria approved by the CISO.
  c) Residual risk exceeding the defined appetite shall require Board-level acceptance.

**Control Reference:** [NIST CSF: GV.RM-01, GV.RM-02] [ISO 27001: 6.1.2] [NIST SP 800-53: RA-3]

### 3.3 Access Control & Identity Management
  a) Access to information systems shall follow the principle of least privilege and role-based access control (RBAC).
  b) Multi-factor authentication (MFA) shall be enforced for all privileged accounts, remote access, and cloud service administration.
  c) Access reviews shall be conducted quarterly for critical systems and semi-annually for all other systems.

**Control Reference:** [NIST CSF: PR.AA-01, PR.AA-03] [ISO 27001: A.8.2, A.8.3] [NIST SP 800-171: 3.1.1]

### 3.4 Data Protection & Privacy
  a) Personal data shall be processed lawfully, fairly, and transparently in accordance with the DPDP Act 2023 and GDPR.
  b) Data classification shall follow the organization's four-tier model: Public, Internal, Confidential, Restricted.
  c) Data retention periods shall be defined per regulatory requirements and documented in the Data Retention Schedule.
  d) Data Principal rights (access, correction, erasure, portability) shall be fulfilled within statutory timelines.

**Control Reference:** [DPDP Act: Sections 4, 5, 6, 8] [GDPR: Articles 5, 6, 12-23] [NIST Privacy: CT.PO-P1]

### 3.5 Incident Response & Breach Notification
  a) The organization shall maintain a documented Incident Response Plan tested at least annually.
  b) Security incidents shall be reported internally within 1 hour of detection.
  c) Data breaches involving personal data shall be notified to the Data Protection Board / supervisory authority within 72 hours per statutory requirements.

**Control Reference:** [NIST CSF: RS.MA-01] [ISO 27001: A.5.24] [DPDP Act: Section 8(6)] [GDPR: Article 33]

## 4. Definitions

| Term | Definition |
|------|-----------|
| Data Fiduciary | Entity that determines the purpose and means of processing personal data (DPDP Act) |
| Data Principal | Individual whose personal data is being processed |
| ISMS | Information Security Management System per ISO/IEC 27001 |
| RBAC | Role-Based Access Control |
| MFA | Multi-Factor Authentication |

## 5. Roles & Responsibilities

| Role | Responsibility |
|------|---------------|
| Board of Directors | Oversight of cybersecurity risk, approval of security strategy |
| CISO | Policy ownership, security program management, risk reporting |
| Data Protection Officer | DPDP Act / GDPR compliance, DPA management, breach notification |
| IT Operations | Implementation of technical controls, system hardening |
| All Employees | Compliance with this policy, completion of security awareness training |
| Third-Party Vendors | Contractual compliance with security requirements |

## 6. Enforcement

6.1 Violations of this policy may result in disciplinary action up to and including termination of employment or contract.

6.2 Intentional or negligent violations involving personal data may result in regulatory penalties under the DPDP Act 2023 (up to ₹250 Crore) or GDPR (up to €20M / 4% annual turnover).

## 7. Review & Approval

- **Policy Owner:** Chief Information Security Officer (CISO)
- **Review Frequency:** Annual (or upon significant regulatory/organizational change)
- **Last Reviewed:** ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
- **Next Review:** ${new Date(Date.now() + 365 * 86400000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
- **Approval Authority:** GRC Steering Committee / Board of Directors

### Approval Signatures

| Name | Title | Signature | Date |
|------|-------|-----------|------|
| __________________ | CISO | ____________ | ________ |
| __________________ | DPO | ____________ | ________ |
| __________________ | CEO / Board Chair | ____________ | ________ |

---
*This policy document has been generated aligned to ${fwString} controls. Always review with qualified legal and compliance counsel before adoption.*`;
}
