"""
SanLAN — Network detection utilities.

Detects LAN IP addresses and prints the server startup banner.
"""

import socket
import logging
from typing import Optional

logger = logging.getLogger("sanlan.network")


def get_lan_ip() -> str:
    """
    Detect the primary LAN IP address using the UDP socket trick.

    Creates a UDP socket and "connects" to a public IP (8.8.8.8).
    No data is actually sent — this just causes the OS to select
    the appropriate network interface, revealing our LAN IP.

    Returns:
        The LAN IP address string, or "127.0.0.1" if detection fails.
    """
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            # Does not actually send data — just resolves the interface
            sock.connect(("8.8.8.8", 80))
            ip = sock.getsockname()[0]
        finally:
            sock.close()

        # Validate it's a private IP
        if _is_private_ip(ip):
            return ip
        else:
            logger.warning(f"Detected IP {ip} is not a private address")
            return ip

    except Exception as e:
        logger.warning(f"Failed to detect LAN IP: {e}")
        return "127.0.0.1"


def get_all_private_ips() -> list[str]:
    """
    Get all private IPv4 addresses on this machine.

    Uses socket.getaddrinfo() on the hostname to enumerate interfaces.
    """
    ips = []
    try:
        hostname = socket.gethostname()
        addresses = socket.getaddrinfo(
            hostname, None, socket.AF_INET, socket.SOCK_STREAM
        )
        for addr_info in addresses:
            ip = addr_info[4][0]
            if _is_private_ip(ip) and ip not in ips:
                ips.append(ip)
    except Exception as e:
        logger.warning(f"Failed to enumerate interfaces: {e}")

    if not ips:
        ips.append("127.0.0.1")

    return ips


def _is_private_ip(ip: str) -> bool:
    """
    Check if an IP address is in a private range.

    Private ranges (RFC 1918):
      - 10.0.0.0/8
      - 172.16.0.0/12
      - 192.168.0.0/16

    Also accepts loopback (127.x.x.x).
    """
    parts = ip.split(".")
    if len(parts) != 4:
        return False

    try:
        octets = [int(p) for p in parts]
    except ValueError:
        return False

    first = octets[0]
    second = octets[1]

    if first == 10:
        return True
    if first == 172 and 16 <= second <= 31:
        return True
    if first == 192 and second == 168:
        return True
    if first == 127:
        return True

    return False


def get_hostname() -> str:
    """Get the machine's hostname."""
    try:
        return socket.gethostname()
    except Exception:
        return "unknown"


def print_server_banner(
    host: str,
    port: int,
    shares: list[dict],
    lan_ip: Optional[str] = None,
) -> None:
    """
    Print the startup banner with server info, URLs, and shares.
    """
    if lan_ip is None:
        lan_ip = get_lan_ip()

    hostname = get_hostname()
    separator = "=" * 48

    lines = [
        "",
        separator,
        "             SanLAN Server",
        separator,
        "",
        f"  Status:    RUNNING",
        f"  Hostname:  {hostname}",
        "",
        f"  Local:     http://127.0.0.1:{port}",
        f"  LAN:       http://{lan_ip}:{port}",
        "",
    ]

    if shares:
        lines.append("  Shares:")
        for share in shares:
            name = share.get("name", "Unnamed")
            path = share.get("path", "Unknown")
            lines.append(f"    {name}")
            lines.append(f"    Path: {path}")
            lines.append("")
    else:
        lines.append("  Shares:    (none configured)")
        lines.append("")

    lines.extend([
        "  Press CTRL+C to stop.",
        "",
        separator,
        "",
    ])

    banner = "\n".join(lines)
    print(banner)
    logger.info(f"Server started on http://{lan_ip}:{port}")
