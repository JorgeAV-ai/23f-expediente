"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./war-room-map.css";

// react-leaflet must be imported dynamically to avoid SSR issues
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import { locations, getLocation, events, getPerson } from "@/lib/data";

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════

interface WarRoomMapProps {
  selectedLocationId: string | null;
  selectedPersonId: string | null;
  onSelectLocation: (id: string | null) => void;
  currentTimeFilter: string | null; // ISO datetime string to filter events
  visibleLocationIds: Set<string> | null; // null = show all
}

// ═══════════════════════════════════════
// Constants
// ═══════════════════════════════════════

const LOCATION_TYPE_COLORS: Record<string, string> = {
  government: "#3b82f6",
  military: "#22c55e",
  media: "#eab308",
  royal: "#a855f7",
  other: "#6b7280",
};

const LOCATION_TYPE_LABELS: Record<string, string> = {
  government: "Gobierno",
  military: "Militar",
  media: "Medios",
  royal: "Corona",
  other: "Otro",
};

const MAP_CENTER: L.LatLngExpression = [40.0, -2.5];
const MAP_ZOOM = 6;

// Communication lines between connected locations
const COMMUNICATION_LINKS: {
  from: string;
  to: string;
  color: string;
  label: string;
}[] = [
  {
    from: "congress",
    to: "capitania-valencia",
    color: "#ef4444",
    label: "Congreso - Valencia",
  },
  {
    from: "congress",
    to: "zarzuela",
    color: "#a855f7",
    label: "Congreso - Zarzuela",
  },
  {
    from: "zarzuela",
    to: "tve-prado-del-rey",
    color: "#eab308",
    label: "Zarzuela - TVE",
  },
  {
    from: "zarzuela",
    to: "brunete-division",
    color: "#22c55e",
    label: "Zarzuela - Brunete",
  },
];

// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════

