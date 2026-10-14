/**
 * FluidTube — Client Application Script
 * Handles asynchronous video info fetching, real-time progress polling, and direct downloads.
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const urlInput = document.getElementById("video-url");
  const btnPaste = document.getElementById("btn-paste");
  const btnFetch = document.getElementById("btn-fetch");
  const btnStart = document.getElementById("btn-start");
  const selectRes = document.getElementById("select-resolution");
  const toggle60fps = document.getElementById("toggle-60fps");

  // Preview Card Elements
  const previewSection = document.getElementById("preview-section");
  const previewThumb = document.getElementById("preview-thumb");
  const previewTitle = document.getElementById("preview-title");
  const previewChannel = document.getElementById("preview-channel");
  const previewDuration = document.getElementById("preview-duration-badge");
  const pillFps = document.getElementById("pill-fps");
  const pillDuration = document.getElementById("pill-duration");
  const engineHint = document.getElementById("preview-engine-hint");

  // Progress Card Elements
  const progressSection = document.getElementById("progress-section");
  const progressStatus = document.getElementById("progress-status");
  const progressPct = document.getElementById("progress-percentage");
  const progressBarFill = document.getElementById("progress-bar-fill");
  const progressDetails = document.getElementById("progress-details");
  const btnCancel = document.getElementById("btn-cancel");

  // Result Card Elements
  const resultSection = document.getElementById("result-section");
  const resultFilename = document.getElementById("result-filename");
  const resultFilesize = document.getElementById("result-filesize");
  const btnDownloadFile = document.getElementById("btn-download-file");
  const btnReset = document.getElementById("btn-reset");

  // Alert Box
  const errorAlert = document.getElementById("error-alert");
  const errorMessage = document.getElementById("error-message");
  const btnCloseError = document.getElementById("btn-close-error");

  // Status Badge
  const ffmpegBadge = document.getElementById("ffmpeg-badge");
  const ffmpegStatusText = document.getElementById("ffmpeg-status-text");

  // State
  let currentVideoData = null;
  let activeTaskId = null;
  let pollInterval = null;

  // =========================================================================
  // 1. INITIALIZATION & HEALTH CHECK
  // =========================================================================

  async function checkHealth() {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      if (data.ffmpeg_available) {
        ffmpegBadge.className = "status-badge ready";
        ffmpegStatusText.textContent = "● FFmpeg 60FPS: Ready";
      } else {
        ffmpegBadge.className = "status-badge warning";
        ffmpegStatusText.textContent = "⚠️ FFmpeg Missing";
      }
    } catch {
      ffmpegBadge.className = "status-badge warning";
      ffmpegStatusText.textContent = "⚠️ Server Offline";
    }
  }
  checkHealth();

  // =========================================================================
  // 2. CLIPBOARD & INPUT LISTENERS
  // =========================================================================

  btnPaste.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        urlInput.value = text.trim();
        fetchVideoInfo();
      }
    } catch (err) {
      showError("Clipboard access was blocked by browser. Please paste manually.");
    }
  });

  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchVideoInfo();
    }
  });

  btnFetch.addEventListener("click", fetchVideoInfo);

  selectRes.addEventListener("change", () => {
    const isAudio = selectRes.value.includes("Audio Only");
    if (isAudio) {
      toggle60fps.checked = false;
      toggle60fps.disabled = true;
    } else {
      toggle60fps.disabled = false;
      toggle60fps.checked = true;
    }
  });

  // =========================================================================
  // 3. FETCH VIDEO METADATA
  // =========================================================================

  async function fetchVideoInfo() {
    const url = urlInput.value.trim();
    if (!url) {
      showError("Please enter a valid YouTube video URL.");
      return;
    }

    hideError();
    setFetchLoading(true);

    try {
      const response = await fetch("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.detail || "Failed to load video information.");
      }

      currentVideoData = resData.data;
      renderPreview(currentVideoData);

    } catch (err) {
      showError(err.message);
    } finally {
      setFetchLoading(false);
    }
  }

  function renderPreview(data) {
    previewThumb.src = data.thumbnail || "";
    previewTitle.textContent = data.title || "Unknown Title";
    previewChannel.textContent = data.uploader ? `Channel: ${data.uploader}` : "";
    previewDuration.textContent = data.duration_str || "--:--";
    pillDuration.textContent = `⏱️ ${data.duration_str || "--:--"}`;

    if (data.has_native_60fps) {
      pillFps.textContent = `⚡ ${data.max_native_fps} FPS Native`;
      pillFps.className = "pill pill-fps";
      engineHint.textContent = "⚡ Native 60 FPS stream detected! Will download directly in full 60 FPS.";
      engineHint.style.color = "#34D399";
    } else {
      pillFps.textContent = `🎞️ Source: ${data.max_native_fps || 30} FPS`;
      pillFps.className = "pill pill-fps interpolate";
      engineHint.textContent = "⚡ 60 FPS motion interpolation engine will generate silky 60 FPS frames via FFmpeg.";
      engineHint.style.color = "#F59E0B";
    }

    previewSection.classList.remove("hidden");
  }

  function setFetchLoading(loading) {
    const spinner = btnFetch.querySelector(".btn-spinner");
    const text = btnFetch.querySelector(".btn-text");
    if (loading) {
      spinner.classList.remove("hidden");
      text.textContent = "Fetching...";
      btnFetch.disabled = true;
    } else {
      spinner.classList.add("hidden");
      text.textContent = "🔍 Fetch Info";
      btnFetch.disabled = false;
    }
  }

  // =========================================================================
  // 4. CONVERT & MOTION INTERPOLATION TRIGGER
  // =========================================================================

  btnStart.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    if (!url) {
      showError("Please enter a YouTube video URL first.");
      return;
    }

    hideError();
    resultSection.classList.add("hidden");
    progressSection.classList.remove("hidden");

    // UI state
    btnStart.disabled = true;
    btnStart.style.opacity = "0.6";
    btnStart.innerHTML = `<span>⏳ Processing...</span>`;

    updateProgress(0, "Initiating conversion...", "Connecting to worker thread...");

    const resolution = selectRes.value;
    const force_60fps = toggle60fps.checked && !resolution.includes("Audio Only");

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          resolution,
          force_60fps,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.detail || "Failed to start conversion.");
      }

      activeTaskId = resData.task_id;
      startProgressPolling(activeTaskId);

    } catch (err) {
      showError(err.message);
      resetActionUI();
      progressSection.classList.add("hidden");
    }
  });

  // =========================================================================
  // 5. REAL-TIME PROGRESS POLLING
  // =========================================================================

  function startProgressPolling(taskId) {
    if (pollInterval) clearInterval(pollInterval);

    pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/progress/${taskId}`);
        if (!res.ok) {
          throw new Error("Unable to track task progress.");
        }

        const task = await res.json();
        updateProgress(task.progress, task.status_text, task.details_text);

        if (task.status === "complete") {
          clearInterval(pollInterval);
          onTaskComplete(task);
        } else if (task.status === "error") {
          clearInterval(pollInterval);
          showError(task.error || "Video processing failed.");
          resetActionUI();
          progressSection.classList.add("hidden");
        } else if (task.status === "cancelled") {
          clearInterval(pollInterval);
          showError("Process was cancelled.");
          resetActionUI();
          progressSection.classList.add("hidden");
        }
      } catch (err) {
        clearInterval(pollInterval);
        showError(err.message);
        resetActionUI();
      }
    }, 600);
  }

  function updateProgress(pct, statusText, detailsText) {
    const clamped = Math.max(0, Math.min(100, pct || 0));
    progressBarFill.style.width = `${clamped}%`;
    progressPct.textContent = `${Math.round(clamped)}%`;
    if (statusText) progressStatus.textContent = statusText;
    if (detailsText) progressDetails.textContent = detailsText;
  }

  function onTaskComplete(task) {
    resetActionUI();
    progressSection.classList.add("hidden");

    // Configure Result Card
    resultFilename.textContent = task.filename || "video.mp4";
    resultFilesize.textContent = task.file_size || "--";
    btnDownloadFile.href = task.download_url;
    btnDownloadFile.setAttribute("download", task.filename || "video.mp4");

    const resultHeading = document.getElementById("result-heading");
    const resultSubtext = document.getElementById("result-subtext");
    if (task.was_interpolated) {
      resultHeading.textContent = "🎉 60 FPS Video Ready!";
      resultSubtext.textContent = "Generated with FFmpeg motion vector interpolation.";
    } else {
      resultHeading.textContent = "🎉 Media Ready for Download!";
      resultSubtext.textContent = "High-definition stream processed successfully.";
    }

    resultSection.classList.remove("hidden");
  }

  // =========================================================================
  // 6. CANCELLATION & RESET
  // =========================================================================

  btnCancel.addEventListener("click", async () => {
    if (!activeTaskId) return;
    btnCancel.disabled = true;
    btnCancel.textContent = "Cancelling...";

    try {
      await fetch(`/api/cancel/${activeTaskId}`, { method: "POST" });
    } catch {
      // Ignored
    }
  });

  btnReset.addEventListener("click", () => {
    resultSection.classList.add("hidden");
    previewSection.classList.add("hidden");
    urlInput.value = "";
    currentVideoData = null;
    activeTaskId = null;
    hideError();
  });

  function resetActionUI() {
    btnStart.disabled = false;
    btnStart.style.opacity = "1";
    btnStart.innerHTML = `<span class="btn-cta-icon">🚀</span><span>Start Download & Process 60 FPS</span>`;
    btnCancel.disabled = false;
    btnCancel.textContent = "⏹️ Cancel";
  }

  // =========================================================================
  // 7. ERROR ALERTS
  // =========================================================================

  function showError(msg) {
    errorMessage.textContent = msg;
    errorAlert.classList.remove("hidden");
  }

  function hideError() {
    errorAlert.classList.add("hidden");
  }

  btnCloseError.addEventListener("click", hideError);
});
