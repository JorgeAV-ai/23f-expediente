"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import { drag } from "d3-drag";
import { zoom, zoomIdentity } from "d3-zoom";
import { select, type Selection } from "d3-selection";
import { persons, getPerson } from "@/lib/data";
import type { Person, RelationshipType } from "@/types";

// ═══════════════════════════════════════
// Types for the d3 simulation
// ═══════════════════════════════════════

interface GraphNode extends SimulationNodeDatum {
  id: string;
  person: Person;
  connectionCount: number;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  relationshipType: RelationshipType;
  description: string;
}

interface ForceGraphProps {
  selectedPersonId: string | null;
  onSelectPerson: (personId: string | null) => void;
}

// ═══════════════════════════════════════
// Color mappings (hex for SVG fills)
// ═══════════════════════════════════════

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

function getEdgeDashArray(type: RelationshipType): string {
  switch (type) {
    case "intermediary":
      return "8,4";
    case "family":
    case "spouse":
      return "2,3";
    case "co-conspirator":
    default:
      return "none";
  }
}

// ═══════════════════════════════════════
// Build graph data from persons
// ═══════════════════════════════════════

function buildGraphData(): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = persons.map((p) => ({
    id: p.id,
    person: p,
    connectionCount: p.connections.length,
  }));

  const linkSet = new Set<string>();
  const links: GraphLink[] = [];

  for (const person of persons) {
    for (const conn of person.connections) {
      // Create a canonical key to avoid duplicate edges
      const key = [person.id, conn.personId].sort().join("--");
      if (!linkSet.has(key)) {
        linkSet.add(key);
        // Only add the link if the target person exists
        if (getPerson(conn.personId)) {
          links.push({
            source: person.id,
            target: conn.personId,
            relationshipType: conn.relationshipType,
            description: conn.description,
          });
        }
      }
    }
  }

  return { nodes, links };
}

// ═══════════════════════════════════════
// Component
// ═══════════════════════════════════════

