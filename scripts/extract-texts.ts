/**
 * extract-texts.ts
 *
 * Reads all PDF files in public/documents/ recursively, extracts text using
 * pdf-parse v2, and writes structured JSON output for each PDF with meaningful
 * text content. Also generates a summary analysis file.
 *
 * Usage:
 *   npx tsx scripts/extract-texts.ts
 */

import fs from "node:fs";
import path from "node:path";
import { PDFParse } from "pdf-parse";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DOCUMENTS_DIR = path.join(PROJECT_ROOT, "public", "documents");
const TEXTS_OUTPUT_DIR = path.join(PROJECT_ROOT, "src", "data", "texts");
const ANALYSIS_OUTPUT_PATH = path.join(
  PROJECT_ROOT,
  "src",
  "data",
  "pdf-analysis.json"
);

/** Minimum character count (after trimming) to consider a PDF as having meaningful text */
const MIN_TEXT_LENGTH = 50;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageEntry {
  num: number;
  text: string;
}

interface TextOutput {
  source: string;
  pages: PageEntry[];
  fullText: string;
}

interface PdfAnalysisEntry {
  relativePath: string;
  filename: string;
  category: string;
  pageCount: number;
  hasText: boolean;
  textLength: number;
  fileSizeBytes: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively collect all .pdf files under a given directory.
 */
function collectPdfFiles(dir: string): string[] {
  const results: string[] = [];

  function walk(current: string): void {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (
        entry.isFile() &&
        entry.name.toLowerCase().endsWith(".pdf")
      ) {
        results.push(fullPath);
      }
    }
  }

  walk(dir);
  return results.sort();
}

/**
 * Clean extracted text by collapsing excessive whitespace while preserving
 * paragraph breaks (double newlines).
 */
function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Ensure that a directory exists, creating it recursively if needed.
 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("=== PDF Text Extraction ===\n");

  // Validate that documents directory exists
  if (!fs.existsSync(DOCUMENTS_DIR)) {
    console.error(`ERROR: Documents directory not found: ${DOCUMENTS_DIR}`);
    process.exit(1);
  }

  // Collect all PDF files
  const pdfFiles = collectPdfFiles(DOCUMENTS_DIR);
  console.log(`Found ${pdfFiles.length} PDF files in ${DOCUMENTS_DIR}\n`);

  if (pdfFiles.length === 0) {
    console.log("No PDF files to process. Exiting.");
    return;
  }

  // Ensure output directories exist
  ensureDir(TEXTS_OUTPUT_DIR);

  const analysisEntries: PdfAnalysisEntry[] = [];
  let extractedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < pdfFiles.length; i++) {
    const filePath = pdfFiles[i];
    const relativePath = path.relative(DOCUMENTS_DIR, filePath);
    const filename = path.basename(filePath);
    const category = path.dirname(relativePath);
    const fileSizeBytes = fs.statSync(filePath).size;

    const progress = `[${i + 1}/${pdfFiles.length}]`;

    try {
      // Read the PDF file
      const buffer = fs.readFileSync(filePath);
      const data = new Uint8Array(buffer);

      // Parse the PDF using pdf-parse v2 API
      const parser = new PDFParse({ data });
      const textResult = await parser.getText();

      const pageCount = textResult.total;
      const fullTextRaw = textResult.text;
      const fullText = cleanText(fullTextRaw);
      const textLength = fullText.length;
      const hasText = textLength > MIN_TEXT_LENGTH;

      // Build page entries with cleaned text
      const pages: PageEntry[] = textResult.pages.map((p) => ({
        num: p.num,
        text: cleanText(p.text),
      }));

      // Record analysis entry
      analysisEntries.push({
        relativePath,
        filename,
        category,
        pageCount,
        hasText,
        textLength,
        fileSizeBytes,
      });

      if (hasText) {
        // Write the text JSON file
        const outputRelative = relativePath.replace(/\.pdf$/i, ".json");
        const outputPath = path.join(TEXTS_OUTPUT_DIR, outputRelative);

        ensureDir(path.dirname(outputPath));

        const textOutput: TextOutput = {
          source: relativePath,
          pages,
          fullText,
        };

        fs.writeFileSync(outputPath, JSON.stringify(textOutput, null, 2), "utf-8");
        extractedCount++;
        console.log(`${progress} EXTRACTED: ${relativePath} (${pageCount} pages, ${textLength} chars)`);
      } else {
        skippedCount++;
        console.log(`${progress} SKIPPED (no meaningful text): ${relativePath} (${textLength} chars)`);
      }

      // Clean up the parser to free resources
      await parser.destroy();
    } catch (error) {
      errorCount++;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${progress} ERROR: ${relativePath} - ${message}`);

      // Still record an entry for the analysis file
      analysisEntries.push({
        relativePath,
        filename,
        category,
        pageCount: 0,
        hasText: false,
        textLength: 0,
        fileSizeBytes,
      });
    }
  }

  // Sort analysis entries by relativePath for consistent output
  analysisEntries.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  // Write the analysis summary file
  ensureDir(path.dirname(ANALYSIS_OUTPUT_PATH));
  fs.writeFileSync(
    ANALYSIS_OUTPUT_PATH,
    JSON.stringify(analysisEntries, null, 2),
    "utf-8"
  );

  // Print summary
  console.log("\n=== Summary ===");
  console.log(`Total PDFs processed: ${pdfFiles.length}`);
  console.log(`  Extracted (has text): ${extractedCount}`);
  console.log(`  Skipped (no text):    ${skippedCount}`);
  console.log(`  Errors:               ${errorCount}`);
  console.log(`\nText files written to:   ${TEXTS_OUTPUT_DIR}`);
  console.log(`Analysis file written to: ${ANALYSIS_OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
