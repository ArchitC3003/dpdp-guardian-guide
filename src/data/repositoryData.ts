export interface RepositoryItem {
  id: string;
  requirement: string;
  dpdpRef: string;
  templateTitle: string;
  templateContent: string;
  domain?: string;
  status: "not-started" | "in-progress" | "completed";
  notes: string;
}

export interface RepositoryPhase {
  id: string;
  phase: number;
  title: string;
  icon: string;
  items: RepositoryItem[];
}

// ═══════════════════════════════════════════════════════════════════
// ENTERPRISE-GRADE DPDP ACT 2023 COMPLIANCE TEMPLATE REPOSITORY
// Fortune 100 / Regulator-Grade Document Standards
// ═══════════════════════════════════════════════════════════════════

export const repositoryPhases: RepositoryPhase[] = [
  {
    id: "phase-1",
    phase: 1,
    title: "Org Profile",
    icon: "🏢",
    items: [
      {
        id: "p1-1",
        requirement: "Statement on Applicability (Role as Data Fiduciary, Significant Data Fiduciary, Joint/Independent Data Fiduciary, Data Processor)",
        dpdpRef: "Rule 3(1)",
        templateTitle: "Statement on Applicability Template",
        templateContent: `════════════════════════════════════════════════════════════════════
STATEMENT ON APPLICABILITY
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL
Document Reference: GOV-001
Version: v1.0
Owner: Data Protection Officer
Review Date: [Date]
Approval Status: PENDING APPROVAL

────────────────────────────────────────────────────────────────────
1. EXECUTIVE SUMMARY / PURPOSE
────────────────────────────────────────────────────────────────────

This Statement on Applicability ("SoA") establishes the classification of [Organisation Name] under the Digital Personal Data Protection Act, 2023 ("DPDP Act") and the Digital Personal Data Protection Rules, 2025 ("DPDP Rules"). Pursuant to Rule 3(1) of the DPDP Rules, every entity engaged in the processing of digital personal data must determine and document its role classification.

Legal Obligation: Rule 3(1) mandates that every person processing digital personal data shall determine whether it is acting as a Data Fiduciary, Significant Data Fiduciary, Joint Data Fiduciary, Independent Data Fiduciary, or Data Processor, and maintain a documented record of such determination.

Penalty Exposure: Failure to comply with obligations applicable to the determined role may attract penalties under Section 33 of the DPDP Act, up to ₹250 Crore per instance.

────────────────────────────────────────────────────────────────────
2. SCOPE AND APPLICABILITY
────────────────────────────────────────────────────────────────────

This SoA applies to:
• All legal entities within the [Organisation Name] group
• All processing activities involving digital personal data
• All systems, databases, applications, and manual records containing personal data
• All geographies from which personal data of Indian Data Principals is processed

────────────────────────────────────────────────────────────────────
3. DEFINITIONS
────────────────────────────────────────────────────────────────────

"Data Fiduciary" — As defined in Section 2(i) of the DPDP Act: any person who alone or in conjunction with other persons determines the purpose and means of processing of personal data.

"Significant Data Fiduciary" — As defined in Section 10(1) of the DPDP Act: a Data Fiduciary or class of Data Fiduciaries notified by the Central Government based on assessment of relevant factors.

"Data Processor" — As defined in Section 2(h) of the DPDP Act: any person who processes personal data on behalf of a Data Fiduciary.

"Joint Data Fiduciary" — Two or more Data Fiduciaries who jointly determine the purposes and means of processing personal data under Section 10 of the DPDP Act.

"Data Principal" — As defined in Section 2(j) of the DPDP Act: the individual to whom the personal data relates.

────────────────────────────────────────────────────────────────────
4. ORGANISATION ROLE CLASSIFICATION
────────────────────────────────────────────────────────────────────

4.1 Primary Role Determination:
   ☐ Data Fiduciary (Section 2(i))
   ☐ Significant Data Fiduciary (Section 10(1))
   ☐ Joint Data Fiduciary (Section 10)
   ☐ Independent Data Fiduciary
   ☐ Data Processor (Section 2(h))

4.2 Basis for Classification:
[Provide detailed rationale for the selected role based on DPDP Act definitions, including the nature, volume, and sensitivity of personal data processed, the relationship with Data Principals, and whether the organisation independently determines the purpose and means of processing.]

4.3 Dual Role Assessment:
[If the organisation acts as both Data Fiduciary and Data Processor for different processing activities, document each role with the corresponding processing activities.]

────────────────────────────────────────────────────────────────────
5. SIGNIFICANT DATA FIDUCIARY CRITERIA ASSESSMENT
────────────────────────────────────────────────────────────────────

Pursuant to Section 10(1), the Central Government may notify a Data Fiduciary as a Significant Data Fiduciary based on the following factors. Self-assessment against each criterion:

| Criterion (Sec 10(1)) | Assessment | Evidence | Score (1-5) |
|------------------------|------------|----------|-------------|
| (a) Volume and sensitivity of personal data processed | [Assessment] | [Evidence] | [Score] |
| (b) Risk of harm to Data Principal | [Assessment] | [Evidence] | [Score] |
| (c) Potential impact on sovereignty and integrity of India | [Assessment] | [Evidence] | [Score] |
| (d) Risk to electoral democracy | [Assessment] | [Evidence] | [Score] |
| (e) Security of the State | [Assessment] | [Evidence] | [Score] |
| (f) Public order | [Assessment] | [Evidence] | [Score] |

Overall Risk Score: [Total] / 30
Threshold for SDF Self-Declaration: Score ≥ 15

────────────────────────────────────────────────────────────────────
6. VOLUME OF PERSONAL DATA PROCESSED
────────────────────────────────────────────────────────────────────

| Data Category | Approximate Volume | Data Principals Affected | Processing Frequency |
|---------------|-------------------|------------------------|---------------------|
| Customer Personal Data | [Volume] | [Number] | [Daily/Monthly] |
| Employee Personal Data | [Volume] | [Number] | [Daily/Monthly] |
| Vendor/Partner Data | [Volume] | [Number] | [Periodic] |
| Children's Data (if any) | [Volume] | [Number] | [Frequency] |

Total Data Principals Served: [Number]
Total Records Under Management: [Number]

────────────────────────────────────────────────────────────────────
7. CROSS-BORDER DATA TRANSFER APPLICABILITY
────────────────────────────────────────────────────────────────────

Cross-border transfer of personal data: ☐ Yes  ☐ No

If Yes:
| Destination Country | Data Categories | Legal Mechanism | Restricted (Sec 16(1))? |
|--------------------|-----------------|-----------------|-----------------------|
| [Country] | [Categories] | [SCC/Adequacy/Other] | [Yes/No] |

────────────────────────────────────────────────────────────────────
8. DATA PROCESSOR ENGAGEMENT
────────────────────────────────────────────────────────────────────

| # | Processor Name | Services | Data Categories | DPA Executed | Country |
|---|---------------|----------|-----------------|-------------|---------|
| 1 | [Processor] | [Services] | [Categories] | [Y/N] | [Country] |

────────────────────────────────────────────────────────────────────
9. COMPLIANCE MATRIX
────────────────────────────────────────────────────────────────────

| Clause | DPDP Act Obligation | Compliance Status | Evidence Reference |
|--------|--------------------|-----------------|--------------------|
| 4.1 | Rule 3(1) — Role determination | [Compliant/Gap] | This document |
| 5.0 | Sec 10(1) — SDF criteria | [Compliant/Gap] | Section 5 above |
| 6.0 | Sec 8(8) — Record keeping | [Compliant/Gap] | [Reference] |
| 7.0 | Sec 16 — Cross-border transfers | [Compliant/Gap] | [Reference] |

────────────────────────────────────────────────────────────────────
10. IMPLEMENTATION GUIDANCE
────────────────────────────────────────────────────────────────────

• This SoA must be reviewed annually or upon any material change in processing activities.
• Any change in role classification must be reported to the Board within 7 business days.
• If the organisation is notified as a Significant Data Fiduciary, additional obligations under Section 10(2) must be implemented within 6 months.
• Cross-references: Organisation Chart (GOV-002), Data Flow Diagram (GOV-003), Board Resolution (GOV-005).

────────────────────────────────────────────────────────────────────
DOCUMENT CONTROL
────────────────────────────────────────────────────────────────────

| Role | Name | Designation | Date | Signature |
|------|------|-------------|------|-----------|
| Prepared By | [Name] | [Designation] | [Date] | _________ |
| Reviewed By | [DPO Name] | Data Protection Officer | [Date] | _________ |
| Approved By | [Name] | [CEO/Board Member] | [Date] | _________ |

────────────────────────────────────────────────────────────────────
AMENDMENT HISTORY
────────────────────────────────────────────────────────────────────

| Version | Date | Change Summary | Authorised By |
|---------|------|---------------|---------------|
| v1.0 | [Date] | Initial document creation | [Name] |

NOTE: This document contains confidential information. Unauthorised disclosure may result in disciplinary action and legal liability.`,
        status: "not-started",
        notes: ""
      },
      {
        id: "p1-2",
        requirement: "Prepare Organisation Chart with data roles annotated",
        dpdpRef: "Rule 3(2)",
        templateTitle: "Organisation Chart Template",
        templateContent: `════════════════════════════════════════════════════════════════════
ORGANISATION CHART — DATA GOVERNANCE ROLES
════════════════════════════════════════════════════════════════════

Classification: INTERNAL
Document Reference: GOV-002
Version: v1.0
Owner: Data Protection Officer
Review Date: [Date]
Approval Status: PENDING APPROVAL

────────────────────────────────────────────────────────────────────
1. EXECUTIVE SUMMARY / PURPOSE
────────────────────────────────────────────────────────────────────

This document establishes the organisational structure for data governance at [Organisation Name], annotating all roles with data protection responsibilities pursuant to Rule 3(2) of the DPDP Rules, 2025 and Section 8(6) of the DPDP Act, 2023.

Legal Obligation: Rule 3(2) requires the Data Fiduciary to maintain a documented organisation structure identifying individuals responsible for data protection functions.

────────────────────────────────────────────────────────────────────
2. SCOPE AND APPLICABILITY
────────────────────────────────────────────────────────────────────

This chart covers all personnel with data governance responsibilities across:
• All business units and departments of [Organisation Name]
• All subsidiaries and group entities within India
• All contracted data protection roles

────────────────────────────────────────────────────────────────────
3. GOVERNANCE HIERARCHY
────────────────────────────────────────────────────────────────────

Board of Directors / Governing Body
  ├── Audit & Risk Committee [Data Protection Oversight]
  │     └── Reports: Quarterly Privacy Risk Assessment
  └── Chief Executive Officer / Managing Director
        ├── Data Protection Officer (DPO): [DPO Name]
        │     ├── Lead Privacy Analyst
        │     │     ├── Privacy Analyst(s) [2-3 FTE]
        │     │     └── Consent Management Administrator
        │     ├── Compliance Coordinator
        │     │     ├── DSR Request Handler
        │     │     └── Breach Response Coordinator
        │     └── DPO Office Administrator
        ├── Chief Information Officer / CTO
        │     ├── IT Security Team Lead [CISO if applicable]
        │     │     ├── Security Operations Centre (SOC)
        │     │     ├── Vulnerability Management
        │     │     └── Identity & Access Management
        │     ├── Data Engineering Team Lead
        │     │     ├── Database Administrators
        │     │     └── Data Retention Operations
        │     └── Application Development Lead
        │           └── Privacy by Design Champion
        ├── Chief Human Resources Officer
        │     ├── Employee Data Controller
        │     ├── Training & Awareness Coordinator
        │     └── Recruitment Data Handler
        ├── Chief Marketing / Commercial Officer
        │     ├── Customer Data Controller
        │     ├── Consent & Preference Manager
        │     └── Third-Party Marketing Compliance
        ├── Chief Financial Officer
        │     └── Financial Data Steward
        ├── Head of Operations
        │     ├── Physical Security (CCTV) Manager
        │     └── Vendor/Procurement Manager
        └── Legal Counsel / General Counsel
              ├── Regulatory Affairs Lead
              ├── Contract & DPA Manager
              └── Litigation & Dispute Resolution

────────────────────────────────────────────────────────────────────
4. ROLE DEFINITIONS & RESPONSIBILITIES
────────────────────────────────────────────────────────────────────

| Role | Name | Department | Data Responsibilities | DPDP Act Reference |
|------|------|-----------|----------------------|-------------------|
| Data Protection Officer | [DPO Name] | DPO Office | Overall compliance, DPBI liaison, DSR oversight | Sec 8(6), Rule 13 |
| Data Steward — HR | [Name] | HR | Employee data governance | Sec 8(4) |
| Data Steward — Marketing | [Name] | Marketing | Customer consent management | Sec 6 |
| Data Steward — IT | [Name] | IT | Technical security measures | Sec 8(4) |
| Data Steward — Legal | [Name] | Legal | DPA management, regulatory filings | Sec 8(2) |
| Data Steward — Operations | [Name] | Operations | Physical security data, vendor data | Sec 8(2) |
| Data Steward — Finance | [Name] | Finance | Financial personal data | Sec 8(4) |

────────────────────────────────────────────────────────────────────
5. REPORTING LINES & ESCALATION
────────────────────────────────────────────────────────────────────

• DPO reports directly to the Board/Audit Committee on data protection matters (Sec 8(6))
• Each Department Data Steward reports to their functional head AND has a dotted line to the DPO
• Breach incidents: Immediate escalation to DPO → Board within 4 hours
• DSR requests: Department Steward → DPO Office within 24 hours

────────────────────────────────────────────────────────────────────
6. IMPLEMENTATION GUIDANCE
────────────────────────────────────────────────────────────────────

• This chart must be updated within 14 days of any personnel change in annotated roles.
• All personnel in data governance roles must complete role-specific training within 30 days of appointment.
• Annual review of role allocations mandatory.
• Cross-references: Statement on Applicability (GOV-001), Board Resolution (GOV-005), RACI Matrix (DPT-003).

────────────────────────────────────────────────────────────────────
DOCUMENT CONTROL
────────────────────────────────────────────────────────────────────

| Role | Name | Designation | Date | Signature |
|------|------|-------------|------|-----------|
| Prepared By | [Name] | [Designation] | [Date] | _________ |
| Reviewed By | [DPO Name] | Data Protection Officer | [Date] | _________ |
| Approved By | [Name] | [CEO/Board Chair] | [Date] | _________ |

────────────────────────────────────────────────────────────────────
AMENDMENT HISTORY
────────────────────────────────────────────────────────────────────

| Version | Date | Change Summary | Authorised By |
|---------|------|---------------|---------------|
| v1.0 | [Date] | Initial document creation | [Name] |`,
        status: "not-started",
        notes: ""
      },
      {
        id: "p1-3",
        requirement: "Create entity-level Data Flow Diagram",
        dpdpRef: "Rule 3(3)",
        templateTitle: "Data Flow Diagram Template",
        templateContent: `════════════════════════════════════════════════════════════════════
DATA FLOW DIAGRAM — ENTITY LEVEL
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL
Document Reference: GOV-003
Version: v1.0
Owner: Data Protection Officer
Review Date: [Date]
Approval Status: PENDING APPROVAL

────────────────────────────────────────────────────────────────────
1. EXECUTIVE SUMMARY / PURPOSE
────────────────────────────────────────────────────────────────────

This document maps all personal data flows within and external to [Organisation Name] pursuant to Rule 3(3) of the DPDP Rules, 2025. Understanding data flows is essential for compliance with purpose limitation (Sec 5), data minimisation (Sec 8(7)), security safeguards (Sec 8(4)), and cross-border transfer restrictions (Sec 16).

────────────────────────────────────────────────────────────────────
2. SCOPE AND APPLICABILITY
────────────────────────────────────────────────────────────────────

• All digital personal data collected, stored, processed, or transmitted by [Organisation Name]
• All internal and external data flows including cloud services, third-party processors, and cross-border transfers
• All channels: website, mobile applications, physical premises, APIs, partner integrations

────────────────────────────────────────────────────────────────────
3. DEFINITIONS
────────────────────────────────────────────────────────────────────

"Personal Data" — As defined in Sec 2(t) of the DPDP Act: any data about an individual who is identifiable by or in relation to such data.
"Processing" — As defined in Sec 2(x): any operation performed on digital personal data.
"Cross-border Transfer" — Transfer of personal data outside the territory of India (Sec 16).

────────────────────────────────────────────────────────────────────
4. DATA SOURCES (COLLECTION POINTS)
────────────────────────────────────────────────────────────────────

| # | Source | Channel | Data Categories Collected | Legal Basis | Privacy Notice | Consent Required |
|---|--------|---------|--------------------------|-------------|----------------|-----------------|
| 1 | Website / Web App | Digital Forms, Cookies | Name, Email, Phone, IP Address, Device Info, Usage Data | Sec 6 (Consent) | POL-001 | Yes |
| 2 | Mobile Application | App Registration, In-app | Name, Email, Location, Device ID, App Usage | Sec 6 (Consent) | POL-001 | Yes |
| 3 | Employee HR Systems | HRMS, Payroll | Full Name, DOB, Address, Bank Details, Gov't IDs, Tax IDs | Sec 7(a) (Employment) | POL-002 | No |
| 4 | Job Applications | Careers Portal, Email | CV Data, Education, Work History, References | Sec 7(a) | POL-002 | No |
| 5 | Third-Party Partners | API, Secure File Transfer | Shared datasets per agreement | Sec 6/7 | Per DPA | Per agreement |
| 6 | Physical Premises | CCTV, Access Control | Video Footage, Access Logs, Biometric (if applicable) | Sec 7(b) (Legitimate Use) | POL-003 | No |
| 7 | Customer Support | Call Centre, Chat, Email | Name, Contact Info, Support Tickets, Call Recordings | Sec 6 | POL-001 | Yes |

────────────────────────────────────────────────────────────────────
5. INTERNAL PROCESSING ACTIVITIES
────────────────────────────────────────────────────────────────────

| # | Processing Activity | Systems Involved | Data Categories | Purpose | Retention Period |
|---|--------------------|--------------------|-----------------|---------|-----------------|
| 1 | Customer Onboarding | CRM, KYC System | Identity, Contact, KYC | Service delivery | Duration + 5 years |
| 2 | Payroll Processing | HRMS, Payroll System | Employee PII, Bank Details | Employment | Employment + 7 years |
| 3 | Marketing Analytics | Analytics Platform, CRM | Usage Data, Preferences | Business insight | 2 years |
| 4 | Security Monitoring | SIEM, SOC Tools | Access Logs, Network Logs | Security | 1 year |
| 5 | Automated Decisioning | AI/ML Platform | As applicable | Per DPIA | Per DPIA |

────────────────────────────────────────────────────────────────────
6. DATA DESTINATIONS (SHARING & TRANSFERS)
────────────────────────────────────────────────────────────────────

6.1 Internal Destinations:
| Database/System | Location (On-prem/Cloud) | Data Categories | Access Controls | Encryption |
|----------------|--------------------------|-----------------|----------------|-----------|
| [System Name] | [Location] | [Categories] | [RBAC/MFA] | [AES-256/TLS] |

6.2 External Destinations — Third-Party Processors:
| # | Processor | Country | Data Categories | Purpose | DPA Reference | Security Cert |
|---|----------|---------|-----------------|---------|--------------|--------------|
| 1 | [Processor] | [Country] | [Categories] | [Purpose] | DPA-[Number] | [ISO/SOC] |

6.3 Cross-Border Transfers:
| # | Destination Country | Recipient Entity | Data Categories | Legal Mechanism | Restricted (Sec 16(1))? |
|---|--------------------|-----------------|-----------------|-----------------|-----------------------|
| 1 | [Country] | [Entity] | [Categories] | [SCC/Adequacy] | [Yes/No] |

────────────────────────────────────────────────────────────────────
7. DATA LIFECYCLE SUMMARY
────────────────────────────────────────────────────────────────────

Collection → Validation → Storage → Processing → Sharing → Archival → Deletion

Each stage must specify:
• Purpose (Sec 5(1)(a))
• Legal Basis (Sec 4, 6, or 7)
• Retention Period (Sec 8(7))
• Security Measures (Sec 8(4))
• Cross-border applicability (Sec 16)

────────────────────────────────────────────────────────────────────
8. COMPLIANCE MATRIX
────────────────────────────────────────────────────────────────────

| Clause | DPDP Act Obligation | Compliance Status | Evidence |
|--------|--------------------|-----------------|---------| 
| 4.0 | Rule 3(3) — Data flow documentation | [Status] | This document |
| 5.0 | Sec 5 — Purpose limitation per flow | [Status] | Privacy notices |
| 6.0 | Sec 8(4) — Security at each stage | [Status] | Security policy |
| 7.0 | Sec 16 — Cross-border safeguards | [Status] | Transfer assessments |

────────────────────────────────────────────────────────────────────
9. IMPLEMENTATION GUIDANCE
────────────────────────────────────────────────────────────────────

• Review and update this diagram quarterly and upon any new processing activity, system change, or vendor onboarding.
• Each new data flow must be assessed for DPIA requirement before implementation.
• Privacy by Design (ISO 31700) must be applied to all new data flows.
• Cross-references: Statement on Applicability (GOV-001), RoPA (POL-013), DPIA Framework (POL-014).

────────────────────────────────────────────────────────────────────
DOCUMENT CONTROL
────────────────────────────────────────────────────────────────────

| Role | Name | Designation | Date | Signature |
|------|------|-------------|------|-----------|
| Prepared By | [Name] | [Designation] | [Date] | _________ |
| Reviewed By | [DPO Name] | Data Protection Officer | [Date] | _________ |
| Approved By | [Name] | [CIO/CTO] | [Date] | _________ |

────────────────────────────────────────────────────────────────────
AMENDMENT HISTORY
────────────────────────────────────────────────────────────────────

| Version | Date | Change Summary | Authorised By |
|---------|------|---------------|---------------|
| v1.0 | [Date] | Initial document creation | [Name] |`,
        status: "not-started",
        notes: ""
      },
      {
        id: "p1-4",
        requirement: "Appoint DPO / Privacy Officer and issue formal appointment letter",
        dpdpRef: "Sec 8(6), Rule 13",
        templateTitle: "DPO Appointment Letter",
        templateContent: `════════════════════════════════════════════════════════════════════
DATA PROTECTION OFFICER — FORMAL APPOINTMENT LETTER
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL
Document Reference: GOV-004
Version: v1.0
Owner: Board of Directors
Review Date: [Date]
Approval Status: APPROVED

────────────────────────────────────────────────────────────────────

Date: [Date]
Reference: GOV-004/DPO/[Year]

To:
[DPO Name]
[Designation]
[Address]

Dear [DPO Name],

Subject: Formal Appointment as Data Protection Officer pursuant to Section 8(6) of the Digital Personal Data Protection Act, 2023 and Rule 13 of the DPDP Rules, 2025

────────────────────────────────────────────────────────────────────
1. APPOINTMENT
────────────────────────────────────────────────────────────────────

The Board of Directors of [Organisation Name] (CIN: [Company Identification Number]), registered at [Registered Address], hereby appoints you as the Data Protection Officer ("DPO") with effect from [Effective Date].

This appointment is made in compliance with the mandatory requirement under Section 8(6) of the DPDP Act, 2023, which requires every Significant Data Fiduciary (and as a matter of best practice, every Data Fiduciary) to appoint a Data Protection Officer.

────────────────────────────────────────────────────────────────────
2. STATUTORY RESPONSIBILITIES (PER SEC 8(6) & RULE 13)
────────────────────────────────────────────────────────────────────

2.1 You shall serve as the point of contact for:
   (a) Data Principals exercising their rights under Sections 11-14 of the DPDP Act;
   (b) The Data Protection Board of India ("DPBI") for any regulatory communications, inquiries, or investigations;
   (c) Internal departments on all matters pertaining to data protection compliance.

2.2 Your specific responsibilities shall include:
   (a) Ensuring compliance with the DPDP Act, 2023 across all processing activities of [Organisation Name];
   (b) Overseeing the implementation and maintenance of the Data Governance Framework;
   (c) Conducting or commissioning periodic privacy audits and assessments;
   (d) Reporting to the Board of Directors on data protection compliance status on a quarterly basis;
   (e) Overseeing the implementation of Privacy by Design principles (ISO 31700);
   (f) Managing the Data Protection Impact Assessment (DPIA) process;
   (g) Overseeing breach detection, notification, and response in accordance with Section 8(6) and Rule 9;
   (h) Ensuring timely notification to the DPBI within 72 hours of a qualifying data breach (Rule 9(2));
   (i) Maintaining the Register of Processing Activities (RoPA) per Section 8(8) and Rule 6;
   (j) Managing Data Principal rights requests and ensuring response within statutory timelines;
   (k) Overseeing third-party data processor compliance and DPA management;
   (l) Coordinating employee training and awareness programmes on data protection.

────────────────────────────────────────────────────────────────────
3. REPORTING LINE & INDEPENDENCE
────────────────────────────────────────────────────────────────────

3.1 You shall report directly to the Board of Directors / Audit & Risk Committee on all data protection matters.
3.2 You shall have operational independence in the exercise of your duties and shall not receive instructions regarding the exercise of those duties.
3.3 You shall not be dismissed or penalised for performing your duties as DPO.
3.4 You shall have access to all necessary resources, including budget, personnel, and tools.

────────────────────────────────────────────────────────────────────
4. QUALIFICATIONS & COMPETENCE
────────────────────────────────────────────────────────────────────

This appointment is based on your professional qualifications and expert knowledge of data protection law and practices, as required under Rule 13 of the DPDP Rules. You are expected to maintain your expertise through continuous professional development.

────────────────────────────────────────────────────────────────────
5. TERM & REVIEW
────────────────────────────────────────────────────────────────────

5.1 This appointment is for a term of [3 years] from the Effective Date, renewable upon mutual agreement.
5.2 The appointment shall be reviewed annually by the Board.
5.3 This appointment may be terminated with [90 days] written notice by either party.

────────────────────────────────────────────────────────────────────
6. CONFIDENTIALITY
────────────────────────────────────────────────────────────────────

You shall maintain strict confidentiality of all personal data and organisational information accessed in your capacity as DPO, both during and after the term of appointment. Breach of confidentiality may result in disciplinary action and legal proceedings.

────────────────────────────────────────────────────────────────────
7. CONTACT DETAILS FOR PUBLIC DISCLOSURE
────────────────────────────────────────────────────────────────────

The following contact details shall be published in all privacy notices and communicated to the DPBI:
• Name: [DPO Name]
• Email: [DPO Email]
• Phone: [DPO Phone]
• Address: [Organisation Address]

────────────────────────────────────────────────────────────────────

Yours sincerely,

_________________________
[Authorised Signatory Name]
[Designation — Chairperson / CEO / Managing Director]
[Organisation Name]
Date: [Date]

ACCEPTANCE:
I, [DPO Name], accept this appointment and acknowledge the responsibilities set forth herein.

_________________________
[DPO Name]
Date: [Date]

────────────────────────────────────────────────────────────────────
DOCUMENT CONTROL
────────────────────────────────────────────────────────────────────

| Role | Name | Designation | Date | Signature |
|------|------|-------------|------|-----------|
| Prepared By | [Name] | Company Secretary | [Date] | _________ |
| Approved By | [Name] | Chairperson/CEO | [Date] | _________ |

────────────────────────────────────────────────────────────────────
AMENDMENT HISTORY
────────────────────────────────────────────────────────────────────

| Version | Date | Change Summary | Authorised By |
|---------|------|---------------|---------------|
| v1.0 | [Date] | Initial appointment letter | [Name] |

Cross-references: Board Resolution on Data Governance (GOV-005), Organisation Chart (GOV-002)`,
        status: "not-started",
        notes: ""
      },
      {
        id: "p1-5",
        requirement: "Pass Board Resolution on Data Governance",
        dpdpRef: "Sec 8(4), Rule 12",
        templateTitle: "Board Resolution on Data Governance",
        templateContent: `════════════════════════════════════════════════════════════════════
BOARD RESOLUTION ON DATA GOVERNANCE
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL
Document Reference: GOV-005
Version: v1.0
Owner: Company Secretary
Review Date: [Date]
Approval Status: APPROVED

────────────────────────────────────────────────────────────────────
CERTIFIED TRUE COPY OF RESOLUTION

Passed at the Meeting of the Board of Directors of [Organisation Name]
(CIN: [Company Identification Number])
Held on: [Date]
At: [Venue / Virtual Meeting Platform]
Time: [Time]
Quorum: Present and confirmed

────────────────────────────────────────────────────────────────────
PREAMBLE
────────────────────────────────────────────────────────────────────

WHEREAS the Digital Personal Data Protection Act, 2023 ("the Act") has been enacted by the Parliament of India and received Presidential assent on 11th August 2023;

WHEREAS the Digital Personal Data Protection Rules, 2025 ("the Rules") have been notified and are in effect;

WHEREAS [Organisation Name] processes digital personal data of Data Principals and is classified as a Data Fiduciary / Significant Data Fiduciary under the Act;

WHEREAS Section 8(4) of the Act requires the Data Fiduciary to implement appropriate technical and organisational measures to ensure compliance;

WHEREAS Rule 12 requires the Board to provide adequate oversight of data protection matters;

WHEREAS the Board recognises the reputational, financial, and legal risks associated with non-compliance, including penalties up to ₹250 Crore per instance under Section 33;

────────────────────────────────────────────────────────────────────
RESOLUTIONS
────────────────────────────────────────────────────────────────────

IT IS HEREBY UNANIMOUSLY RESOLVED THAT:

Resolution 1 — Data Governance Framework:
[Organisation Name] shall establish and maintain a comprehensive Data Governance Framework in compliance with the DPDP Act, 2023 and the DPDP Rules, 2025, encompassing all obligations relating to purpose limitation, data minimisation, accuracy, storage limitation, security safeguards, and accountability.

Resolution 2 — DPO Appointment:
The Board designates [DPO Name], [Designation], as the Data Protection Officer of [Organisation Name] pursuant to Section 8(6) of the Act and Rule 13 of the Rules, with effect from [Effective Date].

Resolution 3 — Accountability & Reporting:
The DPO shall provide quarterly compliance reports to the Board / Audit & Risk Committee, including risk assessments, breach summaries, DSR statistics, and remediation status.

Resolution 4 — Resource Allocation:
Adequate resources, including budget of ₹[Amount], personnel, tools, and training, shall be allocated for the implementation and ongoing maintenance of the DPDP compliance programme for the financial year [Year].

Resolution 5 — Annual Audit:
An annual data protection audit shall be conducted by [Internal Audit / External Auditor] and the findings reported to the Board within 30 days of completion.

Resolution 6 — Data Processing Standards:
All data processing activities shall be conducted in accordance with the principles set forth in the Act, including:
(a) Purpose limitation (Sec 5)
(b) Lawful processing with consent (Sec 6) or legitimate use (Sec 7)
(c) Data minimisation (Sec 8(7))
(d) Accuracy and completeness (Sec 8(3))
(e) Retention limitation (Sec 8(7))
(f) Appropriate security safeguards (Sec 8(4))

Resolution 7 — Breach Preparedness:
The organisation shall maintain a tested Incident Response Plan with capability to notify the DPBI within 72 hours and affected Data Principals without undue delay, as required under Section 8(6) and Rule 9.

Resolution 8 — Training & Awareness:
All employees, contractors, and relevant third parties shall undergo data protection awareness training annually.

────────────────────────────────────────────────────────────────────
DOCUMENT CONTROL
────────────────────────────────────────────────────────────────────

Signed:

_________________________
[Director 1 Name] — [Designation]
Date: [Date]

_________________________
[Director 2 Name] — [Designation]
Date: [Date]

_________________________
[Company Secretary]
Date: [Date]

Certified true copy issued by:
[Company Secretary Name]
Date: [Date]

────────────────────────────────────────────────────────────────────
AMENDMENT HISTORY
────────────────────────────────────────────────────────────────────

| Version | Date | Change Summary | Authorised By |
|---------|------|---------------|---------------|
| v1.0 | [Date] | Initial Board Resolution | Board of Directors |

Cross-references: DPO Appointment Letter (GOV-004), Statement on Applicability (GOV-001)`,
        status: "not-started",
        notes: ""
      },
      {
        id: "p1-6",
        requirement: "Maintain Register of Third-Party Data Processors & Sub-processors",
        dpdpRef: "Sec 8(2), Rule 14",
        templateTitle: "Processor Register",
        templateContent: `════════════════════════════════════════════════════════════════════
REGISTER OF DATA PROCESSORS AND SUB-PROCESSORS
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL
Document Reference: GOV-006
Version: v1.0
Owner: Data Protection Officer
Review Date: [Date]
Approval Status: PENDING APPROVAL

────────────────────────────────────────────────────────────────────
1. EXECUTIVE SUMMARY / PURPOSE
────────────────────────────────────────────────────────────────────

This Register documents all Data Processors and Sub-processors engaged by [Organisation Name] for the processing of personal data, pursuant to Section 8(2) of the DPDP Act, 2023 and Rule 14 of the DPDP Rules, 2025.

Legal Obligation: Section 8(2) requires the Data Fiduciary to engage Data Processors only under a valid contract (DPA) and to maintain oversight of processing activities. The Data Fiduciary remains liable for any processing undertaken by its Processors.

Penalty Exposure: Non-compliance with processor obligations under Sec 8(2) may attract penalties under Sec 33(c) up to ₹250 Crore.

────────────────────────────────────────────────────────────────────
2. SCOPE
────────────────────────────────────────────────────────────────────

All third-party entities that process personal data on behalf of [Organisation Name], including:
• Cloud service providers (IaaS, PaaS, SaaS)
• IT service providers and managed service providers
• Payroll and HR service providers
• Marketing and analytics platforms
• Customer support outsourcing partners
• Payment processors

────────────────────────────────────────────────────────────────────
3. DATA PROCESSOR REGISTER
────────────────────────────────────────────────────────────────────

| # | Processor Name | CIN/Registration | Services Provided | Data Categories Processed | Volume (approx.) | DPA Reference | DPA Execution Date | DPA Expiry | Country of Processing | Sub-processors Used | ISO 27001 / SOC 2 | Last Security Assessment | Risk Rating | Review Date |
|---|---------------|-----------------|-------------------|--------------------------|-----------------|--------------|-------------------|-----------|----------------------|--------------------|--------------------|------------------------|------------|------------|
| 1 | [Processor] | [CIN] | [Services] | [Categories] | [Volume] | DPA-[Number] | [Date] | [Date] | [Country] | [Yes/No — List] | [Cert details] | [Date] | [H/M/L] | [Date] |
| 2 | [Processor] | [CIN] | [Services] | [Categories] | [Volume] | DPA-[Number] | [Date] | [Date] | [Country] | [Yes/No — List] | [Cert details] | [Date] | [H/M/L] | [Date] |

────────────────────────────────────────────────────────────────────
4. SUB-PROCESSOR REGISTER
────────────────────────────────────────────────────────────────────

| # | Sub-processor Name | Engaged By (Primary Processor) | Services | Data Categories | Country | DPA/Sub-DPA in Place | Security Cert | Approval Date |
|---|-------------------|-------------------------------|----------|-----------------|---------|---------------------|--------------|---------------|
| 1 | [Sub-processor] | [Primary Processor] | [Services] | [Categories] | [Country] | [Y/N] | [Cert] | [Date] |

────────────────────────────────────────────────────────────────────
5. PROCESSOR MANAGEMENT PROCEDURES
────────────────────────────────────────────────────────────────────

5.1 Onboarding: Vendor due diligence questionnaire (POL-027) must be completed and DPA executed BEFORE any personal data is shared.
5.2 Sub-processor Changes: Primary Processor must provide 30 days advance written notice before engaging new sub-processors. [Organisation Name] has the right to object within 14 days.
5.3 Audit Rights: [Organisation Name] may audit any Processor or Sub-processor annually with 14 days notice.
5.4 Security Requirements: All processors must maintain at minimum ISO 27001 or SOC 2 Type II certification.
5.5 Termination: Upon contract termination, processor must return or securely delete all personal data within 30 days and provide written certification of deletion.
5.6 Breach Notification: Processor must notify [Organisation Name] within 24 hours of discovering a personal data breach.

────────────────────────────────────────────────────────────────────
6. REVIEW SCHEDULE
────────────────────────────────────────────────────────────────────

• Register Review: Quarterly
• Processor Security Assessment: Annual
• DPA Renewal Assessment: 90 days before expiry
• Sub-processor Audit: Annual (risk-based)

────────────────────────────────────────────────────────────────────
DOCUMENT CONTROL
────────────────────────────────────────────────────────────────────

| Role | Name | Designation | Date | Signature |
|------|------|-------------|------|-----------|
| Prepared By | [Name] | [Designation] | [Date] | _________ |
| Reviewed By | [DPO Name] | Data Protection Officer | [Date] | _________ |
| Approved By | [Name] | [Procurement Head/Legal] | [Date] | _________ |

────────────────────────────────────────────────────────────────────
AMENDMENT HISTORY
────────────────────────────────────────────────────────────────────

| Version | Date | Change Summary | Authorised By |
|---------|------|---------------|---------------|
| v1.0 | [Date] | Initial register creation | [Name] |

Cross-references: DPA Template (POL-007), Vendor Due Diligence (POL-027), Third-Party Risk Register (POL-028)`,
        status: "not-started",
        notes: ""
      },
      {
        id: "p1-7",
        requirement: "Execute Joint Controller Agreement (if applicable)",
        dpdpRef: "Sec 10, Rule 15",
        templateTitle: "Joint Controller Agreement Template",
        templateContent: `════════════════════════════════════════════════════════════════════
JOINT CONTROLLER AGREEMENT
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL
Document Reference: GOV-007
Version: v1.0
Owner: Legal Counsel / DPO
Review Date: [Date]
Approval Status: PENDING APPROVAL

────────────────────────────────────────────────────────────────────
RECITALS
────────────────────────────────────────────────────────────────────

THIS AGREEMENT is entered into on [Date] ("Effective Date")

BETWEEN:

(1) [Organisation Name], a company incorporated under the laws of India, having its registered office at [Address] (hereinafter "Controller A"); AND

(2) [Joint Controller Name], a company incorporated under the laws of [Jurisdiction], having its registered office at [Address] (hereinafter "Controller B")

(each a "Party" and collectively the "Parties")

WHEREAS:

(A) The Parties jointly determine the purposes and means of processing certain categories of personal data in connection with [describe joint processing activity];
(B) Section 10 of the Digital Personal Data Protection Act, 2023 ("DPDP Act") and Rule 15 of the DPDP Rules, 2025 require Joint Data Fiduciaries to determine their respective responsibilities by means of a transparent arrangement;
(C) The Parties wish to set out their respective responsibilities for compliance with the DPDP Act in a binding agreement.

────────────────────────────────────────────────────────────────────
1. DEFINITIONS
────────────────────────────────────────────────────────────────────

1.1 "Applicable Law" means the DPDP Act, 2023, the DPDP Rules, 2025, and any subordinate legislation, circulars, or guidance issued by the DPBI.
1.2 "Data Principal" has the meaning given in Section 2(j) of the DPDP Act.
1.3 "DPBI" means the Data Protection Board of India established under Section 18 of the DPDP Act.
1.4 "Joint Processing Activities" means the processing activities described in Annexure A.
1.5 "Personal Data" has the meaning given in Section 2(t) of the DPDP Act.
1.6 "Processing" has the meaning given in Section 2(x) of the DPDP Act.
1.7 "Security Safeguards" means the technical and organisational measures required under Section 8(4) of the DPDP Act.
1.8 "Data Breach" means a personal data breach as contemplated under Section 8(6) of the DPDP Act.
1.9 "Consent" means consent as defined in Section 6 of the DPDP Act.
1.10 "Legitimate Use" means processing permitted under Section 7 of the DPDP Act.
1.11 "DPIA" means Data Protection Impact Assessment under Section 8(9) and Rule 10.
1.12 "DPO" means Data Protection Officer appointed under Section 8(6) and Rule 13.
1.13 "Sub-processor" means any third party engaged by either Party to process personal data.
1.14 "Confidential Information" means all information marked as confidential or which by its nature should be considered confidential.
1.15 "Effective Date" means the date first written above.

────────────────────────────────────────────────────────────────────
2. SCOPE OF JOINT PROCESSING
────────────────────────────────────────────────────────────────────

2.1 Data Categories: [Specify all categories of personal data jointly processed]
2.2 Data Principals: [Specify categories — customers, employees, etc.]
2.3 Purposes of Processing: [Specify each purpose]
2.4 Duration: This Agreement shall remain in force for [period] from the Effective Date, unless terminated earlier.

────────────────────────────────────────────────────────────────────
3. ALLOCATION OF RESPONSIBILITIES
────────────────────────────────────────────────────────────────────

3.1 Controller A shall be responsible for:
   (a) [Specify — e.g., collection of personal data and providing privacy notices]
   (b) [Specify — e.g., managing consent collection and withdrawal]
   (c) [Specify — e.g., responding to DSR requests for data it holds]

3.2 Controller B shall be responsible for:
   (a) [Specify — e.g., processing and analysis of shared data]
   (b) [Specify — e.g., implementing security measures for its systems]
   (c) [Specify — e.g., managing sub-processor relationships for its scope]

3.3 Joint responsibilities:
   (a) Both Parties shall cooperate in conducting DPIAs where required
   (b) Both Parties shall maintain their respective entries in the RoPA
   (c) Both Parties shall implement minimum ISO 27001 / SOC 2 security standards

────────────────────────────────────────────────────────────────────
4. POINT OF CONTACT FOR DATA PRINCIPALS
────────────────────────────────────────────────────────────────────

4.1 The designated single point of contact for Data Principals shall be: [Controller A / Controller B / Joint Contact]
4.2 Contact details: [Name], [Email], [Phone]
4.3 Regardless of the designated contact, Data Principals may exercise their rights against either Party.
4.4 Each Party shall redirect any request received for the other Party within [3 business days].

────────────────────────────────────────────────────────────────────
5. DATA PROTECTION MEASURES
────────────────────────────────────────────────────────────────────

5.1 Both Parties shall implement appropriate technical and organisational security measures as required under Section 8(4) of the DPDP Act, including at minimum:
   (a) Encryption of personal data at rest (AES-256 or equivalent) and in transit (TLS 1.2+)
   (b) Role-based access controls with multi-factor authentication
   (c) Regular vulnerability assessments and penetration testing
   (d) Logging and monitoring of all access to personal data

────────────────────────────────────────────────────────────────────
6. DATA BREACH MANAGEMENT
────────────────────────────────────────────────────────────────────

6.1 Each Party shall notify the other Party within [12 hours] of becoming aware of a Data Breach affecting jointly processed data.
6.2 Controller [A/B] shall be responsible for filing notification with DPBI within 72 hours (Rule 9(2)).
6.3 Both Parties shall cooperate in breach investigation and remediation.

────────────────────────────────────────────────────────────────────
7. AUDIT RIGHTS
────────────────────────────────────────────────────────────────────

7.1 Each Party may audit the other Party's compliance with this Agreement annually, with 14 days prior written notice.
7.2 Audit scope includes security controls, processing records, and sub-processor management.

────────────────────────────────────────────────────────────────────
8. SUB-PROCESSOR MANAGEMENT
────────────────────────────────────────────────────────────────────

8.1 Neither Party shall engage a sub-processor for Joint Processing Activities without 30 days advance written notice to the other Party.
8.2 The engaging Party remains fully liable for its sub-processor's compliance.

────────────────────────────────────────────────────────────────────
9. GOVERNING LAW & JURISDICTION
────────────────────────────────────────────────────────────────────

9.1 This Agreement shall be governed by and construed in accordance with the laws of India.
9.2 The courts of [City], India shall have exclusive jurisdiction.

────────────────────────────────────────────────────────────────────
10. TERMINATION & DATA RETURN
────────────────────────────────────────────────────────────────────

10.1 Either Party may terminate this Agreement with [90 days] written notice.
10.2 Upon termination, each Party shall return or securely delete all personal data received from the other Party within 30 days.
10.3 Deletion must be certified in writing.

────────────────────────────────────────────────────────────────────
11. INDEMNIFICATION
────────────────────────────────────────────────────────────────────

11.1 Each Party shall indemnify the other against all losses, damages, fines, and costs arising from the indemnifying Party's breach of this Agreement or the DPDP Act.

────────────────────────────────────────────────────────────────────
12. ENTIRE AGREEMENT
────────────────────────────────────────────────────────────────────

12.1 This Agreement constitutes the entire agreement between the Parties regarding joint controllership and supersedes all prior negotiations and agreements.

────────────────────────────────────────────────────────────────────

IN WITNESS WHEREOF, the Parties have executed this Agreement on the date first written above.

For [Organisation Name] (Controller A):

_________________________
Name: [Authorised Signatory]
Designation: [Designation]
Date: [Date]

For [Joint Controller Name] (Controller B):

_________________________
Name: [Authorised Signatory]
Designation: [Designation]
Date: [Date]

────────────────────────────────────────────────────────────────────
ANNEXURE A — JOINT PROCESSING ACTIVITIES
────────────────────────────────────────────────────────────────────

| # | Processing Activity | Data Categories | Data Principals | Purpose | Responsible Party | Legal Basis |
|---|--------------------|-----------------|-----------------|---------|-----------------|-----------| 
| 1 | [Activity] | [Categories] | [Principals] | [Purpose] | [Controller A/B/Both] | [Sec 6/7] |

────────────────────────────────────────────────────────────────────
AMENDMENT HISTORY
────────────────────────────────────────────────────────────────────

| Version | Date | Change Summary | Authorised By |
|---------|------|---------------|---------------|
| v1.0 | [Date] | Initial agreement | Both Parties |`,
        status: "not-started",
        notes: ""
      },
      {
        id: "p1-8",
        requirement: "Compile Regulatory Licences & Sector Filings",
        dpdpRef: "Rule 3(4)",
        templateTitle: "Regulatory Licences Register",
        templateContent: `════════════════════════════════════════════════════════════════════
REGULATORY LICENCES & SECTOR FILINGS REGISTER
════════════════════════════════════════════════════════════════════

Classification: INTERNAL
Document Reference: GOV-008
Version: v1.0
Owner: Legal Counsel / Compliance
Review Date: [Date]
Approval Status: PENDING APPROVAL

────────────────────────────────────────────────────────────────────
1. PURPOSE
────────────────────────────────────────────────────────────────────

This Register catalogues all regulatory licences, registrations, and sector-specific filings held by [Organisation Name], pursuant to Rule 3(4) of the DPDP Rules, 2025. Maintaining an accurate register ensures that sector-specific data protection obligations layered on top of the DPDP Act are identified and complied with.

────────────────────────────────────────────────────────────────────
2. SCOPE
────────────────────────────────────────────────────────────────────

All regulatory licences, registrations, and filings that impose data protection, data localisation, or information security obligations on [Organisation Name], including but not limited to:
• Industry-specific regulatory approvals
• Data localisation mandates from sectoral regulators
• Information security compliance certificates
• Cross-border data transfer permissions

────────────────────────────────────────────────────────────────────
3. LICENCE REGISTER
────────────────────────────────────────────────────────────────────

| # | Licence / Registration | Issuing Authority | Licence/Reg Number | Category | Issue Date | Expiry Date | Renewal Status | Data Protection Conditions | Responsible Person |
|---|----------------------|-------------------|--------------------|----------|-----------|------------|---------------|--------------------------|-------------------|
| 1 | [Licence Name] | [Authority] | [Number] | [Primary/Sector] | [Date] | [Date] | [Active/Due/Overdue] | [Conditions] | [Name] |

────────────────────────────────────────────────────────────────────
4. SECTOR-SPECIFIC REQUIREMENTS
────────────────────────────────────────────────────────────────────

Industry: [Industry]
Primary Sectoral Regulator: [Regulator Name]

| # | Regulation / Guideline | Issuing Authority | Data Protection Requirements | Compliance Status | Gap (if any) |
|---|----------------------|-------------------|-----------------------------|-----------------|-------------|
| 1 | [Regulation] | [Authority] | [Requirements] | [Compliant/Gap] | [Details] |

Examples by sector:
• FinTech/Banking: RBI Master Direction on IT Governance, RBI Data Localisation Directive
• Healthcare: DISHA (when enacted), ICMR Guidelines
• Telecom: DoT/TRAI Data Protection Guidelines
• E-commerce: Consumer Protection (E-Commerce) Rules, 2020

────────────────────────────────────────────────────────────────────
5. COMPLIANCE MATRIX
────────────────────────────────────────────────────────────────────

| Regulatory Obligation | DPDP Act Overlap | Status | Evidence |
|----------------------|-----------------|--------|---------|
| [Obligation] | [DPDP Section] | [Status] | [Reference] |

────────────────────────────────────────────────────────────────────
6. IMPLEMENTATION GUIDANCE
────────────────────────────────────────────────────────────────────

• Review this register quarterly and upon any regulatory change or new licence application.
• Assign each licence a responsible person who monitors renewal and compliance conditions.
• Coordinate with the DPO to ensure sector-specific data protection requirements are integrated into the overall DPDP compliance programme.
• Cross-references: Statement on Applicability (GOV-001), Data Flow Diagram (GOV-003).

────────────────────────────────────────────────────────────────────
DOCUMENT CONTROL
────────────────────────────────────────────────────────────────────

| Role | Name | Designation | Date | Signature |
|------|------|-------------|------|-----------|
| Prepared By | [Name] | [Designation] | [Date] | _________ |
| Reviewed By | [DPO Name] | Data Protection Officer | [Date] | _________ |
| Approved By | [Name] | [Legal Counsel / CFO] | [Date] | _________ |

────────────────────────────────────────────────────────────────────
AMENDMENT HISTORY
────────────────────────────────────────────────────────────────────

| Version | Date | Change Summary | Authorised By |
|---------|------|---------------|---------------|
| v1.0 | [Date] | Initial register creation | [Name] |`,
        status: "not-started",
        notes: ""
      }
    ]
  },
  {
    id: "phase-2",
    phase: 2,
    title: "Policy Matrix",
    icon: "📋",
    items: [
      { id: "p2-1", requirement: "Draft Privacy Notice for Website / App", dpdpRef: "Sec 5(1), Rule 3", templateTitle: "Privacy Notice — Website/App", templateContent: `════════════════════════════════════════════════════════════════════
PRIVACY NOTICE — WEBSITE / APPLICATION
════════════════════════════════════════════════════════════════════

Classification: PUBLIC
Document Reference: POL-001
Version: v1.0
Owner: Data Protection Officer
Review Date: [Date]
Approval Status: APPROVED

────────────────────────────────────────────────────────────────────
1. IDENTITY AND CONTACT DETAILS OF THE DATA FIDUCIARY
────────────────────────────────────────────────────────────────────

[Organisation Name], incorporated under the laws of India, having its registered office at [Address] ("we", "us", "our"), is the Data Fiduciary responsible for processing your personal data through this website/application.

Data Protection Officer: [DPO Name]
Email: [DPO Email] | Phone: [DPO Phone]

This Privacy Notice is issued pursuant to Section 5(1) of the Digital Personal Data Protection Act, 2023 ("DPDP Act") and Rule 3 of the DPDP Rules, 2025.

────────────────────────────────────────────────────────────────────
2. PERSONAL DATA WE COLLECT
────────────────────────────────────────────────────────────────────

2.1 Data provided directly by you:
• Identity Data: Full name, date of birth, gender, government-issued ID numbers
• Contact Data: Email address, telephone number, postal address
• Account Data: Username, password (encrypted), account preferences
• Financial Data: Payment card details (processed via PCI-DSS compliant gateway), billing address
• Communication Data: Correspondence, feedback, support tickets

2.2 Data collected automatically:
• Technical Data: IP address, browser type/version, operating system, device identifiers
• Usage Data: Pages visited, time spent, click patterns, referral source
• Location Data: Approximate location derived from IP address
• Cookie Data: As detailed in our Cookie Policy (POL-006)

────────────────────────────────────────────────────────────────────
3. PURPOSE AND LEGAL BASIS FOR PROCESSING
────────────────────────────────────────────────────────────────────

| Purpose | Data Categories | Legal Basis (DPDP Act) | Retention |
|---------|----------------|----------------------|-----------|
| Service delivery & account management | Identity, Contact, Account | Sec 6 (Consent) / Sec 7(a) (Performance of contract) | Duration of service + 3 years |
| Payment processing | Financial, Identity | Sec 7(a) (Contractual necessity) | As per RBI/PCI-DSS requirements |
| Customer support | Communication, Identity | Sec 6 (Consent) | 2 years from resolution |
| Analytics & service improvement | Usage, Technical | Sec 6 (Consent) | 2 years (anonymised thereafter) |
| Legal compliance | As required | Sec 7(c) (Legal obligation) | As per applicable law |
| Marketing communications | Contact, Preferences | Sec 6 (Explicit consent) | Until consent withdrawn |
| Security & fraud prevention | Technical, Usage | Sec 7(b) (Legitimate use) | 1 year |

────────────────────────────────────────────────────────────────────
4. CONSENT
────────────────────────────────────────────────────────────────────

4.1 Where we rely on consent (Section 6), your consent is:
• Free, specific, informed, unconditional, and unambiguous
• Given through a clear affirmative action
• Recorded with a verifiable timestamp and audit trail

4.2 You may withdraw consent at any time by:
• Using the preference centre in your account settings
• Emailing [DPO Email]
• Withdrawal of consent is as easy as giving consent (Sec 6(4))

4.3 Consequences of withdrawal: [Describe impact — e.g., inability to access certain features]

────────────────────────────────────────────────────────────────────
5. DATA SHARING AND DISCLOSURE
────────────────────────────────────────────────────────────────────

We may share your personal data with:
• Service providers and Data Processors under valid DPAs (Sec 8(2))
• Legal and regulatory authorities when required by law (Sec 7(c))
• Professional advisors (legal, audit, insurance) under confidentiality obligations

We do NOT sell personal data to third parties.

────────────────────────────────────────────────────────────────────
6. CROSS-BORDER TRANSFERS
────────────────────────────────────────────────────────────────────

Your personal data may be transferred to countries outside India. Such transfers are made only to countries not restricted under Section 16(1) and are protected by:
• Standard Contractual Clauses (SCCs)
• Adequacy assessments
• Equivalent security measures

────────────────────────────────────────────────────────────────────
7. DATA RETENTION
────────────────────────────────────────────────────────────────────

Personal data is retained only for as long as necessary for the specified purpose or as required by applicable law (Sec 8(7)). Upon expiry of the retention period, data is securely deleted or anonymised.

────────────────────────────────────────────────────────────────────
8. YOUR RIGHTS AS A DATA PRINCIPAL
────────────────────────────────────────────────────────────────────

Under the DPDP Act, 2023, you have the following rights:

| Right | Section | How to Exercise |
|-------|---------|----------------|
| Right to Access | Sec 11 | Request a summary of your data and processing activities |
| Right to Correction | Sec 12(1) | Request correction of inaccurate or incomplete data |
| Right to Erasure | Sec 12(3) | Request deletion of data no longer necessary for the purpose |
| Right to Grievance Redressal | Sec 13 | Submit a complaint to our DPO; escalate to DPBI if unresolved |
| Right to Nominate | Sec 14 | Nominate a person to exercise your rights in case of death or incapacity |

Response timeline: We will respond to all valid requests within [30 days].

────────────────────────────────────────────────────────────────────
9. CHILDREN'S DATA
────────────────────────────────────────────────────────────────────

This website/application is not directed at children under 18 years. We do not knowingly collect data from children. If we become aware of such collection, we will delete the data immediately. See our Children's Data Policy (POL-017) for details.

────────────────────────────────────────────────────────────────────
10. SECURITY MEASURES
────────────────────────────────────────────────────────────────────

We implement appropriate technical and organisational security safeguards (Sec 8(4)) including encryption (AES-256 at rest, TLS 1.2+ in transit), access controls, intrusion detection, and regular security audits. See our Information Security Policy (POL-025) for details.

────────────────────────────────────────────────────────────────────
11. UPDATES TO THIS NOTICE
────────────────────────────────────────────────────────────────────

We may update this notice periodically. Material changes will be communicated via [email/website banner/app notification]. Last updated: [Date].

────────────────────────────────────────────────────────────────────
12. CONTACT & COMPLAINTS
────────────────────────────────────────────────────────────────────

Data Protection Officer: [DPO Name]
Email: [DPO Email] | Phone: [DPO Phone] | Address: [Address]

If your complaint is not resolved to your satisfaction within 30 days, you may file a complaint with the Data Protection Board of India (DPBI).

────────────────────────────────────────────────────────────────────
DOCUMENT CONTROL
────────────────────────────────────────────────────────────────────

| Role | Name | Designation | Date |
|------|------|-------------|------|
| Prepared By | [Name] | [Designation] | [Date] |
| Reviewed By | [DPO Name] | Data Protection Officer | [Date] |
| Approved By | [Name] | [Legal / CEO] | [Date] |

Cross-references: Cookie Policy (POL-006), Consent Management Policy (POL-004), Data Retention Policy (POL-011), Information Security Policy (POL-025)`, status: "not-started", notes: "" },

      { id: "p2-2", requirement: "Draft Privacy Notice for Employees / Job Applicants", dpdpRef: "Sec 5(1), Rule 3", templateTitle: "Privacy Notice — Employees", templateContent: `════════════════════════════════════════════════════════════════════
PRIVACY NOTICE — EMPLOYEES & JOB APPLICANTS
════════════════════════════════════════════════════════════════════

Classification: INTERNAL | Document Reference: POL-002 | Version: v1.0
Owner: DPO / HR | Review Date: [Date]

1. PURPOSE: This notice informs employees, contractors, and job applicants of [Organisation Name] about the processing of their personal data, pursuant to Sec 5(1) of the DPDP Act, 2023.

2. DATA COLLECTED: Full name, address, DOB, government ID numbers (PAN, Aadhaar as permitted), bank details, emergency contacts, performance data, health information (where legally required), background verification data, biometric data (attendance), CCTV footage at workplace.

3. PURPOSES & LEGAL BASIS:
| Purpose | Legal Basis | Retention |
|---------|------------|-----------|
| Payroll & benefits | Sec 7(a) — Employment contract | Employment + 7 years |
| Performance management | Sec 7(a) | Employment + 3 years |
| Legal/tax compliance | Sec 7(c) — Legal obligation | As per applicable law |
| Workplace safety | Sec 7(b) — Legitimate use | 1 year |
| Recruitment | Sec 6 (Consent) / Sec 7(a) | Unsuccessful: 1 year; Hired: per employment |
| Background verification | Sec 6 (Consent) | Employment + 3 years |

4. YOUR RIGHTS (Sec 11-14): Access, Correction, Erasure, Grievance Redressal, Nomination. Contact: [DPO Name] at [DPO Email]. Response within 30 days.

5. DATA SHARING: Payroll providers, benefits administrators, government authorities, background verification agencies — all under valid DPAs.

6. SECURITY: Sec 8(4) compliant measures including encryption, access controls, and audit logging.

DOCUMENT CONTROL:
| Prepared By | [Name] | [Date] | Reviewed By | [DPO Name] | [Date] | Approved By | [CHRO] | [Date] |

Cross-references: Privacy Notice — Website (POL-001), Data Retention Policy (POL-011), Employee Training Policy (POL-031)`, status: "not-started", notes: "" },

      { id: "p2-3", requirement: "Draft Privacy Notice for CCTV / Physical Surveillance", dpdpRef: "Sec 5(1)", templateTitle: "Privacy Notice — CCTV", templateContent: `════════════════════════════════════════════════════════════════════
PRIVACY NOTICE — CCTV & PHYSICAL SURVEILLANCE
════════════════════════════════════════════════════════════════════

Classification: PUBLIC | Document Reference: POL-003 | Version: v1.0
Owner: DPO / Operations | Review Date: [Date]

1. PURPOSE: [Organisation Name] operates CCTV surveillance at its premises for security of persons and property, prevention of crime, and health & safety compliance. Legal basis: Sec 7(b) — Legitimate use.

2. DATA COLLECTED: Video footage, images, timestamps from cameras at [list locations — entrances, lobbies, car parks, server rooms].

3. RETENTION: Footage retained for [30/60/90] days and automatically overwritten unless required for investigation or legal proceedings.

4. ACCESS: Restricted to Security Team Lead, HR (for disciplinary matters), Legal (for litigation), and DPO. All access logged.

5. YOUR RIGHTS: Under Sec 11-14 of DPDP Act, you may request access to footage of yourself. Contact: [DPO Name] at [DPO Email].

6. SIGNAGE: Physical notices displayed at all monitored locations as per Sec 5(1) requirements.

7. NO AUDIO RECORDING: Audio recording is not conducted.

DOCUMENT CONTROL:
| Prepared By | [Name] | [Date] | Approved By | [DPO Name] | [Date] |

Cross-references: Information Security Policy (POL-025), Data Retention Policy (POL-011)`, status: "not-started", notes: "" },

      { id: "p2-4", requirement: "Establish Consent Management Policy", dpdpRef: "Sec 6, Rule 4", templateTitle: "Consent Management Policy", templateContent: `════════════════════════════════════════════════════════════════════
CONSENT MANAGEMENT POLICY
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-004 | Version: v1.0
Owner: DPO | Review Date: [Date]

1. PURPOSE: To establish a framework for obtaining, recording, managing, and withdrawing consent in compliance with Sec 6 of the DPDP Act, 2023 and Rule 4 of the DPDP Rules, 2025.

Penalty Exposure: Non-compliance with consent requirements may attract penalties up to ₹250 Crore under Sec 33.

2. SCOPE: All processing activities relying on consent as legal basis across [Organisation Name].

3. CONSENT REQUIREMENTS (Sec 6):
Clause 3.1: Consent must be free, specific, informed, unconditional, and unambiguous (Sec 6(1))
Clause 3.2: Must be in clear, plain language (Sec 6(2))
Clause 3.3: Must specify each purpose and data category separately
Clause 3.4: Must contain identity and contact details of DPO
Clause 3.5: Must inform the Data Principal of their right to withdraw (Sec 6(4))
Clause 3.6: Must not be bundled with other terms (Sec 6(3))
Clause 3.7: Must not make consent a condition for service where not necessary
Clause 3.8: Consent for children requires verifiable parental/guardian consent (Sec 9)

4. CONSENT COLLECTION PROCEDURES:
Clause 4.1: Digital — Clear opt-in checkbox (no pre-ticked boxes), with link to full notice
Clause 4.2: Physical — Signed consent form with witness
Clause 4.3: Telephonic — Recorded verbal consent with reference number

5. WITHDRAWAL (Sec 6(4)):
Clause 5.1: Data Principals may withdraw consent at any time
Clause 5.2: Withdrawal mechanism must be as easy as giving consent
Clause 5.3: Withdrawal processed within [7 business days]
Clause 5.4: Consequences of withdrawal communicated at time of withdrawal

6. CONSENT ARTEFACT (Rule 4(2)):
Clause 6.1: Every consent shall generate a Consent Artefact containing: purpose, data categories, consent date, method, Data Principal identifier, withdrawal mechanism
Clause 6.2: Artefacts stored in the Consent Artefact Register (POL-005)
Clause 6.3: Artefacts must be producible to DPBI on demand

7. RECORDS: All consent records maintained in Consent Artefact Register (POL-005).
8. REVIEW: This policy reviewed annually by [DPO Name].

COMPLIANCE MATRIX:
| Clause | DPDP Obligation | Status |
|--------|----------------|--------|
| 3.1-3.8 | Sec 6(1)-(4) | [Status] |
| 4.1-4.3 | Rule 4(1) | [Status] |
| 6.1-6.3 | Rule 4(2) | [Status] |

DOCUMENT CONTROL: Prepared By: [Name] | Reviewed By: [DPO Name] | Approved By: [Legal Head]
Cross-references: Consent Artefact Register (POL-005), Privacy Notice (POL-001), Children's Data Policy (POL-017)`, status: "not-started", notes: "" },

      { id: "p2-5", requirement: "Maintain Consent Artefact Records & Logs", dpdpRef: "Sec 6(3), Rule 4(2)", templateTitle: "Consent Artefact Register", templateContent: `════════════════════════════════════════════════════════════════════
CONSENT ARTEFACT REGISTER
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-005 | Version: v1.0
Owner: DPO | Review Date: [Date]

1. PURPOSE: Maintain a verifiable record of all consent artefacts per Sec 6(3) and Rule 4(2). Each artefact must be producible to the DPBI upon request.

2. DATA DICTIONARY:
| Field | Description | Mandatory | Format |
|-------|-----------|-----------|--------|
| Consent ID * | Unique identifier | Yes | UUID |
| Data Principal * | Name/Pseudonymised ID | Yes | Text |
| Purpose * | Specific processing purpose | Yes | Text |
| Data Categories * | Personal data categories covered | Yes | Text |
| Consent Date * | Date and time consent given | Yes | ISO 8601 |
| Method * | Digital/Physical/Telephonic | Yes | Enum |
| Consent Text Version | Version of notice shown | Yes | Text |
| Withdrawal Date | Date consent withdrawn | No | ISO 8601 |
| Withdrawal Method | How withdrawal was made | No | Text |
| Status * | Active/Withdrawn/Expired | Yes | Enum |

3. REGISTER:
| Consent ID | Data Principal | Purpose | Data Categories | Consent Date | Method | Version | Withdrawal Date | Status |
|-----------|---------------|---------|-----------------|-------------|--------|---------|----------------|--------|
| [UUID] | [Name/ID] | [Purpose] | [Categories] | [DateTime] | [Method] | [v1.0] | [Date/N/A] | Active/Withdrawn |

4. RETENTION: Consent artefacts retained for duration of processing plus [5] years.
5. REVIEW: Quarterly by [DPO Name].
6. REGULATORY BASIS: Sec 6(3), Rule 4(2) — mandatory maintenance of consent records.

DOCUMENT CONTROL: Maintained By: [Name] | Reviewed By: [DPO Name]
Cross-references: Consent Management Policy (POL-004)`, status: "not-started", notes: "" },

      { id: "p2-6", requirement: "Draft Cookie Policy & Consent Banner", dpdpRef: "Sec 6(1), Rule 4", templateTitle: "Cookie Policy Template", templateContent: `════════════════════════════════════════════════════════════════════
COOKIE POLICY
════════════════════════════════════════════════════════════════════

Classification: PUBLIC | Document Reference: POL-006 | Version: v1.0
Owner: DPO | Review Date: [Date]

1. PURPOSE: This policy explains how [Organisation Name] uses cookies and similar tracking technologies on its website/application, in compliance with Sec 6(1) of the DPDP Act, 2023.

2. TYPES OF COOKIES:
| Category | Purpose | Consent Required | Retention |
|----------|---------|-----------------|-----------|
| Strictly Necessary | Website functionality, security | No (Sec 7(b)) | Session |
| Performance/Analytics | Usage patterns, site improvement | Yes (Sec 6) | [12 months] |
| Functional | Preferences, language settings | Yes (Sec 6) | [12 months] |
| Marketing/Targeting | Personalised advertising | Yes (Sec 6) | [12 months] |

3. CONSENT MECHANISM: Non-essential cookies placed ONLY after explicit consent via cookie banner. No pre-ticked boxes. Granular category-level consent available.

4. MANAGING PREFERENCES: Cookie Preferences Centre accessible at [URL] and via footer link. Browser settings may also be used.

5. THIRD-PARTY COOKIES: [List third-party cookie providers and their purposes].

6. CHILDREN: No marketing/targeting cookies placed for users identified as under 18 (Sec 9(3)).

DOCUMENT CONTROL: Prepared By: [Name] | Approved By: [DPO Name]
Cross-references: Privacy Notice (POL-001), Consent Management Policy (POL-004)`, status: "not-started", notes: "" },

      { id: "p2-7", requirement: "Prepare Data Processing Agreement (DPA) Template", dpdpRef: "Sec 8(2), Rule 14", templateTitle: "DPA Template", templateContent: `════════════════════════════════════════════════════════════════════
DATA PROCESSING AGREEMENT
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-007 | Version: v1.0
Owner: Legal / DPO | Review Date: [Date]

────────────────────────────────────────────────────────────────────
RECITALS
────────────────────────────────────────────────────────────────────

THIS DATA PROCESSING AGREEMENT ("DPA") is entered into on [Date]

BETWEEN:
(1) [Organisation Name], having its registered office at [Address] ("Data Fiduciary" / "Controller"); AND
(2) [Processor Name], having its registered office at [Address] ("Data Processor" / "Processor")

WHEREAS:
(A) The Data Fiduciary engages the Data Processor to provide [services] which involve processing personal data;
(B) Section 8(2) of the DPDP Act, 2023 requires the Data Fiduciary to engage processors only under a valid contract;
(C) Rule 14 prescribes the terms that must be included in such contract;
(D) The Parties wish to ensure compliance with the DPDP Act and set out their respective obligations.

────────────────────────────────────────────────────────────────────
1. DEFINITIONS
────────────────────────────────────────────────────────────────────

1.1 "Applicable Law" means the DPDP Act, 2023, DPDP Rules, 2025, and applicable sector regulations.
1.2 "Data Breach" means any breach of security leading to unauthorised access, disclosure, or loss of personal data.
1.3 "Data Principal" has the meaning in Sec 2(j) of the DPDP Act.
1.4 "DPBI" means the Data Protection Board of India.
1.5 "Personal Data" has the meaning in Sec 2(t) of the DPDP Act.
1.6 "Processing" has the meaning in Sec 2(x) of the DPDP Act.
1.7 "Security Safeguards" means measures required under Sec 8(4).
1.8 "Sub-processor" means any third party engaged by the Processor to process personal data.
1.9 "Confidential Information" means all non-public information exchanged between the Parties.
1.10 "Processing Instructions" means the documented instructions provided by the Data Fiduciary.
1.11 "Technical and Organisational Measures" means the security controls described in Annexure B.
1.12 "Audit" means an assessment of the Processor's compliance with this DPA.
1.13 "Supervisory Authority" means the DPBI or any successor body.
1.14 "Territory" means the Republic of India.
1.15 "Services Agreement" means the underlying agreement for services between the Parties.

────────────────────────────────────────────────────────────────────
2. SUBJECT MATTER AND DURATION
────────────────────────────────────────────────────────────────────

2.1 The Processor shall process personal data on behalf of the Data Fiduciary as specified in Annexure A.
2.2 Duration: Co-terminus with the Services Agreement, unless terminated earlier.

────────────────────────────────────────────────────────────────────
3. OBLIGATIONS OF THE DATA PROCESSOR
────────────────────────────────────────────────────────────────────

3.1 Process personal data only on documented instructions from the Data Fiduciary.
3.2 Ensure that persons authorised to process personal data are bound by confidentiality obligations.
3.3 Implement appropriate technical and organisational security measures as specified in Annexure B, including at minimum ISO 27001 or SOC 2 Type II controls.
3.4 Not engage sub-processors without prior written consent of the Data Fiduciary. Provide 30 days advance notice of any proposed sub-processor.
3.5 Assist the Data Fiduciary in fulfilling Data Principal rights requests (Sec 11-14).
3.6 Delete or return all personal data upon termination within 30 days and certify deletion in writing.
3.7 Make available all information necessary to demonstrate compliance and allow for audits.
3.8 Immediately inform the Data Fiduciary if an instruction infringes the DPDP Act.

────────────────────────────────────────────────────────────────────
4. BREACH NOTIFICATION
────────────────────────────────────────────────────────────────────

4.1 The Processor shall notify the Data Fiduciary within 24 hours of becoming aware of a Data Breach.
4.2 Notification shall include: nature of breach, categories and approximate number of Data Principals affected, likely consequences, and measures taken.
4.3 The Processor shall cooperate fully in breach investigation and remediation.

────────────────────────────────────────────────────────────────────
5. SUB-PROCESSOR MANAGEMENT
────────────────────────────────────────────────────────────────────

5.1 Processor must provide 30 days advance written notice before engaging any new sub-processor.
5.2 Data Fiduciary has the right to object within 14 days.
5.3 Processor remains fully liable for sub-processor compliance.
5.4 Sub-processor agreements must contain obligations no less protective than this DPA.

────────────────────────────────────────────────────────────────────
6. AUDIT RIGHTS
────────────────────────────────────────────────────────────────────

6.1 The Data Fiduciary may audit the Processor annually with 14 days prior written notice.
6.2 Audit scope: security controls, processing records, sub-processor management, breach response capabilities.
6.3 Processor shall provide reasonable cooperation and access.

────────────────────────────────────────────────────────────────────
7. CROSS-BORDER TRANSFERS
────────────────────────────────────────────────────────────────────

7.1 Processor shall not transfer personal data outside India without prior written consent.
7.2 Transfers must comply with Sec 16 and be supported by adequate safeguards.

────────────────────────────────────────────────────────────────────
8. INDEMNIFICATION
────────────────────────────────────────────────────────────────────

8.1 The Processor shall indemnify the Data Fiduciary against all losses, damages, fines, penalties, and costs arising from the Processor's breach of this DPA or the DPDP Act.

────────────────────────────────────────────────────────────────────
9. GOVERNING LAW & JURISDICTION
────────────────────────────────────────────────────────────────────

9.1 This DPA is governed by Indian law.
9.2 Courts of [City], India have exclusive jurisdiction.

────────────────────────────────────────────────────────────────────
10. TERMINATION & DATA RETURN
────────────────────────────────────────────────────────────────────

10.1 Upon termination, Processor shall return or securely delete all personal data within 30 days.
10.2 Processor shall provide written certification of deletion.

────────────────────────────────────────────────────────────────────
11. ENTIRE AGREEMENT
────────────────────────────────────────────────────────────────────

This DPA constitutes the entire agreement between the Parties regarding data processing and supersedes all prior agreements on this subject.

SIGNED:
Data Fiduciary: _____________________ | Data Processor: _____________________
Name: [Name] | Name: [Name]
Date: [Date] | Date: [Date]

ANNEXURE A — Processing Details: [Data categories, Data Principals, purposes, duration]
ANNEXURE B — Security Measures: [Minimum ISO 27001/SOC 2, encryption standards, access controls]

Cross-references: Processor Register (GOV-006), Vendor Due Diligence (POL-027)`, status: "not-started", notes: "" },

      { id: "p2-8", requirement: "Maintain executed copies of all DPAs", dpdpRef: "Sec 8(2)", templateTitle: "DPA Execution Tracker", templateContent: `════════════════════════════════════════════════════════════════════
DPA EXECUTION TRACKER
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-008 | Version: v1.0
Owner: DPO / Legal | Review Date: [Date]

PURPOSE: Track all executed DPAs per Sec 8(2). All processors MUST have a valid DPA before processing commences.

| # | Processor Name | DPA Ref | Version | Execution Date | Expiry Date | Sub-processors Approved | Last Audit Date | Next Audit | Security Cert | Risk Rating | Status |
|---|---------------|---------|---------|----------------|-------------|------------------------|----------------|-----------|--------------|------------|--------|
| 1 | [Processor] | DPA-[#] | [v1.0] | [Date] | [Date] | [List] | [Date] | [Date] | [ISO/SOC] | [H/M/L] | Active |

REVIEW: Quarterly | RESPONSIBLE: [DPO Name] | STORAGE: [Secure digital repository path]

Cross-references: DPA Template (POL-007), Processor Register (GOV-006)`, status: "not-started", notes: "" },

      { id: "p2-9", requirement: "Draft Data Sharing Agreement", dpdpRef: "Sec 8(3), Rule 14", templateTitle: "Data Sharing Agreement Template", templateContent: `════════════════════════════════════════════════════════════════════
DATA SHARING AGREEMENT
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-009 | Version: v1.0
Owner: Legal / DPO | Review Date: [Date]

RECITALS:
This Agreement is entered into on [Date] between [Organisation Name] ("Disclosing Party") and [Receiving Party Name] ("Receiving Party") to govern the sharing of personal data pursuant to Sec 8(3) of the DPDP Act, 2023 and Rule 14.

1. DEFINITIONS: [15+ defined terms as per DPA template above]

2. PURPOSE: Sharing of personal data for [specify purpose].
3. DATA CATEGORIES: [List all personal data categories]
4. DATA PRINCIPALS: [Specify — customers, employees, etc.]
5. LEGAL BASIS: [Sec 6 (Consent) / Sec 7 (Legitimate Use)]

6. OBLIGATIONS OF RECEIVING PARTY:
6.1 Process only for stated purpose
6.2 Implement equivalent security safeguards (Sec 8(4))
6.3 Not further share without written consent
6.4 Assist with DSR requests
6.5 Notify data breaches within 24 hours

7. SECURITY REQUIREMENTS: Minimum ISO 27001 / SOC 2 controls
8. RETENTION & DELETION: Retained for [Period], securely deleted thereafter within 30 days
9. AUDIT RIGHTS: Annual audit with 14 days notice
10. GOVERNING LAW: Indian law, courts of [City]
11. TERMINATION: Data return/deletion within 30 days
12. INDEMNIFICATION: Standard mutual indemnification clause
13. ENTIRE AGREEMENT: This Agreement supersedes all prior agreements

SIGNED:
Disclosing Party: _____________________ | Receiving Party: _____________________

Cross-references: DPA Template (POL-007), Privacy Notice (POL-001)`, status: "not-started", notes: "" },

      { id: "p2-10", requirement: "Execute Controller-to-Controller Agreement", dpdpRef: "Sec 10", templateTitle: "Controller-to-Controller Agreement", templateContent: `════════════════════════════════════════════════════════════════════
CONTROLLER-TO-CONTROLLER DATA TRANSFER AGREEMENT
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-010 | Version: v1.0

Between: [Controller A — Organisation Name] and [Controller B]
Date: [Date]

RECITALS: Each Party independently determines purposes and means of processing. This agreement governs data transfers between independent controllers per Sec 10 of the DPDP Act, 2023.

1. DEFINITIONS: [15+ defined terms aligned to DPDP Act]
2. SCOPE: Transfer of [data categories] for [purposes]
3. EACH CONTROLLER SHALL:
   - Maintain its own legal basis for processing (Sec 4-7)
   - Provide appropriate privacy notices (Sec 5)
   - Implement adequate security measures (Sec 8(4))
   - Respond to DSR requests for data it controls (Sec 11-14)
   - Conduct DPIAs where required (Sec 8(9))
4. LIABILITY: Each controller independently liable for its processing activities
5. BREACH NOTIFICATION: Mutual notification within 24 hours
6. AUDIT RIGHTS: Annual with 14 days notice
7. GOVERNING LAW: Indian law, courts of [City]
8. TERMINATION: Data return/deletion within 30 days
9. INDEMNIFICATION: Each party indemnifies the other
10. ENTIRE AGREEMENT

SIGNED: [Controller A] | [Controller B]

Cross-references: Joint Controller Agreement (GOV-007), DPA Template (POL-007)`, status: "not-started", notes: "" },

      { id: "p2-11", requirement: "Establish Data Retention & Deletion Policy", dpdpRef: "Sec 8(7), Rule 8", templateTitle: "Data Retention Policy", templateContent: `════════════════════════════════════════════════════════════════════
DATA RETENTION & DELETION POLICY
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-011 | Version: v1.0
Owner: DPO | Review Date: [Date]

1. PURPOSE: Define retention periods and deletion procedures for all personal data per Sec 8(7) and Rule 8. Personal data shall not be retained beyond what is necessary for the specified purpose.

Penalty Exposure: Retention beyond the specified period without lawful basis may attract penalties under Sec 33.

2. SCOPE: All personal data across all systems, databases, backups, and physical records.

3. RETENTION SCHEDULE:
| Data Category | System | Retention Period | Legal Basis | Trigger for Deletion | Deletion Method | Automated (Y/N) |
|--------------|--------|-----------------|-------------|---------------------|----------------|-----------------|
| Customer data | CRM | Service duration + 3 years | Sec 7(a) | Account closure + 3 years | Secure wipe | Yes |
| Employee data | HRMS | Employment + 7 years | Labour laws, Tax laws | Separation date + 7 years | Secure wipe | Yes |
| Marketing consent | Marketing Platform | Until withdrawal | Sec 6 | Consent withdrawal | Immediate deletion | Yes |
| CCTV footage | NVR | 90 days | Sec 7(b) | Auto-overwrite | Overwrite | Yes |
| Audit logs | SIEM | 3 years | Sec 8(8) | Calendar | Archive + delete | Semi-auto |
| Backup data | Backup System | Primary + 30 days | Operational | Primary deletion + 30 days | Secure erase | Yes |

4. DELETION PROCEDURES: See Erasure Procedure SOP (POL-012)
5. EXCEPTIONS: Data required for ongoing litigation, regulatory investigation, or legal obligation
6. REVIEW: Annual review of retention schedule by DPO
7. CROSS-REFERENCES: Erasure Procedure SOP (POL-012), RoPA (POL-013)

COMPLIANCE MATRIX:
| Clause | Obligation | Status |
|--------|-----------|--------|
| 3 | Sec 8(7) — Retention limitation | [Status] |
| 4 | Rule 8 — Deletion procedures | [Status] |

DOCUMENT CONTROL: Prepared By: [Name] | Reviewed By: [DPO Name] | Approved By: [CIO/Legal]`, status: "not-started", notes: "" },

      { id: "p2-12", requirement: "Document Data Deletion / Erasure Procedure SOP", dpdpRef: "Sec 12(3), Rule 8", templateTitle: "Erasure Procedure SOP", templateContent: `════════════════════════════════════════════════════════════════════
DATA DELETION / ERASURE PROCEDURE — SOP
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-012 | Version: v1.0
Owner: DPO / IT | Review Date: [Date]

1. PURPOSE: Standardise data deletion procedures per Sec 12(3) and Rule 8.

2. TRIGGER EVENTS: Consent withdrawal (Sec 6(4)), Purpose fulfilment, Retention period expiry (Sec 8(7)), Erasure request from Data Principal (Sec 12(3)), Account closure.

3. PROCEDURE WITH RACI:
| Step | Action | Responsible | Accountable | Consulted | Informed | SLA | Evidence/Artefact |
|------|--------|------------|-------------|-----------|---------|-----|-------------------|
| 1 | Receive and log deletion request/trigger | Privacy Analyst | DPO | IT | Requester | Same day | Request log entry |
| 2 | Verify identity of Data Principal (if DSR) | Privacy Analyst | DPO | — | — | 2 days | Verification record |
| 3 | Identify all systems containing relevant data | IT Data Engineer | CIO | DPO | — | 3 days | System inventory report |
| 4 | Execute deletion across primary systems | IT Data Engineer | CIO | DPO | — | 5 days | Deletion confirmation |
| 5 | Execute deletion from backup systems | IT Backup Admin | CIO | DPO | — | 30 days | Backup purge log |
| 6 | Confirm deletion from third-party processors | Compliance Coord | DPO | Legal | — | 14 days | Processor confirmation |
| 7 | Log deletion with timestamp and operator ID | Privacy Analyst | DPO | — | — | Same day | Deletion register entry |
| 8 | Issue confirmation to Data Principal | Privacy Analyst | DPO | — | Data Principal | 2 days | Confirmation email/letter |

4. DECISION TREE — EDGE CASES:
- Data subject to legal hold → DO NOT DELETE → Escalate to Legal → Resume after hold lifted
- Data shared with sub-processors → Trigger processor deletion per DPA terms
- Data in backups → Delete at next backup cycle (max 30 days)
- Partial erasure request → Delete specified categories only, log partial deletion

5. ESCALATION PATH:
| Scenario | Escalate To | SLA |
|----------|-----------|-----|
| Identity verification failure | DPO | 2 business days |
| System access issues | IT Security Lead | 4 hours |
| Legal hold conflict | Legal Counsel → DPO | 1 business day |
| Processor non-compliance | DPO → Legal → Procurement | 5 business days |

6. EXCEPTION HANDLING: Data required for legal obligation, ongoing litigation, or regulatory investigation is exempt. Document exception with legal basis and review date.

7. TIMELINE: Total deletion within [30 days] of trigger (including backup cycles).

DOCUMENT CONTROL: Prepared By: [Name] | Approved By: [DPO Name]
Cross-references: Data Retention Policy (POL-011), Rights Request Procedure (POL-019)`, status: "not-started", notes: "" },

      { id: "p2-13", requirement: "Maintain Records of Processing Activities (RoPA)", dpdpRef: "Sec 8(8), Rule 6", templateTitle: "RoPA Template", templateContent: `════════════════════════════════════════════════════════════════════
RECORDS OF PROCESSING ACTIVITIES (RoPA)
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-013 | Version: v1.0
Owner: DPO | Review Date: [Date]

1. PURPOSE: Maintain comprehensive records per Sec 8(8) and Rule 6. Mandatory for all Data Fiduciaries.

2. DATA DICTIONARY:
| Field | Description | Mandatory |
|-------|-----------|-----------|
| Processing Activity * | Name of the activity | Yes |
| Purpose * | Specific purpose(s) | Yes |
| Legal Basis * | Sec 6 (Consent) / Sec 7 (Legitimate Use) | Yes |
| Data Categories * | Types of personal data | Yes |
| Data Principals * | Categories of individuals | Yes |
| Recipients | Internal/external recipients | Yes |
| Cross-border Transfers | Countries, safeguards | If applicable |
| Retention Period * | Duration | Yes |
| Security Measures * | Controls applied | Yes |
| DPIA Required | Yes/No | Yes |
| Last Review Date * | Date | Yes |

3. REGISTER:
| # | Processing Activity | Department | Purpose | Legal Basis | Data Categories | Data Principals | Recipients | Transfers | Retention | Security | DPIA | Review Date |
|---|--------------------|-----------|---------|-----------|-----------------|-----------------|-----------|-----------|-----------|---------|----|------------|
| 1 | [Activity] | [Dept] | [Purpose] | [Basis] | [Categories] | [Principals] | [Recipients] | [Countries] | [Period] | [Measures] | [Y/N] | [Date] |

4. REVIEW: Quarterly | 5. RETENTION OF REGISTER: Duration of processing + 5 years
6. REGULATORY BASIS: Sec 8(8), Rule 6

DOCUMENT CONTROL: Maintained By: [DPO Name] | Review: Quarterly
Cross-references: Data Flow Diagram (GOV-003), DPIA Framework (POL-014)`, status: "not-started", notes: "" },

      { id: "p2-14", requirement: "Create DPIA Framework", dpdpRef: "Sec 8(9), Rule 10", templateTitle: "DPIA Framework Template", templateContent: `════════════════════════════════════════════════════════════════════
DATA PROTECTION IMPACT ASSESSMENT (DPIA) FRAMEWORK
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-014 | Version: v1.0
Owner: DPO | Review Date: [Date]

1. PURPOSE: Establish the DPIA process per Sec 8(9) and Rule 10. DPIAs must be conducted before initiating any high-risk processing activity.

2. WHEN IS A DPIA REQUIRED:
- New processing involving high-risk personal data
- Large-scale processing of sensitive personal data
- Systematic monitoring of Data Principals
- Use of new technologies (AI/ML, biometrics, IoT)
- Automated decision-making with significant effects
- Processing of children's data at scale

3. DPIA PROCESS WITH RACI:
| Step | Action | Responsible | Accountable | SLA |
|------|--------|------------|-------------|-----|
| 1 | Identify need for DPIA | Project Owner | DPO | Before processing starts |
| 2 | Describe the processing | Project Owner | DPO | 5 days |
| 3 | Assess necessity and proportionality | Privacy Analyst | DPO | 5 days |
| 4 | Identify and assess risks | Privacy Analyst + IT Security | DPO | 10 days |
| 5 | Identify mitigation measures | Project Team | DPO | 5 days |
| 6 | Calculate residual risk | Privacy Analyst | DPO | 3 days |
| 7 | Document outcomes and sign-off | Privacy Analyst | DPO | 2 days |
| 8 | Register in DPIA Register (POL-015) | Privacy Analyst | DPO | Same day |

4. 5×5 RISK ASSESSMENT MATRIX:
| | Impact 1 (Negligible) | Impact 2 (Minor) | Impact 3 (Moderate) | Impact 4 (Major) | Impact 5 (Severe) |
|---|---|---|---|---|---|
| Likelihood 5 (Almost Certain) | 5 | 10 | 15 | 20 | 25 |
| Likelihood 4 (Likely) | 4 | 8 | 12 | 16 | 20 |
| Likelihood 3 (Possible) | 3 | 6 | 9 | 12 | 15 |
| Likelihood 2 (Unlikely) | 2 | 4 | 6 | 8 | 10 |
| Likelihood 1 (Rare) | 1 | 2 | 3 | 4 | 5 |

Risk Levels: Critical (20-25) → STOP, escalate to Board | High (15-19) → DPO + Senior Mgmt approval required | Medium (10-14) → DPO approval | Low (1-9) → Proceed with documented controls

5. RESIDUAL RISK CALCULATION: Residual Risk Score = (Likelihood after mitigation) × (Impact after mitigation)
Escalation Threshold: Residual risks scoring ≥ 15 MUST be escalated to the Board for decision.

6. DPO SIGN-OFF: Mandatory DPO sign-off before any processing commences.

DOCUMENT CONTROL: Prepared By: [Name] | Approved By: [DPO Name]
Cross-references: DPIA Register (POL-015), RoPA (POL-013), Privacy by Design Checklist (POL-037)`, status: "not-started", notes: "" },

      { id: "p2-15", requirement: "Maintain DPIA Register", dpdpRef: "Sec 8(9), Rule 10", templateTitle: "DPIA Register", templateContent: `════════════════════════════════════════════════════════════════════
DPIA REGISTER
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-015 | Version: v1.0
Owner: DPO | Review Date: [Date]

PURPOSE: Central register of all DPIAs per Sec 8(9), Rule 10.

DATA DICTIONARY:
| Field | Description | Mandatory |
|-------|-----------|-----------|
| DPIA ID * | Unique identifier | Yes |
| Processing Activity * | Name | Yes |
| DPIA Date * | Completion date | Yes |
| Initial Risk Level * | Pre-mitigation | Yes |
| Residual Risk Level * | Post-mitigation | Yes |
| Outcome * | Approved/Rejected/Conditional | Yes |
| DPO Sign-off * | Name and date | Yes |
| Board Escalated | Y/N | If risk ≥ 15 |
| Next Review * | Date | Yes |

REGISTER:
| # | DPIA ID | Processing Activity | Date | Initial Risk | Mitigations | Residual Risk | Outcome | DPO Sign-off | Board Escalated | Next Review |
|---|---------|--------------------|----|-------------|------------|--------------|---------|-------------|----------------|------------|
| 1 | DPIA-[#] | [Activity] | [Date] | [Score] | [Summary] | [Score] | [Approved] | [DPO Name, Date] | [Y/N] | [Date] |

REVIEW: Quarterly | RETENTION: Duration of processing + 5 years

Cross-references: DPIA Framework (POL-014), RoPA (POL-013)`, status: "not-started", notes: "" },

      { id: "p2-16", requirement: "Document Legitimate Use Register (Sec 4 Basis)", dpdpRef: "Sec 7, Rule 5", templateTitle: "Legitimate Use Register", templateContent: `════════════════════════════════════════════════════════════════════
LEGITIMATE USE REGISTER
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-016 | Version: v1.0
Owner: DPO | Review Date: [Date]

PURPOSE: Document all processing activities relying on Sec 7 (Legitimate Uses) rather than consent, per Rule 5.

REGISTER:
| # | Processing Activity | Sec 7 Sub-clause | Specific Justification | Data Categories | Data Principals | Proportionality Assessment | Review Date |
|---|--------------------|-----------------|-----------------------|-----------------|-----------------|--------------------------|-----------| 
| 1 | [Activity] | Sec 7(a) — Specified purpose | [Justification] | [Categories] | [Principals] | [Assessment] | [Date] |
| 2 | [Activity] | Sec 7(b) — State function | [Justification] | [Categories] | [Principals] | [Assessment] | [Date] |
| 3 | [Activity] | Sec 7(c) — Legal obligation | [Justification] | [Categories] | [Principals] | [Assessment] | [Date] |

NOTE: Each legitimate use must be reassessed annually or if processing activity changes materially.

Cross-references: RoPA (POL-013), Consent Management Policy (POL-004)`, status: "not-started", notes: "" },

      { id: "p2-17", requirement: "Establish Children's Data Processing Policy", dpdpRef: "Sec 9, Rule 11", templateTitle: "Children's Data Policy", templateContent: `════════════════════════════════════════════════════════════════════
CHILDREN'S DATA PROCESSING POLICY
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-017 | Version: v1.0
Owner: DPO | Review Date: [Date]

1. PURPOSE: Govern processing of personal data of children (persons under 18 years) per Sec 9 and Rule 11. Penalty: Up to ₹200 Crore per Sec 33 for non-compliance.

2. SCOPE: Any processing of personal data where the Data Principal is under 18 years.

3. KEY REQUIREMENTS:
Clause 3.1: Verifiable parental/guardian consent REQUIRED before any processing (Sec 9(1))
Clause 3.2: NO behavioural tracking or targeted advertising directed at children (Sec 9(3))
Clause 3.3: NO processing that causes detrimental effect to the well-being of a child (Sec 9(4))
Clause 3.4: Age verification mechanism mandatory (Rule 11)
Clause 3.5: Data minimisation — only data strictly necessary
Clause 3.6: Enhanced security measures for children's data
Clause 3.7: Parental access to child's data on request
Clause 3.8: Immediate deletion upon parental request or age attainment (if purpose fulfilled)

4. AGE VERIFICATION: Method: [Date of birth / Age gate / ID verification / Parental attestation]
5. PARENTAL CONSENT PROCEDURE: See POL-018
6. DPIA: Mandatory DPIA before any processing of children's data at scale

Privacy by Design (ISO 31700): Children's data protection must be embedded into system design from inception.

Data Principal Rights: Parents/guardians may exercise all rights under Sec 11-14 on behalf of the child.

DOCUMENT CONTROL: Prepared By: [Name] | Approved By: [DPO Name]
Cross-references: Parental Consent Procedure (POL-018), Privacy Notice (POL-001)`, status: "not-started", notes: "" },

      { id: "p2-18", requirement: "Document Parental / Guardian Consent Procedure", dpdpRef: "Sec 9(1), Rule 11", templateTitle: "Parental Consent Procedure", templateContent: `════════════════════════════════════════════════════════════════════
PARENTAL / GUARDIAN CONSENT PROCEDURE — SOP
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-018 | Version: v1.0

PROCEDURE WITH RACI:
| Step | Action | Responsible | Accountable | SLA | Evidence |
|------|--------|------------|-------------|-----|---------|
| 1 | Detect user under 18 (age verification) | System/UI | Product Owner | Immediate | Age gate log |
| 2 | Block processing, notify child | System | DPO | Immediate | UI notification |
| 3 | Collect parent/guardian contact info | System | Product Owner | Same session | Contact record |
| 4 | Send consent request to parent | Privacy Analyst | DPO | 24 hours | Email/SMS record |
| 5 | Parent provides verifiable consent | Parent | DPO | 7 days | Consent artefact |
| 6 | Verify parental identity | Privacy Analyst | DPO | 3 days | Verification record |
| 7 | Activate child account | System | Product Owner | Same day | Activation log |
| 8 | Store consent artefact | System | DPO | Immediate | Consent register |

IDENTITY VERIFICATION METHODS: Government ID, Video KYC, Credit card micro-charge, Trusted digital identity

WITHDRAWAL: Parent may withdraw consent at any time. Processing ceases and data deleted within 7 days.

EXCEPTION: If consent not received within 14 days, all collected data is permanently deleted.

Cross-references: Children's Data Policy (POL-017), Consent Management Policy (POL-004)`, status: "not-started", notes: "" },

      { id: "p2-19", requirement: "Create Data Principal Rights Request Procedure", dpdpRef: "Sec 11-14, Rule 7", templateTitle: "Rights Request Procedure", templateContent: `════════════════════════════════════════════════════════════════════
DATA PRINCIPAL RIGHTS REQUEST PROCEDURE
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-019 | Version: v1.0
Owner: DPO | Review Date: [Date]

1. PURPOSE: Establish procedure for handling DSR requests per Sec 11-14 and Rule 7.

2. RIGHTS COVERED:
| Right | Section | Description | Response SLA |
|-------|---------|------------|-------------|
| Access | Sec 11 | Summary of personal data and processing activities | 30 days |
| Correction | Sec 12(1) | Correction of inaccurate/incomplete data | 30 days |
| Erasure | Sec 12(3) | Deletion of data no longer necessary | 30 days |
| Grievance Redressal | Sec 13 | Complaint resolution | 30 days (acknowledge: 48 hrs) |
| Nomination | Sec 14 | Nominate person for posthumous rights | 30 days |

3. REQUEST CHANNELS: Online portal [URL], Email [DPO Email], Written to [Address]

4. PROCEDURE WITH RACI:
| Step | Action | Responsible | Accountable | SLA | Evidence |
|------|--------|------------|-------------|-----|---------|
| 1 | Receive and log request | DSR Handler | DPO | Same day | Request register |
| 2 | Acknowledge receipt | DSR Handler | DPO | 48 hours | Acknowledgement email |
| 3 | Verify Data Principal identity | DSR Handler | DPO | 3 days | Verification record |
| 4 | Assess request validity | Privacy Analyst | DPO | 5 days | Assessment note |
| 5 | Locate all relevant data | IT + Departments | CIO | 7 days | Data inventory |
| 6 | Process request | DSR Handler | DPO | 10 days | Processing record |
| 7 | Quality review | Privacy Analyst | DPO | 2 days | QA checklist |
| 8 | Communicate outcome | DSR Handler | DPO | 2 days | Response letter |
| 9 | Log completion | DSR Handler | DPO | Same day | Tracker update |

5. DECISION TREE:
- Valid request + Identity verified → Process within SLA
- Identity not verified → Request additional verification (3 days extension)
- Request manifestly unfounded/excessive → DPO may refuse with written reasons
- Request affects third-party rights → Redact third-party data, process remainder

6. ESCALATION:
| Scenario | Escalate To | SLA |
|----------|-----------|-----|
| Complex/cross-system request | DPO | 5 days |
| Request denied | DPO → Legal | 3 days |
| DPBI inquiry | DPO → Board | Immediate |

Cross-references: Rights Request Tracker (POL-020), Grievance Policy (POL-021), Erasure SOP (POL-012)`, status: "not-started", notes: "" },

      { id: "p2-20", requirement: "Maintain Rights Request Log / Tracker", dpdpRef: "Sec 11-14, Rule 7", templateTitle: "Rights Request Tracker", templateContent: `════════════════════════════════════════════════════════════════════
DATA PRINCIPAL RIGHTS REQUEST TRACKER
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-020 | Version: v1.0

| Request ID | Date Received | Channel | Data Principal | Right Exercised | Identity Verified | Status | Response Date | Outcome | Handled By | Notes |
|-----------|--------------|---------|---------------|----------------|------------------|--------|--------------|---------|------------|-------|
| DSR-[#] | [Date] | [Channel] | [Name/ID] | [Right] | [Y/N] | [Open/In Progress/Closed] | [Date] | [Fulfilled/Denied/Partial] | [Name] | [Notes] |

SUMMARY DASHBOARD:
Total Requests (YTD): [Number] | Open: [Number] | Average Response Time: [Days] | SLA Compliance: [%]

REVIEW: Monthly by DPO | RETENTION: 5 years
Cross-references: Rights Request Procedure (POL-019)`, status: "not-started", notes: "" },

      { id: "p2-21", requirement: "Establish Grievance Redressal Policy & Escalation Matrix", dpdpRef: "Sec 13, Rule 7(3)", templateTitle: "Grievance Redressal Policy", templateContent: `════════════════════════════════════════════════════════════════════
GRIEVANCE REDRESSAL POLICY & ESCALATION MATRIX
════════════════════════════════════════════════════════════════════

Classification: INTERNAL | Document Reference: POL-021 | Version: v1.0
Owner: DPO | Review Date: [Date]

1. PURPOSE: Provide accessible grievance mechanism per Sec 13 and Rule 7(3). Data Principals have the right to have grievances addressed within prescribed timelines.

2. CHANNELS: Email: [Email] | Portal: [URL] | Written: [Address] | Phone: [Number]

3. ESCALATION MATRIX:
| Level | Escalation To | Timeline | Trigger | SLA |
|-------|--------------|----------|---------|----|
| L1 | Privacy Team | 7 calendar days | Initial complaint | Acknowledge in 48 hrs |
| L2 | DPO | 14 calendar days | Unresolved at L1 or complex | DPO review in 3 days |
| L3 | Board / Senior Management | 21 calendar days | Unresolved at L2 | Board decision in 7 days |
| L4 | DPBI (External) | 30 calendar days | Unresolved at L3 | Data Principal's right |

4. RESPONSE COMMITMENT: Acknowledgement within 48 hours. Resolution within 30 days. Written response with reasons if complaint rejected.

5. NON-RETALIATION: No adverse action against any Data Principal exercising grievance rights.

DOCUMENT CONTROL: Prepared By: [Name] | Approved By: [DPO Name]
Cross-references: Rights Request Procedure (POL-019), Whistleblower Policy (POL-035)`, status: "not-started", notes: "" },

      { id: "p2-22", requirement: "Create Data Breach / Incident Response Policy", dpdpRef: "Sec 8(6), Rule 9", templateTitle: "Breach Response Policy", templateContent: `════════════════════════════════════════════════════════════════════
DATA BREACH / INCIDENT RESPONSE POLICY
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-022 | Version: v1.0
Owner: DPO / CISO | Review Date: [Date]

1. PURPOSE: Establish breach detection, response, and notification procedures per Sec 8(6) and Rule 9. Penalty for failure to notify: Up to ₹200 Crore per Sec 33.

2. INCIDENT RESPONSE TEAM:
| Role | Name | Contact | Responsibility |
|------|------|---------|---------------|
| Incident Commander | [DPO Name] | [Contact] | Overall coordination |
| IT Security Lead | [Name] | [Contact] | Technical containment |
| Legal Counsel | [Name] | [Contact] | Regulatory/legal advice |
| Communications | [Name] | [Contact] | Stakeholder notification |
| HR Representative | [Name] | [Contact] | Employee-related breaches |

3. RESPONSE PROCEDURE WITH RACI & SLA:
| Step | Action | Responsible | Accountable | SLA | Evidence |
|------|--------|------------|-------------|-----|---------|
| 1 | Detection and initial triage | SOC / IT Security | CISO | 1 hour | Incident ticket |
| 2 | Escalation to DPO | IT Security Lead | DPO | 4 hours | Escalation record |
| 3 | Containment and mitigation | IT Security Team | CISO | 8 hours | Containment report |
| 4 | Impact assessment and classification | Privacy Analyst + IT | DPO | 24 hours | Impact assessment |
| 5 | DPBI notification (if qualifying breach) | DPO | Board | 72 hours (Rule 9(2)) | DPBI notification |
| 6 | Data Principal notification | DPO + Comms | Board | Without undue delay | Notification records |
| 7 | Root cause analysis | IT Security | CISO | 14 days | RCA report |
| 8 | Remediation and improvement | Project Team | DPO | 30 days | Remediation plan |
| 9 | Post-incident review | All | DPO | 30 days | Lessons learned |

4. BREACH CLASSIFICATION:
| Severity | Criteria | DPBI Notification | DP Notification |
|----------|---------|-------------------|----------------|
| Critical | Sensitive data, >10,000 principals | Mandatory (72 hrs) | Mandatory |
| High | Personal data, >1,000 principals | Mandatory (72 hrs) | Required |
| Medium | Limited data, <1,000 principals | Assess per criteria | Assess |
| Low | No personal data / contained immediately | No | No |

DOCUMENT CONTROL: Approved By: [DPO Name] + [CISO Name]
Cross-references: Breach Notification SOP (POL-023), Breach Register (POL-024)`, status: "not-started", notes: "" },

      { id: "p2-23", requirement: "Document Breach Notification SOP (to DPBI)", dpdpRef: "Sec 8(6), Rule 9(2)", templateTitle: "Breach Notification SOP", templateContent: `════════════════════════════════════════════════════════════════════
BREACH NOTIFICATION SOP — TO DPBI
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-023 | Version: v1.0

CRITICAL TIMELINE: Notification to DPBI within 72 hours of becoming aware (Rule 9(2)).

NOTIFICATION CONTENT (Rule 9(2)):
1. Nature of the breach
2. Categories and approximate number of Data Principals affected
3. Categories of personal data involved
4. Likely consequences of the breach
5. Measures taken or proposed to address the breach
6. Measures taken to mitigate possible adverse effects
7. DPO contact details

PROCEDURE:
| Step | Action | Responsible | SLA |
|------|--------|------------|-----|
| 1 | DPO reviews breach assessment report | DPO | Within 24 hours of detection |
| 2 | Prepare DPBI notification in prescribed format | Privacy Analyst | Within 48 hours |
| 3 | DPO approves notification | DPO | Within 60 hours |
| 4 | Submit via DPBI prescribed channel | DPO Office | Within 72 hours |
| 5 | File acknowledgement receipt | DPO Office | Same day |
| 6 | Prepare Data Principal notification (if required) | Comms + DPO | Within 7 days |

Cross-references: Breach Response Policy (POL-022), Breach Register (POL-024)`, status: "not-started", notes: "" },

      { id: "p2-24", requirement: "Maintain Breach Register", dpdpRef: "Sec 8(6), Rule 9", templateTitle: "Breach Register", templateContent: `════════════════════════════════════════════════════════════════════
BREACH REGISTER
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-024 | Version: v1.0
Owner: DPO

DATA DICTIONARY:
| Field | Mandatory | Description |
|-------|-----------|-------------|
| Breach ID * | Yes | Unique identifier |
| Date Detected * | Yes | When breach was discovered |
| Date of Breach | Yes | When breach occurred (if known) |
| Description * | Yes | Nature of the breach |
| Data Categories * | Yes | Types of personal data affected |
| Principals Affected * | Yes | Number and categories |
| Severity * | Yes | Critical/High/Medium/Low |
| DPBI Notified * | Yes | Y/N, date, reference number |
| DP Notified | Yes | Y/N, date, method |
| Root Cause | Yes | Identified cause |
| Remediation Status * | Yes | Open/In Progress/Closed |
| RCA Complete * | Yes | Y/N |

REGISTER:
| # | Breach ID | Date Detected | Description | Data Categories | Principals | Severity | DPBI Notified | DP Notified | Root Cause | Status | RCA |
|---|-----------|--------------|-------------|----------------|-----------|----------|--------------|------------|-----------|--------|-----|
| 1 | BRE-[#] | [Date] | [Description] | [Categories] | [Number] | [Level] | [Y/N, Date, Ref] | [Y/N, Date] | [Cause] | [Status] | [Y/N] |

REVIEW: After each incident + Quarterly summary | RETENTION: Minimum 5 years

Cross-references: Breach Response Policy (POL-022), Breach Notification SOP (POL-023)`, status: "not-started", notes: "" },

      { id: "p2-25", requirement: "Establish Information Security Policy", dpdpRef: "Sec 8(4), Rule 6", templateTitle: "Information Security Policy", templateContent: `════════════════════════════════════════════════════════════════════
INFORMATION SECURITY POLICY
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-025 | Version: v1.0
Owner: CISO / DPO | Review Date: [Date]

1. PURPOSE: Protect personal data through appropriate technical and organisational measures per Sec 8(4). Penalty for inadequate safeguards: Up to ₹250 Crore per Sec 33.

2. KEY CONTROLS (12 Clauses):
Clause 2.1 — Encryption: AES-256 at rest, TLS 1.2+ in transit, key management via [KMS]
Clause 2.2 — Access Control: RBAC, least privilege, MFA for all systems with personal data
Clause 2.3 — Network Security: Firewall, IDS/IPS, network segmentation, DMZ
Clause 2.4 — Endpoint Security: EDR, device encryption, remote wipe capability
Clause 2.5 — Logging & Monitoring: All access logged, SIEM integration, 1-year retention
Clause 2.6 — Patch Management: Critical patches within 72 hours, high within 7 days
Clause 2.7 — Vulnerability Management: Monthly scans, annual penetration testing
Clause 2.8 — Backup & Recovery: Daily backups, tested quarterly, encrypted
Clause 2.9 — Physical Security: Access control, CCTV, clean desk policy
Clause 2.10 — Change Management: All changes assessed for security impact
Clause 2.11 — Incident Management: See Breach Response Policy (POL-022)
Clause 2.12 — Business Continuity: BCP tested annually

3. SECURITY GOVERNANCE: Annual security audit, quarterly vulnerability reports to Board.

Privacy by Design (ISO 31700): Security controls integrated into system design from inception.

DOCUMENT CONTROL: Approved By: [CISO Name] + [DPO Name]
Cross-references: IAM Policy (POL-026), Breach Response Policy (POL-022)`, status: "not-started", notes: "" },

      { id: "p2-26", requirement: "Define Access Control & IAM Policy", dpdpRef: "Sec 8(4)", templateTitle: "Access Control & IAM Policy", templateContent: `════════════════════════════════════════════════════════════════════
ACCESS CONTROL & IDENTITY AND ACCESS MANAGEMENT POLICY
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-026 | Version: v1.0
Owner: CISO / DPO | Review Date: [Date]

1. PRINCIPLES: Least Privilege, Segregation of Duties, Need-to-Know, Default Deny.

2. ACCESS LIFECYCLE:
Clause 2.1 — Provisioning: Approved by Department Head + DPO for personal data systems. Implemented within 2 business days.
Clause 2.2 — Review: Quarterly access certification by system owners.
Clause 2.3 — Modification: Role change triggers access re-evaluation within 5 days.
Clause 2.4 — De-provisioning: Access revoked within 4 hours of termination/role change notification.
Clause 2.5 — Privileged Access: Separate privileged accounts, just-in-time access, session recording.

3. AUTHENTICATION:
Clause 3.1 — MFA mandatory for all systems containing personal data
Clause 3.2 — Password policy: 12+ chars, complexity, 90-day rotation, no reuse (10 generations)
Clause 3.3 — Session timeout: 15 minutes of inactivity

4. MONITORING: All access to personal data logged. Anomalous access triggers alert. Weekly access review by SOC.

DOCUMENT CONTROL: Approved By: [CISO Name]
Cross-references: Information Security Policy (POL-025)`, status: "not-started", notes: "" },

      { id: "p2-27", requirement: "Prepare Vendor Due Diligence Questionnaire", dpdpRef: "Sec 8(2), Rule 14", templateTitle: "Vendor Due Diligence Questionnaire", templateContent: `════════════════════════════════════════════════════════════════════
VENDOR DUE DILIGENCE QUESTIONNAIRE — DATA PROTECTION
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-027 | Version: v1.0

Vendor Name: [Vendor] | Services: [Services] | Date: [Date]

SECTION A — GOVERNANCE (Weight: 20%):
A1. Is your organisation subject to the DPDP Act, 2023? [Y/N]
A2. Have you appointed a DPO? [Y/N] — Name: [Name]
A3. Do you have a documented data protection policy? [Y/N]
A4. Do you conduct annual data protection training? [Y/N]

SECTION B — SECURITY (Weight: 40%):
B1. ISO 27001 certified? [Y/N] — Certificate expiry: [Date]
B2. SOC 2 Type II report available? [Y/N] — Report period: [Period]
B3. Encryption at rest (AES-256 or equivalent)? [Y/N]
B4. Encryption in transit (TLS 1.2+)? [Y/N]
B5. MFA for all access to personal data? [Y/N]
B6. Annual penetration testing? [Y/N] — Last test: [Date]
B7. Vulnerability management programme? [Y/N]
B8. SIEM/logging in place? [Y/N]
B9. Incident response plan tested? [Y/N]
B10. Data backup and recovery tested? [Y/N]

SECTION C — DATA HANDLING (Weight: 25%):
C1. Where is personal data stored? [Specify — India/Other]
C2. Data localisation compliance for restricted data? [Y/N]
C3. Data retention policy documented? [Y/N]
C4. Ability to delete data upon termination within 30 days? [Y/N]
C5. Sub-processors used? [Y/N] — List: [Names]
C6. Cross-border transfers? [Y/N] — Countries: [List]

SECTION D — COMPLIANCE (Weight: 15%):
D1. Previous data breaches in last 3 years? [Y/N] — Details: [Details]
D2. Regulatory actions/penalties? [Y/N] — Details: [Details]
D3. Willing to sign DPA with audit rights? [Y/N]
D4. Insurance covering data protection liabilities? [Y/N]

RISK SCORING: [Calculated] | RECOMMENDATION: [Approve / Conditional / Reject]

Cross-references: Processor Register (GOV-006), DPA Template (POL-007), Third-Party Risk Register (POL-028)`, status: "not-started", notes: "" },

      { id: "p2-28", requirement: "Maintain Third-Party Risk Assessment Register", dpdpRef: "Sec 8(2)", templateTitle: "Third-Party Risk Register", templateContent: `════════════════════════════════════════════════════════════════════
THIRD-PARTY RISK ASSESSMENT REGISTER
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-028 | Version: v1.0

5×5 RISK MATRIX SCORING:
| Risk Level | Score | Action Required |
|-----------|-------|----------------|
| Critical | 20-25 | Immediate remediation or terminate |
| High | 15-19 | Board notification, enhanced monitoring |
| Medium | 10-14 | DPO approval, quarterly monitoring |
| Low | 1-9 | Annual review |

REGISTER:
| # | Vendor | Services | Data Categories | Volume | Risk Score | DPA Status | Security Cert | Last Assessment | Next Assessment | Residual Risk | DPO Approved |
|---|--------|---------|-----------------|--------|-----------|-----------|--------------|----------------|----------------|--------------|-------------|
| 1 | [Vendor] | [Services] | [Categories] | [Volume] | [Score] | [Active/Pending] | [ISO/SOC/None] | [Date] | [Date] | [Score] | [Y/N, Date] |

Escalation: Vendors with risk score ≥ 15 must be escalated to Board.

Cross-references: Vendor Due Diligence (POL-027), Processor Register (GOV-006)`, status: "not-started", notes: "" },

      { id: "p2-29", requirement: "Conduct Cross-Border Transfer Risk Assessment", dpdpRef: "Sec 16, Rule 15", templateTitle: "Cross-Border Transfer Risk Assessment", templateContent: `════════════════════════════════════════════════════════════════════
CROSS-BORDER DATA TRANSFER RISK ASSESSMENT
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-029 | Version: v1.0

TRANSFER DETAILS:
Data Categories: [Specify] | Destination Country: [Country] | Recipient: [Entity] | Purpose: [Purpose]

5×5 RISK MATRIX:
| Risk Factor | Likelihood (1-5) | Impact (1-5) | Risk Score | Mitigation |
|------------|-----------------|-------------|------------|-----------|
| Inadequate legal protection | [Score] | [Score] | [Score] | [Mitigation] |
| Government surveillance risk | [Score] | [Score] | [Score] | [Mitigation] |
| Enforcement gap | [Score] | [Score] | [Score] | [Mitigation] |
| Recipient security maturity | [Score] | [Score] | [Score] | [Mitigation] |
| Data sensitivity | [Score] | [Score] | [Score] | [Mitigation] |

OVERALL RISK: [Score] / 125 | RESIDUAL RISK (after mitigations): [Score]
Escalation: Risk score ≥ 15 on any factor requires Board approval.

CHECKS:
1. Destination on Sec 16(1) restricted list? [Y/N]
2. SCCs in place? [Y/N]
3. Recipient security assessment completed? [Y/N]
4. DPO sign-off obtained? [Y/N]

DPO SIGN-OFF: [DPO Name] | Date: [Date]
Linkage: DPIA Register (POL-015)

Cross-references: SCCs (POL-030), Data Flow Diagram (GOV-003)`, status: "not-started", notes: "" },

      { id: "p2-30", requirement: "Prepare Standard Contractual Clauses / Transfer Safeguards", dpdpRef: "Sec 16(2)", templateTitle: "Standard Contractual Clauses Template", templateContent: `════════════════════════════════════════════════════════════════════
STANDARD CONTRACTUAL CLAUSES — DATA TRANSFER SAFEGUARDS
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-030 | Version: v1.0

RECITALS:
Between: [Organisation Name] ("Data Exporter") and [Recipient Name] ("Data Importer")
Purpose: Safeguards for transfer of personal data to [Country] per Sec 16(2).

CLAUSE 1 — DEFINITIONS: [15 defined terms per DPA template]
CLAUSE 2 — OBLIGATIONS OF IMPORTER:
(a) Process only for specified purpose
(b) Implement equivalent security measures (Sec 8(4) standard)
(c) Not further transfer without prior consent and equivalent safeguards
(d) Permit audits by Exporter (annual, 14 days notice)
(e) Cooperate with DSR requests within 5 business days
(f) Notify Exporter within 24 hours of any breach or government access request
CLAUSE 3 — DATA PRINCIPAL RIGHTS: Importer assists in fulfilling rights (Sec 11-14)
CLAUSE 4 — SECURITY ANNEXURE: Minimum ISO 27001 / SOC 2 requirements
CLAUSE 5 — GOVERNING LAW: Indian law, courts of [City]
CLAUSE 6 — TERMINATION: Data return/deletion within 30 days
CLAUSE 7 — INDEMNIFICATION: Importer indemnifies Exporter
CLAUSE 8 — ENTIRE AGREEMENT

SIGNED: Exporter: _____________________ | Importer: _____________________

Cross-references: Cross-Border Risk Assessment (POL-029), DPA Template (POL-007)`, status: "not-started", notes: "" },

      { id: "p2-31", requirement: "Establish Employee Training & Awareness Policy", dpdpRef: "Sec 8(4), Rule 12", templateTitle: "Training & Awareness Policy", templateContent: `════════════════════════════════════════════════════════════════════
EMPLOYEE TRAINING & AWARENESS POLICY — DATA PROTECTION
════════════════════════════════════════════════════════════════════

Classification: INTERNAL | Document Reference: POL-031 | Version: v1.0

1. TRAINING REQUIREMENTS:
Clause 1.1 — Induction: All new employees/contractors within 30 days
Clause 1.2 — Annual Refresher: Mandatory for all staff
Clause 1.3 — Role-specific: Teams handling personal data (quarterly)
Clause 1.4 — Incident Response: IRT members (bi-annual simulation)
Clause 1.5 — Board/Management: Annual briefing on DPDP compliance posture

2. CONTENT COVERAGE: DPDP Act overview, data processing principles, Data Principal rights, breach reporting, consent management, children's data, cross-border transfers, penalties.

3. ASSESSMENT: Post-training test, minimum 80% pass. Failure requires re-training within 14 days.

4. RACI:
| Activity | HR | DPO | Dept Heads | Employees |
|----------|----|----|-----------|----------|
| Develop content | C | A | C | I |
| Schedule training | R | C | C | I |
| Deliver training | R | R | I | R (attend) |
| Track completion | R | A | I | I |

5. NON-COMPLIANCE: Failure to complete mandatory training reported to DPO and may affect performance reviews.

Cross-references: Training Attendance Register (POL-032), Privacy Notice — Employees (POL-002)`, status: "not-started", notes: "" },

      { id: "p2-32", requirement: "Maintain Training Attendance Records", dpdpRef: "Rule 12(3)", templateTitle: "Training Attendance Register", templateContent: `════════════════════════════════════════════════════════════════════
TRAINING ATTENDANCE REGISTER
════════════════════════════════════════════════════════════════════

Classification: INTERNAL | Document Reference: POL-032 | Version: v1.0

| # | Employee Name | Employee ID | Department | Module | Date | Duration | Score | Pass/Fail | Trainer | Notes |
|---|--------------|-----------|-----------|--------|------|----------|-------|-----------|---------|-------|
| 1 | [Name] | [ID] | [Dept] | [Module] | [Date] | [Hours] | [%] | [P/F] | [Trainer] | [Notes] |

SUMMARY: Total: [Number] | Completed: [Number] ([%]) | Pending: [Number] | Failed (re-training): [Number]

REVIEW: Monthly by HR + DPO | RETENTION: 5 years

Cross-references: Training Policy (POL-031)`, status: "not-started", notes: "" },

      { id: "p2-33", requirement: "Draft Internal Audit Charter — Privacy", dpdpRef: "Rule 12(4)", templateTitle: "Internal Audit Charter — Privacy", templateContent: `════════════════════════════════════════════════════════════════════
INTERNAL AUDIT CHARTER — DATA PROTECTION & PRIVACY
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-033 | Version: v1.0

1. PURPOSE: Establish authority, scope, and responsibilities of internal audit for data protection per Rule 12(4).
2. SCOPE: All processing activities, systems, policies, and procedures related to personal data.
3. AUTHORITY: Audit team has unrestricted access to all data processing records, systems, and personnel.
4. INDEPENDENCE: Audit function reports to Audit Committee, independent of DPO.
5. AUDIT CYCLE: Annual comprehensive + Quarterly thematic audits.
6. METHODOLOGY: Risk-based audit plan, aligned to ISO 19011 and ISACA standards.
7. REPORTING: Findings reported to DPO and Board within 30 days of audit completion.

Cross-references: Audit Findings Register (POL-034)`, status: "not-started", notes: "" },

      { id: "p2-34", requirement: "Maintain Audit Findings & Corrective Action Register", dpdpRef: "Rule 12(4)", templateTitle: "Audit Findings Register", templateContent: `════════════════════════════════════════════════════════════════════
AUDIT FINDINGS & CORRECTIVE ACTION REGISTER
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-034 | Version: v1.0

| # | Finding ID | Audit Date | Finding | Severity | DPDP Section | Responsible | Corrective Action | Due Date | Status | Evidence |
|---|-----------|-----------|---------|----------|-------------|-----------|-------------------|---------|--------|---------|
| 1 | AUD-[#] | [Date] | [Description] | [Critical/High/Medium/Low] | [Section] | [Name] | [Action] | [Date] | [Open/Closed] | [Reference] |

SUMMARY: Total: [Number] | Open: [Number] | Overdue: [Number] | Closed: [Number]

REVIEW: Monthly by DPO + Audit Committee

Cross-references: Internal Audit Charter (POL-033)`, status: "not-started", notes: "" },

      { id: "p2-35", requirement: "Establish Whistleblower / Disclosure Policy", dpdpRef: "Sec 8(5)", templateTitle: "Whistleblower Policy", templateContent: `════════════════════════════════════════════════════════════════════
WHISTLEBLOWER / DISCLOSURE POLICY — DATA PROTECTION
════════════════════════════════════════════════════════════════════

Classification: INTERNAL | Document Reference: POL-035 | Version: v1.0

1. PURPOSE: Provide safe reporting channel for data protection violations per Sec 8(5).
2. CHANNELS: Dedicated email: [Email] | Anonymous hotline: [Number] | Sealed letter to Audit Committee Chair
3. SCOPE: Any suspected breach of DPDP Act, this organisation's data protection policies, or mishandling of personal data.
4. PROTECTION: Whistleblowers protected from retaliation — disciplinary, contractual, or professional.
5. INVESTIGATION: All reports investigated within 30 days by independent team.
6. CONFIDENTIALITY: Reporter identity protected unless disclosure required by law.
7. ESCALATION: If investigation reveals regulatory breach, DPO notifies DPBI as required.
8. NON-RETALIATION: Any retaliation is a disciplinary offence subject to termination.

DOCUMENT CONTROL: Approved By: [Board/Audit Committee Chair]
Cross-references: Grievance Policy (POL-021), Breach Response Policy (POL-022)`, status: "not-started", notes: "" },

      { id: "p2-36", requirement: "Draft AI & Automated Decision-Making Policy", dpdpRef: "Sec 8(10), Rule 16", templateTitle: "AI & Automated Decision-Making Policy", templateContent: `════════════════════════════════════════════════════════════════════
AI & AUTOMATED DECISION-MAKING POLICY
════════════════════════════════════════════════════════════════════

Classification: CONFIDENTIAL | Document Reference: POL-036 | Version: v1.0
Owner: DPO / CTO | Review Date: [Date]

1. SCOPE: All AI models, ML algorithms, and automated decision-making systems that use personal data.

2. PRINCIPLES (8 Clauses):
Clause 2.1 — Transparency: Data Principals informed when subject to automated decisions
Clause 2.2 — Fairness: No discrimination based on protected characteristics
Clause 2.3 — Accountability: Human oversight for decisions with significant effects
Clause 2.4 — Privacy by Design (ISO 31700): Data minimisation in AI training data
Clause 2.5 — Explainability: Ability to explain automated decisions in plain language
Clause 2.6 — Accuracy: Regular model validation and bias testing
Clause 2.7 — Security: AI systems protected against adversarial attacks
Clause 2.8 — Record-keeping: All AI decisions logged with reasoning

3. MANDATORY REQUIREMENTS:
- DPIA required before deploying any AI system processing personal data (Sec 8(9))
- Right to human review of automated decisions upon request
- Regular bias audits (at minimum annually)
- AI systems register maintained by [Department]
- No automated profiling of children (Sec 9(3))

4. AI SYSTEMS REGISTER:
| # | System Name | Purpose | Data Categories | Human Oversight | DPIA Ref | Last Bias Audit | Risk Level |
|---|-----------|---------|-----------------|----------------|---------|----------------|-----------|
| 1 | [System] | [Purpose] | [Categories] | [Y/N — Level] | DPIA-[#] | [Date] | [H/M/L] |

Data Principal Rights: Right to request explanation of automated decision, right to human review.

DOCUMENT CONTROL: Approved By: [DPO Name] + [CTO Name]
Cross-references: DPIA Framework (POL-014), Privacy by Design Checklist (POL-037)`, status: "not-started", notes: "" },

      { id: "p2-37", requirement: "Prepare Privacy by Design Checklist", dpdpRef: "Sec 8(4), Rule 6", templateTitle: "Privacy by Design Checklist", templateContent: `════════════════════════════════════════════════════════════════════
PRIVACY BY DESIGN CHECKLIST (ISO 31700 ALIGNED)
════════════════════════════════════════════════════════════════════

Classification: INTERNAL | Document Reference: POL-037 | Version: v1.0

Project/System: [Name] | Date: [Date] | Assessed By: [Name]

| # | Requirement | DPDP Act Ref | Yes | No | N/A | Notes |
|---|-----------|-------------|-----|-----|-----|-------|
| 1 | Data minimisation applied — only necessary data collected? | Sec 8(7) | | | | |
| 2 | Purpose clearly defined and documented? | Sec 5(1)(a) | | | | |
| 3 | Consent mechanism implemented (where applicable)? | Sec 6 | | | | |
| 4 | Privacy notice updated to reflect new processing? | Sec 5 | | | | |
| 5 | Data encrypted at rest and in transit? | Sec 8(4) | | | | |
| 6 | Role-based access controls configured? | Sec 8(4) | | | | |
| 7 | Retention period defined with auto-deletion? | Sec 8(7) | | | | |
| 8 | Deletion mechanism tested and verified? | Sec 12(3), Rule 8 | | | | |
| 9 | Third-party data sharing assessed and DPA in place? | Sec 8(2) | | | | |
| 10 | DPIA conducted (if high-risk processing)? | Sec 8(9) | | | | |
| 11 | Data Principal rights mechanism functional? | Sec 11-14 | | | | |
| 12 | Logging and audit trail enabled? | Sec 8(4) | | | | |
| 13 | Children's data protections applied (if applicable)? | Sec 9 | | | | |
| 14 | Cross-border transfer safeguards in place (if applicable)? | Sec 16 | | | | |
| 15 | Default privacy settings are most restrictive? | ISO 31700 | | | | |
| 16 | Data anonymisation/pseudonymisation applied where possible? | Best practice | | | | |

RESULT: [Pass — All critical items Yes] / [Conditional — Remediation required] / [Fail — Do not proceed]

DPO Sign-off: [DPO Name] | Date: [Date]

Cross-references: DPIA Framework (POL-014), Information Security Policy (POL-025)`, status: "not-started", notes: "" }
    ]
  },
  {
    id: "phase-3",
    phase: 3,
    title: "Rapid Assessment",
    icon: "🔍",
    items: [
      { id: "p3-a1", requirement: "Document consent records and collection mechanisms", dpdpRef: "Sec 6", templateTitle: "Consent Records Evidence Pack", templateContent: `CONSENT RECORDS EVIDENCE PACK\n\nClassification: CONFIDENTIAL | Document Reference: RA-A01 | [Organisation Name] | Domain A — Lawful Processing | Date: [Date]\n\nPURPOSE: Compile evidence of consent management compliance per Sec 6.\n\nEVIDENCE CHECKLIST:\n| # | Evidence Item | Available | Location | Verified By |\n|---|-------------|-----------|----------|------------|\n| 1 | Screenshots of consent collection interfaces (all channels) | [Y/N] | [Location] | [Name] |\n| 2 | Consent artefact samples with timestamps (min 10) | [Y/N] | [Location] | [Name] |\n| 3 | Consent database export (anonymised sample — 100 records) | [Y/N] | [Location] | [Name] |\n| 4 | Consent withdrawal mechanism evidence | [Y/N] | [Location] | [Name] |\n| 5 | Consent audit trail logs (last 6 months) | [Y/N] | [Location] | [Name] |\n| 6 | Consent version history (changes to consent text) | [Y/N] | [Location] | [Name] |\n| 7 | Evidence of no pre-ticked boxes | [Y/N] | [Location] | [Name] |\n\nSTATISTICS:\nTotal Active Consents: [Number] | Withdrawals (12 months): [Number] | Consent Mechanism: [Digital/Physical/Both]\n\nGAP ASSESSMENT:\n| Gap | Risk | Remediation | Owner | Due Date |\n|-----|------|------------|-------|----------|\n| [Gap] | [H/M/L] | [Action] | [Name] | [Date] |\n\nPrepared by: [Name] | Verified by: [DPO Name]`, domain: "Domain A – Lawful Processing", status: "not-started", notes: "" },
      { id: "p3-a2", requirement: "Compile legitimate use documentation and justifications", dpdpRef: "Sec 7", templateTitle: "Legitimate Use Documentation", templateContent: `LEGITIMATE USE DOCUMENTATION\n\nClassification: CONFIDENTIAL | Document Reference: RA-A02 | [Organisation Name] | Domain A | Date: [Date]\n\n| # | Processing Activity | Sec 7 Sub-clause | Justification | Proportionality Assessment | Data Categories | Last Reviewed |\n|---|--------------------|-----------------|--------------|--------------------------|-----------------|--------------|\n| 1 | [Activity] | Sec 7([X]) | [Detailed justification] | [Assessment] | [Categories] | [Date] |\n\nPrepared by: [Name] | Approved by: [DPO Name]`, domain: "Domain A – Lawful Processing", status: "not-started", notes: "" },
      { id: "p3-b1", requirement: "Compile all published privacy notices with delivery evidence", dpdpRef: "Sec 5", templateTitle: "Privacy Notice Compilation", templateContent: `PRIVACY NOTICE COMPILATION & DELIVERY EVIDENCE\n\nClassification: CONFIDENTIAL | Document Reference: RA-B01 | [Organisation Name] | Domain B — Notice & Transparency | Date: [Date]\n\n| # | Notice | Channel | Published Date | URL/Location | Delivery Evidence | Acknowledgements |\n|---|--------|---------|---------------|-------------|-----------------|------------------|\n| 1 | Website Privacy Notice | Website | [Date] | [URL] | Analytics report | N/A |\n| 2 | Employee Privacy Notice | HRMS/Email | [Date] | [Path] | Distribution log | [Number] signed |\n| 3 | CCTV Notice | Physical signage | [Date] | [Locations] | Photos of signage | N/A |\n\nPrepared by: [Name] | Verified by: [DPO Name]`, domain: "Domain B – Notice & Transparency", status: "not-started", notes: "" },
      { id: "p3-b2", requirement: "Maintain notice delivery logs and acknowledgement records", dpdpRef: "Sec 5(2)", templateTitle: "Notice Delivery Log", templateContent: `NOTICE DELIVERY LOG\n\nClassification: INTERNAL | Document Reference: RA-B02 | [Organisation Name] | Domain B | Date: [Date]\n\n| # | Notice Type | Recipient Group | Count | Delivery Method | Date | Acknowledgement Rate | Record Location |\n|---|-----------|----------------|-------|----------------|------|---------------------|----------------|\n| 1 | [Type] | [Group] | [Number] | [Method] | [Date] | [%] | [Location] |\n\nMaintained by: [Name]`, domain: "Domain B – Notice & Transparency", status: "not-started", notes: "" },
      { id: "p3-c1", requirement: "Maintain purpose specification register", dpdpRef: "Sec 5(1)(a)", templateTitle: "Purpose Specification Register", templateContent: `PURPOSE SPECIFICATION REGISTER\n\nClassification: CONFIDENTIAL | Document Reference: RA-C01 | [Organisation Name] | Domain C — Purpose Limitation | Date: [Date]\n\n| # | Processing Activity | Specified Purpose | Legal Basis | Compatible Uses | Review Date |\n|---|--------------------|-----------------|-----------|-----------------|-----------|\n| 1 | [Activity] | [Purpose] | [Sec 6/7] | [Uses] | [Date] |\n\nEach purpose must be specific, explicit, and documented before processing commences (Sec 5(1)(a)).\n\nMaintained by: [DPO Name]`, domain: "Domain C – Purpose Limitation", status: "not-started", notes: "" },
      { id: "p3-c2", requirement: "Document compatible use analysis for secondary processing", dpdpRef: "Sec 5(1)", templateTitle: "Compatible Use Analysis", templateContent: `COMPATIBLE USE ANALYSIS\n\nClassification: CONFIDENTIAL | Document Reference: RA-C02 | [Organisation Name] | Domain C | Date: [Date]\n\n| Original Purpose | Proposed Secondary Use | Compatibility Assessment | Risk Score | Approved (Y/N) | Approved By | Date |\n|-----------------|----------------------|------------------------|-----------|----------------|------------|------|\n| [Purpose] | [Secondary Use] | [Assessment] | [Score] | [Y/N] | [Name] | [Date] |\n\nPrepared by: [Name] | Approved by: [DPO Name]`, domain: "Domain C – Purpose Limitation", status: "not-started", notes: "" },
      { id: "p3-d1", requirement: "Prepare field-level data inventory", dpdpRef: "Sec 8(7)", templateTitle: "Field-Level Data Inventory", templateContent: `FIELD-LEVEL DATA INVENTORY\n\nClassification: CONFIDENTIAL | Document Reference: RA-D01 | [Organisation Name] | Domain D — Data Minimisation | Date: [Date]\n\n| System | Table/Collection | Field Name | Data Type | Personal Data | Sensitive | Purpose | Necessary | Retention | Action Required |\n|--------|-----------------|-----------|-----------|--------------|-----------|---------|-----------|-----------|----------------|\n| [System] | [Table] | [Field] | [Type] | [Y/N] | [Y/N] | [Purpose] | [Y/N] | [Period] | [Keep/Remove/Review] |\n\nFields flagged as unnecessary must be scheduled for removal within [90 days].\n\nPrepared by: [Name] | Reviewed by: [DPO Name]`, domain: "Domain D – Data Minimisation", status: "not-started", notes: "" },
      { id: "p3-d2", requirement: "Conduct and document minimisation review", dpdpRef: "Sec 8(7)", templateTitle: "Minimisation Review Report", templateContent: `DATA MINIMISATION REVIEW REPORT\n\nClassification: CONFIDENTIAL | Document Reference: RA-D02 | [Organisation Name] | Domain D | Date: [Date]\n\nSystems Reviewed: [Number] | Total Data Fields: [Number] | Fields Excessive: [Number] | Fields Scheduled for Removal: [Number]\n\nFINDINGS:\n| # | System | Finding | Risk | Remediation | Owner | Due Date | Status |\n|---|--------|---------|------|------------|-------|---------|--------|\n| 1 | [System] | [Finding] | [H/M/L] | [Action] | [Name] | [Date] | [Status] |\n\nReviewed by: [Name] | Approved by: [DPO Name]`, domain: "Domain D – Data Minimisation", status: "not-started", notes: "" },
      { id: "p3-e1", requirement: "Document data quality policy and accuracy controls", dpdpRef: "Sec 8(3)", templateTitle: "Data Quality Policy", templateContent: `DATA QUALITY & ACCURACY POLICY\n\nClassification: INTERNAL | Document Reference: RA-E01 | [Organisation Name] | Domain E — Accuracy & Quality | Date: [Date]\n\nCONTROLS:\nClause 1: Input validation on all data collection forms\nClause 2: Periodic data quality reviews (quarterly)\nClause 3: Data Principal self-service update mechanisms\nClause 4: Automated duplicate detection and resolution\nClause 5: Data quality metrics dashboard\nClause 6: Third-party data verification for critical fields\nClause 7: Correction request processing within [15 days]\nClause 8: Quality audit trail for all corrections\n\nApproved by: [DPO Name]`, domain: "Domain E – Accuracy & Quality", status: "not-started", notes: "" },
      { id: "p3-e2", requirement: "Maintain correction logs and data quality reports", dpdpRef: "Sec 12(1)", templateTitle: "Correction Log Template", templateContent: `DATA CORRECTION LOG\n\nClassification: CONFIDENTIAL | Document Reference: RA-E02 | [Organisation Name] | Domain E | Date: [Date]\n\n| # | Request Date | Data Principal | Field | Old Value | New Value | Verification | Corrected By | Date Completed |\n|---|-------------|---------------|-------|-----------|-----------|-------------|-------------|---------------|\n| 1 | [Date] | [Name/ID] | [Field] | [Old] | [New] | [Method] | [Name] | [Date] |\n\nMaintained by: [Name]`, domain: "Domain E – Accuracy & Quality", status: "not-started", notes: "" },
      { id: "p3-f1", requirement: "Document retention schedule with automated deletion evidence", dpdpRef: "Sec 8(7)", templateTitle: "Retention Schedule & Deletion Evidence", templateContent: `RETENTION SCHEDULE & AUTOMATED DELETION EVIDENCE\n\nClassification: CONFIDENTIAL | Document Reference: RA-F01 | [Organisation Name] | Domain F — Storage Limitation | Date: [Date]\n\n| Data Category | System | Retention Period | Deletion Method | Automated | Last Run | Records Deleted | Next Run |\n|--------------|--------|-----------------|----------------|-----------|---------|----------------|----------|\n| [Category] | [System] | [Period] | [Method] | [Y/N] | [Date] | [Number] | [Date] |\n\nPrepared by: [Name] | Verified by: [DPO Name]`, domain: "Domain F – Storage Limitation", status: "not-started", notes: "" },
      { id: "p3-f2", requirement: "Provide evidence of automated deletion mechanisms", dpdpRef: "Sec 8(7), Rule 8", templateTitle: "Automated Deletion Evidence", templateContent: `AUTOMATED DELETION EVIDENCE\n\nClassification: CONFIDENTIAL | Document Reference: RA-F02 | [Organisation Name] | Domain F | Date: [Date]\n\nSystems with automated deletion:\n| # | System | Mechanism | Schedule | Last 3 Runs (Date, Records) | Configuration Reference |\n|---|--------|-----------|---------|---------------------------|------------------------|\n| 1 | [System] | [Cron/TTL/Policy] | [Schedule] | [Date1: N], [Date2: N], [Date3: N] | [Config path/screenshot] |\n\nEvidence attached: Configuration screenshots, Deletion job logs, Confirmation receipts\n\nVerified by: [Name] | Date: [Date]`, domain: "Domain F – Storage Limitation", status: "not-started", notes: "" },
      { id: "p3-g1", requirement: "Compile rights request tracker and DSR response evidence", dpdpRef: "Sec 11-14", templateTitle: "DSR Response Evidence Pack", templateContent: `DSR RESPONSE EVIDENCE PACK\n\nClassification: CONFIDENTIAL | Document Reference: RA-G01 | [Organisation Name] | Domain G — Data Principal Rights | Date: [Date]\n\nSTATISTICS:\nTotal Requests (12 months): [Number] | By Type: Access [N], Correction [N], Erasure [N], Grievance [N], Nomination [N]\nAverage Response Time: [Days] | SLA Compliance: [%]\n\nSAMPLE EVIDENCE:\n1. Request acknowledgement emails (3 samples)\n2. Identity verification records\n3. Data export/deletion confirmations\n4. Response letters with outcomes\n5. Escalation records (if any)\n\nPrepared by: [Name] | Reviewed by: [DPO Name]`, domain: "Domain G – Data Principal Rights", status: "not-started", notes: "" },
      { id: "p3-g2", requirement: "Prepare DSR response templates for all right types", dpdpRef: "Sec 11-14, Rule 7", templateTitle: "DSR Response Templates", templateContent: `DSR RESPONSE TEMPLATES\n\nClassification: INTERNAL | Document Reference: RA-G02 | [Organisation Name] | Domain G | Date: [Date]\n\nTEMPLATE 1 — ACCESS (Sec 11):\nDear [Name], Please find enclosed a summary of your personal data held by [Organisation Name], including processing activities, purposes, recipients, and retention periods.\n\nTEMPLATE 2 — CORRECTION (Sec 12(1)):\nYour request to correct [Field] has been processed. The updated information is now reflected in our records.\n\nTEMPLATE 3 — ERASURE (Sec 12(3)):\nYour personal data has been erased from our systems as of [Date]. Deletion has been confirmed across all primary systems and third-party processors.\n\nTEMPLATE 4 — DENIAL:\nWe are unable to fulfil your request because [legal basis for refusal]. You may escalate to [DPO Name] at [Email] or to the Data Protection Board of India.\n\nTEMPLATE 5 — NOMINATION (Sec 14):\nYour nomination of [Nominee Name] has been recorded. This person may exercise your rights in the event of your death or incapacity.\n\nApproved by: [DPO Name]`, domain: "Domain G – Data Principal Rights", status: "not-started", notes: "" },
      { id: "p3-h1", requirement: "Compile penetration test reports and security certifications", dpdpRef: "Sec 8(4)", templateTitle: "Security Assessment Evidence Pack", templateContent: `SECURITY ASSESSMENT EVIDENCE PACK\n\nClassification: CONFIDENTIAL | Document Reference: RA-H01 | [Organisation Name] | Domain H — Security Safeguards | Date: [Date]\n\n| # | Evidence | Date | Provider | Valid Until | Critical Findings | Remediated |\n|---|---------|------|----------|-----------|------------------|------------|\n| 1 | Penetration Test Report | [Date] | [Vendor] | N/A | [Number] | [Number] |\n| 2 | ISO 27001 Certificate | [Date] | [CB] | [Date] | N/A | N/A |\n| 3 | SOC 2 Type II Report | [Period] | [Auditor] | [Date] | [Number] | [Number] |\n| 4 | Vulnerability Assessment | [Date] | [Scanner] | N/A | [Number] | [Number] |\n\nPrepared by: [CISO] | Reviewed by: [DPO Name]`, domain: "Domain H – Security Safeguards", status: "not-started", notes: "" },
      { id: "p3-h2", requirement: "Document encryption policy and security controls", dpdpRef: "Sec 8(4), Rule 6", templateTitle: "Encryption & Security Controls Summary", templateContent: `ENCRYPTION & SECURITY CONTROLS SUMMARY\n\nClassification: CONFIDENTIAL | Document Reference: RA-H02 | [Organisation Name] | Domain H | Date: [Date]\n\nENCRYPTION:\n- At Rest: [AES-256 / Other] — Systems: [List]\n- In Transit: TLS [1.2/1.3] — Endpoints: [All]\n- Key Management: [KMS Provider] — Rotation: [Schedule]\n- Database Encryption: [TDE/Column-level]\n\nSECURITY CONTROLS:\n| Control | Solution | Vendor | Coverage | Last Review |\n|---------|----------|--------|----------|-------------|\n| Firewall | [Type] | [Vendor] | [Scope] | [Date] |\n| IDS/IPS | [Type] | [Vendor] | [Scope] | [Date] |\n| EDR | [Type] | [Vendor] | [Scope] | [Date] |\n| SIEM | [Type] | [Vendor] | [Scope] | [Date] |\n| WAF | [Type] | [Vendor] | [Scope] | [Date] |\n| DLP | [Type] | [Vendor] | [Scope] | [Date] |\n\nReviewed by: [CISO] | Date: [Date]`, domain: "Domain H – Security Safeguards", status: "not-started", notes: "" },
      { id: "p3-i1", requirement: "Compile breach incident log and DPBI notification evidence", dpdpRef: "Sec 8(6), Rule 9", templateTitle: "Breach Incident Evidence Pack", templateContent: `BREACH INCIDENT EVIDENCE PACK\n\nClassification: CONFIDENTIAL | Document Reference: RA-I01 | [Organisation Name] | Domain I — Breach Management | Date: [Date]\n\nTotal Incidents (12 months): [Number] | DPBI Notifications: [Number] | Average Detection Time: [Hours] | Average Notification Time: [Hours]\n\nEvidence:\n1. Breach Register (current year) — POL-024\n2. DPBI notification copies with acknowledgements\n3. Root Cause Analysis reports\n4. Remediation action evidence\n5. Post-incident review minutes\n6. Tabletop exercise records\n\nPrepared by: [Incident Response Lead] | Reviewed by: [DPO Name]`, domain: "Domain I – Breach Management", status: "not-started", notes: "" },
      { id: "p3-i2", requirement: "Document root cause analysis (RCA) reports for past breaches", dpdpRef: "Sec 8(6)", templateTitle: "RCA Report Template", templateContent: `ROOT CAUSE ANALYSIS REPORT\n\nClassification: CONFIDENTIAL | Document Reference: RA-I02 | [Organisation Name] | Domain I | Date: [Date]\n\nIncident ID: [ID] | Date: [Date] | Severity: [Critical/High/Medium/Low]\n\nDESCRIPTION: [Detailed description]\nROOT CAUSE: [Identified root cause using 5-Why or Fishbone analysis]\nIMPACT: [Number] Data Principals | Data Categories: [Categories]\n\nCORRECTIVE ACTIONS:\n| # | Action | Owner | Due Date | Status | Evidence |\n|---|--------|-------|---------|--------|----------|\n| 1 | [Action] | [Name] | [Date] | [Status] | [Reference] |\n\nPREVENTIVE MEASURES:\n| # | Measure | Implementation Date | Verified |\n|---|---------|-------------------|----------|\n| 1 | [Measure] | [Date] | [Y/N] |\n\nDPO Sign-off: [DPO Name] | Date: [Date]`, domain: "Domain I – Breach Management", status: "not-started", notes: "" },
      { id: "p3-j1", requirement: "Compile signed DPAs and vendor assessment reports", dpdpRef: "Sec 8(2), Rule 14", templateTitle: "Vendor Compliance Evidence Pack", templateContent: `VENDOR COMPLIANCE EVIDENCE PACK\n\nClassification: CONFIDENTIAL | Document Reference: RA-J01 | [Organisation Name] | Domain J — Third-Party & Processors | Date: [Date]\n\nTotal Processors: [Number] | DPAs Executed: [Number] | Pending: [Number] | Non-compliant: [Number]\n\nEvidence:\n1. Signed DPA copies (all active processors)\n2. Vendor due diligence responses (POL-027)\n3. Security assessment reports\n4. Sub-processor approval records\n5. Annual audit reports\n\nRisk Summary:\n| Risk Level | Count | Action |\n|-----------|-------|--------|\n| High | [N] | Immediate remediation |\n| Medium | [N] | Quarterly monitoring |\n| Low | [N] | Annual review |\n\nPrepared by: [Name] | Reviewed by: [DPO Name]`, domain: "Domain J – Third-Party & Processors", status: "not-started", notes: "" },
      { id: "p3-k1", requirement: "Document transfer risk assessments and adequacy notes", dpdpRef: "Sec 16", templateTitle: "Transfer Compliance Evidence", templateContent: `CROSS-BORDER TRANSFER COMPLIANCE EVIDENCE\n\nClassification: CONFIDENTIAL | Document Reference: RA-K01 | [Organisation Name] | Domain K — Cross-Border Transfers | Date: [Date]\n\nTotal Transfers: [Number] | Countries: [List] | Restricted Countries: [List]\n\nEvidence:\n1. Transfer Risk Assessment for each destination (POL-029)\n2. SCCs / Adequacy documentation (POL-030)\n3. Recipient security assessments\n4. DPO approvals for each transfer\n5. Data localisation compliance evidence (if sector-specific)\n\nPrepared by: [Name] | Reviewed by: [DPO Name]`, domain: "Domain K – Cross-Border Transfers", status: "not-started", notes: "" },
      { id: "p3-l1", requirement: "Compile age-verification evidence and parental consent logs", dpdpRef: "Sec 9, Rule 11", templateTitle: "Children's Data Evidence Pack", templateContent: `CHILDREN'S DATA PROTECTION EVIDENCE PACK\n\nClassification: CONFIDENTIAL | Document Reference: RA-L01 | [Organisation Name] | Domain L — Children & Special Categories | Date: [Date]\n\nProcesses children's data: [Y/N]\n\nIf Yes:\n1. Age verification mechanism: [Method] — Evidence: [Screenshot/Config]\n2. Parental consent records: [Number] — Sample artefacts attached\n3. Evidence of NO behavioural tracking of children (Sec 9(3))\n4. Evidence of NO detrimental processing (Sec 9(4))\n5. Enhanced security measures documentation\n\nIf No: Documented confirmation with technical controls preventing children's data collection.\n\nPrepared by: [Name] | Verified by: [DPO Name]`, domain: "Domain L – Children & Special Categories", status: "not-started", notes: "" },
      { id: "p3-m1", requirement: "Compile DPO reports and governance meeting minutes", dpdpRef: "Sec 8(6), Rule 13", templateTitle: "Governance Evidence Pack", templateContent: `ACCOUNTABILITY & GOVERNANCE EVIDENCE PACK\n\nClassification: CONFIDENTIAL | Document Reference: RA-M01 | [Organisation Name] | Domain M — Accountability & Governance | Date: [Date]\n\nEvidence:\n1. DPO Appointment Letter (GOV-004)\n2. DPO Quarterly Reports to Board (last 4)\n3. Governance/Privacy Committee Meeting Minutes (last 4)\n4. Board Resolution on Data Protection (GOV-005)\n5. Annual Privacy Report\n6. DPO Budget allocation records\n7. DPO independence documentation\n\nDPO Contact: [DPO Name] | [Email]\n\nPrepared by: [DPO Name]`, domain: "Domain M – Accountability & Governance", status: "not-started", notes: "" },
      { id: "p3-n1", requirement: "Compile LMS completion records and training materials", dpdpRef: "Rule 12", templateTitle: "Training Evidence Pack", templateContent: `TRAINING & AWARENESS EVIDENCE PACK\n\nClassification: INTERNAL | Document Reference: RA-N01 | [Organisation Name] | Domain N — Training & Awareness | Date: [Date]\n\nLMS Platform: [Name] | Training Programme: [Name]\n\nCompletion Stats: Total: [Number] | Completed: [Number] ([%]) | Pending: [Number] | Average Score: [%]\n\nEvidence:\n1. LMS completion report (export)\n2. Training material copies (all modules)\n3. Assessment question bank\n4. Attendance registers (POL-032)\n5. Role-specific training records\n6. Incident response simulation records\n\nPrepared by: [HR/Training Manager] | Reviewed by: [DPO Name]`, domain: "Domain N – Training & Awareness", status: "not-started", notes: "" },
      { id: "p3-o1", requirement: "Compile PbD checklists, DPIA outcomes, and design review evidence", dpdpRef: "Sec 8(4)", templateTitle: "Privacy by Design Evidence Pack", templateContent: `PRIVACY BY DESIGN EVIDENCE PACK\n\nClassification: CONFIDENTIAL | Document Reference: RA-O01 | [Organisation Name] | Domain O — Privacy by Design & Default | Date: [Date]\n\nEvidence:\n1. Completed PbD Checklists (POL-037) — [Number] projects\n2. DPIA Reports and Outcomes (POL-014/015) — [Number] assessments\n3. Design Review Meeting Minutes\n4. Architecture diagrams with privacy annotations\n5. Default privacy settings documentation\n6. ISO 31700 alignment assessment\n\nProjects Assessed: [Number] | DPIAs Completed: [Number]\n\nPrepared by: [Name] | Reviewed by: [DPO Name]`, domain: "Domain O – Privacy by Design & Default", status: "not-started", notes: "" }
    ]
  },
  {
    id: "phase-4",
    phase: 4,
    title: "Dept Grid",
    icon: "📊",
    items: [
      { id: "p4-1", requirement: "Prepare Department-wise Data Inventory Matrix", dpdpRef: "Rule 6(2)", templateTitle: "Department Data Inventory Matrix", templateContent: `DEPARTMENT-WISE DATA INVENTORY MATRIX\n\nClassification: CONFIDENTIAL | Document Reference: DPT-001 | [Organisation Name] | Date: [Date]\n\n| Department | Data Categories | Systems | Data Principals | Volume | Purpose | Legal Basis | Retention | Cross-border | Risk Rating |\n|-----------|----------------|---------|----------------|--------|---------|------------|-----------|-------------|------------|\n| HR | Employee PII, Bank Details | HRMS, Payroll | Employees | [N] | Employment | Sec 7(a) | 7 years | N | Medium |\n| Marketing | Customer contacts, Preferences | CRM, Email | Customers | [N] | Marketing | Sec 6 | 2 years | Y | High |\n| IT | Access logs, Device data | AD, SIEM | All users | [N] | Security | Sec 7(b) | 1 year | N | Low |\n| Finance | Payment data, Tax records | ERP | Customers, Employees | [N] | Financial | Sec 7(c) | 8 years | N | High |\n| Legal | Contract data, Litigation | DMS | Various | [N] | Legal | Sec 7(c) | As required | N | Medium |\n| Operations | CCTV, Visitor logs | NVR, Access Control | Visitors, Employees | [N] | Security | Sec 7(b) | 90 days | N | Low |\n\nPrepared by: [Department Heads] | Consolidated by: [DPO Name]`, status: "not-started", notes: "" },
      { id: "p4-2", requirement: "Create Departmental Data Flow Maps", dpdpRef: "Rule 6(2)", templateTitle: "Departmental Data Flow Map Template", templateContent: `DEPARTMENTAL DATA FLOW MAP\n\nClassification: CONFIDENTIAL | Document Reference: DPT-002 | Department: [Department] | [Organisation Name] | Date: [Date]\n\nDATA INPUTS:\n| Source | Channel | Data Categories | Volume | Legal Basis |\n|--------|---------|----------------|--------|------------|\n| [Source] | [Channel] | [Categories] | [Volume] | [Basis] |\n\nINTERNAL PROCESSING:\n| System | Process | Data Accessed | Purpose | Access Controls |\n|--------|---------|-------------|---------|----------------|\n| [System] | [Process] | [Data] | [Purpose] | [Controls] |\n\nDATA OUTPUTS:\n| Recipient | Type | Data Categories | Purpose | DPA in Place |\n|----------|------|----------------|---------|-------------|\n| [Recipient] | [Int/Ext] | [Categories] | [Purpose] | [Y/N] |\n\nDATA STORES:\n| Database | Location | Encryption | Retention | Backup |\n|----------|----------|-----------|-----------|--------|\n| [Name] | [Location] | [Y/N, Method] | [Period] | [Y/N] |\n\nPrepared by: [Department Head] | Reviewed by: [DPO Name]`, status: "not-started", notes: "" },
      { id: "p4-3", requirement: "Define RACI Matrix for Data Processing Responsibilities", dpdpRef: "Rule 12", templateTitle: "RACI Matrix — Data Processing", templateContent: `RACI MATRIX — DATA PROCESSING RESPONSIBILITIES\n\nClassification: INTERNAL | Document Reference: DPT-003 | [Organisation Name] | Date: [Date]\n\n| Activity | Board | DPO | CISO | IT | HR | Legal | Marketing | Finance | Operations |\n|---------|-------|-----|------|----|----|-------|-----------|---------|------------|\n| Consent Management | I | A | C | R | C | C | R | I | I |\n| Breach Detection | I | A | R | R | I | C | I | I | I |\n| Breach Notification (DPBI) | I | R | C | C | I | A | I | I | I |\n| DSR Fulfilment | I | A | C | R | R | C | R | R | I |\n| Retention Enforcement | I | A | C | R | R | C | R | R | R |\n| Training Delivery | I | A | C | C | R | C | C | C | C |\n| DPIA Execution | C | A | C | R | C | C | R | C | C |\n| Vendor DPA Management | I | A | C | C | C | R | C | C | C |\n| Cross-border Assessment | I | A | C | C | I | R | C | I | I |\n| Audit Response | A | R | R | R | R | R | R | R | R |\n\nR = Responsible | A = Accountable | C = Consulted | I = Informed\n\nApproved by: [DPO Name]`, status: "not-started", notes: "" },
      { id: "p4-4", requirement: "Collect Department Self-Assessment Responses", dpdpRef: "Rule 12", templateTitle: "Department Self-Assessment Questionnaire", templateContent: `DEPARTMENT SELF-ASSESSMENT QUESTIONNAIRE\n\nClassification: INTERNAL | Document Reference: DPT-004 | Department: [Department] | Completed by: [Name] | Date: [Date]\n\n| # | Question | DPDP Ref | Yes | No | Partial | Evidence | Notes |\n|---|---------|---------|-----|-----|---------|----------|-------|\n| 1 | Does your department process personal data? | General | | | | | |\n| 2 | Are all processing activities documented in RoPA? | Sec 8(8) | | | | | |\n| 3 | Are privacy notices provided to all Data Principals? | Sec 5 | | | | | |\n| 4 | Is consent collected where required? | Sec 6 | | | | | |\n| 5 | Are retention periods defined and enforced? | Sec 8(7) | | | | | |\n| 6 | Have all staff completed data protection training? | Rule 12 | | | | | |\n| 7 | Are third-party processors covered by DPAs? | Sec 8(2) | | | | | |\n| 8 | Is there a process for handling DSR requests? | Sec 11-14 | | | | | |\n| 9 | Are access controls implemented (RBAC, MFA)? | Sec 8(4) | | | | | |\n| 10 | Are data breaches reported to DPO promptly? | Sec 8(6) | | | | | |\n| 11 | Is data encrypted at rest and in transit? | Sec 8(4) | | | | | |\n| 12 | Are cross-border transfers documented and assessed? | Sec 16 | | | | | |\n\nCompliance Score: [Score] / 12 | Rating: [High/Medium/Low]\n\nReviewed by: [DPO Name]`, status: "not-started", notes: "" },
      { id: "p4-5", requirement: "Conduct Department-level Gap Analysis", dpdpRef: "Rule 12", templateTitle: "Department Gap Analysis Report", templateContent: `DEPARTMENT GAP ANALYSIS REPORT\n\nClassification: CONFIDENTIAL | Document Reference: DPT-005 | Department: [Department] | [Organisation Name] | Date: [Date]\n\n5×5 RISK SCORING per gap:\n\n| # | Requirement | DPDP Ref | Current State | Target State | Gap Description | Likelihood | Impact | Risk Score | Priority | Remediation | Owner | Due Date |\n|---|-----------|---------|-------------|-------------|----------------|-----------|--------|-----------|----------|------------|-------|----------|\n| 1 | [Req] | [Ref] | [Current] | [Target] | [Gap] | [1-5] | [1-5] | [Score] | [H/M/L] | [Action] | [Name] | [Date] |\n\nSummary: Total Gaps: [N] | Critical (≥20): [N] | High (15-19): [N] | Medium (10-14): [N] | Low (1-9): [N]\nEscalation: Gaps with risk score ≥ 15 escalated to Board.\n\nDPO Sign-off: [DPO Name] | Date: [Date]\nLinkage: DPIA Register (POL-015)`, status: "not-started", notes: "" },
      { id: "p4-6", requirement: "Create Corrective Action Plans per Department", dpdpRef: "Rule 12", templateTitle: "Corrective Action Plan Template", templateContent: `CORRECTIVE ACTION PLAN\n\nClassification: CONFIDENTIAL | Document Reference: DPT-006 | Department: [Department] | [Organisation Name] | Date: [Date]\n\n| # | Gap/Finding Ref | Description | Corrective Action | RACI (R/A/C/I) | Start Date | Due Date | Status | Evidence | Escalation (if overdue) |\n|---|----------------|------------|-------------------|---------------|-----------|---------|--------|---------|------------------------|\n| 1 | DPT-005-[#] | [Gap] | [Action] | R:[Name] A:[DPO] | [Date] | [Date] | [Status] | [Evidence] | [DPO → Board if >14 days overdue] |\n\nProgress: [N] / [Total] completed | Overdue: [N]\nException: [Document any exceptions with legal basis and review date]\nNext Review: [Date]\n\nDepartment Head: [Name] | DPO Review: [DPO Name]`, status: "not-started", notes: "" }
    ]
  },
  {
    id: "phase-5",
    phase: 5,
    title: "File References",
    icon: "📎",
    items: [
      { id: "p5-1", requirement: "Create Master Evidence Index (hyperlinked)", dpdpRef: "Rule 6", templateTitle: "Master Evidence Index", templateContent: `MASTER EVIDENCE INDEX\n\nClassification: CONFIDENTIAL | Document Reference: FIL-001 | [Organisation Name] | Last Updated: [Date]\n\n| # | Document Title | Ref | Category | Phase | File Location | Version | Last Updated | Owner | Status |\n|---|---------------|-----|----------|-------|-------------|---------|-------------|-------|--------|\n| 1 | Statement on Applicability | GOV-001 | Governance | Phase 1 | [Link] | v1.0 | [Date] | DPO | [Active] |\n| 2 | Organisation Chart | GOV-002 | Governance | Phase 1 | [Link] | v1.0 | [Date] | DPO | [Active] |\n| 3 | Privacy Notice — Website | POL-001 | Policy | Phase 2 | [Link] | v1.0 | [Date] | DPO | [Active] |\n| 4 | DPA Template | POL-007 | Agreement | Phase 2 | [Link] | v1.0 | [Date] | Legal | [Active] |\n\nTotal Documents: [Number] | Review: Quarterly\nMaintained by: [DPO Name]`, status: "not-started", notes: "" },
      { id: "p5-2", requirement: "Compile External Regulatory Reference Links", dpdpRef: "General", templateTitle: "Regulatory Reference Links Register", templateContent: `EXTERNAL REGULATORY REFERENCE LINKS\n\nClassification: PUBLIC | Document Reference: FIL-002 | [Organisation Name] | Last Updated: [Date]\n\n| # | Reference | Source | URL | Category | Relevance | Published | Last Checked |\n|---|----------|--------|-----|----------|-----------|-----------|-------------|\n| 1 | DPDP Act, 2023 (Full Text) | MeitY | [URL] | Primary Legislation | Core | Aug 2023 | [Date] |\n| 2 | DPDP Rules, 2025 | MeitY | [URL] | Rules | Implementing | Jan 2025 | [Date] |\n| 3 | DPBI Circulars & Orders | DPBI | [URL] | Regulatory Guidance | Compliance | Ongoing | [Date] |\n| 4 | ISO 27001:2022 | ISO | [URL] | Standard | Security | 2022 | [Date] |\n| 5 | ISO 31700 (PbD) | ISO | [URL] | Standard | Privacy | 2023 | [Date] |\n\nMaintained by: [Legal Team] | Reviewed by: [DPO Name]`, status: "not-started", notes: "" },
      { id: "p5-3", requirement: "Compile Sector-Specific Guidelines Index", dpdpRef: "Sec 16", templateTitle: "Sector Guidelines Index", templateContent: `SECTOR-SPECIFIC GUIDELINES INDEX\n\nClassification: INTERNAL | Document Reference: FIL-003 | [Organisation Name] | Industry: [Industry] | Date: [Date]\n\n| # | Guideline | Authority | Applicable To | Data Protection Requirements | DPDP Overlap | Status |\n|---|----------|-----------|-------------|----------------------------|-------------|--------|\n| 1 | [Guideline] | [Authority] | [Scope] | [Requirements] | [DPDP Section] | [Reviewed/Pending] |\n\nSector examples: FinTech → RBI directions | Healthcare → DISHA/ICMR | Telecom → DoT/TRAI | E-commerce → Consumer Protection Rules\n\nMaintained by: [Legal/Compliance]`, status: "not-started", notes: "" },
      { id: "p5-4", requirement: "Maintain Court Judgements & Precedent Register", dpdpRef: "General", templateTitle: "Court Judgements Register", templateContent: `COURT JUDGEMENTS & PRECEDENT REGISTER\n\nClassification: INTERNAL | Document Reference: FIL-004 | [Organisation Name] | Last Updated: [Date]\n\n| # | Case Name | Court | Citation | Date | Key Holding | DPDP Relevance | Action Required | Status |\n|---|----------|-------|---------|------|------------|---------------|----------------|--------|\n| 1 | [Case] | [Court] | [Citation] | [Date] | [Holding] | [Section] | [Action] | [Reviewed] |\n\nReview: Quarterly by Legal Counsel\nMaintained by: [Legal Counsel] | Reviewed by: [DPO Name]`, status: "not-started", notes: "" },
      { id: "p5-5", requirement: "Maintain Internal Policy Version History Log", dpdpRef: "Rule 6", templateTitle: "Policy Version History Log", templateContent: `INTERNAL POLICY VERSION HISTORY LOG\n\nClassification: INTERNAL | Document Reference: FIL-005 | [Organisation Name] | Last Updated: [Date]\n\n| # | Policy Name | Ref | Current Ver | Previous Ver | Change Summary | Changed By | Date | Approved By | Effective Date |\n|---|-----------|-----|-----------|-------------|---------------|-----------|------|-----------|---------------|\n| 1 | Privacy Notice — Website | POL-001 | v2.0 | v1.0 | Added DPDP Act references | [Name] | [Date] | [DPO] | [Date] |\n\nVersion Control Rules:\n- Major changes (scope, legal basis): Increment major version (v1.0 → v2.0)\n- Minor changes (formatting, clarification): Increment minor version (v1.0 → v1.1)\n- All changes require DPO approval before publication\n\nMaintained by: [Name]`, status: "not-started", notes: "" },
      { id: "p5-6", requirement: "Archive Superseded Documents", dpdpRef: "Rule 6", templateTitle: "Archived Documents Register", templateContent: `ARCHIVED / SUPERSEDED DOCUMENTS REGISTER\n\nClassification: INTERNAL | Document Reference: FIL-006 | [Organisation Name] | Last Updated: [Date]\n\n| # | Document Title | Ref | Superseded Version | Superseded Date | Replaced By | Archive Location | Retention Until | Destruction Date |\n|---|---------------|-----|-------------------|----------------|-----------|-----------------|----------------|------------------|\n| 1 | [Document] | [Ref] | [Version] | [Date] | [New Version] | [Location] | [Date] | [Date] |\n\nArchive Policy: Superseded documents retained for [5] years in read-only archive. Destruction requires DPO approval.\n\nMaintained by: [Name] | Reviewed by: [DPO Name]`, status: "not-started", notes: "" }
    ]
  },
  {
    id: "phase-6",
    phase: 6,
    title: "Dashboard Reports",
    icon: "📈",
    items: [
      { id: "p6-1", requirement: "Generate Compliance Score Report (versioned)", dpdpRef: "Rule 12", templateTitle: "Compliance Score Report Template", templateContent: `COMPLIANCE SCORE REPORT\n\nClassification: CONFIDENTIAL | Document Reference: RPT-001 | [Organisation Name] | Version: [Version] | Date: [Date]\n\nOVERALL COMPLIANCE SCORE: [Score]%\n\n| Domain | Weight | Score | Status | Critical Gaps | Remediation ETA |\n|--------|--------|-------|--------|--------------|----------------|\n| A — Lawful Processing | 15% | [Score]% | [Status] | [Gaps] | [Date] |\n| B — Notice & Transparency | 10% | [Score]% | [Status] | [Gaps] | [Date] |\n| C — Purpose Limitation | 10% | [Score]% | [Status] | [Gaps] | [Date] |\n| D — Data Minimisation | 8% | [Score]% | [Status] | [Gaps] | [Date] |\n| E — Accuracy & Quality | 7% | [Score]% | [Status] | [Gaps] | [Date] |\n| F — Storage Limitation | 8% | [Score]% | [Status] | [Gaps] | [Date] |\n| G — Data Principal Rights | 12% | [Score]% | [Status] | [Gaps] | [Date] |\n| H — Security Safeguards | 15% | [Score]% | [Status] | [Gaps] | [Date] |\n| I — Breach Management | 10% | [Score]% | [Status] | [Gaps] | [Date] |\n| J — Third-Party Management | 5% | [Score]% | [Status] | [Gaps] | [Date] |\n\nTrend (vs previous): [Improving/Stable/Declining] | Penalty Exposure: ₹[Amount] Crore\nNext Assessment: [Date]\n\nPrepared by: [DPO Name]`, status: "not-started", notes: "" },
      { id: "p6-2", requirement: "Export Domain-wise Risk Heat Map", dpdpRef: "Rule 12", templateTitle: "Risk Heat Map Template", templateContent: `DOMAIN-WISE RISK HEAT MAP\n\nClassification: CONFIDENTIAL | Document Reference: RPT-002 | [Organisation Name] | Date: [Date]\n\n5×5 RISK MATRIX:\n| Domain | Likelihood (1-5) | Impact (1-5) | Inherent Risk | Controls Effectiveness | Residual Risk | Priority |\n|--------|-----------------|-------------|--------------|----------------------|--------------|----------|\n| A — Lawful Processing | [Score] | [Score] | [Score] | [%] | [Score] | [Priority] |\n| B — Notice | [Score] | [Score] | [Score] | [%] | [Score] | [Priority] |\n| ... | | | | | | |\n\nRisk Levels: Critical (20-25) | High (15-19) | Medium (10-14) | Low (1-9)\nEscalation: All Critical and High risks reported to Board.\n\nPrepared by: [DPO Name]`, status: "not-started", notes: "" },
      { id: "p6-3", requirement: "Prepare Penalty Exposure Map", dpdpRef: "Sec 33-34", templateTitle: "Penalty Exposure Map Template", templateContent: `PENALTY EXPOSURE MAP\n\nClassification: CONFIDENTIAL | Document Reference: RPT-003 | [Organisation Name] | Date: [Date]\n\n| # | Violation | DPDP Section | Maximum Penalty | Current Compliance | Controls in Place | Residual Exposure | Priority |\n|---|----------|-------------|----------------|-------------------|------------------|------------------|----------|\n| 1 | Failure to take security safeguards | Sec 8(4), Sec 33(a) | ₹250 Crore | [Score]% | [Controls] | [₹Amount] | [H/M/L] |\n| 2 | Failure to notify data breach | Sec 8(6), Sec 33(b) | ₹200 Crore | [Score]% | [Controls] | [₹Amount] | [H/M/L] |\n| 3 | Non-compliance children's data | Sec 9, Sec 33(c) | ₹200 Crore | [Score]% | [Controls] | [₹Amount] | [H/M/L] |\n| 4 | Breach of additional SDF obligations | Sec 10, Sec 33(d) | ₹150 Crore | [Score]% | [Controls] | [₹Amount] | [H/M/L] |\n| 5 | Non-compliance by Data Principal | Sec 15, Sec 33(e) | ₹10,000 | N/A | N/A | N/A | N/A |\n| 6 | General non-compliance | Sec 33(f) | ₹50 Crore | [Score]% | [Controls] | [₹Amount] | [H/M/L] |\n\nTotal Maximum Exposure: ₹[Amount] Crore | Total Residual Exposure: ₹[Amount] Crore\n\nPrepared by: [Legal/DPO]`, status: "not-started", notes: "" },
      { id: "p6-4", requirement: "Export Audit Trail / Activity Log", dpdpRef: "Rule 12", templateTitle: "Audit Trail Export Template", templateContent: `AUDIT TRAIL / ACTIVITY LOG EXPORT\n\nClassification: CONFIDENTIAL | Document Reference: RPT-004 | [Organisation Name] | Export Date: [Date] | Period: [Start] to [End]\n\n| # | Timestamp | User | Role | Action | Module | Resource | IP Address | Details | Result |\n|---|----------|------|------|--------|--------|----------|-----------|---------|--------|\n| 1 | [DateTime] | [User] | [Role] | [Action] | [Module] | [Resource] | [IP] | [Details] | [Success/Fail] |\n\nTotal Activities: [Number] | Unique Users: [Number] | Failed Actions: [Number]\nFilters Applied: [Filters]\n\nGenerated by: System | Requested by: [Name] | Approved by: [DPO Name]`, status: "not-started", notes: "" },
      { id: "p6-5", requirement: "Prepare Board/Management Compliance Summary Report", dpdpRef: "Rule 12", templateTitle: "Board Compliance Summary", templateContent: `BOARD / MANAGEMENT COMPLIANCE SUMMARY REPORT\n\nClassification: CONFIDENTIAL — BOARD PAPER | Document Reference: RPT-005 | [Organisation Name] | Period: [Period] | Date: [Date]\n\nEXECUTIVE SUMMARY:\nOverall Compliance Score: [Score]% | Trend: [↑/→/↓] vs Previous: [Score]%\nPenalty Exposure: ₹[Amount] Crore (reduced from ₹[Previous] Crore)\n\nKEY HIGHLIGHTS:\n1. [Highlight — e.g., ISO 27001 certification achieved]\n2. [Highlight — e.g., 100% DPA coverage for all processors]\n3. [Highlight — e.g., Zero data breaches this quarter]\n\nRISK AREAS REQUIRING BOARD ATTENTION:\n| Risk | Domain | Score | Mitigation | Owner | ETA |\n|------|--------|-------|-----------|-------|-----|\n| [Risk] | [Domain] | [Score] | [Action] | [Name] | [Date] |\n\nBREACH SUMMARY:\nIncidents: [Number] | DPBI Notifications: [Number] | Data Principals Affected: [Number] | Average Response: [Hours]\n\nDSR SUMMARY:\nRequests Received: [Number] | Fulfilled: [Number] | Average Response: [Days] | SLA Compliance: [%]\n\nTRAINING:\nCompletion Rate: [%] | Overdue: [Number employees]\n\nBUDGET:\nAllocated: ₹[Amount] | Spent: ₹[Amount] | Utilisation: [%]\n\nRECOMMENDATIONS:\n1. [Recommendation with business case]\n2. [Recommendation]\n\nPresented by: [DPO Name] | Date: [Date]`, status: "not-started", notes: "" },
      { id: "p6-6", requirement: "Maintain Shared Report Links / Access Log", dpdpRef: "Rule 12", templateTitle: "Shared Reports Access Log", templateContent: `SHARED REPORT LINKS / ACCESS LOG\n\nClassification: INTERNAL | Document Reference: RPT-006 | [Organisation Name] | Last Updated: [Date]\n\n| # | Report Title | Share Code | Shared By | Shared With | Share Date | Expiry | Access Count | Last Accessed | Status |\n|---|-------------|-----------|-----------|-------------|-----------|--------|-------------|-------------|--------|\n| 1 | [Report] | [Code] | [Name] | [Recipient] | [Date] | [Date] | [Count] | [Date] | Active/Expired |\n\nAccess Policy: Links expire after [30/60/90] days. Audit trail maintained for all access.\nMaintained by: [Name]`, status: "not-started", notes: "" },
      { id: "p6-7", requirement: "Archive Assessment Version History", dpdpRef: "Rule 12", templateTitle: "Assessment Version Archive", templateContent: `ASSESSMENT VERSION HISTORY ARCHIVE\n\nClassification: CONFIDENTIAL | Document Reference: RPT-007 | [Organisation Name] | Last Updated: [Date]\n\n| # | Assessment ID | Version | Date | Overall Score | Status | Key Changes | Archived By | Verified |\n|---|-------------|---------|------|-------------|--------|------------|-----------|----------|\n| 1 | [ID] | v[N] | [Date] | [Score]% | [Status] | [Summary] | [Name] | [Y/N] |\n\nArchive Policy: All versions retained for [7] years. Previous versions read-only. Tamper-evident logging enabled.\nRetention Period for Archive: 7 years from assessment date.\n\nMaintained by: [DPO Name]`, status: "not-started", notes: "" }
    ]
  }
];
