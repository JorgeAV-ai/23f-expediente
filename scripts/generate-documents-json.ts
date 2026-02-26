/**
 * generate-documents-json.ts
 *
 * Generates a complete src/data/documents.json with entries for ALL downloaded
 * documents, preserving the 6 existing hand-curated entries and generating
 * smart defaults for every other file found in pdf-analysis.json plus the
 * exteriores JPG images.
 *
 * Usage:
 *   npx tsx scripts/generate-documents-json.ts
 */

import * as fs from "fs";
import * as path from "path";

// ────────────────────────────────────────────
// Types (mirrors src/types/index.ts)
// ────────────────────────────────────────────

type DocumentType =
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

type DocumentFormat = "typed" | "handwritten" | "mixed" | "scan";
type ClassificationLevel = "secreto" | "confidencial" | "reservado";

type SourceCategory =
  | "interior/guardia-civil"
  | "interior/policia"
  | "interior/archivo"
  | "defensa/cni"
  | "defensa/archivo-general"
  | "exteriores";

interface Document {
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

interface PdfAnalysisEntry {
  relativePath: string;
  filename: string;
  category: string;
  pageCount: number;
  hasText: boolean;
  textLength: number;
  fileSizeBytes: number;
}

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, "..");
const PDF_ANALYSIS_PATH = path.join(PROJECT_ROOT, "src/data/pdf-analysis.json");
const EXISTING_DOCS_PATH = path.join(PROJECT_ROOT, "src/data/documents.json");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "src/data/documents.json");
const DOCUMENTS_DIR = path.join(PROJECT_ROOT, "public/documents");

// Map from filename to existing doc ID (the 6 preserved documents)
const EXISTING_DOC_MAP: Record<string, string> = {
  "interior/guardia-civil/23F_1_conversacion_gc_tejero.pdf": "doc-1-gc-tejero",
  "interior/guardia-civil/23F_2_conversacion_gc.pdf": "doc-2-gc",
  "interior/guardia-civil/23F_3_conversaciones_el_pardo.pdf": "doc-3-el-pardo",
  "interior/guardia-civil/23F_4_planificacion_golpe.pdf": "doc-4-planificacion",
  "interior/guardia-civil/23F_5_manuscrito_planificacion.pdf": "doc-5-manuscrito",
  "interior/guardia-civil/23F_6_esposa_tejero.pdf": "doc-6-esposa-tejero",
};

// Category to ID prefix
const CATEGORY_PREFIX: Record<string, string> = {
  "interior/guardia-civil": "gc",
  "interior/policia": "pol",
  "interior/archivo": "arch",
  "defensa/cni": "cni",
  "defensa/archivo-general": "def",
  exteriores: "ext",
};

// ────────────────────────────────────────────
// Helper functions
// ────────────────────────────────────────────

function normalizeCategoryToSourceCategory(cat: string): SourceCategory {
  // exteriores sub-directories all map to "exteriores"
  if (cat.startsWith("exteriores")) return "exteriores";
  return cat as SourceCategory;
}

function getCategoryPrefix(cat: string): string {
  const sc = normalizeCategoryToSourceCategory(cat);
  return CATEGORY_PREFIX[sc] || "doc";
}

/**
 * Generate a kebab-case ID from the relative path.
 */
function generateId(relativePath: string, category: string): string {
  const prefix = getCategoryPrefix(category);
  const basename = path.basename(relativePath, path.extname(relativePath));

  // Remove leading "23F_N_" prefix for guardia-civil files that aren't the original 6
  let slug = basename
    .toLowerCase()
    .replace(/^23f_\d+_/, "")
    .replace(/^carpeta_\d+_/, "carpeta-")
    .replace(/^causa_\d+_/, "causa-")
    .replace(/^documento_/, "documento-")
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // For exteriores, include the archive code in the ID
  if (category.startsWith("exteriores/")) {
    const archiveCode = category
      .replace("exteriores/", "")
      .toLowerCase()
      .replace(/-/g, "");
    slug = `${archiveCode}-${slug}`;
  }

  return `${prefix}-${slug}`;
}

