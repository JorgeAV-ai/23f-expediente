"use client";

import { useVisitedDocuments } from "@/hooks/use-visited-documents";

export function VisitedCount({ total }: { total: number }) {
  const { visitedCount } = useVisitedDocuments();
  if (visitedCount === 0) return null;
  return (
    <span className="font-typewriter text-[10px] text-amber/40">
      {" "}&middot; {visitedCount}/{total} revisados
    </span>
  );
}
