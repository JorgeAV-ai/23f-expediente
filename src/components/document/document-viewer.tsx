"use client";

import { useState } from "react";
import { PdfViewer } from "./pdf-viewer";
import { TextPanel, type ExtractedText } from "./text-panel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { FileText, BookOpen } from "lucide-react";

interface DocumentViewerProps {
  pdfPath: string;
  extractedText: ExtractedText | null;
  pageCount: number;
  annotationCount?: number;
  isOcrUnverified?: boolean;
  className?: string;
}

export function DocumentViewer({
  pdfPath,
  extractedText,
  pageCount,
  annotationCount = 0,
  isOcrUnverified,
  className,
}: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(pageCount);

  function handlePageChange(page: number) {
    setCurrentPage(page);
  }

  function handleDocumentLoad(numPages: number) {
    setTotalPages(numPages);
  }

  return (
    <div className={cn("rounded-sm border border-border/50 bg-card/30", className)}>
      {/* ── Desktop layout: side-by-side ── */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:divide-x lg:divide-border">
        {/* PDF panel */}
        <div className="flex flex-col" style={{ minHeight: "70vh" }}>
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            <FileText size={14} className="text-amber" />
            <span className="font-typewriter text-xs font-bold uppercase tracking-[0.15em] text-amber">
              Documento original
            </span>
          </div>
          <PdfViewer
            pdfPath={pdfPath}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onDocumentLoad={handleDocumentLoad}
            className="flex-1"
          />
        </div>

        {/* Text panel */}
        <TextPanel
          extractedText={extractedText}
          currentPage={currentPage}
          totalPages={totalPages}
          annotationCount={annotationCount}
          isOcrUnverified={isOcrUnverified}
          className="min-h-[70vh]"
        />
      </div>

      {/* ── Mobile layout: tabs ── */}
      <div className="lg:hidden">
        <Tabs defaultValue="documento">
          <TabsList className="w-full rounded-none border-b border-border bg-card">
            <TabsTrigger
              value="documento"
              className="flex-1 gap-1.5 font-typewriter text-xs uppercase tracking-wider"
            >
              <FileText size={12} />
              Documento
            </TabsTrigger>
            <TabsTrigger
              value="transcripcion"
              className="flex-1 gap-1.5 font-typewriter text-xs uppercase tracking-wider"
            >
              <BookOpen size={12} />
              Transcripcion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documento" className="mt-0">
            <PdfViewer
              pdfPath={pdfPath}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onDocumentLoad={handleDocumentLoad}
              className="min-h-[60vh]"
            />
          </TabsContent>

          <TabsContent value="transcripcion" className="mt-0">
            <TextPanel
              extractedText={extractedText}
              currentPage={currentPage}
              totalPages={totalPages}
              annotationCount={annotationCount}
              isOcrUnverified={isOcrUnverified}
              className="min-h-[60vh]"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
