import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  DOMAINS,
  POLICY_ITEMS,
  DEPARTMENTS,
  DEPT_CONTROLS,
  SPECIAL_STATUS_OPTIONS,
} from "@/data/assessmentDomains";
import type { Tables } from "@/integrations/supabase/types";

type Assessment = Tables<"assessments">;

interface SpecialStatus {
  [key: string]: boolean | undefined;
}

const ROLE_LABEL: Record<string, string> = {
  data_fiduciary: "Data Fiduciary",
  joint_data_fiduciary: "Joint Data Fiduciary",
  data_processor: "Data Processor",
  dual_role: "Dual Role (Fiduciary + Processor)",
};

function slugify(s: string | null | undefined): string {
  if (!s) return "Untitled";
  return s.trim().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "Untitled";
}

function istStamp(): string {
  // YYYYMMDD in IST for filename
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date()).replace(/-/g, "");
}

function istReadable(): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date()) + " IST";
}

function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  (ws as any)["!cols"] = widths.map((w) => ({ wch: w }));
}

function freezeTopRow(ws: XLSX.WorkSheet, xSplit = 0) {
  (ws as any)["!freeze"] = { xSplit, ySplit: 1 };
  (ws as any)["!views"] = [{ state: "frozen", xSplit, ySplit: 1 }];
}

