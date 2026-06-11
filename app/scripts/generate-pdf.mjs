import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const input = path.resolve(root, "../docs/CatalogHQ-Features-and-Pricing.md");
const outputDir = path.resolve(root, "public");
const output = path.join(outputDir, "CatalogHQ-Features-and-Pricing.pdf");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const markdown = fs.readFileSync(input, "utf8");
const doc = new PDFDocument({ margin: 50, size: "A4" });
const stream = fs.createWriteStream(output);
doc.pipe(stream);

const pageWidth = doc.page.width - 100;

function writeLine(text, options = {}) {
  const { size = 11, bold = false, gap = 6, color = "#111827" } = options;
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size).fillColor(color);
  doc.text(text, { width: pageWidth, lineGap: 2 });
  doc.moveDown(gap / 10);
}

for (const rawLine of markdown.split("\n")) {
  const line = rawLine.trimEnd();

  if (!line) {
    doc.moveDown(0.4);
    continue;
  }

  if (line.startsWith("# ")) {
    writeLine(line.replace(/^# /, ""), { size: 22, bold: true, gap: 10 });
    continue;
  }

  if (line.startsWith("## ")) {
    doc.moveDown(0.3);
    writeLine(line.replace(/^## /, ""), { size: 16, bold: true, gap: 8 });
    continue;
  }

  if (line.startsWith("### ")) {
    writeLine(line.replace(/^### /, ""), { size: 13, bold: true, gap: 6 });
    continue;
  }

  if (line.startsWith("---")) {
    doc.moveDown(0.2);
    doc
      .strokeColor("#e5e7eb")
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke();
    doc.moveDown(0.6);
    continue;
  }

  if (line.startsWith("|")) {
    writeLine(line.replace(/\|/g, "  ").replace(/\s+/g, " ").trim(), {
      size: 9,
      gap: 2,
      color: "#374151",
    });
    continue;
  }

  if (line.startsWith("- ")) {
    writeLine(`• ${line.slice(2)}`, { size: 10, gap: 3 });
    continue;
  }

  if (line.startsWith("*") && line.endsWith("*")) {
    writeLine(line.replace(/\*/g, ""), { size: 10, color: "#6b7280", gap: 4 });
    continue;
  }

  writeLine(line.replace(/\*\*/g, ""), { size: 10, gap: 4 });
}

doc.end();

stream.on("finish", () => {
  console.log(`PDF written to ${output}`);
});
