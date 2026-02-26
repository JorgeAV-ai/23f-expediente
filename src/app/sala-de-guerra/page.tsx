"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import {
  locations,
  persons,
  getPerson,
  getSortedEvents,
} from "@/lib/data";
import { FilterBar } from "@/components/war-room/filter-bar";
import { PersonSidebar } from "@/components/war-room/person-sidebar";
import { Map, Network, Users, Clock, Maximize2, Minimize2 } from "lucide-react";
import type { PersonRole } from "@/types";

// Dynamic imports for client-only components
const WarRoomMap = dynamic(
  () => import("@/components/war-room/war-room-map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-sm border border-border/30 bg-card/50">
        <div className="text-center">
          <Map size={24} className="mx-auto mb-2 animate-pulse text-amber/40" />
          <p className="font-typewriter text-[10px] text-muted-foreground/50">
            Cargando mapa de operaciones...
          </p>
        </div>
      </div>
    ),
  }
);

const ForceGraph = dynamic(() => import("@/components/graph/force-graph"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[400px] items-center justify-center rounded-sm border border-border/30 bg-card/50">
      <div className="text-center">
        <Network size={24} className="mx-auto mb-2 animate-pulse text-amber/40" />
        <p className="font-typewriter text-[10px] text-muted-foreground/50">
          Cargando red de conspiradores...
        </p>
      </div>
    </div>
  ),
});

const TimeSlider = dynamic(
  () =>
    import("@/components/war-room/time-slider").then((m) => ({ default: m.TimeSlider })),
  {
    ssr: false,
    loading: () => (
      <div className="h-20 rounded-sm border border-border/30 bg-card/50" />
    ),
  }
);

// All roles for the filter
const ALL_ROLES: PersonRole[] = [
  "military-conspirator",
  "military-loyal",
  "civilian-conspirator",
  "civilian-involved",
  "political-figure",
  "family-member",
  "monarch",
];

type TabId = "map" | "network" | "info";

