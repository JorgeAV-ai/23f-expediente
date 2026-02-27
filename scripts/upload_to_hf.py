#!/usr/bin/env python3
"""
Build and upload the 23-F dataset to Hugging Face Hub.

Each row = one page with columns:
  image, pdf_source, page_number, text, ministry, archive_id
"""

import json
import tempfile
from pathlib import Path

from datasets import Dataset, Features, Image, Value
from huggingface_hub import HfApi, create_repo
from pdf2image import convert_from_path
from PIL import Image as PILImage

REPO_ID = "JorgeAV/23f-expediente"
PROJECT_ROOT = Path(__file__).parent.parent
DOCUMENTS_DIR = PROJECT_ROOT / "public" / "documents"
TEXTS_DIR = PROJECT_ROOT / "src" / "data" / "texts"

# DPI for PDF rendering (150 = good balance of quality/size)
RENDER_DPI = 150


def parse_path_info(rel_path: str) -> tuple[str, str]:
    """Extract ministry and archive_id from relative path like 'exteriores/AGA-83-07633/D21.pdf'."""
    parts = rel_path.split("/")
    ministry = parts[0] if len(parts) > 0 else ""
    archive_id = parts[1] if len(parts) > 1 else ""
    return ministry, archive_id


def load_text_for_doc(rel_path: str) -> list[dict]:
    """Load extracted text pages for a document."""
    base = Path(rel_path).with_suffix(".json")
    text_path = TEXTS_DIR / base
    if not text_path.exists():
        return []
    with open(text_path) as f:
        data = json.load(f)
    return data.get("pages", [])


def build_rows():
    """Build all dataset rows by iterating documents and rendering pages."""
    rows = []
    doc_files = sorted(DOCUMENTS_DIR.rglob("*"))
    doc_files = [f for f in doc_files if f.suffix.lower() in (".pdf", ".jpg", ".jpeg", ".png")]

    total = len(doc_files)
    for idx, doc_path in enumerate(doc_files, 1):
        rel_path = str(doc_path.relative_to(DOCUMENTS_DIR))
        ministry, archive_id = parse_path_info(rel_path)
        text_pages = load_text_for_doc(rel_path)

        print(f"[{idx}/{total}] {rel_path}", end="")

        if doc_path.suffix.lower() == ".pdf":
            try:
                images = convert_from_path(str(doc_path), dpi=RENDER_DPI)
            except Exception as e:
                print(f" ERROR rendering: {e}")
                continue

            print(f" ({len(images)} pages)")

            for page_num, img in enumerate(images, 1):
                page_text = ""
                for tp in text_pages:
                    if tp.get("num") == page_num:
                        page_text = tp.get("text", "")
                        break

                rows.append({
                    "image": img,
                    "pdf_source": rel_path,
                    "page_number": page_num,
                    "text": page_text,
                    "ministry": ministry,
                    "archive_id": archive_id,
                })
        else:
            # JPG/PNG — single page image
            print(" (1 page, image)")
            img = PILImage.open(doc_path).convert("RGB")
            page_text = text_pages[0].get("text", "") if text_pages else ""

            rows.append({
                "image": img,
                "pdf_source": rel_path,
                "page_number": 1,
                "text": page_text,
                "ministry": ministry,
                "archive_id": archive_id,
            })

    return rows


