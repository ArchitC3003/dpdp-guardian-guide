/**
 * Sector Intelligence Engine
 *
 * Provides deep, industry-specific regulatory overlays, maturity-calibrated
 * obligation language, and enforcement-grade clause structures.
 *
 * This is the knowledge layer that transforms generic compliance templates
 * into audit-ready, organisation-specific documents.
 */

import { OrgContext } from "@/components/policy-builder/orgContextTypes";

// ── Sector Regulatory Overlay ────────────────────────────────────

export interface SectorOverlay {
  /** Primary sectoral regulators */
  regulators: string[];
  /** Specific regulatory instruments with citation */
  instruments: { name: string; citation: string; applicability: string }[];
  /** Sector-specific data categories requiring special treatment */
  specialDataCategories: { category: string; handlingRequirement: string; dpdpRef: string }[];
  /** Industry-specific retention periods */
  retentionGuidance: { dataType: string; minimumPeriod: string; legalBasis: string }[];
  /** Sector-specific breach notification requirements beyond DPDP */
  breachOverlays: { regulator: string; timeline: string; format: string }[];
  /** Risk factors unique to the sector */
  riskFactors: string[];
  /** Standard processing activities for this sector */
  typicalProcessingBasis: { activity: string; lawfulBasis: string; dpdpSection: string }[];
}

