import documentsData from "@/data/documents.json";
import personsData from "@/data/persons.json";
import eventsData from "@/data/events.json";
import locationsData from "@/data/locations.json";
import annotationsData from "@/data/annotations.json";

import type {
  Document,
  Person,
  TimelineEvent,
  Location,
  Annotation,
} from "@/types";

export const documents: Document[] = documentsData as Document[];
export const persons: Person[] = personsData as Person[];
export const events: TimelineEvent[] = eventsData as TimelineEvent[];
export const locations: Location[] = locationsData as Location[];
export const annotations: Annotation[] = annotationsData as Annotation[];

export function getDocument(id: string): Document | undefined {
  return documents.find((d) => d.id === id);
}

export function getPerson(id: string): Person | undefined {
  return persons.find((p) => p.id === id);
}

export function getLocation(id: string): Location | undefined {
  return locations.find((l) => l.id === id);
}

export function getPersonsByDocument(docId: string): Person[] {
  return persons.filter((p) => p.documentsAppearingIn.includes(docId));
}

export function getDocumentsByPerson(personId: string): Document[] {
  return documents.filter((d) => d.personsReferenced.includes(personId));
}

export function getEventsByLocation(locationId: string): TimelineEvent[] {
  return events.filter((e) => e.locationId === locationId);
}

export function getSortedEvents(): TimelineEvent[] {
  return [...events].sort((a, b) => a.datetime.localeCompare(b.datetime));
}

export function getPersonRoleColor(role: Person["role"]): string {
  const colors: Record<Person["role"], string> = {
    "military-conspirator": "text-red-500",
    "military-loyal": "text-blue-500",
    "civilian-conspirator": "text-orange-500",
    "civilian-involved": "text-yellow-500",
    "political-figure": "text-gray-400",
    "family-member": "text-green-500",
    monarch: "text-yellow-400",
  };
  return colors[role] || "text-muted-foreground";
}

export function getPersonRoleBgColor(role: Person["role"]): string {
  const colors: Record<Person["role"], string> = {
    "military-conspirator": "bg-red-950/30 border-red-800/50",
    "military-loyal": "bg-blue-950/30 border-blue-800/50",
    "civilian-conspirator": "bg-orange-950/30 border-orange-800/50",
    "civilian-involved": "bg-yellow-950/30 border-yellow-800/50",
    "political-figure": "bg-gray-900/30 border-gray-700/50",
    "family-member": "bg-green-950/30 border-green-800/50",
    monarch: "bg-yellow-950/30 border-yellow-700/50",
  };
  return colors[role] || "bg-muted border-border";
}

export function getPersonRoleLabel(role: Person["role"]): string {
  const labels: Record<Person["role"], string> = {
    "military-conspirator": "Militar Conspirador",
    "military-loyal": "Militar Leal",
    "civilian-conspirator": "Civil Conspirador",
    "civilian-involved": "Civil Implicado",
    "political-figure": "Figura Política",
    "family-member": "Familiar",
    monarch: "Monarca",
  };
  return labels[role] || role;
}

export function getAnnotationsByDocument(docId: string): Annotation[] {
  return annotations.filter(
    (a) => a.targetType === "document" && a.targetId === docId
  );
}

export function getAnnotationsByPerson(personId: string): Annotation[] {
  return annotations.filter(
    (a) => a.targetType === "person" && a.targetId === personId
  );
}

export function getAnnotationCount(targetId: string): number {
  return annotations.filter((a) => a.targetId === targetId).length;
}

