"use client";

import { cn } from "@/lib/utils";
import type { ClassificationLevel } from "@/types";

const levelConfig: Record<
  ClassificationLevel,
  { label: string; className: string }
> = {
  secreto: {
    label: "SECRETO",
    className: "border-red-800 text-red-600 bg-red-950/30",
  },
  confidencial: {
    label: "CONFIDENCIAL",
    className: "border-amber-800 text-amber-500 bg-amber-950/20",
  },
  reservado: {
    label: "RESERVADO",
    className: "border-yellow-800 text-yellow-600 bg-yellow-950/20",
  },
};

export function ClassifiedBadge({
  level,
  className,
  animated = false,
}: {
  level: ClassificationLevel;
  className?: string;
  animated?: boolean;
}) {
  const config = levelConfig[level];

  return (
    <span
      className={cn(
        "inline-block border-2 px-3 py-1 font-typewriter text-xs font-bold uppercase tracking-[0.25em]",
        "rotate-[-2deg]",
        config.className,
        animated && "classified-stamp",
        className
      )}
    >
      {config.label}
    </span>
  );
}
