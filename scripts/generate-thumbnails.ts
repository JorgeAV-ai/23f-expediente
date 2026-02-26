/**
 * generate-thumbnails.ts
 *
 * Generates WebP thumbnail images for all documents in public/documents/.
 *
 * - PDF files: renders the first page via `pdftoppm` (PNG mode), then converts PNG -> WebP with sharp
 * - JPG files (in exteriores/): resizes with sharp directly
 *
 * Output goes to public/thumbnails/ mirroring the same directory structure.
 * Existing thumbnails are skipped (incremental generation).
 *
 * Usage:
 *   npx tsx scripts/generate-thumbnails.ts
 */

import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DOCUMENTS_DIR = path.join(PROJECT_ROOT, "public", "documents");
const THUMBNAILS_DIR = path.join(PROJECT_ROOT, "public", "thumbnails");
const PDFTOPPM_BIN = "/opt/homebrew/bin/pdftoppm";
const THUMBNAIL_WIDTH = 400;
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "thumbnails-"));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively collect files matching given extensions under `dir`. */
function collectFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.toLowerCase().endsWith(ext))) {
      results.push(fullPath);
    }
  }

  return results;
}

/** Derive the output .webp path inside THUMBNAILS_DIR from a source file path. */
function thumbnailPath(sourcePath: string): string {
  const relative = path.relative(DOCUMENTS_DIR, sourcePath);
  const parsed = path.parse(relative);
  // e.g. interior/guardia-civil/file.pdf -> interior/guardia-civil/file.webp
  return path.join(THUMBNAILS_DIR, parsed.dir, `${parsed.name}.webp`);
}

/** Ensure the parent directory of `filePath` exists. */
function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Processors
// ---------------------------------------------------------------------------

async function processPdf(pdfPath: string, outPath: string): Promise<void> {
  // pdftoppm renders the first page (-f 1 -l 1) at a scale that produces
  // roughly THUMBNAIL_WIDTH px wide output. We use -scale-to-x to control width
  // and -scale-to-y -1 to let it auto-compute the height.
  // We use -png because sharp does not support raw PPM format.
  // pdftoppm with -singlefile writes to <prefix>.png, so we use a temp file.
  // Using execFileSync (no shell) to avoid command injection risks.
  const tmpPrefix = path.join(TMP_DIR, "page");
  const tmpPngPath = `${tmpPrefix}.png`;

  const args = [
    "-png",
    "-f", "1",
    "-l", "1",
    "-singlefile",
    "-scale-to-x", String(THUMBNAIL_WIDTH),
    "-scale-to-y", "-1",
    pdfPath,
    tmpPrefix,
  ];

  try {
    execFileSync(PDFTOPPM_BIN, args, {
      maxBuffer: 50 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`pdftoppm failed for ${pdfPath}: ${message}`);
  }

  if (!fs.existsSync(tmpPngPath)) {
    throw new Error(`pdftoppm produced no output file for ${pdfPath}`);
  }

  try {
    await sharp(tmpPngPath)
      .resize({ width: THUMBNAIL_WIDTH })
      .webp({ quality: 80 })
      .toFile(outPath);
  } finally {
    // Clean up temp PNG file
    if (fs.existsSync(tmpPngPath)) {
      fs.unlinkSync(tmpPngPath);
    }
  }
}

async function processImage(imagePath: string, outPath: string): Promise<void> {
  await sharp(imagePath)
    .resize({ width: THUMBNAIL_WIDTH })
    .webp({ quality: 80 })
    .toFile(outPath);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("=== Thumbnail Generator ===\n");

  // Verify pdftoppm is available
  if (!fs.existsSync(PDFTOPPM_BIN)) {
    console.error(`ERROR: pdftoppm not found at ${PDFTOPPM_BIN}`);
    console.error("Install poppler: brew install poppler");
    process.exit(1);
  }

  // Collect all source files
  const pdfFiles = collectFiles(DOCUMENTS_DIR, [".pdf"]);
  const jpgFiles = collectFiles(
    path.join(DOCUMENTS_DIR, "exteriores"),
    [".jpg", ".jpeg"]
  );

  const allFiles = [
    ...pdfFiles.map((f) => ({ path: f, type: "pdf" as const })),
    ...jpgFiles.map((f) => ({ path: f, type: "jpg" as const })),
  ];

  console.log(`Found ${pdfFiles.length} PDFs and ${jpgFiles.length} JPGs (${allFiles.length} total)\n`);

  if (allFiles.length === 0) {
    console.log("No files to process.");
    return;
  }

  // Ensure base thumbnails dir exists
  if (!fs.existsSync(THUMBNAILS_DIR)) {
    fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
  }

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of allFiles) {
    const outPath = thumbnailPath(file.path);
    const relSource = path.relative(DOCUMENTS_DIR, file.path);
    const relOut = path.relative(THUMBNAILS_DIR, outPath);

    // Skip if thumbnail already exists
    if (fs.existsSync(outPath)) {
      skipped++;
      continue;
    }

    ensureDir(outPath);

    try {
      if (file.type === "pdf") {
        await processPdf(file.path, outPath);
      } else {
        await processImage(file.path, outPath);
      }
      processed++;
      console.log(`  [OK]  ${relSource} -> ${relOut}`);
    } catch (err: unknown) {
      errors++;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  [ERR] ${relSource}: ${message}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped (already exist): ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total: ${allFiles.length}`);

  // Clean up temp directory
  try {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }

  if (errors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  // Clean up temp directory on fatal error
  try {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
  process.exit(1);
});
