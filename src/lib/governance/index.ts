export type KVField = { label: string; value: string };
export type GovSection =
  | { id: string; type: "markdown"; heading: string; body: string }
  | { id: string; type: "key_value"; heading: string; note?: string; fields: KVField[] }
  | { id: string; type: "table"; heading: string; note?: string; columns: string[]; rows: string[][] }
  | { id: string; type: "list"; heading: string; note?: string; items: string[] }
  | { id: string; type: "callout"; heading: string; tone: "info" | "warning"; body: string };

export type GovSectionType = GovSection["type"];

export type GovDocument = {
  id: string; slug: string; title: string; category: string; version: string;
  status: "draft" | "published" | "archived"; effective_date: string | null;
  is_material_change: boolean; summary_of_changes: string | null; intro: string | null;
  sections: GovSection[]; published_at: string | null; updated_at: string; created_at: string;
};

export const SECTION_TYPES: { type: GovSectionType; label: string; hint: string }[] = [
  { type: "markdown", label: "Text", hint: "Paragraphs, headings and links" },
  { type: "list", label: "Bullet list", hint: "Short points, one per line" },
  { type: "key_value", label: "Contact / details card", hint: "Label and value pairs" },
  { type: "table", label: "Table", hint: "Rows and columns, e.g. sub-processors" },
  { type: "callout", label: "Notice box", hint: "Highlighted disclaimer or warning" },
];

/** Starter documents admins can open in the studio. The public URL is fixed for the first three. */
export const PRESET_DOCUMENTS: { slug: string; title: string; category: string; path: string }[] = [
  { slug: "privacy-policy", title: "Privacy Policy", category: "legal", path: "/privacy" },
  { slug: "terms-of-service", title: "Terms of Service", category: "legal", path: "/terms" },
  { slug: "cookie-policy", title: "Cookie Policy", category: "legal", path: "/policies/cookie-policy" },
  { slug: "security", title: "Security & Vulnerability Disclosure", category: "security", path: "/policies/security" },
  { slug: "data-processing-addendum", title: "Data Processing Addendum", category: "compliance", path: "/policies/data-processing-addendum" },
  { slug: "acceptable-use", title: "Acceptable Use Policy", category: "legal", path: "/policies/acceptable-use" },
  { slug: "grievance-redressal", title: "Grievance Redressal", category: "compliance", path: "/policies/grievance-redressal" },
];

export function publicPath(slug: string): string {
  return PRESET_DOCUMENTS.find((p) => p.slug === slug)?.path ?? `/policies/${slug}`;
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function newSection(type: GovSectionType): GovSection {
  const id = newId();
  switch (type) {
    case "markdown": return { id, type, heading: "New section", body: "" };
    case "list": return { id, type, heading: "New list", items: [""] };
    case "key_value": return { id, type, heading: "Contact details", fields: [{ label: "", value: "" }] };
    case "table": return { id, type, heading: "New table", columns: ["Column 1", "Column 2"], rows: [["", ""]] };
    case "callout": return { id, type, heading: "Important", tone: "info", body: "" };
  }
}

export function moveItem<T>(arr: T[], index: number, delta: number): T[] {
  const to = index + delta;
  if (to < 0 || to >= arr.length) return arr;
  const next = arr.slice();
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

/** "v1.2" -> "v1.3"; major bump -> "v2.0". Unknown formats get ".1" appended. */
export function bumpVersion(v: string, major = false): string {
  const m = /^v?(\d+)\.(\d+)$/.exec(v.trim());
  if (!m) return `${v}.1`;
  return major ? `v${Number(m[1]) + 1}.0` : `v${m[1]}.${Number(m[2]) + 1}`;
}

/** Problems that block publishing; empty array means ready. */
export function publishProblems(doc: Pick<GovDocument, "title" | "slug" | "version" | "sections" | "is_material_change" | "summary_of_changes">): string[] {
  const p: string[] = [];
  if (!doc.title.trim()) p.push("Add a title.");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(doc.slug)) p.push("The web address may only use lowercase letters, numbers and dashes.");
  if (!doc.version.trim()) p.push("Add a version number.");
  if (doc.sections.length === 0) p.push("Add at least one section.");
  doc.sections.forEach((s, i) => {
    const n = `Section ${i + 1}`;
    if (!s.heading.trim()) p.push(`${n} needs a heading.`);
    if ((s.type === "markdown" || s.type === "callout") && !s.body.trim()) p.push(`${n} has no text.`);
    if (s.type === "list" && !s.items.some((x) => x.trim())) p.push(`${n} has no list items.`);
    if (s.type === "key_value" && !s.fields.some((f) => f.label.trim() && f.value.trim())) p.push(`${n} has no filled-in details.`);
    if (s.type === "table" && (s.columns.length === 0 || s.rows.length === 0)) p.push(`${n} needs at least one column and one row.`);
  });
  if (doc.is_material_change && !doc.summary_of_changes?.trim()) p.push("Describe what changed — required for a material change.");
  return p;
}
