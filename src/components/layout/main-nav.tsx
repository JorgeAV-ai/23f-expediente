"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, Clock, Crosshair, Info, Menu, X } from "lucide-react";
import { useState } from "react";
import { SearchTrigger } from "@/components/search/search-trigger";

const navItems = [
  { href: "/expediente", label: "Expediente", icon: FileText },
  { href: "/cronologia", label: "Cronología", icon: Clock },
  { href: "/sala-de-guerra", label: "Sala de Guerra", icon: Crosshair },
  { href: "/acerca", label: "Acerca", icon: Info },
];

export function MainNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-typewriter text-sm font-bold tracking-[0.15em] text-foreground transition-colors hover:text-amber"
        >
          <span className="text-stamp">■</span>
          EXPEDIENTE 23-F
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-sans text-xs uppercase tracking-[0.1em] transition-all",
                  isActive
                    ? "bg-accent text-amber"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            );
          })}
          <div className="ml-2 border-l border-border/50 pl-2">
            <SearchTrigger />
          </div>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <SearchTrigger />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-muted-foreground hover:text-foreground"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav overlay + menu */}
      {mobileOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 top-14 z-40 bg-background/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Menu panel */}
          <div className="relative z-50 border-t border-border/50 bg-background/95 backdrop-blur-md md:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 border-b border-border/20 px-6 py-3.5 font-sans text-sm uppercase tracking-[0.1em] transition-all",
                    isActive
                      ? "bg-accent text-amber"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </nav>
  );
}
