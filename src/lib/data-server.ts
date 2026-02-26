import fs from "node:fs";
import path from "node:path";
import type { Document } from "@/types";
import type { ExtractedText } from "@/components/document/text-panel";

export function getExtractedText(doc: Document): ExtractedText | null {
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
