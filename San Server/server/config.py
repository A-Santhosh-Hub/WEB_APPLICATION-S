"""
SanLAN — Configuration loader.

Loads and validates config.json, providing typed access to all settings.
Generates a default config if none exists.
"""

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from server.utils.paths import validate_share_path, make_share_id

logger = logging.getLogger("sanlan.config")

# Default config file location (relative to project root)
DEFAULT_CONFIG_PATH = Path(__file__).parent.parent / "config.json"


@dataclass
class ShareConfig:
    """Configuration for a single shared folder."""
    name: str
    path: str
    read_only: bool = True
    share_id: str = ""

    def __post_init__(self):
        if not self.share_id:
            self.share_id = make_share_id(self.name)


@dataclass
class ServerConfig:
    """Configuration for the server."""
    host: str = "0.0.0.0"
    port: int = 8080


@dataclass
class TransferConfig:
    """Configuration for file transfers."""
    chunk_size_kb: int = 1024       # 1 MB default
    max_concurrent_transfers: int = 5

    @property
    def chunk_size_bytes(self) -> int:
        return self.chunk_size_kb * 1024


@dataclass
class SecurityConfig:
    """Configuration for authentication."""
    require_pin: bool = False
    pin: str = ""


@dataclass
class AppConfig:
    """Root application configuration."""
    server: ServerConfig = field(default_factory=ServerConfig)
    shares: list[ShareConfig] = field(default_factory=list)
    transfer: TransferConfig = field(default_factory=TransferConfig)
    security: SecurityConfig = field(default_factory=SecurityConfig)

    # Computed: maps share_id -> ShareConfig for quick lookup
    _share_map: dict[str, ShareConfig] = field(
        default_factory=dict, init=False, repr=False
    )
    # Computed: maps share_id -> resolved Path
    _share_paths: dict[str, Path] = field(
        default_factory=dict, init=False, repr=False
    )

    def __post_init__(self):
        self._build_share_map()

    def _build_share_map(self) -> None:
        """Build the share lookup maps, validating paths."""
        self._share_map.clear()
        self._share_paths.clear()

        for share in self.shares:
            if share.share_id in self._share_map:
                logger.warning(
                    f"Duplicate share ID '{share.share_id}' — "
                    f"skipping '{share.name}'"
                )
                continue

            try:
                resolved = validate_share_path(share.path)
                self._share_map[share.share_id] = share
                self._share_paths[share.share_id] = resolved
                logger.info(
                    f"Share registered: {share.name} "
                    f"({share.share_id}) -> {resolved}"
                )
            except ValueError as e:
                logger.error(f"Invalid share '{share.name}': {e}")

    def get_share(self, share_id: str) -> Optional[ShareConfig]:
        """Look up a share by its ID."""
        return self._share_map.get(share_id)

    def get_share_path(self, share_id: str) -> Optional[Path]:
        """Look up the resolved filesystem path for a share."""
        return self._share_paths.get(share_id)

    def list_shares(self) -> list[dict]:
        """Return share info suitable for the API response."""
        result = []
        for share_id, share in self._share_map.items():
            resolved = self._share_paths.get(share_id)
            result.append({
                "id": share_id,
                "name": share.name,
                "path": share.path,
                "read_only": share.read_only,
                "available": resolved is not None and resolved.exists(),
            })
        return result


def _generate_default_config(config_path: Path) -> None:
    """Write a default config.json file."""
    default = {
        "server": {
            "host": "0.0.0.0",
            "port": 8080,
        },
        "shares": [
            {
                "name": "Shared",
                "path": str(Path.home() / "Desktop" / "SanLAN_Share"),
                "read_only": True,
            }
        ],
        "transfer": {
            "chunk_size_kb": 1024,
            "max_concurrent_transfers": 5,
        },
        "security": {
            "require_pin": False,
            "pin": "",
        },
    }

    config_path.parent.mkdir(parents=True, exist_ok=True)
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(default, f, indent=2)

    logger.info(f"Generated default config: {config_path}")


def load_config(config_path: Optional[Path] = None) -> AppConfig:
    """
    Load configuration from a JSON file.

    If the file doesn't exist, generates a default config.

    Args:
        config_path: Path to config.json. Defaults to project root.

    Returns:
        Validated AppConfig instance.
    """
    if config_path is None:
        config_path = DEFAULT_CONFIG_PATH

    config_path = Path(config_path)

    if not config_path.exists():
        logger.warning(f"Config not found at {config_path}, generating default")
        _generate_default_config(config_path)

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in {config_path}: {e}")
        raise SystemExit(f"Error: Invalid config file — {e}")
    except OSError as e:
        logger.error(f"Cannot read {config_path}: {e}")
        raise SystemExit(f"Error: Cannot read config — {e}")

    # Parse server section
    server_raw = raw.get("server", {})
    server = ServerConfig(
        host=server_raw.get("host", "0.0.0.0"),
        port=server_raw.get("port", 8080),
    )

    # Parse shares section
    shares_raw = raw.get("shares", [])
    shares = []
    for s in shares_raw:
        if "name" not in s or "path" not in s:
            logger.warning(f"Share missing name/path, skipping: {s}")
            continue
        shares.append(ShareConfig(
            name=s["name"],
            path=s["path"],
            read_only=s.get("read_only", True),
        ))

    # Parse transfer section
    transfer_raw = raw.get("transfer", {})
    transfer = TransferConfig(
        chunk_size_kb=transfer_raw.get("chunk_size_kb", 1024),
        max_concurrent_transfers=transfer_raw.get(
            "max_concurrent_transfers", 5
        ),
    )

    # Parse security section
    security_raw = raw.get("security", {})
    security = SecurityConfig(
        require_pin=security_raw.get("require_pin", False),
        pin=security_raw.get("pin", ""),
    )

    config = AppConfig(
        server=server,
        shares=shares,
        transfer=transfer,
        security=security,
    )

    logger.info(
        f"Config loaded: {len(config._share_map)} share(s) active, "
        f"port {config.server.port}"
    )

    return config
