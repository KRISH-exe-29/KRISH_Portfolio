import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TbTrophy, TbCertificate, TbChevronRight } from 'react-icons/tb'
import styled from 'styled-components'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import engine from '../utils/audioEngine'

gsap.registerPlugin(ScrollTrigger);

const featuredWork = [
  {
    title: "IIT Bombay — Top 7 Nationwide",
    insight: "Secured Top 7 out of 1500+ colleges at the National Entrepreneurship Challenge, IIT Bombay.",
    media: "/assets/pics and videos/NEC TOP 7.jpeg",
    label: "National Recognition"
  },
  {
    title: "Published Patent in Intelligent Systems",
    insight: "Published a patent for an 'Intelligent Street Lighting System' using IoT for dynamic energy control.",
    media: "/assets/pics and videos/presentation 2.jpeg",
    label: "Innovation & IP"
  },
  {
    title: "100% Efficiency Improvement Delivered",
    insight: "Optimized system performance in real-world testing environments at Indo Tech Transformers.",
    media: "/assets/pics and videos/INDO TECH TRANSFORMERS.jpeg",
    label: "Technical Excellence"
  },
  {
    title: "Led Execution Across Large-Scale Events",
    insight: "Coordinated and managed high-impact team initiatives for E-Cell as Vice President.",
    media: "/assets/pics and videos/E-cell TEAM.jpeg",
    label: "Leadership & Strategy"
  }
];

const certifications = [
  "Arduino: Programming and Hardware Implementation (UC Irvine)",
  "Raspberry Pi and Python (UC Irvine)",
  "Internet of Things (NPTEL)",
  "Digital Circuits and Systems (NPTEL)",
  "Logistics and Supply Chain Management (CII)"
];

const ProofOfWork = () => {
  const headerRef = useRef(null);

  useEffect(() => {
    // Header Mask Reveal
    gsap.fromTo(".pow-title-reveal", 
      { y: "100%", rotateX: "5deg" },
      { 
        y: "0%", 
        rotateX: "0deg",
        scrollTrigger: {
          trigger: headerRef.current,
          start: "top 90%",
          end: "top 70%",
          scrub: 0.5
        }
      }
    );

    // Featured Cards Scrub
    const cards = gsap.utils.toArray(".pow-card");
    cards.forEach((card) => {
      gsap.fromTo(card,
        { opacity: 0.4, scale: 0.97 },
        {
          opacity: 1,
          scale: 1,
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
            end: "top 60%",
            scrub: 0.5
          }
        }
      );
    });

    // Certifications Stagger Scrub
    gsap.fromTo(".cert-item",
      { opacity: 0, x: 20 },
      {
        opacity: 1,
        x: 0,
        stagger: 0.05,
        scrollTrigger: {
          trigger: ".space-y-4",
          start: "top 90%",
          end: "top 60%",
          scrub: 0.5
        }
      }
    );

    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  return (
    <section className="section-container" id="achievements">
      <div className="text-center mb-16" ref={headerRef}>
        <p className="section-label mb-2">// PROOF OF WORK</p>
        <div className="overflow-hidden">
          <h2 className="section-title pow-title-reveal">Results over resumes.</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* LEFT SIDE: FEATURED (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredWork.map((work, i) => (
            <FeaturedCard key={i} work={work} index={i} />
          ))}
        </div>

        {/* RIGHT SIDE: CERTS (4 cols) */}
        <div className="lg:col-span-4 flex flex-col pt-4">
          <h3 className="font-mono text-xs tracking-[0.3em] text-color-primary uppercase mb-8 opacity-70">
            Validated Competencies
          </h3>
          <ul className="space-y-4">
            {certifications.map((cert, i) => (
              <li 
                key={i}
                className="flex items-start gap-3 group cert-item"
                onMouseEnter={() => engine.playDrag()}
              >
                <TbChevronRight className="text-color-primary mt-1 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                <span className="text-sm text-text-secondary leading-relaxed font-inter group-hover:text-text-primary transition-colors">
                  {cert}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

const FeaturedCard = ({ work, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => {
        setIsHovered(true);
        engine.playHover();
      }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => engine.playClick()}
      className="relative aspect-video rounded-xl border border-border overflow-hidden cursor-none group bg-bg-secondary pow-card"
      style={{ scale: isHovered ? 1.02 : 1, transition: 'scale 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)' }}
    >
      {/* Background Image Fade In */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.4 : 0 }}
        transition={{ duration: 0.4 }}
      >
        <img src={work.media} alt={work.title} className="w-full h-full object-cover grayscale brightness-50" />
      </motion.div>

      {/* Content Overlay */}
      <div className="absolute inset-0 z-10 p-6 flex flex-col justify-end">
        <label className="text-[10px] font-mono tracking-widest text-color-primary uppercase mb-2 opacity-60">
          {work.label}
        </label>
        
        <div className="relative h-12"> {/* Container for text swap */}
          <AnimatePresence mode="wait">
            {!isHovered ? (
              <motion.h4 
                key="title"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg font-bold text-text-primary leading-tight"
              >
                {work.title}
              </motion.h4>
            ) : (
              <motion.p 
                key="insight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm text-text-secondary font-inter leading-relaxed"
              >
                {work.insight}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-color-primary/5 blur-3xl rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
    </div>
  );
}

export default ProofOfWork;