/**
 * Humanize a filename into a Spanish title.
 */
function humanizeTitle(filename: string, category: string): string {
  const basename = path.basename(filename, path.extname(filename));

  // Guardia Civil files with 23F_ prefix
  const gcMatch = basename.match(/^23F_(\d+)_(.+)$/);
  if (gcMatch) {
    return humanizeSlug(gcMatch[2]);
  }

  // Defensa Archivo General: carpeta_NNNNN_description
  const carpetaMatch = basename.match(/^carpeta_(\d+)_(.+)$/);
  if (carpetaMatch) {
    return `Carpeta ${carpetaMatch[1]} - ${humanizeSlug(carpetaMatch[2])}`;
  }

  // Defensa Archivo General: causa_NNNN_description
  const causaMatch = basename.match(/^causa_(\d+)_(.+)$/);
  if (causaMatch) {
    return `Causa ${causaMatch[1]} - ${humanizeSlug(causaMatch[2])}`;
  }

  // CNI documents: documento_N
  const docMatch = basename.match(/^documento_(\d+)$/);
  if (docMatch) {
    return `Documento CNI n.${"\u00BA"} ${docMatch[1]}`;
  }

  // Policia: nota_description_DD-MM-YY or situacion_description_DD-MM-YY
  const policiaDateMatch = basename.match(
    /^(nota|situacion)_(.+?)_(\d{2}-\d{2}-\d{2})$/
  );
  if (policiaDateMatch) {
    const prefix =
      policiaDateMatch[1] === "nota" ? "Nota informativa" : "Informe situaci\u00F3n";
    const desc = humanizeSlug(policiaDateMatch[2]);
    const dateStr = formatDateSpanish(
      extractDateFromFilename(policiaDateMatch[3])
    );
    return `${prefix}: ${desc} (${dateStr})`;
  }

  // Exteriores: D1, D2, etc.
  const extMatch = basename.match(/^D(\d+)$/);
  if (extMatch && category.startsWith("exteriores/")) {
    const archiveCode = category.replace("exteriores/", "");
    return `Documento diplom\u00E1tico ${archiveCode} - D${extMatch[1]}`;
  }

  // Interior Archivo: general slug
  return humanizeSlug(basename);
}

/**
 * Humanize a slug: replace underscores, capitalize, expand abbreviations.
 */
function humanizeSlug(slug: string): string {
  const abbreviations: Record<string, string> = {
    gc: "Guardia Civil",
    em: "Estado Mayor",
    sm: "Su Majestad",
    pce: "PCE",
    psoe: "PSOE",
    fas: "FAS",
    tve: "TVE",
  };

  return slug
    .split("_")
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (abbreviations[lower]) return abbreviations[lower];
      if (i === 0) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      return word.toLowerCase();
    })
    .join(" ");
}

/**
 * Generate a short title from the full title.
 */
function generateShortTitle(title: string, category: string): string {
  // CNI documents
  const cniMatch = title.match(/Documento CNI n\.\u00BA (\d+)/);
  if (cniMatch) return `CNI Doc. ${cniMatch[1]}`;

  // Exteriores
  const extMatch = title.match(/Documento diplom\u00E1tico (.+?) - (D\d+)/);
  if (extMatch) return `${extMatch[1]} ${extMatch[2]}`;

  // Carpeta
  const carpMatch = title.match(/Carpeta (\d+) - (.+)/);
  if (carpMatch) {
    const desc = carpMatch[2];
    return desc.length > 30 ? desc.slice(0, 27) + "..." : desc;
  }

  // Causa
  const causaMatch = title.match(/Causa (\d+) - (.+)/);
  if (causaMatch) {
    const desc = causaMatch[2];
    return desc.length > 30 ? desc.slice(0, 27) + "..." : desc;
  }

  // Policia
  if (title.startsWith("Nota informativa:")) {
    const rest = title.replace("Nota informativa: ", "");
    return rest.length > 30 ? rest.slice(0, 27) + "..." : rest;
  }
  if (title.startsWith("Informe situaci\u00F3n:")) {
    const rest = title.replace("Informe situaci\u00F3n: ", "");
    return rest.length > 30 ? rest.slice(0, 27) + "..." : rest;
  }

  // General: truncate
  if (title.length > 35) return title.slice(0, 32) + "...";
  return title;
}

