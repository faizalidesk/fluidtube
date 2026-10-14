"""
FluidTube - Video & Audio Downloader Engine
Uses yt-dlp to extract metadata, select target resolution streams (144p to 1080p),
and download/merge media directly using FFmpeg.
"""

import os
import glob
import logging
import threading
from typing import Dict, Any, Callable, Optional, Tuple

import yt_dlp
from utils import sanitize_filename, format_duration, format_filesize
from video_processor import ffmpeg_manager

logger = logging.getLogger("FluidTube.Downloader")


class DownloaderError(Exception):
    """Custom exception for user-friendly error display."""
    pass


class UserCancelledException(Exception):
    """Raised when the user cancels an ongoing task."""
    pass


class Downloader:
    """Manages YouTube metadata extraction and high-speed media downloading."""

    @staticmethod
    def extract_info(url: str) -> Dict[str, Any]:
        """
        Extracts video metadata without downloading.
        Returns dictionary containing title, duration, thumbnail, and author.
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
                raise DownloaderError("YouTube rate limit encountered (HTTP 429). Please wait a few moments.")
            elif "Network is unreachable" in err_msg or "getaddrinfo failed" in err_msg:
                raise DownloaderError("Network connection error. Please verify your internet connection.")
            else:
                raise DownloaderError(f"Could not load video: {err_msg}")
        except Exception as e:
            raise DownloaderError(f"Unexpected error loading video info: {str(e)}")

        if not info:
            raise DownloaderError("No video information could be retrieved.")

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
            "raw_info": info,
        }

    @staticmethod
    def get_target_height(resolution_choice: str) -> Optional[int]:
        """Parses target height integer from resolution choice string."""
        if "1080" in resolution_choice:
            return 1080
        elif "720" in resolution_choice:
            return 720
        elif "480" in resolution_choice:
            return 480
        elif "360" in resolution_choice:
            return 360
        elif "144" in resolution_choice:
            return 144
        return None

    @staticmethod
    def get_target_fps(resolution_choice: str) -> Optional[int]:
        """Parses target FPS from resolution choice string (e.g. 60 or 30)."""
        if "60 FPS" in resolution_choice or "60fps" in resolution_choice.lower():
            return 60
        elif "30 FPS" in resolution_choice or "30fps" in resolution_choice.lower():
            return 30
        return None

    @staticmethod
    def download(
        url: str,
        video_info: Dict[str, Any],
        resolution_choice: str,
        output_dir: str,
        progress_callback: Callable[[float, str, str], None],
        cancel_event: threading.Event,
    ) -> Tuple[str, str]:
        """
        Downloads the requested video or audio file directly to the output folder.

        Args:
            url: YouTube video URL
            video_info: Metadata dictionary from extract_info
            resolution_choice: "1080p Full HD", "720p HD", "480p SD", "360p", "144p", or "Audio Only (MP3)"
            output_dir: Destination folder
            progress_callback: Callback(pct: float 0-100, status_text: str, details_text: str)
            cancel_event: Event to trigger graceful cancellation

        Returns:
            Tuple of (final_filepath: str, format_type: str)
        """
        os.makedirs(output_dir, exist_ok=True)
        clean_title = video_info.get("clean_title", "FluidTube_Video")
        is_audio = "Audio Only" in resolution_choice or "MP3" in resolution_choice
        ffmpeg_bin = ffmpeg_manager.get_ffmpeg_path()

        # yt-dlp progress hook
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

                status_text = f"Downloading ({pct:.0f}% - {speed_str})"
                details_text = f"Downloaded: {format_filesize(downloaded_bytes)} / {format_filesize(total_bytes)}  •  Speed: {speed_str}  •  ETA: {eta_str}"
                progress_callback(pct, status_text, details_text)

            elif status == "finished":
                progress_callback(99.0, "Download finished. Merging streams...", "Finalizing file container...")

        # -------------------------------------------------------------
        # OPTION 1: Audio Only (MP3 Extraction)
        # -------------------------------------------------------------
        if is_audio:
            final_filename = f"{clean_title}.mp3"
            final_path = os.path.join(output_dir, final_filename)

            # Prevent duplicate overwrite
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
                progress_callback(0.0, "Starting audio download...", "Extracting high-quality audio stream...")
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([url])
                progress_callback(100.0, "Complete!", f"Saved MP3: {os.path.basename(final_path)}")
                return final_path, "audio"
            except UserCancelledException:
                Downloader._cleanup_partial(output_dir, clean_title)
                raise
            except Exception as e:
                Downloader._cleanup_partial(output_dir, clean_title)
                raise DownloaderError(f"Audio download failed: {str(e)}")

        # -------------------------------------------------------------
        # OPTION 2: Video Download in Specified Resolution (144p to 1080p)
        # -------------------------------------------------------------
        final_filename = f"{clean_title}.mp4"
        final_path = os.path.join(output_dir, final_filename)

        idx = 1
        while os.path.exists(final_path):
            final_path = os.path.join(output_dir, f"{clean_title}_{idx}.mp4")
            idx += 1

        target_h = Downloader.get_target_height(resolution_choice)
        target_fps = Downloader.get_target_fps(resolution_choice)

        if target_h and target_fps == 60:
            fmt = f"bestvideo[height<={target_h}][fps>=50]+bestaudio/bestvideo[height<={target_h}]+bestaudio/best"
        elif target_h and target_fps == 30:
            fmt = f"bestvideo[height<={target_h}][fps<=30]+bestaudio/bestvideo[height<={target_h}]+bestaudio/best"
        elif target_h:
            fmt = f"bestvideo[height<={target_h}]+bestaudio/best[height<={target_h}]/best"
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
            progress_callback(0.0, f"Connecting to stream ({resolution_choice})...", "Initializing download...")
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

            progress_callback(100.0, "Complete!", f"Saved video: {os.path.basename(final_path)}")
            return final_path, "video"

        except UserCancelledException:
            Downloader._cleanup_partial(output_dir, clean_title)
            raise
        except Exception as e:
            Downloader._cleanup_partial(output_dir, clean_title)
            raise DownloaderError(f"Video download failed: {str(e)}")

    @staticmethod
    def _cleanup_partial(directory: str, prefix: str):
        """Removes unfinished download part files."""
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
