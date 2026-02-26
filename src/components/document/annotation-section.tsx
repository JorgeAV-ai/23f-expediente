"use client";

import { useState } from "react";
import { AnnotationSidebar } from "./annotation-sidebar";
import { AnnotationBadge } from "./annotation-badge";
import { cn } from "@/lib/utils";
import type { Annotation } from "@/types";

interface AnnotationSectionProps {
  annotations: Annotation[];
}

export function AnnotationSection({ annotations }: AnnotationSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (annotations.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Toggle button */}
      <div className="mb-3 flex items-center gap-3">
        <AnnotationBadge
          count={annotations.length}
          isActive={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        />
        {!isOpen && (
          <span className="font-sans text-[11px] text-muted-foreground/50">
            Notas historicas y referencias cruzadas disponibles
          </span>
        )}
      </div>

      {/* Collapsible annotation sidebar */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <AnnotationSidebar
          annotations={annotations}
          className="max-h-[500px] rounded-sm"
        />
      </div>
    </div>
  );
}
