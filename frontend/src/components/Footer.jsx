import React from "react";

export default function Footer({ onOpenPolicy }) {
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
              Fast, high-quality YouTube video and audio converter. Clean, secure, and reliable open-source media utility.
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
            <h5>Company & Legal</h5>
            <ul>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => onOpenPolicy("about")}
                >
                  About FluidTube
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => onOpenPolicy("privacy")}
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => onOpenPolicy("terms")}
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => onOpenPolicy("dmca")}
                >
                  DMCA & Copyright
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => onOpenPolicy("contact")}
                >
                  Contact Us
                </button>
              </li>
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
                  FFmpeg Project
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/yt-dlp/yt-dlp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  yt-dlp Engine
                </a>
              </li>
              <li>
                <a
                  href="https://fastapi.tiangolo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  FastAPI Framework
                </a>
              </li>
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
