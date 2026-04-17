import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* ─── Types ────────────────────────────────────────────── */
export interface PackInfo {
  name?: string;
  short_code?: string;
  version?: string;
  jurisdiction?: string;
  regulatory_body?: string;
  description?: string;
  effective_date?: string;
  colour?: string;
  icon_name?: string;
}

export interface PackFlag {
  flag_key: string;
  flag_label: string;
  flag_hint?: string;
  triggers_domain?: string;
  triggers_requirement?: string;
}

export interface PackRequirement {
  domain_code: string;
  domain_name: string;
  section_ref?: string;
  penalty_ref?: string;
  domain_description?: string;
  item_code: string;
  description: string;
  guidance?: string;
  risk_level: string;
  evidence_type?: string;
  sdf_only?: boolean;
}

export interface PackArtefact {
  category_code: string;
  category_name: string;
  item_code: string;
  artefact_name: string;
}

export interface PackDeptControl {
  control_id: number;
  control_description: string;
  risk_level: string;
}

export interface ParsedPack {
  info: PackInfo;
  flags: PackFlag[];
  checklist: PackRequirement[];
  artefacts: PackArtefact[];
  deptControls: PackDeptControl[];
  sheetsPresent: { info: boolean; checklist: boolean; artefacts: boolean; controls: boolean };
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

/* ─── Header normalisation ─────────────────────────────── */
const normHeader = (h: string) =>
  String(h || "").trim().toLowerCase().replace(/[\s\-./()]+/g, "_").replace(/^_+|_+$/g, "");

const pickCol = (row: Record<string, any>, headerMap: Record<string, string>, ...keys: string[]) => {
  for (const k of keys) {
    const mapped = headerMap[k];
    if (mapped !== undefined && row[mapped] !== undefined && row[mapped] !== null && row[mapped] !== "") {
      return String(row[mapped]).trim();
    }
  }
  return "";
};

const buildHeaderMap = (row: Record<string, any>): Record<string, string> => {
  const map: Record<string, string> = {};
  Object.keys(row).forEach(k => { map[normHeader(k)] = k; });
  return map;
};

const isTruthy = (v: string) => ["yes", "true", "1", "y"].includes(v.toLowerCase());

/* ─── Sheet name discovery (case-insensitive) ──────────── */
const findSheet = (wb: XLSX.WorkBook, ...candidates: string[]): string | null => {
  const lower = wb.SheetNames.map(n => n.toLowerCase().trim());
  for (const c of candidates) {
    const idx = lower.indexOf(c.toLowerCase());
    if (idx >= 0) return wb.SheetNames[idx];
  }
  // Fuzzy: substring match
  for (const c of candidates) {
    const idx = lower.findIndex(n => n.includes(c.toLowerCase()));
    if (idx >= 0) return wb.SheetNames[idx];
  }
  return null;
};

/* ─── Parse XLSX ───────────────────────────────────────── */
export const parsePack = async (file: File): Promise<ParsedPack> => {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const infoSheet = findSheet(wb, "framework_info", "info", "framework");
  const checklistSheet = findSheet(wb, "checklist", "requirements", "domains");
  const artefactsSheet = findSheet(wb, "artefacts", "policy_artefacts", "policies");
  const controlsSheet = findSheet(wb, "dept_controls", "controls", "department_controls");

  const sheetsPresent = {
    info: !!infoSheet,
    checklist: !!checklistSheet,
    artefacts: !!artefactsSheet,
    controls: !!controlsSheet,
  };

  // ── Info sheet (key/value rows or single row) ──────────
  let info: PackInfo = {};
  const flags: PackFlag[] = [];
  if (infoSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[infoSheet], { defval: "" });
    if (rows.length > 0) {
      const headerMap = buildHeaderMap(rows[0]);
      // Try single-row format first
      if (headerMap["name"] || headerMap["short_code"]) {
        const r = rows[0];
        info = {
          name: pickCol(r, headerMap, "name", "framework_name"),
          short_code: pickCol(r, headerMap, "short_code", "code"),
          version: pickCol(r, headerMap, "version") || "1.0",
          jurisdiction: pickCol(r, headerMap, "jurisdiction") || "Global",
          regulatory_body: pickCol(r, headerMap, "regulatory_body", "authority"),
          description: pickCol(r, headerMap, "description"),
          effective_date: pickCol(r, headerMap, "effective_date"),
          colour: pickCol(r, headerMap, "colour", "color") || "#3B82F6",
          icon_name: pickCol(r, headerMap, "icon_name", "icon") || "Shield",
        };
        // Flag rows under same sheet — look for flag_key column
        rows.forEach(row => {
          const fk = pickCol(row, headerMap, "flag_key");
          if (fk) {
            flags.push({
              flag_key: fk,
              flag_label: pickCol(row, headerMap, "flag_label") || fk,
              flag_hint: pickCol(row, headerMap, "flag_hint", "hint") || undefined,
              triggers_domain: pickCol(row, headerMap, "triggers_domain") || undefined,
              triggers_requirement: pickCol(row, headerMap, "triggers_requirement") || undefined,
            });
          }
        });
      } else if (headerMap["key"] && headerMap["value"]) {
        // Key/value format
        rows.forEach(r => {
          const key = normHeader(String(r[headerMap["key"]] || ""));
          const val = String(r[headerMap["value"]] || "").trim();
          if (key && val) (info as any)[key] = val;
        });
      }
    }
  }

