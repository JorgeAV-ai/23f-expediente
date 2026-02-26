"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { events as rawEvents } from "@/lib/data";
import type { EventCategory, TimelineEvent } from "@/types";

// ═══════════════════════════════════════
// Props
// ═══════════════════════════════════════

interface TimeSliderProps {
  currentTime: string | null; // ISO datetime or null (show all)
  onTimeChange: (time: string | null) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

// ═══════════════════════════════════════
// Category colors
// ═══════════════════════════════════════

const categoryColors: Record<EventCategory, string> = {
  "military-action": "#ef4444",
  "political-event": "#3b82f6",
  communication: "#d4a853",
  media: "#eab308",
  "royal-intervention": "#a855f7",
  resolution: "#22c55e",
};

// ═══════════════════════════════════════
// Sorted events (ascending by datetime)
// ═══════════════════════════════════════

const sortedEvents: TimelineEvent[] = [...rawEvents].sort((a, b) =>
  a.datetime.localeCompare(b.datetime)
);

// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════

function formatDisplayTime(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const months = [
    "ENE",
    "FEB",
    "MAR",
    "ABR",
    "MAY",
    "JUN",
    "JUL",
    "AGO",
    "SEP",
    "OCT",
    "NOV",
    "DIC",
  ];
  const month = months[d.getMonth()];
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  return `${day} ${month} ${hours}:${mins}`;
}

function isoToMs(iso: string): number {
  return new Date(iso).getTime();
}

// ═══════════════════════════════════════
// Component
// ═══════════════════════════════════════

export function TimeSlider({
  currentTime,
  onTimeChange,
  isPlaying,
  onTogglePlay,
}: TimeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Precomputed boundaries
  const firstMs = useMemo(() => isoToMs(sortedEvents[0].datetime), []);
  const lastMs = useMemo(
    () => isoToMs(sortedEvents[sortedEvents.length - 1].datetime),
    []
  );
  const rangeMs = lastMs - firstMs;

  // Current position as a fraction [0..1]
  const fraction = useMemo(() => {
    if (currentTime === null) return 1;
    const ms = isoToMs(currentTime);
    if (rangeMs === 0) return 0;
    return Math.max(0, Math.min(1, (ms - firstMs) / rangeMs));
  }, [currentTime, firstMs, rangeMs]);

  // The event at or just before the current time
  const currentEvent = useMemo((): TimelineEvent | null => {
    if (currentTime === null) return sortedEvents[sortedEvents.length - 1];
    const ms = isoToMs(currentTime);
    let best: TimelineEvent | null = null;
    for (const evt of sortedEvents) {
      if (isoToMs(evt.datetime) <= ms) {
        best = evt;
      } else {
        break;
      }
    }
    return best;
  }, [currentTime]);

  // Current event index (for stepping)
  const currentEventIndex = useMemo((): number => {
    if (currentTime === null) return sortedEvents.length - 1;
    const ms = isoToMs(currentTime);
    let idx = -1;
    for (let i = 0; i < sortedEvents.length; i++) {
      if (isoToMs(sortedEvents[i].datetime) <= ms) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [currentTime]);

  // ─── Density heatmap: build a set of buckets ───
  const densityBars = useMemo(() => {
    const bucketCount = 80;
    const buckets = new Array(bucketCount).fill(0);
    for (const evt of sortedEvents) {
      const f = (isoToMs(evt.datetime) - firstMs) / rangeMs;
      const idx = Math.min(
        bucketCount - 1,
        Math.max(0, Math.floor(f * bucketCount))
      );
      buckets[idx]++;
    }
    const max = Math.max(...buckets, 1);
    return buckets.map((count) => count / max);
  }, [firstMs, rangeMs]);

  // ─── Convert pointer position to time ───
  const pointerToTime = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const x = clientX - rect.left;
      const f = Math.max(0, Math.min(1, x / rect.width));
      const ms = firstMs + f * rangeMs;
      // Snap to nearest event
      let closest = sortedEvents[0];
      let closestDist = Infinity;
      for (const evt of sortedEvents) {
        const dist = Math.abs(isoToMs(evt.datetime) - ms);
        if (dist < closestDist) {
          closestDist = dist;
          closest = evt;
        }
      }
      onTimeChange(closest.datetime);
    },
    [firstMs, rangeMs, onTimeChange]
  );

  // ─── Mouse/Touch handlers ───
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      pointerToTime(e.clientX);
    },
    [pointerToTime]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      pointerToTime(e.clientX);
    },
    [pointerToTime]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // ─── Step functions ───
  const stepForward = useCallback(() => {
    const nextIdx = Math.min(currentEventIndex + 1, sortedEvents.length - 1);
    onTimeChange(sortedEvents[nextIdx].datetime);
  }, [currentEventIndex, onTimeChange]);

  const stepBackward = useCallback(() => {
    const prevIdx = Math.max(currentEventIndex - 1, 0);
    onTimeChange(sortedEvents[prevIdx].datetime);
  }, [currentEventIndex, onTimeChange]);

  // ─── Auto-play: advance to next event on a timer ───
  useEffect(() => {
    if (!isPlaying) return;

    // If showing all (null), start from the beginning
    if (currentTime === null) {
      onTimeChange(sortedEvents[0].datetime);
      return;
    }

    const timer = setTimeout(() => {
      if (currentEventIndex < sortedEvents.length - 1) {
        onTimeChange(sortedEvents[currentEventIndex + 1].datetime);
      } else {
        // Reached the end, stop playing
        onTogglePlay();
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [isPlaying, currentTime, currentEventIndex, onTimeChange, onTogglePlay]);

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture when user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        onTogglePlay();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        stepForward();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        stepBackward();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTogglePlay, stepForward, stepBackward]);

  // ─── Hour labels along the track ───
  const hourLabels = useMemo(() => {
    const labels: { fraction: number; label: string }[] = [];
    // From first event hour to last event hour, every 2 hours
    const startDate = new Date(sortedEvents[0].datetime);
    const startHour = startDate.getHours();
    // Round down to nearest even hour
    const baseHour = startHour - (startHour % 2);
    const baseDate = new Date(startDate);
    baseDate.setHours(baseHour, 0, 0, 0);

    const endMs = lastMs + 3600000; // 1h past last event for buffer
    let cursor = baseDate.getTime();
    while (cursor <= endMs) {
      const f = (cursor - firstMs) / rangeMs;
      if (f >= -0.02 && f <= 1.02) {
        const d = new Date(cursor);
        const hr = d.getHours().toString().padStart(2, "0");
        const dayStr = d.getDate() === 23 ? "23" : "24";
        labels.push({
          fraction: Math.max(0, Math.min(1, f)),
          label: `${dayStr}/${hr}h`,
        });
      }
      cursor += 2 * 3600000; // 2 hour steps
    }
    return labels;
  }, [firstMs, lastMs, rangeMs]);

  return (
    <div className="bg-card border-t border-border/50 px-4 py-3 font-typewriter">
      {/* ═══ Top row: Time display + controls ═══ */}
      <div className="flex items-center gap-4 mb-2">
        {/* Play / Pause */}
        <button
          onClick={onTogglePlay}
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-amber/30 bg-amber/10 text-amber transition-all hover:bg-amber/20 hover:border-amber/50"
          title={isPlaying ? "Pausar (Espacio)" : "Reproducir (Espacio)"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </button>

        {/* Current time display */}
        <div className="flex items-baseline gap-3">
          <span className="text-xl tracking-widest text-amber font-bold tabular-nums">
            {currentTime === null
              ? "— TODO —"
              : formatDisplayTime(currentTime)}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            1981
          </span>
        </div>

        {/* Mostrar todo */}
        <button
          onClick={() => onTimeChange(null)}
          className={`ml-auto flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[10px] uppercase tracking-wider transition-all ${
            currentTime === null
              ? "border-amber/40 bg-amber/10 text-amber"
              : "border-border/30 bg-card text-muted-foreground hover:border-border hover:text-foreground"
          }`}
        >
          <RotateCcw className="h-3 w-3" />
          Mostrar todo
        </button>
      </div>

      {/* ═══ Density heatmap behind slider ═══ */}
      <div className="relative mb-1">
        <div className="flex h-4 items-end gap-px">
          {densityBars.map((intensity, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[1px] transition-all"
              style={{
                height: `${Math.max(2, intensity * 16)}px`,
                backgroundColor:
                  intensity > 0
                    ? `rgba(212, 168, 83, ${0.1 + intensity * 0.25})`
                    : "transparent",
              }}
            />
          ))}
        </div>
      </div>

      {/* ═══ Slider track ═══ */}
      <div
        ref={trackRef}
        className="relative h-6 cursor-pointer select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Track background */}
        <div className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-border/60" />

        {/* Filled portion */}
        {currentTime !== null && (
          <div
            className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 bg-amber/50"
            style={{ width: `${fraction * 100}%` }}
          />
        )}

        {/* Event tick marks */}
        {sortedEvents.map((evt) => {
          const f = (isoToMs(evt.datetime) - firstMs) / rangeMs;
          const color = categoryColors[evt.category];
          const isActive =
            currentTime !== null &&
            currentEvent?.id === evt.id;
          return (
            <div
              key={evt.id}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${f * 100}%` }}
              title={`${formatDisplayTime(evt.datetime)} — ${evt.title}`}
            >
              <div
                className="rounded-full transition-all"
                style={{
                  width: isActive ? 8 : 5,
                  height: isActive ? 8 : 5,
                  backgroundColor: color,
                  boxShadow: isActive ? `0 0 8px ${color}` : "none",
                  border: isActive ? `1px solid ${color}` : "none",
                }}
              />
            </div>
          );
        })}

        {/* Thumb / playhead — amber vertical bar */}
        {currentTime !== null && (
          <div
            className="absolute top-0 bottom-0 w-[3px] -translate-x-1/2 pointer-events-none"
            style={{ left: `${fraction * 100}%` }}
          >
            <div className="h-full w-full bg-amber rounded-full shadow-[0_0_8px_rgba(212,168,83,0.5)]" />
            {/* Top triangle */}
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: "4px solid transparent",
                borderRight: "4px solid transparent",
                borderTop: "5px solid #d4a853",
              }}
            />
            {/* Bottom triangle */}
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: "4px solid transparent",
                borderRight: "4px solid transparent",
                borderBottom: "5px solid #d4a853",
              }}
            />
          </div>
        )}
      </div>

      {/* ═══ Hour labels ═══ */}
      <div className="relative h-4 mt-0.5">
        {hourLabels.map((hl, i) => (
          <span
            key={i}
            className="absolute text-[8px] text-muted-foreground/60 -translate-x-1/2 tabular-nums"
            style={{ left: `${hl.fraction * 100}%` }}
          >
            {hl.label}
          </span>
        ))}
      </div>

      {/* ═══ Current event title ═══ */}
      <div className="mt-1 flex items-center gap-2 min-h-[20px]">
        {currentEvent && (
          <>
            <span
              className="inline-block h-2 w-2 rounded-full flex-shrink-0"
              style={{
                backgroundColor: categoryColors[currentEvent.category],
                boxShadow: `0 0 6px ${categoryColors[currentEvent.category]}`,
              }}
            />
            <span className="text-[11px] text-foreground/80 truncate">
              {currentEvent.title}
            </span>
            <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider flex-shrink-0">
              {currentEvent.category.replace("-", " ")}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
