"""
SanLAN — Human-readable size utilities.

Converts byte counts to human-friendly strings and back.
"""

from typing import Optional


# Size units in ascending order
_SIZE_UNITS = [
    ("B", 1),
    ("KB", 1024),
    ("MB", 1024 ** 2),
    ("GB", 1024 ** 3),
    ("TB", 1024 ** 4),
]


def human_readable_size(size_bytes: int) -> str:
    """
    Convert a byte count to a human-readable string.

    Examples:
        0          -> "0 B"
        512        -> "512 B"
        1024       -> "1.0 KB"
        1536       -> "1.5 KB"
        1073741824 -> "1.0 GB"
        98765432100 -> "92.0 GB"
    """
    if size_bytes < 0:
        return f"-{human_readable_size(-size_bytes)}"

    if size_bytes == 0:
        return "0 B"

    # Find the largest unit that fits
    for unit_name, unit_bytes in reversed(_SIZE_UNITS):
        if size_bytes >= unit_bytes:
            value = size_bytes / unit_bytes
            # Use no decimal for bytes, one decimal for everything else
            if unit_name == "B":
                return f"{int(value)} B"
            return f"{value:.1f} {unit_name}"

    return f"{size_bytes} B"


def parse_size(human: str) -> Optional[int]:
    """
    Parse a human-readable size string back to bytes.

    Examples:
        "1.5 KB" -> 1536
        "2 GB"   -> 2147483648
        "100 MB" -> 104857600
    """
    human = human.strip().upper()

    for unit_name, unit_bytes in reversed(_SIZE_UNITS):
        if human.endswith(unit_name):
            number_str = human[: -len(unit_name)].strip()
            try:
                return int(float(number_str) * unit_bytes)
            except ValueError:
                return None

    # Try parsing as raw bytes
    try:
        return int(human)
    except ValueError:
        return None


def format_count(count: int) -> str:
    """
    Format a count with thousands separators.

    Examples:
        1234    -> "1,234"
        18432   -> "18,432"
        1000000 -> "1,000,000"
    """
    return f"{count:,}"