DATASET_CARD = """---
language:
  - es
license: cc-by-4.0
tags:
  - history
  - spain
  - 23-F
  - declassified-documents
  - transcripts
  - coup-attempt
  - education
  - spanish-transition
  - document-ai
  - ocr
task_categories:
  - image-to-text
  - text-generation
  - question-answering
pretty_name: "Expediente 23-F: Declassified Documents from the 1981 Spanish Coup Attempt"
size_categories:
  - 1K<n<10K
---

# Expediente 23-F: Declassified Documents from the 1981 Spanish Coup Attempt

A page-level multimodal dataset of declassified Spanish government documents related to the failed coup d'etat of February 23, 1981 (known as 23-F). Each row contains a rendered page image paired with its extracted text, sourced from official state archives.

## Historical Context

On February 23, 1981, Lieutenant Colonel Antonio Tejero stormed the Spanish Congress of Deputies with armed Guardia Civil officers during the investiture vote of Prime Minister Leopoldo Calvo-Sotelo. The coup failed after King Juan Carlos I publicly opposed it in a televised address. These documents were declassified and published by the Spanish Government through the *Portal de Archivos Estatales*.

## Dataset Schema

| Column | Type | Description |
|---|---|---|
| `image` | `Image` | Rendered page image (150 DPI) |
| `pdf_source` | `string` | Relative path to the original PDF or image file |
| `page_number` | `int32` | Page number within the source document (1-indexed) |
| `text` | `string` | Extracted text for the page (OCR or pdf-parse) |
| `ministry` | `string` | Originating ministry (`interior`, `exteriores`, `defensa`) |
| `archive_id` | `string` | Archival signature (e.g., `AGA-83-07633`, `AGMAE-R39017`) |

## Dataset Statistics

| Metric | Value |
|---|---|
| **Total rows (pages)** | 1,224 |
| **Source documents** | 167 |
| **Text coverage** | 100% (all pages have extracted text) |
| **Total extracted text** | ~12.6 million characters |
| **File types** | 155 PDFs (92.8%), 12 JPGs (7.2%) |

### Documents by Ministry

| Ministry | Documents | Description |
|---|---|---|
| `defensa` | 108 | Military intelligence reports (CESID/CNI), internal memos |
| `exteriores` | 31 | Diplomatic cables, embassy communications, verbal notes |
| `interior` | 28 | Wiretap transcripts from the Guardia Civil, phone intercepts between conspirators |

### Document Characteristics

| Property | Breakdown |
|---|---|
| **Format** | 90 typed, 73 scanned, 4 handwritten |
| **Classification level** | 88 *secreto*, 77 *reservado*, 2 *confidencial* |
| **Pages per document** | Min: 1, Max: 312, Mean: 7.3 |
| **Text length per document** | Min: 130 chars, Median: 26.8K chars, Max: 3.45M chars |

## Data Processing Pipeline

### Image Rendering
- **Tool:** `pdf2image` + Poppler
- **Resolution:** 150 DPI (PNG)
- **JPG documents** are loaded directly as single-page images

### Text Extraction
Two extraction methods were used depending on document type:

1. **pdf-parse** (typed documents): Direct text extraction from digitally-created PDFs
2. **Vision-Language OCR** (scanned/handwritten documents):
   - **Model:** [`mlx-community/GLM-OCR-bf16`](https://huggingface.co/mlx-community/GLM-OCR-bf16) running on Apple Silicon via MLX
   - **Input resolution:** 200 DPI
   - **Max tokens per page:** 8,192
   - **Post-processing:** Whitespace normalization, paragraph structure preservation

The `isOcrText` field in the source metadata indicates which method was used per document.

## Usage

```python
from datasets import load_dataset

ds = load_dataset("JorgeAV/23f-expediente")

# Display a page
print(ds["train"][0]["text"])
ds["train"][0]["image"].show()

# Filter by ministry
interior = ds["train"].filter(lambda x: x["ministry"] == "interior")

# Get all pages from a specific document
doc_pages = ds["train"].filter(lambda x: x["pdf_source"] == "interior/guardia-civil/23F_1_conversacion_gc_tejero.pdf")
```

## Intended Uses

- **Historical research** on the Spanish Transition to democracy
- **Document AI** benchmarking: OCR, layout analysis, and document understanding on Spanish historical documents
- **NLP in Spanish**: text extraction quality evaluation, named entity recognition on official/archival language
- **Educational projects** about 20th-century European political history

## Limitations

- OCR quality is lower on handwritten documents (4 out of 167)
- Some scanned pages may contain text artifacts or recognition errors
- Text extraction from multi-column layouts may not preserve reading order perfectly
- All text is in Spanish; no translations are provided

## Source & License

- **Original documents:** Public domain (declassified records from the Spanish Government, published via the *Portal de Archivos Estatales*)
- **Structured dataset:** [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/)

## Associated Project

This dataset powers [23f-expediente](https://github.com/JorgeAV/23f-expediente), an interactive educational web application with an FBI/spy case-file aesthetic for exploring the 23-F documents.
"""


def main():
    api = HfApi()

    # 1. Create repo
    print("Creating dataset repo...")
    create_repo(REPO_ID, repo_type="dataset", exist_ok=True)

    # 2. Build dataset rows
    print("\\nBuilding dataset (rendering PDF pages to images)...")
    rows = build_rows()
    print(f"\\nTotal rows (pages): {len(rows)}")

    # 3. Create HF Dataset
    print("\\nCreating HF Dataset object...")
    features = Features({
        "image": Image(),
        "pdf_source": Value("string"),
        "page_number": Value("int32"),
        "text": Value("string"),
        "ministry": Value("string"),
        "archive_id": Value("string"),
    })
    ds = Dataset.from_dict(
        {col: [r[col] for r in rows] for col in rows[0].keys()},
        features=features,
    )

    # 4. Push to hub
    print(f"\\nPushing {len(ds)} rows to {REPO_ID}...")
    ds.push_to_hub(REPO_ID, private=False)

    # 5. Upload README
    print("Uploading dataset card...")
    with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
        f.write(DATASET_CARD)
        readme_path = f.name
    api.upload_file(
        path_or_fileobj=readme_path,
        path_in_repo="README.md",
        repo_id=REPO_ID,
        repo_type="dataset",
    )
    Path(readme_path).unlink()

    print(f"\\nDone! View at: https://huggingface.co/datasets/{REPO_ID}")


if __name__ == "__main__":
    main()
