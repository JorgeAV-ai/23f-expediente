# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive educational web application about the 23-F coup attempt in Spain (February 23, 1981). Presents declassified documents (phone tap transcripts, handwritten planning documents) with an FBI/spy case file aesthetic for educational exploration.

## Tech Stack

- Next.js 15 (App Router, SSG) + TypeScript + Tailwind CSS 4 + shadcn/ui
- d3-force for network graph visualization
- Fuse.js for client-side search
- pdf-parse + sharp for build-time PDF processing

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production (SSG)
npm run lint         # Run ESLint
npx tsx scripts/generate-data.ts    # Process PDFs → JSON data
npx tsx scripts/validate-data.ts    # Validate JSON against Zod schemas
```

## Architecture

### Data Flow
PDFs in `public/documents/` → `scripts/` extracts text + images → structured JSON in `src/data/` → consumed by pages via `src/lib/data.ts`

### Route Structure
- `/` — Landing page (no nav bar)
- `/expediente` — Case file hub (documents, persons, communications)
- `/expediente/documentos/[docId]` — Document viewer (scan + transcription)
- `/expediente/personas/[personId]` — Person dossier
- `/cronologia` — Hour-by-hour timeline
- `/sala-de-guerra` — Map + conspirator network graph
- `/acerca` — About page

### Key Conventions
- All UI text in Spanish
- Dark theme only (no light mode) — colors defined as CSS variables in `globals.css`
- Font stack: `Courier Prime` (typewriter), `Special Elite` (handwritten), `DM Sans` (UI)
- Custom Tailwind classes: `font-typewriter`, `font-handwritten`, `font-sans`
- Person roles have semantic colors defined in `src/lib/data.ts` (getPersonRoleColor/BgColor)
- `ClassifiedBadge` component for document classification stamps
- Layout with `MainNav` lives in section layouts (`expediente/layout.tsx`, etc.), NOT in root layout
- Documents, persons, events, locations data are typed in `src/types/index.ts`

### Adding New Documents
1. Place PDF in `public/documents/`
2. Add entry to `src/data/documents.json`
3. If typed transcript: run `npx tsx scripts/extract-pdf-text.ts`
4. Add related persons/events/annotations to respective JSON files
5. Run `npx tsx scripts/validate-data.ts`
