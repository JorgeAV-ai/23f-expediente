import { persons } from "@/lib/data";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PersonFilters } from "@/components/expediente/person-filters";

export default function PersonasPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Breadcrumb
        items={[
          { label: "Expediente", href: "/expediente" },
          { label: "Personas de Interes" },
        ]}
      />

      {/* Header */}
      <div className="mb-10 space-y-3">
        <h1 className="font-typewriter text-xl font-bold uppercase tracking-[0.15em] text-foreground">
          Personas de Interes
        </h1>
        <p className="font-sans text-sm text-muted-foreground">
          {persons.length} personas identificadas en los documentos desclasificados.
        </p>
        <div className="h-px bg-gradient-to-r from-amber/30 via-border to-transparent" />
      </div>

      <PersonFilters persons={persons} />
    </div>
  );
}
