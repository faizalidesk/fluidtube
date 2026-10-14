---
title: FluidTube API
emoji: ⚡
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# ⚡ FluidTube
### Modern YouTube Video & Audio Downloader (React + FastAPI)

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?logo=fastapi&logoColor=white)
![FFmpeg](https://img.shields.io/badge/FFmpeg-Ready-007808?logo=ffmpeg&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Ready-black?logo=vercel&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

<p align="center">
  A modern, high-speed web application to download YouTube videos in multiple resolutions (144p to 1080p) or extract pristine 192kbps MP3 audio.
</p>

</div>

---

## 🏗️ Architecture

| Layer | Technology | Hosting Target |
| :--- | :--- | :--- |
| **Frontend** | **React + Vite** (`frontend/`) | **Vercel** / **Cloudflare Pages** |
| **Backend** | **Python FastAPI + yt-dlp + FFmpeg** | **Railway** / **Render** / **VPS** |

---

## 🌟 Features

- **🎯 Full Resolution Support**:
  - `1080p Full HD` (1920x1080)
  - `720p HD` (1280x720)
  - `480p SD` (854x480)
  - `360p Medium` (640x360)
  - `144p Low` (Data Saver)
  - `Audio Only (192kbps MP3)`
- **⚡ Direct & Fast**:
  - Direct stream download with FFmpeg audio/video multiplexing.
  - No slow re-encoding delays.
- **🌐 Modern Light SaaS UI (React)**:
  - Interactive quality dropdown selector.
  - 1-click clipboard paste & instant video preview.
  - Real-time download progress bar with live speed & ETA stats.
  - Multiple landing page sections: How It Works, Resolutions, Features, FAQ, CTA Banner, and SaaS Footer.
- **🐳 Production & Cloud Ready**:
  - Pre-configured `vercel.json` for 1-click Vercel deployment.
  - Full `Dockerfile` and `docker-compose.yml` for Railway/Render/VPS.
  - Automatic background cleanup of temporary downloads.

---

## 🚀 Local Development

### 1. Run Backend (FastAPI)
```bash
pip install -r requirements.txt
python app.py
```
Backend will start on `http://localhost:8000`.

### 2. Run Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Frontend will start on `http://localhost:3000` (automatically proxies `/api` requests to port 8000).

---

## ☁️ Deployment Guide

### A. Deploy Frontend to Vercel
1. Import this repository into [Vercel](https://vercel.com).
2. Set Environment Variable:
   - `VITE_API_URL`: Your deployed Backend URL (e.g. `https://your-fluidtube-api.up.railway.app`).
3. Click **Deploy**. Vercel will automatically build the React app.

### B. Deploy Frontend to Cloudflare Pages
1. Connect repo in Cloudflare Pages dashboard.
2. Configuration:
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. Environment variables:
   - `VITE_API_URL`: Your deployed backend URL.

### C. Deploy Backend to Railway or Render
1. Connect this repo to [Railway.app](https://railway.app) or [Render.com](https://render.com).
2. Platform will automatically detect the [Dockerfile](./Dockerfile) and build with FFmpeg included.
3. Copy your public backend URL and set it as `VITE_API_URL` on Vercel/Cloudflare.

---

## 📄 License
MIT License. Free and open source for personal and educational use.
