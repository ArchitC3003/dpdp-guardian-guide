export type SpeechBlock = { kind: "heading" | "text"; text: string; el?: Element };

/** Add this attribute to anything inside the article that must not be read aloud. */
export const LISTEN_SKIP = "data-listen-skip";

const SKIP_TAGS = new Set(["NAV", "BUTTON", "IMG", "SVG", "PRE", "SCRIPT", "STYLE", "IFRAME", "VIDEO", "AUDIO", "FORM", "INPUT", "SELECT", "TEXTAREA", "FIGURE", "CANVAS"]);
const HEADING_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6", "SUMMARY"]);
const STRUCTURAL_TAGS = new Set([...HEADING_TAGS, "P", "LI", "BLOCKQUOTE", "DIV", "SECTION", "ARTICLE", "ASIDE", "UL", "OL", "DL", "DT", "DD", "TABLE", "THEAD", "TBODY", "TFOOT", "DETAILS", "HEADER", "FOOTER", "MAIN"]);

const tidy = (s: string) => s.replace(/\s+/g, " ").trim();
/** Table and rule markup that reached the page as plain characters is turned into pauses, not read out. */
const speakable = (s: string) => tidy(s.replace(/[-:=_*]{3,}/g, " ").replace(/\s*\|\s*/g, ", ").replace(/(,\s*){2,}/g, ", ").replace(/^[,\s]+|[,\s]+$/g, ""));

function skipped(el: Element): boolean {
  return SKIP_TAGS.has(el.tagName.toUpperCase()) || el.hasAttribute(LISTEN_SKIP) || el.hasAttribute("hidden") || el.getAttribute("aria-hidden") === "true";
}

/** Text of an inline run or leaf, leaving out anything marked as skipped inside it. */
function inlineText(node: Node): string {
  if (node.nodeType === 3) return node.textContent || "";
  if (node.nodeType !== 1 || skipped(node as Element)) return "";
  return Array.from(node.childNodes).map(inlineText).join("");
}

/**
 * Reads the rendered article in document order and returns what a person would read:
 * headings, paragraphs, list items, quotes, table rows and question/answer pairs.
 * Link text is kept and link addresses are never read, because only text nodes are used.
 * Content inside a closed <details> is included; it is part of the article.
 */
export function extractReadable(root: Element | null): SpeechBlock[] {
  const out: SpeechBlock[] = [];
  if (!root) return out;
  // The number of an ordered-list item, spoken with the first words found inside that item.
  let lead = "";
  const push = (kind: SpeechBlock["kind"], raw: string, el: Element) => {
    const text = speakable(raw);
    if (!text || !/[\p{L}\p{N}]/u.test(text)) return;
    out.push({ kind, text: lead + text, el });
    lead = "";
  };

  const walk = (el: Element) => {
    const tag = el.tagName.toUpperCase();
    if (tag === "TR") {
      push("text", Array.from(el.children).filter((c) => !skipped(c)).map((c) => tidy(inlineText(c))).filter(Boolean).join(", "), el);
      return;
    }
    const kind: SpeechBlock["kind"] = HEADING_TAGS.has(tag) ? "heading" : "text";
    let run = "";
    const flush = () => { push(kind, run, el); run = ""; };
    let item = 0;
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === 3) { run += child.textContent || ""; continue; }
      if (child.nodeType !== 1) continue;
      const c = child as Element;
      if (skipped(c)) continue;
      const ct = c.tagName.toUpperCase();
      if (ct === "BR") { run += " "; continue; }
      if (STRUCTURAL_TAGS.has(ct) || ct === "TR") {
        flush();
        lead = tag === "OL" && ct === "LI" ? `${++item}. ` : lead;
        walk(c);
        if (ct === "LI") lead = "";
      } else run += inlineText(c);
    }
    flush();
  };

  if (!skipped(root)) walk(root);
  return out;
}

/**
 * Splits one block into short pieces at sentence ends, so no single speech request runs long
 * enough for a browser to cut it off. A sentence longer than the limit is split at a comma or space.
 */
export function splitForSpeech(text: string, max = 220): string[] {
  const clean = tidy(text);
  if (!clean) return [];
  // A sentence ends at punctuation followed by a space, so "8.1" and "privcybhub.com" stay whole.
  const sentences: string[] = [];
  const end = /[.!?।]+["')\]]*\s+/g;
  let from = 0;
  for (let m = end.exec(clean); m; m = end.exec(clean)) { sentences.push(clean.slice(from, end.lastIndex)); from = end.lastIndex; }
  if (from < clean.length) sentences.push(clean.slice(from));
  const parts: string[] = [];
  let cur = "";
  const add = (piece: string) => {
    if (cur && (cur + piece).length > max) { parts.push(cur.trim()); cur = ""; }
    cur += piece;
  };
  for (const s of sentences) {
    if (s.length <= max) { add(s); continue; }
    let rest = s;
    while (rest.length > max) {
      let cut = rest.lastIndexOf(", ", max);
      if (cut < max / 2) cut = rest.lastIndexOf(" ", max);
      if (cut <= 0) cut = max;
      add(rest.slice(0, cut + 1));
      rest = rest.slice(cut + 1);
    }
    add(rest);
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}
