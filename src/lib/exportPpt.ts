import PptxGenJS from "pptxgenjs";
import type { DomainScore } from "./pptTypes";

interface PptExportData {
  orgName: string;
  overallScore: number;
  bandLabel: string;
  totalAssessed: number;
  totalYes: number;
  totalPartial: number;
  totalNo: number;
  p1Count: number;
  policyCurrentCount: number;
  policyMissingCount: number;
  deptCompliant: number;
  deptTotal: number;
  evidenceVerified: number;
  evidenceStated: number;
  evidenceNA: number;
  domainScores: DomainScore[];
  penaltyMap: { category: string; penalty: string; domains: string }[];
  narrative: string;
}

const BRAND_GREEN = "059669";
const BRAND_DARK = "0f172a";
const BRAND_CARD = "1e293b";
const WHITE = "FFFFFF";
const MUTED = "94a3b8";
const RED = "ef4444";
const AMBER = "f59e0b";
const GREEN = "22c55e";

// Add a slim footer to every slide so users can detect missing pages
function addFooter(slide: PptxGenJS.Slide) {
  slide.addText("PrivcybHub · Confidential", {
    x: 0.3,
    y: 5.4,
    w: 12.7,
    h: 0.25,
    fontSize: 9,
    color: MUTED,
    fontFace: "Arial",
    align: "left",
  });
}

// Split long text into chunks that fit a single slide (~2000 chars each)
function paginateText(text: string, charsPerPage = 2000): string[] {
  if (!text) return [""];
  if (text.length <= charsPerPage) return [text];
  const pages: string[] = [];
  let remaining = text.trim();
  while (remaining.length > 0) {
    if (remaining.length <= charsPerPage) {
      pages.push(remaining);
      break;
    }
    // Break on nearest paragraph or sentence boundary
    let cut = remaining.lastIndexOf("\n\n", charsPerPage);
    if (cut < charsPerPage * 0.5) cut = remaining.lastIndexOf(". ", charsPerPage);
    if (cut < charsPerPage * 0.5) cut = charsPerPage;
    pages.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  return pages;
}

function addTitleSlide(pptx: PptxGenJS, orgName: string) {
  const slide = pptx.addSlide();
  slide.background = { color: BRAND_DARK };
  slide.addText("PrivcybHub", { x: 0.8, y: 1.2, w: 8.4, h: 0.8, fontSize: 40, bold: true, color: BRAND_GREEN, fontFace: "Arial" });
  slide.addText("DPDP Act, 2023 — Compliance Assessment Report", { x: 0.8, y: 2.0, w: 8.4, h: 0.5, fontSize: 18, color: MUTED, fontFace: "Arial" });
  slide.addText(orgName || "Organisation Name", { x: 0.8, y: 3.0, w: 8.4, h: 0.6, fontSize: 24, bold: true, color: WHITE, fontFace: "Arial" });
  slide.addText(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, { x: 0.8, y: 4.0, w: 8.4, h: 0.4, fontSize: 12, color: MUTED, fontFace: "Arial" });
  slide.addText("CONFIDENTIAL", { x: 0.8, y: 4.8, w: 8.4, h: 0.3, fontSize: 11, color: RED, bold: true, fontFace: "Arial" });
  addFooter(slide);
}

function addScoreOverviewSlide(pptx: PptxGenJS, data: PptExportData) {
  const slide = pptx.addSlide();
  slide.background = { color: BRAND_DARK };
  slide.addText("Executive Summary", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, bold: true, color: WHITE, fontFace: "Arial" });

  // Score box
  const scoreColor = data.overallScore >= 70 ? GREEN : data.overallScore >= 50 ? AMBER : RED;
  slide.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: 1.1, w: 2.5, h: 1.8, fill: { color: BRAND_CARD }, rectRadius: 0.15 });
  slide.addText(`${data.overallScore}%`, { x: 0.5, y: 1.2, w: 2.5, h: 1.0, fontSize: 44, bold: true, color: scoreColor, align: "center", fontFace: "Arial" });
  slide.addText(data.bandLabel, { x: 0.5, y: 2.1, w: 2.5, h: 0.4, fontSize: 11, bold: true, color: scoreColor, align: "center", fontFace: "Arial" });
  slide.addText("Weighted Score", { x: 0.5, y: 2.5, w: 2.5, h: 0.3, fontSize: 10, color: MUTED, align: "center", fontFace: "Arial" });

  // Key metrics — computed grid (safe for any number of metrics)
  const metrics = [
    { label: "Items Assessed", value: `${data.totalAssessed} / 92` },
    { label: "Compliant (Yes)", value: String(data.totalYes), color: GREEN },
    { label: "Partial", value: String(data.totalPartial), color: AMBER },
    { label: "Non-Compliant (No)", value: String(data.totalNo), color: RED },
    { label: "P1 Urgent Items", value: String(data.p1Count), color: RED },
    { label: "Policies Current", value: `${data.policyCurrentCount} / 37` },
    { label: "Policies Missing", value: String(data.policyMissingCount), color: RED },
    { label: "Dept Grid Health", value: `${data.deptCompliant} / ${data.deptTotal}` },
  ];

  const cols = 2;
  const rows = Math.ceil(metrics.length / cols);
  const gridX = 3.5;
  const gridY = 1.1;
  const gridW = 6.4; // remaining width within slide
  const gridH = 3.6; // bounded so it never overflows the slide
  const gap = 0.15;
  const cardW = (gridW - gap * (cols - 1)) / cols;
  const cardH = (gridH - gap * (rows - 1)) / rows;

  metrics.forEach((m, i) => {
    const col = Math.floor(i / rows);
    const row = i % rows;
    const x = gridX + col * (cardW + gap);
    const y = gridY + row * (cardH + gap);
    slide.addShape(pptx.ShapeType.roundRect, { x, y, w: cardW, h: cardH, fill: { color: BRAND_CARD }, rectRadius: 0.1 });
    slide.addText(m.label, { x: x + 0.15, y: y + 0.08, w: cardW - 0.3, h: 0.3, fontSize: 10, color: MUTED, fontFace: "Arial" });
    slide.addText(m.value, { x: x + 0.15, y: y + 0.38, w: cardW - 0.3, h: cardH - 0.45, fontSize: 18, bold: true, color: m.color || WHITE, fontFace: "Arial" });
  });

  addFooter(slide);
}

