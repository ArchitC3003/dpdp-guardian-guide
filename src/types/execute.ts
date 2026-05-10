export type ExposureLevel = "Low" | "Medium" | "High";
export type Granularity = "Cluster" | "Sector_Group" | "Sub_Sector" | "Micro_Activity";
export type GdprApplicability = "Universal" | "Heightened" | "Sector-Triggered";
export type CcpaApplicability = "Applies" | "Out of Scope";
export type HipaaApplicability = "Covered" | "Adjacent" | "Out of Scope";

export interface ExecuteIndustry {
  PrivCybHub_Sector_ID: string;
  Cluster_ID: number;
  Cluster: string;
  Sector_Group: string;
  Sub_Sector: string;
  Micro_Activity: string;
  DPDP_Exposure: ExposureLevel;
  Analysis_Granularity: Granularity;
  Sectoral_Regulator: string;
  GDPR_Applicability: GdprApplicability;
  CCPA_Applicability: CcpaApplicability;
  HIPAA_Applicability: HipaaApplicability;
}

export interface OrgProfileForm {
  org_name: string;
  trade_name: string;
  group_structure: "Standalone" | "Subsidiary" | "Holding company" | "Group" | "";
  footprint: string[];
  employee_band: "<50" | "50-250" | "250-1000" | "1000-5000" | ">5000" | "";
  principals_band: "<10K" | "10K-100K" | "100K-1M" | "1M-10M" | ">10M" | "";
  primary_role: "Data Fiduciary" | "Data Processor" | "Both" | "";
}

export interface TriggeredFlags {
  sdf_likelihood: "High" | "Standard";
  children_data: "Core" | "Incidental";
  health_data: "Core" | "None";
  financial_data: "RBI-regulated" | "None";
  cross_border: "Active" | "Domestic";
  sectoral_overlay: string[];
}

export interface CrosswalkSummary {
  gdpr: { status: string; rationale: string };
  ccpa: { status: string; rationale: string };
  hipaa: { status: string; rationale: string };
  regulators: string[];
}

export interface ExecuteWorkspace {
  id: string;
  user_id: string;
  org_name: string;
  trade_name: string | null;
  group_structure: string | null;
  footprint: string[];
  employee_band: string;
  principals_band: string;
  primary_role: string;
  selected_sector_ids: string[];
  triggered_flags: TriggeredFlags;
  crosswalk_summary: CrosswalkSummary;
  created_at: string;
  updated_at: string;
}

export interface SunburstNode {
  name: string;
  depth: number;
  children?: SunburstNode[];
  cluster_id?: number;
  industry?: ExecuteIndustry;
  leafIds?: string[];
}