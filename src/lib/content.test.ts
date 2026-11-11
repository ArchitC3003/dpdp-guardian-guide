import { describe, it, expect } from "vitest";
import { isLive, canEditContent, canPublishContent, canEditPost, allowedStatuses, canViewStudio, slugify, publicPath } from "./content";

describe("content publishing rules", () => {
  const now = new Date("2026-10-29T00:00:00Z");
  it("drafts and in-review posts are never public", () => {
    expect(isLive({ status: "draft", published_at: "2026-01-01T00:00:00Z" }, now)).toBe(false);
    expect(isLive({ status: "in_review", published_at: "2026-01-01T00:00:00Z" }, now)).toBe(false);
  });
  it("scheduled posts go live once scheduled_for passes, without a status change", () => {
    expect(isLive({ status: "scheduled", published_at: null, scheduled_for: "2026-11-01T00:00:00Z" }, now)).toBe(false);
    expect(isLive({ status: "scheduled", published_at: null, scheduled_for: "2026-10-01T00:00:00Z" }, now)).toBe(true);
    expect(isLive({ status: "scheduled", published_at: "2026-10-01T00:00:00Z", scheduled_for: null }, now)).toBe(false);
  });
  it("published posts are live unless dated in the future", () => {
    expect(isLive({ status: "published", published_at: null }, now)).toBe(true);
    expect(isLive({ status: "published", published_at: "2026-12-01T00:00:00Z" }, now)).toBe(false);
  });
  it("archived posts are hidden", () => {
    expect(isLive({ status: "archived", published_at: "2026-01-01T00:00:00Z" }, now)).toBe(false);
  });
  it("Reviewers can write drafts but cannot schedule, publish or archive", () => {
    expect(canEditContent("user")).toBe(true);
    expect(canPublishContent("user")).toBe(false);
    expect(allowedStatuses("user")).toEqual(["draft", "in_review"]);
    expect(canEditPost("user", "published")).toBe(false);
    expect(canEditPost("user", "draft")).toBe(true);
  });
  it("Super Admin and GRC Manager can publish", () => {
    expect(canPublishContent("admin")).toBe(true);
    expect(canPublishContent("moderator")).toBe(true);
    expect(allowedStatuses("moderator")).toContain("published");
  });
  it("Auditors are read-only", () => {
    expect(canViewStudio("auditor")).toBe(true);
    expect(canEditContent("auditor")).toBe(false);
    expect(allowedStatuses("auditor")).toEqual([]);
  });
  it("slugs and paths", () => {
    expect(slugify("DPDP Act: What's new in 2026?")).toBe("dpdp-act-what-s-new-in-2026");
    expect(publicPath({ content_type: "landing", slug: "x" })).toBe("/lp/x");
    expect(publicPath({ content_type: "blog", slug: "x" })).toBe("/learn/x");
  });
});

import { validateMediaFile, videoEmbed } from "./content";
const MB = 1024 * 1024;
describe("presentation and video uploads", () => {
  it("routes presentations and videos to /learn", () => {
    expect(publicPath({ content_type: "presentation", slug: "a" })).toBe("/learn/a");
    expect(publicPath({ content_type: "video", slug: "b" })).toBe("/learn/b");
  });
  it("accepts PDF and PPTX presentations up to 50 MB", () => {
    expect(validateMediaFile("presentation", { name: "x.pptx", type: "", size: 50 * MB })).toEqual({ kind: "pptx" });
    expect(validateMediaFile("presentation", { name: "x.pdf", type: "application/pdf", size: 1 })).toEqual({ kind: "pdf" });
    expect("error" in validateMediaFile("presentation", { name: "x.pdf", type: "application/pdf", size: 50 * MB + 1 })).toBe(true);
    expect("error" in validateMediaFile("presentation", { name: "x.docx", type: "", size: 1 })).toBe(true);
  });
  it("accepts MP4/WebM videos up to 200 MB", () => {
    expect(validateMediaFile("video", { name: "v.mp4", type: "video/mp4", size: 200 * MB })).toEqual({ kind: "video_file" });
    expect("error" in validateMediaFile("video", { name: "v.mp4", type: "video/mp4", size: 200 * MB + 1 })).toBe(true);
    expect("error" in validateMediaFile("video", { name: "v.mov", type: "video/quicktime", size: 1 })).toBe(true);
  });
  it("builds privacy-enhanced embeds", () => {
    expect(videoEmbed("https://youtu.be/dQw4w9WgXcQ")?.embed).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(videoEmbed("https://vimeo.com/123456")?.embed).toBe("https://player.vimeo.com/video/123456?dnt=1");
    expect(videoEmbed("https://example.com")).toBeNull();
  });
});

