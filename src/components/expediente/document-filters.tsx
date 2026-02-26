"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import Fuse from "fuse.js";
import { ClassifiedBadge } from "@/components/shared/classified-badge";
import { Badge } from "@/components/ui/badge";
import { useVisitedDocuments } from "@/hooks/use-visited-documents";
import {
  FileText,
  PenTool,
  ScanLine,
  ChevronRight,
  Shield,
  Building2,
  Globe,
  Landmark,
  Archive,
  ImageOff,
  Search,
  X,
} from "lucide-react";
import type { Document, DocumentFormat, ClassificationLevel, SourceCategory } from "@/types";
import type { LucideIcon } from "lucide-react";

const INITIAL_VISIBLE = 6;

const formatIcons: Record<DocumentFormat, LucideIcon> = {
  typed: FileText,
  handwritten: PenTool,
  mixed: FileText,
  scan: ScanLine,
};

const formatLabels: Record<DocumentFormat, string> = {
  typed: "Mecanografiado",
  handwritten: "Manuscrito",
  mixed: "Mixto",
  scan: "Escaneo",
};

const classificationLabels: Record<ClassificationLevel, string> = {
  secreto: "Secreto",
  confidencial: "Confidencial",
  reservado: "Reservado",
};

const categoryMeta: Record<
  SourceCategory,
  { label: string; icon: LucideIcon; description: string }
> = {
  "interior/guardia-civil": {
    label: "Interior — Guardia Civil",
    icon: Shield,
    description: "Escuchas telefonicas, documentos de planificacion y notas informativas",
  },
  "interior/policia": {
    label: "Interior — Policia",
    icon: Shield,
    description: "Situacion de las regiones policiales y notas de inteligencia",
  },
  "interior/archivo": {
    label: "Interior — Archivo",
    icon: Archive,
    description: "Informes de situacion, indices de subversion y acotaciones del juicio",
  },
  "defensa/cni": {
    label: "Defensa — CNI",
    icon: Building2,
    description: "Documentos de inteligencia, actas del juicio y correspondencia oficial",
  },
  "defensa/archivo-general": {
    label: "Defensa — Archivo General",
    icon: Landmark,
    description: "Causas judiciales, procesamientos y documentacion del Consejo Supremo",
  },
  exteriores: {
    label: "Asuntos Exteriores",
    icon: Globe,
    description: "Documentos diplomaticos y registros del Archivo General de la Administracion",
  },
};

const categoryOrder: SourceCategory[] = [
  "interior/guardia-civil",
  "interior/policia",
  "interior/archivo",
  "defensa/cni",
  "defensa/archivo-general",
  "exteriores",
];

function createDocFuse(docs: Document[]) {
  return new Fuse(docs, {
    keys: [
      { name: "title", weight: 0.35 },
      { name: "titleShort", weight: 0.25 },
      { name: "summary", weight: 0.25 },
      { name: "tags", weight: 0.15 },
    ],
    threshold: 0.35,
    includeScore: true,
  });
}