function addDomainScoresSlide(pptx: PptxGenJS, domainScores: DomainScore[]) {
  const slide = pptx.addSlide();
  slide.background = { color: BRAND_DARK };
  slide.addText("Domain-wise Compliance Scores", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, bold: true, color: WHITE, fontFace: "Arial" });

  const rows: PptxGenJS.TableRow[] = [
    [
      { text: "Domain", options: { bold: true, fontSize: 9, color: MUTED, fill: { color: BRAND_CARD } } },
      { text: "Name", options: { bold: true, fontSize: 9, color: MUTED, fill: { color: BRAND_CARD } } },
      { text: "Yes", options: { bold: true, fontSize: 9, color: MUTED, align: "center", fill: { color: BRAND_CARD } } },
      { text: "Partial", options: { bold: true, fontSize: 9, color: MUTED, align: "center", fill: { color: BRAND_CARD } } },
      { text: "No", options: { bold: true, fontSize: 9, color: MUTED, align: "center", fill: { color: BRAND_CARD } } },
      { text: "N/A", options: { bold: true, fontSize: 9, color: MUTED, align: "center", fill: { color: BRAND_CARD } } },
      { text: "Score", options: { bold: true, fontSize: 9, color: MUTED, align: "center", fill: { color: BRAND_CARD } } },
      { text: "Penalty", options: { bold: true, fontSize: 9, color: MUTED, align: "center", fill: { color: BRAND_CARD } } },
    ],
  ];

  domainScores.forEach((d) => {
    const sColor = d.score >= 70 ? GREEN : d.score >= 50 ? AMBER : RED;
    rows.push([
      { text: d.domain, options: { fontSize: 9, color: BRAND_GREEN, bold: true } },
      { text: d.name, options: { fontSize: 8, color: WHITE } },
      { text: String(d.yes), options: { fontSize: 9, color: GREEN, align: "center" } },
      { text: String(d.partial), options: { fontSize: 9, color: AMBER, align: "center" } },
      { text: String(d.no), options: { fontSize: 9, color: RED, align: "center" } },
      { text: String(d.na), options: { fontSize: 9, color: MUTED, align: "center" } },
      { text: `${d.score}%`, options: { fontSize: 10, color: sColor, bold: true, align: "center" } },
      { text: d.penalty, options: { fontSize: 8, color: RED, align: "center" } },
    ]);
  });

  slide.addTable(rows, {
    x: 0.3,
    y: 1.0,
    w: 9.4,
    colW: [0.7, 2.8, 0.7, 0.7, 0.7, 0.7, 0.8, 1.1],
    border: { type: "solid", pt: 0.5, color: "334155" },
    rowH: 0.35,
    fontFace: "Arial",
    autoPage: true,
    autoPageRepeatHeader: true,
  });
  addFooter(slide);
}