/**
 * Determine document type from category and filename patterns.
 */
function inferDocumentType(
  filename: string,
  category: string
): DocumentType {
  const lowerFilename = filename.toLowerCase();
  const sc = normalizeCategoryToSourceCategory(category);

  if (sc === "interior/guardia-civil") {
    if (lowerFilename.includes("conversacion") || lowerFilename.includes("conversaciones") || lowerFilename.includes("esposa"))
      return "transcript";
    if (lowerFilename.includes("planificacion") || lowerFilename.includes("manuscrito"))
      return "planning";
    if (lowerFilename.includes("notas_informativas")) return "intelligence";
    if (lowerFilename.includes("telex")) return "telex";
    if (lowerFilename.includes("prensa")) return "report";
    if (lowerFilename.includes("oficio")) return "administrative";
    if (lowerFilename.includes("tejero_galaxia")) return "report";
    return "report";
  }

  if (sc === "interior/policia") {
    if (lowerFilename.startsWith("nota_")) return "intelligence";
    if (lowerFilename.startsWith("situacion_")) return "report";
    return "intelligence";
  }

  if (sc === "interior/archivo") {
    if (lowerFilename.includes("juicio")) return "judicial";
    return "report";
  }

  if (sc === "defensa/cni") return "intelligence";
  if (sc === "defensa/archivo-general") return "judicial";
  if (sc === "exteriores") return "diplomatic";

  return "report";
}

/**
 * Determine document format.
 */
function inferFormat(hasText: boolean, textLength: number, filename: string): DocumentFormat {
  const lower = filename.toLowerCase();
  if (lower.includes("manuscrito")) return "handwritten";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "scan";
  // Low text length relative to pages is likely scanned
  if (!hasText || textLength < 50) return "scan";
  return "typed";
}

/**
 * Determine classification level from filename keywords.
 */
function inferClassification(filename: string, category: string): ClassificationLevel {
  const lower = filename.toLowerCase();
  if (lower.includes("secreto")) return "secreto";
  if (lower.includes("confidencial")) return "confidencial";

  // CNI documents are typically more classified
  if (category === "defensa/cni") return "secreto";
  // Interior intercepted communications
  if (
    category === "interior/guardia-civil" &&
    (lower.includes("conversacion") || lower.includes("esposa"))
  )
    return "secreto";

  return "reservado";
}

/**
 * Try to extract a date from the filename.
 * Patterns: DD-MM-YY (e.g., 24-02-81)
 */
function extractDateFromFilename(dateStr: string): string | null {
  const match = dateStr.match(/(\d{2})-(\d{2})-(\d{2})/);
  if (match) {
    const day = match[1];
    const month = match[2];
    const yearShort = parseInt(match[3], 10);
    const year = yearShort >= 50 ? 1900 + yearShort : 2000 + yearShort;
    return `${year}-${month}-${day}`;
  }
  return null;
}

/**
 * Try to extract date from the full filename.
 */
function extractDate(filename: string): string | null {
  // Look for DD-MM-YY pattern
  const dateMatch = filename.match(/(\d{2}-\d{2}-\d{2})/);
  if (dateMatch) {
    return extractDateFromFilename(dateMatch[1]);
  }
  return null;
}

/**
 * Format a date string (YYYY-MM-DD) to a Spanish description.
 */
