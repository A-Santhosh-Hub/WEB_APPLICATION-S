"""
SanLAN — File download routes.

Handles single-file downloads with chunked streaming.
Phase 1: basic streaming with Accept-Ranges header.
Phase 2: full HTTP Range request support.
"""

import logging
import os
from pathlib import Path
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse

from server.utils.paths import resolve_safe_path, PathSecurityError
from server.utils.formatting import (
    content_disposition_header,
    guess_mime_type,
)

logger = logging.getLogger("sanlan.routes.files")

router = APIRouter(prefix="/api", tags=["files"])

# Default chunk size for streaming (1 MB)
DEFAULT_CHUNK_SIZE = 1024 * 1024


def _file_stream_generator(
    file_path: Path,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    start: int = 0,
    end: int | None = None,
):
    """
    Generator that yields file contents in chunks.

    Never loads more than chunk_size bytes into memory at once.

    Args:
        file_path:  Absolute path to the file.
        chunk_size: Size of each chunk in bytes.
        start:      Byte offset to start reading from.
        end:        Byte offset to stop reading at (inclusive).
                    None means read to end of file.
    """
    with open(file_path, "rb") as f:
        if start > 0:
            f.seek(start)

        bytes_remaining = None
        if end is not None:
            bytes_remaining = end - start + 1

        while True:
            read_size = chunk_size
            if bytes_remaining is not None:
                read_size = min(chunk_size, bytes_remaining)
                if read_size <= 0:
                    break

            chunk = f.read(read_size)
            if not chunk:
                break

            yield chunk

            if bytes_remaining is not None:
                bytes_remaining -= len(chunk)


def _parse_range_header(range_header: str, file_size: int):
    """
    Parse an HTTP Range header.

    Supports: bytes=start-end, bytes=start-, bytes=-suffix

    Returns:
        Tuple of (start, end) or None if invalid.
    """
    if not range_header.startswith("bytes="):
        return None

    range_spec = range_header[6:].strip()

    # Handle multiple ranges — we only support single range
    if "," in range_spec:
        return None

    parts = range_spec.split("-", 1)
    if len(parts) != 2:
        return None

    start_str, end_str = parts

    try:
        if start_str and end_str:
            # bytes=start-end
            start = int(start_str)
            end = int(end_str)
        elif start_str:
            # bytes=start-
            start = int(start_str)
            end = file_size - 1
        elif end_str:
            # bytes=-suffix (last N bytes)
            suffix = int(end_str)
            start = max(0, file_size - suffix)
            end = file_size - 1
        else:
            return None
    except ValueError:
        return None

    # Validate bounds
    if start < 0 or start >= file_size:
        return None
    if end < start or end >= file_size:
        end = file_size - 1

    return start, end


@router.get("/download/{share_id}/{path:path}")
async def download_file(share_id: str, path: str, request: Request):
    """
    Download a single file with chunked streaming.

    Supports:
    - Chunked streaming (constant memory usage)
    - Content-Type detection
    - Content-Disposition with Unicode filename support
    - Accept-Ranges header
    - HTTP Range requests (206 Partial Content)
    - Files of any size (KB to multi-GB)
    """
    config = request.app.state.config
    share = config.get_share(share_id)

    if share is None:
        raise HTTPException(status_code=404, detail=f"Share not found: {share_id}")

    share_path = config.get_share_path(share_id)
    if share_path is None:
        raise HTTPException(status_code=503, detail="Share unavailable")

    # Security: validate path
    try:
        abs_path = resolve_safe_path(share_path, path)
    except PathSecurityError as e:
        logger.warning(
            f"Path security violation from {request.client.host}: "
            f"{e} (path: {e.attempted_path})"
        )
        raise HTTPException(status_code=403, detail="Access denied")

    if not abs_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    if not abs_path.is_file():
        raise HTTPException(
            status_code=400,
            detail="Path is a directory. Use /api/browse/ instead.",
        )

    # Get file info
    try:
        file_size = abs_path.stat().st_size
    except OSError as e:
        logger.error(f"Cannot stat file {abs_path}: {e}")
        raise HTTPException(status_code=500, detail="Cannot read file metadata")

    filename = abs_path.name
    mime_type = guess_mime_type(abs_path)
    chunk_size = config.transfer.chunk_size_bytes

    # Check for Range header
    range_header = request.headers.get("range")

    if range_header:
        # Parse range request
        byte_range = _parse_range_header(range_header, file_size)

        if byte_range is None:
            # Invalid range
            raise HTTPException(
                status_code=416,
                detail="Requested range not satisfiable",
                headers={"Content-Range": f"bytes */{file_size}"},
            )

        start, end = byte_range
        content_length = end - start + 1

        logger.info(
            f"Range download: {filename} "
            f"[{start}-{end}/{file_size}] "
            f"from {request.client.host}"
        )

        return StreamingResponse(
            _file_stream_generator(abs_path, chunk_size, start, end),
            status_code=206,
            media_type=mime_type,
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(content_length),
                "Content-Disposition": content_disposition_header(filename),
                "Cache-Control": "no-cache",
            },
        )

    # Full file download
    logger.info(
        f"Download: {filename} ({file_size} bytes) "
        f"from {request.client.host}"
    )

    return StreamingResponse(
        _file_stream_generator(abs_path, chunk_size),
        media_type=mime_type,
        headers={
            "Accept-Ranges": "bytes",
            "Content-Length": str(file_size),
            "Content-Disposition": content_disposition_header(filename),
            "Cache-Control": "no-cache",
        },
    )
