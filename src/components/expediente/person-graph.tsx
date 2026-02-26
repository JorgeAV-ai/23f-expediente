// src/components/expediente/person-graph.tsx
"use client";

import { useRouter } from "next/navigation";
import { getPerson } from "@/lib/data";
import type { Person, RelationshipType } from "@/types";

const roleHexColors: Record<Person["role"], string> = {
  "military-conspirator": "#ef4444",
  "military-loyal": "#3b82f6",
  "civilian-conspirator": "#f97316",
  "civilian-involved": "#eab308",
  "political-figure": "#9ca3af",
  "family-member": "#22c55e",
  monarch: "#facc15",
};

const relationshipEdgeColor: Record<string, string> = {
  "co-conspirator": "#ef4444",
  subordinate: "#f97316",
  superior: "#f97316",
  spouse: "#22c55e",
  family: "#22c55e",
  "political-ally": "#9ca3af",
  "contacted-during-coup": "#3b82f6",
  intermediary: "#d4a853",
};

interface PersonGraphProps {
  person: Person;
}

export function PersonGraph({ person }: PersonGraphProps) {
  const router = useRouter();

  const connections = person.connections
    .map((conn) => {
      const p = getPerson(conn.personId);
      if (!p) return null;
      return { person: p, relationship: conn.relationshipType };
    })
    .filter(Boolean) as { person: Person; relationship: RelationshipType }[];

  if (connections.length === 0) return null;

  const WIDTH = 400;
  const HEIGHT = 300;
  const CX = WIDTH / 2;
  const CY = HEIGHT / 2;
  const RADIUS = Math.min(WIDTH, HEIGHT) / 2 - 50;
  const CENTER_R = 20;
  const NODE_R = 14;

  return (
    <div className="mb-6 flex justify-center">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full max-w-[400px]"
        style={{ height: "auto" }}
      >
        {/* Lines */}
        {connections.map((conn) => {
          const i = connections.indexOf(conn);
          const angle = (2 * Math.PI * i) / connections.length - Math.PI / 2;
          const x = CX + RADIUS * Math.cos(angle);
          const y = CY + RADIUS * Math.sin(angle);
          const color = relationshipEdgeColor[conn.relationship] || "#d4a853";
          return (
            <line
              key={`line-${conn.person.id}`}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              stroke={color}
              strokeWidth={1}
              strokeOpacity={0.4}
            />
          );
        })}

        {/* Outer nodes */}
        {connections.map((conn, i) => {
          const angle = (2 * Math.PI * i) / connections.length - Math.PI / 2;
          const x = CX + RADIUS * Math.cos(angle);
          const y = CY + RADIUS * Math.sin(angle);
          const color = roleHexColors[conn.person.role] || "#9ca3af";

          return (
            <g
              key={conn.person.id}
              className="cursor-pointer"
              onClick={() => router.push(`/expediente/personas/${conn.person.id}`)}
            >
              <circle
                cx={x}
                cy={y}
                r={NODE_R}
                fill={color}
                fillOpacity={0.15}
                stroke={color}
                strokeWidth={1.5}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={color}
                fontSize="8"
                fontFamily="'Courier Prime', monospace"
                fontWeight="bold"
              >
                {conn.person.displayName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </text>
              <text
                x={x}
                y={y + NODE_R + 12}
                textAnchor="middle"
                fill="#e8e4dd"
                fontSize="8"
                fontFamily="'Courier Prime', monospace"
                opacity={0.7}
              >
                {conn.person.displayName}
              </text>
            </g>
          );
        })}

        {/* Center node */}
        <circle
          cx={CX}
          cy={CY}
          r={CENTER_R}
          fill="#d4a853"
          fillOpacity={0.15}
          stroke="#d4a853"
          strokeWidth={2}
        />
        <text
          x={CX}
          y={CY}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#d4a853"
          fontSize="10"
          fontFamily="'Courier Prime', monospace"
          fontWeight="bold"
        >
          {person.displayName
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)}
        </text>
      </svg>
    </div>
  );
}
