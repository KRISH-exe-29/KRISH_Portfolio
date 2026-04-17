import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import engine from '../utils/audioEngine';

gsap.registerPlugin(ScrollTrigger);

const cards = [
  {
    image: "/assets/pics and videos/E-cell TEAM.jpeg",
    defaultLabel: "Leadership & Initiative",
    hoverTitle: "Initiating & Managing Team-Driven Events",
    insight: "Built the E-Cell team from scratch — brainstormed, coordinated, and executed large-scale student initiatives.",
    size: "big",
  },
  {
    image: "/assets/pics and videos/INDO TECH TRANSFORMERS.jpeg",
    defaultLabel: "Testing & Execution",
    hoverTitle: "Real-World System Testing & Execution",
    insight: "Conducted 161KV transformer tests under IEC 60076 standards at a leading HV testing bay.",
    size: "big",
  },
  {
    image: "/assets/pics and videos/NEC TOP 7.jpeg",
    defaultLabel: "National Recognition",
    hoverTitle: "National-Level Recognition & Competition",
    insight: "Secured Top 7 at IIT Bombay's National Entrepreneurship Challenge.",
    size: "medium",
  },
  {
    image: "/assets/pics and videos/Public speaking and Guidance .jpeg",
    defaultLabel: "Speaking & Guidance",
    hoverTitle: "Leading Discussions & Guiding Teams",
    insight: "Delivered entrepreneurship talks to 500+ students at St. Joseph's College.",
    size: "medium",
  },
  {
    image: "/assets/pics and videos/BÜHLER INDIA 1.jpeg",
    defaultLabel: "Industrial Exposure",
    hoverTitle: "Hands-on Engineering at Scale",
    insight: "Navigated factory floors and MCC panels at a global automation leader.",
    size: "medium",
  },
];

const offsets = [
  { y: 0 },         // big 1
  { y: 30 },        // big 2
  { y: -10 },       // medium 1
  { y: 20 },        // medium 2
  { y: -5 },        // medium 3
];

export default function SystemsBeyondCode() {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const headerRef = useRef(null);
  const narrativeRef = useRef(null);

  useEffect(() => {
    // Header Mask Reveal
    gsap.fromTo(".beyond-title-reveal", 
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

    // Narrative & Tagline Scrub
    gsap.fromTo(".narrative-scrub",
      { opacity: 0, y: 20 },
      { 
        opacity: 1, 
        y: 0,
        scrollTrigger: {
          trigger: narrativeRef.current,
          start: "top 90%",
          end: "top 70%",
          scrub: 0.5
        }
      }
    );

    // Cards Reveal & Sound
    const cards = gsap.utils.toArray(".beyond-card-scrub");
    cards.forEach((card) => {
      // Motion Scrub
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

    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  return (
    <section className="section-container relative" id="beyond-code">
      {/* Header */}
      <div className="section-header" ref={headerRef}>
        <p className="section-label">// BEYOND CODE</p>
        <div className="overflow-hidden">
          <h2 className="section-title beyond-title-reveal">Systems Beyond Code</h2>
        </div>
        <p className="font-mono text-xs text-text-muted mt-3 tracking-wider uppercase">
          Where ideas turned into execution
        </p>
      </div>

      {/* Narrative Container */}
      <div ref={narrativeRef}>
        <p className="font-inter text-text-secondary text-base md:text-lg italic max-w-2xl mb-4 leading-relaxed narrative-scrub">
          "I build systems not just in code, but through people, ideas, and execution."
        </p>
        <p className="font-cinzel text-color-primary text-sm md:text-base tracking-[0.25em] uppercase mb-16 font-bold narrative-scrub">
          Not assigned. Initiated.
        </p>
      </div>

      {/* Cards Layout */}
      <div className="beyond-cards-grid">
        {cards.map((card, i) => {
          const isHovered = hoveredIdx === i;
          const isSiblingHovered = hoveredIdx !== null && hoveredIdx !== i;

          return (
            <div
              key={i}
              className={`beyond-card beyond-card-scrub ${card.size === 'big' ? 'beyond-card--big' : 'beyond-card--medium'}`}
              style={{ marginTop: offsets[i].y }}
              onMouseEnter={() => {
                setHoveredIdx(i);
                engine.playHover();
                engine.playDrag();
              }}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => engine.playClick()}
            >
              {/* Image */}
              <div
                className="beyond-card__image-wrap"
                style={{
                  filter: isSiblingHovered ? 'blur(3px) brightness(0.5)' : 'none',
                  transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                  opacity: isSiblingHovered ? 0.4 : isHovered ? 1 : 0.75,
                  transition: 'all 0.45s cubic-bezier(0.23, 1, 0.32, 1)',
                }}
              >
                <img
                  src={card.image}
                  alt={card.hoverTitle}
                  className="beyond-card__image"
                  loading="lazy"
                />

                {/* Hover Overlay */}
                <div
                  className="beyond-card__overlay"
                  style={{
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.4s ease',
                  }}
                >
                  <h4 className="font-cinzel text-sm md:text-base text-white font-bold mb-2 tracking-wide">
                    {card.hoverTitle}
                  </h4>
                  <p className="font-inter text-xs md:text-sm text-white/80 leading-relaxed">
                    {card.insight}
                  </p>
                </div>
              </div>

              {/* Default Label (visible by default, fades on hover) */}
              <p
                className="beyond-card__label"
                style={{
                  opacity: isHovered ? 0 : 1,
                  transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                  transition: 'all 0.35s ease',
                }}
              >
                {card.defaultLabel}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
