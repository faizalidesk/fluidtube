import React from "react";
import ConverterCard from "./ConverterCard";

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-tag-pill">
          <span className="star-icon">⚡</span>
          <span>FAST & SECURE YOUTUBE CONVERTER</span>
        </div>

        <h1 className="hero-main-title">
          Download YouTube Videos & Audio<br />
          <span className="purple-highlight">Quickly and Easily</span>
        </h1>

        <p className="hero-desc-text">
          Convert YouTube videos to high-definition MP4 in 1080p, 720p, 480p, 360p, 144p or extract high-bitrate MP3 audio with zero popups or registration.
        </p>

        <ConverterCard />
      </div>
    </section>
  );
}
