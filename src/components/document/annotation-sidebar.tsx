"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  AlertCircle,
  Link2,
  Languages,
  ChevronDown,
  ChevronRight,
  StickyNote,
  Quote,
} from "lucide-react";
import type { Annotation } from "@/types";

interface AnnotationSidebarProps {
  annotations: Annotation[];
  className?: string;
}

const categoryConfig: Record<
  Annotation["category"],
  {
    icon: typeof BookOpen;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  "historical-context": {
    icon: BookOpen,
    label: "Contexto historico",
    color: "text-amber",
    bgColor: "bg-amber/10",
    borderColor: "border-amber/30",
  },
  correction: {
    icon: AlertCircle,
    label: "Correccion",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
  },
  "cross-reference": {
    icon: Link2,
    label: "Referencia cruzada",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  translation: {
    icon: Languages,
    label: "Traduccion",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
};

function AnnotationCard({
  annotation,
  isExpanded,
  onToggle,
}: {
  annotation: Annotation;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = categoryConfig[annotation.category];
  const Icon = config.icon;
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <div
      className={cn(
        "group rounded-sm border transition-all duration-200",
        config.borderColor,
        isExpanded ? config.bgColor : "bg-card/50 hover:bg-card/80"
      )}
    >
      {/* Header - always visible */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <ChevronIcon
          size={12}
          className="shrink-0 text-muted-foreground/60 transition-transform duration-200"
        />
        <Icon size={14} className={cn("shrink-0", config.color)} />
        <Badge
          variant="outline"
          className={cn(
            "font-typewriter text-[8px] uppercase tracking-wider",
            config.borderColor,
            config.color
          )}
        >
          {config.label}
        </Badge>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="space-y-3 px-3 pb-3">
          <Separator className="bg-border/20" />

          {/* Annotation text */}
          <p className="font-sans text-[13px] leading-relaxed text-foreground/85">
            {annotation.text}
          </p>

          {/* Sources */}
          {annotation.sources.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Quote size={10} className="text-muted-foreground/50" />
                <span className="font-typewriter text-[9px] uppercase tracking-wider text-muted-foreground/60">
                  Fuentes
                </span>
              </div>
              <ul className="space-y-0.5 pl-3">
                {annotation.sources.map((source, i) => (
                  <li
                    key={i}
                    className="font-sans text-[11px] leading-snug text-muted-foreground/70"
                  >
                    {source}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AnnotationSidebar({
  annotations,
  className,
}: AnnotationSidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (annotations.length === 0) return null;

  function toggleAnnotation(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function expandAll() {
    setExpandedIds(new Set(annotations.map((a) => a.id)));
  }

  function collapseAll() {
    setExpandedIds(new Set());
  }

  const allExpanded = expandedIds.size === annotations.length;

  // Group annotations by category
  const grouped = annotations.reduce(
    (acc, ann) => {
      if (!acc[ann.category]) acc[ann.category] = [];
      acc[ann.category].push(ann);
      return acc;
    },
    {} as Record<string, Annotation[]>
  );

  const categoryOrder: Annotation["category"][] = [
    "historical-context",
    "correction",
    "cross-reference",
    "translation",
  ];

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
          <StickyNote size={14} className="text-amber" />
          <span className="font-typewriter text-xs font-bold uppercase tracking-[0.15em] text-amber">
            Anotaciones
          </span>
          <Badge
            variant="outline"
            className="font-typewriter text-[9px] tracking-wider border-amber/30 text-amber/80"
          >
            {annotations.length}
          </Badge>
        </div>
        <button
          onClick={allExpanded ? collapseAll : expandAll}
          className="font-typewriter text-[9px] uppercase tracking-wider text-muted-foreground/60 transition-colors hover:text-amber"
        >
          {allExpanded ? "Colapsar" : "Expandir"}
        </button>
      </div>

      {/* Annotation list */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-3">
          {categoryOrder.map((category) => {
            const items = grouped[category];
            if (!items || items.length === 0) return null;
            const config = categoryConfig[category];
            const CatIcon = config.icon;

            return (
              <div key={category} className="space-y-2">
                {/* Category header */}
                <div className="flex items-center gap-2 px-1">
                  <CatIcon size={11} className={config.color} />
                  <span
                    className={cn(
                      "font-typewriter text-[9px] font-bold uppercase tracking-[0.15em]",
                      config.color
                    )}
                  >
                    {config.label}
                  </span>
                  <div className="h-px flex-1 bg-border/20" />
                  <span className="font-typewriter text-[9px] text-muted-foreground/40">
                    {items.length}
                  </span>
                </div>

                {/* Annotation cards */}
                <div className="space-y-1.5">
                  {items.map((annotation) => (
                    <AnnotationCard
                      key={annotation.id}
                      annotation={annotation}
                      isExpanded={expandedIds.has(annotation.id)}
                      onToggle={() => toggleAnnotation(annotation.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
