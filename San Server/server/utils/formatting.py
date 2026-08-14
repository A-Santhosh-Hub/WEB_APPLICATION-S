"""
SanLAN — Formatting utilities.

Timestamp formatting, filename sanitization, and MIME type detection.
"""

from datetime import datetime, timezone
from pathlib import Path
import mimetypes
import re
import urllib.parse


def format_timestamp(dt: datetime) -> str:
    """
    Format a datetime to ISO 8601 string.

    If the datetime is naive, it's assumed to be local time.
    """
    if dt.tzinfo is None:
        return dt.isoformat()
    return dt.isoformat()


def timestamp_from_stat(mtime: float) -> str:
    """
    Convert a stat mtime (Unix timestamp) to ISO 8601 string.
    """
    dt = datetime.fromtimestamp(mtime)
    return format_timestamp(dt)


def safe_filename(name: str) -> str:
    """
    Sanitize a filename for use in Content-Disposition headers.

    Removes or replaces characters that are unsafe in HTTP headers
    or Windows filenames.
    """
    # Remove control characters
    name = re.sub(r"[\x00-\x1f\x7f]", "", name)
    # Replace problematic characters for Windows
    name = re.sub(r'[<>:"/\\|?*]', "_", name)
    # Trim whitespace and dots from ends
    name = name.strip(". ")
    return name or "download"


def content_disposition_header(filename: str) -> str:
    """
    Build a Content-Disposition header value supporting Unicode filenames.

    Uses RFC 5987 encoding (filename*=UTF-8'') for non-ASCII names,
    with an ASCII fallback in the filename= parameter.
    """
    safe = safe_filename(filename)

    # Check if filename is pure ASCII
    try:
        safe.encode("ascii")
        return f'attachment; filename="{safe}"'
    except UnicodeEncodeError:
        # RFC 5987: UTF-8 encoded filename
        encoded = urllib.parse.quote(safe, safe="")
        # Provide ASCII fallback
        ascii_fallback = safe.encode("ascii", errors="replace").decode("ascii")
        ascii_fallback = re.sub(r"[^\x20-\x7e]", "_", ascii_fallback)
        return (
            f'attachment; filename="{ascii_fallback}"; '
            f"filename*=UTF-8''{encoded}"
        )


def guess_mime_type(filepath: Path) -> str:
    """
    Guess the MIME type of a file based on its extension.

    Falls back to application/octet-stream for unknown types.
    """
    mime_type, _ = mimetypes.guess_type(str(filepath))
    return mime_type or "application/octet-stream"
