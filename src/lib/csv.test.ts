import { describe, it, expect } from "vitest";
import { csvCell, csvRow } from "./csv";

describe("csvCell", () => {
  it("neutralises formula prefixes", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe(`"'=HYPERLINK(1)"`);
    expect(csvCell("+1")).toBe(`"'+1"`);
    expect(csvCell("-1")).toBe(`"'-1"`);
    expect(csvCell("@SUM(A1)")).toBe(`"'@SUM(A1)"`);
  });
  it("escapes quotes and commas", () => {
    expect(csvRow(['a,b', 'say "hi"'])).toBe(`"a,b","say ""hi"""`);
  });
});
