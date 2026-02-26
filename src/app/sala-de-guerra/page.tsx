"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  locations,
  persons,
  getPerson,
  getPersonRoleColor,
  getPersonRoleBgColor,
  getPersonRoleLabel,
} from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Link2, X, Network } from "lucide-react";

// Dynamically import ForceGraph so d3 code only runs client-side (SSG safe)
const ForceGraph = dynamic(() => import("@/components/graph/force-graph"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[450px] items-center justify-center rounded-sm border border-border/30 bg-card/50">
      <div className="text-center">
        <Network size={24} className="mx-auto mb-2 animate-pulse text-amber/40" />
        <p className="font-typewriter text-[10px] text-muted-foreground/50">
          Cargando red de conspiradores...
        </p>
      </div>
    </div>
  ),
});

// Simplified map projection: convert lat/lng to SVG x/y for Spain
// Approximate bounding box: lat 36-44, lng -10 to 4
function projectToSvg(lat: number, lng: number): { x: number; y: number } {
  const minLat = 35.5;
  const maxLat = 44;
  const minLng = -10;
  const maxLng = 5;
  const svgWidth = 800;
  const svgHeight = 600;

  const x = ((lng - minLng) / (maxLng - minLng)) * svgWidth;
  const y = svgHeight - ((lat - minLat) / (maxLat - minLat)) * svgHeight;
  return { x, y };
}

const locationTypeColors: Record<string, string> = {
  government: "#3b82f6",
  military: "#22c55e",
  media: "#eab308",
  royal: "#a855f7",
  other: "#6b7280",
};

