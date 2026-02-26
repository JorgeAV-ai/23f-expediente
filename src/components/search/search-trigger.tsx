"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { SearchDialog } from "@/components/search/search-dialog";

export function SearchTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-sm border border-border/60 bg-secondary/50 px-3 py-1.5 text-muted-foreground transition-all hover:border-amber/40 hover:bg-accent/60 hover:text-foreground"
      >
        <Search size={14} />
        <span className="hidden font-sans text-xs sm:inline">Buscar</span>
        <kbd className="hidden rounded border border-border bg-secondary px-1.5 py-0.5 font-typewriter text-[10px] text-muted-foreground/60 sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
