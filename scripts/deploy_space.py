#!/usr/bin/env python3
"""Deploy the 23-F Expediente static site to a Hugging Face Space."""

import tempfile
from pathlib import Path

from huggingface_hub import HfApi, create_repo

REPO_ID = "JorgeAV/23f-expediente"
SPACE_SDK = "static"
OUT_DIR = "out"

SPACE_README = """---
title: "Expediente 23-F"
emoji: "\U0001F4C2"
colorFrom: yellow
colorTo: red
sdk: static
pinned: false
license: cc-by-4.0
---
"""


def main():
    api = HfApi()

    # 1. Create Space repo
    print(f"Creating Space: {REPO_ID}")
    create_repo(REPO_ID, repo_type="space", space_sdk=SPACE_SDK, exist_ok=True)

    # 2. Upload Space README
    print("Uploading Space README...")
    with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
        f.write(SPACE_README)
        readme_path = f.name
    api.upload_file(
        path_or_fileobj=readme_path,
        path_in_repo="README.md",
        repo_id=REPO_ID,
        repo_type="space",
    )
    Path(readme_path).unlink()

    # 3. Upload static site excluding original PDFs (~137MB instead of 469MB)
    #    PDFs are already available in the HF dataset (JorgeAV/23f-expediente)
    print("Uploading static site (excluding PDF documents)...")
    api.upload_folder(
        folder_path=OUT_DIR,
        repo_id=REPO_ID,
        repo_type="space",
        ignore_patterns=["*.DS_Store", "documents/**"],
    )

    print(f"\nDone! View at: https://huggingface.co/spaces/{REPO_ID}")


if __name__ == "__main__":
    main()
