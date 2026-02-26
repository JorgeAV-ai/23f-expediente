export default function AcercaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="mb-4 font-typewriter text-2xl font-bold uppercase tracking-[0.15em] text-foreground">
            Acerca del Proyecto
          </h1>
          <div className="h-px bg-gradient-to-r from-amber/30 via-border to-transparent" />
        </div>

        <div className="space-y-6 font-sans text-sm leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">Expediente 23-F</strong> es un
            proyecto educativo interactivo que permite explorar los documentos
            desclasificados relacionados con el intento de golpe de Estado del
            23 de febrero de 1981 en España.
          </p>

          <p>
            El proyecto incluye transcripciones de escuchas telefónicas
            interceptadas durante la noche del golpe, documentos manuscritos de
            planificación y registros de las comunicaciones entre los
            conspiradores y sus familiares.
          </p>

          <div className="rounded-sm border border-amber/20 bg-amber/5 p-6">
            <h2 className="mb-3 font-typewriter text-xs font-bold uppercase tracking-[0.15em] text-amber">
              Sobre los documentos
            </h2>
            <p>
              Los documentos presentados en este proyecto son de dominio público
              y forman parte del acervo histórico del 23-F. Las anotaciones
              históricas y el contexto editorial son responsabilidad de los
              autores del proyecto.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-typewriter text-xs font-bold uppercase tracking-[0.15em] text-amber">
              Tecnología
            </h2>
            <p>
              Construido con Next.js, TypeScript, Tailwind CSS y shadcn/ui.
              Código abierto disponible en GitHub.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
