import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { HiOutlineMenu } from "react-icons/hi";
import ThemeToggle from "./ui/ThemeToggle";
import SoundToggle from "./ui/SoundToggle";
import engine from "../utils/audioEngine";

const NAV_LINKS = ["about", "experience", "projects", "skills", "achievements", "contact"];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      const sections = NAV_LINKS.map((id) => document.getElementById(id)).filter(Boolean);
      let current = "";
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= 200) current = s.id;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 2, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 w-full z-[100] px-5 lg:px-28 py-4 transition-all duration-300 ${scrolled ? "nav-glass" : "bg-transparent"}`}
      >
        <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
          <div className="flex-1 flex justify-start items-center">
             <ThemeToggle />
          </div>

          <ul className="hidden lg:flex items-center gap-x-8">
            {NAV_LINKS.map((s) => (
              <li key={s}>
                <button 
                  onClick={() => scrollToSection(s)} 
                  onMouseEnter={() => engine.playHover()}
                  className={`nav-link cursor-none text-text-primary/70 hover:text-color-primary font-bold ${activeSection === s ? "active text-color-primary" : ""}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              </li>
            ))}
          </ul>

          <div className="flex-1 flex items-center justify-end gap-4">
            <SoundToggle />
            <button 
              onClick={() => {
                engine.playClick();
                scrollToSection('contact');
              }}
              onMouseEnter={() => engine.playHover()}
              className="hidden lg:block nav-link cursor-none text-text-primary/70 hover:text-color-primary font-bold uppercase text-xs tracking-widest"
            >
              Resume
            </button>
          </div>

          <button className="lg:hidden text-text-primary cursor-none ml-auto" onClick={() => setIsOpen(!isOpen)}>
            <HiOutlineMenu size={24} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-0 z-[200] bg-bg-primary/95 backdrop-blur-md flex flex-col items-center justify-center gap-6">
            {NAV_LINKS.map((s, i) => (
              <motion.button key={s} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                onClick={() => scrollToSection(s)} className="nav-link text-lg cursor-none">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </motion.button>
            ))}
            <button 
              onClick={() => {
                engine.playClick();
                scrollToSection('contact');
              }} 
              className="nav-link text-lg cursor-none mt-4 text-text-primary/70 hover:text-color-primary font-bold uppercase tracking-widest"
            >
              Resume
            </button>
            <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 text-text-primary text-2xl cursor-none">✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
