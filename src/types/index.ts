// ═══════════════════════════════════════
// Tipos centrales del Expediente 23-F
// ═══════════════════════════════════════

export type DocumentType =
  | "transcript"
  | "planning"
  | "manuscript"
  | "report"
  | "intelligence"
  | "judicial"
  | "diplomatic"
  | "correspondence"
  | "telex"
  | "administrative"
  | "image";

export type DocumentFormat = "typed" | "handwritten" | "mixed" | "scan";
export type ClassificationLevel = "secreto" | "confidencial" | "reservado";

export type SourceCategory =
  | "interior/guardia-civil"
  | "interior/policia"
  | "interior/archivo"
  | "defensa/cni"
  | "defensa/archivo-general"
  | "exteriores";

export interface Document {
  id: string;
  title: string;
  titleShort: string;
  type: DocumentType;
  format: DocumentFormat;
  classification: ClassificationLevel;
  sourceCategory: SourceCategory;
  date: string | null;
  dateDescription: string;
  pageCount: number;
  pdfPath: string;
  thumbnailPath: string;
  scanPaths: string[];
  hasExtractedText: boolean;
  summary: string;
  personsReferenced: string[];
  locationsReferenced: string[];
  eventsReferenced: string[];
  communicationId: string | null;
  tags: string[];
  historicalContext: string;
}

export type PersonRole =
  | "military-conspirator"
  | "military-loyal"
  | "civilian-conspirator"
  | "civilian-involved"
  | "political-figure"
  | "family-member"
  | "monarch";

export type MilitaryRank =
  | "teniente-coronel"
  | "coronel"
  | "general"
  | "teniente-general"
  | "capitan-general"
  | "capitan"
  | "comandante"
  | null;

export interface Person {
  id: string;
  fullName: string;
  displayName: string;
  aliases: string[];
  role: PersonRole;
  rank: MilitaryRank;
  unit: string | null;
  imagePath: string | null;
  bio: string;
  significance: string;
  documentsAppearingIn: string[];
  communicationsAppearingIn: string[];
  connections: ConnectionRef[];
  locationsDuring23F: string[];
}

export interface ConnectionRef {
  personId: string;
  relationshipType: RelationshipType;
  description: string;
  evidenceDocIds: string[];
}

export type RelationshipType =
  | "co-conspirator"
  | "subordinate"
  | "superior"
  | "spouse"
  | "family"
  | "political-ally"
  | "contacted-during-coup"
  | "intermediary";

export type SpeakerLabel = string;

export interface Communication {
  id: string;
  documentId: string;
  title: string;
  participants: Participant[];
  date: string | null;
  timeEstimate: string | null;
  location: string | null;
  tapeReference: string | null;
  entries: ConversationEntry[];
}

export interface Participant {
  label: SpeakerLabel;
  personId: string | null;
  identifiedAs: string;
}

export interface ConversationEntry {
  index: number;
  speaker: SpeakerLabel;
  text: string;
  isStageDirection: boolean;
  personsReferenced: string[];
  timestamp: string | null;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  datetime: string;
  endDatetime: string | null;
  category: EventCategory;
  locationId: string;
  personsInvolved: string[];
  relatedCommunicationIds: string[];
  relatedDocumentIds: string[];
  source: string;
  icon: string;
}

export type EventCategory =
  | "military-action"
  | "political-event"
  | "communication"
  | "media"
  | "royal-intervention"
  | "resolution";

export interface Location {
  id: string;
  name: string;
  shortName: string;
  coordinates: { lat: number; lng: number };
  description: string;
  significance: string;
  eventsHere: string[];
  personsHere: string[];
  type: "government" | "military" | "media" | "royal" | "other";
}

export interface Annotation {
  id: string;
  targetType: "document" | "communication-entry" | "person" | "event";
  targetId: string;
  targetEntryIndex: number | null;
  text: string;
  category: "historical-context" | "correction" | "cross-reference" | "translation";
  sources: string[];
}