function formatDateSpanish(dateStr: string | null): string {
  if (!dateStr) return "Fecha no determinada";
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${day} de ${months[month - 1]} de ${year}`;
}

/**
 * Generate a date description in Spanish.
 */
function generateDateDescription(date: string | null, filename: string): string {
  if (date) return formatDateSpanish(date);

  // For 23F files without explicit date, the events are around Feb 23, 1981
  const lower = filename.toLowerCase();
  if (lower.includes("23f")) return "Periodo del 23-F (febrero 1981)";
  if (lower.includes("dic_1981")) return "Diciembre de 1981";
  if (lower.includes("1983")) return "A\u00F1o 1983";

  return "Fecha no determinada";
}

/**
 * Generate a brief summary based on the title and category.
 */
function generateSummary(
  title: string,
  category: string,
  filename: string,
  pageCount: number
): string {
  const sc = normalizeCategoryToSourceCategory(category);

  // Specific patterns
  if (sc === "defensa/cni") {
    const numMatch = filename.match(/documento_(\d+)/);
    const num = numMatch ? numMatch[1] : "";
    return `Documento desclasificado n.\u00BA ${num} del Centro Nacional de Inteligencia (CESID/CNI) relacionado con el golpe de Estado del 23-F. ${pageCount} p\u00E1gina(s).`;
  }

  if (sc === "defensa/archivo-general") {
    if (filename.includes("procesamiento"))
      return `Auto de procesamiento del sumario judicial contra implicados en el golpe del 23-F. Documento de ${pageCount} p\u00E1gina(s) del Archivo General Militar.`;
    if (filename.includes("declaracion"))
      return `Declaraci\u00F3n judicial en el marco del sumario por el intento de golpe de Estado del 23-F. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("detencion"))
      return `Documentaci\u00F3n sobre la detenci\u00F3n de implicados en el golpe del 23-F. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("incomunicacion"))
      return `Orden de incomunicaci\u00F3n de Tejero tras el golpe del 23-F. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("sancion"))
      return `Documento de sanciones a consejeros implicados en el 23-F. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("queja"))
      return `Escrito de queja presentado por Milans del Bosch durante el proceso judicial del 23-F. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("recusacion"))
      return `Informe sobre recusaci\u00F3n en el proceso judicial del 23-F. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("peticiones"))
      return `Peticiones de los abogados defensores en el juicio del 23-F. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("distribucion"))
      return `Documento sobre la distribuci\u00F3n de procesados en el juicio del 23-F. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("seguridad_visitas"))
      return `Normas de seguridad y visitas para Tejero durante su detenci\u00F3n. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("hoja_servicios"))
      return `Hoja de servicios del implicado S\u00E1nchez Valiente. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("abandono"))
      return `Documentaci\u00F3n sobre el abandono de destino de S\u00E1nchez Valiente. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("informe_juridico"))
      return `Informe jur\u00EDdico relativo a S\u00E1nchez Valiente en el marco del 23-F. ${pageCount} p\u00E1gina(s).`;
    return `Documento judicial del Archivo General Militar relativo al 23-F. ${pageCount} p\u00E1gina(s).`;
  }

  if (sc === "interior/policia") {
    if (filename.includes("situacion_regiones"))
      return `Informe policial sobre la situaci\u00F3n en las regiones militares tras el golpe del 23-F. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("nota_"))
      return `Nota informativa del Cuerpo Superior de Polic\u00EDa relacionada con el 23-F y sus consecuencias. ${pageCount} p\u00E1gina(s).`;
    return `Documento policial relacionado con el 23-F. ${pageCount} p\u00E1gina(s).`;
  }

  if (sc === "interior/archivo") {
    if (filename.includes("juicio"))
      return `Acotaciones y documentaci\u00F3n del juicio del 23-F procedente del Archivo del Interior. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("involucionismo"))
      return `Informe sobre el involucionismo y posibilidad de golpe militar. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("posible_golpe"))
      return `An\u00E1lisis sobre la posibilidad de un golpe de Estado. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("campana_contra_sm"))
      return `Informe sobre campa\u00F1a contra Su Majestad el Rey. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("indices_subversion"))
      return `\u00CDndices de subversi\u00F3n en las Fuerzas Armadas. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("libertad_condenados"))
      return `Notas sobre la libertad de los condenados por el 23-F (1983). ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("informe_situacion_policia"))
      return `Informe de situaci\u00F3n del Cuerpo de Polic\u00EDa. ${pageCount} p\u00E1gina(s).`;
    return `Documento del Archivo del Ministerio del Interior sobre el 23-F. ${pageCount} p\u00E1gina(s).`;
  }

  if (sc === "interior/guardia-civil") {
    if (filename.includes("notas_informativas"))
      return `Notas informativas de la 2.\u00AA Secci\u00F3n del Estado Mayor de la Guardia Civil. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("telex"))
      return `Recopilaci\u00F3n de t\u00E9lex internos enviados durante la noche del 23-F. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("oficio_pais_vasco"))
      return `Oficio relativo a Tejero y el Pa\u00EDs Vasco. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("prensa_arresto"))
      return `Recortes de prensa sobre el arresto de Tejero. ${pageCount} p\u00E1gina(s).`;
    if (filename.includes("tejero_galaxia"))
      return `Documento sobre Tejero y la Operaci\u00F3n Galaxia. ${pageCount} p\u00E1gina(s).`;
    return `Documento de la Guardia Civil relacionado con el 23-F. ${pageCount} p\u00E1gina(s).`;
  }

  if (sc === "exteriores") {
    return `Documento diplom\u00E1tico del Archivo General de la Administraci\u00F3n (Exteriores) relacionado con el 23-F. ${pageCount} p\u00E1gina(s).`;
  }

  return `Documento relacionado con el golpe de Estado del 23-F. ${pageCount} p\u00E1gina(s).`;
}

