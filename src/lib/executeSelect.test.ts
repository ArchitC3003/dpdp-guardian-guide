import { describe, expect, it } from "vitest";
import { buildIndustryTree } from "@/data/privcybhubIndustries";
import { computeImpact, searchIndustries, summarizeNode } from "./executeSelect";
import { buildDonutSegments, buildLeafSegments, riskScore } from "@/components/execute/lotusSegments";
import { PRIVCYBHUB_INDUSTRIES } from "@/data/privcybhubIndustries";

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

describe("computeImpact", () => {
  const idOf = (sub: string) => PRIVCYBHUB_INDUSTRIES.find((i) => i.Sub_Sector === sub)!.PrivCybHub_Sector_ID;

  it("is empty when nothing is picked", () => {
    const r = computeImpact([]);
    expect(r).toMatchObject({ count: 0, exposure: null, index: 0, laws: [] });
  });

  it("flags health data and HIPAA for a hospital", () => {
    const r = computeImpact([idOf("Hospitals")]);
    expect(r.flags.health_data).toBe("Core");
    expect(r.laws.find((l) => l.name === "HIPAA")!.status).toBe("Likely");
    expect(r.laws[0]).toMatchObject({ name: "DPDP Act 2023", status: "Applies" });
  });

  it("flags RBI-regulated financial data for digital lending and ignores unknown ids", () => {
    const r = computeImpact([idOf("Digital Lending"), "nope"]);
    expect(r.count).toBe(1);
    expect(r.flags.financial_data).toBe("RBI-regulated");
    expect(r.flags.sdf_likelihood).toBe("High");
  });

  it("scales the index with exposure", () => {
    const low = PRIVCYBHUB_INDUSTRIES.find((i) => i.DPDP_Exposure === "Low")!.PrivCybHub_Sector_ID;
    const high = PRIVCYBHUB_INDUSTRIES.find((i) => i.DPDP_Exposure === "High")!.PrivCybHub_Sector_ID;
    expect(computeImpact([low]).index).toBe(0);
    expect(computeImpact([high]).index).toBe(100);
    expect(computeImpact([low, high]).index).toBe(50);
  });
});

describe("lotus segments", () => {
  const tree = buildIndustryTree();

  it("sizes petals by risk, not by taxonomy count", () => {
    expect(riskScore(["High"])).toBeGreaterThan(riskScore(["Low"]));
    const segs = buildDonutSegments(tree);
    expect(segs).toHaveLength(tree.children!.length);
    segs.forEach((s) => expect(s.risk).toBeGreaterThanOrEqual(0.3));
  });

  it("blooms a cluster into one petal per sub-sector", () => {
    const bfsi = tree.children!.find((c) => c.name === "BFSI")!;
    const leaves = buildLeafSegments(bfsi);
    expect(leaves).toHaveLength(bfsi.leafIds!.length);
    leaves.forEach((l) => expect(l.node.industry).toBeDefined());
  });
});
