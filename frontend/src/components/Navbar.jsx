import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

export default function Navbar() {
  const [serverStatus, setServerStatus] = useState({
    state: "ready", // "ready" | "warning" | "offline"
    text: "Server: Connecting...",
  });

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/health`);
        const data = await res.json();
        if (data.ffmpeg_available) {
          setServerStatus({ state: "ready", text: "Server: Ready" });
        } else {
          setServerStatus({ state: "warning", text: "FFmpeg: Missing" });
        }
      } catch {
        setServerStatus({ state: "offline", text: "Server: Offline" });
      }
    }
    checkHealth();
  }, []);

  return (
    <header className="navbar-wrapper">
      <nav className="navbar">
        <a href="#converter" className="nav-brand">
          <div className="brand-logo-icon">⚡</div>
          <span className="brand-name">
            Fluid<strong>Tube</strong>
          </span>
        </a>

        <ul className="nav-links">
          <li><a href="#converter">Converter</a></li>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#resolutions">Resolutions</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>

        <div className="nav-actions">
          <div className={`engine-badge ${serverStatus.state}`}>
            <span className="badge-dot"></span>
            <span>{serverStatus.text}</span>
          </div>
          <a href="#converter" className="btn btn-nav-cta">
            Convert Now
          </a>
        </div>
      </nav>
    </header>
  );
}
