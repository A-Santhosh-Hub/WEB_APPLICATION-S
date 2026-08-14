"""
SanLAN — Main application entry point.

Creates the FastAPI app, mounts static files, includes route routers,
and starts the Uvicorn server.

Run with:
    python -m server.main
"""

import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from server import __version__, __app_name__
from server.config import load_config
from server.routes import system, folders, files, transfers
from server.services.network import print_server_banner, get_lan_ip

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------

def setup_logging() -> None:
    """Configure structured logging for the application."""
    log_format = (
        "[%(asctime)s] [%(levelname)-7s] %(name)s — %(message)s"
    )
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        datefmt="%H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
    )
    # Quiet down noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""

    setup_logging()
    logger = logging.getLogger("sanlan.main")

    # Load configuration
    config = load_config()

    # -----------------------------------------------------------------------
    # Lifespan (replaces deprecated on_event)
    # -----------------------------------------------------------------------
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # Startup
        lan_ip = get_lan_ip()
        print_server_banner(
            host=config.server.host,
            port=config.server.port,
            shares=[
                {"name": s.name, "path": s.path}
                for s in config.shares
            ],
            lan_ip=lan_ip,
        )
        yield
        # Shutdown
        logger.info("Server shutting down")

    # Create FastAPI app
    app = FastAPI(
        title=__app_name__,
        description="Private LAN File Sharing System",
        version=__version__,
        docs_url="/api/docs",
        redoc_url=None,
        lifespan=lifespan,
    )

    # Store config in app state for access in routes
    app.state.config = config

    # -----------------------------------------------------------------------
    # CORS — permissive for LAN usage
    # -----------------------------------------------------------------------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=[
            "Content-Length",
            "Content-Range",
            "Accept-Ranges",
            "Content-Disposition",
        ],
    )

    # -----------------------------------------------------------------------
    # Include route routers
    # -----------------------------------------------------------------------
    app.include_router(system.router)
    app.include_router(folders.router)
    app.include_router(files.router)
    app.include_router(transfers.router)

    # -----------------------------------------------------------------------
    # Mount static frontend files
    # -----------------------------------------------------------------------
    web_dir = Path(__file__).parent.parent / "web"
    if web_dir.exists():
        app.mount(
            "/",
            StaticFiles(directory=str(web_dir), html=True),
            name="static",
        )
        logger.info(f"Static files mounted from: {web_dir}")
    else:
        logger.warning(f"Web directory not found: {web_dir}")

    return app


# ---------------------------------------------------------------------------
# Module-level app instance (used by uvicorn)
# ---------------------------------------------------------------------------
app = create_app()


# ---------------------------------------------------------------------------
# Direct execution
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    config = app.state.config

    uvicorn.run(
        "server.main:app",
        host=config.server.host,
        port=config.server.port,
        log_level="info",
        access_log=False,
    )

