"""
SanLAN — Path Security Tests

Tests the security-critical path resolution and validation functions.
These tests verify defense against directory traversal, path injection,
UNC abuse, null bytes, and other attack vectors.
"""

import os
import sys
import tempfile
from pathlib import Path

import pytest

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from server.utils.paths import (
    resolve_safe_path,
    PathSecurityError,
    validate_share_path,
    make_share_id,
    normalize_path_separators,
)


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture
def share_root(tmp_path):
    """Create a temporary share root with test directories."""
    # Create directory structure
    (tmp_path / "games").mkdir()
    (tmp_path / "games" / "GameA").mkdir()
    (tmp_path / "games" / "GameA" / "bin").mkdir()
    (tmp_path / "games" / "GameA" / "data").mkdir()
    (tmp_path / "games" / "GameB").mkdir()

    # Create some files
    (tmp_path / "games" / "readme.txt").write_text("hello")
    (tmp_path / "games" / "GameA" / "game.exe").write_bytes(b"\x00" * 100)
    (tmp_path / "games" / "GameA" / "bin" / "core.dll").write_bytes(b"\x00" * 50)

    return tmp_path / "games"


# ============================================================
# Valid Path Tests
# ============================================================

class TestValidPaths:
    """Test that legitimate paths resolve correctly."""

    def test_empty_path_returns_root(self, share_root):
        """Empty path should return the share root itself."""
        result = resolve_safe_path(share_root, "")
        assert result == share_root.resolve()

    def test_dot_returns_root(self, share_root):
        """Single dot should return the share root."""
        result = resolve_safe_path(share_root, ".")
        assert result == share_root.resolve()

    def test_simple_subdirectory(self, share_root):
        """Simple subdirectory path should work."""
        result = resolve_safe_path(share_root, "GameA")
        assert result == (share_root / "GameA").resolve()

    def test_nested_subdirectory(self, share_root):
        """Nested path should work."""
        result = resolve_safe_path(share_root, "GameA/bin")
        assert result == (share_root / "GameA" / "bin").resolve()

    def test_file_path(self, share_root):
        """Path to a file should work."""
        result = resolve_safe_path(share_root, "GameA/game.exe")
        assert result == (share_root / "GameA" / "game.exe").resolve()

    def test_deeply_nested(self, share_root):
        """Deep nesting should work."""
        result = resolve_safe_path(share_root, "GameA/bin/core.dll")
        assert result == (share_root / "GameA" / "bin" / "core.dll").resolve()

    def test_forward_slashes(self, share_root):
        """Forward slashes should work on all platforms."""
        result = resolve_safe_path(share_root, "GameA/bin")
        expected = (share_root / "GameA" / "bin").resolve()
        assert result == expected


# ============================================================
# Traversal Attack Tests
# ============================================================

class TestTraversalAttacks:
    """Test that directory traversal attacks are blocked."""

    def test_simple_traversal(self, share_root):
        """../ should be rejected."""
        with pytest.raises(PathSecurityError):
            resolve_safe_path(share_root, "../")

    def test_traversal_with_path(self, share_root):
        """../something should be rejected."""
        with pytest.raises(PathSecurityError):
            resolve_safe_path(share_root, "../etc/passwd")

    def test_deep_traversal(self, share_root):
        """Multiple ../ should be rejected."""
        with pytest.raises(PathSecurityError):
            resolve_safe_path(share_root, "../../../../../../etc/passwd")

    def test_traversal_in_middle(self, share_root):
        """Traversal in the middle of a path should be rejected."""
        with pytest.raises(PathSecurityError):
            resolve_safe_path(share_root, "GameA/../../secret")

    def test_backslash_traversal(self, share_root):
        """..\\  should be normalized and rejected."""
        with pytest.raises(PathSecurityError):
            resolve_safe_path(share_root, "..\\..\\Windows\\System32")

    def test_mixed_slash_traversal(self, share_root):
        """Mixed slashes in traversal should be rejected."""
        with pytest.raises(PathSecurityError):
            resolve_safe_path(share_root, "..\\../etc/passwd")


# ============================================================
# Absolute Path Injection Tests
# ============================================================

