"use client";

import Link from "next/link";
import Image from "next/image";
import {
  persons,
  getPerson,
  getPersonRoleColor,
  getPersonRoleBgColor,
  getPersonRoleLabel,
  locations,
} from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, X, ChevronRight } from "lucide-react";

interface PersonSidebarProps {
  selectedLocationId: string | null;
  selectedPersonId: string | null;
  onSelectLocation: (id: string | null) => void;
  onSelectPerson: (id: string | null) => void;
  visibleRoles: Set<string>;
}

export function PersonSidebar({
  selectedLocationId,
  selectedPersonId,
  onSelectLocation,
  onSelectPerson,
  visibleRoles,
}: PersonSidebarProps) {
  const selLoc = selectedLocationId
    ? locations.find((l) => l.id === selectedLocationId)
    : null;
  const selPer = selectedPersonId ? getPerson(selectedPersonId) : null;

  const filteredPersons = persons.filter((p) => visibleRoles.has(p.role));

  const locationTypeColors: Record<string, string> = {
    government: "#3b82f6",
    military: "#22c55e",
    media: "#eab308",
    royal: "#a855f7",
    other: "#6b7280",
  };

  return (
    <div className="space-y-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
      {/* Location detail */}
      {selLoc && (
        <div className="document-card rounded-sm border border-border/50 bg-card p-4">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <MapPin
                size={14}
                style={{ color: locationTypeColors[selLoc.type] }}
              />
              <h3 className="font-typewriter text-xs font-bold text-foreground">
                {selLoc.name}
              </h3>
            </div>
            <button
              onClick={() => onSelectLocation(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          </div>

          <p className="mb-3 font-sans text-[11px] leading-relaxed text-muted-foreground">
            {selLoc.significance}
          </p>

          {selLoc.personsHere.length > 0 && (
            <div>
              <h4 className="mb-1.5 font-typewriter text-[9px] uppercase tracking-wider text-amber">
                Personas presentes ({selLoc.personsHere.length})
              </h4>
              <div className="space-y-0.5">
                {selLoc.personsHere.map((pid) => {
                  const p = getPerson(pid);
                  if (!p) return null;
                  return (
                    <button
                      key={pid}
                      onClick={() =>
                        onSelectPerson(selectedPersonId === pid ? null : pid)
                      }
                      className={`flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left transition-colors ${
                        selectedPersonId === pid
                          ? "bg-accent text-amber"
                          : "hover:bg-accent"
                      }`}
                    >
                      {p.imagePath ? (
                        <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full border border-amber/20">
                          <Image
                            src={p.imagePath}
                            alt={p.displayName}
                            fill
                            sizes="20px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <User
                          size={10}
                          className={getPersonRoleColor(p.role)}
                        />
                      )}
                      <span className="font-typewriter text-[10px]">
                        {p.displayName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected person detail */}
      {selPer && (
        <div className="document-card rounded-sm border border-border/50 bg-card p-4">
          <div className="mb-3 flex items-start gap-3">
            {selPer.imagePath ? (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-amber/20 shadow-md">
                <Image
                  src={selPer.imagePath}
                  alt={selPer.displayName}
                  fill
                  sizes="48px"
                  className="object-cover sepia-[0.2] brightness-90"
                />
              </div>
            ) : (
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border ${getPersonRoleBgColor(selPer.role)}`}
              >
                <User size={18} className={getPersonRoleColor(selPer.role)} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <h3 className="font-typewriter text-xs font-bold text-foreground">
                  {selPer.fullName}
                </h3>
                <button
                  onClick={() => onSelectPerson(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={12} />
                </button>
              </div>
              <Badge
                variant="outline"
                className={`mt-1 text-[7px] font-typewriter uppercase tracking-wider ${getPersonRoleBgColor(selPer.role)}`}
              >
                {getPersonRoleLabel(selPer.role)}
              </Badge>
            </div>
          </div>

          <p className="mb-3 font-sans text-[11px] leading-relaxed text-muted-foreground">
            {selPer.significance}
          </p>

          {selPer.connections.length > 0 && (
            <div className="mb-3 space-y-0.5">
              <h4 className="mb-1 font-typewriter text-[9px] uppercase tracking-wider text-amber">
                Conexiones ({selPer.connections.length})
              </h4>
              {selPer.connections.slice(0, 6).map((conn) => {
                const cp = getPerson(conn.personId);
                if (!cp) return null;
                return (
                  <button
                    key={conn.personId}
                    onClick={() => onSelectPerson(conn.personId)}
                    className="flex w-full items-center gap-1.5 text-left font-typewriter text-[9px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span className="text-amber">&#8594;</span>
                    <span className={getPersonRoleColor(cp.role)}>
                      {cp.displayName}
                    </span>
                    <span className="truncate text-border">
                      · {conn.description}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <Link
            href={`/expediente/personas/${selPer.id}`}
            className="inline-flex items-center gap-1 font-typewriter text-[10px] text-amber transition-colors hover:text-amber/80"
          >
            Ver dossier completo <ChevronRight size={10} />
          </Link>
        </div>
      )}

      {/* Compact person list */}
      <div>
        <h3 className="mb-2 font-typewriter text-[10px] font-bold uppercase tracking-[0.15em] text-amber">
          Personas ({filteredPersons.length})
        </h3>
        <div className="space-y-1">
          {filteredPersons.map((person) => (
            <button
              key={person.id}
              onClick={() =>
                onSelectPerson(
                  selectedPersonId === person.id ? null : person.id
                )
              }
              className={`flex w-full items-center gap-2 rounded-sm border px-3 py-1.5 text-left transition-all ${
                selectedPersonId === person.id
                  ? "border-amber/30 bg-accent"
                  : "border-border/20 bg-card/30 hover:border-border/40 hover:bg-card/60"
              }`}
            >
              {person.imagePath ? (
                <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-amber/20">
                  <Image
                    src={person.imagePath}
                    alt={person.displayName}
                    fill
                    sizes="24px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <User
                  size={12}
                  className={getPersonRoleColor(person.role)}
                />
              )}
              <div className="min-w-0 flex-1">
                <span className="font-typewriter text-[10px] text-foreground">
                  {person.displayName}
                </span>
              </div>
              <span className="font-typewriter text-[8px] text-muted-foreground/50">
                {person.connections.length}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
