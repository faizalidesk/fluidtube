import React from "react";

export default function Resolutions() {
  const list = [
    {
      tag: "Full HD",
      title: "1080p Video",
      desc: "Pristine 1920x1080 resolution for high-end displays, desktop monitors, and TVs.",
      audio: false,
    },
    {
      tag: "HD",
      title: "720p Video",
      desc: "Standard high definition format balancing crisp visual clarity with fast download speed.",
      audio: false,
    },
    {
      tag: "SD",
      title: "480p Video",
      desc: "Standard definition suitable for tablets and laptops with low storage consumption.",
      audio: false,
    },
    {
      tag: "Mobile",
      title: "360p Video",
      desc: "Optimized for mobile devices and modest cellular internet connections.",
      audio: false,
    },
    {
      tag: "Lite",
      title: "144p Video",
      desc: "Ultra-compact data saver format for quick previews and minimal storage.",
      audio: false,
    },
    {
      tag: "Audio",
      title: "192kbps MP3",
      desc: "Crystal clear audio extraction for podcasts, music, and voice tracks.",
      audio: true,
    },
  ];

  return (
    <section className="section-resolutions" id="resolutions">
      <div className="content-container">
        <div className="section-badge-pill">FORMATS & QUALITY</div>
        <h2 className="section-main-heading">All Video & Audio Resolutions Supported</h2>
        <p className="section-sub-heading">From lightweight data-saver formats to high-definition video.</p>

        <div className="resolutions-grid">
          {list.map((r) => (
            <div
              key={r.title}
              className={`res-card ${r.audio ? "audio-res-card" : ""}`}
            >
              <div className={`res-tag ${r.audio ? "audio-tag" : ""}`}>{r.tag}</div>
              <h4>{r.title}</h4>
              <p>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
