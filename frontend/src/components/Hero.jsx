import React from "react";
import ConverterCard from "./ConverterCard";

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-tag-pill">
          <span className="star-icon">⚡</span>
          <span>FREE ONLINE YOUTUBE CONVERTER (YT CONVERTER)</span>
        </div>

        <h1 className="hero-main-title">
          YouTube Converter &amp; YT Downloader<br />
          <span className="purple-highlight">Fast, Free MP4 &amp; MP3</span>
        </h1>

        <p className="hero-desc-text">
          Convert YouTube videos to high-definition MP4 in 1080p, 720p, 480p, 360p, 144p or extract 192kbps MP3 audio with our fast online YT converter. Clean, secure, and 100% free with zero pop-up ads.
        </p>

        <ConverterCard />
      </div>
    </section>
  );
}
