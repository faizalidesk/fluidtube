import React, { useEffect } from "react";

export default function PolicyModal({ view, onClose }) {
  useEffect(() => {
    if (!view) {
      document.body.style.overflow = "";
      return;
    }

    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [view, onClose]);

  if (!view) return null;

  return (
    <div className="policy-modal-backdrop" onClick={onClose}>
      <div
        className="policy-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          className="btn-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          &times;
        </button>

        <div className="policy-modal-content">
          {view === "about" && <AboutContent />}
          {view === "privacy" && <PrivacyContent />}
          {view === "terms" && <TermsContent />}
          {view === "contact" && <ContactContent />}
          {view === "dmca" && <DmcaContent />}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 1. ABOUT US (Optimized for Google AdSense Approval & Transparency)
// -----------------------------------------------------------------------------
function AboutContent() {
  return (
    <article className="policy-article">
      <div className="policy-badge">ABOUT US</div>
      <h2>About FluidTube</h2>
      <p className="policy-lead">
        FluidTube is a modern, high-speed digital multimedia utility developed
        to assist researchers, educators, students, and content creators in
        converting and formatting online video and audio streams for offline
        educational, archival, and fair-use study.
      </p>

      <hr className="policy-divider" />

      <h3>1. Our Mission</h3>
      <p>
        The digital landscape is rich with lectures, documentaries, tutorials,
        public domain archives, and Creative Commons media. However, dependable
        access to high-bandwidth internet is not globally uniform. Our mission is
        to provide a clean, free, and accessible conversion tool that enables users
        to format and store educational media locally for offline playback on any
        device—without encountering deceptive advertising, pop-up redirects, or
        coercive subscription models.
      </p>

      <h3>2. How the Technology Works</h3>
      <p>
        FluidTube operates on open-source standards, utilizing modern web
        technologies including React, FastAPI, Python, and the FFmpeg media
        processing framework:
      </p>
      <ul>
        <li>
          <strong>Stream Multiplexing:</strong> YouTube distributes high-definition
          video and audio in separate Adaptive DASH streams. FluidTube connects
          directly to these public streams, performs stream multiplexing via
          native FFmpeg instances, and outputs standard MP4 or MP3 files.
        </li>
        <li>
          <strong>Zero Storage Footprint:</strong> Converted files are held in
          temporary volatile storage on the processing server and are
          automatically purged within 2 hours of processing.
        </li>
        <li>
          <strong>Privacy by Design:</strong> We do not require account registration,
          passwords, or credit cards. We never maintain persistent user histories
          or sell demographic data.
        </li>
      </ul>

      <h3>3. Commitment to Copyright & Fair Use</h3>
      <p>
        FluidTube strongly respects the intellectual property rights of content
        creators, artists, and production studios. FluidTube is explicitly
        intended for:
      </p>
      <ul>
        <li>Content released under Creative Commons or Public Domain licenses.</li>
        <li>Your own personally uploaded videos and royalty-free creations.</li>
        <li>
          Personal, non-commercial fair use for academic study, research, teaching,
          and commentary as protected under applicable fair-use doctrines.
        </li>
      </ul>
      <p>
        FluidTube strictly discourages unauthorized commercial redistribution or
        infringing utilization of copyrighted media. Copyright owners may contact
        our compliance team via our DMCA procedure for immediate assistance.
      </p>

      <h3>4. Contact & Editorial Transparency</h3>
      <p>
        FluidTube is actively maintained and developed. For inquiries regarding our
        technology, partnerships, bug reports, or copyright matters:
      </p>
      <div className="policy-contact-box">
        <p><strong>Platform:</strong> FluidTube Media Utility</p>
        <p><strong>Official Website:</strong> https://www.fluidtube.web.id</p>
        <p><strong>Primary Support & Compliance:</strong> faizalidesk@gmail.com</p>
        <p><strong>Response Timeframe:</strong> Within 24–48 business hours</p>
      </div>
    </article>
  );
}

// -----------------------------------------------------------------------------
// 2. PRIVACY POLICY (Mandatory for Google AdSense Compliance)
// -----------------------------------------------------------------------------
function PrivacyContent() {
  return (
    <article className="policy-article">
      <div className="policy-badge">LEGAL COMPLIANCE</div>
      <h2>Privacy Policy</h2>
      <p className="policy-lead">
        Effective Date: October 14, 2026. Your privacy and digital confidentiality
        are fundamental principles of FluidTube.
      </p>

      <hr className="policy-divider" />

      <h3>1. Information We Do Not Collect</h3>
      <p>
        FluidTube does not require you to create an account, register an email
        address, or provide financial information. We do not maintain user
        profiles, track your personal conversion history, or link your IP address
        to specific YouTube links.
      </p>

      <h3>2. Temporary Server Logs & File Deletion</h3>
      <p>
        When you request a video or audio conversion:
      </p>
      <ul>
        <li>
          The requested video file is temporarily processed in an isolated folder on
          our conversion server.
        </li>
        <li>
          Temporary files are scheduled for automatic deletion via background
          cleanup daemons immediately after download completion, or at most
          within 2 hours.
        </li>
        <li>
          Server access logs (containing standard web server telemetry such as user
          agent and HTTP status codes) are utilized solely for diagnostic debugging,
          rate-limiting protection, and preventing DDoS attacks.
        </li>
      </ul>

      <h3>3. Third-Party Advertising & Cookies (Google AdSense Notice)</h3>
      <p>
        We may partner with third-party vendors, including Google, to serve
        advertisements when you visit our website:
      </p>
      <ul>
        <li>
          Google, as a third-party vendor, uses cookies to serve ads based on a
          user&apos;s prior visits to this website or other websites on the internet.
        </li>
        <li>
          Google&apos;s use of advertising cookies enables it and its partners to
          serve ads to our users based on their visit to our sites and/or other
          sites on the Internet.
        </li>
        <li>
          Users may opt out of personalized advertising by visiting{" "}
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Ads Settings
          </a>. Alternatively, users can opt out of a third-party vendor&apos;s use of
          cookies for personalized advertising by visiting{" "}
          <a
            href="https://www.aboutads.info"
            target="_blank"
            rel="noopener noreferrer"
          >
            aboutads.info
          </a>.
        </li>
      </ul>

      <h3>4. External Links</h3>
      <p>
        FluidTube accepts YouTube URLs provided directly by users. We do not host,
        own, or manage third-party external platforms and are not responsible for
        the privacy practices or content of external sites.
      </p>

      <h3>5. Contact for Privacy Inquiries</h3>
      <p>
        For inquiries regarding our privacy standards or data protection practices,
        please contact: <strong>faizalidesk@gmail.com</strong>.
      </p>
    </article>
  );
}

// -----------------------------------------------------------------------------
// 3. TERMS OF SERVICE
// -----------------------------------------------------------------------------
function TermsContent() {
  return (
    <article className="policy-article">
      <div className="policy-badge">TERMS OF USE</div>
      <h2>Terms of Service</h2>
      <p className="policy-lead">
        By accessing and using FluidTube (https://www.fluidtube.web.id), you agree
        to be bound by the following terms and conditions.
      </p>

      <hr className="policy-divider" />

      <h3>1. Permitted Use</h3>
      <p>
        FluidTube is provided as an open-access web utility for personal,
        educational, and non-commercial formatting of online videos. You agree to
        utilize this service strictly in accordance with all applicable local,
        national, and international laws, including intellectual property
        statutes.
      </p>

      <h3>2. Intellectual Property & User Responsibility</h3>
      <p>
        You are solely responsible for verifying that your use of any converted
        content complies with fair-use principles, copyright licenses, or explicit
        permissions from the original copyright holder. You agree not to use
        FluidTube for commercial redistribution, piracy, or infringement of
        copyrighted media.
      </p>

      <h3>3. Disclaimer of Warranties</h3>
      <p>
        FluidTube is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without
        warranties of any kind, either express or implied. FluidTube does not
        warrant that the service will be uninterrupted, error-free, or compatible
        with all third-party media sources at all times.
      </p>

      <h3>4. Limitation of Liability</h3>
      <p>
        Under no circumstances shall the operators, maintainers, or developers of
        FluidTube be liable for any direct, indirect, incidental, or consequential
        damages arising from the use or inability to use this service.
      </p>
    </article>
  );
}

// -----------------------------------------------------------------------------
// 4. CONTACT US
// -----------------------------------------------------------------------------
function ContactContent() {
  return (
    <article className="policy-article">
      <div className="policy-badge">SUPPORT & INQUIRIES</div>
      <h2>Contact Us</h2>
      <p className="policy-lead">
        We value feedback, technical bug reports, and copyright inquiries from our
        community.
      </p>

      <hr className="policy-divider" />

      <div className="policy-contact-card">
        <h3>Primary Channels</h3>
        <p>
          <strong>Official Support Email:</strong>{" "}
          <a href="mailto:faizalidesk@gmail.com">faizalidesk@gmail.com</a>
        </p>
        <p>
          <strong>Technical Repository:</strong>{" "}
          <a
            href="https://github.com/faizalidesk/fluidtube"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/faizalidesk/fluidtube
          </a>
        </p>
        <p>
          <strong>Website URL:</strong> https://www.fluidtube.web.id
        </p>
        <p>
          <strong>Response Time:</strong> We review all legitimate inquiries and
          aim to respond within 24 to 48 business hours.
        </p>
      </div>

      <h3>Technical Inquiries & Feedback</h3>
      <p>
        If you experience an issue downloading a specific resolution, encountering
        a rate-limit notice, or would like to propose a feature enhancement, please
        include the video link format and your browser version in your message.
      </p>
    </article>
  );
}

// -----------------------------------------------------------------------------
// 5. DMCA / COPYRIGHT POLICY
// -----------------------------------------------------------------------------
function DmcaContent() {
  return (
    <article className="policy-article">
      <div className="policy-badge">INTELLECTUAL PROPERTY</div>
      <h2>DMCA & Copyright Policy</h2>
      <p className="policy-lead">
        FluidTube complies with the provisions of the Digital Millennium Copyright
        Act (DMCA) and responds expeditiously to valid infringement notices.
      </p>

      <hr className="policy-divider" />

      <p>
        FluidTube does not host user-uploaded files on its public servers, nor do
        we operate a content index. All conversions are performed dynamically in
        transient server memory and deleted automatically.
      </p>
      <p>
        If you are a copyright owner or authorized representative and believe that
        material processed via this tool infringes your rights, please submit a
        formal notice to:
      </p>
      <div className="policy-contact-box">
        <p><strong>Designated Agent:</strong> FluidTube Compliance Desk</p>
        <p><strong>Email:</strong> faizalidesk@gmail.com</p>
        <p>
          <strong>Required Details:</strong> URL of the copyrighted work, evidence
          of ownership, and your contact statement.
        </p>
      </div>
    </article>
  );
}
