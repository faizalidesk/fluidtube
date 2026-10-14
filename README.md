# ⚡ FluidTube — Web Edition
### Modern YouTube Downloader & 60 FPS Motion Interpolation Web Service

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?logo=fastapi&logoColor=white)
![FFmpeg](https://img.shields.io/badge/FFmpeg-60%20FPS%20Interpolation-007808?logo=ffmpeg&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

<p align="center">
  A modern, high-performance web service that downloads YouTube videos and guarantees a <b>silky 60 FPS output</b>.<br>
  If a video was recorded at 24 FPS or 30 FPS, FluidTube synthesizes missing intermediate frames using <b>FFmpeg motion vector interpolation</b> (<code>framerate=fps=60</code>).
</p>

</div>

---

## 🌟 Key Features

- **⚡ Guaranteed 60 FPS Output**:
  - Automatically identifies whether native 60 FPS streams exist.
  - Automatically runs server-side **FFmpeg motion vector interpolation** for 24fps / 30fps source videos.
  - Zero extra mobile data consumed by the client for interpolation.
- **🌐 Ultra-Modern Web Interface**:
  - Dark glassmorphism UI with responsive design for desktop and mobile.
  - Instant clipboard paste & YouTube link preview.
  - Real-time video metadata display (16:9 thumbnail, duration, uploader, source FPS badge).
- **📊 Real-Time Progress Tracking**:
  - Live progress bar (`0%` ➔ `100%`) with dynamic stage transitions:
    `"Downloading (45% - 5.2 MB/s)"` ➔ `"Converting to 60 FPS via FFmpeg..."` ➔ `"Complete!"`
- **🎯 Flexible Quality Presets**:
  - `1080p Full HD`
  - `720p HD`
  - `Best Quality Available`
  - `Audio Only (MP3)` (192kbps high-fidelity extraction)
- **🐳 Production Ready**:
  - Includes `Dockerfile` and `docker-compose.yml` for 1-click cloud deployment.
  - Automatic background housekeeping of expired downloads to conserve disk space.
  - Clean RESTful API architecture.

---

## 🏗️ Architecture & Workflow

```
   [Client Browser / Web UI]
              │
              ▼ POST /api/convert
      [FastAPI Web Server]
              │
       (Background Worker)
              │
      [yt-dlp Stream Inspector]
              │
    ┌─────────┴────────────────────────────────┐
    ▼                                          ▼
[Source Has Native 60 FPS]         [Source is 24 FPS / 30 FPS]
    │                                          │
    ▼                                          ▼
Direct download of 60fps stream    Download raw MP4 to temp staging
    │                                          │
    │                                          ▼
    │                              [FFmpeg Motion Interpolation]
    │                              ffmpeg -y -i input.mp4
    │                                     -filter:v "framerate=fps=60"
    │                                     -c:v libx264 -preset fast -crf 19
    │                                     -c:a copy output_60fps.mp4
    │                                          │
    │                                          ▼
    │                              [Clean Up Temp Files]
    └──────────────────┬───────────────────────┘
                       ▼
        [Final 60 FPS Video File]
                       │
                       ▼ GET /api/download/{task_id}
            [Browser Direct Download]
```

---

## 🚀 Quick Start (Local Development)

### 1. Clone the Repository
```bash
git clone https://github.com/faizalidesk/fluidtube.git
cd fluidtube
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Ensure FFmpeg is Installed
- **Windows**:
  ```powershell
  winget install Gyan.FFmpeg
  ```
- **Ubuntu / Debian**:
  ```bash
  sudo apt update && sudo apt install -y ffmpeg
  ```
- **macOS (Homebrew)**:
  ```bash
  brew install ffmpeg
  ```

### 4. Run the Web Server
```bash
python app.py
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser!

---

## 🐳 Docker Deployment (Recommended)

Run the entire application in a container with FFmpeg and Python pre-configured:

```bash
docker compose up -d --build
```
The application will be live at `http://localhost:8000`.

---

## 📡 API Reference

### 1. Video Metadata
* **Endpoint**: `POST /api/info`
* **Request Body**:
  ```json
  { "url": "https://www.youtube.com/watch?v=..." }
  ```
* **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "aqz-KE-bpKQ",
      "title": "Big Buck Bunny 60fps",
      "uploader": "Blender Foundation",
      "duration": 635,
      "duration_str": "10:35",
      "thumbnail": "https://...",
      "has_native_60fps": true,
      "max_native_fps": 60
    }
  }
  ```

### 2. Start Conversion
* **Endpoint**: `POST /api/convert`
* **Request Body**:
  ```json
  {
    "url": "https://www.youtube.com/watch?v=...",
    "resolution": "1080p Full HD",
    "force_60fps": true
  }
  ```
* **Response**:
  ```json
  {
    "success": true,
    "task_id": "8f90c377-f26b-4f9e-95d4-6bb73db0ef11"
  }
  ```

### 3. Track Progress
* **Endpoint**: `GET /api/progress/{task_id}`
* **Response**:
  ```json
  {
    "task_id": "8f90c377-f26b-4f9e-95d4-6bb73db0ef11",
    "status": "processing",
    "progress": 65.0,
    "status_text": "Converting to 60 FPS via FFmpeg (65% - 48.2 fps)...",
    "filename": "video_60fps.mp4",
    "download_url": "/api/download/8f90c377-f26b-4f9e-95d4-6bb73db0ef11"
  }
  ```

### 4. Direct Download
* **Endpoint**: `GET /api/download/{task_id}`
* Returns file stream with `Content-Disposition: attachment; filename="..."`.

---

## 📁 Repository Structure

```
.
├── app.py               # FastAPI backend & task coordinator
├── downloader.py        # yt-dlp stream selector & extraction logic
├── video_processor.py   # FFmpeg discovery & motion interpolation
├── utils.py             # Formatters, sanitization & auto-cleanup
├── templates/
│   └── index.html       # Modern dark-mode HTML5 frontend
├── static/
│   ├── css/
│   │   └── style.css    # Responsive styles & glassmorphism theme
│   └── js/
│       └── app.js       # Client async API calls & polling logic
├── downloads/           # Temporary storage for generated files (gitignored)
├── Dockerfile           # Docker container build script
├── docker-compose.yml   # Multi-container orchestration
├── requirements.txt     # Python dependencies
├── .gitignore           # Git ignore definitions
└── README.md            # Project documentation
```

---

## 📄 License

Distributed under the MIT License. Feel free to use, modify, and distribute for personal and educational purposes.
