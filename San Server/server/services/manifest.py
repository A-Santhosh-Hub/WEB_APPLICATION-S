"""
SanLAN — Manifest Builder Service.

Recursively scans a directory and produces a transfer manifest
containing every file's relative path, size, and modification time.

The manifest is the foundation of folder transfers — it tells
the client exactly what to download and where to put it.
"""

import os
import uuid
import time
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from server.utils.sizes import human_readable_size
from server.utils.formatting import timestamp_from_stat

logger = logging.getLogger("sanlan.manifest")


@dataclass
class ManifestFile:
    """A single file entry in the manifest."""
    path: str           # Relative path from folder root (forward slashes)
    size: int
    modified: str

    def to_dict(self) -> dict:
        return {
            "path": self.path,
            "size": self.size,
            "modified": self.modified,
        }


@dataclass
class TransferManifest:
    """
    Complete manifest for a folder transfer.

    Contains every file that needs to be downloaded,
    with paths relative to the transfer root.
    """
    transfer_id: str
    share_id: str
    root_name: str          # Name of the top-level folder
    root_path: str          # Relative path within the share
    total_files: int = 0
    total_folders: int = 0
    total_bytes: int = 0
    files: list[ManifestFile] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)

    def to_dict(self) -> dict:
        return {
            "transfer_id": self.transfer_id,
            "share_id": self.share_id,
            "root": self.root_name,
            "root_path": self.root_path,
            "total_files": self.total_files,
            "total_folders": self.total_folders,
            "total_bytes": self.total_bytes,
            "total_bytes_human": human_readable_size(self.total_bytes),
            "files": [f.to_dict() for f in self.files],
        }


def build_manifest(
    abs_path: Path,
    share_id: str,
    relative_path: str,
) -> TransferManifest:
    """
    Recursively scan a directory and build a transfer manifest.

    Args:
        abs_path:      Absolute filesystem path to the folder.
        share_id:      The share this folder belongs to.
        relative_path: Path relative to the share root.

    Returns:
        A TransferManifest with all files listed.
    """
    transfer_id = uuid.uuid4().hex[:16]
    root_name = abs_path.name

    manifest = TransferManifest(
        transfer_id=transfer_id,
        share_id=share_id,
        root_name=root_name,
        root_path=relative_path,
    )

    logger.info(f"Building manifest for: {root_name} (transfer {transfer_id})")

    try:
        for root, dirs, files in os.walk(abs_path):
            manifest.total_folders += len(dirs)

            for filename in files:
                filepath = os.path.join(root, filename)
                try:
                    stat = os.stat(filepath)
                    # Build relative path from the folder root, using forward slashes
                    rel = os.path.relpath(filepath, abs_path)
                    rel = rel.replace("\\", "/")

                    manifest.files.append(ManifestFile(
                        path=rel,
                        size=stat.st_size,
                        modified=timestamp_from_stat(stat.st_mtime),
                    ))
                    manifest.total_files += 1
                    manifest.total_bytes += stat.st_size

                except (PermissionError, OSError) as e:
                    logger.warning(f"Cannot access file {filepath}: {e}")
                    continue

    except (PermissionError, OSError) as e:
        logger.error(f"Error walking {abs_path}: {e}")

    logger.info(
        f"Manifest complete: {manifest.total_files} files, "
        f"{human_readable_size(manifest.total_bytes)}"
    )

    return manifest


# In-memory manifest cache (transfer_id -> manifest)
# Manifests are kept for resumability
_manifest_store: dict[str, TransferManifest] = {}


def store_manifest(manifest: TransferManifest) -> None:
    """Store a manifest for later retrieval."""
    _manifest_store[manifest.transfer_id] = manifest
    # Evict old manifests (keep last 50)
    if len(_manifest_store) > 50:
        oldest_key = min(_manifest_store, key=lambda k: _manifest_store[k].created_at)
        del _manifest_store[oldest_key]


def get_manifest(transfer_id: str) -> Optional[TransferManifest]:
    """Retrieve a stored manifest by transfer ID."""
    return _manifest_store.get(transfer_id)
