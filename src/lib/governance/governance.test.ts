import { describe, it, expect } from "vitest";
import { bumpVersion, moveItem, newSection, publishProblems, publicPath } from "./index";

const base = { title: "Privacy Policy", slug: "privacy-policy", version: "v1.0", is_material_change: false, summary_of_changes: "", sections: [{ id: "a", type: "markdown" as const, heading: "Who we are", body: "Text" }] };

describe("governance rules", () => {
  it("ready document has no problems", () => expect(publishProblems(base)).toEqual([]));
  it("blocks publishing with no sections", () => expect(publishProblems({ ...base, sections: [] })).toContain("Add at least one section."));
  it("material change requires a change summary", () =>
    expect(publishProblems({ ...base, is_material_change: true })).toContain("Describe what changed — required for a material change."));
  it("empty text section blocks publishing", () =>
    expect(publishProblems({ ...base, sections: [newSection("markdown")] })).toContain("Section 1 has no text."));
  it("bumps versions", () => { expect(bumpVersion("v1.2")).toBe("v1.3"); expect(bumpVersion("v1.2", true)).toBe("v2.0"); });
  it("moves sections and ignores out-of-range moves", () => {
    expect(moveItem([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
    expect(moveItem([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
  });
  it("keeps privacy and terms on their existing addresses", () => {
    expect(publicPath("privacy-policy")).toBe("/privacy");
    expect(publicPath("terms-of-service")).toBe("/terms");
    expect(publicPath("custom-doc")).toBe("/policies/custom-doc");
  });
});