export default function SalaDeGuerraPage() {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  const selLoc = selectedLocation
    ? locations.find((l) => l.id === selectedLocation)
    : null;
  const selPer = selectedPerson ? getPerson(selectedPerson) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-6 space-y-3 sm:mb-8">
        <h1 className="font-typewriter text-xl font-bold uppercase tracking-[0.15em] text-foreground sm:text-2xl">
          Sala de Guerra
        </h1>
        <p className="font-sans text-sm text-muted-foreground">
          Mapa de operaciones y red de conspiradores del 23-F.
        </p>
        <div className="h-px bg-gradient-to-r from-amber/30 via-border to-transparent" />
      </div>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1fr_380px]">
        {/* Main content area: Map + Force Graph stacked */}
        <div className="space-y-6">
          {/* SVG Map */}
          <div className="scanlines relative overflow-hidden rounded-sm border border-border/50 bg-card">
            <svg
              viewBox="0 0 800 600"
              className="h-auto w-full"
              style={{
                background:
                  "radial-gradient(ellipse at center, #1a1a18 0%, #0a0a0b 100%)",
              }}
            >
              {/* Spain outline (simplified) */}
              <path
                d="M180,180 L220,150 L320,130 L420,120 L500,110 L560,120 L620,140 L660,170 L680,200 L690,250 L680,300 L650,340 L620,370 L580,390 L540,400 L500,410 L460,420 L420,430 L380,420 L340,400 L300,380 L260,350 L230,320 L210,280 L190,240 Z"
                fill="none"
                stroke="rgba(212, 168, 83, 0.15)"
                strokeWidth="2"
                strokeDasharray="8,4"
              />

              {/* Grid lines */}
              {[150, 250, 350, 450].map((y) => (
                <line
                  key={`h-${y}`}
                  x1="100"
                  y1={y}
                  x2="700"
                  y2={y}
                  stroke="rgba(212, 168, 83, 0.05)"
                  strokeWidth="0.5"
                />
              ))}
              {[200, 350, 500, 650].map((x) => (
                <line
                  key={`v-${x}`}
                  x1={x}
                  y1="80"
                  x2={x}
                  y2="480"
                  stroke="rgba(212, 168, 83, 0.05)"
                  strokeWidth="0.5"
                />
              ))}

              {/* Connection lines between conspirator locations */}
              {(() => {
                const congress = locations.find((l) => l.id === "congress");
                const valencia = locations.find(
                  (l) => l.id === "capitania-valencia"
                );
                const zarzuela = locations.find((l) => l.id === "zarzuela");
                if (!congress || !valencia || !zarzuela) return null;

                const c = projectToSvg(
                  congress.coordinates.lat,
                  congress.coordinates.lng
                );
                const v = projectToSvg(
                  valencia.coordinates.lat,
                  valencia.coordinates.lng
                );
                const z = projectToSvg(
                  zarzuela.coordinates.lat,
                  zarzuela.coordinates.lng
                );

                return (
                  <>
                    <line
                      x1={c.x}
                      y1={c.y}
                      x2={v.x}
                      y2={v.y}
                      stroke="rgba(197, 48, 48, 0.3)"
                      strokeWidth="1"
                      strokeDasharray="6,3"
                    />
                    <line
                      x1={c.x}
                      y1={c.y}
                      x2={z.x}
                      y2={z.y}
                      stroke="rgba(168, 85, 247, 0.3)"
                      strokeWidth="1"
                      strokeDasharray="6,3"
                    />
                  </>
                );
              })()}

              {/* Location markers */}
              {locations.map((loc) => {
                const { x, y } = projectToSvg(
                  loc.coordinates.lat,
                  loc.coordinates.lng
                );
                const color = locationTypeColors[loc.type];
                const isSelected = selectedLocation === loc.id;

                return (
                  <g
                    key={loc.id}
                    onClick={() =>
                      setSelectedLocation(isSelected ? null : loc.id)
                    }
                    className="cursor-pointer"
                  >
                    {/* Pulse ring on selected */}
                    {isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r="20"
                        fill="none"
                        stroke={color}
                        strokeWidth="1"
                        opacity="0.3"
                      >
                        <animate
                          attributeName="r"
                          values="12;24;12"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.5;0.1;0.5"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Marker */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 8 : 6}
                      fill={color}
                      opacity={isSelected ? 1 : 0.7}
                      stroke={isSelected ? "white" : "none"}
                      strokeWidth="2"
                    />

                    {/* Label */}
                    <text
                      x={x}
                      y={y - 14}
                      textAnchor="middle"
                      className="font-typewriter"
                      fontSize="10"
                      fill="rgba(232, 228, 221, 0.7)"
                      fontFamily="'Courier Prime', monospace"
                    >
                      {loc.shortName}
                    </text>
                  </g>
                );
              })}

              {/* Legend */}
              <g transform="translate(580, 450)">
                {Object.entries(locationTypeColors).map(
                  ([type, color], i) => {
                    const labels: Record<string, string> = {
                      government: "Gobierno",
                      military: "Militar",
                      media: "Medios",
                      royal: "Corona",
                      other: "Otro",
                    };
                    return (
                      <g key={type} transform={`translate(0, ${i * 18})`}>
                        <circle
                          cx="6"
                          cy="6"
                          r="4"
                          fill={color}
                          opacity="0.7"
                        />
                        <text
                          x="16"
                          y="10"
                          fontSize="9"
                          fill="rgba(232, 228, 221, 0.5)"
                          fontFamily="'Courier Prime', monospace"
                        >
                          {labels[type]}
                        </text>
                      </g>
                    );
                  }
                )}
              </g>
            </svg>
          </div>

          {/* Force-directed network graph */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-typewriter text-xs font-bold uppercase tracking-[0.15em] text-amber">
              <Network size={14} />
              Red de Conspiradores
            </h3>
            <div className="scanlines relative overflow-hidden rounded-sm border border-border/50 bg-card" style={{ height: "450px" }}>
              <ForceGraph
                selectedPersonId={selectedPerson}
                onSelectPerson={setSelectedPerson}
              />
            </div>
            <p className="mt-2 font-sans text-[10px] text-muted-foreground/50">
              Arrastra los nodos para reposicionar. Haz clic para seleccionar. Scroll para zoom. Arrastra el fondo para mover.
            </p>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          {/* Location detail */}
          {selLoc ? (
            <div className="document-card rounded-sm border border-border/50 bg-card p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <MapPin
                    size={16}
                    style={{ color: locationTypeColors[selLoc.type] }}
                  />
                  <h3 className="font-typewriter text-sm font-bold text-foreground">
                    {selLoc.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </div>

              <p className="mb-4 font-sans text-xs leading-relaxed text-muted-foreground">
                {selLoc.significance}
              </p>

              {selLoc.personsHere.length > 0 && (
                <div>
                  <h4 className="mb-2 font-typewriter text-[10px] uppercase tracking-wider text-amber">
                    Personas presentes
                  </h4>
                  <div className="space-y-1">
                    {selLoc.personsHere.map((pid) => {
                      const p = getPerson(pid);
                      if (!p) return null;
                      return (
                        <button
                          key={pid}
                          onClick={() =>
                            setSelectedPerson(
                              selectedPerson === pid ? null : pid
                            )
                          }
                          className={`flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left font-typewriter text-xs transition-colors ${
                            selectedPerson === pid
                              ? "bg-accent text-amber"
                              : "hover:bg-accent"
                          }`}
                        >
                          <User
                            size={12}
                            className={getPersonRoleColor(p.role)}
                          />
                          {p.displayName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-sm border border-dashed border-border/30 p-8 text-center">
              <MapPin
                size={24}
                className="mx-auto mb-2 text-muted-foreground/30"
              />
              <p className="font-typewriter text-xs text-muted-foreground/50">
                Selecciona una ubicacion en el mapa
              </p>
            </div>
          )}

          {/* Person list (compact, synced with graph selection) */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 font-typewriter text-xs font-bold uppercase tracking-[0.15em] text-amber">
              <Link2 size={14} />
              Conspiradores
            </h3>
            <div className="space-y-2">
              {persons.map((person) => (
                <button
                  key={person.id}
                  onClick={() =>
                    setSelectedPerson(
                      selectedPerson === person.id ? null : person.id
                    )
                  }
                  className={`flex w-full items-center gap-3 rounded-sm border px-4 py-2.5 text-left transition-all ${
                    selectedPerson === person.id
                      ? "border-amber/30 bg-accent"
                      : "border-border/30 bg-card/50 hover:border-border hover:bg-card"
                  }`}
                >
                  <User
                    size={14}
                    className={getPersonRoleColor(person.role)}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-typewriter text-xs text-foreground">
                      {person.displayName}
                    </span>
                    <span className="ml-2 font-sans text-[9px] text-muted-foreground">
                      {person.connections.length} conexiones
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[7px] font-typewriter uppercase tracking-wider ${getPersonRoleBgColor(
                      person.role
                    )}`}
                  >
                    {getPersonRoleLabel(person.role).split(" ")[0]}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Selected person detail */}
          {selPer && (
            <div className="document-card rounded-sm border border-border/50 bg-card p-6">
              <div className="mb-3 flex items-start justify-between">
                <h3 className="font-typewriter text-sm font-bold text-foreground">
                  {selPer.fullName}
                </h3>
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="mb-4 font-sans text-xs leading-relaxed text-muted-foreground">
                {selPer.significance}
              </p>
              {selPer.connections.length > 0 && (
                <div className="space-y-1">
                  {selPer.connections.map((conn) => {
                    const cp = getPerson(conn.personId);
                    if (!cp) return null;
                    return (
                      <button
                        key={conn.personId}
                        onClick={() => setSelectedPerson(conn.personId)}
                        className="flex w-full items-center gap-2 text-left font-typewriter text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <span className="text-amber">&#8594;</span>
                        <span className={getPersonRoleColor(cp.role)}>
                          {cp.displayName}
                        </span>
                        <span className="text-border">&#183;</span>
                        <span>{conn.description}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <Link
                href={`/expediente/personas/${selPer.id}`}
                className="mt-4 inline-block font-typewriter text-[10px] text-amber transition-colors hover:text-amber/80"
              >
                Ver dossier completo &#8594;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