export function DocumentFilters({ documents }: { documents: Document[] }) {
  const [query, setQuery] = useState("");
  const [activeClassifications, setActiveClassifications] = useState<Set<ClassificationLevel>>(new Set());
  const [activeFormats, setActiveFormats] = useState<Set<DocumentFormat>>(new Set());
  const [onlyWithText, setOnlyWithText] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<SourceCategory>>(new Set());
  const { isVisited } = useVisitedDocuments();

  const fuse = useMemo(() => createDocFuse(documents), [documents]);

  const filtered = useMemo(() => {
    let result = documents;

    if (query.trim()) {
      const fuseResults = fuse.search(query.trim());
      result = fuseResults.map((r) => r.item);
    }

    if (activeClassifications.size > 0) {
      result = result.filter((d) => activeClassifications.has(d.classification));
    }

    if (activeFormats.size > 0) {
      result = result.filter((d) => activeFormats.has(d.format));
    }

    if (onlyWithText) {
      result = result.filter((d) => d.hasExtractedText);
    }

    return result;
  }, [documents, query, activeClassifications, activeFormats, onlyWithText, fuse]);

  const hasFilters = query.trim() !== "" || activeClassifications.size > 0 || activeFormats.size > 0 || onlyWithText;

  const grouped = useMemo(() => {
    const map = new Map<SourceCategory, Document[]>();
    for (const doc of filtered) {
      const cat = doc.sourceCategory as SourceCategory;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(doc);
    }
    return map;
  }, [filtered]);

  function toggleClassification(level: ClassificationLevel) {
    setActiveClassifications((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }

  function toggleFormat(format: DocumentFormat) {
    setActiveFormats((prev) => {
      const next = new Set(prev);
      if (next.has(format)) next.delete(format);
      else next.add(format);
      return next;
    });
  }

  function toggleExpanded(cat: SourceCategory) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function clearFilters() {
    setQuery("");
    setActiveClassifications(new Set());
    setActiveFormats(new Set());
    setOnlyWithText(false);
  }

  return (
    <>
      {/* Filter bar */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-typewriter text-[9px] uppercase tracking-wider text-muted-foreground/60">
            Clasificacion:
          </span>
          {(Object.keys(classificationLabels) as ClassificationLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => toggleClassification(level)}
              className={`rounded-sm border px-2 py-1 font-typewriter text-[9px] uppercase tracking-wider transition-colors ${
                activeClassifications.has(level)
                  ? "border-amber/50 bg-amber/10 text-amber"
                  : "border-border/50 text-muted-foreground hover:border-amber/30"
              }`}
            >
              {classificationLabels[level]}
            </button>
          ))}

          <span className="mx-1 text-border">|</span>

          <span className="font-typewriter text-[9px] uppercase tracking-wider text-muted-foreground/60">
            Formato:
          </span>
          {(Object.keys(formatLabels) as DocumentFormat[]).map((format) => (
            <button
              key={format}
              onClick={() => toggleFormat(format)}
              className={`rounded-sm border px-2 py-1 font-typewriter text-[9px] uppercase tracking-wider transition-colors ${
                activeFormats.has(format)
                  ? "border-amber/50 bg-amber/10 text-amber"
                  : "border-border/50 text-muted-foreground hover:border-amber/30"
              }`}
            >
              {formatLabels[format]}
            </button>
          ))}

          <span className="mx-1 text-border">|</span>

          <button
            onClick={() => setOnlyWithText(!onlyWithText)}
            className={`rounded-sm border px-2 py-1 font-typewriter text-[9px] uppercase tracking-wider transition-colors ${
              onlyWithText
                ? "border-green-800/50 bg-green-950/30 text-green-500"
                : "border-border/50 text-muted-foreground hover:border-amber/30"
            }`}
          >
            Con texto
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en documentos..."
            className="w-full rounded-sm border border-border/50 bg-card py-2 pl-9 pr-3 font-typewriter text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-amber/30 focus:outline-none"
          />
        </div>

        {hasFilters && (
          <div className="flex items-center gap-3">
            <span className="font-typewriter text-[10px] text-muted-foreground">
              Mostrando {filtered.length} de {documents.length}
            </span>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 font-typewriter text-[10px] text-amber/70 transition-colors hover:text-amber"
            >
              <X size={10} />
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Category nav */}
      <div className="mb-10 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {categoryOrder.map((cat) => {
          const meta = categoryMeta[cat];
          const count = grouped.get(cat)?.length ?? 0;
          if (hasFilters && count === 0) return null;
          return (
            <a
              key={cat}
              href={`#${cat.replace(/\//g, "-")}`}
              className="flex items-center gap-1.5 rounded-sm border border-border/50 bg-card px-2.5 py-2 font-typewriter text-[9px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-amber/30 hover:text-amber sm:gap-2 sm:px-3 sm:text-[10px]"
            >
              <meta.icon size={12} className="shrink-0" />
              <span className="truncate">{meta.label}</span>
              <span className="shrink-0 text-amber/70">({count})</span>
            </a>
          );
        })}
      </div>

      {/* Document groups */}
      <div className="space-y-12">
        {categoryOrder.map((cat) => {
          const docs = grouped.get(cat);
          if (!docs || docs.length === 0) return null;
          const meta = categoryMeta[cat];
          const CatIcon = meta.icon;
          const isExpanded = expandedCategories.has(cat);
          const visibleDocs = isExpanded ? docs : docs.slice(0, INITIAL_VISIBLE);
          const hasMore = docs.length > INITIAL_VISIBLE;

          return (
            <section key={cat} id={cat.replace(/\//g, "-")}>
              <div className="mb-6 space-y-2">
                <div className="flex items-center gap-3">
                  <CatIcon size={18} className="text-amber" />
                  <h2 className="font-typewriter text-sm font-bold uppercase tracking-[0.15em] text-foreground">
                    {meta.label}
                  </h2>
                  <Badge variant="outline" className="font-typewriter text-[9px] tracking-wider">
                    {docs.length} docs
                  </Badge>
                </div>
                <p className="pl-[30px] font-sans text-xs text-muted-foreground">
                  {meta.description}
                </p>
                <div className="h-px bg-gradient-to-r from-border/50 to-transparent" />
              </div>

              <div className="space-y-3">
                {visibleDocs.map((doc, i) => {
                  const FormatIcon = formatIcons[doc.format];
                  const visited = isVisited(doc.id);
                  return (
                    <Link
                      key={doc.id}
                      href={`/expediente/documentos/${doc.id}`}
                      className="document-card group relative flex items-start gap-4 rounded-sm border border-border/50 bg-card px-4 py-4 transition-all hover:border-amber/30 sm:px-5 animate-fade-in-up"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      {visited && (
                        <span className="absolute top-3 right-3 -rotate-12 rounded-sm border border-dashed border-stamp/30 px-1.5 py-0.5 font-typewriter text-[7px] uppercase tracking-wider text-stamp/40">
                          Revisado
                        </span>
                      )}

                      <div className="hidden shrink-0 sm:block">
                        {doc.thumbnailPath ? (
                          <div className="relative h-16 w-12 overflow-hidden rounded-[2px] border border-border/50 shadow-md">
                            <Image
                              src={doc.thumbnailPath}
                              alt={`Miniatura de ${doc.titleShort}`}
                              fill
                              sizes="48px"
                              className="object-cover sepia-[0.3] brightness-90"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber/5 to-transparent" />
                          </div>
                        ) : (
                          <div className="flex h-16 w-12 items-center justify-center rounded-[2px] border border-border/50 bg-accent">
                            <ImageOff size={14} className="text-muted-foreground/40" />
                          </div>
                        )}
                      </div>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-accent sm:hidden">
                        <FormatIcon size={16} className="text-amber" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="font-typewriter text-xs font-bold text-foreground">
                            {doc.titleShort}
                          </h3>
                          <ClassifiedBadge
                            level={doc.classification}
                            className="text-[7px] py-0.5 px-1.5"
                          />
                          {doc.hasExtractedText && (
                            <Badge
                              variant="outline"
                              className="font-typewriter text-[7px] uppercase tracking-wider border-green-800/50 text-green-500"
                            >
                              Texto disponible
                            </Badge>
                          )}
                        </div>
                        <p className="mb-2 font-sans text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                          {doc.summary}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-typewriter text-[9px] text-muted-foreground/70">
                            {formatLabels[doc.format]} · {doc.pageCount} pag.
                          </span>
                          {doc.dateDescription && (
                            <span className="font-typewriter text-[9px] text-muted-foreground/50">
                              · {doc.dateDescription}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight
                        size={14}
                        className="mt-1 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-amber"
                      />
                    </Link>
                  );
                })}
              </div>

              {hasMore && !isExpanded && (
                <button
                  onClick={() => toggleExpanded(cat)}
                  className="mt-4 w-full rounded-sm border border-dashed border-border/50 py-2.5 font-typewriter text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-amber/30 hover:text-amber"
                >
                  Ver los {docs.length - INITIAL_VISIBLE} restantes
                </button>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