/**
 * Generate tags based on category and filename.
 */
function generateTags(filename: string, category: string): string[] {
  const sc = normalizeCategoryToSourceCategory(category);
  const tags: string[] = ["23-F", "desclasificado"];
  const lower = filename.toLowerCase();

  switch (sc) {
    case "interior/guardia-civil":
      tags.push("guardia-civil");
      if (lower.includes("conversacion") || lower.includes("esposa"))
        tags.push("intercepted", "phone-tap");
      if (lower.includes("planificacion") || lower.includes("manuscrito"))
        tags.push("planning", "pre-coup");
      if (lower.includes("telex")) tags.push("telex", "communications");
      if (lower.includes("prensa")) tags.push("press");
      break;
    case "interior/policia":
      tags.push("policia");
      if (lower.includes("nota_")) tags.push("intelligence-note");
      if (lower.includes("situacion_")) tags.push("situation-report");
      break;
    case "interior/archivo":
      tags.push("archivo-interior");
      if (lower.includes("juicio")) tags.push("trial");
      if (lower.includes("involucionismo") || lower.includes("golpe"))
        tags.push("analysis");
      break;
    case "defensa/cni":
      tags.push("cni", "cesid", "intelligence");
      break;
    case "defensa/archivo-general":
      tags.push("archivo-militar", "judicial");
      if (lower.includes("procesamiento")) tags.push("indictment");
      if (lower.includes("detencion")) tags.push("arrest");
      if (lower.includes("declaracion")) tags.push("testimony");
      break;
    case "exteriores":
      tags.push("exteriores", "diplomatic");
      if (category.includes("AGMAE")) tags.push("AGMAE");
      if (category.includes("AGA")) tags.push("AGA");
      break;
  }

  return tags;
}

/**
 * Generate brief historical context based on document type and category.
 */
