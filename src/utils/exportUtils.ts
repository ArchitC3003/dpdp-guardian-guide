import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  ShadingType,
  TableOfContents,
  StyleLevel,
  convertInchesToTwip,
  PageBreak,
} from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportDocument {
  title: string;
  documentRef: string;
  version: string;
  status: string;
  classification: string;
  effectiveDate: string;
  reviewDate: string;
  selectedFrameworks: string[];
  industryVertical: string;
  orgSize: string;
  content: string;
}

const TEAL = "0D9488";
const DARK = "1A1A2E";
const GREY = "6B7280";
const WHITE = "FFFFFF";

function dateStamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function parseContentSections(content: string) {
  const lines = content.split("\n");
  const sections: { level: number; text: string; isTable: boolean; cells?: string[][] }[] = [];
  let tableBuffer: string[][] = [];
  let inTable = false;

  for (const line of lines) {
    if (line.startsWith("|") && line.includes("|")) {
      if (line.replace(/[|\-\s]/g, "") === "") continue; // separator row
      const cells = line.split("|").filter(Boolean).map((c) => c.trim());
      tableBuffer.push(cells);
      inTable = true;
      continue;
    }
    if (inTable && tableBuffer.length > 0) {
      sections.push({ level: 0, text: "", isTable: true, cells: [...tableBuffer] });
      tableBuffer = [];
      inTable = false;
    }
    if (line.startsWith("# ")) {
      sections.push({ level: 1, text: line.slice(2).trim(), isTable: false });
    } else if (line.startsWith("## ")) {
      sections.push({ level: 2, text: line.slice(3).trim(), isTable: false });
    } else if (line.startsWith("### ")) {
      sections.push({ level: 3, text: line.slice(4).trim(), isTable: false });
    } else if (line.startsWith("---")) {
      // skip separators
    } else if (line.trim()) {
      sections.push({ level: 0, text: line.trim(), isTable: false });
    }
  }
  if (tableBuffer.length > 0) {
    sections.push({ level: 0, text: "", isTable: true, cells: [...tableBuffer] });
  }
  return sections;
}

function parseInlineRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // Split on bold (**text**) and control refs [TAG]
  const regex = /(\*\*(.+?)\*\*)|(\[([A-Z][^\]]+)\])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index), size: 22, color: DARK }));
    }
    if (match[2]) {
      runs.push(new TextRun({ text: match[2], bold: true, size: 22, color: DARK }));
    } else if (match[4]) {
      runs.push(new TextRun({ text: `(${match[4]})`, italics: true, size: 16, color: GREY }));
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex), size: 22, color: DARK }));
  }
  if (runs.length === 0) {
    runs.push(new TextRun({ text, size: 22, color: DARK }));
  }
  return runs;
}

// ======================== DOCX EXPORT ========================

