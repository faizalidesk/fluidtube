import React from "react";

export default function Footer() {
  return (
    <footer className="footer-wrapper">
      <div className="footer-container">
        <div className="footer-top-grid">
          {/* Brand column */}
          <div className="footer-col-brand">
            <a href="#converter" className="nav-brand">
              <div className="brand-logo-icon">⚡</div>
              <span className="brand-name">
                Fluid<strong>Tube</strong>
              </span>
            </a>
            <p className="footer-brand-desc">
              Fast, high-quality YouTube video and audio downloader. Free, clean, and reliable media utility.
            </p>
          </div>

          {/* Links columns */}
          <div className="footer-col">
            <h5>Navigation</h5>
            <ul>
              <li><a href="#converter">Converter</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#resolutions">Resolutions</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Resolutions</h5>
            <ul>
              <li><a href="#converter">1080p Full HD</a></li>
              <li><a href="#converter">720p HD</a></li>
              <li><a href="#converter">480p SD</a></li>
              <li><a href="#converter">360p & 144p</a></li>
              <li><a href="#converter">MP3 Audio</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Open Source</h5>
            <ul>
              <li>
                <a
                  href="https://github.com/faizalidesk/fluidtube"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a href="https://ffmpeg.org" target="_blank" rel="noopener noreferrer">
                  FFmpeg
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/yt-dlp/yt-dlp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  yt-dlp
                </a>
              </li>
              <li>
                <a
                  href="https://fastapi.tiangolo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  FastAPI
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Legal</h5>
            <ul>
              <li><a href="#converter">Terms of Use</a></li>
              <li><a href="#converter">Privacy Policy</a></li>
              <li><a href="#converter">Disclaimer</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Purple Bottom Copyright Bar */}
      <div className="footer-bottom-bar">
        <p>© 2026 FluidTube. All Rights Reserved. Built with React, FastAPI & FFmpeg.</p>
      </div>
    </footer>
  );
}
