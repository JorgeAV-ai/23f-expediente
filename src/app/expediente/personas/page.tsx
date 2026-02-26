import Link from "next/link";
import Image from "next/image";
import { persons, getPersonRoleColor, getPersonRoleBgColor, getPersonRoleLabel } from "@/lib/data";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { User, ChevronRight } from "lucide-react";

export default function PersonasPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "Expediente", href: "/expediente" },
        { label: "Personas de Interes" },
      ]} />

      {/* Header */}
      <div className="mb-10 space-y-3">
        <h1 className="font-typewriter text-xl font-bold uppercase tracking-[0.15em] text-foreground">
          Personas de Interés
        </h1>
        <p className="font-sans text-sm text-muted-foreground">
          {persons.length} personas identificadas en los documentos desclasificados.
        </p>
        <div className="h-px bg-gradient-to-r from-amber/30 via-border to-transparent" />
      </div>

      {/* Person grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {persons.map((person) => (
          <Link
            key={person.id}
            href={`/expediente/personas/${person.id}`}
            className="document-card group flex flex-col rounded-sm border border-border/50 bg-card p-6 transition-all hover:border-amber/30"
          >
            {/* Avatar + Name */}
            <div className="mb-4 flex items-start gap-4">
              {person.imagePath ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm border border-amber/20 shadow-md">
                  <Image
                    src={person.imagePath}
                    alt={person.fullName}
                    fill
                    sizes="56px"
                    className="object-cover sepia-[0.2] brightness-90"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                </div>
              ) : (
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border ${getPersonRoleBgColor(person.role)}`}
                >
                  <User size={20} className={getPersonRoleColor(person.role)} />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-typewriter text-sm font-bold text-foreground">
                  {person.displayName}
                </h2>
                <p className="font-sans text-xs text-muted-foreground">
                  {person.fullName}
                </p>
              </div>
            </div>

            {/* Role badge */}
            <Badge
              variant="outline"
              className={`mb-3 w-fit font-typewriter text-[8px] uppercase tracking-wider ${getPersonRoleBgColor(person.role)}`}
            >
              {getPersonRoleLabel(person.role)}
            </Badge>

            {/* Bio */}
            <p className="mb-4 flex-1 font-sans text-xs leading-relaxed text-muted-foreground line-clamp-3">
              {person.significance}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/30 pt-3">
              <span className="font-typewriter text-[9px] text-amber/60">
                {person.documentsAppearingIn.length} docs ·{" "}
                {person.connections.length} conexiones
              </span>
              <ChevronRight
                size={14}
                className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-amber"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
