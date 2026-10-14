"""
FluidTube - Web Application Engine
Production-grade FastAPI server powering the YouTube Downloader & 60 FPS Interpolation web service.
"""

import os
import time
import uuid
import logging
import threading
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, HttpUrl

from downloader import Downloader, DownloaderError, UserCancelledException
from video_processor import ffmpeg_manager
from utils import cleanup_old_files, format_filesize

# Initialize logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("FluidTube.Web")

# Directory paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOWNLOADS_DIR = os.path.join(BASE_DIR, "downloads")
STATIC_DIR = os.path.join(BASE_DIR, "static")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

os.makedirs(DOWNLOADS_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(TEMPLATES_DIR, exist_ok=True)

# FastAPI application
app = FastAPI(
    title="FluidTube 60 Web",
    description="YouTube Downloader & 60 FPS Frame Interpolation Web API",
    version="2.0.0",
)

# Mount static assets
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# In-memory task registry
TASKS: Dict[str, Dict[str, Any]] = {}


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class InfoRequest(BaseModel):
    url: str


class ConvertRequest(BaseModel):
    url: str
    resolution: str = "1080p Full HD"
    force_60fps: bool = True


# =============================================================================
# BACKGROUND TASK WORKER
# =============================================================================

def process_video_task(task_id: str, url: str, resolution: str, force_60fps: bool):
    """Executes download and 60 FPS interpolation in a background thread."""
    task = TASKS.get(task_id)
    if not task:
        return

    cancel_event = task["cancel_event"]

    def progress_callback(pct: float, status_text: str, details_text: str):
        task["progress"] = max(0.0, min(100.0, pct))
        task["status_text"] = status_text
        task["details_text"] = details_text
        task["updated_at"] = time.time()

    try:
        task["status"] = "processing"
        task["status_text"] = "Fetching stream metadata..."
        task["details_text"] = "Connecting to YouTube..."

        # 1. Fetch info
        video_info = Downloader.extract_info(url)
        task["video_title"] = video_info.get("title")

        # 2. Download and interpolate
        final_file, was_interpolated = Downloader.download(
            url=url,
            video_info=video_info,
            resolution_choice=resolution,
            force_60fps=force_60fps,
            output_dir=DOWNLOADS_DIR,
            progress_callback=progress_callback,
            cancel_event=cancel_event,
        )

        file_size = os.path.getsize(final_file) if os.path.isfile(final_file) else 0

        task["status"] = "complete"
        task["progress"] = 100.0
        task["status_text"] = "Complete!"
        task["details_text"] = f"Ready for download ({format_filesize(file_size)})"
        task["filepath"] = final_file
        task["filename"] = os.path.basename(final_file)
        task["file_size_formatted"] = format_filesize(file_size)
        task["was_interpolated"] = was_interpolated
        task["download_url"] = f"/api/download/{task_id}"

        logger.info("Task %s completed successfully: %s", task_id, final_file)

    except UserCancelledException:
        task["status"] = "cancelled"
        task["status_text"] = "Cancelled by user"
        task["details_text"] = "Process was stopped."
        logger.info("Task %s cancelled by user", task_id)

    except DownloaderError as de:
        task["status"] = "error"
        task["status_text"] = "Conversion failed"
        task["details_text"] = str(de)
        task["error"] = str(de)
        logger.warning("Task %s failed with DownloaderError: %s", task_id, de)

    except Exception as e:
        task["status"] = "error"
        task["status_text"] = "Internal processing error"
        task["details_text"] = str(e)
        task["error"] = str(e)
        logger.exception("Task %s encountered unexpected exception", task_id)

    finally:
        # Periodic disk maintenance
        cleanup_old_files(DOWNLOADS_DIR, max_age_hours=2.0)


# =============================================================================
# API ROUTES
# =============================================================================

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    """Renders the main web interface."""
    index_file = os.path.join(TEMPLATES_DIR, "index.html")
    if os.path.isfile(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h1>FluidTube Web</h1><p>Frontend template loading...</p>")


@app.get("/api/health")
async def health_check():
    """Returns system status and FFmpeg availability."""
    is_ffmpeg_ok, ffmpeg_path = ffmpeg_manager.detect_ffmpeg()
    return {
        "status": "online",
        "app_name": "FluidTube Web",
        "ffmpeg_available": is_ffmpeg_ok,
        "ffmpeg_path": os.path.basename(ffmpeg_path) if ffmpeg_path else None,
    }


@app.post("/api/info")
async def get_video_info(req: InfoRequest):
    """Extracts video metadata without downloading."""
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Missing YouTube URL")

    try:
        info = Downloader.extract_info(url)
        return {
            "success": True,
            "data": {
                "id": info.get("id"),
                "title": info.get("title"),
                "uploader": info.get("uploader"),
                "duration": info.get("duration"),
                "duration_str": info.get("duration_str"),
                "thumbnail": info.get("thumbnail"),
                "overall_fps": info.get("overall_fps"),
                "max_native_fps": info.get("max_native_fps"),
                "has_native_60fps": info.get("has_native_60fps"),
            },
        }
    except DownloaderError as de:
        raise HTTPException(status_code=400, detail=str(de))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract info: {str(e)}")


@app.post("/api/convert")
async def start_conversion(req: ConvertRequest, background_tasks: BackgroundTasks):
    """Dispatches asynchronous download and 60 FPS motion interpolation."""
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Missing YouTube URL")

    task_id = str(uuid.uuid4())
    cancel_event = threading.Event()

    TASKS[task_id] = {
        "task_id": task_id,
        "status": "queued",
        "progress": 0.0,
        "status_text": "Queued for processing...",
        "details_text": "Waiting for worker thread...",
        "filename": None,
        "filepath": None,
        "was_interpolated": False,
        "error": None,
        "created_at": time.time(),
        "updated_at": time.time(),
        "cancel_event": cancel_event,
    }

    # Run in background daemon thread
    thread = threading.Thread(
        target=process_video_task,
        args=(task_id, url, req.resolution, req.force_60fps),
        daemon=True,
    )
    thread.start()

    return {"success": True, "task_id": task_id}


@app.get("/api/progress/{task_id}")
async def get_task_progress(task_id: str):
    """Poll endpoint for tracking task conversion progress."""
    task = TASKS.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return {
        "task_id": task_id,
        "status": task["status"],
        "progress": task["progress"],
        "status_text": task["status_text"],
        "details_text": task["details_text"],
        "filename": task.get("filename"),
        "file_size": task.get("file_size_formatted"),
        "was_interpolated": task.get("was_interpolated", False),
        "download_url": task.get("download_url"),
        "error": task.get("error"),
    }


@app.post("/api/cancel/{task_id}")
async def cancel_task(task_id: str):
    """Cancels a running task."""
    task = TASKS.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task["cancel_event"].set()
    task["status"] = "cancelling"
    task["status_text"] = "Cancelling..."
    return {"success": True, "message": "Cancellation signal sent."}


@app.get("/api/download/{task_id}")
async def download_file(task_id: str):
    """Directly delivers the processed video or audio file to the client browser."""
    task = TASKS.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    filepath = task.get("filepath")
    if not filepath or not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="Processed file not found on server")

    filename = task.get("filename", os.path.basename(filepath))
    media_type = "video/mp4" if filename.endswith(".mp4") else "audio/mpeg"

    return FileResponse(
        path=filepath,
        filename=filename,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# =============================================================================
# CLI ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting FluidTube Web Server on http://localhost:8000")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