const SECTOR_OVERLAYS: Record<string, SectorOverlay> = {
  "BFSI/Banking": {
    regulators: [
      "Reserve Bank of India (RBI)",
      "Securities and Exchange Board of India (SEBI)",
      "Insurance Regulatory and Development Authority of India (IRDAI)",
      "National Housing Bank (NHB)",
    ],
    instruments: [
      { name: "RBI Master Direction on IT Governance, Risk, Controls and Assurance Practices", citation: "RBI/2023-24/42, DoS.CO.CSITE.SEC.No.S1830/31.01.015/2023-24", applicability: "All Scheduled Commercial Banks, Small Finance Banks, Payment Banks" },
      { name: "RBI Cybersecurity Framework for Banks", citation: "DBS.CO/CSITE/BC.11/33.01.001/2015-16", applicability: "All UCBs, NBFCs with asset size > ₹500 Cr" },
      { name: "SEBI Cybersecurity and Cyber Resilience Framework (CSCRF)", citation: "SEBI/HO/ITD/ITD-PoD-1/P/CIR/2024/113", applicability: "Stock Exchanges, Depositories, Clearing Corporations, AMCs, Mutual Funds" },
      { name: "RBI Digital Payment Security Controls Directions", citation: "RBI/2020-21/74 CO.DPSS.POLC.No.S1033/02-14-008/2020-21", applicability: "All Payment System Operators, PPI Issuers" },
      { name: "CERT-In Directions 2022", citation: "No. 20(3)/2022-CERT-In", applicability: "All BFSI entities as service providers" },
      { name: "PMLA Rules — Record Keeping", citation: "Prevention of Money Laundering (Maintenance of Records) Rules, 2005", applicability: "All reporting entities under PMLA" },
    ],
    specialDataCategories: [
      { category: "KYC/Identity Data", handlingRequirement: "Encrypted storage, access logging per RBI Master Direction; CKYC integration mandatory; Video KYC recordings retained per RBI/2022-23/15", dpdpRef: "Sec 8(5), Rule 6(a)" },
      { category: "Financial Transaction Data", handlingRequirement: "End-to-end encryption, real-time fraud monitoring, reconciliation audit trail; 10-year retention for PMLA compliance", dpdpRef: "Sec 8(5), Rule 6(a)(e)" },
      { category: "Credit Bureau Data", handlingRequirement: "Purpose-limited access per CICRA 2005; consent-specific data sharing with CICs; annual data quality audit", dpdpRef: "Sec 6(1), Sec 8(2)" },
      { category: "Payment Card Data (PCI DSS)", handlingRequirement: "PCI DSS v4.0 compliance; tokenisation mandatory per RBI circular; card-on-file data deletion post tokenisation", dpdpRef: "Sec 8(7), Rule 8" },
      { category: "Aadhaar/eKYC Data", handlingRequirement: "Stored only in Virtual ID form; biometric data deleted within session; UIDAI audit compliance", dpdpRef: "Sec 9, Aadhaar Act Sec 29" },
    ],
    retentionGuidance: [
      { dataType: "KYC Records", minimumPeriod: "5 years from closure of account or business relationship", legalBasis: "PMLA Rules, Rule 3(1)" },
      { dataType: "Transaction Records", minimumPeriod: "10 years from date of transaction", legalBasis: "PMLA Rules, Rule 3(1A)" },
      { dataType: "Suspicious Transaction Reports", minimumPeriod: "5 years from date of filing with FIU-IND", legalBasis: "PMLA Rules, Rule 7" },
      { dataType: "CCTV/Branch Surveillance", minimumPeriod: "180 days minimum", legalBasis: "RBI Security Guidelines" },
      { dataType: "Audit Logs (IT Systems)", minimumPeriod: "5 years rolling", legalBasis: "RBI IT Governance MD, CERT-In Directions" },
      { dataType: "Customer Communications", minimumPeriod: "8 years from communication date", legalBasis: "RBI Customer Service Circular" },
    ],
    breachOverlays: [
      { regulator: "CERT-In", timeline: "6 hours from detection", format: "Incident Report Form (IRF) per CERT-In Directions 2022" },
      { regulator: "RBI", timeline: "Within 6 hours for cyber incidents; 2–6 hours for card/payment fraud", format: "CSITE Incident Reporting Portal + email to csite@rbi.org.in" },
      { regulator: "SEBI", timeline: "6 hours from detection for Market Infrastructure Institutions", format: "CSCRF Annex-B format + quarterly incident summary" },
      { regulator: "DPBI (Data Protection Board of India)", timeline: "72 hours per DPDP Act Sec 8(6), Rule 7", format: "Prescribed Form under Rule 7(2)" },
    ],
    riskFactors: [
      "Systemic risk from interconnected payment infrastructure",
      "Identity theft and account takeover through social engineering",
      "Insider threat from privileged access to financial systems",
      "Third-party payment aggregator and fintech partnership data exposure",
      "Cross-border SWIFT/RTGS messaging data leakage",
      "Regulatory arbitrage in multi-jurisdictional operations",
    ],
    typicalProcessingBasis: [
      { activity: "Account Opening & KYC", lawfulBasis: "Legal Obligation (PMLA) + Consent", dpdpSection: "Sec 7(b) + Sec 6" },
      { activity: "Transaction Processing", lawfulBasis: "Performance of Contract + Legal Obligation", dpdpSection: "Sec 7(a)" },
      { activity: "Credit Scoring & Underwriting", lawfulBasis: "Consent (explicit) + Legitimate Use", dpdpSection: "Sec 6 + Sec 7" },
      { activity: "Fraud Monitoring", lawfulBasis: "Legal Obligation (RBI Directions)", dpdpSection: "Sec 7(b)" },
      { activity: "Marketing & Cross-sell", lawfulBasis: "Consent (granular, withdrawable)", dpdpSection: "Sec 6(1)" },
      { activity: "Regulatory Reporting", lawfulBasis: "Legal Obligation", dpdpSection: "Sec 7(b)(c)" },
    ],
  },

  "HealthTech/Healthcare": {
    regulators: [
      "National Health Authority (NHA)",
      "Central Drugs Standard Control Organisation (CDSCO)",
      "Indian Council of Medical Research (ICMR)",
      "National Medical Commission (NMC)",
    ],
    instruments: [
      { name: "Ayushman Bharat Digital Mission (ABDM) Health Data Management Policy", citation: "NHA/ABDM/HDMP/2022", applicability: "All Health Information Providers, Health Information Users under ABDM" },
      { name: "ICMR National Ethical Guidelines for Biomedical Research", citation: "ICMR 2017 (as amended)", applicability: "All entities conducting clinical research involving human participants" },
      { name: "Telemedicine Practice Guidelines", citation: "MCI/Board of Governors Notification 25.03.2020", applicability: "All registered medical practitioners offering teleconsultation" },
      { name: "Draft Digital Information Security in Healthcare Act (DISHA)", citation: "MoHFW Draft 2018", applicability: "Framework reference for health data security standards" },
      { name: "Clinical Establishments Act 2010", citation: "Act No. 11 of 2010", applicability: "All clinical establishments providing healthcare services" },
    ],
    specialDataCategories: [
      { category: "Electronic Health Records (EHR)", handlingRequirement: "ABDM-compliant FHIR format; end-to-end encryption; patient-controlled access via Health ID; minimum AES-256 encryption at rest", dpdpRef: "Sec 8(5), Rule 6(a)" },
      { category: "Clinical Trial Data", handlingRequirement: "Pseudonymisation mandatory; ethics committee oversight; 15-year post-trial retention; ICMR consent norms", dpdpRef: "Sec 6(1), Sec 9" },
      { category: "Genomic/Genetic Data", handlingRequirement: "Treated as sensitive personal data; explicit informed consent; no secondary use without fresh consent; data localisation recommended", dpdpRef: "Sec 6(1), Sec 8(5)" },
      { category: "Mental Health Records", handlingRequirement: "Enhanced confidentiality per Mental Healthcare Act 2017 Sec 23; restricted access even within clinical teams", dpdpRef: "Sec 8(5), MHA Sec 23" },
      { category: "Biometric Data (patient identification)", handlingRequirement: "Aadhaar-based only through UIDAI ecosystem; non-Aadhaar biometrics require explicit consent with specific purpose limitation", dpdpRef: "Sec 6(1), Sec 9" },
    ],
    retentionGuidance: [
      { dataType: "Patient Medical Records (adults)", minimumPeriod: "3 years from last consultation (MCI recommendation: indefinite)", legalBasis: "Indian Medical Council Regulations, Clinical Establishments Act" },
      { dataType: "Patient Medical Records (minors)", minimumPeriod: "Until patient attains age 25 (i.e., 7 years post-majority)", legalBasis: "DPDP Act Sec 9, Limitation Act considerations" },
      { dataType: "Clinical Trial Records", minimumPeriod: "15 years post-trial completion", legalBasis: "ICMR Guidelines, New Drugs and Clinical Trials Rules 2019" },
      { dataType: "Prescription Records", minimumPeriod: "3 years from date of dispensing", legalBasis: "Drugs and Cosmetics Rules" },
      { dataType: "Insurance Claim Records", minimumPeriod: "8 years from settlement", legalBasis: "IRDAI TPA Regulations, Limitation Act" },
    ],
    breachOverlays: [
      { regulator: "CERT-In", timeline: "6 hours from detection", format: "Incident Report Form per CERT-In Directions 2022" },
      { regulator: "NHA (ABDM participants)", timeline: "72 hours; affected patients notified within 7 days", format: "ABDM Health Data Breach Notification Format" },
      { regulator: "DPBI", timeline: "72 hours per DPDP Act Sec 8(6), Rule 7", format: "Prescribed Form under Rule 7(2)" },
      { regulator: "State Health Authority", timeline: "As per state Clinical Establishments Rules", format: "State-specific format" },
    ],
    riskFactors: [
      "Patient data exposure through inadequately secured telemedicine platforms",
      "Ransomware targeting hospital operational technology and life-critical systems",
      "Unauthorised access to EHR through vendor/third-party integrations",
      "Research data re-identification through linkage attacks on pseudonymised datasets",
      "IoMT (Internet of Medical Things) device vulnerabilities",
      "Cross-border transfer of clinical trial data to foreign sponsors",
    ],
    typicalProcessingBasis: [
      { activity: "Patient Registration & Medical Records", lawfulBasis: "Consent + Vital Interest", dpdpSection: "Sec 6 + Sec 7(f)" },
      { activity: "Emergency Treatment", lawfulBasis: "Vital Interest (without consent)", dpdpSection: "Sec 7(f)" },
      { activity: "Insurance Claims Processing", lawfulBasis: "Performance of Contract + Legal Obligation", dpdpSection: "Sec 7(a)(b)" },
      { activity: "Clinical Research", lawfulBasis: "Explicit Consent (ICMR informed consent)", dpdpSection: "Sec 6(1)" },
      { activity: "Public Health Reporting", lawfulBasis: "Legal Obligation (Epidemic Diseases Act)", dpdpSection: "Sec 7(g)" },
      { activity: "Telemedicine Consultations", lawfulBasis: "Consent + Performance of Contract", dpdpSection: "Sec 6 + Sec 7(a)" },
    ],
  },

  "Technology/IT Services": {
    regulators: [
      "Ministry of Electronics and Information Technology (MeitY)",
      "CERT-In",
      "Telecom Regulatory Authority of India (TRAI — for telecom-adjacent services)",
    ],
    instruments: [
      { name: "Information Technology Act 2000 & IT Amendment Act 2008", citation: "Section 43A, 66, 72A", applicability: "All body corporates possessing sensitive personal data" },
      { name: "IT (Reasonable Security Practices) Rules 2011", citation: "Rule 4, 5, 8", applicability: "All entities implementing IS/ISO/IEC 27001 or equivalent" },
      { name: "CERT-In Directions 2022", citation: "No. 20(3)/2022-CERT-In", applicability: "Service providers, data centres, body corporates, VPN providers" },
      { name: "IT Intermediary Guidelines 2021", citation: "Rule 3, 4, 7", applicability: "Social media intermediaries, significant social media intermediaries" },
      { name: "STPI/SEZ Compliance Framework", citation: "STPI/IT/Export Guidelines", applicability: "IT/ITES companies operating under STPI/SEZ registration" },
    ],
    specialDataCategories: [
      { category: "Client/Customer PII (processed as processor)", handlingRequirement: "Strictly per client DPA; no commingling across clients; sub-processor approval chain; data isolation in multi-tenant SaaS", dpdpRef: "Sec 8(4), Sec 8(8)" },
      { category: "Employee Monitoring Data", handlingRequirement: "Proportionality assessment; notice before monitoring; keystroke/screen recording only with explicit consent and documented business justification", dpdpRef: "Sec 6(1), Sec 7(i)" },
      { category: "Source Code & IP", handlingRequirement: "While not personal data, access controls must prevent inadvertent PII exposure in code repositories; automated PII scanning in CI/CD pipelines", dpdpRef: "Sec 8(5)" },
      { category: "Log Data (containing user identifiers)", handlingRequirement: "Pseudonymise where possible; retention per CERT-In (5 years); access-controlled SIEM with tamper-proof logging", dpdpRef: "Rule 6(e), CERT-In Directions" },
    ],
    retentionGuidance: [
      { dataType: "System/Application Logs", minimumPeriod: "180 days rolling (CERT-In Directions mandate)", legalBasis: "CERT-In Directions 2022, Para 4(vi)" },
      { dataType: "Employee HR Records", minimumPeriod: "8 years post-separation", legalBasis: "Payment of Wages Act, EPF Act, Shops & Establishments Act" },
      { dataType: "Client Data (as Processor)", minimumPeriod: "As per client DPA; default: delete/return within 30 days of contract termination", legalBasis: "DPDP Act Sec 8(8)" },
      { dataType: "NDA/Contract Records", minimumPeriod: "Limitation period + 3 years (typically 6 years)", legalBasis: "Indian Limitation Act 1963" },
    ],
    breachOverlays: [
      { regulator: "CERT-In", timeline: "6 hours from detection", format: "Incident Report Form per CERT-In Directions 2022" },
      { regulator: "DPBI", timeline: "72 hours per DPDP Act Sec 8(6), Rule 7", format: "Prescribed Form under Rule 7(2)" },
      { regulator: "Affected Data Fiduciary clients", timeline: "As per DPA SLA (typically 24–48 hours)", format: "Per contractual template" },
    ],
    riskFactors: [
      "Multi-tenant SaaS data isolation failure",
      "Supply chain compromise through CI/CD pipeline or dependency injection",
      "Unauthorised cross-border data transfer in distributed development teams",
      "Shadow IT and unsanctioned SaaS tool adoption by employees",
      "Client data commingling in shared infrastructure",
      "API security vulnerabilities exposing customer PII",
    ],
    typicalProcessingBasis: [
      { activity: "SaaS Service Delivery (as Processor)", lawfulBasis: "Client DPA (processor acting on DF instructions)", dpdpSection: "Sec 8(4)" },
      { activity: "Employee HR Processing", lawfulBasis: "Employment Contract + Legal Obligation", dpdpSection: "Sec 7(i)" },
      { activity: "Business Development / CRM", lawfulBasis: "Consent", dpdpSection: "Sec 6(1)" },
      { activity: "Product Analytics", lawfulBasis: "Consent (if PII) / Legitimate Use (if anonymised)", dpdpSection: "Sec 6 / Sec 7" },
      { activity: "Security Monitoring & Logging", lawfulBasis: "Legal Obligation (CERT-In) + Legitimate Interest", dpdpSection: "Sec 7(b)" },
    ],
  },

  "EdTech/Education": {
    regulators: [
      "Ministry of Education (MoE)",
      "University Grants Commission (UGC)",
      "All India Council for Technical Education (AICTE)",
      "National Commission for Protection of Child Rights (NCPCR)",
    ],
    instruments: [
      { name: "Right of Children to Free and Compulsory Education Act 2009", citation: "RTE Act, Sec 17, 28", applicability: "All educational institutions serving children aged 6–14" },
      { name: "POCSO Act 2012", citation: "Protection of Children from Sexual Offences Act", applicability: "All institutions dealing with children — mandatory reporting obligations" },
      { name: "UGC (Online and ODL Programmes) Regulations 2024", citation: "UGC Notification F.No.1-2/2024(DEB-I)", applicability: "All universities offering online degree programmes" },
      { name: "NCPCR Guidelines on Children's Digital Safety", citation: "NCPCR Advisory 2023", applicability: "All digital platforms accessed by children" },
    ],
    specialDataCategories: [
      { category: "Student Academic Records", handlingRequirement: "Immutable audit trail for grade modifications; parent/guardian access for minors; portability per UGC norms", dpdpRef: "Sec 11, Sec 12" },
      { category: "Children's Data (under 18)", handlingRequirement: "Verifiable parental consent before processing; no behavioural tracking, profiling, or targeted advertising; age-gating mechanisms at registration; purpose-limited to educational delivery only", dpdpRef: "Sec 9, Rule 10" },
      { category: "Proctoring/Examination Data", handlingRequirement: "Facial recognition/webcam data collected only during examination; deleted within 30 days of result publication; explicit consent with right to alternative examination mode", dpdpRef: "Sec 6(1), Sec 8(7)" },
      { category: "Learning Analytics & Behavioural Data", handlingRequirement: "Aggregated/anonymised for platform improvement; individual-level analytics only with consent; no sharing with third-party advertisers", dpdpRef: "Sec 6(1), Sec 8(4)" },
    ],
    retentionGuidance: [
      { dataType: "Student Enrollment Records", minimumPeriod: "Permanent (for degree verification)", legalBasis: "UGC Regulations, university statutes" },
      { dataType: "Examination Records & Results", minimumPeriod: "Permanent (statutory academic records)", legalBasis: "University Act / UGC norms" },
      { dataType: "Proctoring Video/Audio", minimumPeriod: "30 days post result declaration; 90 days if under dispute", legalBasis: "DPDP Act Sec 8(7), purpose limitation" },
      { dataType: "Attendance & Behavioural Logs", minimumPeriod: "Duration of enrollment + 1 academic year", legalBasis: "DPDP Act Sec 8(7)" },
      { dataType: "Children's Personal Data", minimumPeriod: "Deleted upon withdrawal of consent or graduation from platform", legalBasis: "DPDP Act Sec 9, Rule 10" },
    ],
    breachOverlays: [
      { regulator: "CERT-In", timeline: "6 hours from detection", format: "Incident Report Form per CERT-In Directions 2022" },
      { regulator: "NCPCR (if children's data)", timeline: "24 hours from detection (advisory — best practice)", format: "Written intimation to NCPCR" },
      { regulator: "DPBI", timeline: "72 hours per DPDP Act Sec 8(6), Rule 7", format: "Prescribed Form under Rule 7(2)" },
    ],
    riskFactors: [
      "Children's data exposure through inadequately secured learning platforms",
      "Predatory data collection practices disguised as learning analytics",
      "Third-party SDK/advertising tracker presence in children's educational apps",
      "Parental consent bypass through deceptive registration flows",
      "Proctoring data misuse for surveillance beyond examination purpose",
    ],
    typicalProcessingBasis: [
      { activity: "Student Registration & Enrollment", lawfulBasis: "Consent (parental for minors)", dpdpSection: "Sec 6 + Sec 9" },
      { activity: "Academic Record Keeping", lawfulBasis: "Legal Obligation (UGC/University Act)", dpdpSection: "Sec 7(b)" },
      { activity: "Online Examination & Proctoring", lawfulBasis: "Consent (explicit, purpose-limited)", dpdpSection: "Sec 6(1)" },
      { activity: "Learning Analytics", lawfulBasis: "Consent (optional, not condition of service)", dpdpSection: "Sec 6(3)" },
      { activity: "Marketing to Prospective Students", lawfulBasis: "Consent", dpdpSection: "Sec 6(1)" },
    ],
  },
};