function generateHistoricalContext(
  category: string,
  filename: string
): string {
  const sc = normalizeCategoryToSourceCategory(category);
  const lower = filename.toLowerCase();

  if (sc === "defensa/cni") {
    return "Documentos desclasificados del CESID (actual CNI) que revelan la actividad de los servicios de inteligencia espa\u00F1oles en relaci\u00F3n con el intento de golpe del 23-F.";
  }

  if (sc === "defensa/archivo-general") {
    if (lower.includes("procesamiento"))
      return "Los autos de procesamiento son las resoluciones judiciales por las que el Consejo Supremo de Justicia Militar decidi\u00F3 juzgar formalmente a los implicados en el golpe del 23-F.";
    if (lower.includes("declaracion"))
      return "Las declaraciones judiciales de los implicados constituyen piezas fundamentales del sumario instruido contra los golpistas del 23-F.";
    if (lower.includes("milans"))
      return "El Teniente General Milans del Bosch, Capit\u00E1n General de Valencia, fue una de las figuras clave del golpe, al sacar los tanques a las calles de Valencia la noche del 23-F.";
    if (lower.includes("tejero"))
      return "El Teniente Coronel Tejero lider\u00F3 el asalto al Congreso de los Diputados el 23 de febrero de 1981, secuestrando a los parlamentarios durante m\u00E1s de 17 horas.";
    if (lower.includes("sanchez_valiente"))
      return "El caso de S\u00E1nchez Valiente ilustra las ramificaciones judiciales del golpe del 23-F entre los mandos militares implicados.";
    return "Documentaci\u00F3n procesal del Archivo General Militar correspondiente al juicio por el golpe de Estado del 23-F.";
  }

  if (sc === "interior/policia") {
    if (lower.includes("situacion_regiones"))
      return "Los informes de situaci\u00F3n de las regiones militares documentan la respuesta territorial al golpe, con especial atenci\u00F3n a las capitales de regi\u00F3n militar y las guarniciones.";
    return "Las notas informativas de la Polic\u00EDa documentan las consecuencias pol\u00EDticas y sociales del intento de golpe del 23-F.";
  }

  if (sc === "interior/archivo") {
    if (lower.includes("juicio"))
      return "El juicio del 23-F se celebr\u00F3 entre febrero y junio de 1982 ante el Consejo Supremo de Justicia Militar, con 33 acusados.";
    if (lower.includes("involucionismo") || lower.includes("golpe"))
      return "Los an\u00E1lisis de inteligencia interior reflejan la preocupaci\u00F3n del Gobierno por las tendencias involucionistas en sectores de las Fuerzas Armadas.";
    return "Documentaci\u00F3n del Archivo del Ministerio del Interior que revela la respuesta institucional al golpe del 23-F.";
  }

  if (sc === "interior/guardia-civil") {
    if (lower.includes("telex"))
      return "Los t\u00E9lex internos recogen las comunicaciones oficiales cursadas durante la noche del golpe, reflejando la cadena de mando y las \u00F3rdenes transmitidas.";
    if (lower.includes("notas_informativas"))
      return "Las notas informativas de la 2.\u00AA Secci\u00F3n del Estado Mayor de la Guardia Civil recogen informaci\u00F3n de inteligencia previa y posterior al golpe.";
    if (lower.includes("prensa"))
      return "Los recortes de prensa documentan la cobertura medi\u00E1tica del arresto de Tejero y los implicados en el 23-F.";
    return "Documentaci\u00F3n de la Guardia Civil relativa al intento de golpe de Estado del 23 de febrero de 1981.";
  }

  if (sc === "exteriores") {
    return "Documentaci\u00F3n diplom\u00E1tica del Archivo General de la Administraci\u00F3n que refleja la dimensi\u00F3n internacional del golpe del 23-F y las reacciones de las embajadas espa\u00F1olas.";
  }

  return "Documento relacionado con el intento de golpe de Estado del 23 de febrero de 1981 en Espa\u00F1a.";
}

// ────────────────────────────────────────────
// Main generation logic
// ────────────────────────────────────────────