  // ── Checklist sheet ────────────────────────────────────
  const checklist: PackRequirement[] = [];
  if (checklistSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[checklistSheet], { defval: "" });
    if (rows.length > 0) {
      const headerMap = buildHeaderMap(rows[0]);
      rows.forEach(r => {
        const domainCode = pickCol(r, headerMap, "domain_code", "domain");
        const itemCode = pickCol(r, headerMap, "item_code", "requirement_code", "code");
        const description = pickCol(r, headerMap, "description", "requirement", "requirement_description");
        if (!domainCode && !itemCode && !description) return; // skip empty
        checklist.push({
          domain_code: domainCode,
          domain_name: pickCol(r, headerMap, "domain_name", "domain_title") || domainCode,
          section_ref: pickCol(r, headerMap, "section_ref", "section") || undefined,
          penalty_ref: pickCol(r, headerMap, "penalty_ref", "penalty") || undefined,
          domain_description: pickCol(r, headerMap, "domain_description") || undefined,
          item_code: itemCode,
          description,
          guidance: pickCol(r, headerMap, "guidance", "notes") || undefined,
          risk_level: (pickCol(r, headerMap, "risk_level", "risk") || "standard").toLowerCase(),
          evidence_type: pickCol(r, headerMap, "evidence_type", "evidence") || "Document",
          sdf_only: isTruthy(pickCol(r, headerMap, "sdf_only", "sdf")),
        });
      });
    }
  }

  // ── Artefacts sheet ────────────────────────────────────
  const artefacts: PackArtefact[] = [];
  if (artefactsSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[artefactsSheet], { defval: "" });
    if (rows.length > 0) {
      const headerMap = buildHeaderMap(rows[0]);
      rows.forEach(r => {
        const itemCode = pickCol(r, headerMap, "item_code", "code");
        const artefactName = pickCol(r, headerMap, "artefact_name", "name", "artefact");
        if (!itemCode && !artefactName) return;
        artefacts.push({
          category_code: pickCol(r, headerMap, "category_code", "category"),
          category_name: pickCol(r, headerMap, "category_name", "category_title") ||
            pickCol(r, headerMap, "category_code", "category"),
          item_code: itemCode,
          artefact_name: artefactName,
        });
      });
    }
  }

  // ── Dept Controls sheet ────────────────────────────────
  const deptControls: PackDeptControl[] = [];
  if (controlsSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[controlsSheet], { defval: "" });
    if (rows.length > 0) {
      const headerMap = buildHeaderMap(rows[0]);
      rows.forEach(r => {
        const controlIdRaw = pickCol(r, headerMap, "control_id", "id");
        const controlDesc = pickCol(r, headerMap, "control_description", "description", "control");
        if (!controlIdRaw && !controlDesc) return;
        const controlId = parseInt(controlIdRaw, 10);
        deptControls.push({
          control_id: isNaN(controlId) ? deptControls.length + 1 : controlId,
          control_description: controlDesc,
          risk_level: (pickCol(r, headerMap, "risk_level", "risk") || "standard").toLowerCase(),
        });
      });
    }
  }

  return { info, flags, checklist, artefacts, deptControls, sheetsPresent };
};

