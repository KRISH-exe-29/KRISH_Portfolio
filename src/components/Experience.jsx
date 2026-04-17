import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import engine from '../utils/audioEngine';

gsap.registerPlugin(ScrollTrigger);

const experiences = [
  {
    role: "Engineer Intern",
    company: "Indo Tech Transformers Limited",
    duration: "2026",
    location: "Chennai, Tamil Nadu, India",
    description: "Performed comprehensive transformer testing in accordance with IEC 60076 and IS 2026 standards in the 161KV testing bay. Spearheaded the development of a Python and PyQt5-based desktop automation platform that streamlined Hardware List standardisation, reducing processing time from 30 minutes to just 60 seconds. Currently evaluating multi-variate fastener standardisation across 60+ specifications, directly generating a strategic report for CEO review to optimize supply chain requirements.",
    media: [
      { type: "image", src: "/assets/pics and videos/INDO TECH TRANSFORMERS.jpeg" }
    ]
  },
  {
    role: "Automation Engineering Intern",
    company: "Bühler India Pvt. Ltd.",
    duration: "2025",
    location: "Bangalore, Karnataka, India",
    description: "Conducted systematic classification of feeders, load calculation, and selected switchgear equipment for complex MCC panels. Co-developed an advanced GUI automation tool designed specifically to overhaul hardware requirement documentation, effectively eliminating 90% of manual calculation errors and significantly accelerating the engineering workflow.",
    media: [
      { type: "image", src: "/assets/pics and videos/BÜHLER INDIA 1.jpeg" },
      { type: "image", src: "/assets/pics and videos/BÜHLER INDIA 2.jpeg" }
    ]
  },
  {
    role: "Full Stack Developer Intern",
    company: "Inovate Technologies",
    duration: "2024",
    location: "Remote",
    description: "Contributed to 'Project: Phantom' by architecting interactive, highly-responsive UI components combined with robust and scalable backend systems. Drove major performance optimizations that dramatically improved overall system load times and application responsiveness metrics.",
  },
  {
    role: "Electrical Engineer Intern",
    company: "Mettur Thermal Power Plant",
    duration: "2024",
    location: "Mettur, Tamil Nadu, India",
    description: "Performed systematic inspection and compiled rigorous documentation of high-voltage electrical systems at the 4x210 MW Thermal Power Station. Conducted extensive examinations of critical infrastructure including boiler operations, turbine functionality, and generator health monitoring.",
  },
  {
    role: "Electrical Engineer Intern",
    company: "Southern Railway",
    duration: "2023",
    location: "Tambaram, Tamil Nadu",
    description: "Evaluated 110V lead-acid battery applications and systematically analyzed the requirements for a full Li-ion transition strategy for LHB AC railway coaches. Presented comprehensive findings outlining the energy efficiency limits and safety factors involved.",
    media: [
       { type: "image", src: "/assets/pics and videos/SOUTHERN RAILWAY 1.jpeg" }
    ]
  }
];

export default function Experience() {
  const headerRef = useRef(null);

  useEffect(() => {
    // Header Mask Reveal
    gsap.fromTo(".exp-title-reveal", 
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

    // Cards Reveal & Sound
    const cards = gsap.utils.toArray(".exp-card");
    cards.forEach((card) => {
      // Motion Scrub
      gsap.fromTo(card,
        { opacity: 0.4, scale: 0.97, rotateX: "2deg", y: 30 },
        {
          opacity: 1,
          scale: 1,
          rotateX: "0deg",
          y: 0,
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
    <section className="section-container" id="experience">
      <div className="section-header" ref={headerRef}>
         <p className="section-label">// EXPERIENCE</p>
         <div className="overflow-hidden">
           <h2 className="section-title exp-title-reveal">Professional Journey</h2>
         </div>
      </div>

      <div className="relative border-l border-border mt-10 ml-4 lg:ml-8">
        {experiences.map((exp, i) => (
          <div key={i} className="mb-14 ml-8 group relative exp-card">
            <div className="absolute w-3 h-3 bg-color-primary rounded-full -left-[38px] top-6 opacity-60 group-hover:opacity-100 group-hover:shadow-[0_0_10px_#FFB800] transition-all duration-300" />
            
            <div className="glass-card p-6 md:p-8 rounded-sm" onMouseEnter={() => engine.playDrag()}>
                <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-2">
                  <h3 className="font-cinzel text-xl md:text-2xl text-text-primary group-hover:text-color-primary transition-colors">{exp.role}</h3>
                  <span className="font-mono text-xs text-color-primary mt-2 md:mt-0 px-3 py-1 bg-color-primary/10 rounded-sm inline-block">{exp.duration}</span>
                </div>
                <h4 className="font-inter text-sm text-text-muted mb-5 font-medium uppercase tracking-wide border-b border-border pb-4">{exp.company} <span className="font-mono lowercase text-xs ml-2 opacity-50">({exp.location})</span></h4>
                <p className="font-inter leading-relaxed text-sm text-text-secondary w-full max-w-4xl mb-4">{exp.description}</p>
                {exp.media && exp.media.length > 0 && (
                    <div className="flex flex-wrap gap-4 mt-6">
                     {exp.media.map((item, idx) => (
                        <div key={idx} className="relative w-full max-w-sm rounded-sm overflow-hidden border border-border group-hover:border-color-primary/30 transition-colors bg-black/40 p-2">
                          {item.type === 'video' ? (
                              <video src={item.src} autoPlay loop muted playsInline className="w-full h-auto rounded-sm object-cover" />
                          ) : (
                              <img src={item.src} alt="Experience Media" className="w-full h-auto rounded-sm grayscale group-hover:grayscale-0 transition-all duration-500" />
                          )}
                        </div>
                     ))}
                   </div>
                )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
