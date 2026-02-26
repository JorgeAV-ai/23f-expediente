"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Loader2,
  AlertTriangle,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

type ZoomLevel = "fit" | "100" | "150";

const ZOOM_CONFIG: Record<ZoomLevel, { label: string; scale: number | null }> =
  {
    fit: { label: "Ajustar", scale: null },
    "100": { label: "100%", scale: 1 },
    "150": { label: "150%", scale: 1.5 },
  };

interface PdfViewerProps {
  pdfPath: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onDocumentLoad?: (numPages: number) => void;
  className?: string;
}

export function PdfViewer({
  pdfPath,
  currentPage,
  onPageChange,
  onDocumentLoad,
  className,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [zoom, setZoom] = useState<ZoomLevel>("fit");
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function handleDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
    onDocumentLoad?.(numPages);
  }

  function handleDocumentLoadError() {
    setIsLoading(false);
    setError("No se pudo cargar el documento PDF.");
  }

  function goToPreviousPage() {
    if (currentPage > 1) onPageChange(currentPage - 1);
  }

  function goToNextPage() {
    if (currentPage < numPages) onPageChange(currentPage + 1);
  }

  function cycleZoom() {
    const levels: ZoomLevel[] = ["fit", "100", "150"];
    const idx = levels.indexOf(zoom);
    setZoom(levels[(idx + 1) % levels.length]);
  }

  const pageWidth =
    zoom === "fit" ? containerWidth - 2 : undefined;
  const pageScale =
    zoom !== "fit" ? ZOOM_CONFIG[zoom].scale ?? undefined : undefined;

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-3 py-2">
        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={goToPreviousPage}
            disabled={currentPage <= 1 || isLoading}
            aria-label="Pagina anterior"
          >
            <ChevronLeft size={16} />
          </Button>

          <span className="min-w-[5rem] text-center font-typewriter text-xs text-muted-foreground">
            {isLoading ? (
              <span className="text-muted-foreground/50">---</span>
            ) : (
              <>
                <span className="text-foreground">{currentPage}</span>
                <span className="mx-1 text-border">/</span>
                <span>{numPages}</span>
              </>
            )}
          </span>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={goToNextPage}
            disabled={currentPage >= numPages || isLoading}
            aria-label="Pagina siguiente"
          >
            <ChevronRight size={16} />
          </Button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              if (zoom === "fit") setZoom("100");
              else if (zoom === "100") setZoom("fit");
              else setZoom("100");
            }}
            disabled={isLoading}
            aria-label="Reducir zoom"
          >
            <ZoomOut size={14} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={cycleZoom}
            disabled={isLoading}
            className="font-typewriter text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            {zoom === "fit" ? (
              <Maximize size={12} className="mr-1" />
            ) : (
              <ZoomIn size={12} className="mr-1" />
            )}
            {ZOOM_CONFIG[zoom].label}
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              if (zoom === "fit") setZoom("100");
              else if (zoom === "100") setZoom("150");
              else setZoom("150");
            }}
            disabled={isLoading || zoom === "150"}
            aria-label="Aumentar zoom"
          >
            <ZoomIn size={14} />
          </Button>
        </div>
      </div>

      {/* PDF render area */}
      <div
        ref={containerRef}
        className={cn(
          "relative flex-1 overflow-auto bg-background",
          zoom !== "fit" && "overflow-x-auto"
        )}
      >
        {/* Loading skeleton */}
        {isLoading && !error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-card/80">
            <Loader2 size={28} className="animate-spin text-amber" />
            <span className="font-typewriter text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Desclasificando documento...
            </span>
            {/* Skeleton page shape */}
            <div className="h-[60vh] w-[80%] max-w-md animate-pulse rounded-sm border border-border/30 bg-muted/30" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <AlertTriangle size={32} className="text-destructive" />
            <p className="font-typewriter text-sm text-destructive">{error}</p>
            <Badge
              variant="outline"
              className="font-typewriter text-[9px] uppercase tracking-wider"
            >
              Documento inaccesible
            </Badge>
          </div>
        )}

        {/* PDF Document */}
        {!error && (
          <div className="flex justify-center py-4">
            <Document
              file={pdfPath}
              onLoadSuccess={handleDocumentLoadSuccess}
              onLoadError={handleDocumentLoadError}
              loading={null}
              className="flex justify-center"
            >
              <Page
                pageNumber={currentPage}
                width={pageWidth}
                scale={pageScale}
                loading={null}
                className="shadow-lg shadow-black/40"
                renderAnnotationLayer={true}
                renderTextLayer={true}
              />
            </Document>
          </div>
        )}
      </div>
    </div>
  );
}
