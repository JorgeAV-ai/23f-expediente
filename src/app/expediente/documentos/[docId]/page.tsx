import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { documents, getDocument, getPersonsByDocument, getAnnotationsByDocument } from "@/lib/data";
import { getExtractedText } from "@/lib/data-server";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ClassifiedBadge } from "@/components/shared/classified-badge";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  PenTool,
  User,
  Calendar,
  Hash,
  BookOpen,
  ExternalLink,
  Shield,
  Building2,
  Globe,
  Landmark,
  Archive,
  ImageOff,
  StickyNote,
} from "lucide-react";
import { DocumentViewerWrapper } from "@/components/document/document-viewer-wrapper";
import { AnnotationSection } from "@/components/document/annotation-section";
import type { SourceCategory } from "@/types";
import type { LucideIcon } from "lucide-react";

const categoryLabels: Record<SourceCategory, { label: string; icon: LucideIcon }> = {
  "interior/guardia-civil": { label: "Interior / Guardia Civil", icon: Shield },
  "interior/policia": { label: "Interior / Policia", icon: Shield },
  "interior/archivo": { label: "Interior / Archivo", icon: Archive },
  "defensa/cni": { label: "Defensa / CNI", icon: Building2 },
  "defensa/archivo-general": { label: "Defensa / Archivo General", icon: Landmark },
  exteriores: { label: "Asuntos Exteriores", icon: Globe },
};

export function generateStaticParams() {
  return documents.map((doc) => ({ docId: doc.id }));
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = await params;
  const doc = getDocument(docId);
  if (!doc) notFound();

  const relatedPersons = getPersonsByDocument(doc.id);
  const extractedText = getExtractedText(doc);
  const isOcrUnverified = !doc.hasExtractedText && extractedText !== null;
  const docAnnotations = getAnnotationsByDocument(doc.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "Expediente", href: "/expediente" },
        { label: "Documentos", href: "/expediente/documentos" },
        { label: doc.titleShort },
      ]} />

      {/* Document header */}
      <div className="document-card paper-texture relative mb-8 rounded-sm border border-border/50 bg-card p-5 sm:p-8">
        {/* Stamp */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ClassifiedBadge level={doc.classification} animated />
        </div>

        {/* Thumbnail + Title row */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Thumbnail */}
          <div className="hidden shrink-0 sm:block">
            {doc.thumbnailPath ? (
              <div className="relative h-[200px] w-[150px] overflow-hidden rounded-[2px] border border-border/50 shadow-lg">
                <Image
                  src={doc.thumbnailPath}
                  alt={`Miniatura de ${doc.titleShort}`}
                  fill
                  sizes="150px"
                  className="object-cover sepia-[0.25] brightness-90"
                  priority
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber/5 via-transparent to-black/20" />
                <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]" />
              </div>
            ) : (
              <div className="flex h-[200px] w-[150px] flex-col items-center justify-center gap-2 rounded-[2px] border border-border/50 bg-accent">
                <ImageOff size={24} className="text-muted-foreground/30" />
                <span className="font-typewriter text-[8px] uppercase tracking-wider text-muted-foreground/30">
                  Sin vista previa
                </span>
              </div>
            )}
          </div>

          {/* Title + metadata */}
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex items-center gap-3 pr-20 sm:pr-24">
              {doc.format === "handwritten" ? (
                <PenTool size={20} className="shrink-0 text-amber" />
              ) : (
                <FileText size={20} className="shrink-0 text-amber" />
              )}
              <h1 className="font-typewriter text-base font-bold leading-tight text-foreground sm:text-lg">
                {doc.title}
              </h1>
            </div>

            {/* Source category badge + annotation count */}
            {(() => {
              const catInfo = categoryLabels[doc.sourceCategory as SourceCategory];
              if (!catInfo) return null;
              const CatIcon = catInfo.icon;
              return (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="font-typewriter text-[9px] uppercase tracking-wider border-amber/30 text-amber/80"
                  >
                    <CatIcon size={10} className="mr-1" />
                    {catInfo.label}
                  </Badge>
                  {docAnnotations.length > 0 && (
                    <Badge
                      variant="outline"
                      className="font-typewriter text-[9px] uppercase tracking-wider border-amber/30 text-amber/80"
                    >
                      <StickyNote size={10} className="mr-1" />
                      {docAnnotations.length} {docAnnotations.length === 1 ? "anotacion" : "anotaciones"}
                    </Badge>
                  )}
                </div>
              );
            })()}

            {/* Metadata */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground sm:gap-4">
              {doc.dateDescription && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {doc.dateDescription}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Hash size={12} />
                {doc.pageCount} paginas
              </span>
              <Badge
                variant="outline"
                className="font-typewriter text-[9px] uppercase tracking-wider"
              >
                {doc.format === "typed" ? "Mecanografiado" : doc.format === "handwritten" ? "Manuscrito" : doc.format === "scan" ? "Escaneo" : "Mixto"}
              </Badge>
            </div>

            {/* PDF link */}
            <a
              href={doc.pdfPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-sm border border-amber/20 bg-amber/5 px-3 py-1.5 font-typewriter text-[10px] uppercase tracking-wider text-amber transition-colors hover:border-amber/40 hover:bg-amber/10"
            >
              <ExternalLink size={12} />
              Abrir PDF completo
            </a>
          </div>
        </div>

        <Separator className="my-6 bg-border/30" />

        {/* Summary */}
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 font-typewriter text-xs font-bold uppercase tracking-[0.15em] text-amber">
              Resumen
            </h2>
            <p className="font-sans text-sm leading-relaxed text-muted-foreground">
              {doc.summary}
            </p>
          </div>

          {/* Historical context */}
          <div className="rounded-sm border border-amber/20 bg-amber/5 p-4">
            <h2 className="mb-2 flex items-center gap-2 font-typewriter text-xs font-bold uppercase tracking-[0.15em] text-amber">
              <BookOpen size={12} />
              Contexto Historico
            </h2>
            <p className="font-sans text-sm leading-relaxed text-foreground/80">
              {doc.historicalContext}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {doc.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="font-typewriter text-[9px] uppercase tracking-wider"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Related persons */}
      {relatedPersons.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 font-typewriter text-xs font-bold uppercase tracking-[0.15em] text-amber">
            <User size={14} />
            Personas mencionadas ({relatedPersons.length})
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {relatedPersons.map((person) => (
              <Link
                key={person.id}
                href={`/expediente/personas/${person.id}`}
                className="group flex items-center gap-3 rounded-sm border border-border/30 bg-card/50 px-4 py-3 transition-all hover:border-amber/30 hover:bg-card"
              >
                {person.imagePath ? (
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-amber/20">
                    <Image
                      src={person.imagePath}
                      alt={person.displayName}
                      fill
                      sizes="32px"
                      className="object-cover sepia-[0.2] brightness-90"
                    />
                  </div>
                ) : (
                  <User size={14} className="text-muted-foreground" />
                )}
                <div>
                  <span className="font-typewriter text-xs text-foreground">
                    {person.displayName}
                  </span>
                  {person.rank && (
                    <span className="ml-2 font-sans text-[10px] text-muted-foreground">
                      {person.rank}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Annotations */}
      {docAnnotations.length > 0 && (
        <AnnotationSection annotations={docAnnotations} />
      )}

      {/* Document viewer */}
      <DocumentViewerWrapper
        pdfPath={doc.pdfPath}
        extractedText={extractedText}
        pageCount={doc.pageCount}
        annotationCount={docAnnotations.length}
        isOcrUnverified={isOcrUnverified}
      />
    </div>
  );
}