// ── Maturity-Calibrated Language ──────────────────────────────────

export interface MaturityLanguage {
  /** Obligation verb: "shall establish" vs "maintains and continuously improves" */
  obligationVerb: string;
  /** Control implementation posture */
  controlPosture: string;
  /** Evidence expectation */
  evidenceExpectation: string;
  /** Review frequency */
  reviewCadence: string;
  /** Governance complexity */
  governanceDepth: string;
  /** Automation expectation */
  automationExpectation: string;
}

const MATURITY_LANGUAGE: Record<string, MaturityLanguage> = {
  initial: {
    obligationVerb: "shall establish and implement",
    controlPosture: "The organisation is in the foundational stage of implementing formal controls. This document establishes the baseline requirements that must be operationalised within 90 days of approval.",
    evidenceExpectation: "Evidence requirements: documented policies (even if manual), email/meeting records of awareness sessions, signed acknowledgement forms.",
    reviewCadence: "This document shall be reviewed semi-annually during the initial implementation phase, with a first review within 6 months of effective date.",
    governanceDepth: "A designated Privacy Champion (which may be an existing role with additional responsibility) shall be appointed to oversee implementation.",
    automationExpectation: "Manual processes are acceptable during the initial phase, with a documented roadmap for automation within 12–18 months.",
  },
  developing: {
    obligationVerb: "is in the process of formalising and shall complete implementation of",
    controlPosture: "The organisation has initiated formal controls and is progressing towards documented, repeatable processes. Gaps identified during initial assessment are being actively remediated.",
    evidenceExpectation: "Evidence requirements: approved policy documents, process flow documentation, training completion records, initial risk assessment outputs.",
    reviewCadence: "This document shall be reviewed annually, with interim reviews triggered by material changes in processing activities or regulatory requirements.",
    governanceDepth: "A Data Protection Officer or equivalent privacy lead shall be formally appointed with documented responsibilities and reporting lines to senior management.",
    automationExpectation: "Key processes (consent management, DSR handling, breach detection) shall have documented workflows with target automation within 6–12 months.",
  },
  defined: {
    obligationVerb: "has established and maintains",
    controlPosture: "The organisation operates documented, standardised processes for data protection. Controls are consistently implemented across all business units and processing activities.",
    evidenceExpectation: "Evidence requirements: approved policies with version control, process documentation with RACI matrices, training records with competency assessment, risk register with treatment plans, audit reports.",
    reviewCadence: "Annual review cycle with Board-level reporting. Triggered reviews upon regulatory changes, significant incidents, or material changes to processing activities.",
    governanceDepth: "Dedicated DPO with direct Board reporting line. Privacy governance committee with cross-functional representation. Quarterly GRC steering committee reviews.",
    automationExpectation: "Core processes shall be tool-supported: consent management platform, automated DSR workflow, SIEM-integrated breach detection, automated policy distribution and acknowledgement tracking.",
  },
  managed: {
    obligationVerb: "maintains, monitors, and measures the effectiveness of",
    controlPosture: "The organisation operates a measured, metrics-driven data protection programme. Controls are monitored for effectiveness with defined KPIs and KRIs, and deviations trigger corrective action.",
    evidenceExpectation: "Evidence requirements: all 'defined' level evidence plus — KPI/KRI dashboards, control effectiveness metrics, trend analysis reports, independent audit findings with closure tracking, benchmarking data.",
    reviewCadence: "Continuous monitoring with quarterly metrics review. Annual independent audit. Board-level privacy risk dashboard updated monthly.",
    governanceDepth: "Dedicated privacy team. DPO with Board-level reporting and independent budget. Cross-functional privacy champions network. Privacy embedded in enterprise risk management framework.",
    automationExpectation: "Fully automated consent lifecycle management, real-time DSAR fulfilment, automated data discovery and classification, AI-assisted privacy impact assessment, continuous compliance monitoring.",
  },
  optimising: {
    obligationVerb: "continuously improves and optimises",
    controlPosture: "The organisation operates a best-in-class, continuously improving data protection programme. Controls are proactively enhanced based on threat intelligence, industry benchmarks, and emerging regulatory trends.",
    evidenceExpectation: "Evidence requirements: all 'managed' level evidence plus — continuous improvement documentation, innovation initiatives, industry contribution/thought leadership, external certifications, peer benchmarking.",
    reviewCadence: "Continuous monitoring with real-time alerting. Quarterly strategic review. Annual external certification renewal. Proactive regulatory engagement.",
    governanceDepth: "Privacy as a strategic business enabler. Board-level privacy committee. Privacy engineering team embedded in product development. External advisory board. Industry working group participation.",
    automationExpectation: "AI-powered privacy operations: automated data flow mapping, predictive compliance risk scoring, self-healing consent mechanisms, automated regulatory change impact analysis.",
  },
};

