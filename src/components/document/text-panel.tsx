"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileWarning, FileText, StickyNote } from "lucide-react";

export interface ExtractedText {
  pages: { num: number; text: string }[];
  fullText: string;
}

interface TextPanelProps {
  extractedText: ExtractedText | null;
  currentPage: number;
  totalPages: number;
  annotationCount?: number;
  className?: string;
}

export function TextPanel({
  extractedText,
  currentPage,
  totalPages,
  annotationCount = 0,
  className,
}: TextPanelProps) {
  if (!extractedText) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 border border-border/30 bg-card p-8",
          className
        )}
      >
        <FileWarning size={32} className="text-muted-foreground/40" />
        <div className="text-center">
          <p className="font-typewriter text-sm text-muted-foreground">
            Este documento es un escaneo
          </p>
          <p className="font-typewriter text-sm text-muted-foreground">
            sin texto extraible
          </p>
        </div>
        <Badge
          variant="outline"
          className="font-typewriter text-[9px] uppercase tracking-wider"
        >
          Solo imagen
        </Badge>
      </div>
    );
  }

  const currentPageText = extractedText.pages.find(
    (p) => p.num === currentPage
  );
  const hasText = currentPageText && currentPageText.text.trim().length > 0;

  return (
    <div
      className={cn(
        "flex flex-col border border-border/30 bg-card",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-amber" />
          <span className="font-typewriter text-xs font-bold uppercase tracking-[0.15em] text-amber">
            Transcripcion
          </span>
          {annotationCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber/20 bg-amber/5 px-1.5 py-0.5">
              <StickyNote size={10} className="text-amber/70" />
              <span className="font-typewriter text-[9px] text-amber/70">
                {annotationCount}
              </span>
            </span>
          )}
        </div>
        <span className="font-typewriter text-[10px] text-muted-foreground">
          Pag. {currentPage}
          {totalPages > 0 && (
            <>
              <span className="mx-1 text-border">/</span>
              {totalPages}
            </>
          )}
        </span>
      </div>

      {/* Text content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {hasText ? (
            <div className="space-y-4">
              {/* Page indicator */}
              <div className="flex items-center gap-2 border-b border-border/20 pb-2">
                <div className="h-px flex-1 bg-border/30" />
                <span className="font-typewriter text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
                  Pagina {currentPage}
                </span>
                <div className="h-px flex-1 bg-border/30" />
              </div>

              {/* Transcribed text */}
              <p className="whitespace-pre-wrap font-typewriter text-sm leading-relaxed text-foreground/90">
                {currentPageText.text}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <FileWarning
                size={24}
                className="text-muted-foreground/30"
              />
              <p className="text-center font-typewriter text-xs text-muted-foreground/50">
                No hay texto extraido para esta pagina.
              </p>
              <p className="text-center font-sans text-[10px] text-muted-foreground/30">
                Es posible que esta pagina contenga solo imagenes o elementos
                graficos.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
