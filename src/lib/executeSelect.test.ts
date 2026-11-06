import { describe, expect, it } from "vitest";
import { buildIndustryTree } from "@/data/privcybhubIndustries";
import { searchIndustries, summarizeNode } from "./executeSelect";

describe("searchIndustries", () => {
  it("returns nothing for a blank query", () => {
    expect(searchIndustries("   ")).toEqual([]);
  });

  it("finds a sub-sector by name, case-insensitively", () => {
    expect(searchIndustries("digital LENDING")[0].Sub_Sector).toBe("Digital Lending");
  });

  it("requires every word to match", () => {
    const res = searchIndustries("hospitals zzzz");
    expect(res).toEqual([]);
  });

  it("ranks sub-sector name hits above cluster-only hits", () => {
    const res = searchIndustries("hospitals");
    expect(res[0].Sub_Sector).toBe("Hospitals");
  });

  it("respects the limit", () => {
    expect(searchIndustries("a", 3).length).toBeLessThanOrEqual(3);
  });
});

describe("summarizeNode", () => {
  const tree = buildIndustryTree();
  const bfsi = tree.children!.find((c) => c.name === "BFSI")!;

  it("counts every sub-sector under a cluster", () => {
    const s = summarizeNode(bfsi);
    expect(s.total).toBe(bfsi.leafIds!.length);
    expect(s.exposureCounts.High + s.exposureCounts.Medium + s.exposureCounts.Low).toBe(s.total);
  });

  it("reports the highest exposure and de-duplicated regulators", () => {
    const s = summarizeNode(bfsi);
    expect(s.exposure).toBe("High");
    expect(new Set(s.regulators).size).toBe(s.regulators.length);
    expect(s.regulators.length).toBeGreaterThan(0);
  });
});
