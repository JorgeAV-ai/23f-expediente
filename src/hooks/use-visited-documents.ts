"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "expediente-23f-visited";

function getSnapshot(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

let cached: Set<string> | null = null;

function subscribe(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cached = null;
      callback();
    }
  };
  window.addEventListener("storage", handler);

  const customHandler = () => {
    cached = null;
    callback();
  };
  window.addEventListener("visited-updated", customHandler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("visited-updated", customHandler);
  };
}

function getSnapshotCached(): Set<string> {
  if (!cached) cached = getSnapshot();
  return cached;
}

function getServerSnapshot(): Set<string> {
  return new Set();
}

export function useVisitedDocuments() {
  const visited = useSyncExternalStore(subscribe, getSnapshotCached, getServerSnapshot);

  const markVisited = useCallback((docId: string) => {
    const current = getSnapshot();
    if (current.has(docId)) return;
    current.add(docId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...current]));
    cached = null;
    window.dispatchEvent(new Event("visited-updated"));
  }, []);

  const isVisited = useCallback(
    (docId: string) => visited.has(docId),
    [visited]
  );

  return { isVisited, markVisited, visitedCount: visited.size };
}