export function exportQuestionnaireToExcel(assessment: Assessment | null): void {
  if (!assessment) throw new Error("Assessment not loaded");

  const special = (assessment.special_status as unknown as SpecialStatus) || {};
  const enabledFlagLabels = SPECIAL_STATUS_OPTIONS
    .filter((o) => special[o.key])
    .map((o) => o.label);

  const wb = XLSX.utils.book_new();

  // ============ SHEET 1: COVER ============
  const role = (assessment as any).dpdp_role as string | null | undefined;
  const coverRows: (string | number)[][] = [
    ["PrivcybHub — DPDP Assessment Questionnaire"],
    ["Offline working copy. Re-import is not supported in this release."],
    [],
    ["Field", "Value"],
    ["Organisation", assessment.org_name || "—"],
    ["Industry / Sector", (assessment as any).org_industry || "—"],
    ["Entity Type", (assessment as any).org_entity_type || "—"],
    ["Total Employees", (assessment as any).org_employees || "—"],
    ["Data Subjects Volume", (assessment as any).org_data_subjects || "—"],
    ["Processing Locations", (assessment as any).org_locations || "—"],
    ["Sectoral Regulators", (assessment as any).org_regulators || "—"],
    ["DPDP Role", role ? ROLE_LABEL[role] || role : "Not yet identified"],
    ["Joint Fiduciary", (assessment as any).is_joint_fiduciary ? "Yes" : "No"],
    ["Dual Role", (assessment as any).is_dual_role ? "Yes" : "No"],
    ["Special Statuses", enabledFlagLabels.length ? enabledFlagLabels.join("; ") : "None selected"],
    [],
    ["Framework", "DPDP Act 2023 + DPDP Rules 2025"],
    ["Source", "PrivcybHub Rapid Assessment v3.0"],
    ["Generated On", istReadable()],
    [],
    ["Workbook Contents", ""],
    ["Sheet 2", "Assessment Questionnaire — domain-wise control questions"],
    ["Sheet 3", "Policy & SOP Stack — 37 required artefacts"],
    ["Sheet 4", "Department Practice Grid — 9 departments × 14 controls"],
    ["Sheet 5", "Legend & Instructions"],
  ];
  const cover = XLSX.utils.aoa_to_sheet(coverRows);
  setColWidths(cover, [28, 70]);
  XLSX.utils.book_append_sheet(wb, cover, "Cover");

  // ============ SHEET 2: ASSESSMENT QUESTIONNAIRE ============
  const qHeader = [
    "Item ID",
    "Domain Code",
    "Domain Name",
    "Section Reference",
    "Penalty",
    "Risk Level",
    "Evidence Type",
    "Requirement / Question",
    "Applicability",
    "Status",
    "Evidence Status",
    "Priority",
    "Owner",
    "Target Date",
    "Notes",
  ];
  const qRows: (string | number)[][] = [qHeader];
  let domainItemCount = 0;

  for (const domain of DOMAINS) {
    // Domain-level conditional gating (matches PhaseRapidAssessment)
    if (domain.conditional === "children" && !special.children) continue;
    if (domain.conditional === "consentMgr" && !special.consentMgr) continue;

    for (const item of domain.items) {
      const isSdfOnly = !!domain.sdfOnly?.includes(item.id);
      let applicability = "Applicable";
      if (isSdfOnly) {
        applicability = special.sdf ? "SDF only — Applicable" : "SDF only — Not Applicable";
      }
      qRows.push([
        item.id,
        domain.code,
        domain.name,
        domain.section,
        domain.penalty,
        item.risk.charAt(0).toUpperCase() + item.risk.slice(1),
        item.evidence,
        item.description,
        applicability,
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
      domainItemCount++;
    }
  }
  const qSheet = XLSX.utils.aoa_to_sheet(qRows);
  setColWidths(qSheet, [10, 12, 24, 22, 10, 12, 18, 80, 28, 12, 18, 14, 18, 14, 30]);
  freezeTopRow(qSheet);
  XLSX.utils.book_append_sheet(wb, qSheet, "Assessment Questionnaire");

  // ============ SHEET 3: POLICY & SOP STACK ============
  const pHeader = [
    "Item ID",
    "Category Code",
    "Category Label",
    "Artefact Name",
    "Status",
    "Owner",
    "Last Reviewed",
    "Next Review",
    "Document Link",
    "Notes",
  ];
  const pRows: (string | number)[][] = [pHeader];
  let policyCount = 0;
  for (const [code, cat] of Object.entries(POLICY_ITEMS)) {
    for (const it of cat.items) {
      pRows.push([it.id, code, cat.label, it.name, "", "", "", "", "", ""]);
      policyCount++;
    }
  }
  const pSheet = XLSX.utils.aoa_to_sheet(pRows);
  setColWidths(pSheet, [10, 14, 24, 44, 12, 18, 14, 14, 32, 30]);
  freezeTopRow(pSheet);
  XLSX.utils.book_append_sheet(wb, pSheet, "Policy & SOP Stack");

  // ============ SHEET 4: DEPARTMENT PRACTICE GRID ============
  const dHeader = [
    "Department",
    "Control #",
    "Control Description",
    "Risk Level",
    "Status",
    "Evidence Notes",
    "Owner",
    "Target Date",
  ];
  const dRows: (string | number)[][] = [dHeader];
  let deptCellCount = 0;
  for (const dept of DEPARTMENTS) {
    for (const ctrl of DEPT_CONTROLS) {
      dRows.push([
        dept,
        ctrl.id,
        ctrl.label,
        ctrl.risk.charAt(0).toUpperCase() + ctrl.risk.slice(1),
        "",
        "",
        "",
        "",
      ]);
      deptCellCount++;
    }
  }
  const dSheet = XLSX.utils.aoa_to_sheet(dRows);
  setColWidths(dSheet, [22, 10, 60, 12, 12, 36, 18, 14]);
  freezeTopRow(dSheet, 2);
  XLSX.utils.book_append_sheet(wb, dSheet, "Department Practice Grid");

  // ============ SHEET 5: LEGEND & INSTRUCTIONS ============
  const legendRows: string[][] = [
    ["Field", "Allowed Values / Notes"],
    ["Status", "Yes (100%) | Partial (50%) | No (0%) | N/A (excluded from scoring)"],
    ["Evidence Status", "Verified–Seen | Stated–Not Verified | Not Available"],
    ["Priority", "P1–Immediate | P2–Short-term | P3–Planned"],
    ["Risk Level", "Critical (×3) | High (×2) | Standard (×1)"],
    [],
    ["Scoring", "Domain score = Σ(status% × risk multiplier) / Σ(risk multiplier) × 100"],
    ["", "Items marked N/A or with no status are excluded from the denominator."],
    [],
    ["Penalty Exposure (DPDP Act 2023, Schedule)", ""],
    ["Security safeguards breach", "₹250 Cr  (Domains E, K)"],
    ["Breach notification failure", "₹200 Cr  (Domain F)"],
    ["Children's data non-compliance", "₹200 Cr  (Domain I)"],
    ["Processor obligation failures", "₹250 Cr  (Domains J, K)"],
    ["Notice / consent / rights / governance", "₹50 Cr   (Domains A–D, G–H, L–O)"],
    [],
    ["Counts in this workbook", ""],
    ["Domain Items (after Phase 1 filtering)", String(domainItemCount)],
    ["Policy Artefacts", String(policyCount)],
    ["Department × Control cells", String(deptCellCount)],
    [],
    ["Important", "This is an offline working / sharing copy. Re-import is not supported — fill answers back into the live PrivcybHub app to compute compliance scores."],
  ];
  const lSheet = XLSX.utils.aoa_to_sheet(legendRows);
  setColWidths(lSheet, [42, 80]);
  XLSX.utils.book_append_sheet(wb, lSheet, "Legend");

  // ============ WRITE & DOWNLOAD ============
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  const fname = `PrivcybHub_DPDP_Questionnaire_${slugify(assessment.org_name)}_${istStamp()}.xlsx`;
  saveAs(blob, fname);
}