function main(): void {
  console.log("Reading pdf-analysis.json...");
  const pdfAnalysis: PdfAnalysisEntry[] = JSON.parse(
    fs.readFileSync(PDF_ANALYSIS_PATH, "utf-8")
  );
  console.log(`  Found ${pdfAnalysis.length} PDF entries.`);

  console.log("Reading existing documents.json...");
  const existingDocs: Document[] = JSON.parse(
    fs.readFileSync(EXISTING_DOCS_PATH, "utf-8")
  );
  console.log(`  Found ${existingDocs.length} existing documents.`);

  // Build a map of existing docs by ID for quick lookup
  const existingById = new Map<string, Document>();
  for (const doc of existingDocs) {
    existingById.set(doc.id, doc);
  }

  // Discover JPG files in exteriores
  console.log("Scanning for JPG files in exteriores...");
  const jpgFiles: Array<{
    relativePath: string;
    filename: string;
    category: string;
  }> = [];

  const exterioresDir = path.join(DOCUMENTS_DIR, "exteriores");
  if (fs.existsSync(exterioresDir)) {
    const scanDir = (dir: string, prefix: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          scanDir(path.join(dir, entry.name), `${prefix}/${entry.name}`);
        } else if (
          entry.isFile() &&
          (entry.name.endsWith(".jpg") || entry.name.endsWith(".jpeg"))
        ) {
          jpgFiles.push({
            relativePath: `${prefix}/${entry.name}`.replace(/^\//, ""),
            filename: entry.name,
            category: prefix.replace(/^\//, "").replace(/\/[^/]+$/, ""),
          });
        }
      }
    };
    // Need to scan subdirs of exteriores
    const topEntries = fs.readdirSync(exterioresDir, { withFileTypes: true });
    for (const te of topEntries) {
      if (te.isDirectory()) {
        const subDir = path.join(exterioresDir, te.name);
        const subEntries = fs.readdirSync(subDir, { withFileTypes: true });
        for (const se of subEntries) {
          if (
            se.isFile() &&
            (se.name.endsWith(".jpg") || se.name.endsWith(".jpeg"))
          ) {
            jpgFiles.push({
              relativePath: `exteriores/${te.name}/${se.name}`,
              filename: se.name,
              category: `exteriores/${te.name}`,
            });
          }
        }
      }
    }
  }
  console.log(`  Found ${jpgFiles.length} JPG files.`);

  // Build the complete documents array
  const allDocuments: Document[] = [];

  // Process each PDF from the analysis
  for (const entry of pdfAnalysis) {
    // Check if this is one of the 6 existing documents
    const existingId = EXISTING_DOC_MAP[entry.relativePath];
    if (existingId) {
      // Preserve existing document but update specific fields
      const existingDoc = existingById.get(existingId);
      if (existingDoc) {
        const updated: Document = {
          ...existingDoc,
          pdfPath: `/documents/${entry.relativePath}`,
          thumbnailPath: `/thumbnails/${entry.relativePath.replace(/\.pdf$/, ".webp")}`,
          sourceCategory: normalizeCategoryToSourceCategory(entry.category),
          hasExtractedText: entry.hasText,
        };
        allDocuments.push(updated);
        continue;
      }
    }

    // Generate new document entry
    const sc = normalizeCategoryToSourceCategory(entry.category);
    const title = humanizeTitle(entry.filename, entry.category);
    const date = extractDate(entry.filename);
    const ext = path.extname(entry.filename);

    const doc: Document = {
      id: generateId(entry.relativePath, entry.category),
      title,
      titleShort: generateShortTitle(title, entry.category),
      type: inferDocumentType(entry.filename, entry.category),
      format: inferFormat(entry.hasText, entry.textLength, entry.filename),
      classification: inferClassification(entry.filename, entry.category),
      sourceCategory: sc,
      date,
      dateDescription: generateDateDescription(date, entry.filename),
      pageCount: entry.pageCount,
      pdfPath: `/documents/${entry.relativePath}`,
      thumbnailPath: `/thumbnails/${entry.relativePath.replace(ext, ".webp")}`,
      scanPaths: [],
      hasExtractedText: entry.hasText,
      summary: generateSummary(title, entry.category, entry.filename, entry.pageCount),
      personsReferenced: [],
      locationsReferenced: [],
      eventsReferenced: [],
      communicationId: null,
      tags: generateTags(entry.filename, entry.category),
      historicalContext: generateHistoricalContext(entry.category, entry.filename),
    };
    allDocuments.push(doc);
  }

  // Process JPG files from exteriores
  for (const jpg of jpgFiles) {
    const title = humanizeTitle(jpg.filename, jpg.category);
    const doc: Document = {
      id: generateId(jpg.relativePath, jpg.category),
      title,
      titleShort: generateShortTitle(title, jpg.category),
      type: "image",
      format: "scan",
      classification: "reservado",
      sourceCategory: "exteriores",
      date: null,
      dateDescription: "Fecha no determinada",
      pageCount: 1,
      pdfPath: `/documents/${jpg.relativePath}`,
      thumbnailPath: `/thumbnails/${jpg.relativePath.replace(/\.jpe?g$/i, ".webp")}`,
      scanPaths: [`/documents/${jpg.relativePath}`],
      hasExtractedText: false,
      summary: `Imagen digitalizada de documento diplom\u00E1tico del Archivo General de la Administraci\u00F3n (Exteriores) relacionado con el 23-F.`,
      personsReferenced: [],
      locationsReferenced: [],
      eventsReferenced: [],
      communicationId: null,
      tags: generateTags(jpg.filename, jpg.category),
      historicalContext:
        "Documentaci\u00F3n diplom\u00E1tica del Archivo General de la Administraci\u00F3n que refleja la dimensi\u00F3n internacional del golpe del 23-F y las reacciones de las embajadas espa\u00F1olas.",
    };
    allDocuments.push(doc);
  }

  // Sort: existing 6 first (in order), then by sourceCategory, then by id
  const existingIds = Object.values(EXISTING_DOC_MAP);
  allDocuments.sort((a, b) => {
    const aIsExisting = existingIds.indexOf(a.id);
    const bIsExisting = existingIds.indexOf(b.id);

    // Existing docs come first, in their original order
    if (aIsExisting !== -1 && bIsExisting !== -1) return aIsExisting - bIsExisting;
    if (aIsExisting !== -1) return -1;
    if (bIsExisting !== -1) return 1;

    // Then sort by sourceCategory
    const catOrder: SourceCategory[] = [
      "interior/guardia-civil",
      "interior/policia",
      "interior/archivo",
      "defensa/cni",
      "defensa/archivo-general",
      "exteriores",
    ];
    const aCatIdx = catOrder.indexOf(a.sourceCategory);
    const bCatIdx = catOrder.indexOf(b.sourceCategory);
    if (aCatIdx !== bCatIdx) return aCatIdx - bCatIdx;

    // Within the same category, sort by id naturally
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });

  // Check for duplicate IDs
  const idSet = new Set<string>();
  const duplicates: string[] = [];
  for (const doc of allDocuments) {
    if (idSet.has(doc.id)) {
      duplicates.push(doc.id);
    }
    idSet.add(doc.id);
  }
  if (duplicates.length > 0) {
    console.warn(`WARNING: Duplicate IDs found: ${duplicates.join(", ")}`);
    // Deduplicate by appending a suffix
    const counts = new Map<string, number>();
    for (const doc of allDocuments) {
      const c = counts.get(doc.id) || 0;
      if (c > 0) {
        doc.id = `${doc.id}-${c + 1}`;
      }
      counts.set(doc.id, c + 1);
    }
  }

  // Write output
  console.log(`\nWriting ${allDocuments.length} documents to ${OUTPUT_PATH}...`);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allDocuments, null, 2) + "\n", "utf-8");

  // Summary
  const byCategory = new Map<string, number>();
  for (const doc of allDocuments) {
    const c = byCategory.get(doc.sourceCategory) || 0;
    byCategory.set(doc.sourceCategory, c + 1);
  }

  console.log("\n=== Summary ===");
  console.log(`Total documents: ${allDocuments.length}`);
  console.log(`  Preserved existing: ${existingIds.length}`);
  console.log(`  New from PDFs: ${pdfAnalysis.length - existingIds.length}`);
  console.log(`  New from JPGs: ${jpgFiles.length}`);
  console.log("\nBy category:");
  for (const [cat, count] of byCategory) {
    console.log(`  ${cat}: ${count}`);
  }
  console.log("\nDone!");
}

main();