function addDomainChartSlide(pptx: PptxGenJS, domainScores: DomainScore[], titleSuffix = "") {
  const slide = pptx.addSlide();
  slide.background = { color: BRAND_DARK };
  slide.addText(`Domain Scores — Visual${titleSuffix}`, { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, bold: true, color: WHITE, fontFace: "Arial" });

  const chartData = [{
    name: "Score",
    labels: domainScores.map((d) => d.domain),
    values: domainScores.map((d) => d.score),
  }];

  slide.addChart(pptx.ChartType.bar, chartData, {
    x: 0.5,
    y: 1.1,
    w: 9,
    h: 4.2,
    showValue: true,
    catAxisLabelColor: MUTED,
    catAxisLabelFontSize: 9,
    valAxisLabelColor: MUTED,
    valAxisLabelFontSize: 8,
    valAxisMaxVal: 100,
    chartColors: [BRAND_GREEN],
    showLegend: false,
  } as any);
  addFooter(slide);
}

function addDomainCharts(pptx: PptxGenJS, domainScores: DomainScore[]) {
  const MAX_PER_SLIDE = 12;
  if (domainScores.length <= MAX_PER_SLIDE) {
    addDomainChartSlide(pptx, domainScores);
    return;
  }
  // Split into two halves so labels stay legible
  const mid = Math.ceil(domainScores.length / 2);
  addDomainChartSlide(pptx, domainScores.slice(0, mid), " (Part 1)");
  addDomainChartSlide(pptx, domainScores.slice(mid), " (Part 2)");
}

function addPenaltySlide(pptx: PptxGenJS, penaltyMap: { category: string; penalty: string; domains: string }[]) {
  const slide = pptx.addSlide();
  slide.background = { color: BRAND_DARK };
  slide.addText("⚠ Penalty Exposure Map", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, bold: true, color: RED, fontFace: "Arial" });

  const rows: PptxGenJS.TableRow[] = [
    [
      { text: "Violation Category", options: { bold: true, fontSize: 11, color: MUTED, fill: { color: BRAND_CARD } } },
      { text: "Max Penalty", options: { bold: true, fontSize: 11, color: MUTED, align: "center", fill: { color: BRAND_CARD } } },
      { text: "Domains", options: { bold: true, fontSize: 11, color: MUTED, align: "center", fill: { color: BRAND_CARD } } },
    ],
  ];

  penaltyMap.forEach((p) => {
    rows.push([
      { text: p.category, options: { fontSize: 11, color: WHITE } },
      { text: p.penalty, options: { fontSize: 12, color: RED, bold: true, align: "center" } },
      { text: p.domains, options: { fontSize: 11, color: BRAND_GREEN, align: "center" } },
    ]);
  });

  slide.addTable(rows, {
    x: 0.8,
    y: 1.2,
    w: 8.4,
    colW: [4.5, 1.8, 2.1],
    border: { type: "solid", pt: 0.5, color: "334155" },
    rowH: 0.5,
    fontFace: "Arial",
    autoPage: true,
    autoPageRepeatHeader: true,
  });
  addFooter(slide);
}

