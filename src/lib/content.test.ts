import { describe, it, expect } from "vitest";
import { isLive, canEditContent, canViewStudio, slugify, publicPath } from "./content";

describe("content publishing rules", () => {
  const now = new Date("2026-10-29T00:00:00Z");
  it("drafts are never public", () => {
    expect(isLive({ status: "draft", published_at: "2026-01-01T00:00:00Z" }, now)).toBe(false);
  });
  it("scheduled posts become public only once their date passes", () => {
    expect(isLive({ status: "scheduled", published_at: "2026-11-01T00:00:00Z" }, now)).toBe(false);
    expect(isLive({ status: "scheduled", published_at: "2026-10-01T00:00:00Z" }, now)).toBe(true);
  });
  it("archived posts are hidden", () => {
    expect(isLive({ status: "archived", published_at: "2026-01-01T00:00:00Z" }, now)).toBe(false);
  });
  it("only Super Admin and GRC Manager can edit", () => {
    expect(canEditContent("admin")).toBe(true);
    expect(canEditContent("moderator")).toBe(true);
    expect(canEditContent("user")).toBe(false);
    expect(canEditContent("auditor")).toBe(false);
  });
  it("auditors can view studio, reviewers cannot", () => {
    expect(canViewStudio("auditor")).toBe(true);
    expect(canViewStudio("user")).toBe(false);
  });
  it("slugs and paths", () => {
    expect(slugify("DPDP Act: What's new in 2026?")).toBe("dpdp-act-what-s-new-in-2026");
    expect(publicPath({ content_type: "landing", slug: "x" })).toBe("/lp/x");
    expect(publicPath({ content_type: "blog", slug: "x" })).toBe("/learn/x");
  });
});
