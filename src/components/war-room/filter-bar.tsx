"use client";

import type { PersonRole } from "@/types";

const roleFilters: { role: PersonRole; label: string; color: string }[] = [
  { role: "military-conspirator", label: "Mil. Conspirador", color: "#ef4444" },
  { role: "military-loyal", label: "Mil. Leal", color: "#3b82f6" },
  { role: "civilian-conspirator", label: "Civil Conspirador", color: "#f97316" },
  { role: "civilian-involved", label: "Civil Implicado", color: "#eab308" },
  { role: "political-figure", label: "Figura Política", color: "#9ca3af" },
  { role: "family-member", label: "Familiar", color: "#22c55e" },
  { role: "monarch", label: "Monarca", color: "#facc15" },
];

interface FilterBarProps {
  activeRoles: Set<string>;
  onToggleRole: (role: string) => void;
  onResetFilters: () => void;
}

export function FilterBar({
  activeRoles,
  onToggleRole,
  onResetFilters,
}: FilterBarProps) {
  const allActive = activeRoles.size === roleFilters.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        onClick={onResetFilters}
        className={`rounded-sm border px-2 py-1 font-typewriter text-[9px] uppercase tracking-wider transition-all ${
          allActive
            ? "border-amber/40 bg-amber/10 text-amber"
            : "border-border/30 bg-card/50 text-muted-foreground hover:border-border"
        }`}
      >
        Todos
      </button>

      {roleFilters.map(({ role, label, color }) => {
        const isActive = activeRoles.has(role);
        return (
          <button
            key={role}
            onClick={() => onToggleRole(role)}
            className={`flex items-center gap-1.5 rounded-sm border px-2 py-1 font-typewriter text-[9px] uppercase tracking-wider transition-all ${
              isActive
                ? "border-border bg-card text-foreground"
                : "border-border/20 bg-card/30 text-muted-foreground/40"
            }`}
          >
            <span
              className="inline-block h-2 w-2 rounded-full transition-opacity"
              style={{
                backgroundColor: color,
                boxShadow: isActive ? `0 0 6px ${color}` : "none",
                opacity: isActive ? 1 : 0.3,
              }}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}
