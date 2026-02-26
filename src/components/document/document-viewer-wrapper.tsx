"use client";

import dynamic from "next/dynamic";
import type { ExtractedText } from "./text-panel";

const DocumentViewer = dynamic(
  () =>
    import("./document-viewer").then((m) => m.DocumentViewer),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-sm border border-border/50 bg-card/30 p-12 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-amber border-t-transparent" />
        <p className="mt-4 font-typewriter text-xs text-muted-foreground">
          Cargando visor...
        </p>
      </div>
    ),
  }
);

interface DocumentViewerWrapperProps {
  pdfPath: string;
  extractedText: ExtractedText | null;
  pageCount: number;
  annotationCount?: number;
}

export function DocumentViewerWrapper({
  pdfPath,
  extractedText,
  pageCount,
  annotationCount = 0,
}: DocumentViewerWrapperProps) {
  return (
    <DocumentViewer
      pdfPath={pdfPath}
      extractedText={extractedText}
      pageCount={pageCount}
      annotationCount={annotationCount}
    />
  );
}
