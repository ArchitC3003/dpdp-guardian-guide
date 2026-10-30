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