export async function exportToDOCX(doc: ExportDocument): Promise<void> {
  const sections = parseContentSections(doc.content);
  const isConfidential = doc.classification === "confidential" || doc.classification === "Confidential" ||
    doc.classification === "restricted" || doc.classification === "Restricted";

  // Build body paragraphs
  const bodyChildren: (Paragraph | Table)[] = [];

  for (const section of sections) {
    if (section.isTable && section.cells) {
      const rows = section.cells.map((rowCells, ri) =>
        new TableRow({
          children: rowCells.map((cell) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: cell.replace(/\*\*/g, ""), size: 20, color: ri === 0 ? WHITE : DARK, bold: ri === 0 })] })],
              shading: ri === 0 ? { type: ShadingType.SOLID, fill: TEAL, color: TEAL } : undefined,
              width: { size: 100 / rowCells.length, type: WidthType.PERCENTAGE },
            })
          ),
        })
      );
      bodyChildren.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
      bodyChildren.push(new Paragraph({ text: "" }));
    } else if (section.level === 1) {
      bodyChildren.push(new Paragraph({
        children: [new TextRun({ text: section.text, bold: true, size: 28, color: TEAL })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 120 },
      }));
    } else if (section.level === 2) {
      bodyChildren.push(new Paragraph({
        children: [new TextRun({ text: section.text, bold: true, size: 24, color: DARK })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 80 },
      }));
    } else if (section.level === 3) {
      bodyChildren.push(new Paragraph({
        children: [new TextRun({ text: section.text, bold: true, size: 22, color: DARK })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 60 },
      }));
    } else if (section.text) {
      bodyChildren.push(new Paragraph({
        children: parseInlineRuns(section.text),
        spacing: { after: 80 },
      }));
    }
  }

  // Signature block
  const sigRows = ["Prepared By", "Reviewed By", "Approved By", "Authorised By"].map((role) =>
    new TableRow({
      children: [role, "", "", ""].map((text, ci) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, size: 20, color: ci === 0 ? DARK : GREY })] })],
          width: { size: 25, type: WidthType.PERCENTAGE },
        })
      ),
    })
  );
  const sigHeader = new TableRow({
    children: ["Role", "Name", "Signature", "Date"].map((text) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, color: WHITE })] })],
        shading: { type: ShadingType.SOLID, fill: TEAL, color: TEAL },
        width: { size: 25, type: WidthType.PERCENTAGE },
      })
    ),
  });

  bodyChildren.push(new Paragraph({ spacing: { before: 600 }, children: [new TextRun({ text: "Approval & Sign-Off", bold: true, size: 28, color: TEAL })] }));
  bodyChildren.push(new Table({ rows: [sigHeader, ...sigRows], width: { size: 100, type: WidthType.PERCENTAGE } }));

  const docx = new Document({
    title: doc.title,
    subject: `${doc.documentRef} — ${doc.classification}`,
    creator: "PrivCybHub",
    keywords: doc.selectedFrameworks.join(", "),
    sections: [
      // Cover page
      {
        properties: { page: { pageNumbers: { start: 1 } } },
        headers: { default: new Header({ children: [] }) },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: `${doc.documentRef} | v${doc.version}`, size: 16, color: GREY }),
                new TextRun({ text: "    |    ", size: 16, color: GREY }),
                new TextRun({ text: doc.classification.toUpperCase(), size: 16, color: GREY, bold: true }),
                new TextRun({ text: "    |    Page ", size: 16, color: GREY }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY }),
                new TextRun({ text: " of ", size: 16, color: GREY }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: GREY }),
              ],
            })],
          }),
        },
        children: [
          new Paragraph({ spacing: { before: 2000 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "[Organisation Logo]", size: 24, color: GREY, italics: true })],
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: GREY } },
          }),
          new Paragraph({ spacing: { before: 600 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: doc.title, bold: true, size: 56, color: DARK })],
          }),
          new Paragraph({ spacing: { before: 200 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: doc.documentRef, size: 28, color: TEAL, bold: true })],
          }),
          new Paragraph({ spacing: { before: 200 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `Version ${doc.version}  |  ${doc.status}  |  ${doc.classification}`, size: 22, color: GREY }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100 },
            children: [new TextRun({ text: `Effective: ${doc.effectiveDate}  |  Review: ${doc.reviewDate}`, size: 20, color: GREY })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100 },
            children: [new TextRun({ text: `Frameworks: ${doc.selectedFrameworks.join(", ")}`, size: 20, color: TEAL })],
          }),
          ...(isConfidential
            ? [
                new Paragraph({ spacing: { before: 800 } }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "CONFIDENTIAL", bold: true, size: 48, color: "D97706" })],
                }),
              ]
            : []),
          new Paragraph({ children: [new PageBreak()] }),
        ],
      },
      // Body
      {
        properties: {},
        headers: {
          default: new Header({
            children: [new Paragraph({
              children: [
                new TextRun({ text: doc.title, bold: true, size: 18, color: DARK }),
                new TextRun({ text: `    |    ${doc.documentRef}`, size: 18, color: GREY }),
              ],
              border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: TEAL } },
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: `${doc.documentRef} | v${doc.version}`, size: 16, color: GREY }),
                new TextRun({ text: "    |    ", size: 16, color: GREY }),
                new TextRun({ text: doc.classification.toUpperCase(), size: 16, color: GREY, bold: true }),
                new TextRun({ text: "    |    Page ", size: 16, color: GREY }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY }),
                new TextRun({ text: " of ", size: 16, color: GREY }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: GREY }),
              ],
            })],
          }),
        },
        children: bodyChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(docx);
  const filename = `${doc.documentRef}_v${doc.version}_${dateStamp()}.docx`;
  saveAs(blob, filename);
}

// ======================== PDF EXPORT ========================

