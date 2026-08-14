"""
SanLAN — Transfer routes.

APIs for initiating folder transfers, getting manifests,
and streaming ZIP archives as a fallback.
"""

import logging
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse

from server.utils.paths import resolve_safe_path, PathSecurityError
from server.services.manifest import build_manifest, store_manifest, get_manifest
from server.services.archive import stream_zip
from server.utils.formatting import content_disposition_header

logger = logging.getLogger("sanlan.routes.transfers")

router = APIRouter(prefix="/api/transfers", tags=["transfers"])


class StartTransferRequest(BaseModel):
    share_id: str
    path: str


@router.post("/start")
async def start_transfer(req: StartTransferRequest, request: Request):
    """
    Start a folder transfer. Returns the complete transfer manifest.
    """
    config = request.app.state.config
    share = config.get_share(req.share_id)

    if share is None:
        raise HTTPException(status_code=404, detail=f"Share not found: {req.share_id}")

    share_path = config.get_share_path(req.share_id)
    if share_path is None or not share_path.exists():
        raise HTTPException(status_code=503, detail="Share unavailable")

    try:
        abs_path = resolve_safe_path(share_path, req.path)
    except PathSecurityError as e:
        logger.warning(
            f"Path security violation from {request.client.host}: "
            f"{e} (path: {e.attempted_path})"
        )
        raise HTTPException(status_code=403, detail="Access denied")

    if not abs_path.exists() or not abs_path.is_dir():
        raise HTTPException(status_code=404, detail="Directory not found")

    # Build manifest
    manifest = build_manifest(abs_path, req.share_id, req.path)
    store_manifest(manifest)

    return manifest.to_dict()


@router.get("/{transfer_id}/manifest")
async def get_transfer_manifest(transfer_id: str):
    """Retrieve an existing manifest by ID."""
    manifest = get_manifest(transfer_id)
    if not manifest:
        raise HTTPException(status_code=404, detail="Transfer session not found or expired")
    return manifest.to_dict()


@router.get("/{transfer_id}/zip")
async def download_transfer_zip(transfer_id: str, request: Request):
    """
    Download a folder as a ZIP file.
    Streams the ZIP on-the-fly without buffering to disk.
    """
    manifest = get_manifest(transfer_id)
    if not manifest:
        raise HTTPException(status_code=404, detail="Transfer session not found or expired")

    config = request.app.state.config
    share_path = config.get_share_path(manifest.share_id)
    if share_path is None:
        raise HTTPException(status_code=503, detail="Share unavailable")

    try:
        abs_path = resolve_safe_path(share_path, manifest.root_path)
    except PathSecurityError:
        raise HTTPException(status_code=403, detail="Access denied")

    folder_name = manifest.root_name or "folder"
    zip_filename = f"{folder_name}.zip"

    logger.info(
        f"Streaming ZIP for {folder_name} (Transfer: {transfer_id}) "
        f"to {request.client.host}"
    )

    return StreamingResponse(
        stream_zip(abs_path, folder_name),
        media_type="application/zip",
        headers={
            "Content-Disposition": content_disposition_header(zip_filename),
            "Cache-Control": "no-cache",
        },
    )
