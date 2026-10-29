export type ContentType = "blog" | "article" | "landing";
export type ContentStatus = "draft" | "in_review" | "scheduled" | "published" | "archived";

export type LandingBlock = {
  type: "hero" | "text" | "benefits" | "faq" | "cta";
  heading: string;
  body: string; // for benefits/faq: one item per line ("Question | Answer" for faq)
};
export type FaqItem = { q: string; a: string };

export const SITE_URL = "https://privcybhub.com";
export const FONT_DISPLAY = "'Cormorant Garamond', serif";
export const FONT_BODY = "'Syne', sans-serif";

export const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "Draft", in_review: "In review", scheduled: "Scheduled", published: "Published", archived: "Archived",
};
export const TYPE_LABELS: Record<ContentType, string> = { blog: "Blog post", article: "Article / guide", landing: "Landing page" };

export function slugify(input: string): string {
  return input.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export function readingMinutes(md: string): number {
  const words = md.replace(/[#*_>`\[\]()-]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function publicPath(p: { content_type: string; slug: string }): string {
  return p.content_type === "landing" ? `/lp/${p.slug}` : `/learn/${p.slug}`;
}

/** Mirrors the database rule for what anonymous visitors can see. */
export function isLive(p: { status: string; published_at: string | null }, now = new Date()): boolean {
  if (p.status !== "published" && p.status !== "scheduled") return false;
  if (!p.published_at) return false;
  return new Date(p.published_at).getTime() <= now.getTime();
}

/** Only Super Admin (admin) and GRC Manager (moderator) can create, edit and publish. */
export function canEditContent(role: string): boolean {
  return role === "admin" || role === "moderator";
}
/** Auditors can view the studio read-only; Reviewers cannot open it. */
export function canViewStudio(role: string): boolean {
  return canEditContent(role) || role === "auditor";
}

export function headings(md: string): { id: string; text: string; level: number }[] {
  return md.split("\n").map((l) => /^(#{2,3})\s+(.+)$/.exec(l.trim())).filter(Boolean)
    .map((m) => ({ level: m![1].length, text: m![2].replace(/[*_`]/g, ""), id: slugify(m![2]) }));
}

export function seoChecks(p: { seo_title?: string | null; title: string; seo_description?: string | null; focus_keyword?: string | null; body_md: string }) {
  const t = p.seo_title || p.title;
  const d = p.seo_description || "";
  const k = (p.focus_keyword || "").toLowerCase().trim();
  return [
    { ok: t.length >= 30 && t.length <= 60, label: `Title length ${t.length}/60` },
    { ok: d.length >= 120 && d.length <= 160, label: `Description length ${d.length}/160` },
    { ok: !!k && t.toLowerCase().includes(k), label: "Focus keyword in title" },
    { ok: !!k && p.body_md.toLowerCase().includes(k), label: "Focus keyword in body" },
    { ok: headings(p.body_md).length >= 2, label: "At least two section headings" },
    { ok: p.body_md.split(/\s+/).length >= 300, label: "300+ words" },
  ];
}
