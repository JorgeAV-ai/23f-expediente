import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  persons,
  getPerson,
  getDocumentsByPerson,
  getPersonRoleColor,
  getPersonRoleBgColor,
  getPersonRoleLabel,
} from "@/lib/data";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, FileText, Link2, MapPin } from "lucide-react";

export function generateStaticParams() {
  return persons.map((p) => ({ personId: p.id }));
}

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  const { personId } = await params;
  const person = getPerson(personId);
  if (!person) notFound();

  const relatedDocs = getDocumentsByPerson(person.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "Expediente", href: "/expediente" },
        { label: "Personas", href: "/expediente/personas" },
        { label: person.displayName },
      ]} />

      {/* Header card */}
      <div className="document-card paper-texture mb-8 rounded-sm border border-border/50 bg-card p-8">
        <div className="flex items-start gap-6">
          {/* Avatar / Photo */}
          {person.imagePath ? (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-sm border-2 border-amber/20 shadow-lg sm:h-28 sm:w-28">
              <Image
                src={person.imagePath}
                alt={person.fullName}
                fill
                sizes="112px"
                className="object-cover sepia-[0.2] brightness-90"
                priority
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
              <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_15px_rgba(0,0,0,0.4)]" />
            </div>
          ) : (
            <div
              className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-sm border-2 sm:h-28 sm:w-28 ${getPersonRoleBgColor(person.role)}`}
            >
              <User size={36} className={getPersonRoleColor(person.role)} />
            </div>
          )}

          <div className="min-w-0 space-y-3">
            <div>
              <h1 className="font-typewriter text-xl font-bold text-foreground">
                {person.fullName}
              </h1>
              {person.rank && (
                <p className="font-typewriter text-xs uppercase tracking-wider text-muted-foreground">
                  {person.rank} · {person.unit || "—"}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={`font-typewriter text-[9px] uppercase tracking-wider ${getPersonRoleBgColor(person.role)}`}
              >
                {getPersonRoleLabel(person.role)}
              </Badge>
              {person.aliases.length > 0 && (
                <Badge
                  variant="outline"
                  className="font-typewriter text-[9px] tracking-wider"
                >
                  alias: {person.aliases.join(", ")}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-6 bg-border/30" />

        {/* Bio */}
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 font-typewriter text-xs font-bold uppercase tracking-[0.15em] text-amber">
              Biografía
            </h2>
            <p className="font-sans text-sm leading-relaxed text-muted-foreground">
              {person.bio}
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-typewriter text-xs font-bold uppercase tracking-[0.15em] text-amber">
              Papel en el 23-F
            </h2>
            <p className="font-sans text-sm leading-relaxed text-foreground/80">
              {person.significance}
            </p>
          </div>
        </div>
      </div>

      {/* Related documents */}
      {relatedDocs.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 font-typewriter text-xs font-bold uppercase tracking-[0.15em] text-amber">
            <FileText size={14} />
            Aparece en {relatedDocs.length} documentos
          </h2>
          <div className="space-y-2">
            {relatedDocs.map((doc) => (
              <Link
                key={doc.id}
                href={`/expediente/documentos/${doc.id}`}
                className="group flex items-center gap-3 rounded-sm border border-border/30 bg-card/50 px-4 py-3 transition-all hover:border-amber/30 hover:bg-card"
              >
                <FileText size={14} className="text-muted-foreground" />
                <span className="font-typewriter text-xs text-foreground">
                  {doc.titleShort}
                </span>
                <span className="font-sans text-[10px] text-muted-foreground">
                  — {doc.dateDescription}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Connections */}
      {person.connections.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 font-typewriter text-xs font-bold uppercase tracking-[0.15em] text-amber">
            <Link2 size={14} />
            Conexiones ({person.connections.length})
          </h2>
          <div className="space-y-2">
            {person.connections.map((conn) => {
              const connPerson = getPerson(conn.personId);
              if (!connPerson) return null;
              return (
                <Link
                  key={conn.personId}
                  href={`/expediente/personas/${conn.personId}`}
                  className="group flex items-center gap-3 rounded-sm border border-border/30 bg-card/50 px-4 py-3 transition-all hover:border-amber/30 hover:bg-card"
                >
                  {connPerson.imagePath ? (
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-amber/20">
                      <Image
                        src={connPerson.imagePath}
                        alt={connPerson.displayName}
                        fill
                        sizes="32px"
                        className="object-cover sepia-[0.2] brightness-90"
                      />
                    </div>
                  ) : (
                    <User
                      size={14}
                      className={getPersonRoleColor(connPerson.role)}
                    />
                  )}
                  <span className="font-typewriter text-xs text-foreground">
                    {connPerson.displayName}
                  </span>
                  <Badge
                    variant="outline"
                    className="font-typewriter text-[8px] uppercase tracking-wider"
                  >
                    {conn.relationshipType.replace("-", " ")}
                  </Badge>
                  <span className="font-sans text-[10px] text-muted-foreground">
                    — {conn.description}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
