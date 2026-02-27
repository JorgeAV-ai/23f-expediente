# Expediente 23-F

Interactive educational web application about the failed Spanish coup d'etat of February 23, 1981 (23-F). Explore declassified documents, wiretap transcripts, conspirator profiles, and an hour-by-hour timeline through an FBI/spy case-file aesthetic.

**[Live Demo](https://huggingface.co/spaces/JorgeAV/23f-expediente)** | **[Dataset](https://huggingface.co/datasets/JorgeAV/23f-expediente)**

## Features

- Document viewer with page scans and extracted text side-by-side
- Conspirator dossiers with connections and role-based color coding
- Wiretap transcript reader with speaker labels and annotations
- Hour-by-hour timeline of the coup (18:23 - 06:00+1)
- War room: interactive map of Spain + D3 network graph of conspirators
- Full-text search across all documents (Fuse.js)

## Tech Stack

Next.js 15 (App Router, SSG) · TypeScript · Tailwind CSS 4 · shadcn/ui · D3-force · Leaflet · Fuse.js

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### PDF Documents

The original PDFs are not included in the repo (too large). To download them:

```bash
bash scripts/download-pdfs.sh
```

### Data Pipeline

```bash
npx tsx scripts/extract-texts.ts      # Extract text from typed PDFs
npx tsx scripts/generate-documents-json.ts  # Generate structured JSON
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── expediente/         # Case file: documents, persons, communications
│   ├── cronologia/         # Hour-by-hour timeline
│   └── sala-de-guerra/     # Map + network graph
├── components/             # React components (shadcn/ui + custom)
├── data/                   # Pre-processed JSON data
├── lib/                    # Data loading, search, utilities
└── types/                  # TypeScript type definitions
```

## License

Source documents are public domain (declassified Spanish government records). Code is MIT.
