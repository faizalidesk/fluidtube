import React from "react";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Paste Link",
      desc: "Copy the link of any YouTube video or Shorts and paste it into the converter box above.",
    },
    {
      num: "02",
      title: "Select Quality",
      desc: "Choose your desired resolution from 144p up to 1080p Full HD, or select MP3 for audio only.",
    },
    {
      num: "03",
      title: "Direct Download",
      desc: "Click Download and receive the clean MP4 or MP3 file directly to your device.",
    },
  ];

  return (
    <section className="section-how" id="how-it-works">
      <div className="content-container">
        <div className="section-badge-pill">HOW IT WORKS</div>
        <h2 className="section-main-heading">Download Any Video in 3 Easy Steps</h2>
        <p className="section-sub-heading">Simple, streamlined, and designed for speed.</p>

        <div className="steps-grid">
          {steps.map((s) => (
            <div key={s.num} className="step-card">
              <div className="step-num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
