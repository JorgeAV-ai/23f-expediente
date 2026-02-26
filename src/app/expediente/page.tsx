import Link from "next/link";
import { FileText, Users, Radio, ChevronRight } from "lucide-react";
import { documents, persons } from "@/lib/data";
import { ClassifiedBadge } from "@/components/shared/classified-badge";
import { VisitedCount } from "@/components/expediente/visited-count";

const categories = [
  {
    href: "/expediente/documentos",
    icon: FileText,
    title: "Documentos Clasificados",
    description:
      "Documentos de 6 archivos del Estado: escuchas telefónicas, inteligencia del CNI, causas judiciales y documentación diplomática.",
    count: `${documents.length} documentos`,
    classification: "secreto" as const,
  },
  {
    href: "/expediente/personas",
    icon: Users,
    title: "Personas de Interés",
    description:
      "Perfiles de los conspirators, figuras militares, civiles implicados y la familia real.",
    count: `${persons.length} perfiles`,
    classification: "confidencial" as const,
  },
  {
    href: "/expediente/comunicaciones",
    icon: Radio,
    title: "Comunicaciones Interceptadas",
    description:
      "Conversaciones telefónicas grabadas durante la noche del golpe. Diálogos entre conspiradores y familiares.",
    count: "4 interceptaciones",
    classification: "secreto" as const,
  },
];

export default function ExpedientePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Header */}
      <div className="mb-12 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-stamp">■</span>
          <h1 className="font-typewriter text-2xl font-bold uppercase tracking-[0.15em] text-foreground">
            Expediente
          </h1>
        </div>
        <p className="max-w-2xl font-sans text-sm leading-relaxed text-muted-foreground">
          Archivo de documentos desclasificados relacionados con el intento de
          golpe de Estado del 23 de febrero de 1981. Selecciona una categoría
          para explorar el material.
        </p>
        <div className="h-px bg-gradient-to-r from-amber/30 via-border to-transparent" />
      </div>

      {/* Category grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {categories.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.href}
              href={cat.href}
              className="document-card paper-texture group relative flex flex-col rounded-sm border border-border/50 bg-card p-8 transition-all hover:border-amber/30 animate-fade-in-up"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {/* Classification stamp */}
              <div className="absolute top-4 right-4">
                <ClassifiedBadge level={cat.classification} className="text-[8px]" />
              </div>

              {/* Icon */}
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-sm bg-accent">
                <Icon size={22} className="text-amber" />
              </div>

              {/* Content */}
              <h2 className="mb-3 font-typewriter text-sm font-bold uppercase tracking-[0.1em] text-foreground">
                {cat.title}
              </h2>

              <p className="mb-6 flex-1 font-sans text-xs leading-relaxed text-muted-foreground">
                {cat.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border/30 pt-4">
                <span className="font-typewriter text-[10px] uppercase tracking-[0.15em] text-amber/60">
                  {cat.count}
                  {cat.href === "/expediente/documentos" && (
                    <VisitedCount total={documents.length} />
                  )}
                </span>
                <ChevronRight
                  size={14}
                  className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-amber"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
