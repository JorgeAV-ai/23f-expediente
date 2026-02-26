#!/usr/bin/env python3
"""
hf_ocr.py — Generic OCR tool using GLM-OCR on Apple Silicon (MLX).

Extracts text from images and PDFs using the GLM-OCR vision-language model
running natively on Apple Silicon via mlx-vlm.

Usage:
    python scripts/hf_ocr.py image.jpg
    python scripts/hf_ocr.py document.pdf
    python scripts/hf_ocr.py ./folder/
    python scripts/hf_ocr.py document.pdf --format json --output result.json
    python scripts/hf_ocr.py image.jpg --model mlx-community/GLM-OCR-bf16

Requires:
    pip install -r scripts/requirements-ocr.txt
    brew install poppler  (for PDF support)

Environment:
    HF_TOKEN in .env file (used for model download on first run)
"""

import argparse
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DEFAULT_MODEL = "mlx-community/GLM-OCR-bf16"
DEFAULT_PROMPT = "Text Recognition:"
MAX_TOKENS = 8192
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}


# ---------------------------------------------------------------------------
# Model loading (lazy singleton)
# ---------------------------------------------------------------------------

_model_cache = {}


def get_model(model_id: str):
    """Load model and processor, caching for reuse across multiple images."""
    if model_id not in _model_cache:
        from mlx_vlm import load

        print(f"Loading model {model_id}...", file=sys.stderr)
        model, processor = load(model_id)
        _model_cache[model_id] = (model, processor)
        print("Model loaded.", file=sys.stderr)
    return _model_cache[model_id]


# ---------------------------------------------------------------------------
# OCR functions
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
    """Run OCR on a single image file and return extracted text."""
    from mlx_vlm import generate

    model, processor = get_model(model_id)
    formatted = format_prompt(processor, prompt)
    result = generate(
        model,
        processor,
        formatted,
        image_path,
        max_tokens=MAX_TOKENS,
        verbose=False,
    )
    return clean_text(result.text)


def ocr_pdf(pdf_path: str, model_id: str, prompt: str) -> list[dict]:
    """Run OCR on each page of a PDF. Returns list of {num, text} entries."""
    from pdf2image import convert_from_path
    import tempfile

    print(f"Converting PDF pages to images: {pdf_path}", file=sys.stderr)
    images = convert_from_path(pdf_path, dpi=200)
    pages = []

    with tempfile.TemporaryDirectory() as tmpdir:
        for i, img in enumerate(images, start=1):
            img_path = os.path.join(tmpdir, f"page_{i}.png")
            img.save(img_path, "PNG")
            print(f"  OCR page {i}/{len(images)}...", file=sys.stderr)
            text = ocr_image(img_path, model_id, prompt)
            pages.append({"num": i, "text": text})

    return pages


def clean_text(raw: str) -> str:
    """Clean extracted text: collapse whitespace, preserve paragraph breaks."""
    return (
        raw
        .replace("\r\n", "\n")
        .replace("\t", " ")
        .strip()
    )


def build_full_text(pages: list[dict]) -> str:
    """Build concatenated fullText with page markers (matching extract-texts.ts format)."""
    total = len(pages)
    parts = []
    for page in pages:
        parts.append(page["text"])
        parts.append(f"\n\n-- {page['num']} of {total} --\n\n")
    return "".join(parts).strip()


# ---------------------------------------------------------------------------
# Input collection
# ---------------------------------------------------------------------------

def collect_inputs(input_path: str) -> list[str]:
    """Collect image and PDF files from a path (file or directory)."""
    p = Path(input_path)
    if not p.exists():
        print(f"Error: path not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    if p.is_file():
        return [str(p)]

    if p.is_dir():
        files = []
        for ext in IMAGE_EXTENSIONS | {".pdf"}:
            files.extend(str(f) for f in p.rglob(f"*{ext}"))
        files.sort()
        if not files:
            print(f"Error: no image/PDF files found in {input_path}", file=sys.stderr)
            sys.exit(1)
        return files

    print(f"Error: invalid path: {input_path}", file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------------------
# Output formatting
# ---------------------------------------------------------------------------

def process_file(file_path: str, model_id: str, prompt: str) -> dict:
    """Process a single file (image or PDF) and return structured result."""
    ext = Path(file_path).suffix.lower()

    if ext == ".pdf":
        pages = ocr_pdf(file_path, model_id, prompt)
    elif ext in IMAGE_EXTENSIONS:
        text = ocr_image(file_path, model_id, prompt)
        pages = [{"num": 1, "text": text}]
    else:
        print(f"Skipping unsupported file: {file_path}", file=sys.stderr)
        return None

    return {
        "source": file_path,
        "pages": pages,
        "fullText": build_full_text(pages),
    }


def output_result(result: dict, fmt: str, output_path: str | None):
    """Output the result in the specified format."""
    if fmt == "json":
        json_str = json.dumps(result, ensure_ascii=False, indent=2)
        if output_path:
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            Path(output_path).write_text(json_str, encoding="utf-8")
            print(f"Written to {output_path}", file=sys.stderr)
        else:
            print(json_str)
    else:
        text = result["fullText"]
        if output_path:
            Path(output_path).write_text(text, encoding="utf-8")
            print(f"Written to {output_path}", file=sys.stderr)
        else:
            print(text)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="OCR tool using GLM-OCR on Apple Silicon (MLX). "
                    "Extracts text from images and PDFs.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Examples:
  %(prog)s photo.jpg                          # Print text to stdout
  %(prog)s document.pdf                       # OCR all pages of a PDF
  %(prog)s ./scans/                           # Process all files in directory
  %(prog)s doc.pdf --format json -o out.json  # JSON output to file
  %(prog)s doc.pdf --model mlx-community/GLM-OCR-bf16  # Use different model
        """,
    )
    parser.add_argument(
        "input",
        help="Image file, PDF file, or directory to process",
    )
    parser.add_argument(
        "--format", "-f",
        choices=["text", "json"],
        default="text",
        help="Output format: 'text' (default) or 'json' (23F-compatible)",
    )
    parser.add_argument(
        "--output", "-o",
        default=None,
        help="Output file path (default: stdout)",
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

    args = parser.parse_args()

    # Load .env for HF_TOKEN
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)

    # Collect files
    files = collect_inputs(args.input)
    print(f"Processing {len(files)} file(s)...", file=sys.stderr)

    # Process each file
    results = []
    for file_path in files:
        print(f"\n--- {file_path} ---", file=sys.stderr)
        result = process_file(file_path, args.model, args.prompt)
        if result:
            results.append(result)

    # Output
    if not results:
        print("No results.", file=sys.stderr)
        sys.exit(1)

    if len(results) == 1:
        output_result(results[0], args.format, args.output)
    else:
        # Multiple files: always JSON array
        if args.format == "json" or args.output:
            combined = json.dumps(results, ensure_ascii=False, indent=2)
            if args.output:
                Path(args.output).write_text(combined, encoding="utf-8")
                print(f"Written {len(results)} results to {args.output}", file=sys.stderr)
            else:
                print(combined)
        else:
            for r in results:
                print(f"\n=== {r['source']} ===\n")
                print(r["fullText"])


if __name__ == "__main__":
    main()
