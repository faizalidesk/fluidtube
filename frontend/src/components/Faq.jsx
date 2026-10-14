import React from "react";

export default function Faq() {
  const faqs = [
    {
      q: "What resolutions are available for download?",
      a: "FluidTube supports 1080p Full HD, 720p HD, 480p SD, 360p, 144p video formats, as well as high-bitrate MP3 audio extraction.",
    },
    {
      q: "Is FluidTube free to use?",
      a: "Yes, FluidTube is 100% free and open-source. There are no fees, hidden paywalls, or limits on conversions.",
    },
    {
      q: "Where are my downloaded files saved?",
      a: "Downloaded files are saved directly to your browser's default download folder (usually 'Downloads' on your PC or phone).",
    },
    {
      q: "Can I download YouTube Shorts?",
      a: "Yes, simply copy the URL of the YouTube Short and paste it into the converter box.",
    },
  ];

  return (
    <section className="section-faq" id="faq">
      <div className="content-container">
        <div className="section-badge-pill">FAQ</div>
        <h2 className="section-main-heading">Frequently Asked Questions</h2>
        <p className="section-sub-heading">Common inquiries regarding video conversions and downloads.</p>

        <div className="faq-list">
          {faqs.map((item, idx) => (
            <div key={idx} className="faq-item">
              <div className="faq-question">{item.q}</div>
              <div className="faq-answer">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
