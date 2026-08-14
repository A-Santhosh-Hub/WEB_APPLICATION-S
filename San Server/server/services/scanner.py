"""
SanLAN — Directory Scanner Service.

Efficiently scans directories using os.scandir() and provides
cached directory listings. Designed to handle folders with
thousands of files without redundant rescans.
"""

import os
import logging
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from server.utils.formatting import timestamp_from_stat
from server.utils.sizes import human_readable_size

logger = logging.getLogger("sanlan.scanner")


@dataclass
class FileEntry:
    """Represents a single file in a directory listing."""
    name: str
    path: str           # Relative path from share root
    size: int
    modified: str        # ISO 8601
    mime_type: str = "application/octet-stream"

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "path": self.path,
            "type": "file",
            "size": self.size,
            "size_human": human_readable_size(self.size),
            "modified": self.modified,
            "mime_type": self.mime_type,
        }


@dataclass
class DirectoryEntry:
    """Represents a directory in a listing."""
    name: str
    path: str           # Relative path from share root
    modified: str        # ISO 8601
    # These are populated lazily, only when explicitly requested
    size: Optional[int] = None
    file_count: Optional[int] = None
    folder_count: Optional[int] = None

    def to_dict(self) -> dict:
        result = {
            "name": self.name,
            "path": self.path,
            "type": "directory",
            "modified": self.modified,
        }
        if self.size is not None:
            result["size"] = self.size
            result["size_human"] = human_readable_size(self.size)
        if self.file_count is not None:
            result["file_count"] = self.file_count
        if self.folder_count is not None:
            result["folder_count"] = self.folder_count
        return result


@dataclass
class DirectoryListing:
    """Complete listing of a directory."""
    name: str
    path: str
    children: list = field(default_factory=list)
    file_count: int = 0
    folder_count: int = 0
    total_size: int = 0

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "path": self.path,
            "type": "directory",
            "file_count": self.file_count,
            "folder_count": self.folder_count,
            "total_size": self.total_size,
            "total_size_human": human_readable_size(self.total_size),
            "children": [c.to_dict() for c in self.children],
        }


@dataclass
class _CacheEntry:
    """Internal cache entry with TTL tracking."""
    listing: DirectoryListing
    timestamp: float
    mtime: float  # Directory mtime at scan time