function createMarkerIcon(
  color: string,
  isSelected: boolean,
  isHighlighted: boolean,
  isDimmed: boolean
): L.DivIcon {
  const size = isSelected ? 16 : 12;
  const classes = [
    "war-room-marker",
    isSelected ? "war-room-marker-selected" : "",
    isHighlighted ? "war-room-marker-highlighted" : "",
    isDimmed ? "war-room-marker-dimmed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return L.divIcon({
    className: "", // Disable default leaflet icon class
    html: `<div class="${classes}" style="
      width: ${size}px;
      height: ${size}px;
      color: ${color};
      background: ${color};
      border-color: ${color};
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

/**
 * Get the set of location IDs where a given person was present
 */
function getPersonLocationIds(personId: string): Set<string> {
  const ids = new Set<string>();
  for (const loc of locations) {
    if (loc.personsHere.includes(personId)) {
      ids.add(loc.id);
    }
  }
  return ids;
}

// ═══════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════

/**
 * Auto-fit bounds when locations change visibility
 */
function MapBoundsController({
  visibleLocationIds,
}: {
  visibleLocationIds: Set<string> | null;
}) {
  const map = useMap();

  useEffect(() => {
    const locs =
      visibleLocationIds === null
        ? locations
        : locations.filter((l) => visibleLocationIds.has(l.id));

    if (locs.length === 0) return;

    if (locs.length === 1) {
      map.setView(
        [locs[0].coordinates.lat, locs[0].coordinates.lng],
        10,
        { animate: true }
      );
      return;
    }

    const bounds = L.latLngBounds(
      locs.map((l) => [l.coordinates.lat, l.coordinates.lng])
    );
    map.fitBounds(bounds.pad(0.4), { animate: true, maxZoom: 10 });
  }, [map, visibleLocationIds]);

  return null;
}

/**
 * SVG overlay for animated communication lines.
 * Uses a Leaflet pane + manual coordinate projection to render
 * SVG polylines that move with the map.
 */
function CommunicationLines({
  selectedLocationId,
}: {
  selectedLocationId: string | null;
}) {
  const resolvedLinks = useMemo(() => {
    return COMMUNICATION_LINKS.map((link) => {
      const fromLoc = getLocation(link.from);
      const toLoc = getLocation(link.to);
      if (!fromLoc || !toLoc) return null;
      return {
        ...link,
        positions: [
          [fromLoc.coordinates.lat, fromLoc.coordinates.lng] as L.LatLngTuple,
          [toLoc.coordinates.lat, toLoc.coordinates.lng] as L.LatLngTuple,
        ],
      };
    }).filter(Boolean) as {
      from: string;
      to: string;
      color: string;
      label: string;
      positions: L.LatLngTuple[];
    }[];
  }, []);

  return (
    <>
      {resolvedLinks.map((link) => {
        const isActive =
          selectedLocationId === null ||
          link.from === selectedLocationId ||
          link.to === selectedLocationId;

        return (
          <Polyline
            key={`${link.from}-${link.to}`}
            positions={link.positions}
            pathOptions={{
              color: link.color,
              weight: isActive ? 2 : 1,
              opacity: isActive ? 0.5 : 0.15,
              dashArray: "12, 8",
              dashOffset: "0",
              className: isActive
                ? "war-room-comm-line"
                : undefined,
            }}
          />
        );
      })}
      {/* Glow underlays for active lines */}
      {resolvedLinks
        .filter(
          (link) =>
            selectedLocationId === null ||
            link.from === selectedLocationId ||
            link.to === selectedLocationId
        )
        .map((link) => (
          <Polyline
            key={`${link.from}-${link.to}-glow`}
            positions={link.positions}
            pathOptions={{
              color: link.color,
              weight: 6,
              opacity: 0.08,
              lineCap: "round",
              className: "war-room-comm-line-glow",
            }}
            interactive={false}
          />
        ))}
    </>
  );
}

// ═══════════════════════════════════════
// Main Component
// ═══════════════════════════════════════

export default function WarRoomMap({
  selectedLocationId,
  selectedPersonId,
  onSelectLocation,
  currentTimeFilter,
  visibleLocationIds,
}: WarRoomMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which locations a selected person is at
  const personLocationIds = useMemo(() => {
    if (!selectedPersonId) return null;
    return getPersonLocationIds(selectedPersonId);
  }, [selectedPersonId]);

  // Filter events by time if a time filter is active
  const filteredEvents = useMemo(() => {
    if (!currentTimeFilter) return events;
    return events.filter((e) => e.datetime <= currentTimeFilter);
  }, [currentTimeFilter]);

  // Locations to render (respecting visibility filter)
  const visibleLocations = useMemo(() => {
    if (visibleLocationIds === null) return locations;
    return locations.filter((l) => visibleLocationIds.has(l.id));
  }, [visibleLocationIds]);

  // Count events per location within the time filter
  const eventCountByLocation = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const evt of filteredEvents) {
      counts[evt.locationId] = (counts[evt.locationId] || 0) + 1;
    }
    return counts;
  }, [filteredEvents]);

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center" style={{ minHeight: 400, background: "#050506" }}>
        <p className="font-typewriter text-[10px] text-muted-foreground/50">Cargando mapa...</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full" style={{ minHeight: 400 }}>
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        maxBounds={[
          [34, -12],
          [45, 6],
        ]}
        minZoom={5}
        maxZoom={14}
        zoomControl={true}
        attributionControl={true}
        className="war-room-map-container h-full w-full"
        style={{ minHeight: 400, background: "#050506" }}
        ref={mapRef}
      >
        {/* Dark tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />

        {/* Auto-fit bounds */}
        <MapBoundsController visibleLocationIds={visibleLocationIds} />

        {/* Communication lines */}
        <CommunicationLines selectedLocationId={selectedLocationId} />

        {/* Location markers */}
        {visibleLocations.map((loc) => {
          const color = LOCATION_TYPE_COLORS[loc.type] || "#6b7280";
          const isSelected = selectedLocationId === loc.id;
          const isHighlighted =
            personLocationIds !== null && personLocationIds.has(loc.id);
          const isDimmed =
            personLocationIds !== null && !personLocationIds.has(loc.id);

          const icon = createMarkerIcon(
            color,
            isSelected,
            isHighlighted,
            isDimmed
          );

          const personCount = loc.personsHere.length;
          const evtCount = eventCountByLocation[loc.id] || 0;

          // Build person list for popup
          const personNames = loc.personsHere
            .slice(0, 5)
            .map((pid) => {
              const p = getPerson(pid);
              return p ? p.displayName : pid;
            });
          const morePersons =
            loc.personsHere.length > 5
              ? loc.personsHere.length - 5
              : 0;

          return (
            <Marker
              key={loc.id}
              position={[loc.coordinates.lat, loc.coordinates.lng]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  onSelectLocation(
                    selectedLocationId === loc.id ? null : loc.id
                  );
                },
              }}
              zIndexOffset={isSelected ? 1000 : isHighlighted ? 500 : 0}
            >
              <Popup closeButton={true} autoPan={true} maxWidth={300}>
                <div className="war-room-popup">
                  {/* Header */}
                  <div className="war-room-popup-header">
                    <div
                      className="war-room-popup-dot"
                      style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                    />
                    <span className="war-room-popup-name font-typewriter">
                      {loc.shortName}
                    </span>
                  </div>

                  {/* Significance */}
                  <p className="war-room-popup-significance">
                    {loc.significance.length > 160
                      ? loc.significance.slice(0, 160) + "..."
                      : loc.significance}
                  </p>

                  {/* Person list */}
                  {personCount > 0 && (
                    <div className="war-room-popup-persons">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>
                        {personCount}{" "}
                        {personCount === 1 ? "persona" : "personas"}
                      </span>
                    </div>
                  )}

                  {/* Person names */}
                  {personNames.length > 0 && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 10,
                        color: "rgba(232, 228, 221, 0.5)",
                        fontFamily:
                          "'Courier Prime', 'Courier New', monospace",
                        lineHeight: 1.6,
                      }}
                    >
                      {personNames.map((name, i) => (
                        <div key={i} style={{ paddingLeft: 4 }}>
                          <span style={{ color: "#d4a853", marginRight: 4 }}>
                            &rsaquo;
                          </span>
                          {name}
                        </div>
                      ))}
                      {morePersons > 0 && (
                        <div
                          style={{
                            paddingLeft: 4,
                            color: "rgba(138, 133, 120, 0.5)",
                            fontStyle: "italic",
                          }}
                        >
                          +{morePersons} mas...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Event count */}
                  {evtCount > 0 && (
                    <div
                      style={{
                        marginTop: 8,
                        paddingTop: 6,
                        borderTop: "1px solid rgba(42, 37, 32, 0.6)",
                        fontSize: 9,
                        fontFamily:
                          "'Courier Prime', 'Courier New', monospace",
                        color: "rgba(138, 133, 120, 0.6)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {evtCount} {evtCount === 1 ? "evento" : "eventos"}{" "}
                      registrados
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* CRT vignette overlay */}
      <div className="war-room-vignette" />

      {/* Scanline overlay */}
      <div className="war-room-scanlines" />

      {/* Legend */}
      <div className="war-room-legend">
        <div
          style={{
            marginBottom: 6,
            fontSize: 8,
            color: "rgba(212, 168, 83, 0.6)",
            letterSpacing: "0.15em",
            fontWeight: 700,
          }}
        >
          Ubicaciones
        </div>
        {Object.entries(LOCATION_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="war-room-legend-item">
            <div
              className="war-room-legend-dot"
              style={{ background: color, boxShadow: `0 0 4px ${color}` }}
            />
            <span>{LOCATION_TYPE_LABELS[type] || type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
