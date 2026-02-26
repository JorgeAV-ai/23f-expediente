"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StickyNote } from "lucide-react";

interface AnnotationBadgeProps {
  count: number;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AnnotationBadge({
  count,
  isActive = false,
  onClick,
  className,
}: AnnotationBadgeProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 transition-all duration-200",
        isActive
          ? "border-amber/50 bg-amber/15 text-amber"
          : "border-amber/20 bg-amber/5 text-amber/70 hover:border-amber/40 hover:bg-amber/10 hover:text-amber",
        className
      )}
    >
      <StickyNote
        size={12}
        className={cn(
          "transition-transform duration-200",
          isActive && "scale-110"
        )}
      />
      <span className="font-typewriter text-[10px] uppercase tracking-wider">
        {count} {count === 1 ? "anotacion" : "anotaciones"}
      </span>
      <Badge
        variant="outline"
        className={cn(
          "ml-0.5 h-4 min-w-4 justify-center rounded-full px-1 font-typewriter text-[9px]",
          isActive
            ? "border-amber/50 bg-amber/20 text-amber"
            : "border-amber/30 bg-amber/10 text-amber/70"
        )}
      >
        {count}
      </Badge>
    </button>
  );
}
