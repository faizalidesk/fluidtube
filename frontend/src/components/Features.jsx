import React from "react";

export default function Features() {
  const features = [
    {
      icon: "⚡",
      title: "Fast Cloud Extraction",
      desc: "Processes and merges video and audio streams rapidly on server hardware before delivering to your browser.",
    },
    {
      icon: "🛡️",
      title: "No Registration & Free",
      desc: "No user accounts, subscriptions, or credit cards required. Convert as many videos as you need.",
    },
    {
      icon: "📱",
      title: "Cross-Device Compatible",
      desc: "Works smoothly across Windows, macOS, Android, iPhone, and Linux via modern web browsers.",
    },
    {
      icon: "🔒",
      title: "Clean & Ad-Free Interface",
      desc: "No deceptive popups, push notifications, or shady redirects. Clean downloads directly from YouTube.",
    },
  ];

  return (
    <section className="section-features" id="features">
      <div className="content-container">
        <div className="section-badge-pill">WHY FLUIDTUBE</div>
        <h2 className="section-main-heading">Built for Speed, Privacy, and Ease</h2>
        <p className="section-sub-heading">A modern tool that respects your device and bandwidth.</p>

        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon-box">{f.icon}</div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
