"""
SmoothMotion 60 - Video Processing Module
Handles FFmpeg detection, path resolution, and motion interpolation (framerate=fps=60).
"""

import os
import re
import glob
import shutil
import logging
import subprocess
import threading
from typing import Optional, Callable, Tuple

logger = logging.getLogger("SmoothMotion.VideoProcessor")


class FFmpegManager:
    """Manages FFmpeg executable discovery and motion interpolation execution."""

    def __init__(self):
        self._cached_ffmpeg_path: Optional[str] = None
        self._cached_ffprobe_path: Optional[str] = None
        self._is_on_system_path_originally: bool = bool(shutil.which("ffmpeg"))
        self.detect_ffmpeg()

    @property
    def is_on_system_path_originally(self) -> bool:
        """Whether ffmpeg was present in PATH when the app started."""
        return self._is_on_system_path_originally

    def detect_ffmpeg(self) -> Tuple[bool, Optional[str]]:
        """
        Detects FFmpeg on system PATH or common installation directories.
        Returns (is_available, executable_path).
        """
        # 1. Check system PATH
        path_in_env = shutil.which("ffmpeg")
        if path_in_env:
            self._cached_ffmpeg_path = path_in_env
            self._ensure_bin_in_env_path(os.path.dirname(path_in_env))
            return True, path_in_env

        # 2. Check WinGet Gyan.FFmpeg installation directory
        local_app_data = os.environ.get("LOCALAPPDATA", "")
        if local_app_data:
            winget_pattern = os.path.join(
                local_app_data,
                "Microsoft",
                "WinGet",
                "Packages",
                "*FFmpeg*",
                "**",
                "ffmpeg.exe",
            )
            matches = glob.glob(winget_pattern, recursive=True)
            if matches and os.path.isfile(matches[0]):
                self._cached_ffmpeg_path = matches[0]
                self._ensure_bin_in_env_path(os.path.dirname(matches[0]))
                return True, matches[0]

        # 3. Check common Windows standard directories
        common_candidates = [
            r"C:\ffmpeg\bin\ffmpeg.exe",
            r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
            os.path.join(os.path.expanduser("~"), "ffmpeg", "bin", "ffmpeg.exe"),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "bin", "ffmpeg.exe"),
        ]
        for candidate in common_candidates:
            if os.path.isfile(candidate):
                self._cached_ffmpeg_path = candidate
                self._ensure_bin_in_env_path(os.path.dirname(candidate))
                return True, candidate

        self._cached_ffmpeg_path = None
        return False, None

    def set_custom_ffmpeg_path(self, executable_path: str) -> bool:
        """Sets and validates a user-provided FFmpeg executable path."""
        if os.path.isfile(executable_path) and os.access(executable_path, os.X_OK):
            self._cached_ffmpeg_path = executable_path
            self._ensure_bin_in_env_path(os.path.dirname(executable_path))
            return True
        return False

    def _ensure_bin_in_env_path(self, bin_dir: str):
        """Ensures the directory containing ffmpeg.exe is in os.environ['PATH']."""
        current_path = os.environ.get("PATH", "")
        if bin_dir and bin_dir not in current_path:
            os.environ["PATH"] = bin_dir + os.pathsep + current_path

    def get_ffmpeg_path(self) -> Optional[str]:
        """Returns the resolved ffmpeg executable path or None if not available."""
        if not self._cached_ffmpeg_path or not os.path.isfile(self._cached_ffmpeg_path):
            self.detect_ffmpeg()
        return self._cached_ffmpeg_path

    def is_available(self) -> bool:
        """Returns True if FFmpeg is discovered and ready to execute."""
        return self.get_ffmpeg_path() is not None

    def interpolate_to_60fps(
        self,
        input_path: str,
        output_path: str,
        total_duration: Optional[float] = None,
        progress_callback: Optional[Callable[[float, str], None]] = None,
        cancel_event: Optional[threading.Event] = None,
    ) -> bool:
        """
        Executes FFmpeg framerate motion interpolation to generate a 60 FPS output:
        ffmpeg -y -i input.mp4 -filter:v "framerate=fps=60" -c:v libx264 -preset fast -crf 19 -c:a copy output_60fps.mp4

        Args:
            input_path: Source video file path
            output_path: Destination 60 FPS video file path
            total_duration: Total video length in seconds (used for progress computation)
            progress_callback: Function accepting (percentage: float 0-100, status_text: str)
            cancel_event: threading.Event to signal cancellation

        Returns:
            True on success, False on failure or cancellation.
        """
        ffmpeg_bin = self.get_ffmpeg_path()
        if not ffmpeg_bin:
            raise FileNotFoundError("FFmpeg executable not found on system.")

        if not os.path.isfile(input_path):
            raise FileNotFoundError(f"Input file not found: {input_path}")

        # Ensure output directory exists
        out_dir = os.path.dirname(output_path)
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)

        cmd = [
            ffmpeg_bin,
            "-y",
            "-i",
            input_path,
            "-filter:v",
            "framerate=fps=60",
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "19",
            "-c:a",
            "copy",
            output_path,
        ]

        logger.info("Executing motion interpolation: %s", " ".join(cmd))

        # Windows-specific startup info to suppress black CMD popups
        startupinfo = None
        creationflags = 0
        if os.name == "nt":
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            startupinfo.wShowWindow = subprocess.SW_HIDE
            creationflags = subprocess.CREATE_NO_WINDOW

        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
            bufsize=1,
            startupinfo=startupinfo,
            creationflags=creationflags,
            encoding="utf-8",
            errors="replace",
        )

        # Regex patterns to parse FFmpeg stderr progress
        time_pattern = re.compile(r"time=(\d+):(\d+):(\d+(?:\.\d+)?)")
        fps_pattern = re.compile(r"fps=\s*([\d\.]+)")
        speed_pattern = re.compile(r"speed=\s*([\d\.]+)x")

        try:
            # Read stderr line by line
            for line in process.stderr:
                if cancel_event and cancel_event.is_set():
                    logger.info("Cancellation requested during FFmpeg interpolation.")
                    process.terminate()
                    process.wait(timeout=3)
                    if os.path.isfile(output_path):
                        try:
                            os.remove(output_path)
                        except OSError:
                            pass
                    return False

                # Check for progress info
                time_match = time_pattern.search(line)
                if time_match and progress_callback:
                    h, m, s = time_match.groups()
                    current_seconds = int(h) * 3600 + int(m) * 60 + float(s)

                    pct = 0.0
                    if total_duration and total_duration > 0:
                        pct = min(99.0, (current_seconds / total_duration) * 100.0)

                    fps_match = fps_pattern.search(line)
                    speed_match = speed_pattern.search(line)
                    fps_val = fps_match.group(1) if fps_match else "--"
                    speed_val = speed_match.group(1) if speed_match else "--"

                    status_msg = f"Converting to 60 FPS via FFmpeg ({pct:.0f}% - {fps_val} fps, {speed_val}x)"
                    progress_callback(pct, status_msg)

            process.wait()

            if process.returncode != 0:
                if cancel_event and cancel_event.is_set():
                    return False
                raise RuntimeError(f"FFmpeg process failed with exit code {process.returncode}")

            if progress_callback:
                progress_callback(100.0, "FFmpeg motion interpolation complete!")

            return True

        except Exception as e:
            if process.poll() is None:
                process.kill()
            if os.path.isfile(output_path):
                try:
                    os.remove(output_path)
                except OSError:
                    pass
            raise e


# Singleton instance for the application
ffmpeg_manager = FFmpegManager()
