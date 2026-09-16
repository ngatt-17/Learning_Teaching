"""
Text extraction for uploaded course materials.

Each page becomes one `material_pages` row, so citations can point at a real page
number. PDF text comes from pypdf; plain text and Markdown are split on form feeds
(\\f) or, failing that, kept as a single page.
"""
import logging
from pathlib import Path
from typing import List, Optional, Tuple

logger = logging.getLogger("cecs.materials")

SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".md"}


def _pdf_pages(path: Path) -> List[Tuple[int, str]]:
    from pypdf import PdfReader

    reader = PdfReader(str(path))
    return [(i, (page.extract_text() or "").strip()) for i, page in enumerate(reader.pages, start=1)]


def _text_pages(path: Path) -> List[Tuple[int, str]]:
    raw = path.read_text(encoding="utf-8", errors="replace")
    chunks = raw.split("\f") if "\f" in raw else [raw]
    return [(i, chunk.strip()) for i, chunk in enumerate(chunks, start=1)]


def extract_pages(path: Path) -> Tuple[List[Tuple[int, str]], Optional[str]]:
    """
    Return (pages, error). `error` is None on success; otherwise it is a short reason
    shown to the instructor, and the material is stored with status 'failed'.
    """
    try:
        if path.suffix.lower() == ".pdf":
            pages = _pdf_pages(path)
        else:
            pages = _text_pages(path)
    except Exception as exc:  # corrupt or encrypted file
        logger.warning("Extraction failed for %s: %s", path.name, exc)
        return [], f"Could not read the file: {type(exc).__name__}"

    if not pages:
        return [], "The file has no pages"
    if not any(text for _, text in pages):
        return pages, "No extractable text (scanned or image-only file?)"
    return pages, None
