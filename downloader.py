"""
SmoothMotion 60 - Downloader Engine
Uses yt-dlp to extract video metadata, select optimal streams, and download video/audio.
Coordinates with video_processor to perform 60 FPS motion interpolation when native 60fps is not present.
"""

import os
import re
import glob
import logging
import threading
from typing import Optional, Dict, Any, Callable, Tuple

import yt_dlp
from utils import sanitize_filename, format_duration, format_filesize
from video_processor import ffmpeg_manager

logger = logging.getLogger("SmoothMotion.Downloader")


class DownloaderError(Exception):
    """Custom exception for user-friendly error display."""
    pass


class UserCancelledException(Exception):
    """Raised when the user cancels an ongoing download/processing task."""
    pass


class Downloader:
    """Manages YouTube extraction, stream selection, and multi-stage downloading."""

    @staticmethod
    def extract_info(url: str) -> Dict[str, Any]:
        """
        Extracts video metadata without downloading.
        Returns dictionary containing title, duration, thumbnail, fps, and format availability.
        """
        if not url or not url.strip():
            raise DownloaderError("Please provide a valid YouTube URL.")

        url = url.strip()

        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "extract_flat": False,
        }

        ffmpeg_bin = ffmpeg_manager.get_ffmpeg_path()
        if ffmpeg_bin:
            ydl_opts["ffmpeg_location"] = ffmpeg_bin

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
        except yt_dlp.utils.DownloadError as de:
            err_msg = str(de)
            if "Incomplete YouTube ID" in err_msg or "regex" in err_msg.lower():
                raise DownloaderError("Invalid YouTube URL. Please check the video link.")
            elif "Video unavailable" in err_msg or "Private video" in err_msg:
                raise DownloaderError("This video is private, unavailable, or restricted.")
            elif "HTTP Error 429" in err_msg:
                raise DownloaderError("YouTube rate limit encountered (HTTP 429). Please wait a few minutes.")
            elif "Network is unreachable" in err_msg or "getaddrinfo failed" in err_msg:
                raise DownloaderError("Network connection error. Please check your internet connection.")
            else:
                raise DownloaderError(f"Could not load video: {err_msg}")
        except Exception as e:
            raise DownloaderError(f"Unexpected error loading video info: {str(e)}")

        if not info:
            raise DownloaderError("No video information could be retrieved.")

        # Extract formats and calculate FPS capabilities
        formats = info.get("formats", []) or []
        max_native_fps = 0
        has_native_60fps = False
        resolutions_available = set()

        for f in formats:
            if f.get("vcodec") != "none":
                fps = f.get("fps") or 0
                height = f.get("height") or 0
                if height:
                    resolutions_available.add(height)
                if fps > max_native_fps:
                    max_native_fps = int(fps)
                if fps >= 59:
                    has_native_60fps = True

        title = info.get("title", "Unknown Title")
        duration = info.get("duration", 0)
        thumbnail = info.get("thumbnail", "")
        uploader = info.get("uploader") or info.get("channel", "Unknown Channel")
        video_id = info.get("id", "video")

        return {
            "id": video_id,
            "title": title,
            "clean_title": sanitize_filename(title),
            "duration": duration,
            "duration_str": format_duration(duration),
            "thumbnail": thumbnail,
            "uploader": uploader,
            "overall_fps": info.get("fps") or max_native_fps or 30,
            "max_native_fps": max_native_fps,
            "has_native_60fps": has_native_60fps,
            "formats": formats,
            "raw_info": info,
        }

    @staticmethod
    def check_native_60fps_for_resolution(formats: list, resolution_choice: str) -> bool:
        """
        Determines whether a native 60fps stream exists for the requested resolution choice.
        """
        target_height = None
        if "1080p" in resolution_choice:
            target_height = 1080
        elif "720p" in resolution_choice:
            target_height = 720

        for f in formats:
            if f.get("vcodec") == "none":
                continue
            fps = f.get("fps") or 0
            height = f.get("height") or 0

            if fps >= 59:
                if target_height is None:
                    return True
                elif target_height == 1080 and (height == 1080 or (height <= 1080 and height >= 721)):
                    return True
                elif target_height == 720 and (height == 720 or (height <= 720 and height >= 481)):
                    return True

        return False

    @staticmethod
    def download(
        url: str,
        video_info: Dict[str, Any],
        resolution_choice: str,
        force_60fps: bool,
        output_dir: str,
        progress_callback: Callable[[float, str, str], None],
        cancel_event: threading.Event,
    ) -> Tuple[str, bool]:
        """
        Downloads the video and applies 60 FPS motion interpolation if required.

        Args:
            url: YouTube URL
            video_info: Dictionary returned by extract_info
            resolution_choice: Dropdown selection ("1080p Full HD", "720p HD", etc.)
            force_60fps: Whether to guarantee 60 FPS
            output_dir: Target folder to save the final video
            progress_callback: Callable(progress_pct: float, status_label: str, details_label: str)
            cancel_event: Event to signal early termination

        Returns:
            Tuple of (final_filepath: str, used_motion_interpolation: bool)
        """
        os.makedirs(output_dir, exist_ok=True)
        clean_title = video_info.get("clean_title", "SmoothMotion_Video")
        duration = video_info.get("duration", 0)
        formats = video_info.get("formats", [])

        is_audio_only = "Audio Only" in resolution_choice
        native_60_available = Downloader.check_native_60fps_for_resolution(formats, resolution_choice)

        ffmpeg_bin = ffmpeg_manager.get_ffmpeg_path()

        # Hook to update GUI during download
        def ydl_progress_hook(d):
            if cancel_event.is_set():
                raise UserCancelledException("Download cancelled by user.")

            status = d.get("status")
            if status == "downloading":
                downloaded_bytes = d.get("downloaded_bytes", 0)
                total_bytes = d.get("total_bytes") or d.get("total_bytes_estimate", 0)
                speed_str = d.get("_speed_str", "N/A").strip()
                eta_str = d.get("_eta_str", "N/A").strip()

                pct = 0.0
                if total_bytes and total_bytes > 0:
                    pct = min(100.0, (downloaded_bytes / total_bytes) * 100.0)

                pct_str = f"{pct:.0f}%"
                status_text = f"Downloading ({pct_str} - {speed_str})"
                details_text = f"Downloaded: {format_filesize(downloaded_bytes)} / {format_filesize(total_bytes)}  •  Speed: {speed_str}  •  ETA: {eta_str}"

                # Scale yt-dlp percentage if motion interpolation follows
                display_pct = pct * 0.45 if (force_60fps and not native_60_available and not is_audio_only) else pct
                progress_callback(display_pct, status_text, details_text)

            elif status == "finished":
                progress_callback(
                    45.0 if (force_60fps and not native_60_available and not is_audio_only) else 98.0,
                    "Download finished. Finalizing container...",
                    "Processing stream...",
                )

        # -------------------------------------------------------------
        # CASE 1: Audio Only (MP3)
        # -------------------------------------------------------------
        if is_audio_only:
            final_filename = f"{clean_title}.mp3"
            final_path = os.path.join(output_dir, final_filename)

            # Avoid collision
            idx = 1
            while os.path.exists(final_path):
                final_path = os.path.join(output_dir, f"{clean_title}_{idx}.mp3")
                idx += 1

            out_template = os.path.splitext(final_path)[0] + ".%(ext)s"

            ydl_opts = {
                "format": "bestaudio/best",
                "outtmpl": out_template,
                "progress_hooks": [ydl_progress_hook],
                "quiet": True,
                "no_warnings": True,
                "postprocessors": [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": "192",
                    }
                ],
            }
            if ffmpeg_bin:
                ydl_opts["ffmpeg_location"] = ffmpeg_bin

            try:
                progress_callback(0.0, "Starting audio download...", "Extracting best audio...")
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([url])
                progress_callback(100.0, "Complete!", f"Saved MP3: {os.path.basename(final_path)}")
                return final_path, False
            except UserCancelledException:
                Downloader._cleanup_partial(output_dir, clean_title)
                raise
            except Exception as e:
                Downloader._cleanup_partial(output_dir, clean_title)
                raise DownloaderError(f"Audio download failed: {str(e)}")

        # -------------------------------------------------------------
        # CASE 2: Video with Native 60 FPS available (or 60 FPS not forced)
        # -------------------------------------------------------------
        if (force_60fps and native_60_available) or (not force_60fps):
            suffix = "_60fps_native" if (force_60fps and native_60_available) else ""
            final_filename = f"{clean_title}{suffix}.mp4"
            final_path = os.path.join(output_dir, final_filename)

            idx = 1
            while os.path.exists(final_path):
                final_path = os.path.join(output_dir, f"{clean_title}{suffix}_{idx}.mp4")
                idx += 1

            # Format string selection
            if "1080p" in resolution_choice:
                if force_60fps and native_60_available:
                    fmt = "bestvideo[height<=1080][fps>=59]+bestaudio/best[height<=1080][fps>=59]/bestvideo[height<=1080]+bestaudio/best"
                else:
                    fmt = "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best"
            elif "720p" in resolution_choice:
                if force_60fps and native_60_available:
                    fmt = "bestvideo[height<=720][fps>=59]+bestaudio/best[height<=720][fps>=59]/bestvideo[height<=720]+bestaudio/best"
                else:
                    fmt = "bestvideo[height<=720]+bestaudio/best[height<=720]/best"
            else:  # Best Quality Available
                if force_60fps and native_60_available:
                    fmt = "bestvideo[fps>=59]+bestaudio/best[fps>=59]/bestvideo+bestaudio/best"
                else:
                    fmt = "bestvideo+bestaudio/best"

            ydl_opts = {
                "format": fmt,
                "outtmpl": final_path,
                "merge_output_format": "mp4",
                "progress_hooks": [ydl_progress_hook],
                "quiet": True,
                "no_warnings": True,
            }
            if ffmpeg_bin:
                ydl_opts["ffmpeg_location"] = ffmpeg_bin

            try:
                sub_msg = "Downloading native 60 FPS stream..." if (force_60fps and native_60_available) else "Downloading video..."
                progress_callback(0.0, sub_msg, "Initializing stream connection...")

                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([url])

                progress_callback(100.0, "Complete!", f"Saved video: {os.path.basename(final_path)}")
                return final_path, False

            except UserCancelledException:
                Downloader._cleanup_partial(output_dir, clean_title)
                raise
            except Exception as e:
                Downloader._cleanup_partial(output_dir, clean_title)
                raise DownloaderError(f"Video download failed: {str(e)}")

        # -------------------------------------------------------------
        # CASE 3: 60 FPS Forced & Source is <60 FPS -> Motion Interpolation
        # -------------------------------------------------------------
        # a. Create temp staging directory
        temp_dir = os.path.join(output_dir, ".smoothmotion_temp")
        os.makedirs(temp_dir, exist_ok=True)
        temp_file = os.path.join(temp_dir, f"raw_{video_info.get('id', 'temp')}.mp4")

        # Destination 60fps file
        final_filename = f"{clean_title}_60fps.mp4"
        final_path = os.path.join(output_dir, final_filename)
        idx = 1
        while os.path.exists(final_path):
            final_path = os.path.join(output_dir, f"{clean_title}_60fps_{idx}.mp4")
            idx += 1

        # Format selector for highest raw quality
        if "1080p" in resolution_choice:
            fmt = "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best"
        elif "720p" in resolution_choice:
            fmt = "bestvideo[height<=720]+bestaudio/best[height<=720]/best"
        else:
            fmt = "bestvideo+bestaudio/best"

        ydl_opts = {
            "format": fmt,
            "outtmpl": temp_file,
            "merge_output_format": "mp4",
            "progress_hooks": [ydl_progress_hook],
            "quiet": True,
            "no_warnings": True,
        }
        if ffmpeg_bin:
            ydl_opts["ffmpeg_location"] = ffmpeg_bin

        try:
            # 1. Download raw file to temp
            progress_callback(0.0, "Downloading raw video for 60 FPS interpolation...", "Connecting...")
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

            if cancel_event.is_set():
                raise UserCancelledException("Cancelled by user.")

            # 2. Check that raw file exists
            # yt-dlp might have written temp_file or temp_file.mp4
            if not os.path.isfile(temp_file):
                possible = glob.glob(os.path.join(temp_dir, f"raw_{video_info.get('id', 'temp')}*"))
                if possible:
                    temp_file = possible[0]
                else:
                    raise DownloaderError("Raw video download finished but temporary file was not found.")

            # 3. Execute FFmpeg motion interpolation
            progress_callback(45.0, "Converting to 60 FPS via FFmpeg...", "Generating interpolated motion frames...")

            def ffmpeg_progress(pct: float, status_msg: str):
                # Map FFmpeg 0..100% to overall 45%..99%
                overall_pct = 45.0 + (pct * 0.54)
                progress_callback(
                    overall_pct,
                    status_msg,
                    "FFmpeg motion vector interpolation in progress...",
                )

            success = ffmpeg_manager.interpolate_to_60fps(
                input_path=temp_file,
                output_path=final_path,
                total_duration=duration,
                progress_callback=ffmpeg_progress,
                cancel_event=cancel_event,
            )

            if not success:
                if cancel_event.is_set():
                    raise UserCancelledException("Cancelled by user.")
                raise DownloaderError("FFmpeg motion interpolation failed to generate 60 FPS video.")

            # 4. Clean up temporary files
            Downloader._safe_delete(temp_file)
            try:
                if os.path.isdir(temp_dir) and not os.listdir(temp_dir):
                    os.rmdir(temp_dir)
            except OSError:
                pass

            progress_callback(100.0, "Complete!", f"Saved 60 FPS video: {os.path.basename(final_path)}")
            return final_path, True

        except UserCancelledException:
            Downloader._safe_delete(temp_file)
            if os.path.exists(final_path):
                Downloader._safe_delete(final_path)
            raise
        except Exception as e:
            Downloader._safe_delete(temp_file)
            if os.path.exists(final_path):
                Downloader._safe_delete(final_path)
            raise DownloaderError(f"Error during 60 FPS processing: {str(e)}")

    @staticmethod
    def _safe_delete(filepath: str):
        """Safely removes file if it exists."""
        if filepath and os.path.isfile(filepath):
            try:
                os.remove(filepath)
            except OSError:
                pass

    @staticmethod
    def _cleanup_partial(directory: str, prefix: str):
        """Removes temporary or unfinished download parts."""
        patterns = [
            os.path.join(directory, f"{prefix}*.part"),
            os.path.join(directory, f"{prefix}*.ytdl"),
            os.path.join(directory, f"{prefix}*.temp*"),
        ]
        for pat in patterns:
            for f in glob.glob(pat):
                try:
                    os.remove(f)
                except OSError:
                    pass