import { matchesLearnFilters, LEARN_NAV_MIN_ITEMS, unknownFrameworks, DEFAULT_FRAMEWORKS } from "./content";
describe("Learn filters", () => {
  const slide = { content_type: "presentation", title: "Agritech order", excerpt: "Summary", tags: ["DPDP"], frameworks: ["DPDP"] };
  const base = { content_type: "article", title: "T", excerpt: null, tags: [] };
  it("requires both format and framework (AND)", () => {
    expect(matchesLearnFilters(slide, "presentation", "DPDP", "")).toBe(true);
    expect(matchesLearnFilters(slide, "presentation", "GDPR", "")).toBe(false);
    expect(matchesLearnFilters(slide, "video", "DPDP", "")).toBe(false);
  });
  it("UK GDPR does not match GDPR", () => {
    expect(matchesLearnFilters({ ...base, frameworks: ["UK GDPR"] }, "all", "GDPR", "")).toBe(false);
  });
  it("ISO 27001:2013 does not match ISO 27001", () => {
    expect(matchesLearnFilters({ ...base, frameworks: ["ISO 27001:2013"] }, "all", "ISO 27001", "")).toBe(false);
  });
  it("[DPDP, ISO 27001] matches both chips", () => {
    const r = { ...base, frameworks: ["DPDP", "ISO 27001"] };
    expect(matchesLearnFilters(r, "all", "DPDP", "")).toBe(true);
    expect(matchesLearnFilters(r, "all", "ISO 27001", "")).toBe(true);
  });
  it("starts with the 8 agreed frameworks and rejects unknown values", () => {
    expect(DEFAULT_FRAMEWORKS).toEqual(["DPDP", "GDPR", "RBI", "SEBI", "CERT-In", "ISO 27001", "ISO 27701", "ISO 42001"]);
    expect(unknownFrameworks(["DPDP", "UK GDPR"])).toEqual(["UK GDPR"]);
  });
  it("frameworks added to the vocabulary are accepted and matched exactly", () => {
    expect(unknownFrameworks(["HIPAA"], [...DEFAULT_FRAMEWORKS, "HIPAA"])).toEqual([]);
    expect(matchesLearnFilters({ ...base, frameworks: ["HIPAA"] }, "all", "HIPAA", "")).toBe(true);
  });
  it("search covers tags across formats", () => {
    expect(matchesLearnFilters(slide, "all", "All", "dpdp")).toBe(true);
  });
  it("nav threshold is 5", () => expect(LEARN_NAV_MIN_ITEMS).toBe(5));
});

import { DEFAULT_DOMAINS, EMPTY_FILING, MAX_TOPICS_PER_POST, filingError, setPrimaryTopic, toggleTopic } from "./content";

