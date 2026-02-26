import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { communications, getCommunication, getPerson, getDocument } from "@/lib/data";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { User, Radio, FileText } from "lucide-react";

export function generateStaticParams() {
  return communications.map((c) => ({ commId: c.id }));
}

export default async function CommunicationDetailPage({
  params,
}: {
  params: Promise<{ commId: string }>;
}) {
  const { commId } = await params;
  const comm = getCommunication(commId);
  if (!comm) notFound();

  const relatedDoc = getDocument(comm.documentId);

  // Resolve participants to persons
  const participantMap = new Map(
    comm.participants.map((p) => [p.label, { ...p, person: p.personId ? getPerson(p.personId) : null }])
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Breadcrumb
        items={[
          { label: "Expediente", href: "/expediente" },
          { label: "Comunicaciones", href: "/expediente/comunicaciones" },
          { label: comm.title },
        ]}
      />

      {/* Header */}
      <div className="document-card paper-texture mb-8 rounded-sm border border-border/50 bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <Radio size={20} className="text-amber" />
          <h1 className="font-typewriter text-base font-bold text-foreground">
            {comm.title}
          </h1>
        </div>

        <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {comm.date && <span>{comm.date}</span>}
          {comm.timeEstimate && <span>· {comm.timeEstimate}</span>}
          {comm.location && <span>· {comm.location}</span>}
          {comm.tapeReference && (
            <Badge variant="outline" className="font-typewriter text-[9px] uppercase tracking-wider">
              {comm.tapeReference}
            </Badge>
          )}
        </div>

        {/* Participants */}
        <div className="flex flex-wrap gap-3">
          {comm.participants.map((p) => {
            const resolved = participantMap.get(p.label);
            const person = resolved?.person;
            return (
              <div key={p.label} className="flex items-center gap-2">
                {person?.imagePath ? (
                  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-amber/20">
                    <Image src={person.imagePath} alt={p.identifiedAs} fill sizes="32px" className="object-cover sepia-[0.2]" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-accent">
                    <User size={12} className="text-muted-foreground" />
                  </div>
                )}
                {person ? (
                  <Link href={`/expediente/personas/${person.id}`} className="font-typewriter text-xs text-amber hover:underline">
                    {p.identifiedAs}
                  </Link>
                ) : (
                  <span className="font-typewriter text-xs text-muted-foreground">{p.identifiedAs}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Conversation entries */}
      <div className="space-y-4">
        {comm.entries.map((entry) => {
          const resolved = participantMap.get(entry.speaker);
          const person = resolved?.person;

          if (entry.isStageDirection) {
            return (
              <div key={entry.index} className="px-4 py-2 text-center">
                <span className="font-sans text-xs italic text-amber/50">
                  {entry.text}
                </span>
              </div>
            );
          }

          return (
            <div key={entry.index} className="flex gap-3">
              {/* Speaker avatar */}
              <div className="shrink-0 pt-1">
                {person?.imagePath ? (
                  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-amber/20">
                    <Image src={person.imagePath} alt={resolved?.identifiedAs || entry.speaker} fill sizes="32px" className="object-cover sepia-[0.2]" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-accent">
                    <User size={12} className="text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  {person ? (
                    <Link href={`/expediente/personas/${person.id}`} className="font-typewriter text-xs font-bold text-amber hover:underline">
                      {resolved?.identifiedAs || entry.speaker}
                    </Link>
                  ) : (
                    <span className="font-typewriter text-xs font-bold text-muted-foreground">
                      {resolved?.identifiedAs || entry.speaker}
                    </span>
                  )}
                  {entry.timestamp && (
                    <span className="font-typewriter text-[9px] text-muted-foreground/50">
                      {entry.timestamp}
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap font-typewriter text-sm leading-relaxed text-foreground/85">
                  {entry.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Related document link */}
      {relatedDoc && (
        <div className="mt-8 border-t border-border/30 pt-6">
          <h2 className="mb-3 flex items-center gap-2 font-typewriter text-xs font-bold uppercase tracking-[0.15em] text-amber">
            <FileText size={14} />
            Documento fuente
          </h2>
          <Link
            href={`/expediente/documentos/${relatedDoc.id}`}
            className="group flex items-center gap-3 rounded-sm border border-border/30 bg-card/50 px-4 py-3 transition-all hover:border-amber/30 hover:bg-card"
          >
            <FileText size={14} className="text-muted-foreground" />
            <span className="font-typewriter text-xs text-foreground">
              {relatedDoc.titleShort}
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
