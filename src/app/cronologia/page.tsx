import Link from "next/link";
import { getSortedEvents, getLocation, getPerson, getPersonRoleColor } from "@/lib/data";
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
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Swords,
  Shield,
  Truck,
  Tv,
  Phone,
  PhoneCall,
  UserX,
  Crown,
  Flag,
  Radio,
  AlertTriangle,
  Send,
  MessageSquare,
  Video,
  Megaphone,
  Building2,
};

const categoryColors: Record<string, string> = {
  "military-action": "border-red-800 bg-red-950/30 text-red-400",
  "political-event": "border-blue-800 bg-blue-950/30 text-blue-400",
  communication: "border-green-800 bg-green-950/30 text-green-400",
  media: "border-yellow-800 bg-yellow-950/30 text-yellow-400",
  "royal-intervention": "border-purple-800 bg-purple-950/30 text-purple-400",
  resolution: "border-teal-800 bg-teal-950/30 text-teal-400",
};

const categoryLabels: Record<string, string> = {
  "military-action": "Acción Militar",
  "political-event": "Evento Político",
  communication: "Comunicación",
  media: "Medios",
  "royal-intervention": "Intervención Real",
  resolution: "Resolución",
};

function formatTime(datetime: string): string {
  const d = new Date(datetime);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(datetime: string): string {
  const d = new Date(datetime);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

export default function CronologiaPage() {
  const events = getSortedEvents();

  let currentDate = "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Header */}
      <div className="mb-12 space-y-3">
        <h1 className="font-typewriter text-2xl font-bold uppercase tracking-[0.15em] text-foreground">
          Cronología
        </h1>
        <p className="font-sans text-sm text-muted-foreground">
          Los eventos hora a hora de la noche del 23 de febrero de 1981.
        </p>
        <div className="h-px bg-gradient-to-r from-amber/30 via-border to-transparent" />
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[72px] top-0 bottom-0 w-px bg-gradient-to-b from-amber/40 via-border to-transparent" />

        <div className="space-y-1">
          {events.map((event) => {
            const Icon = iconMap[event.icon] || Flag;
            const location = getLocation(event.locationId);
            const eventDate = formatDate(event.datetime);

            let showDateHeader = false;
            if (eventDate !== currentDate) {
              currentDate = eventDate;
              showDateHeader = true;
            }

            return (
              <div key={event.id}>
                {/* Date header */}
                {showDateHeader && (
                  <div className="mb-6 mt-8 first:mt-0 flex items-center gap-4 pl-4">
                    <span className="font-typewriter text-xs font-bold uppercase tracking-[0.2em] text-amber">
                      {eventDate}
                    </span>
                    <div className="h-px flex-1 bg-amber/20" />
                  </div>
                )}

                {/* Event */}
                <div
                  id={event.id}
                  className="group relative flex gap-6 rounded-sm py-4 pl-4 pr-4 transition-colors hover:bg-card/50"
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
                      className={`z-10 flex h-6 w-6 items-center justify-center rounded-full border ${categoryColors[event.category]}`}
                    >
                      <Icon size={12} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <h3 className="font-typewriter text-sm font-bold text-foreground">
                      {event.title}
                    </h3>

                    <p className="font-sans text-xs leading-relaxed text-muted-foreground">
                      {event.detailedDescription}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Badge
                        variant="outline"
                        className={`text-[8px] font-typewriter uppercase tracking-wider ${categoryColors[event.category]}`}
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
                          className="flex items-center gap-1 font-typewriter text-[9px] text-amber/70 transition-colors hover:text-amber"
                        >
                          <FileText size={10} />
                          Ver documento
                        </Link>
                      )}
                    </div>

                    {/* Persons involved */}
                    {event.personsInvolved.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {event.personsInvolved.map((pid) => {
                          const p = getPerson(pid);
                          if (!p) return null;
                          return (
                            <Link
                              key={pid}
                              href={`/expediente/personas/${pid}`}
                              className={`font-typewriter text-[9px] transition-colors hover:underline ${getPersonRoleColor(p.role)}`}
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
