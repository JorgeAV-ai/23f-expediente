"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { User, ChevronRight } from "lucide-react";
import { getPersonRoleColor, getPersonRoleBgColor, getPersonRoleLabel } from "@/lib/data";
import type { Person, PersonRole } from "@/types";

const roleOrder: PersonRole[] = [
  "military-conspirator",
  "military-loyal",
  "civilian-conspirator",
  "civilian-involved",
  "political-figure",
  "family-member",
  "monarch",
];

export function PersonFilters({ persons }: { persons: Person[] }) {
  const [activeRole, setActiveRole] = useState<PersonRole | null>(null);

  const filtered = useMemo(() => {
    if (!activeRole) return persons;
    return persons.filter((p) => p.role === activeRole);
  }, [persons, activeRole]);

  return (
    <>
      {/* Role filter chips */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveRole(null)}
          className={`rounded-sm border px-2.5 py-1.5 font-typewriter text-[9px] uppercase tracking-wider transition-colors ${
            activeRole === null
              ? "border-amber/50 bg-amber/10 text-amber"
              : "border-border/50 text-muted-foreground hover:border-amber/30"
          }`}
        >
          Todos ({persons.length})
        </button>
        {roleOrder.map((role) => {
          const count = persons.filter((p) => p.role === role).length;
          if (count === 0) return null;
          const isActive = activeRole === role;
          return (
            <button
              key={role}
              onClick={() => setActiveRole(isActive ? null : role)}
              className={`rounded-sm border px-2.5 py-1.5 font-typewriter text-[9px] uppercase tracking-wider transition-colors ${
                isActive
                  ? getPersonRoleBgColor(role) + " " + getPersonRoleColor(role)
                  : "border-border/50 text-muted-foreground hover:border-amber/30"
              }`}
            >
              {getPersonRoleLabel(role)} ({count})
            </button>
          );
        })}
      </div>

      {/* Person grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((person, i) => (
          <Link
            key={person.id}
            href={`/expediente/personas/${person.id}`}
            className="document-card group flex flex-col rounded-sm border border-border/50 bg-card p-6 transition-all hover:border-amber/30 animate-fade-in-up"
            style={{ animationDelay: `${i * 60}ms` }}
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
    </>
  );
}
