import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { TbExternalLink } from 'react-icons/tb'
import { BsGithub } from 'react-icons/bs'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import engine from '../utils/audioEngine'

gsap.registerPlugin(ScrollTrigger);

const projects = [
  {
    title: "Testing Planning System",
    description: "An automated web application streamlining scheduling for a Transformer high-voltage testing bay. Replaced manual Excel processes with an interactive UI, increasing planning efficiency by 40%.",
    tech: ["HTML", "CSS", "JavaScript"],
    link: "https://test-schedule-ittl.netlify.app/",
    type: "Web Application"
  },
  {
    title: "Industrial Data Collection Portal",
    description: "Digital platform unifying data pipelines for Planning, Electrical, Mechanical, and Testing departments. Eliminates paperwork dependencies for real-time order tracking.",
    tech: ["React", "Tailwind", "Netlify"],
    link: "https://indotech-transformers.netlify.app/",
    type: "Web Application"
  },
  {
    title: "Intelligent Street Lighting (Patent)",
    description: "IoT solution equipped with ESP8266 and IR sensors to dynamically regulate light intensity, reducing energy usage by 60%. Incorporates GPS for automated fault detection.",
    tech: ["IoT", "ESP8266", "GPS", "C"],
    github: "https://github.com/KRISH-exe-29",
    type: "Hardware & IoT"
  },
  {
    title: "GUI Automation Tool for HWE",
    description: "Python-based desktop application automating the generation of hardware documentation. Calculates load ratings and selects appropriate switchgear, eliminating 90% of manual calculation errors.",
    tech: ["Python", "PyQt", "Pandas"],
    github: "https://github.com/KRISH-exe-29",
    link: "https://bulhergroupofcompany.streamlit.app/",
    type: "Desktop App"
  },
  {
    title: "Flood Alerting System",
    description: "IoT prototype utilizing sensor networks to transmit real-time alerts. Designed to reduce potential flood downtime by 90% in susceptible areas.",
    tech: ["Arduino", "Sensors", "IoT"],
    github: "https://github.com/KRISH-exe-29",
    type: "Hardware Prototype"
  }
];

export default function Projects() {
  const headerRef = useRef(null);

  useEffect(() => {
    // Header Mask Reveal
    gsap.fromTo(".proj-title-reveal", 
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
    const cards = gsap.utils.toArray(".proj-card");
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
    <section className="section-container" id="projects">
      <div className="section-header" ref={headerRef}>
         <p className="section-label">// PROJECTS</p>
         <div className="overflow-hidden">
           <h2 className="section-title proj-title-reveal">Engineered Solutions</h2>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
        {projects.map((project, i) => (
          <div key={i}
            onMouseEnter={() => { engine.playHover(); engine.playDrag(); }}
            onClick={() => engine.playClick()}
            className="glass-card p-8 flex flex-col justify-between group proj-card"
          >
            <div>
              <span className="font-mono text-[10px] uppercase text-color-accent tracking-widest mb-3 block">{project.type}</span>
              <h3 className="font-cinzel text-xl text-text-primary mb-3 group-hover:text-color-primary transition-colors">{project.title}</h3>
              <p className="font-inter text-sm text-text-secondary leading-relaxed mb-6">
                {project.description}
              </p>
            </div>
            <div>
              <div className="flex flex-wrap gap-2 mb-6">
                {project.tech.map(t => (
                  <span key={t} className="font-mono text-[10px] text-text-muted border border-border px-2 py-1 bg-black/20">{t}</span>
                ))}
              </div>
              <div className="flex gap-4">
                {project.link && (
                  <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-color-primary transition-colors cursor-none">
                    <TbExternalLink size={20} />
                  </a>
                )}
                {project.github && (
                  <a href={project.github} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-color-primary transition-colors cursor-none">
                    <BsGithub size={19} />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
