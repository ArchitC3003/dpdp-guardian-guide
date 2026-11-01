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