export default function SalaDeGuerraPage() {
  // === Shared state ===
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeRoles, setActiveRoles] = useState<Set<string>>(
    () => new Set(ALL_ROLES)
  );
  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // === Sorted events for time filtering ===
  const sortedEvents = useMemo(() => getSortedEvents(), []);

  // === Autoplay logic ===
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      return;
    }

    const eventTimes = sortedEvents.map((e) => e.datetime);
    let currentIndex = currentTime
      ? eventTimes.findIndex((t) => t > currentTime)
      : 0;
    if (currentIndex < 0) currentIndex = 0;

    playIntervalRef.current = setInterval(() => {
      if (currentIndex >= eventTimes.length) {
        setIsPlaying(false);
        return;
      }
      setCurrentTime(eventTimes[currentIndex]);
      currentIndex++;
    }, 2000);

    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, sortedEvents, currentTime]);

  // === Compute visible locations based on time filter ===
  const visibleLocationIds = useMemo(() => {
    if (!currentTime) return null; // show all
    const visible = new Set<string>();
    for (const evt of sortedEvents) {
      if (evt.datetime <= currentTime) {
        visible.add(evt.locationId);
      }
    }
    return visible;
  }, [currentTime, sortedEvents]);

  // === Compute highlighted persons from location ===
  const highlightedFromLocation = useMemo(() => {
    if (!selectedLocation) return null;
    const loc = locations.find((l) => l.id === selectedLocation);
    if (!loc) return null;
    return new Set(loc.personsHere);
  }, [selectedLocation]);

  // === Bidirectional sync: person → location ===
  const handleSelectPerson = useCallback(
    (personId: string | null) => {
      setSelectedPerson(personId);
      // If selecting a person, highlight their location
      if (personId) {
        const person = getPerson(personId);
        if (person) {
          const personLoc = locations.find((l) =>
            l.personsHere.includes(personId)
          );
          if (personLoc && personLoc.id !== selectedLocation) {
            setSelectedLocation(personLoc.id);
          }
        }
      }
    },
    [selectedLocation]
  );

  // === Filter handlers ===
  const handleToggleRole = useCallback((role: string) => {
    setActiveRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) {
        // Don't allow deselecting all
        if (next.size > 1) next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setActiveRoles(new Set(ALL_ROLES));
  }, []);

  // === Fullscreen toggle ===
  const toggleFullscreen = useCallback(() => {
    if (!mainRef.current) return;
    if (!document.fullscreenElement) {
      mainRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // === Mobile tab content ===
  const tabs: { id: TabId; label: string; icon: typeof Map }[] = [
    { id: "map", label: "Mapa", icon: Map },
    { id: "network", label: "Red", icon: Network },
    { id: "info", label: "Info", icon: Users },
  ];

  return (
    <div
      ref={mainRef}
      className={`mx-auto px-4 py-6 sm:py-8 ${isFullscreen ? "max-w-none bg-background" : "max-w-[1400px]"}`}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4 sm:mb-6">
        <div className="space-y-2">
          <h1 className="font-typewriter text-lg font-bold uppercase tracking-[0.15em] text-foreground sm:text-xl">
            Sala de Guerra
          </h1>
          <p className="hidden font-sans text-xs text-muted-foreground sm:block">
            Mapa de operaciones y red de conspiradores del 23-F. Usa el slider
            temporal para recorrer los eventos hora a hora.
          </p>
        </div>
        <button
          onClick={toggleFullscreen}
          className="shrink-0 rounded-sm border border-border/30 bg-card/50 p-2 text-muted-foreground transition-colors hover:border-amber/30 hover:text-amber"
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* Filter bar */}
      <div className="mb-4">
        <FilterBar
          activeRoles={activeRoles}
          onToggleRole={handleToggleRole}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* Mobile tabs */}
      <div className="mb-3 flex gap-1 sm:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-sm border py-2 font-typewriter text-[10px] uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? "border-amber/40 bg-amber/10 text-amber"
                  : "border-border/30 bg-card/50 text-muted-foreground"
              }`}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main layout */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: Map + Network stacked */}
        <div className="space-y-4">
          {/* Map */}
          <div
            className={`${activeTab !== "map" ? "hidden sm:block" : ""}`}
          >
            <div className="relative overflow-hidden rounded-sm border border-border/50 bg-card" style={{ height: isFullscreen ? "50vh" : "420px" }}>
              <WarRoomMap
                selectedLocationId={selectedLocation}
                selectedPersonId={selectedPerson}
                onSelectLocation={setSelectedLocation}
                currentTimeFilter={currentTime}
                visibleLocationIds={visibleLocationIds}
              />
              {/* Vignette overlay */}
              <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.6)]" />
            </div>
          </div>

          {/* Network graph */}
          <div
            className={`${activeTab !== "network" ? "hidden sm:block" : ""}`}
          >
            <h3 className="mb-2 hidden items-center gap-2 font-typewriter text-[10px] font-bold uppercase tracking-[0.15em] text-amber sm:flex">
              <Network size={12} />
              Red de Conspiradores
            </h3>
            <div
              className="relative overflow-hidden rounded-sm border border-border/50 bg-card"
              style={{ height: isFullscreen ? "45vh" : "420px" }}
            >
              <ForceGraph
                selectedPersonId={selectedPerson}
                onSelectPerson={handleSelectPerson}
                highlightedPersonIds={highlightedFromLocation}
                visibleRoles={activeRoles.size < ALL_ROLES.length ? activeRoles : null}
              />
            </div>
            <p className="mt-1.5 hidden font-sans text-[9px] text-muted-foreground/40 sm:block">
              Arrastra nodos para reposicionar. Clic para seleccionar. Scroll para zoom.
            </p>
          </div>
        </div>

        {/* Right sidebar (hidden on mobile unless info tab) */}
        <div
          className={`${activeTab !== "info" ? "hidden sm:block" : ""}`}
        >
          <PersonSidebar
            selectedLocationId={selectedLocation}
            selectedPersonId={selectedPerson}
            onSelectLocation={setSelectedLocation}
            onSelectPerson={handleSelectPerson}
            visibleRoles={activeRoles}
          />
        </div>
      </div>

      {/* Time slider (always visible) */}
      <div className="mt-4">
        <TimeSlider
          currentTime={currentTime}
          onTimeChange={setCurrentTime}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((p) => !p)}
        />
      </div>
    </div>
  );
}
