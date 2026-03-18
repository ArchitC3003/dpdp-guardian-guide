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

  // Healthcare/Healthtech
  { industryVertical: "Healthcare/Healthtech", jurisdiction: "India/DPDP", framework: "DPDP Act Section 8 — Sensitive Data", authority: "MEITY", sourceUrl: "https://www.meity.gov.in", description: "Health data classified as sensitive personal data" },
  { industryVertical: "Healthcare/Healthtech", jurisdiction: "EU/GDPR", framework: "GDPR Article 9 — Special Category Data", authority: "EDPB", sourceUrl: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines_en", description: "Health data as special category under GDPR" },
  { industryVertical: "Healthcare/Healthtech", jurisdiction: "India/Sector", framework: "Clinical Establishments Act", authority: "Ministry of Health", sourceUrl: "https://clinicalestablishments.gov.in/", description: "Patient data retention and disclosure norms" },
  { industryVertical: "Healthcare/Healthtech", jurisdiction: "India/Sector", framework: "IRDAI Health Insurance Guidelines", authority: "IRDAI", sourceUrl: "https://irdai.gov.in/", description: "Health insurance data processing rules" },

  // BFSI/Banking
  { industryVertical: "BFSI/Banking", jurisdiction: "India/Sector", framework: "RBI Master Direction on IT Framework", authority: "RBI", sourceUrl: "https://www.rbi.org.in/Scripts/PublicationReportDetails.aspx?UrlPage=&ID=961", description: "IT and data governance for banks and NBFCs" },
  { industryVertical: "BFSI/Banking", jurisdiction: "India/Sector", framework: "SEBI Cybersecurity Framework", authority: "SEBI", sourceUrl: "https://www.sebi.gov.in/", description: "Cybersecurity and data protection for capital markets" },
  { industryVertical: "BFSI/Banking", jurisdiction: "India/Sector", framework: "IRDAI Data Privacy Guidelines", authority: "IRDAI", sourceUrl: "https://irdai.gov.in/", description: "Insurance sector personal data governance" },
  { industryVertical: "BFSI/Banking", jurisdiction: "International", framework: "PCI-DSS v4.0", authority: "PCI Security Standards Council", sourceUrl: "https://www.pcisecuritystandards.org/", description: "Payment card data security standards" },

  // Insurance
  { industryVertical: "Insurance", jurisdiction: "India/Sector", framework: "IRDAI Data Privacy Guidelines", authority: "IRDAI", sourceUrl: "https://irdai.gov.in/", description: "Insurance sector personal data governance" },

  // Retail/E-commerce
  { industryVertical: "Retail/E-commerce", jurisdiction: "India/Sector", framework: "Consumer Protection (E-commerce) Rules 2020", authority: "Ministry of Consumer Affairs", sourceUrl: "https://consumeraffairs.nic.in/", description: "E-commerce platform data obligations" },
  { industryVertical: "Retail/E-commerce", jurisdiction: "India/Sector", framework: "UPI / Payment Aggregator RBI Guidelines", authority: "RBI", sourceUrl: "https://www.rbi.org.in/", description: "Payment aggregator and data storage rules" },

  // Manufacturing
  { industryVertical: "Manufacturing", jurisdiction: "India/Labour", framework: "Factories Act & State Labour Laws", authority: "Ministry of Labour", sourceUrl: "https://labour.gov.in/", description: "Employee data obligations under labour law" },
  { industryVertical: "Manufacturing", jurisdiction: "India/Sector", framework: "POSH Act Internal Committee Records", authority: "Ministry of Women & Child Development", sourceUrl: "https://wcd.nic.in/", description: "POSH complaint and case data handling" },

  // EdTech/Education
  { industryVertical: "EdTech/Education", jurisdiction: "India/Sector", framework: "NEP 2020 Data Governance Guidelines", authority: "Ministry of Education", sourceUrl: "https://www.education.gov.in/", description: "Student data management under NEP" },
  { industryVertical: "EdTech/Education", jurisdiction: "International", framework: "COPPA (for minors)", authority: "FTC", sourceUrl: "https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa", description: "Children's privacy for under-13 users" },

  // Technology/IT Services
  { industryVertical: "Technology/IT Services", jurisdiction: "EU/GDPR", framework: "GDPR — DPA & SCCs", authority: "EDPB", sourceUrl: "https://www.edpb.europa.eu/", description: "Data processing agreements and cross-border transfer tools" },
  { industryVertical: "Technology/IT Services", jurisdiction: "International", framework: "ISO/IEC 27701:2019", authority: "ISO", sourceUrl: "https://www.iso.org/standard/71670.html", description: "Privacy information management standard" },
  { industryVertical: "Technology/IT Services", jurisdiction: "International", framework: "NIST Privacy Framework v1.1", authority: "NIST", sourceUrl: "https://www.nist.gov/privacy-framework", description: "Enterprise privacy risk management framework" },

  // Telecom
  { industryVertical: "Telecom", jurisdiction: "India/Sector", framework: "TRAI Regulations on Privacy & Data Protection", authority: "TRAI", sourceUrl: "https://www.trai.gov.in/", description: "Telecom subscriber data privacy regulations" },
  { industryVertical: "Telecom", jurisdiction: "India/Sector", framework: "DoT License Conditions — Security & Privacy", authority: "DoT", sourceUrl: "https://dot.gov.in/", description: "License obligations for subscriber data handling" },

  // Hospitality & Travel
  { industryVertical: "Hospitality & Travel", jurisdiction: "India/Sector", framework: "Bureau of Immigration — FRRO Guest Registration", authority: "Bureau of Immigration", sourceUrl: "https://boi.gov.in/", description: "Mandatory foreign guest data reporting" },
  { industryVertical: "Hospitality & Travel", jurisdiction: "India/Sector", framework: "FSSAI Regulations (Food & Beverage Data)", authority: "FSSAI", sourceUrl: "https://fssai.gov.in/", description: "Food safety compliance and customer data" },

  // Media & Entertainment
  { industryVertical: "Media & Entertainment", jurisdiction: "India/Sector", framework: "IT Intermediary Guidelines 2021", authority: "MEITY", sourceUrl: "https://www.meity.gov.in/", description: "Social media and digital platform obligations" },
  { industryVertical: "Media & Entertainment", jurisdiction: "India/Sector", framework: "Cable Television Networks Rules", authority: "MIB", sourceUrl: "https://mib.gov.in/", description: "Broadcasting and content distribution data norms" },

  // Energy & Utilities
  { industryVertical: "Energy & Utilities", jurisdiction: "India/Sector", framework: "Electricity Act & Smart Meter Data Privacy", authority: "CEA/BEE", sourceUrl: "https://cea.nic.in/", description: "Consumer metering data privacy obligations" },
  { industryVertical: "Energy & Utilities", jurisdiction: "India/Sector", framework: "PNGRB Regulations", authority: "PNGRB", sourceUrl: "https://www.pngrb.gov.in/", description: "Oil & gas consumer data regulations" },

  // Real Estate & PropTech
  { industryVertical: "Real Estate & PropTech", jurisdiction: "India/Sector", framework: "RERA — Buyer Data Protection Obligations", authority: "RERA Authorities", sourceUrl: "https://rera.gov.in/", description: "Real estate buyer data handling under RERA" },

  // Logistics & Supply Chain
  { industryVertical: "Logistics & Supply Chain", jurisdiction: "India/Sector", framework: "Motor Vehicles Act — Fleet Data", authority: "MoRTH", sourceUrl: "https://morth.nic.in/", description: "Vehicle and driver data processing obligations" },
  { industryVertical: "Logistics & Supply Chain", jurisdiction: "India/Sector", framework: "Customs Act — Trade Data", authority: "CBIC", sourceUrl: "https://www.cbic.gov.in/", description: "Cross-border trade data handling" },

  // Agriculture & AgriTech
  { industryVertical: "Agriculture & AgriTech", jurisdiction: "India/Sector", framework: "AgriStack — Farmer Data Guidelines", authority: "Ministry of Agriculture", sourceUrl: "https://agricoop.nic.in/", description: "Farmer data collection and usage norms" },
  { industryVertical: "Agriculture & AgriTech", jurisdiction: "India/Sector", framework: "PM-KISAN Beneficiary Data Protection", authority: "Ministry of Agriculture", sourceUrl: "https://pmkisan.gov.in/", description: "Government scheme beneficiary data handling" },

  // Government/PSU
  { industryVertical: "Government/PSU", jurisdiction: "India/Sector", framework: "e-Governance Standards & Data Sharing Policy", authority: "MEITY/NIC", sourceUrl: "https://www.meity.gov.in/", description: "Government data sharing and privacy standards" },

  // All industries — International frameworks
  { industryVertical: "All", jurisdiction: "International", framework: "ENISA Guidelines", authority: "ENISA", sourceUrl: "https://www.enisa.europa.eu/publications", description: "EU cybersecurity and privacy guidelines" },
  { industryVertical: "All", jurisdiction: "International", framework: "ISO/IEC 29100:2011 Privacy Framework", authority: "ISO", sourceUrl: "https://www.iso.org/standard/45123.html", description: "Privacy principles and framework" },
  { industryVertical: "All", jurisdiction: "International", framework: "CIS Controls v8", authority: "CIS", sourceUrl: "https://www.cisecurity.org/controls/v8/", description: "Security and privacy controls for all sectors" },
];
