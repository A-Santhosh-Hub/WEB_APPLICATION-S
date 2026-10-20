"""
SanLAN — Streaming ZIP Archive Service.

Creates ZIP archives on-the-fly without buffering the entire archive
in memory or on disk. Files are read in chunks and fed directly into
the ZIP stream.

This is the fallback for browsers that don't support the
File System Access API (Firefox, Safari).
"""

import os
import io
import struct
import zlib
import time
import logging
from pathlib import Path
from typing import Generator

logger = logging.getLogger("sanlan.archive")

# We implement a custom streaming ZIP writer because Python's zipfile
# module requires seekable output (can't stream). Our implementation
# writes LOCAL_FILE_HEADER + data + DATA_DESCRIPTOR for each file,
# then a CENTRAL_DIRECTORY at the end. This is the "streaming" ZIP
# format that browsers can download progressively.

# ZIP constants
_LOCAL_FILE_HEADER_SIG = b'PK\x03\x04'
_CENTRAL_DIR_SIG = b'PK\x01\x02'
_END_CENTRAL_DIR_SIG = b'PK\x05\x06'
_DATA_DESCRIPTOR_SIG = b'PK\x07\x08'
_ZIP_VERSION = 20  # 2.0
_ZIP64_VERSION = 45  # 4.5
_FLAG_DATA_DESCRIPTOR = 0x0008
_FLAG_UTF8 = 0x0800
_METHOD_STORED = 0


def stream_zip(
    root_path: Path,
    folder_name: str,
    chunk_size: int = 1024 * 1024,
) -> Generator[bytes, None, None]:
    """
    Stream a ZIP archive of a folder, yielding chunks.

    Files are stored without compression (STORED method) for speed,
    since LAN transfers are not bottlenecked by bandwidth and
    compression would add CPU overhead for large game files
    (which are typically already compressed).

    Args:
        root_path:   Absolute path to the folder to archive.
        folder_name: Name to use as the root folder in the ZIP.
        chunk_size:  Read chunk size in bytes.

    Yields:
        Bytes of the ZIP archive.
    """
    central_directory_entries = []
    offset = 0

    # Walk the directory
    for dirpath, dirnames, filenames in os.walk(root_path):
        for filename in filenames:
            abs_file = os.path.join(dirpath, filename)
            rel_path = os.path.relpath(abs_file, root_path)
            zip_path = f"{folder_name}/{rel_path}".replace("\\", "/")

            try:
                file_size = os.path.getsize(abs_file)
            except OSError:
                continue

            encoded_path = zip_path.encode("utf-8")

            # --- Local file header ---
            # We use data descriptor (flag bit 3) so we don't need
            # CRC/size upfront
            local_header = struct.pack(
                "<4sHHHHHIIIHH",
                _LOCAL_FILE_HEADER_SIG,
                _ZIP_VERSION,           # version needed
                _FLAG_DATA_DESCRIPTOR | _FLAG_UTF8,  # flags
                _METHOD_STORED,         # compression method
                0,                      # mod time
                0,                      # mod date
                0,                      # CRC-32 (in data descriptor)
                0,                      # compressed size (in data descriptor)
                0,                      # uncompressed size (in data descriptor)
                len(encoded_path),      # filename length
                0,                      # extra field length
            )
            local_header += encoded_path

            yield local_header
            header_size = len(local_header)

            # --- File data ---
            crc = 0
            bytes_written = 0
            try:
                with open(abs_file, "rb") as f:
                    while True:
                        chunk = f.read(chunk_size)
                        if not chunk:
                            break
                        crc = zlib.crc32(chunk, crc) & 0xFFFFFFFF
                        bytes_written += len(chunk)
                        yield chunk
            except (PermissionError, OSError) as e:
                logger.warning(f"Cannot read {abs_file}: {e}")
                # File data might be partial, but ZIP should still be parseable
                # with the data descriptor

            # --- Data descriptor ---
            data_desc = struct.pack(
                "<4sIII",
                _DATA_DESCRIPTOR_SIG,
                crc,
                bytes_written,  # compressed size (STORED = same)
                bytes_written,  # uncompressed size
            )
            yield data_desc

            # Record for central directory
            central_directory_entries.append({
                "encoded_path": encoded_path,
                "crc": crc,
                "size": bytes_written,
                "offset": offset,
            })

            offset += header_size + bytes_written + len(data_desc)

    # --- Central directory ---
    central_dir_offset = offset
    central_dir_size = 0

    for entry in central_directory_entries:
        cd_header = struct.pack(
            "<4sHHHHHHIIIHHHHHII",
            _CENTRAL_DIR_SIG,
            _ZIP_VERSION,           # version made by
            _ZIP_VERSION,           # version needed
            _FLAG_DATA_DESCRIPTOR | _FLAG_UTF8,  # flags
            _METHOD_STORED,         # compression
            0,                      # mod time
            0,                      # mod date
            entry["crc"],
            entry["size"],          # compressed
            entry["size"],          # uncompressed
            len(entry["encoded_path"]),
            0,                      # extra length
            0,                      # comment length
            0,                      # disk number start
            0,                      # internal attrs
            0,                      # external attrs
            entry["offset"],        # local header offset
        )
        cd_header += entry["encoded_path"]
        yield cd_header
        central_dir_size += len(cd_header)

    # --- End of central directory ---
    eocd = struct.pack(
        "<4sHHHHIIH",
        _END_CENTRAL_DIR_SIG,
        0,                              # disk number
        0,                              # disk with central dir
        len(central_directory_entries),  # entries on this disk
        len(central_directory_entries),  # total entries
        central_dir_size,               # central dir size
        central_dir_offset,             # central dir offset
        0,                              # comment length
    )
    yield eocd