function addEvidenceSlide(pptx: PptxGenJS, data: PptExportData) {
  const slide = pptx.addSlide();
  slide.background = { color: BRAND_DARK };
  slide.addText("Evidence & Policy Status", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, bold: true, color: WHITE, fontFace: "Arial" });

  // Evidence
  slide.addText("Evidence Verification", { x: 0.5, y: 1.1, w: 4, h: 0.4, fontSize: 14, bold: true, color: WHITE, fontFace: "Arial" });
  const evItems = [
    { label: "Verified – Seen", value: data.evidenceVerified, color: GREEN },
    { label: "Stated – Not Verified", value: data.evidenceStated, color: AMBER },
    { label: "Not Available", value: data.evidenceNA, color: RED },
  ];
  evItems.forEach((e, i) => {
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: 1.7 + i * 0.7, w: 4, h: 0.55, fill: { color: BRAND_CARD }, rectRadius: 0.08 });
    slide.addText(e.label, { x: 0.7, y: 1.75 + i * 0.7, w: 2.5, h: 0.45, fontSize: 11, color: MUTED, fontFace: "Arial" });
    slide.addText(String(e.value), { x: 3.5, y: 1.75 + i * 0.7, w: 0.8, h: 0.45, fontSize: 16, bold: true, color: e.color, align: "right", fontFace: "Arial" });
  });

  // Policy
  slide.addText("Policy Stack", { x: 5.5, y: 1.1, w: 4, h: 0.4, fontSize: 14, bold: true, color: WHITE, fontFace: "Arial" });
  const polItems = [
    { label: "Current Policies", value: data.policyCurrentCount, color: GREEN },
    { label: "Missing Policies", value: data.policyMissingCount, color: RED },
    { label: "Total Required", value: 37, color: WHITE },
  ];
  polItems.forEach((p, i) => {
    slide.addShape(pptx.ShapeType.roundRect, { x: 5.5, y: 1.7 + i * 0.7, w: 4, h: 0.55, fill: { color: BRAND_CARD }, rectRadius: 0.08 });
    slide.addText(p.label, { x: 5.7, y: 1.75 + i * 0.7, w: 2.5, h: 0.45, fontSize: 11, color: MUTED, fontFace: "Arial" });
    slide.addText(String(p.value), { x: 8.5, y: 1.75 + i * 0.7, w: 0.8, h: 0.45, fontSize: 16, bold: true, color: p.color, align: "right", fontFace: "Arial" });
  });
  addFooter(slide);
}

function addNarrativeSlide(pptx: PptxGenJS, narrative: string) {
  const pages = paginateText(narrative, 2000);
  pages.forEach((page, idx) => {
    const slide = pptx.addSlide();
    slide.background = { color: BRAND_DARK };
    const title = idx === 0 ? "Assessment Narrative" : `Assessment Narrative (continued ${idx + 1}/${pages.length})`;
    slide.addText(title, { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, bold: true, color: WHITE, fontFace: "Arial" });
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: 1.1, w: 9, h: 4.0, fill: { color: BRAND_CARD }, rectRadius: 0.15 });
    slide.addText(page, { x: 0.8, y: 1.3, w: 8.4, h: 3.6, fontSize: 13, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.4, valign: "top" });
    addFooter(slide);
  });
}

function addClosingSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  slide.background = { color: BRAND_DARK };
  slide.addText("PrivcybHub", { x: 0.5, y: 2.0, w: 9, h: 0.8, fontSize: 36, bold: true, color: BRAND_GREEN, align: "center", fontFace: "Arial" });
  slide.addText("Your Privacy & Cyber Compliance Hub", { x: 0.5, y: 2.8, w: 9, h: 0.5, fontSize: 16, color: MUTED, align: "center", fontFace: "Arial" });
  slide.addText("This report is auto-generated. For queries, contact your Data Protection Officer.", { x: 0.5, y: 4.0, w: 9, h: 0.4, fontSize: 10, color: MUTED, align: "center", fontFace: "Arial" });
  addFooter(slide);
}

export async function exportDashboardToPPT(data: PptExportData) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "PrivcybHub";
  pptx.company = data.orgName || "Organisation";
  pptx.subject = "DPDP Compliance Assessment Report";
  pptx.title = `${data.orgName || "Organisation"} — DPDP Compliance Report`;

  addTitleSlide(pptx, data.orgName);
  addScoreOverviewSlide(pptx, data);
  addDomainCharts(pptx, data.domainScores);
  addDomainScoresSlide(pptx, data.domainScores);
  addPenaltySlide(pptx, data.penaltyMap);
  addEvidenceSlide(pptx, data);
  addNarrativeSlide(pptx, data.narrative);
  addClosingSlide(pptx);

  const fileName = `${(data.orgName || "Organisation").replace(/[^a-zA-Z0-9]/g, "_")}_DPDP_Report_${new Date().toISOString().slice(0, 10)}.pptx`;
  await pptx.writeFile({ fileName });
}
