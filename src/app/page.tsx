"use client";

import { useState } from "react";
import Link from "next/link";
import { TypewriterText } from "@/components/shared/typewriter-text";
import { ClassifiedBadge } from "@/components/shared/classified-badge";
import {
  FileText,
  Clock,
  Crosshair,
  ChevronRight,
  Radio,
  Users,
  MapPin,
} from "lucide-react";

const sections = [
  {
    href: "/expediente",
    icon: FileText,
    title: "Expediente",
    description: "Documentos clasificados, perfiles de personas de interes y comunicaciones interceptadas.",
    count: "167 documentos desclasificados",
    accentIcon: Radio,
  },
  {
    href: "/cronologia",
    icon: Clock,
    title: "Cronologia",
    description: "Los eventos hora a hora de la noche del 23 de febrero de 1981.",
    count: "18:23 - 12:00+1",
    accentIcon: Users,
  },
  {
    href: "/sala-de-guerra",
    icon: Crosshair,
    title: "Sala de Guerra",
    description: "Mapa de operaciones, red de conspiradores y lineas de comunicacion.",
    count: "8 ubicaciones - 20 conexiones",
    accentIcon: MapPin,
  },
];

export default function LandingPage() {
  const [titleDone, setTitleDone] = useState(false);
  const [subtitleDone, setSubtitleDone] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Vignette overlay */}
      <div className="vignette pointer-events-none absolute inset-0" />

      {/* Subtle grid background pattern */}
      <div className="bg-grid-pattern pointer-events-none absolute inset-0" />

      {/* Radial glow behind the folder */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[500px] w-[600px] rounded-full bg-amber/[0.03] blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-16 sm:px-6 sm:py-20">
        {/* Manila folder header */}
        <div className="relative mb-12 w-full sm:mb-16">
          {/* Folder tab */}
          <div className="mx-auto mb-0 w-48 rounded-t-lg border border-b-0 border-amber/20 bg-gradient-to-b from-[#2a2318] to-[#1a1810] px-4 py-2 text-center">
            <span className="font-typewriter text-[10px] uppercase tracking-[0.3em] text-amber/60">
              No 23-F/1981
            </span>
          </div>

          {/* Main folder body */}
          <div className="document-card paper-texture relative rounded-sm border border-amber/10 bg-gradient-to-br from-[#161412] via-[#131210] to-[#0f0e0c] p-6 sm:p-10 md:p-16">
            {/* Classified stamp */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
              <ClassifiedBadge level="secreto" animated />
            </div>

            {/* Confidencial stamp diagonal */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-20deg]">
              <span className="font-typewriter text-4xl font-bold uppercase tracking-[0.2em] text-stamp/[0.04] sm:text-6xl md:text-8xl">
                CONFIDENCIAL
              </span>
            </div>

            {/* Title area */}
            <div className="relative space-y-6">
              {/* Date stamp */}
              <div className="font-typewriter text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
                Madrid, 23 de febrero de 1981
              </div>

              {/* Main title */}
              <h1 className="flicker font-typewriter text-2xl font-bold leading-tight tracking-wide text-foreground sm:text-3xl md:text-5xl">
                <TypewriterText
                  text="EXPEDIENTE 23-F"
                  speed={80}
                  delay={500}
                  onComplete={() => setTitleDone(true)}
                />
              </h1>

              {/* Subtitle */}
              <div className="min-h-[2em]">
                {titleDone && (
                  <p className="font-typewriter text-xs leading-relaxed text-muted-foreground sm:text-sm md:text-base">
                    <TypewriterText
                      text="Documentos desclasificados del intento de golpe de Estado"
                      speed={30}
                      delay={200}
                      onComplete={() => setSubtitleDone(true)}
                    />
                  </p>
                )}
              </div>

              {/* Separator line */}
              <div className="h-px bg-gradient-to-r from-transparent via-amber/30 to-transparent" />

              {/* Description + document count */}
              <div
                className={`space-y-4 transition-opacity duration-1000 ${subtitleDone ? "opacity-100" : "opacity-0"}`}
              >
                <p className="max-w-lg font-sans text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  Exploracion interactiva de escuchas telefonicas, documentos de
                  planificacion manuscritos y registros interceptados durante la
                  noche que pudo cambiar la historia de Espana.
                </p>

                {/* Document count badge */}
                <div className="inline-flex items-center gap-2 rounded-sm border border-amber/20 bg-amber/5 px-3 py-1.5">
                  <FileText size={12} className="text-amber" />
                  <span className="font-typewriter text-[10px] uppercase tracking-[0.15em] text-amber/80">
                    167 documentos desclasificados
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Entry points */}
        <div
          className={`grid w-full gap-3 transition-all duration-1000 sm:gap-4 md:grid-cols-3 ${subtitleDone ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
        >
          {sections.map((section, i) => {
            const Icon = section.icon;
            const AccentIcon = section.accentIcon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group document-card relative rounded-sm border border-border/50 bg-card p-5 transition-all hover:border-amber/30 sm:p-6"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {/* Decorative accent icon */}
                <div className="pointer-events-none absolute top-4 right-4 opacity-[0.04]">
                  <AccentIcon size={48} />
                </div>

                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-accent">
                    <Icon size={18} className="text-amber" />
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-amber"
                  />
                </div>

                <h2 className="mb-2 font-typewriter text-sm font-bold uppercase tracking-[0.1em] text-foreground">
                  {section.title}
                </h2>

                <p className="mb-4 font-sans text-xs leading-relaxed text-muted-foreground">
                  {section.description}
                </p>

                <div className="font-typewriter text-[10px] uppercase tracking-[0.15em] text-amber/60">
                  {section.count}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer credits */}
        <div
          className={`mt-12 text-center transition-opacity duration-1000 delay-500 sm:mt-16 ${subtitleDone ? "opacity-100" : "opacity-0"}`}
        >
          <p className="font-typewriter text-[9px] uppercase tracking-[0.3em] text-muted-foreground/50 sm:text-[10px]">
            Proyecto educativo - Documentos de dominio publico
          </p>
        </div>
      </div>
    </div>
  );
}
