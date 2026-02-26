import fs from "node:fs";
import path from "node:path";
import type { Document } from "@/types";
import type { ExtractedText } from "@/components/document/text-panel";

export function getExtractedText(doc: Document): ExtractedText | null {
  if (!doc.hasExtractedText) return null;

  // Derive text file path from pdfPath: /documents/x/y.pdf → src/data/texts/x/y.json
  const relativePdf = doc.pdfPath.replace(/^\/documents\//, "");
  const textFile = relativePdf.replace(/\.pdf$/i, ".json");
  const fullPath = path.join(process.cwd(), "src", "data", "texts", textFile);

  try {
    const content = fs.readFileSync(fullPath, "utf-8");
    const data = JSON.parse(content);
    return { pages: data.pages, fullText: data.fullText };
  } catch {
    return null;
  }
}
