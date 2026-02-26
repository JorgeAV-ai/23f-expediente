#!/usr/bin/env python3
"""
ocr_documents.py — OCR integration for the 23F-Expediente project.

Processes PDF and JPG documents using GLM-OCR (MLX) and generates
text JSON files compatible with the project's existing pipeline.
Updates documents.json to reflect new OCR availability.

Usage:
    python scripts/ocr_documents.py                          # All documents
    python scripts/ocr_documents.py --category defensa/cni   # One category
    python scripts/ocr_documents.py --file documento_1.pdf   # One file
    python scripts/ocr_documents.py --dry-run                # Preview only

Requires:
    pip install -r scripts/requirements-ocr.txt
    brew install poppler
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DOCUMENTS_DIR = PROJECT_ROOT / "public" / "documents"
TEXTS_DIR = PROJECT_ROOT / "src" / "data" / "texts"
ANALYSIS_PATH = PROJECT_ROOT / "src" / "data" / "pdf-analysis.json"
DOCUMENTS_JSON_PATH = PROJECT_ROOT / "src" / "data" / "documents.json"

DEFAULT_MODEL = "mlx-community/GLM-OCR-bf16"
DEFAULT_PROMPT = "Text Recognition:"
MAX_TOKENS = 8192
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}


# ---------------------------------------------------------------------------
# Model (lazy singleton)
# ---------------------------------------------------------------------------

_model_cache = {}


def get_model(model_id: str):
    if model_id not in _model_cache:
        from mlx_vlm import load

        print(f"Loading model {model_id}...")
        model, processor = load(model_id)
        _model_cache[model_id] = (model, processor)
        print("Model ready.\n")
    return _model_cache[model_id]


# ---------------------------------------------------------------------------
# OCR
# ---------------------------------------------------------------------------

def format_prompt(processor, prompt: str) -> str:
    """Format prompt with the model's chat template, including image token."""
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image"},
                {"type": "text", "text": prompt},
            ],
        }
    ]
    return processor.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )


def ocr_image(image_path: str, model_id: str, prompt: str) -> str:
    from mlx_vlm import generate

    model, processor = get_model(model_id)
    formatted = format_prompt(processor, prompt)
    result = generate(
        model, processor, formatted, image_path,
        max_tokens=MAX_TOKENS, verbose=False,
    )
    return result.text.strip()


def ocr_pdf(pdf_path: str, model_id: str, prompt: str) -> list[dict]:
    from pdf2image import convert_from_path
    import tempfile

    images = convert_from_path(pdf_path, dpi=200)
    pages = []

    with tempfile.TemporaryDirectory() as tmpdir:
        for i, img in enumerate(images, start=1):
            img_path = os.path.join(tmpdir, f"page_{i}.png")
            img.save(img_path, "PNG")
            print(f"    Page {i}/{len(images)}...", end=" ", flush=True)
            text = ocr_image(img_path, model_id, prompt)
            chars = len(text)
            print(f"({chars} chars)")
            pages.append({"num": i, "text": text})

    return pages


def ocr_image_file(image_path: str, model_id: str, prompt: str) -> list[dict]:
    """OCR a single image file, returning it as a single-page list."""
    print(f"    OCR image...", end=" ", flush=True)
    text = ocr_image(image_path, model_id, prompt)
    print(f"({len(text)} chars)")
    return [{"num": 1, "text": text}]


def build_full_text(pages: list[dict]) -> str:
    total = len(pages)
    parts = []
    for page in pages:
        parts.append(page["text"])
        parts.append(f"\n\n-- {page['num']} of {total} --\n\n")
    return "".join(parts).strip()


# ---------------------------------------------------------------------------
# Document collection
# ---------------------------------------------------------------------------

def collect_documents(category: str | None, filename: str | None) -> list[dict]:
    """Collect all processable documents from the documents directory."""
    documents = []

    for root, _dirs, files in os.walk(DOCUMENTS_DIR):
        for fname in sorted(files):
            ext = Path(fname).suffix.lower()
            if ext not in {".pdf"} | IMAGE_EXTENSIONS:
                continue

            full_path = Path(root) / fname
            relative = full_path.relative_to(DOCUMENTS_DIR)
            cat = str(relative.parent)

            # Apply filters
            if category and not cat.startswith(category):
                continue
            if filename and fname != filename:
                continue

            documents.append({
                "path": str(full_path),
                "relative": str(relative),
                "filename": fname,
                "category": cat,
                "extension": ext,
            })

    documents.sort(key=lambda d: d["relative"])
    return documents


# ---------------------------------------------------------------------------
# Integration with 23F project
# ---------------------------------------------------------------------------

def get_text_output_path(relative_path: str) -> Path:
    """Map a document's relative path to its text JSON output path."""
    # Replace extension with .json
    json_name = Path(relative_path).with_suffix(".json")
    return TEXTS_DIR / json_name


