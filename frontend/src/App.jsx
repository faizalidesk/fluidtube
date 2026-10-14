import React from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Resolutions from "./components/Resolutions";
import Features from "./components/Features";
import Faq from "./components/Faq";
import CtaBanner from "./components/CtaBanner";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="page-wrapper">
      {/* Ambient background glow elements */}
      <div className="bg-shape shape-top"></div>
      <div className="bg-shape shape-bottom"></div>

      {/* 1. Header & Navigation */}
      <Navbar />

      {/* 2. Hero & Converter Showcase */}
      <main>
        <Hero />
        <HowItWorks />
        <Resolutions />
        <Features />
        <Faq />
        <CtaBanner />
      </main>

      {/* 3. Footer */}
      <Footer />
    </div>
  );
}
