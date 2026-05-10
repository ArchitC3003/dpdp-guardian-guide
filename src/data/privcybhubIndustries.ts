import type {
  ExecuteIndustry,
  SunburstNode,
  TriggeredFlags,
  CrosswalkSummary,
} from "@/types/execute";

/**
 * PrivCybHub Sectoral Classification v1.0
 * Source: PrivCybHub_Sectoral_Classification_Handbook_v1.0.docx
 * Schema: privcybhub.sectoral.v1
 * 88 sub-sectors across 16 clusters of the Indian economy.
 */
export const PRIVCYBHUB_INDUSTRIES: ExecuteIndustry[] = [
  // Cluster 1 — Agriculture & Allied
  { PrivCybHub_Sector_ID: "PCH-01.01.01", Cluster_ID: 1, Cluster: "Agriculture & Allied", Sector_Group: "Primary Agriculture", Sub_Sector: "Crop Farming", Micro_Activity: "Cultivation; Harvesting; Contract Farming", DPDP_Exposure: "Low", Analysis_Granularity: "Cluster", Sectoral_Regulator: "Ministry of Agriculture; APMC Acts", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-01.01.02", Cluster_ID: 1, Cluster: "Agriculture & Allied", Sector_Group: "Primary Agriculture", Sub_Sector: "Plantation Economy", Micro_Activity: "Tea; Coffee; Rubber Estates", DPDP_Exposure: "Low", Analysis_Granularity: "Cluster", Sectoral_Regulator: "Tea Board; Coffee Board; Rubber Board", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-01.02.01", Cluster_ID: 1, Cluster: "Agriculture & Allied", Sector_Group: "Allied Activities", Sub_Sector: "Dairy", Micro_Activity: "Milk Collection; Processing; Distribution", DPDP_Exposure: "Low", Analysis_Granularity: "Cluster", Sectoral_Regulator: "FSSAI; NDDB", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-01.02.02", Cluster_ID: 1, Cluster: "Agriculture & Allied", Sector_Group: "Allied Activities", Sub_Sector: "Fisheries", Micro_Activity: "Inland Fishing; Aquaculture; Export", DPDP_Exposure: "Low", Analysis_Granularity: "Cluster", Sectoral_Regulator: "Department of Fisheries; MPEDA", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-01.02.03", Cluster_ID: 1, Cluster: "Agriculture & Allied", Sector_Group: "Allied Activities", Sub_Sector: "Poultry & Livestock", Micro_Activity: "Breeding; Feed Supply; Processing", DPDP_Exposure: "Low", Analysis_Granularity: "Cluster", Sectoral_Regulator: "Animal Husbandry Dept; FSSAI", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-01.03.01", Cluster_ID: 1, Cluster: "Agriculture & Allied", Sector_Group: "Agri Inputs", Sub_Sector: "Seeds & Fertilizers", Micro_Activity: "Manufacturing; Distribution", DPDP_Exposure: "Low", Analysis_Granularity: "Cluster", Sectoral_Regulator: "Seeds Act; Fertiliser Control Order", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-01.03.02", Cluster_ID: 1, Cluster: "Agriculture & Allied", Sector_Group: "Agri Inputs", Sub_Sector: "Equipment & Machinery", Micro_Activity: "Tractors; Irrigation Systems", DPDP_Exposure: "Low", Analysis_Granularity: "Cluster", Sectoral_Regulator: "BIS; Ministry of Heavy Industries", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-01.04.01", Cluster_ID: 1, Cluster: "Agriculture & Allied", Sector_Group: "Agri Services", Sub_Sector: "AgriTech Platforms", Micro_Activity: "Farm Analytics; Marketplaces", DPDP_Exposure: "Low", Analysis_Granularity: "Cluster", Sectoral_Regulator: "MeitY; IT Rules 2021", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  // Cluster 2 — Natural Resources
  { PrivCybHub_Sector_ID: "PCH-02.01.01", Cluster_ID: 2, Cluster: "Natural Resources", Sector_Group: "Extractive Industries", Sub_Sector: "Mining", Micro_Activity: "Coal; Metals Extraction", DPDP_Exposure: "Low", Analysis_Granularity: "Cluster", Sectoral_Regulator: "Ministry of Mines; MMDR Act", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-02.01.02", Cluster_ID: 2, Cluster: "Natural Resources", Sector_Group: "Extractive Industries", Sub_Sector: "Quarrying", Micro_Activity: "Sand; Stone Mining", DPDP_Exposure: "Low", Analysis_Granularity: "Cluster", Sectoral_Regulator: "State Mining Departments; MMDR Act", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-02.02.01", Cluster_ID: 2, Cluster: "Natural Resources", Sector_Group: "Oil & Gas Upstream", Sub_Sector: "Exploration", Micro_Activity: "Seismic Surveys", DPDP_Exposure: "Low", Analysis_Granularity: "Cluster", Sectoral_Regulator: "DGH; PNGRB", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-02.02.02", Cluster_ID: 2, Cluster: "Natural Resources", Sector_Group: "Oil & Gas Upstream", Sub_Sector: "Drilling & Extraction", Micro_Activity: "Offshore; Onshore Rigs", DPDP_Exposure: "Low", Analysis_Granularity: "Cluster", Sectoral_Regulator: "DGH; PNGRB", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  // Cluster 3 — Manufacturing
  { PrivCybHub_Sector_ID: "PCH-03.01.01", Cluster_ID: 3, Cluster: "Manufacturing", Sector_Group: "Consumer Goods", Sub_Sector: "FMCG", Micro_Activity: "Production; Packaging; Branding", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "FSSAI; Legal Metrology; BIS", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-03.02.01", Cluster_ID: 3, Cluster: "Manufacturing", Sector_Group: "Consumer Durables & Electronics", Sub_Sector: "Appliances", Micro_Activity: "Manufacturing; Servicing", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "BIS; Consumer Protection Act 2019", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-03.03.01", Cluster_ID: 3, Cluster: "Manufacturing", Sector_Group: "Industrial Manufacturing", Sub_Sector: "Automotive", Micro_Activity: "OEM; Supply Chain", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "MoRTH; CMVR; ARAI", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-03.03.02", Cluster_ID: 3, Cluster: "Manufacturing", Sector_Group: "Industrial Manufacturing", Sub_Sector: "Heavy Engineering", Micro_Activity: "Machinery; Infra Equipment", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "Ministry of Heavy Industries; BIS", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-03.04.01", Cluster_ID: 3, Cluster: "Manufacturing", Sector_Group: "Chemicals & Petrochemicals", Sub_Sector: "Petrochemicals", Micro_Activity: "Refining; Derivatives", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "Ministry of Chemicals & Fertilizers; PNGRB", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-03.05.01", Cluster_ID: 3, Cluster: "Manufacturing", Sector_Group: "Pharma & Life Sciences", Sub_Sector: "Drug Manufacturing", Micro_Activity: "API; Formulations", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "CDSCO; Drugs and Cosmetics Act; NPPA", GDPR_Applicability: "Heightened", CCPA_Applicability: "Applies", HIPAA_Applicability: "Adjacent" },
  { PrivCybHub_Sector_ID: "PCH-03.06.01", Cluster_ID: 3, Cluster: "Manufacturing", Sector_Group: "Textiles & Apparel", Sub_Sector: "Apparel", Micro_Activity: "Fabric; Garments", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "Ministry of Textiles; BIS", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-03.07.01", Cluster_ID: 3, Cluster: "Manufacturing", Sector_Group: "Electronics Manufacturing", Sub_Sector: "EMS", Micro_Activity: "Assembly; Device Manufacturing", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "MeitY; BIS; SPECS/PLI", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  // Cluster 4 — Energy & Utilities
  { PrivCybHub_Sector_ID: "PCH-04.01.01", Cluster_ID: 4, Cluster: "Energy & Utilities", Sector_Group: "Power", Sub_Sector: "Generation", Micro_Activity: "Thermal; Hydro; Renewable", DPDP_Exposure: "Low", Analysis_Granularity: "Sector_Group", Sectoral_Regulator: "CEA; CERC; MNRE", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-04.01.02", Cluster_ID: 4, Cluster: "Energy & Utilities", Sector_Group: "Power", Sub_Sector: "Transmission", Micro_Activity: "Grid Infrastructure", DPDP_Exposure: "Low", Analysis_Granularity: "Sector_Group", Sectoral_Regulator: "CEA; CERC; POSOCO", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-04.01.03", Cluster_ID: 4, Cluster: "Energy & Utilities", Sector_Group: "Power", Sub_Sector: "Distribution", Micro_Activity: "Billing; Metering", DPDP_Exposure: "Low", Analysis_Granularity: "Sector_Group", Sectoral_Regulator: "State Electricity Regulatory Commissions", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-04.02.01", Cluster_ID: 4, Cluster: "Energy & Utilities", Sector_Group: "Utilities", Sub_Sector: "Water Supply", Micro_Activity: "Treatment; Pipelines", DPDP_Exposure: "Low", Analysis_Granularity: "Sector_Group", Sectoral_Regulator: "Ministry of Jal Shakti; State Water Boards", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-04.02.02", Cluster_ID: 4, Cluster: "Energy & Utilities", Sector_Group: "Utilities", Sub_Sector: "Waste Management", Micro_Activity: "Collection; Recycling", DPDP_Exposure: "Low", Analysis_Granularity: "Sector_Group", Sectoral_Regulator: "CPCB; SPCBs; SWM Rules 2016", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  // Cluster 5 — Construction & Real Estate
  { PrivCybHub_Sector_ID: "PCH-05.01.01", Cluster_ID: 5, Cluster: "Construction & Real Estate", Sector_Group: "Real Estate", Sub_Sector: "Residential", Micro_Activity: "Sales; Leasing", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "RERA", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-05.01.02", Cluster_ID: 5, Cluster: "Construction & Real Estate", Sector_Group: "Real Estate", Sub_Sector: "Commercial", Micro_Activity: "Office; Retail Spaces", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "RERA", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-05.02.01", Cluster_ID: 5, Cluster: "Construction & Real Estate", Sector_Group: "Infrastructure", Sub_Sector: "Construction", Micro_Activity: "Roads; Bridges", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "MoRTH; NHAI; CPWD", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-05.03.01", Cluster_ID: 5, Cluster: "Construction & Real Estate", Sector_Group: "Real Estate Services", Sub_Sector: "Brokerage", Micro_Activity: "Agents; Listings", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "RERA", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-05.03.02", Cluster_ID: 5, Cluster: "Construction & Real Estate", Sector_Group: "Real Estate Services", Sub_Sector: "PropTech", Micro_Activity: "Digital Platforms", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "MeitY; IT Rules 2021; RERA", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-05.03.03", Cluster_ID: 5, Cluster: "Construction & Real Estate", Sector_Group: "Real Estate Services", Sub_Sector: "Facility Management", Micro_Activity: "Security; Maintenance", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "PSARA; State Labour Laws", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  // Cluster 6 — BFSI
  { PrivCybHub_Sector_ID: "PCH-06.01.01", Cluster_ID: 6, Cluster: "BFSI", Sector_Group: "Banking", Sub_Sector: "Retail Banking", Micro_Activity: "Accounts; Loans", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "RBI; Banking Regulation Act; SARFAESI", GDPR_Applicability: "Heightened", CCPA_Applicability: "Applies", HIPAA_Applicability: "Adjacent" },
  { PrivCybHub_Sector_ID: "PCH-06.01.02", Cluster_ID: 6, Cluster: "BFSI", Sector_Group: "Banking", Sub_Sector: "Corporate Banking", Micro_Activity: "Treasury; Trade Finance", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "RBI; FEMA", GDPR_Applicability: "Heightened", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-06.02.01", Cluster_ID: 6, Cluster: "BFSI", Sector_Group: "Fintech", Sub_Sector: "Payments", Micro_Activity: "UPI; Wallets", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "RBI; PSS Act; NPCI", GDPR_Applicability: "Heightened", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-06.02.02", Cluster_ID: 6, Cluster: "BFSI", Sector_Group: "Fintech", Sub_Sector: "Digital Lending", Micro_Activity: "Credit Scoring", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "RBI Digital Lending Guidelines 2022", GDPR_Applicability: "Heightened", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-06.03.01", Cluster_ID: 6, Cluster: "BFSI", Sector_Group: "Insurance", Sub_Sector: "Life & Health", Micro_Activity: "Underwriting; Claims", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "IRDAI; IRDAI CS Guidelines 2026", GDPR_Applicability: "Heightened", CCPA_Applicability: "Applies", HIPAA_Applicability: "Adjacent" },
  { PrivCybHub_Sector_ID: "PCH-06.04.01", Cluster_ID: 6, Cluster: "BFSI", Sector_Group: "Capital Markets", Sub_Sector: "Broking", Micro_Activity: "Trading Platforms", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "SEBI; SEBI CSCRF", GDPR_Applicability: "Sector-Triggered", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-06.04.02", Cluster_ID: 6, Cluster: "BFSI", Sector_Group: "Capital Markets", Sub_Sector: "Asset Management", Micro_Activity: "Mutual Funds", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "SEBI; AMFI", GDPR_Applicability: "Sector-Triggered", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  // Cluster 7 — Trade & Commerce
  { PrivCybHub_Sector_ID: "PCH-07.01.01", Cluster_ID: 7, Cluster: "Trade & Commerce", Sector_Group: "Retail", Sub_Sector: "Offline Retail", Micro_Activity: "Stores; POS", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "Consumer Protection Act; Legal Metrology", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-07.01.02", Cluster_ID: 7, Cluster: "Trade & Commerce", Sector_Group: "Retail", Sub_Sector: "D2C Brands", Micro_Activity: "Direct Sales", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "CP E-Commerce Rules 2020", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-07.02.01", Cluster_ID: 7, Cluster: "Trade & Commerce", Sector_Group: "E-commerce", Sub_Sector: "Marketplaces", Micro_Activity: "Listings; Fulfillment", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "CP E-Commerce Rules 2020; FDI Press Note 2", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-07.02.02", Cluster_ID: 7, Cluster: "Trade & Commerce", Sector_Group: "E-commerce", Sub_Sector: "Quick Commerce", Micro_Activity: "Hyperlocal Delivery", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "CP E-Commerce Rules 2020; FSSAI", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-07.03.01", Cluster_ID: 7, Cluster: "Trade & Commerce", Sector_Group: "Wholesale", Sub_Sector: "Distribution", Micro_Activity: "Supply Chain Networks", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "Companies Act; GST", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  // Cluster 8 — Transport & Logistics
  { PrivCybHub_Sector_ID: "PCH-08.01.01", Cluster_ID: 8, Cluster: "Transport & Logistics", Sector_Group: "Logistics", Sub_Sector: "Warehousing", Micro_Activity: "Storage; Inventory", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "WDRA", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-08.01.02", Cluster_ID: 8, Cluster: "Transport & Logistics", Sector_Group: "Logistics", Sub_Sector: "Courier", Micro_Activity: "Last Mile Delivery", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "Indian Post Office Act; Carriage by Road Act", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-08.02.01", Cluster_ID: 8, Cluster: "Transport & Logistics", Sector_Group: "Mobility", Sub_Sector: "Ride Hailing", Micro_Activity: "Driver Partner Operations", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "MV Aggregator Guidelines 2020", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-08.03.01", Cluster_ID: 8, Cluster: "Transport & Logistics", Sector_Group: "Public Transport", Sub_Sector: "Rail & Metro", Micro_Activity: "Ticketing; Operations", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "Ministry of Railways; Metro Railways Act", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-08.04.01", Cluster_ID: 8, Cluster: "Transport & Logistics", Sector_Group: "Aviation", Sub_Sector: "Airlines", Micro_Activity: "Passenger Operations", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "DGCA; BCAS; Aircraft Act", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-08.05.01", Cluster_ID: 8, Cluster: "Transport & Logistics", Sector_Group: "Maritime", Sub_Sector: "Ports & Shipping", Micro_Activity: "Cargo Handling", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "DG Shipping; Major Port Authorities Act", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  // Cluster 9 — Hospitality & Travel
  { PrivCybHub_Sector_ID: "PCH-09.01.01", Cluster_ID: 9, Cluster: "Hospitality & Travel", Sector_Group: "Hospitality", Sub_Sector: "Hotels", Micro_Activity: "Booking; Guest Services", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "Ministry of Tourism; Form C", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-09.02.01", Cluster_ID: 9, Cluster: "Hospitality & Travel", Sector_Group: "Travel", Sub_Sector: "OTAs", Micro_Activity: "Aggregation; Booking", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "Ministry of Tourism; IT Rules 2021", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-09.03.01", Cluster_ID: 9, Cluster: "Hospitality & Travel", Sector_Group: "Tourism", Sub_Sector: "Services", Micro_Activity: "Tours; Guides", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "Ministry of Tourism", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  // Cluster 10 — Technology & Digital
  { PrivCybHub_Sector_ID: "PCH-10.01.01", Cluster_ID: 10, Cluster: "Technology & Digital", Sector_Group: "IT", Sub_Sector: "SaaS", Micro_Activity: "CRM; ERP Systems", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "MeitY; IT Act 2000", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Adjacent" },
  { PrivCybHub_Sector_ID: "PCH-10.02.01", Cluster_ID: 10, Cluster: "Technology & Digital", Sector_Group: "Platforms", Sub_Sector: "Social Media", Micro_Activity: "Content Sharing", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "MeitY; IT Rules 2021 (SSMI)", GDPR_Applicability: "Heightened", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-10.02.02", Cluster_ID: 10, Cluster: "Technology & Digital", Sector_Group: "Platforms", Sub_Sector: "OTT", Micro_Activity: "Streaming", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "MIB; IT Rules 2021 Part III", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-10.02.03", Cluster_ID: 10, Cluster: "Technology & Digital", Sector_Group: "Platforms", Sub_Sector: "Gaming", Micro_Activity: "RMG; Casual Gaming", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "MeitY Online Gaming Rules 2023", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-10.03.01", Cluster_ID: 10, Cluster: "Technology & Digital", Sector_Group: "Telecom", Sub_Sector: "ISPs", Micro_Activity: "Connectivity Services", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "DoT; TRAI; Telecommunications Act 2023", GDPR_Applicability: "Heightened", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-10.04.01", Cluster_ID: 10, Cluster: "Technology & Digital", Sector_Group: "Infrastructure", Sub_Sector: "Cloud", Micro_Activity: "Hosting; Storage", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "MeitY Cloud Empanelment; CERT-In", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Adjacent" },
  { PrivCybHub_Sector_ID: "PCH-10.04.02", Cluster_ID: 10, Cluster: "Technology & Digital", Sector_Group: "Infrastructure", Sub_Sector: "Data Centers", Micro_Activity: "Physical Infrastructure", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "MeitY DC Policy; CERT-In", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-10.05.01", Cluster_ID: 10, Cluster: "Technology & Digital", Sector_Group: "Security", Sub_Sector: "Cybersecurity", Micro_Activity: "SOC; Threat Detection", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "CERT-In Directions 2022; NCIIPC", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-10.06.01", Cluster_ID: 10, Cluster: "Technology & Digital", Sector_Group: "Emerging Tech", Sub_Sector: "AI/ML", Micro_Activity: "Model Training; Deployment", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "MeitY AI Advisories; ISO/IEC 42001", GDPR_Applicability: "Heightened", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-10.06.02", Cluster_ID: 10, Cluster: "Technology & Digital", Sector_Group: "Emerging Tech", Sub_Sector: "Web3", Micro_Activity: "Blockchain Platforms", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "MeitY; FIU-IND PMLA Notification 2023", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  // Cluster 11 — Media & Advertising
  { PrivCybHub_Sector_ID: "PCH-11.01.01", Cluster_ID: 11, Cluster: "Media & Advertising", Sector_Group: "Media", Sub_Sector: "News", Micro_Activity: "Publishing", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "PRB Act; IT Rules 2021 Part III", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-11.01.02", Cluster_ID: 11, Cluster: "Media & Advertising", Sector_Group: "Media", Sub_Sector: "Film & TV", Micro_Activity: "Production", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "MIB; CBFC; Cinematograph Act", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-11.02.01", Cluster_ID: 11, Cluster: "Media & Advertising", Sector_Group: "Digital Media", Sub_Sector: "Creator Economy", Micro_Activity: "Influencers", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "ASCI Influencer Guidelines; CCPA Endorsement", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-11.03.01", Cluster_ID: 11, Cluster: "Media & Advertising", Sector_Group: "Advertising", Sub_Sector: "AdTech", Micro_Activity: "Programmatic Ads", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "MeitY; ASCI; IT Rules 2021", GDPR_Applicability: "Heightened", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-11.03.02", Cluster_ID: 11, Cluster: "Media & Advertising", Sector_Group: "Advertising", Sub_Sector: "Agencies", Micro_Activity: "Campaign Management", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "ASCI; Consumer Protection Act", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  // Cluster 12 — Healthcare
  { PrivCybHub_Sector_ID: "PCH-12.01.01", Cluster_ID: 12, Cluster: "Healthcare", Sector_Group: "Healthcare Delivery", Sub_Sector: "Hospitals", Micro_Activity: "Treatment", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "NMC; Clinical Establishments Act; MoHFW", GDPR_Applicability: "Heightened", CCPA_Applicability: "Applies", HIPAA_Applicability: "Adjacent" },
  { PrivCybHub_Sector_ID: "PCH-12.01.02", Cluster_ID: 12, Cluster: "Healthcare", Sector_Group: "Healthcare Delivery", Sub_Sector: "Clinics", Micro_Activity: "OPD Services", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "NMC; Clinical Establishments Act", GDPR_Applicability: "Heightened", CCPA_Applicability: "Applies", HIPAA_Applicability: "Adjacent" },
  { PrivCybHub_Sector_ID: "PCH-12.02.01", Cluster_ID: 12, Cluster: "Healthcare", Sector_Group: "Diagnostics", Sub_Sector: "Labs", Micro_Activity: "Testing", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "NABL; ICMR", GDPR_Applicability: "Heightened", CCPA_Applicability: "Applies", HIPAA_Applicability: "Adjacent" },
  { PrivCybHub_Sector_ID: "PCH-12.03.01", Cluster_ID: 12, Cluster: "Healthcare", Sector_Group: "HealthTech", Sub_Sector: "Platforms", Micro_Activity: "Telemedicine", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "NMC Telemedicine Practice Guidelines 2020; ABDM", GDPR_Applicability: "Heightened", CCPA_Applicability: "Applies", HIPAA_Applicability: "Adjacent" },
  { PrivCybHub_Sector_ID: "PCH-12.04.01", Cluster_ID: 12, Cluster: "Healthcare", Sector_Group: "Wellness", Sub_Sector: "Fitness", Micro_Activity: "Gyms; Apps", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "Consumer Protection Act; Shops & Establishments", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Adjacent" },
  // Cluster 13 — Education
  { PrivCybHub_Sector_ID: "PCH-13.01.01", Cluster_ID: 13, Cluster: "Education", Sector_Group: "Formal Education", Sub_Sector: "Schools", Micro_Activity: "K-12", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "MoE; CBSE/ICSE/State Boards; RTE Act", GDPR_Applicability: "Heightened", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-13.01.02", Cluster_ID: 13, Cluster: "Education", Sector_Group: "Formal Education", Sub_Sector: "Universities", Micro_Activity: "Higher Education", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "UGC; AICTE; MoE", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-13.02.01", Cluster_ID: 13, Cluster: "Education", Sector_Group: "EdTech", Sub_Sector: "Platforms", Micro_Activity: "Online Learning", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "MoE; MeitY; IT Rules 2021", GDPR_Applicability: "Heightened", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-13.03.01", Cluster_ID: 13, Cluster: "Education", Sector_Group: "Skill Development", Sub_Sector: "Training", Micro_Activity: "Vocational Programs", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "MSDE; NSDC; NCVET", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  // Cluster 14 — Professional Services
  { PrivCybHub_Sector_ID: "PCH-14.01.01", Cluster_ID: 14, Cluster: "Professional Services", Sector_Group: "Legal", Sub_Sector: "Law Firms", Micro_Activity: "Advisory", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "Bar Council of India; Advocates Act", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-14.02.01", Cluster_ID: 14, Cluster: "Professional Services", Sector_Group: "Consulting", Sub_Sector: "Strategy", Micro_Activity: "Risk; Management", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "ICAI / ICSI / IIMs", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-14.03.01", Cluster_ID: 14, Cluster: "Professional Services", Sector_Group: "HR Services", Sub_Sector: "Staffing", Micro_Activity: "Recruitment", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "Contract Labour Act; State Labour Laws", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-14.04.01", Cluster_ID: 14, Cluster: "Professional Services", Sector_Group: "BPO", Sub_Sector: "Outsourcing", Micro_Activity: "Back Office Operations", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "MeitY; STPI; SEZ Act", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Adjacent" },
  { PrivCybHub_Sector_ID: "PCH-14.05.01", Cluster_ID: 14, Cluster: "Professional Services", Sector_Group: "Marketing", Sub_Sector: "Agencies", Micro_Activity: "Branding", DPDP_Exposure: "Medium", Analysis_Granularity: "Sub_Sector", Sectoral_Regulator: "ASCI; Consumer Protection Act", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  // Cluster 15 — Government & Public Sector
  { PrivCybHub_Sector_ID: "PCH-15.01.01", Cluster_ID: 15, Cluster: "Government & Public Sector", Sector_Group: "Governance", Sub_Sector: "Digital Government", Micro_Activity: "Portals; Identity Systems", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "MeitY; UIDAI; Aadhaar Act 2016", GDPR_Applicability: "Heightened", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-15.02.01", Cluster_ID: 15, Cluster: "Government & Public Sector", Sector_Group: "Enforcement", Sub_Sector: "Law Enforcement", Micro_Activity: "Policing", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "MHA; State Police; CrPC / BNSS", GDPR_Applicability: "Heightened", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-15.03.01", Cluster_ID: 15, Cluster: "Government & Public Sector", Sector_Group: "Welfare", Sub_Sector: "Schemes", Micro_Activity: "Subsidy Distribution", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "Ministry of Rural Development; DBT Mission", GDPR_Applicability: "Heightened", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-15.04.01", Cluster_ID: 15, Cluster: "Government & Public Sector", Sector_Group: "Civic", Sub_Sector: "Municipal Services", Micro_Activity: "Local Governance", DPDP_Exposure: "High", Analysis_Granularity: "Micro_Activity", Sectoral_Regulator: "Ministry of Housing & Urban Affairs; ULBs", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  // Cluster 16 — MSME & Informal Economy
  { PrivCybHub_Sector_ID: "PCH-16.01.01", Cluster_ID: 16, Cluster: "MSME & Informal Economy", Sector_Group: "Micro Business", Sub_Sector: "Retail", Micro_Activity: "Kirana Stores", DPDP_Exposure: "Medium", Analysis_Granularity: "Sector_Group", Sectoral_Regulator: "MSME Ministry; Udyam Registration", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-16.02.01", Cluster_ID: 16, Cluster: "MSME & Informal Economy", Sector_Group: "Informal Services", Sub_Sector: "Local Services", Micro_Activity: "Tutors; Agents", DPDP_Exposure: "Medium", Analysis_Granularity: "Sector_Group", Sectoral_Regulator: "State Shops & Establishments; MSME Act", GDPR_Applicability: "Universal", CCPA_Applicability: "Applies", HIPAA_Applicability: "Out of Scope" },
  { PrivCybHub_Sector_ID: "PCH-16.03.01", Cluster_ID: 16, Cluster: "MSME & Informal Economy", Sector_Group: "Small Manufacturing", Sub_Sector: "Workshops", Micro_Activity: "Local Production", DPDP_Exposure: "Medium", Analysis_Granularity: "Sector_Group", Sectoral_Regulator: "MSME Act; Factories Act", GDPR_Applicability: "Universal", CCPA_Applicability: "Out of Scope", HIPAA_Applicability: "Out of Scope" },
];

/** 16-hue cluster palette (HSL strings, harmonious legal-tech) */
export const CLUSTER_COLORS: Record<number, string> = {
  1: "hsl(95 40% 55%)",   // agri green
  2: "hsl(30 35% 50%)",   // earth brown
  3: "hsl(220 50% 55%)",  // industrial blue
  4: "hsl(45 75% 55%)",   // energy gold
  5: "hsl(15 50% 55%)",   // construction terracotta
  6: "hsl(195 70% 50%)",  // BFSI cyan
  7: "hsl(280 45% 60%)",  // commerce purple
  8: "hsl(170 50% 45%)",  // logistics teal
  9: "hsl(340 55% 60%)",  // hospitality rose
  10: "hsl(210 65% 55%)", // tech sapphire
  11: "hsl(320 50% 55%)", // media magenta
  12: "hsl(0 60% 55%)",   // healthcare red
  13: "hsl(50 65% 55%)",  // education amber
  14: "hsl(240 35% 55%)", // pro services indigo
  15: "hsl(130 35% 50%)", // government olive
  16: "hsl(25 45% 55%)",  // MSME tan
};

export function getIndustryById(id: string): ExecuteIndustry | undefined {
  return PRIVCYBHUB_INDUSTRIES.find((r) => r.PrivCybHub_Sector_ID === id);
}

/**
 * Build the 4-ring tree: Cluster → Sector_Group → Sub_Sector → Micro_Activity.
 * Leaves carry value=1 (equal-weight petals) and the source industry record.
 */
export function buildIndustryTree(): SunburstNode {
  const root: SunburstNode = { name: "Indian Economy", depth: 0, children: [] };
  const clusterMap = new Map<string, SunburstNode>();
  const groupMap = new Map<string, SunburstNode>();
  const subMap = new Map<string, SunburstNode>();

  for (const r of PRIVCYBHUB_INDUSTRIES) {
    const cKey = `${r.Cluster_ID}`;
    let cluster = clusterMap.get(cKey);
    if (!cluster) {
      cluster = { name: r.Cluster, depth: 1, cluster_id: r.Cluster_ID, children: [], leafIds: [] };
      clusterMap.set(cKey, cluster);
      root.children!.push(cluster);
    }

    const gKey = `${cKey}|${r.Sector_Group}`;
    let group = groupMap.get(gKey);
    if (!group) {
      group = { name: r.Sector_Group, depth: 2, cluster_id: r.Cluster_ID, children: [], leafIds: [] };
      groupMap.set(gKey, group);
      cluster.children!.push(group);
    }

    const sKey = `${gKey}|${r.Sub_Sector}`;
    let sub = subMap.get(sKey);
    if (!sub) {
      sub = { name: r.Sub_Sector, depth: 3, cluster_id: r.Cluster_ID, children: [], leafIds: [] };
      subMap.set(sKey, sub);
      group.children!.push(sub);
    }

    const leaf: SunburstNode = {
      name: r.Micro_Activity,
      depth: 4,
      cluster_id: r.Cluster_ID,
      industry: r,
      leafIds: [r.PrivCybHub_Sector_ID],
    };
    sub.children!.push(leaf);
    // bubble up leaf id for selection-by-ancestor
    sub.leafIds!.push(r.PrivCybHub_Sector_ID);
    group.leafIds!.push(r.PrivCybHub_Sector_ID);
    cluster.leafIds!.push(r.PrivCybHub_Sector_ID);
  }

  return root;
}

const GRANULARITY_DEPTH: Record<string, number> = {
  Cluster: 1,
  Sector_Group: 2,
  Sub_Sector: 3,
  Micro_Activity: 4,
};

/**
 * For a clicked node: are all leaves under it at-or-deeper-than the most demanding
 * granularity required by their industry? If yes → direct-select. Otherwise → disambiguate.
 */
export function nodeRequiresDisambiguation(node: SunburstNode): boolean {
  if (!node.leafIds || node.leafIds.length === 0) return false;
  const leaves = node.leafIds
    .map((id) => getIndustryById(id))
    .filter((x): x is ExecuteIndustry => !!x);
  return leaves.some(
    (ind) => GRANULARITY_DEPTH[ind.Analysis_Granularity] > node.depth,
  );
}

export function computeTriggeredFlags(
  selectedIds: string[],
  footprint: string[],
): TriggeredFlags {
  const selected = selectedIds
    .map(getIndustryById)
    .filter((x): x is ExecuteIndustry => !!x);
  const clusters = new Set(selected.map((s) => s.Cluster_ID));
  const regulators = Array.from(new Set(selected.map((s) => s.Sectoral_Regulator)));

  return {
    sdf_likelihood: selected.some((s) => s.DPDP_Exposure === "High") ? "High" : "Standard",
    children_data: clusters.has(13) ? "Core" : "Incidental",
    health_data: clusters.has(12) ? "Core" : "None",
    financial_data: clusters.has(6) ? "RBI-regulated" : "None",
    cross_border:
      footprint.length > 0 && footprint.some((f) => f !== "India only") ? "Active" : "Domestic",
    sectoral_overlay: regulators,
  };
}

export function computeCrosswalk(
  selectedIds: string[],
  footprint: string[],
): CrosswalkSummary {
  const selected = selectedIds
    .map(getIndustryById)
    .filter((x): x is ExecuteIndustry => !!x);
  const clusters = new Set(selected.map((s) => s.Cluster_ID));
  const regulators = Array.from(new Set(selected.map((s) => s.Sectoral_Regulator)));

  const anyHeightened = selected.some(
    (s) => s.GDPR_Applicability === "Heightened" || s.GDPR_Applicability === "Universal",
  );
  const ccpaTriggered =
    footprint.includes("US-California") &&
    selected.some((s) => s.CCPA_Applicability === "Applies");
  const hipaaInScope = clusters.has(12);

  return {
    gdpr: {
      status: anyHeightened ? "Universal" : "Limited",
      rationale: anyHeightened
        ? "Selected sectors handle EU-relevant personal data."
        : "No EU-triggering sectors among selections.",
    },
    ccpa: {
      status: ccpaTriggered ? "Triggered" : "Watch",
      rationale: ccpaTriggered
        ? "California footprint + CCPA-applicable sectors selected."
        : footprint.includes("US-California")
          ? "California footprint, but no CCPA-applicable sectors."
          : "No California footprint declared.",
    },
    hipaa: {
      status: hipaaInScope ? "In-scope (Adjacent)" : "Out of Scope",
      rationale: hipaaInScope
        ? "Healthcare cluster handles PHI-equivalent data."
        : "No healthcare data handling indicated.",
    },
    regulators,
  };
}

export const FOOTPRINT_OPTIONS = [
  "India only",
  "EU",
  "US-California",
  "US-other",
  "UK",
  "UAE",
  "Singapore",
  "Other",
] as const;

export const EMPLOYEE_BANDS = ["<50", "50-250", "250-1000", "1000-5000", ">5000"] as const;
export const PRINCIPALS_BANDS = ["<10K", "10K-100K", "100K-1M", "1M-10M", ">10M"] as const;
export const GROUP_STRUCTURES = ["Standalone", "Subsidiary", "Holding company", "Group"] as const;
export const PRIMARY_ROLES = ["Data Fiduciary", "Data Processor", "Both"] as const;