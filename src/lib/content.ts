export type ContentType = "blog" | "article" | "landing" | "presentation" | "video";
export type MediaKind = "pdf" | "pptx" | "video_file" | "youtube" | "vimeo";
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
export const TYPE_LABELS: Record<ContentType, string> = { blog: "Blog post", article: "Article / guide", landing: "Landing page", presentation: "Presentation", video: "Video" };
export const TYPE_BADGES: Record<ContentType, string> = { blog: "Blog", article: "Guide", landing: "Page", presentation: "Slides", video: "Video" };

const MB = 1024 * 1024;
export const MEDIA_LIMITS = { presentation: 50 * MB, video: 200 * MB } as const;

/** Checks an upload for a presentation or video post. Returns the media kind or an error message. */
export function validateMediaFile(type: "presentation" | "video", f: { name: string; type: string; size: number }): { kind: MediaKind } | { error: string } {
  const ext = f.name.split(".").pop()?.toLowerCase() || "";
  if (type === "presentation") {
    const kind: MediaKind | null = ext === "pdf" || f.type === "application/pdf" ? "pdf" : ext === "pptx" ? "pptx" : null;
    if (!kind) return { error: "Choose a PDF or PowerPoint (.pptx) file" };
    if (f.size > MEDIA_LIMITS.presentation) return { error: "Presentations must be 50 MB or smaller" };
    return { kind };
  }
  if (!["mp4", "webm"].includes(ext) && !["video/mp4", "video/webm"].includes(f.type)) return { error: "Choose an MP4 or WebM video" };
  if (f.size > MEDIA_LIMITS.video) return { error: "Videos must be 200 MB or smaller — use a YouTube or Vimeo link for larger files" };
  return { kind: "video_file" };
}

/** Turns a YouTube or Vimeo link into a privacy-friendly embed URL. */
export function videoEmbed(url: string): { kind: "youtube" | "vimeo"; embed: string } | null {
  const yt = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(url);
  if (yt) return { kind: "youtube", embed: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  const vm = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url);
  if (vm) return { kind: "vimeo", embed: `https://player.vimeo.com/video/${vm[1]}?dnt=1` };
  return null;
}

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
export function isLive(p: { status: string; published_at: string | null; scheduled_for?: string | null }, now = new Date()): boolean {
  const t = now.getTime();
  if (p.status === "published") return !p.published_at || new Date(p.published_at).getTime() <= t;
  if (p.status === "scheduled") return !!p.scheduled_for && new Date(p.scheduled_for).getTime() <= t;
  return false;
}
/** Date a live post went live (for display and feeds). */
export function liveDate(p: { status: string; published_at: string | null; scheduled_for?: string | null; updated_at?: string }): string {
  return (p.status === "scheduled" ? p.scheduled_for : p.published_at) || p.published_at || p.updated_at || new Date().toISOString();
}

/** Super Admin, GRC Manager and Reviewer can write drafts. */
export function canEditContent(role: string): boolean {
  return role === "admin" || role === "moderator" || role === "user";
}
/** Only Super Admin and GRC Manager can schedule, publish or archive. */
export function canPublishContent(role: string): boolean {
  return role === "admin" || role === "moderator";
}
/** Statuses a role may save a post into. */
export function allowedStatuses(role: string): ContentStatus[] {
  if (canPublishContent(role)) return ["draft", "in_review", "scheduled", "published", "archived"];
  if (canEditContent(role)) return ["draft", "in_review"];
  return [];
}
/** Reviewers may only edit posts that are not yet scheduled, live or archived. */
export function canEditPost(role: string, status: string): boolean {
  if (canPublishContent(role)) return true;
  return canEditContent(role) && (status === "draft" || status === "in_review");
}
/** All four staff roles can open the studio; Auditors read-only. */
export function canViewStudio(role: string): boolean {
  return canEditContent(role) || role === "auditor";
}
export const TOPIC_PILLS = ["DPDP", "GDPR", "RBI", "SEBI", "CERT-In", "ISO 27701"];
export const fmtIST = (iso: string | null | undefined, withTime = true) =>
  iso ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", ...(withTime ? { timeStyle: "short" } : {}) }) + (withTime ? " IST" : "") : "—";

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
    { ok: d.length >= 120 && d.length <= 155, label: `Description length ${d.length}/155` },
    { ok: !!k && t.toLowerCase().includes(k), label: "Focus keyword in title" },
    { ok: !!k && p.body_md.toLowerCase().includes(k), label: "Focus keyword in body" },
    { ok: headings(p.body_md).length >= 2, label: "At least two section headings" },
    { ok: p.body_md.split(/\s+/).length >= 300, label: "300+ words" },
  ];
}

/** Learn link in the public top nav is hidden until at least this many items are live. /learn stays reachable directly. */
export const LEARN_NAV_MIN_ITEMS = 5;
export const FORMAT_FILTERS = [["all", "All"], ["read", "Articles"], ["presentation", "Slides"], ["video", "Videos"]] as const;
/** Starter framework vocabulary. The live list is the content_frameworks table, so publishers can add more without code changes. */
export const DEFAULT_FRAMEWORKS = ["DPDP", "GDPR", "RBI", "SEBI", "CERT-In", "ISO 27001", "ISO 27701", "ISO 42001"];
export const FRAMEWORK_FILTERS = ["All", ...DEFAULT_FRAMEWORKS];
/** Returns the values not in the allowed vocabulary (exact, case-sensitive). */
export function unknownFrameworks(values: string[], vocabulary: string[] = DEFAULT_FRAMEWORKS): string[] {
  const allowed = new Set(vocabulary);
  return values.filter((v) => !allowed.has(v));
}
export type FormatFilter = typeof FORMAT_FILTERS[number][0];
type Filterable = { content_type: string; title: string; excerpt: string | null; tags: string[] | null; frameworks?: string[] | null };
/** Format AND framework (exact value in the frameworks array) AND search (title, summary, tags). */
export function matchesLearnFilters(r: Filterable, format: FormatFilter, framework: string, q: string): boolean {
  const fmtOk = format === "all" || (format === "read" ? r.content_type === "blog" || r.content_type === "article" : r.content_type === format);
  const fwOk = framework === "All" || (r.frameworks || []).includes(framework);
  const needle = q.trim().toLowerCase();
  const qOk = !needle || [r.title, r.excerpt || "", ...(r.tags || [])].join(" ").toLowerCase().includes(needle);
  return fmtOk && fwOk && qOk;
}
