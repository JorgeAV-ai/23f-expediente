"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { FileText, User, Clock, Search, CornerDownLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClassifiedBadge } from "@/components/shared/classified-badge";
import { cn } from "@/lib/utils";

import documentsData from "@/data/documents.json";
import personsData from "@/data/persons.json";
import eventsData from "@/data/events.json";

import type { Document, Person, TimelineEvent } from "@/types";

const documents = documentsData as Document[];
const persons = personsData as Person[];
const events = eventsData as TimelineEvent[];

// ---------------------------------------------------------------------------
// Fuse indices (created once)
// ---------------------------------------------------------------------------

const docFuse = new Fuse(documents, {
  keys: [
    { name: "title", weight: 0.35 },
    { name: "titleShort", weight: 0.25 },
    { name: "summary", weight: 0.25 },
    { name: "tags", weight: 0.15 },
  ],
  threshold: 0.35,
  includeScore: true,
});

const personFuse = new Fuse(persons, {
  keys: [
    { name: "fullName", weight: 0.35 },
    { name: "displayName", weight: 0.3 },
    { name: "aliases", weight: 0.2 },
    { name: "bio", weight: 0.15 },
  ],
  threshold: 0.3,
  includeScore: true,
});

const eventFuse = new Fuse(events, {
  keys: [
    { name: "title", weight: 0.5 },
    { name: "description", weight: 0.5 },
  ],
  threshold: 0.35,
  includeScore: true,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchResult {
  id: string;
  type: "document" | "person" | "event";
  title: string;
  subtitle: string;
  href: string;
  classification?: Document["classification"];
}

const MAX_PER_CATEGORY = 5;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ---- Search logic ----
  const results = useMemo<{
    documents: SearchResult[];
    persons: SearchResult[];
    events: SearchResult[];
  }>(() => {
    const q = query.trim();
    if (!q) {
      return { documents: [], persons: [], events: [] };
    }

    const docResults = docFuse
      .search(q)
      .slice(0, MAX_PER_CATEGORY)
      .map((r) => ({
        id: r.item.id,
        type: "document" as const,
        title: r.item.titleShort,
        subtitle:
          r.item.summary.length > 90
            ? r.item.summary.slice(0, 90) + "..."
            : r.item.summary,
        href: `/expediente/documentos/${r.item.id}`,
        classification: r.item.classification,
      }));

    const personResults = personFuse
      .search(q)
      .slice(0, MAX_PER_CATEGORY)
      .map((r) => ({
        id: r.item.id,
        type: "person" as const,
        title: r.item.displayName,
        subtitle:
          r.item.bio.length > 90
            ? r.item.bio.slice(0, 90) + "..."
            : r.item.bio,
        href: `/expediente/personas/${r.item.id}`,
      }));

    const eventResults = eventFuse
      .search(q)
      .slice(0, MAX_PER_CATEGORY)
      .map((r) => ({
        id: r.item.id,
        type: "event" as const,
        title: r.item.title,
        subtitle:
          r.item.description.length > 90
            ? r.item.description.slice(0, 90) + "..."
            : r.item.description,
        href: `/cronologia#${r.item.id}`,
      }));

    return {
      documents: docResults,
      persons: personResults,
      events: eventResults,
    };
  }, [query]);

  // Flat list for keyboard navigation
  const flatResults = useMemo(
    () => [...results.documents, ...results.persons, ...results.events],
    [results]
  );

  const totalResults = flatResults.length;

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay so the dialog is rendered
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Scroll the active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector(
      `[data-result-index="${activeIndex}"]`
    );
    if (active) {
      active.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  // ---- Navigate to result ----
  const navigateTo = useCallback(
    (result: SearchResult) => {
      onOpenChange(false);
      router.push(result.href);
    },
    [router, onOpenChange]
  );

  // ---- Keyboard handling ----
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1 < totalResults ? i + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 >= 0 ? i - 1 : totalResults - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatResults[activeIndex]) {
          navigateTo(flatResults[activeIndex]);
        }
      }
    },
    [totalResults, flatResults, activeIndex, navigateTo]
  );

  // ---- Global Cmd+K / Ctrl+K ----
  useEffect(() => {
    function handleGlobal(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", handleGlobal);
    return () => document.removeEventListener("keydown", handleGlobal);
  }, [open, onOpenChange]);

  // ---- Helpers for section rendering ----
  let runningIndex = 0;

  function renderSection(
    label: string,
    icon: React.ReactNode,
    items: SearchResult[]
  ) {
    if (items.length === 0) return null;

    const sectionStartIndex = runningIndex;

    const section = (
      <div key={label}>
        {/* Section header */}
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="font-typewriter text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            {label}
          </span>
          <span className="ml-auto font-typewriter text-[10px] text-muted-foreground/60">
            {items.length}
          </span>
        </div>

        {/* Results */}
        {items.map((item, i) => {
          const globalIdx = sectionStartIndex + i;
          const isActive = globalIdx === activeIndex;

          return (
            <button
              key={item.id}
              data-result-index={globalIdx}
              onClick={() => navigateTo(item)}
              onMouseEnter={() => setActiveIndex(globalIdx)}
              className={cn(
                "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                isActive
                  ? "bg-accent/80 text-foreground"
                  : "text-muted-foreground hover:bg-accent/40"
              )}
            >
              {/* Type icon */}
              <span
                className={cn(
                  "mt-0.5 shrink-0",
                  isActive ? "text-amber" : "text-muted-foreground/60"
                )}
              >
                {item.type === "document" && <FileText size={16} />}
                {item.type === "person" && <User size={16} />}
                {item.type === "event" && <Clock size={16} />}
              </span>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "truncate font-typewriter text-sm",
                      isActive ? "text-amber" : "text-foreground"
                    )}
                  >
                    {item.title}
                  </span>
                  {item.classification && (
                    <ClassifiedBadge
                      level={item.classification}
                      className="scale-75 origin-left rotate-0 py-0 px-1.5 text-[9px] tracking-[0.15em]"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground/80">
                  {item.subtitle}
                </p>
              </div>

              {/* Enter hint on active */}
              {isActive && (
                <span className="mt-1 shrink-0 text-muted-foreground/50">
                  <CornerDownLeft size={14} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    );

    runningIndex += items.length;
    return section;
  }

  // ---- Render ----
  // Reset running index each render
  runningIndex = 0;

  const hasQuery = query.trim().length > 0;
  const noResults = hasQuery && totalResults === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[20%] translate-y-0 gap-0 overflow-hidden rounded-lg border border-border bg-card p-0 shadow-2xl sm:max-w-xl"
        onKeyDown={handleKeyDown}
      >
        {/* Accessible title (visually hidden) */}
        <DialogTitle className="sr-only">Buscar en el expediente</DialogTitle>

        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search size={18} className="shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar documentos, personas, eventos..."
            className="h-12 flex-1 bg-transparent font-typewriter text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
          <kbd className="hidden rounded border border-border bg-secondary px-1.5 py-0.5 font-typewriter text-[10px] text-muted-foreground sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results area */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto overscroll-contain"
        >
          {!hasQuery && (
            <div className="px-4 py-10 text-center">
              <p className="font-typewriter text-xs text-muted-foreground/60">
                Escriba para buscar en el expediente clasificado
              </p>
            </div>
          )}

          {noResults && (
            <div className="px-4 py-10 text-center">
              <p className="font-typewriter text-sm text-muted-foreground">
                Sin resultados
              </p>
              <p className="mt-1 font-typewriter text-xs text-muted-foreground/50">
                No se encontraron coincidencias para &ldquo;{query}&rdquo;
              </p>
            </div>
          )}

          {hasQuery && totalResults > 0 && (
            <div className="py-2">
              {renderSection(
                "Documentos",
                <FileText size={14} />,
                results.documents
              )}
              {renderSection(
                "Personas",
                <User size={14} />,
                results.persons
              )}
              {renderSection(
                "Eventos",
                <Clock size={14} />,
                results.events
              )}
            </div>
          )}
        </div>

        {/* Footer with hints */}
        {hasQuery && totalResults > 0 && (
          <div className="flex items-center gap-4 border-t border-border px-4 py-2">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-typewriter text-[9px]">
                &uarr;
              </kbd>
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-typewriter text-[9px]">
                &darr;
              </kbd>
              <span className="font-typewriter">navegar</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-typewriter text-[9px]">
                &crarr;
              </kbd>
              <span className="font-typewriter">abrir</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-typewriter text-[9px]">
                esc
              </kbd>
              <span className="font-typewriter">cerrar</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
