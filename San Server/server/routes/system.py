"""
SanLAN — System routes.

Health check and server info endpoints.
"""

import platform
from fastapi import APIRouter, Request

from server import __version__, __app_name__
from server.services.network import get_lan_ip, get_hostname

router = APIRouter(prefix="/api", tags=["system"])


@router.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "app": __app_name__, "version": __version__}


@router.get("/info")
async def server_info(request: Request):
    """
    Return server information including hostname, IP, version,
    and share summary.
    """
    config = request.app.state.config
    lan_ip = get_lan_ip()

    return {
        "app": __app_name__,
        "version": __version__,
        "hostname": get_hostname(),
        "platform": platform.system(),
        "lan_ip": lan_ip,
        "port": config.server.port,
        "url": f"http://{lan_ip}:{config.server.port}",
        "shares_count": len(config._share_map),
    }