// ── Size-Calibrated Governance ───────────────────────────────────

export interface SizeCalibration {
  governanceStructure: string;
  resourceExpectation: string;
  implementationTimeline: string;
  auditExpectation: string;
}

const SIZE_CALIBRATIONS: Record<string, SizeCalibration> = {
  startup: {
    governanceStructure: "A designated Privacy Champion (may be founder/CTO with additional responsibility) shall oversee data protection compliance. External DPO services may be engaged to fulfil statutory requirements.",
    resourceExpectation: "Resource allocation shall be proportionate to processing volume. A minimum of 0.5 FTE equivalent shall be dedicated to privacy operations.",
    implementationTimeline: "Core compliance controls shall be implemented within 60 days of this policy's effective date. Full programme maturity within 12 months.",
    auditExpectation: "Annual self-assessment with external spot-check. Independent audit upon reaching Significant Data Fiduciary threshold.",
  },
  sme: {
    governanceStructure: "A designated DPO (which may be an internal role with primary privacy responsibility or an external appointment) shall report to the Managing Director. A Privacy Working Group comprising IT, Legal, and HR representatives shall meet quarterly.",
    resourceExpectation: "Minimum 1 FTE dedicated to privacy operations, supplemented by cross-functional privacy champions in each department.",
    implementationTimeline: "Core compliance controls within 90 days. Full DPDP Act compliance within 6 months. Continuous improvement programme from Month 7.",
    auditExpectation: "Annual internal audit by qualified assessor. External audit every 2 years or upon SDF notification.",
  },
  "mid-market": {
    governanceStructure: "Dedicated DPO with a privacy team of 2–4 members. Privacy Governance Committee chaired by CLO/GC with CTO, CHRO, and CMO representation. Quarterly Board reporting.",
    resourceExpectation: "Dedicated privacy team of 2–4 FTEs. Privacy champions network across all departments. Budget line for privacy tooling and training.",
    implementationTimeline: "Core compliance controls within 60 days. Advanced controls (automated consent, DSAR workflow, breach detection) within 6 months.",
    auditExpectation: "Annual internal audit. Biennial external audit by CERT-In empanelled auditor or Big Four firm. Quarterly control testing.",
  },
  enterprise: {
    governanceStructure: "Chief Privacy Officer / DPO reporting to the Board. Dedicated Privacy Office with specialised roles: Privacy Counsel, Privacy Engineer, Compliance Analysts, DSR Operations. Enterprise Privacy Governance Committee with C-suite representation.",
    resourceExpectation: "Privacy Office of 5–15 FTEs depending on processing volume. Dedicated privacy technology stack. Annual training budget of ₹X per employee.",
    implementationTimeline: "Phased implementation: Phase 1 (90 days) — governance framework and critical controls; Phase 2 (180 days) — automation and monitoring; Phase 3 (365 days) — optimisation and continuous improvement.",
    auditExpectation: "Quarterly internal control testing. Annual comprehensive internal audit. Annual external audit by independent assessor. Continuous monitoring via GRC platform.",
  },
  mnc: {
    governanceStructure: "Global Privacy Office with regional DPOs. India DPO reporting to Global CPO and India Board. Cross-jurisdictional Privacy Governance Council. Dedicated Privacy Engineering team embedded in product development.",
    resourceExpectation: "India Privacy Office of 8–20 FTEs. Global shared services for privacy operations. Enterprise GRC platform. Dedicated privacy legal counsel.",
    implementationTimeline: "Alignment of global privacy programme to DPDP Act requirements within 90 days. Full India-specific implementation within 180 days. Cross-border transfer mechanism implementation within 120 days.",
    auditExpectation: "Continuous automated monitoring. Monthly control testing. Quarterly management review. Annual external audit by Big Four/specialist firm. SOC 2 Type II certification maintained.",
  },
};

