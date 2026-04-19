---
name: framework-excel-import
description: Universal Assessment Pack — 4-sheet XLSX (Framework Info, Assessment Checklist, Policy Artefacts, Department Controls) creates or populates frameworks via /admin/frameworks
type: feature
---
The Framework Manager (/admin/frameworks) supports bulk creation/population of frameworks via a 4-sheet XLSX "Assessment Pack" using SheetJS + file-saver. The 3-step Upload Pack dialog (Upload → Preview/Validate → Execute) lets admins either Create New Framework or Populate Existing.

**Official sheet names** (parser is case- and space/underscore-tolerant for backward compat):
1. **Framework Info** — AoA key/value pairs (name, short_code, version, jurisdiction, regulatory_body, effective_date, description, colour, icon_name) followed by a `SPECIAL_STATUS_FLAGS` marker row, then a flag header row (flag_key, flag_label, flag_hint, triggers_domain, triggers_requirement), then flag data rows.
2. **Assessment Checklist** — columns: domain_code, domain_name, section_ref, penalty_ref, conditional_flag, item_code, description, risk_level, evidence_type, sdf_only, guidance.
3. **Policy Artefacts** — category_code, category_name, item_code, artefact_name.
4. **Department Controls** — control_id, control_description, risk_level.

Validation enforces required columns, valid risk_level enums (critical/high/standard), unique item_codes, and unique short_codes. It also warns when checklist `conditional_flag` references don't match a defined flag_key. Imports populate framework_domains, framework_requirements (incl. requirement-level `conditional_flag`), framework_policy_artefacts, framework_dept_controls, framework_special_flags. Auto-creates a default assessment_template + assessment_template_frameworks link for new frameworks.

**Gating model**: `framework_domains.conditional_flag` = domain-level gating; `framework_requirements.conditional_flag` = requirement-level gating (added later, nullable). Both reference a `framework_special_flags.flag_key`.

Download Template button generates the official XLSX matching exactly what the importer expects. DPDP framework was seeded with 37 artefacts, 14 dept controls, and 8 special flags. Parser lives in src/utils/assessmentPackParser.ts.
