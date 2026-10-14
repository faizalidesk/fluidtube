import React from "react";

export default function SeoGuide() {
  return (
    <section className="section-seo-guide" id="guide">
      <div className="content-container">
        <div className="section-badge-pill">COMPREHENSIVE GUIDE</div>
        <h2 className="section-main-heading">
          The Best Free YouTube Converter &amp; YT Video Downloader
        </h2>
        <p className="section-sub-heading">
          FluidTube is an advanced online YouTube converter (YT converter)
          engineered for speed, privacy, and maximum video quality.
        </p>

        {/* 3 Pillar Cards */}
        <div className="seo-pillars-grid">
          <div className="seo-pillar-card">
            <div className="pillar-icon">🎬</div>
            <h3>YouTube to MP4 Converter</h3>
            <p>
              Download YouTube videos in pristine 1080p Full HD, 720p HD, 480p,
              360p, or 144p. Our server multiplexes separate video and audio
              streams into a single standard MP4 file compatible with any media player.
            </p>
          </div>

          <div className="seo-pillar-card">
            <div className="pillar-icon">🎵</div>
            <h3>YouTube to MP3 Converter</h3>
            <p>
              Extract crystal-clear audio from YouTube videos with our specialized
              audio extraction engine. Download 192kbps high-bitrate MP3 files
              ideal for music, podcasts, speeches, and offline listening.
            </p>
          </div>

          <div className="seo-pillar-card">
            <div className="pillar-icon">📱</div>
            <h3>YouTube Shorts Downloader</h3>
            <p>
              Easily convert and download vertical YouTube Shorts videos in full
              resolution. Simply copy the Short link and convert directly on your
              smartphone, tablet, or desktop.
            </p>
          </div>
        </div>

        {/* In-depth Tutorial Section */}
        <div className="seo-article-block">
          <h3>How to Convert YouTube (YT) Videos to MP4 or MP3 Online</h3>
          <p>
            Converting and downloading YouTube videos has never been simpler. Follow
            these 4 quick steps to save your favorite educational videos, music, and
            tutorials:
          </p>
          <ol className="seo-steps-list">
            <li>
              <strong>Step 1: Copy the YouTube Video URL:</strong> Open YouTube on
              your browser or app, navigate to the video or Short you want to
              convert, and copy its link from the address bar or via the Share button.
            </li>
            <li>
              <strong>Step 2: Paste into FluidTube:</strong> Paste the copied link
              into the search input box at the top of this page.
            </li>
            <li>
              <strong>Step 3: Select Quality from Dropdown:</strong> Choose your
              desired output format—whether 1080p Full HD for large screens, 720p HD
              for balanced file size, or Audio Only (MP3) for music tracks.
            </li>
            <li>
              <strong>Step 4: Download Directly:</strong> Click the Download button.
              Our high-speed backend processes the stream and delivers the finished
              file directly to your device with zero popup advertisements.
            </li>
          </ol>

          <h3>Why Choose FluidTube Over Other YouTube Converters?</h3>
          <p>
            Most legacy YouTube converter websites are cluttered with deceptive
            advertisements, pop-up redirects, and unwanted notification prompts.
            FluidTube was created as an open-source, user-centric alternative:
          </p>
          <ul className="seo-features-checklist">
            <li>
              <strong>100% Free &amp; Unlimited:</strong> Convert as many videos as
              you need without restrictions or hidden paywalls.
            </li>
            <li>
              <strong>No Account Required:</strong> Start converting immediately
              without registering or providing sensitive personal information.
            </li>
            <li>
              <strong>Zero Software Installation:</strong> Works entirely in your
              web browser (Google Chrome, Apple Safari, Mozilla Firefox, Microsoft
              Edge, Opera) on Windows, macOS, Android, iOS, and Linux.
            </li>
            <li>
              <strong>High-Speed Cloud Processing:</strong> Powered by modern
              stream processing to ensure fast downloads and optimal file compression.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