// ── Public API ──────────────────────────────────────────────────

export function getSectorOverlay(industry: string): SectorOverlay | null {
  return SECTOR_OVERLAYS[industry] || null;
}

export function getMaturityLanguageProfile(level: string): MaturityLanguage {
  return MATURITY_LANGUAGE[level] || MATURITY_LANGUAGE.defined;
}

export function getSizeCalibration(size: string): SizeCalibration {
  return SIZE_CALIBRATIONS[size] || SIZE_CALIBRATIONS.enterprise;
}

/**
 * Generates a comprehensive context block for AI prompt injection or
 * template enrichment. This is the single function that transforms
 * generic documents into sector-specific, maturity-calibrated,
 * organisation-tailored compliance artefacts.
 */
export function generateEnrichmentBlock(ctx: OrgContext): string {
  const sector = getSectorOverlay(ctx.industry);
  const maturity = getMaturityLanguageProfile(ctx.maturityLevel);
  const size = getSizeCalibration(ctx.orgSize);

  let block = "";

  // Maturity posture
  block += `\n\nCOMPLIANCE MATURITY POSTURE\n${"─".repeat(60)}\n`;
  block += `${maturity.controlPosture}\n`;
  block += `${maturity.evidenceExpectation}\n`;
  block += `Review Cadence: ${maturity.reviewCadence}\n`;
  block += `Governance: ${maturity.governanceDepth}\n`;
  block += `Automation: ${maturity.automationExpectation}\n`;

  // Size calibration
  block += `\nORGANISATION SCALE CALIBRATION\n${"─".repeat(60)}\n`;
  block += `${size.governanceStructure}\n`;
  block += `${size.resourceExpectation}\n`;
  block += `Implementation Timeline: ${size.implementationTimeline}\n`;
  block += `Audit Requirement: ${size.auditExpectation}\n`;

  // Sector overlay
  if (sector) {
    block += `\nSECTOR-SPECIFIC REGULATORY OVERLAY: ${ctx.industry.toUpperCase()}\n${"─".repeat(60)}\n`;
    block += `Applicable Regulators: ${sector.regulators.join("; ")}\n\n`;

    block += `Regulatory Instruments:\n`;
    for (const inst of sector.instruments) {
      block += `• ${inst.name} [${inst.citation}] — ${inst.applicability}\n`;
    }

    block += `\nSpecial Data Categories Requiring Enhanced Controls:\n`;
    for (const cat of sector.specialDataCategories) {
      block += `• ${cat.category}: ${cat.handlingRequirement} [Ref: ${cat.dpdpRef}]\n`;
    }

    block += `\nStatutory Retention Requirements:\n`;
    for (const ret of sector.retentionGuidance) {
      block += `• ${ret.dataType}: ${ret.minimumPeriod} [${ret.legalBasis}]\n`;
    }

    block += `\nBreach Notification Obligations (Beyond DPDP Act):\n`;
    for (const br of sector.breachOverlays) {
      block += `• ${br.regulator}: ${br.timeline} — ${br.format}\n`;
    }

    block += `\nSector Risk Factors:\n`;
    for (const risk of sector.riskFactors) {
      block += `• ${risk}\n`;
    }

    block += `\nTypical Processing Basis Matrix:\n`;
    for (const pb of sector.typicalProcessingBasis) {
      block += `• ${pb.activity} → ${pb.lawfulBasis} [${pb.dpdpSection}]\n`;
    }
  }

  return block;
}