class TestAbsolutePathInjection:
    """Test that absolute path injection is blocked."""

    def test_windows_drive_letter(self, share_root):
        """C:\\ should be rejected."""
        with pytest.raises(PathSecurityError):
            resolve_safe_path(share_root, "C:\\Windows\\System32")

    def test_windows_drive_forward_slash(self, share_root):
        """C:/ should be rejected."""
        with pytest.raises(PathSecurityError):
            resolve_safe_path(share_root, "C:/Windows/System32")

    def test_unix_absolute_path(self, share_root):
        """/etc/passwd should be rejected."""
        with pytest.raises(PathSecurityError):
            resolve_safe_path(share_root, "/etc/passwd")


# ============================================================
# UNC Path Tests
# ============================================================

class TestUNCPaths:
    """Test that UNC paths are blocked."""

    def test_unc_path(self, share_root):
        """\\\\server\\share should be rejected."""
        with pytest.raises(PathSecurityError):
            resolve_safe_path(share_root, "\\\\server\\share\\file")

    def test_unc_path_forward_slash(self, share_root):
        """//server/share should be rejected."""
        with pytest.raises(PathSecurityError):
            resolve_safe_path(share_root, "//server/share/file")


# ============================================================
# Null Byte Tests
# ============================================================

class TestNullBytes:
    """Test that null byte injection is blocked."""

    def test_null_byte_in_path(self, share_root):
        """Null byte in path should be rejected."""
        with pytest.raises(PathSecurityError):
            resolve_safe_path(share_root, "GameA\x00.txt")

    def test_null_byte_at_start(self, share_root):
        """Null byte at start should be rejected."""
        with pytest.raises(PathSecurityError):
            resolve_safe_path(share_root, "\x00GameA")


# ============================================================
# Unicode Path Tests
# ============================================================

class TestUnicodePaths:
    """Test that Unicode paths work correctly."""

    def test_unicode_directory(self, tmp_path):
        """Unicode directory names should work."""
        unicode_dir = tmp_path / "共有" / "ゲーム"
        unicode_dir.mkdir(parents=True)
        share_root = tmp_path / "共有"
        result = resolve_safe_path(share_root, "ゲーム")
        assert result == unicode_dir.resolve()

    def test_unicode_with_spaces(self, tmp_path):
        """Paths with spaces should work."""
        spaced_dir = tmp_path / "My Games" / "Game Name"
        spaced_dir.mkdir(parents=True)
        share_root = tmp_path / "My Games"
        result = resolve_safe_path(share_root, "Game Name")
        assert result == spaced_dir.resolve()

    def test_unicode_with_parentheses(self, tmp_path):
        """Paths with parentheses should work."""
        paren_dir = tmp_path / "Games (2024)"
        paren_dir.mkdir(parents=True)
        share_root = tmp_path
        result = resolve_safe_path(share_root, "Games (2024)")
        assert result == paren_dir.resolve()


# ============================================================
# Normalize Separator Tests
# ============================================================

class TestNormalizeSeparators:
    """Test path separator normalization."""

    def test_backslash_to_forward(self):
        assert normalize_path_separators("a\\b\\c") == "a/b/c"

    def test_double_slash_collapsed(self):
        assert normalize_path_separators("a//b///c") == "a/b/c"

    def test_mixed_slashes(self):
        assert normalize_path_separators("a\\b//c\\d") == "a/b/c/d"


# ============================================================
# Share ID Tests
# ============================================================

class TestMakeShareId:
    """Test share ID generation."""

    def test_simple_name(self):
        assert make_share_id("Games") == "games"

    def test_spaces(self):
        assert make_share_id("My Projects") == "my-projects"

    def test_special_characters(self):
        assert make_share_id("Game Saves (2024)") == "game-saves-2024"

    def test_underscores(self):
        assert make_share_id("game_files") == "game-files"


# ============================================================
# Validate Share Path Tests
# ============================================================

class TestValidateSharePath:
    """Test share path validation."""

    def test_valid_directory(self, tmp_path):
        """Existing directory should validate."""
        result = validate_share_path(str(tmp_path))
        assert result == tmp_path.resolve()

    def test_nonexistent_path(self):
        """Non-existent path should raise ValueError."""
        with pytest.raises(ValueError, match="does not exist"):
            validate_share_path("Z:\\nonexistent\\path")

    def test_file_path(self, tmp_path):
        """File path (not directory) should raise ValueError."""
        file_path = tmp_path / "test.txt"
        file_path.write_text("hello")
        with pytest.raises(ValueError, match="not a directory"):
            validate_share_path(str(file_path))