describe("Learn repository filing", () => {
  it("ships ten numbered domains with unique codes and non-empty topic lists", () => {
    expect(DEFAULT_DOMAINS.map((d) => d.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(new Set(DEFAULT_DOMAINS.map((d) => d.code)).size).toBe(10);
    expect(DEFAULT_DOMAINS.every((d) => d.topics.length > 0 && new Set(d.topics).size === d.topics.length)).toBe(true);
  });
  it("makes the first topic the home and cross-lists the rest", () => {
    const f = toggleTopic(toggleTopic(EMPTY_FILING, "consent"), "privacy-notices");
    expect(f).toEqual({ topicIds: ["consent", "privacy-notices"], primaryId: "consent" });
  });
  it("promotes the next topic when the home is removed, and clears when none are left", () => {
    const f = toggleTopic({ topicIds: ["a", "b"], primaryId: "a" }, "a");
    expect(f).toEqual({ topicIds: ["b"], primaryId: "b" });
    expect(toggleTopic(f, "b")).toEqual(EMPTY_FILING);
  });
  it("only lets a selected topic become the home", () => {
    const f = { topicIds: ["a", "b"], primaryId: "a" };
    expect(setPrimaryTopic(f, "b").primaryId).toBe("b");
    expect(setPrimaryTopic(f, "z")).toBe(f);
  });
  it("caps the number of topics per post", () => {
    const ids = Array.from({ length: MAX_TOPICS_PER_POST }, (_, i) => `t${i}`);
    const full = ids.reduce(toggleTopic, EMPTY_FILING);
    expect(toggleTopic(full, "extra")).toBe(full);
  });
  it("requires a topic before a Learn post goes live, but not for drafts or landing pages", () => {
    expect(filingError("article", "published", EMPTY_FILING)).toBeTruthy();
    expect(filingError("video", "scheduled", EMPTY_FILING)).toBeTruthy();
    expect(filingError("article", "draft", EMPTY_FILING)).toBeNull();
    expect(filingError("landing", "published", EMPTY_FILING)).toBeNull();
    expect(filingError("article", "published", { topicIds: ["a"], primaryId: "a" })).toBeNull();
  });
});

import { DOMAIN_BLURBS, homeDomainOf, postIdsFiledUnder } from "./content";

describe("Learn index helpers", () => {
  const topics = [
    { id: "t1", domain_code: "choice-consent", slug: "consent" },
    { id: "t2", domain_code: "choice-consent", slug: "withdrawal" },
    { id: "t3", domain_code: "notice", slug: "privacy-notices" },
  ];
  const filings = [
    { post_id: "p1", topic_id: "t1", is_primary: true },
    { post_id: "p1", topic_id: "t3", is_primary: false },
    { post_id: "p2", topic_id: "t2", is_primary: true },
  ];
  it("has a blurb for every domain", () => {
    expect(DEFAULT_DOMAINS.every((d) => !!DOMAIN_BLURBS[d.code])).toBe(true);
  });
  it("finds posts under a domain, including cross-listings", () => {
    expect([...postIdsFiledUnder(filings, topics, "choice-consent")].sort()).toEqual(["p1", "p2"]);
    expect([...postIdsFiledUnder(filings, topics, "notice")]).toEqual(["p1"]);
  });
  it("narrows to one topic by exact slug", () => {
    expect([...postIdsFiledUnder(filings, topics, "choice-consent", "withdrawal")]).toEqual(["p2"]);
    expect(postIdsFiledUnder(filings, topics, "choice-consent", "with").size).toBe(0);
  });
  it("reports the home domain, not a cross-listing", () => {
    expect(homeDomainOf("p1", filings, topics)).toBe("choice-consent");
    expect(homeDomainOf("nope", filings, topics)).toBeNull();
  });
});

import { postsCarrying, piecesLabel, FRAMEWORK_BLURBS, DEFAULT_FRAMEWORKS as STARTER_FRAMEWORKS } from "./content";

describe("Learn vocabulary lookups", () => {
  const posts = [{ id: "a", frameworks: ["DPDP", "ISO 27001"], artefacts: ["privacy-notice"] }, { id: "b", frameworks: ["ISO 27701"], artefacts: null }];
  it("matches frameworks and artefacts by exact value only", () => {
    expect(postsCarrying(posts, "frameworks", "ISO 27001").map((p) => p.id)).toEqual(["a"]);
    expect(postsCarrying(posts, "frameworks", "ISO 27")).toEqual([]);
    expect(postsCarrying(posts, "artefacts", "privacy-notice").map((p) => p.id)).toEqual(["a"]);
    expect(postsCarrying(posts, "artefacts", "privacy")).toEqual([]);
  });
  it("describes every starter framework and counts pieces in plain words", () => {
    expect(STARTER_FRAMEWORKS.every((f) => !!FRAMEWORK_BLURBS[f])).toBe(true);
    expect([piecesLabel(1), piecesLabel(4)]).toEqual(["1 piece", "4 pieces"]);
  });
});
