"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import type {
  TimelineEvent,
  Person,
  Location,
  EventCategory,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Swords,
  Shield,
  Truck,
  Tv,
  Phone,
  PhoneCall,
  UserX,
  Crown,
  Flag,
  MapPin,
  FileText,
  Radio,
  AlertTriangle,
  Send,
  MessageSquare,
  Video,
  Megaphone,
  Building2,
  ChevronDown,
  Filter,
  X,
  ChevronsUpDown,
} from "lucide-react";

// ═══════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════

const TIMELINE_START = new Date("1981-02-23T17:00:00").getTime();
const TIMELINE_END = new Date("1981-02-24T12:00:00").getTime();
const TIMELINE_DURATION = TIMELINE_END - TIMELINE_START;

interface Phase {
  id: string;
  name: string;
  numeral: string;
  start: string;
  end: string;
  description: string;
}

const PHASES: Phase[] = [
  {
    id: "calm",
    name: "La calma",
    numeral: "I",
    start: "1981-02-23T17:00:00",
    end: "1981-02-23T18:23:00",
    description:
      "La sesión de investidura de Leopoldo Calvo-Sotelo transcurre con normalidad en el Congreso. Nadie sospecha lo que está a punto de ocurrir.",
  },
  {
    id: "chaos",
    name: "Caos inicial",
    numeral: "II",
    start: "1981-02-23T18:23:00",
    end: "1981-02-23T20:00:00",
    description:
      "Tejero irrumpe en el hemiciclo. La noticia se propaga como pólvora. Desde Zarzuela y el CESID se activan los primeros mecanismos de respuesta.",
  },
  {
    id: "long-night",
    name: "La larga noche",
    numeral: "III",
    start: "1981-02-23T20:00:00",
    end: "1981-02-24T01:14:00",
    description:
      "Horas de tensión, llamadas cruzadas y maniobras políticas. Milans saca los tanques en Valencia mientras el Rey trabaja para desactivar el golpe desde la Zarzuela.",
  },
  {
    id: "outcome",
    name: "El desenlace",
    numeral: "IV",
    start: "1981-02-24T01:14:00",
    end: "1981-02-24T06:00:00",
    description:
      "El mensaje del Rey llega a toda España. Los capitanes generales confirman su lealtad a la Corona y la Constitución. Milans del Bosch cede y anula su bando.",
  },
  {
    id: "surrender",
    name: "La rendición",
    numeral: "V",
    start: "1981-02-24T06:00:00",
    end: "1981-02-24T12:01:00",
    description:
      "Las últimas horas de resistencia. Tejero, abandonado y sin apoyos, se rinde al mediodía. Los diputados quedan libres tras 18 horas de cautiverio.",
  },
];

const KEY_MOMENTS = [
  { time: "1981-02-23T18:23:00", label: "Asalto", eventId: "evt-congress-assault" },
  { time: "1981-02-23T19:45:00", label: "Tanques", eventId: "evt-valencia-tanks" },
  { time: "1981-02-24T01:14:00", label: "Mensaje", eventId: "evt-king-speech" },
  { time: "1981-02-24T12:00:00", label: "Rendición", eventId: "evt-surrender" },
];

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Swords, Shield, Truck, Tv, Phone, PhoneCall, UserX, Crown, Flag,
  Radio, AlertTriangle, Send, MessageSquare, Video, Megaphone, Building2,
};

const categoryColors: Record<string, string> = {
  "military-action": "border-red-800 bg-red-950/30 text-red-400",
  "political-event": "border-blue-800 bg-blue-950/30 text-blue-400",
  communication: "border-green-800 bg-green-950/30 text-green-400",
  media: "border-yellow-800 bg-yellow-950/30 text-yellow-400",
  "royal-intervention": "border-purple-800 bg-purple-950/30 text-purple-400",
  resolution: "border-teal-800 bg-teal-950/30 text-teal-400",
};

const categoryBarColors: Record<string, string> = {
  "military-action": "bg-red-700/60",
  "political-event": "bg-blue-700/60",
  communication: "bg-green-700/60",
  media: "bg-yellow-700/60",
  "royal-intervention": "bg-purple-700/60",
  resolution: "bg-teal-700/60",
};

const categoryLabels: Record<string, string> = {
  "military-action": "Acción Militar",
  "political-event": "Evento Político",
  communication: "Comunicación",
  media: "Medios",
  "royal-intervention": "Intervención Real",
  resolution: "Resolución",
};

