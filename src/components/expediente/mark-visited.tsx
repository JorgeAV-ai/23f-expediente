"use client";

import { useEffect } from "react";
import { useVisitedDocuments } from "@/hooks/use-visited-documents";

export function MarkVisited({ docId }: { docId: string }) {
  const { markVisited } = useVisitedDocuments();
  useEffect(() => {
    markVisited(docId);
  }, [docId, markVisited]);
  return null;
}
