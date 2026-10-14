"""
SmoothMotion 60 - Web Utilities
Provides helper functions for filename sanitization, duration/filesize formatting,
and background cleanup of temporary download files.
"""

import os
import re
import time
import logging
from typing import Optional

logger = logging.getLogger("SmoothMotion.Utils")


def sanitize_filename(name: str, max_length: int = 140) -> str:
    """
    Sanitizes string to be a safe, clean filename across all OS platforms (Windows, Linux, macOS).
    Removes reserved characters: < > : " / \\ | ? * and control chars.
    """
    if not name:
        return "SmoothMotion_Video"

    # Remove invalid filesystem characters
    cleaned = re.sub(r'[<>:"/\\|?*]', "", name)
    # Remove control / non-printable characters
    cleaned = "".join(ch for ch in cleaned if ch.isprintable())
    # Strip whitespace and trailing dots
    cleaned = cleaned.strip().strip(".")

    if not cleaned:
        cleaned = "SmoothMotion_Video"

    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length].strip().strip(".")

    return cleaned


def format_duration(seconds: Optional[float]) -> str:
    """Converts duration in seconds to 'MM:SS' or 'HH:MM:SS' format."""
    if seconds is None or seconds < 0:
        return "--:--"

    total_sec = int(seconds)
    hours = total_sec // 3600
    minutes = (total_sec % 3600) // 60
    sec = total_sec % 60

    if hours > 0:
        return f"{hours}:{minutes:02d}:{sec:02d}"
    return f"{minutes:02d}:{sec:02d}"


def format_filesize(byte_count: Optional[float]) -> str:
    """Converts byte count into human-readable B, KB, MB, GB format."""
    if byte_count is None or byte_count <= 0:
        return "--"

    units = ["B", "KB", "MB", "GB", "TB"]
    size = float(byte_count)
    unit_idx = 0
    while size >= 1024.0 and unit_idx < len(units) - 1:
        size /= 1024.0
        unit_idx += 1

    return f"{size:.1f} {units[unit_idx]}"


def cleanup_old_files(directory: str, max_age_hours: float = 2.0):
    """
    Deletes files in directory older than max_age_hours to prevent server disk saturation.
    Safe for production web servers.
    """
    if not os.path.isdir(directory):
        return

    now = time.time()
    cutoff_time = now - (max_age_hours * 3600)

    try:
        for entry in os.scandir(directory):
            if entry.is_file():
                try:
                    if entry.stat().st_mtime < cutoff_time:
                        os.remove(entry.path)
                        logger.info("Cleaned up expired file: %s", entry.name)
                except OSError:
                    pass
    except Exception as e:
        logger.warning("Error during directory cleanup: %s", e)