export async function exportToPDF(doc: ExportDocument): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const tealR = 13, tealG = 148, tealB = 136;

  // Helper: add footer to every page
  const addFooters = () => {
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(7);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`${doc.documentRef} | v${doc.version} | ${doc.effectiveDate}`, margin, pageHeight - 8);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
      pdf.setFontSize(6);
      pdf.text("Generated by PrivCybHub — Review with qualified legal counsel before implementation", pageWidth / 2, pageHeight - 4, { align: "center" });
      // Header line
      pdf.setDrawColor(tealR, tealG, tealB);
      pdf.setLineWidth(0.5);
      pdf.line(margin, 12, pageWidth - margin, 12);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(26, 26, 46);
      pdf.text(doc.title, margin, 10);
      pdf.setFont("helvetica", "normal");
      // Classification badge
      pdf.setFillColor(tealR, tealG, tealB);
      const clsText = doc.classification.toUpperCase();
      const clsWidth = pdf.getTextWidth(clsText) + 6;
      pdf.roundedRect(pageWidth - margin - clsWidth, 5, clsWidth, 6, 1, 1, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(7);
      pdf.text(clsText, pageWidth - margin - clsWidth + 3, 9.5);
    }
  };

  // ---- COVER PAGE ----
  let y = 60;
  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  pdf.text("[Organisation Logo]", pageWidth / 2, y, { align: "center" });

  y += 25;
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(26, 26, 46);
  const titleLines = pdf.splitTextToSize(doc.title, contentWidth);
  pdf.text(titleLines, pageWidth / 2, y, { align: "center" });
  y += titleLines.length * 10 + 8;

  pdf.setFontSize(14);
  pdf.setTextColor(tealR, tealG, tealB);
  pdf.text(doc.documentRef, pageWidth / 2, y, { align: "center" });
  y += 12;

  pdf.setFontSize(10);
  pdf.setTextColor(107, 114, 128);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Version ${doc.version}  |  ${doc.status}  |  ${doc.classification}`, pageWidth / 2, y, { align: "center" });
  y += 8;
  pdf.text(`Effective: ${doc.effectiveDate}  |  Review: ${doc.reviewDate}`, pageWidth / 2, y, { align: "center" });
  y += 8;
  pdf.setTextColor(tealR, tealG, tealB);
  pdf.setFontSize(9);
  const fwText = `Frameworks: ${doc.selectedFrameworks.join(", ")}`;
  const fwLines = pdf.splitTextToSize(fwText, contentWidth - 20);
  pdf.text(fwLines, pageWidth / 2, y, { align: "center" });

  const isConfidential = ["confidential", "restricted"].includes(doc.classification.toLowerCase());
  if (isConfidential) {
    y += 30;
    pdf.setFontSize(28);
    pdf.setTextColor(217, 119, 6);
    pdf.setFont("helvetica", "bold");
    pdf.text("CONFIDENTIAL", pageWidth / 2, y, { align: "center" });
  }

  // ---- BODY PAGES ----
  pdf.addPage();
  y = 18;

  const sections = parseContentSections(doc.content);

  for (const section of sections) {
    if (section.isTable && section.cells && section.cells.length > 0) {
      const head = [section.cells[0]];
      const body = section.cells.slice(1);
      autoTable(pdf, {
        startY: y,
        head,
        body,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [tealR, tealG, tealB], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 8, textColor: [26, 26, 46] },
        alternateRowStyles: { fillColor: [240, 253, 250] },
        styles: { cellPadding: 2 },
      });
      y = (pdf as any).lastAutoTable?.finalY + 6 || y + 20;
      if (y > pageHeight - 30) { pdf.addPage(); y = 18; }
      continue;
    }

    if (section.level === 1) {
      if (y > pageHeight - 40) { pdf.addPage(); y = 18; }
      y += 6;
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(tealR, tealG, tealB);
      const h1Lines = pdf.splitTextToSize(section.text, contentWidth);
      pdf.text(h1Lines, margin, y);
      y += h1Lines.length * 6 + 3;
    } else if (section.level === 2) {
      if (y > pageHeight - 35) { pdf.addPage(); y = 18; }
      y += 4;
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(26, 26, 46);
      const h2Lines = pdf.splitTextToSize(section.text, contentWidth);
      pdf.text(h2Lines, margin, y);
      y += h2Lines.length * 5 + 2;
    } else if (section.level === 3) {
      if (y > pageHeight - 30) { pdf.addPage(); y = 18; }
      y += 3;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(26, 26, 46);
      const h3Lines = pdf.splitTextToSize(section.text, contentWidth);
      pdf.text(h3Lines, margin, y);
      y += h3Lines.length * 4.5 + 2;
    } else if (section.text) {
      // Handle control references inline
      const cleanText = section.text.replace(/\*\*/g, "");
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(55, 65, 81);
      const bodyLines = pdf.splitTextToSize(cleanText, contentWidth);
      for (const bLine of bodyLines) {
        if (y > pageHeight - 20) { pdf.addPage(); y = 18; }
        pdf.text(bLine, margin, y);
        y += 4.5;
      }
      y += 1;
    }
  }

  // Signature block
  if (y > pageHeight - 50) { pdf.addPage(); y = 18; }
  y += 8;
  pdf.setFontSize(13);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(tealR, tealG, tealB);
  pdf.text("Approval & Sign-Off", margin, y);
  y += 6;

  autoTable(pdf, {
    startY: y,
    head: [["Role", "Name", "Signature", "Date"]],
    body: [
      ["Prepared By", "", "", ""],
      ["Reviewed By", "", "", ""],
      ["Approved By", "", "", ""],
      ["Authorised By", "", "", ""],
    ],
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [tealR, tealG, tealB], textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 9, textColor: [26, 26, 46], minCellHeight: 12 },
    styles: { cellPadding: 3 },
  });

  addFooters();

  const filename = `${doc.documentRef}_v${doc.version}_${dateStamp()}.pdf`;
  pdf.save(filename);
}