/**
 * Generates the sector-specific prompt segment for AI policy generation.
 * This replaces the generic "tailor to this org" instruction with
 * concrete, enforceable requirements the LLM must follow.
 */
export function generateAIPromptSegment(ctx: OrgContext): string {
  const sector = getSectorOverlay(ctx.industry);
  const maturity = getMaturityLanguageProfile(ctx.maturityLevel);
  const size = getSizeCalibration(ctx.orgSize);

  let segment = `\n\n══ SECTOR-SPECIFIC DRAFTING REQUIREMENTS ══\n\n`;

  // Maturity-calibrated language
  segment += `MATURITY CALIBRATION (${ctx.maturityLevel.toUpperCase()}):\n`;
  segment += `- Use obligation language: "${maturity.obligationVerb}"\n`;
  segment += `- Control posture: ${maturity.controlPosture}\n`;
  segment += `- Evidence standard: ${maturity.evidenceExpectation}\n`;
  segment += `- Governance model: ${maturity.governanceDepth}\n`;
  segment += `- Automation expectation: ${maturity.automationExpectation}\n\n`;

  // Size calibration
  segment += `ORGANISATION SCALE (${ctx.orgSize.toUpperCase()}):\n`;
  segment += `- Governance structure: ${size.governanceStructure}\n`;
  segment += `- Resources: ${size.resourceExpectation}\n`;
  segment += `- Timeline: ${size.implementationTimeline}\n`;
  segment += `- Audit: ${size.auditExpectation}\n\n`;

  // Sector overlay
  if (sector) {
    segment += `SECTOR REGULATORY OVERLAY (${ctx.industry.toUpperCase()}):\n`;
    segment += `CRITICAL: In addition to DPDP Act 2023, this document MUST incorporate and cite the following sector-specific regulations:\n`;
    for (const inst of sector.instruments) {
      segment += `- ${inst.name} [${inst.citation}]\n`;
    }

    segment += `\nSPECIAL DATA CATEGORIES — Mandatory Enhanced Controls:\n`;
    for (const cat of sector.specialDataCategories) {
      segment += `- ${cat.category}: ${cat.handlingRequirement}\n`;
    }

    segment += `\nRETENTION SCHEDULE — Use These Exact Periods:\n`;
    for (const ret of sector.retentionGuidance) {
      segment += `- ${ret.dataType}: ${ret.minimumPeriod} [${ret.legalBasis}]\n`;
    }

    segment += `\nBREACH NOTIFICATION — Include All These Timelines:\n`;
    for (const br of sector.breachOverlays) {
      segment += `- ${br.regulator}: ${br.timeline}\n`;
    }

    segment += `\nSECTOR RISK FACTORS — Address These Specifically:\n`;
    for (const risk of sector.riskFactors) {
      segment += `- ${risk}\n`;
    }
  }

  return segment;
}