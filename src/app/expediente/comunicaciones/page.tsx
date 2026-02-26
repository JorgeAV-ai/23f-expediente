import Link from "next/link";
import Image from "next/image";
import { documents } from "@/lib/data";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ClassifiedBadge } from "@/components/shared/classified-badge";
import { Radio, ChevronRight, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const communications = documents.filter((d) => d.communicationId !== null);

export default function ComunicacionesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "Expediente", href: "/expediente" },
        { label: "Comunicaciones Interceptadas" },
      ]} />

      {/* Header */}
      <div className="mb-10 space-y-3">
        <h1 className="font-typewriter text-xl font-bold uppercase tracking-[0.15em] text-foreground">
          Comunicaciones Interceptadas
        </h1>
        <p className="font-sans text-sm text-muted-foreground">
          {communications.length} conversaciones telefónicas grabadas durante la
          noche del golpe.
        </p>
        <div className="h-px bg-gradient-to-r from-amber/30 via-border to-transparent" />
      </div>

      {/* Communication list */}
      <div className="space-y-4">
        {communications.map((doc) => (
          <Link
            key={doc.id}
            href={`/expediente/documentos/${doc.id}`}
            className="document-card group flex items-start gap-4 rounded-sm border border-border/50 bg-card p-4 transition-all hover:border-amber/30 sm:gap-6 sm:p-6"
          >
            {/* Thumbnail */}
            <div className="hidden shrink-0 sm:block">
              {doc.thumbnailPath ? (
                <div className="relative h-20 w-[60px] overflow-hidden rounded-[2px] border border-border/50 shadow-md">
                  <Image
                    src={doc.thumbnailPath}
                    alt={`Miniatura de ${doc.titleShort}`}
                    fill
                    sizes="60px"
                    className="object-cover sepia-[0.3] brightness-90"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber/5 to-transparent" />
                </div>
              ) : (
                <div className="flex h-20 w-[60px] items-center justify-center rounded-[2px] border border-border/50 bg-accent">
                  <ImageOff size={16} className="text-muted-foreground/40" />
                </div>
              )}
            </div>

            {/* Icon (mobile only) */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-accent sm:hidden">
              <Radio size={20} className="text-amber" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                <h2 className="font-typewriter text-xs font-bold text-foreground sm:text-sm">
                  {doc.titleShort}
                </h2>
                <ClassifiedBadge
                  level={doc.classification}
                  className="text-[7px] py-0.5 px-1.5"
                />
              </div>

              <p className="mb-3 font-sans text-xs leading-relaxed text-muted-foreground line-clamp-3 sm:line-clamp-none">
                {doc.summary}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="font-typewriter text-[9px] uppercase tracking-wider"
                >
                  Escucha telefonica
                </Badge>
                {doc.dateDescription && (
                  <span className="font-typewriter text-[9px] text-muted-foreground">
                    {doc.dateDescription}
                  </span>
                )}
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight
              size={16}
              className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-amber"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
