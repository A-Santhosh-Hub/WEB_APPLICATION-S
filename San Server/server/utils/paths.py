"""
SanLAN — Path Security Utilities

This module is the security foundation of the entire application.
Every user-supplied path MUST pass through resolve_safe_path() before
touching the filesystem.

Defenses implemented:
  - Directory traversal (../ and ..\\ )
  - Absolute path injection (C:\\Windows, /etc)
  - UNC path abuse (\\\\server\\share)
  - Null byte injection
  - URL-encoded traversal (handled by FastAPI before we see it)
  - Symlink/junction escape (resolved by Path.resolve())
"""

from pathlib import Path, PurePosixPath, PureWindowsPath
import re
import os


class PathSecurityError(Exception):
    """Raised when a path fails security validation."""

    def __init__(self, message: str, attempted_path: str = ""):
        self.attempted_path = attempted_path
        super().__init__(message)


# Patterns that should never appear in user-supplied path segments
_DANGEROUS_PATTERNS = re.compile(
    r"(\x00)"             # Null byte
    r"|^\\\\",            # UNC path prefix
    re.IGNORECASE,
)

# Windows drive letter pattern (e.g., C:, D:)
_DRIVE_LETTER = re.compile(r"^[a-zA-Z]:")


def normalize_path_separators(raw_path: str) -> str:
    """
    Normalize all path separators to forward slashes, then collapse
    consecutive separators.
    """
    # Replace backslashes with forward slashes
    normalized = raw_path.replace("\\", "/")
    # Collapse consecutive slashes
    while "//" in normalized:
        normalized = normalized.replace("//", "/")
    return normalized


def validate_path_components(user_path: str) -> None:
    """
    Validate individual path components for dangerous content.

    Raises PathSecurityError if any component is unsafe.
    """
    if not user_path:
        return

    # Check for null bytes anywhere in the path
    if "\x00" in user_path:
        raise PathSecurityError(
            "Path contains null byte",
            attempted_path=user_path,
        )

    # Check for UNC path prefix
    if user_path.startswith("\\\\") or user_path.startswith("//"):
        raise PathSecurityError(
            "UNC paths are not allowed",
            attempted_path=user_path,
        )

    # Check for Windows drive letter
    if _DRIVE_LETTER.match(user_path):
        raise PathSecurityError(
            "Absolute paths with drive letters are not allowed",
            attempted_path=user_path,
        )

    # Check for absolute Unix paths
    if user_path.startswith("/"):
        raise PathSecurityError(
            "Absolute paths are not allowed",
            attempted_path=user_path,
        )


def resolve_safe_path(share_root: Path, user_path: str) -> Path:
    """
    Resolve a user-supplied path against a share root, ensuring the
    result stays within the share root.

    This is the CRITICAL security function. Every filesystem access
    from a client request MUST go through this function.

    Args:
        share_root: The absolute, resolved root path of the share.
        user_path:  The relative path supplied by the client.

    Returns:
        The resolved, validated absolute Path.

    Raises:
        PathSecurityError: If the path escapes the share root or
                          contains dangerous components.
    """
    # Ensure share_root is absolute and resolved
    share_root = share_root.resolve()

    # Handle empty path (root of share)
    if not user_path or user_path in (".", "/", "\\"):
        return share_root

    # SECURITY: Validate the RAW input BEFORE normalization.
    # This catches UNC paths (\\server\share) and absolute paths (/etc)
    # that would be altered by separator normalization.
    validate_path_components(user_path)

    # Normalize separators
    normalized = normalize_path_separators(user_path)

    # Strip leading slashes (we treat all user paths as relative)
    normalized = normalized.lstrip("/")

    # Validate the normalized form as well (catches //server after normalization)
    validate_path_components(normalized)

    # Check individual segments for traversal
    segments = normalized.split("/")
    for segment in segments:
        if segment == "..":
            raise PathSecurityError(
                "Directory traversal (..) is not allowed",
                attempted_path=user_path,
            )
        # Also catch encoded or obfuscated traversal in segment names
        if "\x00" in segment:
            raise PathSecurityError(
                "Path segment contains null byte",
                attempted_path=user_path,
            )

    # Join with share root and resolve (follows symlinks)
    target = (share_root / normalized).resolve()

    # THE JAIL CHECK: ensure resolved path is within share root
    try:
        target.relative_to(share_root)
    except ValueError:
        raise PathSecurityError(
            "Path escapes the share root",
            attempted_path=user_path,
        )

    return target


def validate_share_path(path: str) -> Path:
    """
    Validate that a configured share path exists and is a directory.

    Args:
        path: The filesystem path string from config.

    Returns:
        The resolved Path object.

    Raises:
        ValueError: If the path doesn't exist or isn't a directory.
    """
    share_path = Path(path).resolve()

    if not share_path.exists():
        raise ValueError(f"Share path does not exist: {path}")

    if not share_path.is_dir():
        raise ValueError(f"Share path is not a directory: {path}")

    return share_path


def make_share_id(name: str) -> str:
    """
    Create a URL-safe share identifier from a display name.

    Examples:
        "Games" -> "games"
        "My Projects" -> "my-projects"
        "Game Saves (2024)" -> "game-saves-2024"
    """
    # Lowercase
    share_id = name.lower()
    # Replace spaces and underscores with hyphens
    share_id = re.sub(r"[\s_]+", "-", share_id)
    # Remove non-alphanumeric characters (except hyphens)
    share_id = re.sub(r"[^a-z0-9\-]", "", share_id)
    # Collapse consecutive hyphens
    share_id = re.sub(r"-+", "-", share_id)
    # Strip leading/trailing hyphens
    share_id = share_id.strip("-")

    return share_id or "share"
