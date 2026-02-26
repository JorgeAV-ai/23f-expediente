import { documents } from "@/lib/data";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { DocumentFilters } from "@/components/expediente/document-filters";

export default function DocumentosPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Breadcrumb
        items={[
          { label: "Expediente", href: "/expediente" },
          { label: "Documentos" },
        ]}
      />

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

      <DocumentFilters documents={documents} />
    </div>
  );
}
