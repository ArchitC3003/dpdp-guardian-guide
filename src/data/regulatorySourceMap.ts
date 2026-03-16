export interface RegulatorySourceEntry {
  industryVertical: string;
  jurisdiction: string;
  framework: string;
  authority: string;
  sourceUrl: string;
  description: string;
}

export const REGULATORY_SOURCE_MAP: RegulatorySourceEntry[] = [
  // India — DPDP Act (All industries)
  { industryVertical: "All", jurisdiction: "India/DPDP", framework: "DPDP Act 2023", authority: "MEITY", sourceUrl: "https://www.meity.gov.in/content/digital-personal-data-protection-act-2023", description: "Primary Indian data protection legislation" },
  { industryVertical: "All", jurisdiction: "India/IT Act", framework: "IT Act 2000 & IT Rules 2011", authority: "MEITY", sourceUrl: "https://www.meity.gov.in/content/information-technology-act-2000", description: "IT Act SPDI rules for sensitive personal data" },
  { industryVertical: "All", jurisdiction: "India/CERT-In", framework: "CERT-In Cybersecurity Directions 2022", authority: "CERT-In", sourceUrl: "https://www.cert-in.org.in/", description: "Mandatory incident reporting within 6 hours" },

  // Healthcare
  { industryVertical: "Healthcare/Healthtech", jurisdiction: "India/DPDP", framework: "DPDP Act Section 8 — Sensitive Data", authority: "MEITY", sourceUrl: "https://www.meity.gov.in", description: "Health data classified as sensitive personal data" },
  { industryVertical: "Healthcare/Healthtech", jurisdiction: "EU/GDPR", framework: "GDPR Article 9 — Special Category Data", authority: "EDPB", sourceUrl: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines_en", description: "Health data as special category under GDPR" },
  { industryVertical: "Healthcare/Healthtech", jurisdiction: "India/Sector", framework: "Clinical Establishments Act", authority: "Ministry of Health", sourceUrl: "https://clinicalestablishments.gov.in/", description: "Patient data retention and disclosure norms" },
  { industryVertical: "Healthcare/Healthtech", jurisdiction: "India/Sector", framework: "IRDAI Health Insurance Guidelines", authority: "IRDAI", sourceUrl: "https://irdai.gov.in/", description: "Health insurance data processing rules" },

  // BFSI
  { industryVertical: "BFSI", jurisdiction: "India/Sector", framework: "RBI Master Direction on IT Framework", authority: "RBI", sourceUrl: "https://www.rbi.org.in/Scripts/PublicationReportDetails.aspx?UrlPage=&ID=961", description: "IT and data governance for banks and NBFCs" },
  { industryVertical: "BFSI", jurisdiction: "India/Sector", framework: "SEBI Cybersecurity Framework", authority: "SEBI", sourceUrl: "https://www.sebi.gov.in/", description: "Cybersecurity and data protection for capital markets" },
  { industryVertical: "BFSI", jurisdiction: "India/Sector", framework: "IRDAI Data Privacy Guidelines", authority: "IRDAI", sourceUrl: "https://irdai.gov.in/", description: "Insurance sector personal data governance" },
  { industryVertical: "BFSI", jurisdiction: "International", framework: "PCI-DSS v4.0", authority: "PCI Security Standards Council", sourceUrl: "https://www.pcisecuritystandards.org/", description: "Payment card data security standards" },

  // Also match BFSI/Banking variant
  { industryVertical: "BFSI/Banking", jurisdiction: "India/Sector", framework: "RBI Master Direction on IT Framework", authority: "RBI", sourceUrl: "https://www.rbi.org.in/Scripts/PublicationReportDetails.aspx?UrlPage=&ID=961", description: "IT and data governance for banks and NBFCs" },
  { industryVertical: "BFSI/Banking", jurisdiction: "India/Sector", framework: "SEBI Cybersecurity Framework", authority: "SEBI", sourceUrl: "https://www.sebi.gov.in/", description: "Cybersecurity and data protection for capital markets" },
  { industryVertical: "BFSI/Banking", jurisdiction: "International", framework: "PCI-DSS v4.0", authority: "PCI Security Standards Council", sourceUrl: "https://www.pcisecuritystandards.org/", description: "Payment card data security standards" },

  // E-commerce
  { industryVertical: "E-commerce", jurisdiction: "India/Sector", framework: "Consumer Protection (E-commerce) Rules 2020", authority: "Ministry of Consumer Affairs", sourceUrl: "https://consumeraffairs.nic.in/", description: "E-commerce platform data obligations" },
  { industryVertical: "E-commerce", jurisdiction: "India/Sector", framework: "UPI / Payment Aggregator RBI Guidelines", authority: "RBI", sourceUrl: "https://www.rbi.org.in/", description: "Payment aggregator and data storage rules" },
  { industryVertical: "Retail/E-commerce", jurisdiction: "India/Sector", framework: "Consumer Protection (E-commerce) Rules 2020", authority: "Ministry of Consumer Affairs", sourceUrl: "https://consumeraffairs.nic.in/", description: "E-commerce platform data obligations" },

  // Manufacturing
  { industryVertical: "Manufacturing", jurisdiction: "India/Labour", framework: "Factories Act & State Labour Laws", authority: "Ministry of Labour", sourceUrl: "https://labour.gov.in/", description: "Employee data obligations under labour law" },
  { industryVertical: "Manufacturing", jurisdiction: "India/Sector", framework: "POSH Act Internal Committee Records", authority: "Ministry of Women & Child Development", sourceUrl: "https://wcd.nic.in/", description: "POSH complaint and case data handling" },

  // EdTech
  { industryVertical: "EdTech", jurisdiction: "India/Sector", framework: "NEP 2020 Data Governance Guidelines", authority: "Ministry of Education", sourceUrl: "https://www.education.gov.in/", description: "Student data management under NEP" },
  { industryVertical: "EdTech", jurisdiction: "International", framework: "COPPA (for minors)", authority: "FTC", sourceUrl: "https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa", description: "Children's privacy for under-13 users" },
  { industryVertical: "EdTech/Education", jurisdiction: "India/Sector", framework: "NEP 2020 Data Governance Guidelines", authority: "Ministry of Education", sourceUrl: "https://www.education.gov.in/", description: "Student data management under NEP" },
  { industryVertical: "EdTech/Education", jurisdiction: "International", framework: "COPPA (for minors)", authority: "FTC", sourceUrl: "https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa", description: "Children's privacy for under-13 users" },

  // Technology/IT Services
  { industryVertical: "Technology/IT Services", jurisdiction: "EU/GDPR", framework: "GDPR — DPA & SCCs", authority: "EDPB", sourceUrl: "https://www.edpb.europa.eu/", description: "Data processing agreements and cross-border transfer tools" },
  { industryVertical: "Technology/IT Services", jurisdiction: "International", framework: "ISO/IEC 27701:2019", authority: "ISO", sourceUrl: "https://www.iso.org/standard/71670.html", description: "Privacy information management standard" },
  { industryVertical: "Technology/IT Services", jurisdiction: "International", framework: "NIST Privacy Framework v1.1", authority: "NIST", sourceUrl: "https://www.nist.gov/privacy-framework", description: "Enterprise privacy risk management framework" },

  // Insurance
  { industryVertical: "Insurance", jurisdiction: "India/Sector", framework: "IRDAI Data Privacy Guidelines", authority: "IRDAI", sourceUrl: "https://irdai.gov.in/", description: "Insurance sector personal data governance" },

  // All industries — International frameworks
  { industryVertical: "All", jurisdiction: "International", framework: "ENISA Guidelines", authority: "ENISA", sourceUrl: "https://www.enisa.europa.eu/publications", description: "EU cybersecurity and privacy guidelines" },
  { industryVertical: "All", jurisdiction: "International", framework: "ISO/IEC 29100:2011 Privacy Framework", authority: "ISO", sourceUrl: "https://www.iso.org/standard/45123.html", description: "Privacy principles and framework" },
  { industryVertical: "All", jurisdiction: "International", framework: "CIS Controls v8", authority: "CIS", sourceUrl: "https://www.cisecurity.org/controls/v8/", description: "Security and privacy controls for all sectors" },

  // HealthTech/Healthcare variant
  { industryVertical: "HealthTech/Healthcare", jurisdiction: "India/DPDP", framework: "DPDP Act Section 8 — Sensitive Data", authority: "MEITY", sourceUrl: "https://www.meity.gov.in", description: "Health data classified as sensitive personal data" },
  { industryVertical: "HealthTech/Healthcare", jurisdiction: "India/Sector", framework: "Clinical Establishments Act", authority: "Ministry of Health", sourceUrl: "https://clinicalestablishments.gov.in/", description: "Patient data retention and disclosure norms" },
];
