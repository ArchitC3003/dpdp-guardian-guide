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
  conditional_flag?: string;
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

/* ─── Sheet name discovery (case-insensitive, space/underscore tolerant) ── */
const normSheet = (n: string) => n.toLowerCase().trim().replace(/[\s_-]+/g, "");

const findSheet = (wb: XLSX.WorkBook, ...candidates: string[]): string | null => {
  const normNames = wb.SheetNames.map(n => ({ raw: n, norm: normSheet(n) }));
  for (const c of candidates) {
    const cn = normSheet(c);
    const hit = normNames.find(x => x.norm === cn);
    if (hit) return hit.raw;
  }
  for (const c of candidates) {
    const cn = normSheet(c);
    const hit = normNames.find(x => x.norm.includes(cn));
    if (hit) return hit.raw;
  }
  return null;
};

/* ─── Parse Framework Info sheet (AoA — supports key/value + SPECIAL_STATUS_FLAGS section) ── */
const parseInfoSheetAoA = (ws: XLSX.WorkSheet): { info: PackInfo; flags: PackFlag[] } => {
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const info: PackInfo = {};
  const flags: PackFlag[] = [];

  let mode: "kv" | "flags-header" | "flags-data" = "kv";
  let flagHeaders: string[] = [];

  const isFlagsMarker = (cell: any) =>
    String(cell || "").trim().toUpperCase().replace(/[\s_-]+/g, "_") === "SPECIAL_STATUS_FLAGS";

  for (const row of rows) {
    if (!row || row.every(c => c === "" || c === null || c === undefined)) continue;

    if (mode === "kv") {
      if (isFlagsMarker(row[0])) { mode = "flags-header"; continue; }
      const key = normHeader(String(row[0] || ""));
      const val = String(row[1] ?? "").trim();
      if (!key) continue;
      // Map common keys onto PackInfo
      if (key === "name" || key === "framework_name") info.name = val;
      else if (key === "short_code" || key === "code") info.short_code = val;
      else if (key === "version") info.version = val;
      else if (key === "jurisdiction") info.jurisdiction = val;
      else if (key === "regulatory_body" || key === "authority") info.regulatory_body = val;
      else if (key === "description") info.description = val;
      else if (key === "effective_date") info.effective_date = val;
      else if (key === "colour" || key === "color") info.colour = val;
      else if (key === "icon_name" || key === "icon") info.icon_name = val;
      else (info as any)[key] = val;
    } else if (mode === "flags-header") {
      flagHeaders = row.map(c => normHeader(String(c || "")));
      mode = "flags-data";
    } else if (mode === "flags-data") {
      const get = (k: string) => {
        const idx = flagHeaders.indexOf(k);
        return idx >= 0 ? String(row[idx] ?? "").trim() : "";
      };
      const flag_key = get("flag_key");
      if (!flag_key) continue;
      flags.push({
        flag_key,
        flag_label: get("flag_label") || flag_key,
        flag_hint: get("flag_hint") || undefined,
        triggers_domain: get("triggers_domain") || undefined,
        triggers_requirement: get("triggers_requirement") || undefined,
      });
    }
  }

  // Defaults
  if (!info.version) info.version = "1.0";
  if (!info.jurisdiction) info.jurisdiction = "Global";
  if (!info.colour) info.colour = "#3B82F6";
  if (!info.icon_name) info.icon_name = "Shield";

  return { info, flags };
};