const ROLE_COLORS: Record<string, string> = {
  "military-conspirator": "text-red-500",
  "military-loyal": "text-blue-500",
  "civilian-conspirator": "text-orange-500",
  "civilian-involved": "text-yellow-500",
  "political-figure": "text-gray-400",
  "family-member": "text-green-500",
  monarch: "text-yellow-400",
};

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

function formatTime(datetime: string): string {
  const d = new Date(datetime);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function getPhaseForEvent(datetime: string): Phase | undefined {
  const t = new Date(datetime).getTime();
  return PHASES.find((p) => {
    const start = new Date(p.start).getTime();
    const end = new Date(p.end).getTime();
    return t >= start && t < end;
  });
}

function getTimeProgress(datetime: string): number {
  const t = new Date(datetime).getTime();
  const progress = ((t - TIMELINE_START) / TIMELINE_DURATION) * 100;
  return Math.max(0, Math.min(100, progress));
}

function formatDuration(start: string, end: string): string {
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

// ═══════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════

interface TimelineClientProps {
  events: TimelineEvent[];
  persons: Person[];
  locations: Location[];
}

// ═══════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════

export function TimelineClient({ events, persons, locations }: TimelineClientProps) {
  // ─── State ───
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeCategories, setActiveCategories] = useState<Set<EventCategory>>(
    new Set([
      "military-action",
      "political-event",
      "communication",
      "media",
      "royal-intervention",
      "resolution",
    ])
  );
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [enteredIds, setEnteredIds] = useState<Set<string>>(new Set());

  // ─── Refs ───
  const eventRefs = useRef<Map<string, HTMLElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ─── Derived data ───
  const locationMap = useMemo(
    () => new Map(locations.map((l) => [l.id, l])),
    [locations]
  );
  const personMap = useMemo(
    () => new Map(persons.map((p) => [p.id, p])),
    [persons]
  );

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (!activeCategories.has(e.category)) return false;
      if (selectedPerson && !e.personsInvolved.includes(selectedPerson)) return false;
      return true;
    });
  }, [events, activeCategories, selectedPerson]);

  const eventsByPhase = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const phase of PHASES) {
      map.set(phase.id, []);
    }
    for (const event of filteredEvents) {
      const phase = getPhaseForEvent(event.datetime);
      if (phase) {
        map.get(phase.id)!.push(event);
      }
    }
    return map;
  }, [filteredEvents]);

  // Derive current time from the earliest visible event
  const currentTime = useMemo(() => {
    if (visibleIds.size === 0) return filteredEvents[0]?.datetime || PHASES[0].start;
    // Find earliest visible event by datetime order (filteredEvents is sorted)
    const first = filteredEvents.find((e) => visibleIds.has(e.id));
    return first?.datetime || PHASES[0].start;
  }, [visibleIds, filteredEvents]);

  const progressPercent = getTimeProgress(currentTime);

  const currentPhaseId = useMemo(() => {
    const t = new Date(currentTime).getTime();
    const phase = PHASES.find((p) => {
      return t >= new Date(p.start).getTime() && t < new Date(p.end).getTime();
    });
    return phase?.id || null;
  }, [currentTime]);

  const involvedPersons = useMemo(() => {
    const ids = new Set<string>();
    events.forEach((e) => e.personsInvolved.forEach((pid) => ids.add(pid)));
    return Array.from(ids)
      .map((id) => personMap.get(id))
      .filter((p): p is Person => p !== undefined)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [events, personMap]);

  // Max duration for scaling duration bars
  const maxDurationMs = useMemo(() => {
    let max = 0;
    for (const e of events) {
      if (e.endDatetime) {
        const d = new Date(e.endDatetime).getTime() - new Date(e.datetime).getTime();
        if (d > max) max = d;
      }
    }
    return max || 1;
  }, [events]);

  // ─── Reset animation state on filter change ───
  useEffect(() => {
    setEnteredIds(new Set());
  }, [activeCategories, selectedPerson]);

  // ─── IntersectionObserver for scroll animation + progress tracking ───
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Update visible set (add entering, remove exiting)
        setVisibleIds((prev) => {
          const next = new Set(prev);
          entries.forEach((entry) => {
            const id = entry.target.getAttribute("data-event-id");
            if (!id) return;
            if (entry.isIntersecting) {
              next.add(id);
            } else {
              next.delete(id);
            }
          });
          return next;
        });

        // Track entered events (for animation — only adds, never removes)
        const newlyEntered: string[] = [];
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-event-id");
            if (id) newlyEntered.push(id);
          }
        });
        if (newlyEntered.length > 0) {
          setEnteredIds((prev) => {
            const next = new Set(prev);
            newlyEntered.forEach((id) => next.add(id));
            return next;
          });
        }
      },
      { threshold: 0.15, rootMargin: "-80px 0px -30% 0px" }
    );

    // Observe after a frame to ensure DOM is updated
    const frame = requestAnimationFrame(() => {
      eventRefs.current.forEach((el) => {
        observerRef.current?.observe(el);
      });
    });

    return () => {
      cancelAnimationFrame(frame);
      observerRef.current?.disconnect();
    };
  }, [filteredEvents]);

  // ─── Handlers ───
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleCategory = useCallback((cat: EventCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size > 1) next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }, []);

  const jumpTo = useCallback(
    (eventId: string) => {
      const el = eventRefs.current.get(eventId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setExpandedIds((prev) => new Set(prev).add(eventId));
      }
    },
    []
  );

  const toggleAll = useCallback(() => {
    setExpandedIds((prev) => {
      if (prev.size > 0) return new Set();
      return new Set(filteredEvents.map((e) => e.id));
    });
  }, [filteredEvents]);

  // ─── Render ───
  let phaseEventIndex = 0;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-12">
      {/* ═══ Header ═══ */}
      <div className="mb-4 space-y-3">
        <h1 className="font-typewriter text-2xl font-bold uppercase tracking-[0.15em] text-foreground">
          Cronología
        </h1>
        <p className="font-sans text-sm text-muted-foreground">
          Los eventos hora a hora de la noche del 23 de febrero de 1981.
        </p>
        <div className="h-px bg-gradient-to-r from-amber/30 via-border to-transparent" />
      </div>

      {/* ═══ Sticky Progress Bar ═══ */}
      <div className="sticky top-14 z-20 -mx-4 mb-6 border-b border-border/50 bg-background/95 px-4 pb-3 pt-3 backdrop-blur-sm">
        {/* Time labels + current time */}
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-typewriter text-[9px] text-muted-foreground">17:00</span>
          <span className="font-typewriter text-[11px] font-bold text-amber">
            {formatTime(currentTime)}
          </span>
          <span className="font-typewriter text-[9px] text-muted-foreground">12:00</span>
        </div>

        {/* Progress track */}
        <div className="relative h-1.5 rounded-full bg-border/60">
          {/* Filled portion */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-amber/30 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Phase region tints */}
          {PHASES.map((phase) => {
            const left = getTimeProgress(phase.start);
            const right = getTimeProgress(phase.end);
            return (
              <div
                key={phase.id}
                className={`absolute top-0 h-full transition-opacity duration-300 ${
                  currentPhaseId === phase.id ? "opacity-20" : "opacity-0"
                }`}
                style={{
                  left: `${left}%`,
                  width: `${right - left}%`,
                  background: "var(--amber)",
                }}
              />
            );
          })}

          {/* Key moment tick marks */}
          {KEY_MOMENTS.map((m) => (
            <button
              key={m.eventId}
              onClick={() => jumpTo(m.eventId)}
              className="absolute top-1/2 z-10 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-muted-foreground/40 transition-colors hover:bg-amber"
              style={{ left: `${getTimeProgress(m.time)}%` }}
              title={`${m.label} — ${formatTime(m.time)}`}
            />
          ))}

          {/* Current position dot */}
          <div
            className="absolute top-1/2 z-20 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-background bg-amber shadow-[0_0_8px_rgba(212,168,83,0.4)] transition-all duration-500 ease-out"
            style={{ left: `${progressPercent}%`, marginLeft: "-6px" }}
          />
        </div>

        {/* Key moment labels */}
        <div className="relative mt-1.5 h-3">
          {KEY_MOMENTS.map((m) => (
            <button
              key={m.eventId}
              onClick={() => jumpTo(m.eventId)}
              className="absolute -translate-x-1/2 font-typewriter text-[7px] uppercase tracking-wider text-muted-foreground/60 transition-colors hover:text-amber"
              style={{ left: `${getTimeProgress(m.time)}%` }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Filter Bar ═══ */}
      <div className="mb-8 space-y-3">
        {/* Category toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 flex items-center gap-1 self-center font-typewriter text-[9px] uppercase tracking-wider text-muted-foreground">
            <Filter size={10} />
            Filtrar
          </span>
          {(Object.entries(categoryLabels) as [EventCategory, string][]).map(
            ([cat, label]) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`rounded-sm border px-2 py-0.5 font-typewriter text-[9px] uppercase tracking-wider transition-all ${
                  activeCategories.has(cat)
                    ? categoryColors[cat]
                    : "border-border/50 bg-transparent text-muted-foreground/30"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>

        {/* Person filter + expand/collapse + count */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-typewriter text-[9px] uppercase tracking-wider text-muted-foreground">
              Persona:
            </span>
            <select
              value={selectedPerson || ""}
              onChange={(e) => setSelectedPerson(e.target.value || null)}
              className="rounded-sm border border-border bg-card px-2 py-1 font-typewriter text-[10px] text-foreground outline-none focus:border-amber/50"
            >
              <option value="">Todas</option>
              {involvedPersons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
            </select>
            {selectedPerson && (
              <button
                onClick={() => setSelectedPerson(null)}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="h-3 w-px bg-border" />

          <button
            onClick={toggleAll}
            className="flex items-center gap-1 font-typewriter text-[9px] text-muted-foreground transition-colors hover:text-amber"
          >
            <ChevronsUpDown size={10} />
            {expandedIds.size > 0 ? "Colapsar todo" : "Expandir todo"}
          </button>

          <span className="ml-auto font-typewriter text-[9px] text-muted-foreground/60">
            {filteredEvents.length} de {events.length} eventos
          </span>
        </div>
      </div>

      {/* ═══ Timeline ═══ */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute bottom-0 left-[72px] top-0 w-px bg-gradient-to-b from-amber/40 via-border to-transparent" />

        {PHASES.map((phase) => {
          const phaseEvents = eventsByPhase.get(phase.id) || [];

          // Don't render empty phases
          if (phaseEvents.length === 0 && filteredEvents.length > 0) return null;
          if (filteredEvents.length === 0) return null;

          return (
            <div key={phase.id}>
              {/* ─── Phase Header ─── */}
              <div
                className={`mb-6 mt-14 first:mt-0 transition-opacity duration-500 ${
                  currentPhaseId === phase.id ? "opacity-100" : "opacity-70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-amber/20" />
                  <span className="font-typewriter text-[10px] font-bold uppercase tracking-[0.3em] text-amber">
                    Acto {phase.numeral}
                  </span>
                  <div className="h-px flex-1 bg-amber/20" />
                </div>
                <h2 className="mt-2 text-center font-typewriter text-base font-bold uppercase tracking-[0.15em] text-foreground">
                  {phase.name}
                </h2>
                <p className="mt-1 text-center font-typewriter text-[10px] tracking-wider text-muted-foreground/60">
                  {formatTime(phase.start)} — {formatTime(phase.end)}
                </p>
                <p className="mx-auto mt-3 max-w-md text-center font-sans text-xs leading-relaxed text-muted-foreground">
                  {phase.description}
                </p>
              </div>

              {/* ─── Events ─── */}
              <div className="space-y-1">
                {phaseEvents.map((event) => {
                  const Icon = iconMap[event.icon] || Flag;
                  const location = locationMap.get(event.locationId);
                  const expanded = expandedIds.has(event.id);
                  const entered = enteredIds.has(event.id);
                  const localIndex = phaseEventIndex++;

                  // Duration bar calculation
                  const hasDuration = !!event.endDatetime;
                  let durationPercent = 0;
                  if (hasDuration && event.endDatetime) {
                    const dur =
                      new Date(event.endDatetime).getTime() -
                      new Date(event.datetime).getTime();
                    durationPercent = Math.max(8, (dur / maxDurationMs) * 100);
                  }

                  return (
                    <div
                      key={event.id}
                      ref={(el) => {
                        if (el) eventRefs.current.set(event.id, el);
                        else eventRefs.current.delete(event.id);
                      }}
                      data-event-id={event.id}
                      onClick={() => toggleExpand(event.id)}
                      className={`group relative flex cursor-pointer gap-6 rounded-sm py-3 pl-4 pr-4 transition-all duration-500 ease-out ${
                        entered
                          ? "translate-y-0 opacity-100"
                          : "translate-y-5 opacity-0"
                      } ${expanded ? "bg-card/60" : "hover:bg-card/30"}`}
                      style={{
                        transitionDelay: entered ? "0ms" : `${(localIndex % 6) * 80}ms`,
                      }}
                    >
                      {/* Time */}
                      <div className="w-12 shrink-0 pt-1 text-right">
                        <span className="font-typewriter text-sm font-bold text-amber">
                          {formatTime(event.datetime)}
                        </span>
                      </div>

                      {/* Dot on timeline */}
                      <div className="relative flex shrink-0 items-start pt-1.5">
                        <div
                          className={`z-10 flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-300 ${
                            categoryColors[event.category]
                          } ${expanded ? "scale-110 ring-1 ring-amber/30" : ""}`}
                        >
                          <Icon size={12} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        {/* Title row — always visible */}
                        <div className="flex items-start gap-2">
                          <h3 className="flex-1 font-typewriter text-sm font-bold text-foreground">
                            {event.title}
                          </h3>
                          <div className="flex shrink-0 items-center gap-2 pt-0.5">
                            {hasDuration && (
                              <span className="font-typewriter text-[9px] text-muted-foreground/60">
                                {formatDuration(event.datetime, event.endDatetime!)}
                              </span>
                            )}
                            <ChevronDown
                              size={14}
                              className={`text-muted-foreground/40 transition-transform duration-300 ${
                                expanded ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {/* Expandable detail section */}
                        <div
                          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="space-y-2.5 pt-2">
                              {/* Description */}
                              <p className="font-sans text-xs leading-relaxed text-muted-foreground">
                                {event.detailedDescription}
                              </p>

                              {/* Duration bar */}
                              {hasDuration && event.endDatetime && (
                                <div className="flex items-center gap-2">
                                  <span className="font-typewriter text-[8px] text-muted-foreground/60">
                                    {formatTime(event.datetime)}
                                  </span>
                                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-border/40">
                                    <div
                                      className={`h-full rounded-full transition-all duration-700 ${
                                        categoryBarColors[event.category] || "bg-amber/40"
                                      }`}
                                      style={{ width: `${durationPercent}%` }}
                                    />
                                  </div>
                                  <span className="font-typewriter text-[8px] text-muted-foreground/60">
                                    {formatTime(event.endDatetime)}
                                  </span>
                                </div>
                              )}

                              {/* Tags */}
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <Badge
                                  variant="outline"
                                  className={`font-typewriter text-[8px] uppercase tracking-wider ${
                                    categoryColors[event.category]
                                  }`}
                                >
                                  {categoryLabels[event.category]}
                                </Badge>

                                {location && (
                                  <span className="flex items-center gap-1 font-typewriter text-[9px] text-muted-foreground">
                                    <MapPin size={10} />
                                    {location.shortName}
                                  </span>
                                )}

                                {event.relatedDocumentIds.length > 0 && (
                                  <Link
                                    href={`/expediente/documentos/${event.relatedDocumentIds[0]}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1 font-typewriter text-[9px] text-amber/70 transition-colors hover:text-amber"
                                  >
                                    <FileText size={10} />
                                    Ver documento
                                  </Link>
                                )}
                              </div>

                              {/* Persons involved */}
                              {event.personsInvolved.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {event.personsInvolved.map((pid) => {
                                    const p = personMap.get(pid);
                                    if (!p) return null;
                                    return (
                                      <Link
                                        key={pid}
                                        href={`/expediente/personas/${pid}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className={`font-typewriter text-[9px] transition-colors hover:underline ${
                                          ROLE_COLORS[p.role] || "text-muted-foreground"
                                        }`}
                                      >
                                        {p.displayName}
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {filteredEvents.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-typewriter text-sm text-muted-foreground">
              Ningún evento coincide con los filtros seleccionados.
            </p>
            <button
              onClick={() => {
                setActiveCategories(
                  new Set([
                    "military-action",
                    "political-event",
                    "communication",
                    "media",
                    "royal-intervention",
                    "resolution",
                  ])
                );
                setSelectedPerson(null);
              }}
              className="mt-3 font-typewriter text-[10px] text-amber transition-colors hover:text-amber/80"
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