export default function ForceGraph({
  selectedPersonId,
  onSelectPerson,
}: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<Simulation<GraphNode, GraphLink> | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    name: string;
    role: string;
  } | null>(null);

  // Keep selectedPersonId in a ref so d3 callbacks always see latest value
  const selectedRef = useRef(selectedPersonId);
  selectedRef.current = selectedPersonId;

  // Stable callback ref
  const onSelectRef = useRef(onSelectPerson);
  onSelectRef.current = onSelectPerson;

  // ═══ Get connected person IDs for highlighting ═══
  const getConnectedIds = useCallback((personId: string): Set<string> => {
    const ids = new Set<string>();
    const person = getPerson(personId);
    if (person) {
      for (const conn of person.connections) {
        ids.add(conn.personId);
      }
    }
    // Also check reverse connections
    for (const p of persons) {
      for (const conn of p.connections) {
        if (conn.personId === personId) {
          ids.add(p.id);
        }
      }
    }
    return ids;
  }, []);

  // ═══ Update visual state when selection changes ═══
  const updateSelectionVisuals = useCallback(
    (svg: Selection<SVGSVGElement, unknown, null, undefined>) => {
      const currentSelected = selectedRef.current;
      const connectedIds = currentSelected
        ? getConnectedIds(currentSelected)
        : new Set<string>();

      // Update nodes
      svg.selectAll<SVGGElement, GraphNode>(".graph-node").each(function (d) {
        const g = select(this);
        const isSelected = d.id === currentSelected;
        const isConnected = currentSelected ? connectedIds.has(d.id) : false;
        const isFaded = currentSelected ? !isSelected && !isConnected : false;

        g.select(".node-circle")
          .attr("opacity", isFaded ? 0.15 : 1)
          .attr(
            "filter",
            isSelected ? "url(#glow-selected)" : "url(#glow-node)"
          );

        g.select(".node-label").attr("opacity", isFaded ? 0.1 : 0.8);

        // Show/hide selection ring
        g.select(".selection-ring")
          .attr("opacity", isSelected ? 1 : 0)
          .attr("r", isSelected ? (d.connectionCount + 3) * 2.5 + 4 : 0);
      });

      // Update links
      svg
        .selectAll<SVGLineElement, GraphLink>(".graph-link")
        .each(function (d) {
          const line = select(this);
          const sourceId =
            typeof d.source === "string" ? d.source : d.source.id;
          const targetId =
            typeof d.target === "string" ? d.target : d.target.id;
          const involves =
            sourceId === currentSelected || targetId === currentSelected;
          const isFaded = currentSelected ? !involves : false;

          line
            .attr("opacity", isFaded ? 0.05 : involves ? 0.7 : 0.3)
            .attr("stroke-width", involves ? 2 : 1);
        });
    },
    [getConnectedIds]
  );

  // ═══ Main d3 setup ═══
  useEffect(() => {
    const svgEl = svgRef.current;
    const containerEl = containerRef.current;
    if (!svgEl || !containerEl) return;

    const width = containerEl.clientWidth;
    const height = Math.max(400, containerEl.clientHeight);

    const svg = select(svgEl).attr("width", width).attr("height", height);

    // Clear any previous render
    svg.selectAll("*").remove();

    // ═══ Defs: filters and patterns ═══
    const defs = svg.append("defs");

    // Grid pattern for background
    const gridPattern = defs
      .append("pattern")
      .attr("id", "grid-pattern")
      .attr("width", 40)
      .attr("height", 40)
      .attr("patternUnits", "userSpaceOnUse");

    gridPattern
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 40)
      .attr("y2", 0)
      .attr("stroke", "rgba(212, 168, 83, 0.04)")
      .attr("stroke-width", 0.5);

    gridPattern
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 40)
      .attr("stroke", "rgba(212, 168, 83, 0.04)")
      .attr("stroke-width", 0.5);

    // Node glow filter
    const glowNode = defs
      .append("filter")
      .attr("id", "glow-node")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    glowNode
      .append("feGaussianBlur")
      .attr("stdDeviation", "2")
      .attr("result", "blur");

    const glowNodeMerge = glowNode.append("feMerge");
    glowNodeMerge.append("feMergeNode").attr("in", "blur");
    glowNodeMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Selected node glow filter (stronger)
    const glowSelected = defs
      .append("filter")
      .attr("id", "glow-selected")
      .attr("x", "-100%")
      .attr("y", "-100%")
      .attr("width", "300%")
      .attr("height", "300%");

    glowSelected
      .append("feGaussianBlur")
      .attr("stdDeviation", "5")
      .attr("result", "blur");

    const glowSelectedMerge = glowSelected.append("feMerge");
    glowSelectedMerge.append("feMergeNode").attr("in", "blur");
    glowSelectedMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Edge glow filter
    const glowEdge = defs
      .append("filter")
      .attr("id", "glow-edge")
      .attr("x", "-20%")
      .attr("y", "-20%")
      .attr("width", "140%")
      .attr("height", "140%");

    glowEdge
      .append("feGaussianBlur")
      .attr("stdDeviation", "1.5")
      .attr("result", "blur");

    const glowEdgeMerge = glowEdge.append("feMerge");
    glowEdgeMerge.append("feMergeNode").attr("in", "blur");
    glowEdgeMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // ═══ Background ═══
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#0a0a0b");

    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#grid-pattern)");

    // ═══ Main group for zoom/pan ═══
    const g = svg.append("g").attr("class", "graph-main");

    // ═══ Build data ═══
    const { nodes, links } = buildGraphData();

    // ═══ Simulation ═══
    const simulation = forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", forceManyBody().strength(-300))
      .force("center", forceCenter(width / 2, height / 2))
      .force(
        "collide",
        forceCollide<GraphNode>().radius((d) => (d.connectionCount + 3) * 2 + 10)
      );

    simulationRef.current = simulation;

    // ═══ Links ═══
    const linkGroup = g
      .append("g")
      .attr("class", "links")
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(links)
      .enter()
      .append("line")
      .attr("class", "graph-link")
      .attr("stroke", (d) => relationshipEdgeColor[d.relationshipType] || "#d4a853")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", (d) => getEdgeDashArray(d.relationshipType))
      .attr("opacity", 0.3)
      .attr("filter", "url(#glow-edge)");

    // ═══ Nodes ═══
    const nodeGroup = g
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "graph-node")
      .style("cursor", "pointer");

    // Selection ring (invisible by default)
    nodeGroup
      .append("circle")
      .attr("class", "selection-ring")
      .attr("r", 0)
      .attr("fill", "none")
      .attr("stroke", "#d4a853")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,2")
      .attr("opacity", 0);

    // Animated selection ring pulse
    nodeGroup
      .select(".selection-ring")
      .append("animate")
      .attr("attributeName", "stroke-dashoffset")
      .attr("from", "0")
      .attr("to", "12")
      .attr("dur", "1.5s")
      .attr("repeatCount", "indefinite");

    // Main circle
    nodeGroup.each(function (d, i) {
      const el = select(this);
      const targetR = (d.connectionCount + 3) * 2;
      const color = roleHexColors[d.person.role] || "#9ca3af";

      const circle = el
        .append("circle")
        .attr("class", "node-circle")
        .attr("r", targetR)
        .attr("fill", color)
        .attr("stroke", color)
        .attr("stroke-width", 0.5)
        .attr("stroke-opacity", 0.5)
        .attr("filter", "url(#glow-node)")
        .attr("opacity", 0);

      // Animate entry: fade in + scale via SMIL
      circle
        .append("animate")
        .attr("attributeName", "opacity")
        .attr("from", "0")
        .attr("to", "1")
        .attr("dur", "0.6s")
        .attr("begin", `${i * 0.1}s`)
        .attr("fill", "freeze");

      circle
        .append("animate")
        .attr("attributeName", "r")
        .attr("from", "0")
        .attr("to", String(targetR))
        .attr("dur", "0.5s")
        .attr("begin", `${i * 0.1}s`)
        .attr("fill", "freeze");

      // Set initial r to 0 for animation start
      circle.attr("r", 0);
    });

    // Labels
    nodeGroup.each(function (d, i) {
      const el = select(this);
      const labelOffset = (d.connectionCount + 3) * 2 + 14;

      const text = el
        .append("text")
        .attr("class", "node-label")
        .attr("text-anchor", "middle")
        .attr("dy", labelOffset)
        .attr("font-family", "'Courier Prime', 'Courier New', monospace")
        .attr("font-size", "9px")
        .attr("fill", "#e8e4dd")
        .attr("opacity", 0)
        .text(d.person.displayName);

      text
        .append("animate")
        .attr("attributeName", "opacity")
        .attr("from", "0")
        .attr("to", "0.8")
        .attr("dur", "0.5s")
        .attr("begin", `${i * 0.1 + 0.3}s`)
        .attr("fill", "freeze");
    });

    // ═══ Node interactions ═══

    // Click
    nodeGroup.on("click", function (event: MouseEvent, d: GraphNode) {
      event.stopPropagation();
      const newSelected = selectedRef.current === d.id ? null : d.id;
      onSelectRef.current(newSelected);
    });

    // Hover (tooltip)
    nodeGroup.on("mouseenter", function (event: MouseEvent, d: GraphNode) {
      const svgRect = svgEl.getBoundingClientRect();
      setTooltip({
        x: event.clientX - svgRect.left,
        y: event.clientY - svgRect.top - 40,
        name: d.person.displayName,
        role: getRoleLabel(d.person.role),
      });
    });

    nodeGroup.on("mouseleave", function () {
      setTooltip(null);
    });

    // Click on background to deselect
    svg.on("click", function () {
      onSelectRef.current(null);
    });

    // ═══ Drag behavior ═══
    const dragBehavior = drag<SVGGElement, GraphNode>()
      .on("start", function (event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", function (event, d) {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", function (event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeGroup.call(dragBehavior);

    // ═══ Zoom behavior ═══
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", function (event) {
        g.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);

    // Set initial zoom to fit nicely
    svg.call(zoomBehavior.transform, zoomIdentity.translate(0, 0).scale(1));

    // ═══ Tick ═══
    simulation.on("tick", () => {
      linkGroup
        .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
        .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
        .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
        .attr("y2", (d) => (d.target as GraphNode).y ?? 0);

      nodeGroup.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // Initial selection visuals
    updateSelectionVisuals(svg as Selection<SVGSVGElement, unknown, null, undefined>);

    // ═══ Cleanup ═══
    return () => {
      simulation.stop();
      svg.selectAll("*").remove();
      svg.on("click", null);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══ Update visuals when selection changes ═══
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = select(svgEl) as Selection<SVGSVGElement, unknown, null, undefined>;
    updateSelectionVisuals(svg);
  }, [selectedPersonId, updateSelectionVisuals]);

  return (
    <div ref={containerRef} className="relative h-full min-h-[400px] w-full">
      <svg
        ref={svgRef}
        className="h-full w-full"
        style={{ display: "block" }}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 rounded-sm border border-amber/30 bg-card/95 px-3 py-1.5 shadow-lg backdrop-blur-sm"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="font-typewriter text-[10px] font-bold text-foreground">
            {tooltip.name}
          </div>
          <div className="font-typewriter text-[8px] text-amber">
            {tooltip.role}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 rounded-sm border border-border/30 bg-card/80 p-3 backdrop-blur-sm">
        <div className="mb-2 font-typewriter text-[8px] uppercase tracking-widest text-amber/70">
          Roles
        </div>
        <div className="space-y-1">
          {Object.entries(roleHexColors).map(([role, color]) => (
            <div key={role} className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
              />
              <span className="font-typewriter text-[8px] text-foreground/60">
                {getRoleLabel(role as Person["role"])}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 border-t border-border/20 pt-2">
          <div className="mb-1 font-typewriter text-[8px] uppercase tracking-widest text-amber/70">
            Conexiones
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-block h-px w-4 bg-red-500" />
              <span className="font-typewriter text-[8px] text-foreground/60">
                Co-conspirador
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-px w-4"
                style={{
                  background:
                    "repeating-linear-gradient(to right, #d4a853, #d4a853 4px, transparent 4px, transparent 6px)",
                }}
              />
              <span className="font-typewriter text-[8px] text-foreground/60">
                Intermediario
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-px w-4"
                style={{
                  background:
                    "repeating-linear-gradient(to right, #22c55e, #22c55e 1px, transparent 1px, transparent 3px)",
                }}
              />
              <span className="font-typewriter text-[8px] text-foreground/60">
                Familia
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════

function getRoleLabel(role: Person["role"]): string {
  const labels: Record<Person["role"], string> = {
    "military-conspirator": "Militar Conspirador",
    "military-loyal": "Militar Leal",
    "civilian-conspirator": "Civil Conspirador",
    "civilian-involved": "Civil Implicado",
    "political-figure": "Figura Politica",
    "family-member": "Familiar",
    monarch: "Monarca",
  };
  return labels[role] || role;
}