class DirectoryScanner:
    """
    Scans directories efficiently with TTL caching.

    Cache invalidation strategy:
    - Each cached listing has a TTL (default 30 seconds)
    - If the directory's mtime has changed, cache is invalidated immediately
    - This balances freshness with performance for huge directories
    """

    def __init__(self, cache_ttl_seconds: float = 30.0):
        self._cache: dict[str, _CacheEntry] = {}
        self._cache_ttl = cache_ttl_seconds

    def scan_directory(
        self,
        abs_path: Path,
        relative_path: str = "",
    ) -> DirectoryListing:
        """
        Scan a directory and return its immediate children.

        Uses os.scandir() for efficiency — it reads directory entries
        without additional stat() calls on most operating systems.

        Args:
            abs_path:      Absolute filesystem path (already validated).
            relative_path: Path relative to share root (for display).

        Returns:
            DirectoryListing with immediate children.
        """
        cache_key = str(abs_path)

        # Check cache
        cached = self._cache.get(cache_key)
        if cached is not None:
            now = time.time()
            # Check TTL
            if (now - cached.timestamp) < self._cache_ttl:
                # Check if directory mtime changed
                try:
                    current_mtime = abs_path.stat().st_mtime
                    if current_mtime == cached.mtime:
                        logger.debug(f"Cache hit: {relative_path or '/'}")
                        return cached.listing
                except OSError:
                    pass  # Directory may have been removed; rescan

        # Cache miss or stale — perform scan
        logger.debug(f"Scanning: {relative_path or '/'}")
        listing = self._perform_scan(abs_path, relative_path)

        # Update cache
        try:
            dir_mtime = abs_path.stat().st_mtime
        except OSError:
            dir_mtime = 0.0

        self._cache[cache_key] = _CacheEntry(
            listing=listing,
            timestamp=time.time(),
            mtime=dir_mtime,
        )

        return listing

    def _perform_scan(
        self,
        abs_path: Path,
        relative_path: str,
    ) -> DirectoryListing:
        """
        Actually walk the directory with os.scandir().
        """
        name = abs_path.name or str(abs_path)
        listing = DirectoryListing(name=name, path=relative_path)

        directories: list[DirectoryEntry] = []
        files: list[FileEntry] = []

        try:
            with os.scandir(abs_path) as entries:
                for entry in entries:
                    try:
                        entry_rel_path = (
                            f"{relative_path}/{entry.name}"
                            if relative_path
                            else entry.name
                        )

                        if entry.is_dir(follow_symlinks=False):
                            stat = entry.stat(follow_symlinks=False)
                            directories.append(DirectoryEntry(
                                name=entry.name,
                                path=entry_rel_path,
                                modified=timestamp_from_stat(stat.st_mtime),
                            ))
                            listing.folder_count += 1

                        elif entry.is_file(follow_symlinks=False):
                            stat = entry.stat(follow_symlinks=False)
                            files.append(FileEntry(
                                name=entry.name,
                                path=entry_rel_path,
                                size=stat.st_size,
                                modified=timestamp_from_stat(stat.st_mtime),
                            ))
                            listing.file_count += 1
                            listing.total_size += stat.st_size

                    except (PermissionError, OSError) as e:
                        logger.warning(
                            f"Cannot access {entry.name} in "
                            f"{relative_path}: {e}"
                        )
                        continue

        except PermissionError:
            logger.error(f"Permission denied: {abs_path}")
        except OSError as e:
            logger.error(f"Error scanning {abs_path}: {e}")

        # Sort: directories first (alphabetical), then files (alphabetical)
        directories.sort(key=lambda d: d.name.lower())
        files.sort(key=lambda f: f.name.lower())

        listing.children = directories + files
        return listing

    def get_folder_stats(
        self,
        abs_path: Path,
        relative_path: str = "",
    ) -> dict:
        """
        Recursively calculate folder statistics.

        WARNING: This can be slow for huge directories (100k+ files).
        Only call when explicitly requested, never on browse.
        """
        total_size = 0
        file_count = 0
        folder_count = 0
        largest_files: list[tuple[str, int]] = []

        try:
            for root, dirs, files in os.walk(abs_path):
                folder_count += len(dirs)
                for f in files:
                    try:
                        fp = os.path.join(root, f)
                        size = os.path.getsize(fp)
                        file_count += 1
                        total_size += size

                        # Track top 10 largest files
                        rel = os.path.relpath(fp, abs_path)
                        largest_files.append((rel, size))
                        if len(largest_files) > 50:
                            largest_files.sort(key=lambda x: x[1], reverse=True)
                            largest_files = largest_files[:10]
                    except (PermissionError, OSError):
                        continue
        except (PermissionError, OSError) as e:
            logger.error(f"Error walking {abs_path}: {e}")

        largest_files.sort(key=lambda x: x[1], reverse=True)
        largest_files = largest_files[:10]

        return {
            "total_size": total_size,
            "total_size_human": human_readable_size(total_size),
            "file_count": file_count,
            "folder_count": folder_count,
            "largest_files": [
                {
                    "path": path,
                    "size": size,
                    "size_human": human_readable_size(size),
                }
                for path, size in largest_files
            ],
        }

    def invalidate_cache(self, abs_path: Optional[Path] = None) -> None:
        """
        Clear the scan cache. If abs_path is given, only clear that entry.
        """
        if abs_path is None:
            self._cache.clear()
            logger.debug("Cache fully cleared")
        else:
            cache_key = str(abs_path)
            if cache_key in self._cache:
                del self._cache[cache_key]
                logger.debug(f"Cache cleared for: {abs_path}")


# Module-level singleton
scanner = DirectoryScanner()
