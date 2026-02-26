import Link from "next/link";
import Image from "next/image";
import { documents } from "@/lib/data";
import { ClassifiedBadge } from "@/components/shared/classified-badge";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import type { DocumentFormat, SourceCategory } from "@/types";
import type { LucideIcon } from "lucide-react";

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

const categoryMeta: Record<
  SourceCategory,
  { label: string; icon: LucideIcon; description: string }
> = {
  "interior/guardia-civil": {
    label: "Interior — Guardia Civil",
    icon: Shield,
    description: "Escuchas telefónicas, documentos de planificación y notas informativas",
  },
  "interior/policia": {
    label: "Interior — Policía",
    icon: Shield,
    description: "Situación de las regiones policiales y notas de inteligencia",
  },
  "interior/archivo": {
    label: "Interior — Archivo",
    icon: Archive,
    description: "Informes de situación, índices de subversión y acotaciones del juicio",
  },
  "defensa/cni": {
    label: "Defensa — CNI",
    icon: Building2,
    description: "Documentos de inteligencia, actas del juicio y correspondencia oficial",
  },
  "defensa/archivo-general": {
    label: "Defensa — Archivo General",
    icon: Landmark,
    description: "Causas judiciales, procesamientos y documentación del Consejo Supremo",
  },
  exteriores: {
    label: "Asuntos Exteriores",
    icon: Globe,
    description: "Documentos diplomáticos y registros del Archivo General de la Administración",
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

export default function DocumentosPage() {
  const grouped = new Map<SourceCategory, typeof documents>();
  for (const doc of documents) {
    const cat = doc.sourceCategory as SourceCategory;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(doc);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Breadcrumb */}
      <div className="mb-8 font-typewriter text-xs uppercase tracking-[0.15em] text-muted-foreground">
        <Link href="/expediente" className="hover:text-amber transition-colors">
          Expediente
        </Link>
        <span className="mx-2 text-border">›</span>
        <span className="text-foreground">Documentos</span>
      </div>

      {/* Header */}
      <div className="mb-10 space-y-3">
        <h1 className="font-typewriter text-xl font-bold uppercase tracking-[0.15em] text-foreground">
          Documentos Clasificados
        </h1>
        <p className="font-sans text-sm text-muted-foreground">
          {documents.length} documentos desclasificados de los archivos del
          Estado, organizados por ministerio de origen.
        </p>
        <div className="h-px bg-gradient-to-r from-amber/30 via-border to-transparent" />
      </div>

      {/* Category nav */}
      <div className="mb-10 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {categoryOrder.map((cat) => {
          const meta = categoryMeta[cat];
          const count = grouped.get(cat)?.length ?? 0;
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

          return (
            <section key={cat} id={cat.replace(/\//g, "-")}>
              {/* Section header */}
              <div className="mb-6 space-y-2">
                <div className="flex items-center gap-3">
                  <CatIcon size={18} className="text-amber" />
                  <h2 className="font-typewriter text-sm font-bold uppercase tracking-[0.15em] text-foreground">
                    {meta.label}
                  </h2>
                  <Badge
                    variant="outline"
                    className="font-typewriter text-[9px] tracking-wider"
                  >
                    {docs.length} docs
                  </Badge>
                </div>
                <p className="pl-[30px] font-sans text-xs text-muted-foreground">
                  {meta.description}
                </p>
                <div className="h-px bg-gradient-to-r from-border/50 to-transparent" />
              </div>

              {/* Document list */}
              <div className="space-y-3">
                {docs.map((doc) => {
                  const FormatIcon = formatIcons[doc.format];
                  return (
                    <Link
                      key={doc.id}
                      href={`/expediente/documentos/${doc.id}`}
                      className="document-card group flex items-start gap-4 rounded-sm border border-border/50 bg-card px-4 py-4 transition-all hover:border-amber/30 sm:px-5"
                    >
                      {/* Thumbnail */}
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

                      {/* Icon (visible on mobile, hidden on larger screens) */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-accent sm:hidden">
                        <FormatIcon size={16} className="text-amber" />
                      </div>

                      {/* Content */}
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

                      {/* Arrow */}
                      <ChevronRight
                        size={14}
                        className="mt-1 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-amber"
                      />
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