/* ─── Parse XLSX ───────────────────────────────────────── */
export const parsePack = async (file: File): Promise<ParsedPack> => {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const infoSheet = findSheet(wb, "Framework Info", "framework_info", "info", "framework");
  const checklistSheet = findSheet(wb, "Assessment Checklist", "checklist", "requirements", "domains");
  const artefactsSheet = findSheet(wb, "Policy Artefacts", "artefacts", "policies");
  const controlsSheet = findSheet(wb, "Department Controls", "dept_controls", "controls");

  const sheetsPresent = {
    info: !!infoSheet,
    checklist: !!checklistSheet,
    artefacts: !!artefactsSheet,
    controls: !!controlsSheet,
  };

  // ── Info sheet ─────────────────────────────────────────
  let info: PackInfo = {};
  let flags: PackFlag[] = [];
  if (infoSheet) {
    const ws = wb.Sheets[infoSheet];
    // Try AoA parse first (handles new template w/ SPECIAL_STATUS_FLAGS section)
    const aoa = parseInfoSheetAoA(ws);
    info = aoa.info;
    flags = aoa.flags;

    // Backward-compat: if AoA didn't yield a name, try the old JSON-style row format
    if (!info.name && !info.short_code) {
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
      if (rows.length > 0) {
        const headerMap = buildHeaderMap(rows[0]);
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
        }
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
        if (!domainCode && !itemCode && !description) return;
        checklist.push({
          domain_code: domainCode,
          domain_name: pickCol(r, headerMap, "domain_name", "domain_title") || domainCode,
          section_ref: pickCol(r, headerMap, "section_ref", "section") || undefined,
          penalty_ref: pickCol(r, headerMap, "penalty_ref", "penalty") || undefined,
          domain_description: pickCol(r, headerMap, "domain_description") || undefined,
          conditional_flag: pickCol(r, headerMap, "conditional_flag", "flag") || undefined,
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

  if (!pack.sheetsPresent.checklist) {
    errors.push("'Assessment Checklist' sheet is missing — required for all packs.");
  } else if (pack.checklist.length === 0) {
    errors.push("'Assessment Checklist' sheet has no data rows.");
  } else {
    const missingCols: string[] = [];
    const sample = pack.checklist[0];
    if (!sample.domain_code) missingCols.push("domain_code");
    if (!sample.domain_name) missingCols.push("domain_name");
    if (!sample.item_code) missingCols.push("item_code");
    if (!sample.description) missingCols.push("description");
    if (missingCols.length) errors.push(`Checklist missing required columns: ${missingCols.join(", ")}`);

    pack.checklist.forEach((r, i) => {
      if (r.risk_level && !validRisks.has(r.risk_level)) {
        errors.push(`Row ${i + 2}: invalid risk_level "${r.risk_level}" (allowed: critical, high, standard)`);
      }
    });

    const seen = new Map<string, number>();
    pack.checklist.forEach((r, i) => {
      if (!r.item_code) return;
      if (seen.has(r.item_code)) {
        errors.push(`Duplicate item_code "${r.item_code}" at rows ${seen.get(r.item_code)! + 2} and ${i + 2}`);
      } else {
        seen.set(r.item_code, i);
      }
    });

    // Validate conditional_flag references against defined flags
    if (pack.flags.length > 0) {
      const flagKeys = new Set(pack.flags.map(f => f.flag_key));
      const unknownFlags = new Set<string>();
      pack.checklist.forEach((r, i) => {
        if (r.conditional_flag && !flagKeys.has(r.conditional_flag)) {
          unknownFlags.add(`"${r.conditional_flag}" (row ${i + 2})`);
        }
      });
      if (unknownFlags.size > 0) {
        warnings.push(`Checklist references unknown conditional_flag values: ${Array.from(unknownFlags).join(", ")}. Define these in the SPECIAL_STATUS_FLAGS section of 'Framework Info'.`);
      }
    } else {
      const withFlag = pack.checklist.filter(r => r.conditional_flag).length;
      if (withFlag > 0) {
        warnings.push(`${withFlag} requirement(s) reference a conditional_flag but no flags are defined in 'Framework Info → SPECIAL_STATUS_FLAGS'.`);
      }
    }
  }

  if (mode === "create") {
    if (!pack.info.name) errors.push("Framework Info: 'name' is required when creating a new framework.");
    if (!pack.info.short_code) errors.push("Framework Info: 'short_code' is required when creating a new framework.");
    if (pack.info.short_code && existingShortCodes.includes(pack.info.short_code.toUpperCase())) {
      errors.push(`Short code "${pack.info.short_code}" already exists — choose a different code or use "Populate Existing".`);
    }
  }

  if (!pack.sheetsPresent.info) warnings.push("'Framework Info' sheet missing — using defaults.");
  if (!pack.sheetsPresent.artefacts) warnings.push("'Policy Artefacts' sheet missing — no policy artefacts will be imported.");
  if (!pack.sheetsPresent.controls) warnings.push("'Department Controls' sheet missing — no controls will be imported.");
  if (pack.flags.length === 0) warnings.push("No special status flags defined in 'Framework Info → SPECIAL_STATUS_FLAGS'.");

  return { errors, warnings };
};

/* ─── Template builder (matches official 4-sheet pack format) ─── */
export const downloadTemplate = () => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Framework Info — AoA with key/value pairs + SPECIAL_STATUS_FLAGS section
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["name", "Your Framework Name"],
    ["short_code", "FRMWK"],
    ["version", "1.0"],
    ["jurisdiction", "Country / Region"],
    ["regulatory_body", "Regulatory Authority"],
    ["effective_date", "2025-01-01"],
    ["description", "Brief description of the framework"],
    ["colour", "#3B82F6"],
    ["icon_name", "Shield"],
    [],
    ["SPECIAL_STATUS_FLAGS"],
    ["flag_key", "flag_label", "flag_hint", "triggers_domain", "triggers_requirement"],
    ["example_flag", "Example Special Status", "Description of when this applies", "", ""],
  ]), "Framework Info");

  // Sheet 2: Assessment Checklist — includes conditional_flag column
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["domain_code", "domain_name", "section_ref", "penalty_ref", "conditional_flag", "item_code", "description", "risk_level", "evidence_type", "sdf_only", "guidance"],
    ["A", "Example Domain", "Art. 1", "€10M", "", "A.1", "First requirement description", "critical", "Policy Document", "false", ""],
    ["A", "Example Domain", "Art. 1", "€10M", "", "A.2", "Second requirement description", "high", "SOP / Workflow", "false", ""],
  ]), "Assessment Checklist");

  // Sheet 3: Policy Artefacts
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["category_code", "category_name", "item_code", "artefact_name"],
    ["P", "Policies & Notices", "P.01", "Example Privacy Notice"],
    ["S", "SOPs & Procedures", "S.01", "Example Incident Response SOP"],
  ]), "Policy Artefacts");

  // Sheet 4: Department Controls
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["control_id", "control_description", "risk_level"],
    [1, "Example: Privacy notice covers this department", "high"],
    [2, "Example: Staff trained on obligations", "critical"],
  ]), "Department Controls");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), "assessment-pack-template.xlsx");
};
