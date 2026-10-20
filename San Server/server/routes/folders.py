"""
SanLAN — Folder browsing routes.

Provides share listing and directory browsing APIs.
Every path is validated through the security layer before
touching the filesystem.
"""

import logging
from fastapi import APIRouter, Request, HTTPException

from server.utils.paths import resolve_safe_path, PathSecurityError
from server.services.scanner import scanner

logger = logging.getLogger("sanlan.routes.folders")

router = APIRouter(prefix="/api", tags=["folders"])


@router.get("/shares")
async def list_shares(request: Request):
    """
    List all configured shares.

    Returns:
        List of share objects with id, name, availability status.
    """
    config = request.app.state.config
    return {"shares": config.list_shares()}


@router.get("/browse/{share_id}")
async def browse_share_root(share_id: str, request: Request):
    """
    Browse the root of a share.
    """
    config = request.app.state.config
    share = config.get_share(share_id)

    if share is None:
        raise HTTPException(status_code=404, detail=f"Share not found: {share_id}")

    share_path = config.get_share_path(share_id)
    if share_path is None or not share_path.exists():
        raise HTTPException(
            status_code=503,
            detail=f"Share '{share.name}' is currently unavailable",
        )

    listing = scanner.scan_directory(share_path, relative_path="")

    return {
        "share": {
            "id": share_id,
            "name": share.name,
        },
        "listing": listing.to_dict(),
    }


@router.get("/browse/{share_id}/{path:path}")
async def browse_directory(share_id: str, path: str, request: Request):
    """
    Browse a subdirectory within a share.

    The path parameter is validated against the share root
    to prevent directory traversal attacks.
    """
    config = request.app.state.config
    share = config.get_share(share_id)

    if share is None:
        raise HTTPException(status_code=404, detail=f"Share not found: {share_id}")

    share_path = config.get_share_path(share_id)
    if share_path is None or not share_path.exists():
        raise HTTPException(
            status_code=503,
            detail=f"Share '{share.name}' is currently unavailable",
        )

    # Security: resolve and validate the path
    try:
        abs_path = resolve_safe_path(share_path, path)
    except PathSecurityError as e:
        logger.warning(
            f"Path security violation from {request.client.host}: "
            f"{e} (path: {e.attempted_path})"
        )
        raise HTTPException(status_code=403, detail="Access denied")

    if not abs_path.exists():
        raise HTTPException(status_code=404, detail="Directory not found")

    if not abs_path.is_dir():
        raise HTTPException(
            status_code=400,
            detail="Path is not a directory. Use /api/download/ for files.",
        )

    listing = scanner.scan_directory(abs_path, relative_path=path)

    return {
        "share": {
            "id": share_id,
            "name": share.name,
        },
        "current_path": path,
        "listing": listing.to_dict(),
    }


@router.get("/folder/{share_id}/{path:path}/info")
async def folder_info(share_id: str, path: str, request: Request):
    """
    Get detailed statistics for a folder.

    This performs a recursive walk and can be slow for very large
    directories. It should only be called when the user explicitly
    requests folder stats, never on regular browse.
    """
    config = request.app.state.config
    share = config.get_share(share_id)

    if share is None:
        raise HTTPException(status_code=404, detail=f"Share not found: {share_id}")

    share_path = config.get_share_path(share_id)
    if share_path is None:
        raise HTTPException(status_code=503, detail="Share unavailable")

    try:
        abs_path = resolve_safe_path(share_path, path)
    except PathSecurityError:
        raise HTTPException(status_code=403, detail="Access denied")

    if not abs_path.exists() or not abs_path.is_dir():
        raise HTTPException(status_code=404, detail="Directory not found")

    stats = scanner.get_folder_stats(abs_path, relative_path=path)

    return {
        "share": {
            "id": share_id,
            "name": share.name,
        },
        "path": path,
        "name": abs_path.name,
        "stats": stats,
    }
