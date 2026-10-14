# ⚡ FluidTube
### Clean, High-Speed YouTube Video & Audio Downloader

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?logo=fastapi&logoColor=white)
![FFmpeg](https://img.shields.io/badge/FFmpeg-Ready-007808?logo=ffmpeg&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

<p align="center">
  A clean, lightweight web utility to download YouTube videos in multiple resolutions (144p to 1080p) or extract pristine MP3 audio.
</p>

</div>

---

## 🌟 Features

- **🎯 Full Resolution Support**:
  - `1080p Full HD`
  - `720p HD`
  - `480p SD`
  - `360p Medium`
  - `144p Low`
  - `Audio Only (192kbps MP3)`
- **⚡ Direct & Fast**:
  - Direct stream download with FFmpeg audio/video multiplexing.
  - No slow re-encoding delays or forced frame interpolation.
- **🌐 Clean, Modern SaaS Interface**:
  - Accessible dropdown for 1-click format & resolution selection.
  - Instant clipboard paste & YouTube link preview (thumbnail, title, author, duration).
  - Real-time download progress bar with live speed & ETA stats.
- **🐳 Production Ready**:
  - Includes `Dockerfile` and `docker-compose.yml`.
  - Automatic background cleanup of temporary downloads to conserve server disk space.

---

## 🚀 Quick Start (Local Run)

### 1. Clone & Setup
```bash
git clone https://github.com/faizalidesk/fluidtube.git
cd fluidtube
pip install -r requirements.txt
```

### 2. Run Server
```bash
python app.py
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser!

---

## 🐳 Docker Deployment

```bash
docker compose up -d --build
```

---

## 📡 API Endpoints

- `POST /api/info`: Fetches video title, author, duration, and thumbnail.
- `POST /api/convert`: Initiates video or audio download in specified resolution.
- `GET /api/progress/{task_id}`: Polls download progress and file stats.
- `GET /api/download/{task_id}`: Serves the processed media file directly to client.
- `GET /api/health`: Server health check.

---

## 📄 License
MIT License. Free and open source for personal and educational use.
