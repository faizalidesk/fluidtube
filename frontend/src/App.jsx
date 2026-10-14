import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Resolutions from "./components/Resolutions";
import Features from "./components/Features";
import Faq from "./components/Faq";
import SeoGuide from "./components/SeoGuide";
import CtaBanner from "./components/CtaBanner";
import Footer from "./components/Footer";
import PolicyModal from "./components/PolicyModal";

export default function App() {
  const [activePolicy, setActivePolicy] = useState(null);

  // Sync with URL hash (e.g. #about, #privacy, #terms, #contact, #dmca)
  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      if (["about", "privacy", "terms", "contact", "dmca"].includes(hash)) {
        setActivePolicy(hash);
      }
    }

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function openPolicy(view) {
    setActivePolicy(view);
    window.history.pushState(null, "", `#${view}`);
  }

  function closePolicy() {
    setActivePolicy(null);
    if (["#about", "#privacy", "#terms", "#contact", "#dmca"].includes(window.location.hash)) {
      window.history.pushState(null, "", window.location.pathname);
    }
  }

  return (
    <div className="page-wrapper">
      {/* Ambient background glow elements */}
      <div className="bg-shape shape-top"></div>
      <div className="bg-shape shape-bottom"></div>

      {/* 1. Header & Navigation */}
      <Navbar onOpenPolicy={openPolicy} />

      {/* 2. Hero & Converter Showcase */}
      <main>
        <Hero />
        <HowItWorks />
        <Resolutions />
        <Features />
        <Faq />
        <SeoGuide />
        <CtaBanner />
      </main>

      {/* 3. Footer */}
      <Footer onOpenPolicy={openPolicy} />

      {/* 4. Policy & About Us Modal */}
      <PolicyModal view={activePolicy} onClose={closePolicy} />
    </div>
  );
}