/* ─── Validation ───────────────────────────────────────── */
export const validatePack = (
  pack: ParsedPack,
  mode: "create" | "populate",
  existingShortCodes: string[],
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validRisks = new Set(["critical", "high", "standard"]);

  // Sheet 2 mandatory
  if (!pack.sheetsPresent.checklist) {
    errors.push("Checklist sheet is missing — required for all packs.");
  } else if (pack.checklist.length === 0) {
    errors.push("Checklist sheet has no data rows.");
  } else {
    // Required columns
    const missingCols: string[] = [];
    const sample = pack.checklist[0];
    if (!sample.domain_code) missingCols.push("domain_code");
    if (!sample.domain_name) missingCols.push("domain_name");
    if (!sample.item_code) missingCols.push("item_code");
    if (!sample.description) missingCols.push("description");
    if (missingCols.length) errors.push(`Checklist missing required columns: ${missingCols.join(", ")}`);

    // Risk level enum
    pack.checklist.forEach((r, i) => {
      if (r.risk_level && !validRisks.has(r.risk_level)) {
        errors.push(`Row ${i + 2}: invalid risk_level "${r.risk_level}" (allowed: critical, high, standard)`);
      }
    });

    // Duplicate item_code
    const seen = new Map<string, number>();
    pack.checklist.forEach((r, i) => {
      if (!r.item_code) return;
      if (seen.has(r.item_code)) {
        errors.push(`Duplicate item_code "${r.item_code}" at rows ${seen.get(r.item_code)! + 2} and ${i + 2}`);
      } else {
        seen.set(r.item_code, i);
      }
    });
  }

  // Create-new mode checks
  if (mode === "create") {
    if (!pack.info.name) errors.push("Framework Info: 'name' is required when creating a new framework.");
    if (!pack.info.short_code) errors.push("Framework Info: 'short_code' is required when creating a new framework.");
    if (pack.info.short_code && existingShortCodes.includes(pack.info.short_code.toUpperCase())) {
      errors.push(`Short code "${pack.info.short_code}" already exists — choose a different code or use "Populate Existing".`);
    }
  }

  // Warnings
  if (!pack.sheetsPresent.info) warnings.push("Framework Info sheet missing — using defaults.");
  if (!pack.sheetsPresent.artefacts) warnings.push("Artefacts sheet missing — no policy artefacts will be imported.");
  if (!pack.sheetsPresent.controls) warnings.push("Dept Controls sheet missing — no controls will be imported.");
  if (pack.flags.length === 0) warnings.push("No special status flags defined.");

  return { errors, warnings };
};

/* ─── Template builder ─────────────────────────────────── */
export const downloadTemplate = () => {
  const wb = XLSX.utils.book_new();

  const infoData = [
    { key: "name", value: "Example Framework Name" },
    { key: "short_code", value: "EXMP" },
    { key: "version", value: "1.0" },
    { key: "jurisdiction", value: "Global" },
    { key: "regulatory_body", value: "Authority Name" },
    { key: "description", value: "Brief description of the framework" },
    { key: "effective_date", value: "2024-01-01" },
    { key: "colour", value: "#3B82F6" },
    { key: "icon_name", value: "Shield" },
  ];
  const infoWithFlags = [
    { key: "name", value: "Example Framework", flag_key: "", flag_label: "", flag_hint: "", triggers_domain: "" },
    { key: "short_code", value: "EXMP", flag_key: "", flag_label: "", flag_hint: "", triggers_domain: "" },
    { key: "version", value: "1.0", flag_key: "", flag_label: "", flag_hint: "", triggers_domain: "" },
    { key: "jurisdiction", value: "Global", flag_key: "", flag_label: "", flag_hint: "", triggers_domain: "" },
    { key: "regulatory_body", value: "", flag_key: "", flag_label: "", flag_hint: "", triggers_domain: "" },
    { key: "description", value: "", flag_key: "", flag_label: "", flag_hint: "", triggers_domain: "" },
    { key: "", value: "", flag_key: "example_flag", flag_label: "Example Flag Label", flag_hint: "What this flag means", triggers_domain: "A" },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(infoWithFlags), "Framework_Info");

  const checklistData = [
    {
      domain_code: "A",
      domain_name: "Notice & Consent",
      section_ref: "S.5-6",
      penalty_ref: "₹50Cr",
      domain_description: "Obligations around lawful notice and consent",
      item_code: "A.1",
      description: "Publish a clear privacy notice in plain language",
      guidance: "Notice must list categories, purposes, retention, rights",
      risk_level: "high",
      evidence_type: "Document",
      sdf_only: "No",
    },
    {
      domain_code: "A",
      domain_name: "Notice & Consent",
      section_ref: "S.5-6",
      penalty_ref: "₹50Cr",
      domain_description: "",
      item_code: "A.2",
      description: "Obtain free, specific, informed, unconditional consent",
      guidance: "Consent must be capable of withdrawal at any time",
      risk_level: "critical",
      evidence_type: "Process",
      sdf_only: "No",
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(checklistData), "Checklist");

  const artefactsData = [
    { category_code: "P", category_name: "Policies", item_code: "P.01", artefact_name: "Privacy Policy" },
    { category_code: "S", category_name: "SOPs / Procedures", item_code: "S.01", artefact_name: "Consent Capture SOP" },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(artefactsData), "Artefacts");

  const controlsData = [
    { control_id: 1, control_description: "Privacy notice published & versioned", risk_level: "high" },
    { control_id: 2, control_description: "Granular consent capture with timestamp", risk_level: "critical" },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(controlsData), "Dept_Controls");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, "assessment-pack-template.xlsx");
};