def update_documents_json(processed_relatives: set[str]):
    """Update hasExtractedText in documents.json for processed files."""
    if not DOCUMENTS_JSON_PATH.exists():
        print("Warning: documents.json not found, skipping update.")
        return

    docs = json.loads(DOCUMENTS_JSON_PATH.read_text(encoding="utf-8"))
    updated = 0

    for doc in docs:
        pdf_path = doc.get("pdfPath", "")
        # pdfPath format: /documents/category/filename.pdf
        relative = pdf_path.lstrip("/").removeprefix("documents/")

        if relative in processed_relatives and not doc.get("hasExtractedText"):
            doc["hasExtractedText"] = True
            updated += 1

    if updated > 0:
        DOCUMENTS_JSON_PATH.write_text(
            json.dumps(docs, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"\nUpdated {updated} entries in documents.json (hasExtractedText → true)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="OCR all 23F project documents using GLM-OCR (MLX). "
                    "Generates text JSON files and updates documents.json.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Examples:
  %(prog)s                              # Process all documents
  %(prog)s --category defensa/cni       # Only one category
  %(prog)s --file documento_1.pdf       # Only one file
  %(prog)s --dry-run                    # Preview what would be processed
  %(prog)s --model mlx-community/GLM-OCR-bf16  # Higher quality model
        """,
    )
    parser.add_argument(
        "--category", "-c",
        default=None,
        help="Only process documents in this category (e.g. 'defensa/cni')",
    )
    parser.add_argument(
        "--file", "-f",
        default=None,
        help="Only process this specific filename",
    )
    parser.add_argument(
        "--dry-run", "-n",
        action="store_true",
        help="Show what would be processed without actually running OCR",
    )
    parser.add_argument(
        "--model", "-m",
        default=DEFAULT_MODEL,
        help=f"MLX model to use (default: {DEFAULT_MODEL})",
    )
    parser.add_argument(
        "--prompt", "-p",
        default=DEFAULT_PROMPT,
        help=f"Prompt for the model (default: '{DEFAULT_PROMPT}')",
    )
    parser.add_argument(
        "--skip-existing", "-s",
        action="store_true",
        help="Skip documents that already have text JSON files",
    )

    args = parser.parse_args()

    # Load .env
    env_path = PROJECT_ROOT / ".env"
    if env_path.exists():
        load_dotenv(env_path)

    # Collect documents
    documents = collect_documents(args.category, args.file)

    if not documents:
        print("No documents found matching the criteria.")
        sys.exit(0)

    # Filter out existing if requested
    if args.skip_existing:
        before = len(documents)
        documents = [
            d for d in documents
            if not get_text_output_path(d["relative"]).exists()
        ]
        skipped = before - len(documents)
        if skipped:
            print(f"Skipping {skipped} documents with existing text files.\n")

    print(f"=== 23F OCR Processing ===")
    print(f"Documents to process: {len(documents)}")
    print(f"Model: {args.model}")
    print(f"Prompt: '{args.prompt}'")
    print()

    # Dry run
    if args.dry_run:
        print("DRY RUN — Documents that would be processed:\n")
        for i, doc in enumerate(documents, 1):
            output = get_text_output_path(doc["relative"])
            exists = "EXISTS" if output.exists() else "NEW"
            print(f"  {i:3d}. [{exists}] {doc['relative']}")
        print(f"\nTotal: {len(documents)} documents")
        sys.exit(0)

    # Process
    processed = set()
    errors = []
    start_time = time.time()

    for i, doc in enumerate(documents, 1):
        relative = doc["relative"]
        ext = doc["extension"]
        print(f"[{i}/{len(documents)}] {relative}")

        try:
            if ext == ".pdf":
                pages = ocr_pdf(doc["path"], args.model, args.prompt)
            elif ext in IMAGE_EXTENSIONS:
                pages = ocr_image_file(doc["path"], args.model, args.prompt)
            else:
                continue

            # Build output
            result = {
                "source": relative,
                "pages": pages,
                "fullText": build_full_text(pages),
            }

            # Write JSON
            output_path = get_text_output_path(relative)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(
                json.dumps(result, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            print(f"    → {output_path.relative_to(PROJECT_ROOT)}\n")
            processed.add(relative)

        except Exception as e:
            print(f"    ERROR: {e}\n")
            errors.append({"file": relative, "error": str(e)})

    # Update documents.json
    if processed:
        update_documents_json(processed)

    # Summary
    elapsed = time.time() - start_time
    print(f"\n=== Summary ===")
    print(f"Processed: {len(processed)}/{len(documents)}")
    print(f"Errors:    {len(errors)}")
    print(f"Time:      {elapsed:.1f}s")

    if errors:
        print("\nFailed documents:")
        for err in errors:
            print(f"  - {err['file']}: {err['error']}")


if __name__ == "__main__":
    main()
