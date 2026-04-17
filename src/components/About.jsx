import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import engine from '../utils/audioEngine'

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    // Header Mask Reveal
    gsap.fromTo(".about-title-reveal", 
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

    // Content Scrub
    gsap.fromTo(contentRef.current,
      { opacity: 0.4, y: 50 },
      {
        opacity: 1,
        y: 0,
        scrollTrigger: {
          trigger: contentRef.current,
          start: "top 90%",
          end: "top 60%",
          scrub: 0.5
        }
      }
    );

    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  return (
    <section className="section-container relative pt-32" id="about" ref={sectionRef}>
      <div className="section-header" ref={headerRef}>
        <p className="section-label">// ABOUT</p>
        <div className="overflow-hidden">
          <h2 className="section-title about-title-reveal">Identity & Path</h2>
        </div>
      </div>

      <div ref={contentRef} className="flex flex-col lg:flex-row gap-12 lg:gap-20">
        <div className="lg:w-1/3 flex flex-col items-center lg:items-start gap-4">
          <div className="image-container w-full max-w-sm aspect-[4/5]">
            <img src="/assets/pics and videos/About me section.webp" alt="Krishna Raju S" className="object-cover w-full h-full" />
          </div>
        </div>

        <div className="lg:w-2/3 flex flex-col gap-6 font-inter text-text-secondary text-sm lg:text-base leading-relaxed">
          <p>
            An <strong className="text-color-primary">Electrical and Electronics Engineering</strong> undergraduate focused on automation systems, MCC panel engineering, and IoT hardware integration. My approach combines rigorous electrical engineering principles with modern software automation tools to solve complex industrial problems.
          </p>
          <p>
            I specialize in developing <span className="text-color-primary">desktop GUI automation frameworks</span> and analyzing hardware requirement specifications to build tools that dramatically cut processing time. For example, my work converting a 30-minute manual task into a 60-second automated script demonstrates my commitment to efficiency.
          </p>
          <p>
            With real-world experience at leading firms like Indo Tech Transformers and Bühler India, I have navigated testing bays, schematic classification, and load calculation. Furthermore, as a patent holder for an intelligent street lighting system, I actively bridge the gap between theoretical electrical concepts and tangible, optimized solutions.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
             <div className="flex flex-col">
               <span className="font-cinzel text-3xl text-color-primary">5+</span>
               <span className="font-mono text-xs mt-1 text-text-muted uppercase tracking-wider">Roles</span>
             </div>
             <div className="flex flex-col">
               <span className="font-cinzel text-3xl text-color-primary">1</span>
               <span className="font-mono text-xs mt-1 text-text-muted uppercase tracking-wider">Patent</span>
             </div>
             <div className="flex flex-col">
               <span className="font-cinzel text-3xl text-color-primary">Top 7</span>
               <span className="font-mono text-xs mt-1 text-text-muted uppercase tracking-wider">IIT Bombay</span>
             </div>
             <div className="flex flex-col">
               <span className="font-cinzel text-3xl text-color-primary">15+</span>
               <span className="font-mono text-xs mt-1 text-text-muted uppercase tracking-wider">Projects</span>
             </div>
          </div>
        </div>
      </div>
    </section>
  )
}
