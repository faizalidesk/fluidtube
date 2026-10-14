import React, { useState, useRef, useEffect } from "react";
import { API_BASE_URL } from "../config";

export default function ConverterCard() {
  const [url, setUrl] = useState("");
  const [resolution, setResolution] = useState("1080p Full HD");
  const [videoInfo, setVideoInfo] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [detailsText, setDetailsText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const activeTaskIdRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const inputRef = useRef(null);

  // Clear polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Compute CTA Button label
  function getButtonLabel() {
    if (isDownloading) return "Processing...";
    if (resolution.includes("Audio")) return "Download MP3 Audio";
    if (resolution.includes("1080p")) return "Download Video (1080p Full HD)";
    if (resolution.includes("720p")) return "Download Video (720p HD)";
    if (resolution.includes("480p")) return "Download Video (480p SD)";
    if (resolution.includes("360p")) return "Download Video (360p Medium)";
    if (resolution.includes("144p")) return "Download Video (144p Low)";
    return "Download Video (Best Quality)";
  }

  // Handle Clipboard Paste
  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setUrl(text.trim());
        fetchInfo(text.trim());
      }
    } catch {
      setError("Could not access clipboard. Please paste the link manually.");
    }
  }

  // Fetch Video Info
  async function fetchInfo(urlToFetch) {
    const targetUrl = (urlToFetch || url).trim();
    if (!targetUrl) {
      setError("Please enter a valid YouTube video URL.");
      return;
    }

    setError(null);
    setIsFetching(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.detail || "Failed to load video information.");
      }

      setVideoInfo(resData.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsFetching(false);
    }
  }

  // Start Download
  async function handleStartDownload() {
    const targetUrl = url.trim();
    if (!targetUrl) {
      setError("Please enter a YouTube video URL first.");
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    setError(null);
    setResult(null);
    setIsDownloading(true);
    setProgress(0);
    setStatusText("Initiating download...");
    setDetailsText("Connecting to YouTube stream...");

    try {
      const res = await fetch(`${API_BASE_URL}/api/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl, resolution }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.detail || "Failed to start download.");
      }

      activeTaskIdRef.current = resData.task_id;
      startProgressPolling(resData.task_id);
    } catch (err) {
      setError(err.message);
      setIsDownloading(false);
    }
  }

  // Poll Download Progress
  function startProgressPolling(taskId) {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/progress/${taskId}`);
        if (!res.ok) throw new Error("Unable to track task progress.");

        const task = await res.json();
        setProgress(Math.max(0, Math.min(100, task.progress || 0)));
        if (task.status_text) setStatusText(task.status_text);
        if (task.details_text) setDetailsText(task.details_text);

        if (task.status === "complete") {
          clearInterval(pollIntervalRef.current);
          setIsDownloading(false);
          const fullDownloadUrl = task.download_url.startsWith("http")
            ? task.download_url
            : `${API_BASE_URL}${task.download_url}`;
          setResult({
            filename: task.filename || "video.mp4",
            file_size: task.file_size || "--",
            download_url: fullDownloadUrl,
          });
        } else if (task.status === "error") {
          clearInterval(pollIntervalRef.current);
          setIsDownloading(false);
          setError(task.error || "Download failed.");
        } else if (task.status === "cancelled") {
          clearInterval(pollIntervalRef.current);
          setIsDownloading(false);
          setError("Download was cancelled.");
        }
      } catch (err) {
        clearInterval(pollIntervalRef.current);
        setIsDownloading(false);
        setError(err.message);
      }
    }, 600);
  }

  // Cancel Download
  async function handleCancel() {
    if (!activeTaskIdRef.current) return;
    try {
      await fetch(`${API_BASE_URL}/api/cancel/${activeTaskIdRef.current}`, {
        method: "POST",
      });
      setStatusText("Cancelling...");
    } catch {
      // Ignored
    }
  }

  // Reset for next conversion
  function handleReset() {
    setUrl("");
    setVideoInfo(null);
    setResult(null);
    setError(null);
    activeTaskIdRef.current = null;
    if (inputRef.current) inputRef.current.focus();
  }

  return (
    <div className="converter-showcase-wrapper" id="converter">
      <div className="converter-card">
        {/* Top Window Bar */}
        <div className="card-topbar">
          <div className="mac-dots">
            <span className="dot dot-red"></span>
            <span className="dot dot-yellow"></span>
            <span className="dot dot-green"></span>
          </div>
          <div className="card-topbar-title">FluidTube Downloader</div>
          <div className="topbar-right-badge">MP4 & MP3 Ready</div>
        </div>

        {/* Converter Form Inner */}
        <div className="converter-inner">
          {/* URL Input Bar */}
          <div className="input-container">
            <div className="input-box">
              <span className="input-icon">🔗</span>
              <input
                ref={inputRef}
                type="text"
                placeholder="Paste YouTube link here (e.g. https://www.youtube.com/watch?v=...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    fetchInfo();
                  }
                }}
                autoComplete="off"
              />
            </div>
            <button
              type="button"
              className="btn btn-paste-action"
              onClick={handlePaste}
              title="Paste link from clipboard"
            >
              Paste
            </button>
            <button
              type="button"
              className="btn btn-fetch-action"
              onClick={() => fetchInfo()}
              disabled={isFetching}
            >
              {isFetching && <span className="btn-spinner"></span>}
              <span>{isFetching ? "Loading..." : "Search"}</span>
            </button>
          </div>

          {/* Video Preview Box (Visible after fetch) */}
          {videoInfo && (
            <div className="preview-box">
              <div className="preview-thumb-container">
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  loading="lazy"
                />
                <span className="duration-badge">
                  {videoInfo.duration_str || "00:00"}
                </span>
              </div>
              <div className="preview-info-container">
                <h3 className="preview-video-title">{videoInfo.title}</h3>
                <p className="preview-channel-name">
                  {videoInfo.uploader ? `Channel: ${videoInfo.uploader}` : ""}
                </p>
                <div className="preview-pills-row">
                  <span className="pill-badge">
                    ⏱️ {videoInfo.duration_str || "00:00"}
                  </span>
                  <span className="pill-badge stream-ready">
                    ✓ Stream Verified
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Resolution Dropdown Selector */}
          <div className="control-box">
            <div className="control-label-row">
              <span className="control-icon">🎯</span>
              <div>
                <label htmlFor="select-res" className="control-title">
                  Select Quality / Format
                </label>
                <p className="control-subtitle">
                  Choose your preferred video resolution or audio format
                </p>
              </div>
            </div>

            <div className="select-dropdown-container">
              <select
                id="select-res"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              >
                <option value="1080p Full HD">
                  1080p Full HD (1920x1080 MP4)
                </option>
                <option value="720p HD">720p HD (1280x720 MP4)</option>
                <option value="480p SD">480p SD (854x480 MP4)</option>
                <option value="360p Medium">360p Medium (640x360 MP4)</option>
                <option value="144p Low">
                  144p Low (Lightweight / Low Data MP4)
                </option>
                <option value="Best Quality Available">
                  Best Quality Available (Original)
                </option>
                <option value="Audio Only (MP3)">
                  Audio Only (192kbps MP3)
                </option>
              </select>
            </div>
          </div>

          {/* Action CTA Button */}
          <div className="action-cta-area">
            <button
              type="button"
              className="btn btn-main-cta"
              onClick={handleStartDownload}
              disabled={isDownloading}
            >
              <span>{getButtonLabel()}</span>
            </button>
          </div>

          {/* Progress Box (Visible during download) */}
          {isDownloading && (
            <div className="progress-box">
              <div className="progress-info-row">
                <div className="progress-title-box">
                  <span className="pulsing-dot"></span>
                  <span className="progress-status-label">{statusText}</span>
                </div>
                <span className="progress-pct-badge">{Math.round(progress)}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="progress-footer-row">
                <span className="progress-details-text">{detailsText}</span>
                <button
                  type="button"
                  className="btn-cancel-action"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Result Box (Visible when finished) */}
          {result && !isDownloading && (
            <div className="result-box">
              <div className="result-headline-row">
                <div className="result-check-icon">✓</div>
                <div>
                  <h4 className="result-main-title">Download Ready!</h4>
                  <p className="result-desc">
                    Your file has been prepared and is ready to save.
                  </p>
                </div>
              </div>
              <div className="result-file-details">
                <div className="file-name-meta">
                  <span className="file-icon-badge">📁</span>
                  <span className="file-title-text">{result.filename}</span>
                </div>
                <span className="file-size-pill">{result.file_size}</span>
              </div>
              <div className="result-action-buttons">
                <a
                  href={result.download_url}
                  className="btn btn-download-cta"
                  download={result.filename}
                >
                  Download File
                </a>
                <button
                  type="button"
                  className="btn btn-convert-another"
                  onClick={handleReset}
                >
                  Convert Another Video
                </button>
              </div>
            </div>
          )}

          {/* Error Alert Box */}
          {error && (
            <div className="alert-message-box">
              <span className="alert-warning-icon">⚠️</span>
              <div className="alert-text-content">
                <div className="alert-heading">Notice</div>
                <p>{error}</p>
              </div>
              <button
                type="button"
                className="btn-dismiss-alert"
                onClick={() => setError(null)}
              >
                &times;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
