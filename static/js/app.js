/**
 * FluidTube — Client Application Script
 * Clean YouTube video and audio converter.
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const urlInput = document.getElementById("video-url");
  const btnPaste = document.getElementById("btn-paste");
  const btnFetch = document.getElementById("btn-fetch");
  const btnStart = document.getElementById("btn-start");
  const selectRes = document.getElementById("select-resolution");

  // Preview Card Elements
  const previewSection = document.getElementById("preview-section");
  const previewThumb = document.getElementById("preview-thumb");
  const previewTitle = document.getElementById("preview-title");
  const previewChannel = document.getElementById("preview-channel");
  const previewDuration = document.getElementById("preview-duration-badge");
  const pillDuration = document.getElementById("pill-duration");

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

  // Badge
  const ffmpegBadge = document.getElementById("ffmpeg-badge");
  const ffmpegStatusText = document.getElementById("ffmpeg-status-text");

  // State
  let activeTaskId = null;
  let pollInterval = null;

  // =========================================================================
  // 1. HEALTH CHECK
  // =========================================================================
  async function checkHealth() {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      if (data.ffmpeg_available) {
        ffmpegStatusText.textContent = "Server: Ready";
        ffmpegBadge.classList.add("ready");
      } else {
        ffmpegBadge.style.background = "#FEF3C7";
        ffmpegBadge.style.color = "#D97706";
        ffmpegStatusText.textContent = "FFmpeg: Missing";
      }
    } catch {
      ffmpegBadge.style.background = "#FEE2E2";
      ffmpegBadge.style.color = "#DC2626";
      ffmpegStatusText.textContent = "Server: Offline";
    }
  }
  checkHealth();

  // =========================================================================
  // 2. RESOLUTION DROPDOWN LISTENER & BUTTON LABEL
  // =========================================================================
  function updateButtonLabel() {
    if (!selectRes || !btnStart) return;
    const chosenVal = selectRes.value || "";
    const spanText = btnStart.querySelector("span");
    if (!spanText) return;

    if (chosenVal.includes("Audio")) {
      spanText.textContent = "Download MP3 Audio";
    } else if (chosenVal.includes("1080p")) {
      spanText.textContent = "Download Video (1080p Full HD)";
    } else if (chosenVal.includes("720p")) {
      spanText.textContent = "Download Video (720p HD)";
    } else if (chosenVal.includes("480p")) {
      spanText.textContent = "Download Video (480p SD)";
    } else if (chosenVal.includes("360p")) {
      spanText.textContent = "Download Video (360p Medium)";
    } else if (chosenVal.includes("144p")) {
      spanText.textContent = "Download Video (144p Low)";
    } else {
      spanText.textContent = "Download Video (Best Quality)";
    }
  }

  if (selectRes) {
    selectRes.addEventListener("change", updateButtonLabel);
    updateButtonLabel();
  }

  // =========================================================================
  // 3. CLIPBOARD & INPUT LISTENERS
  // =========================================================================
  btnPaste.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        urlInput.value = text.trim();
        fetchVideoInfo();
      }
    } catch {
      showError("Could not access clipboard. Please paste manually into the input box.");
    }
  });

  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchVideoInfo();
    }
  });

  btnFetch.addEventListener("click", fetchVideoInfo);

  // =========================================================================
  // 4. FETCH VIDEO METADATA
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

      const data = resData.data;
      previewThumb.src = data.thumbnail || "";
      previewTitle.textContent = data.title || "Unknown Title";
      previewChannel.textContent = data.uploader ? `Channel: ${data.uploader}` : "";
      previewDuration.textContent = data.duration_str || "--:--";
      pillDuration.textContent = `⏱️ ${data.duration_str || "--:--"}`;
      previewSection.classList.remove("hidden");

    } catch (err) {
      showError(err.message);
    } finally {
      setFetchLoading(false);
    }
  }

  function setFetchLoading(loading) {
    const spinner = btnFetch.querySelector(".btn-spinner");
    const text = btnFetch.querySelector(".btn-text");
    if (loading) {
      spinner.classList.remove("hidden");
      text.textContent = "Loading...";
      btnFetch.disabled = true;
    } else {
      spinner.classList.add("hidden");
      text.textContent = "Search";
      btnFetch.disabled = false;
    }
  }

  // =========================================================================
  // 5. START DOWNLOAD TRIGGER
  // =========================================================================
  btnStart.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    if (!url) {
      showError("Please enter a YouTube video URL first.");
      urlInput.focus();
      return;
    }

    hideError();
    resultSection.classList.add("hidden");
    progressSection.classList.remove("hidden");

    btnStart.disabled = true;
    btnStart.style.opacity = "0.7";
    btnStart.querySelector("span").textContent = "Processing...";

    updateProgress(0, "Initiating download...", "Connecting to YouTube stream...");

    const resolution = selectRes.value;

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          resolution,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.detail || "Failed to start download.");
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
  // 6. PROGRESS TRACKING
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
          showError(task.error || "Download failed.");
          resetActionUI();
          progressSection.classList.add("hidden");
        } else if (task.status === "cancelled") {
          clearInterval(pollInterval);
          showError("Download was cancelled.");
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

    resultFilename.textContent = task.filename || "video.mp4";
    resultFilesize.textContent = task.file_size || "--";
    btnDownloadFile.href = task.download_url;
    btnDownloadFile.setAttribute("download", task.filename || "video.mp4");

    resultSection.classList.remove("hidden");
  }

  // =========================================================================
  // 7. CANCELLATION & RESET
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
    activeTaskId = null;
    hideError();
    urlInput.focus();
  });

  function resetActionUI() {
    btnStart.disabled = false;
    btnStart.style.opacity = "1";
    updateButtonLabel();
    btnCancel.disabled = false;
    btnCancel.textContent = "Cancel";
  }

  // =========================================================================
  // 8. ERROR ALERT
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
