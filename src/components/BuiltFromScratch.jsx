import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { TbTrophy, TbCode, TbDatabase, TbCpu, TbNetwork } from 'react-icons/tb'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import engine from '../utils/audioEngine'

gsap.registerPlugin(ScrollTrigger);

const capabilities = [
  {
    title: "Arduino Systems",
    insight: "Built real hardware-software integration systems",
    icon: <TbCpu size={32} />,
    color: "#FFB800"
  },
  {
    title: "Connected Systems",
    insight: "Designed real-world device communication systems",
    icon: <TbNetwork size={32} />,
    color: "#FFB800"
  },
  {
    title: "Data Systems",
    insight: "Worked with structured data and queries",
    icon: <TbDatabase size={32} />,
    color: "#FFB800"
  },
  {
    title: "Scalable Databases",
    insight: "Built flexible NoSQL data systems",
    icon: <TbDatabase size={32} />,
    color: "#833AB4" 
  },
  {
    title: "Core Programming",
    insight: "Strengthened problem-solving and logic building",
    icon: <TbCode size={32} />,
    color: "#FFB800"
  }
];

const BuiltFromScratch = () => {
  const headerRef = useRef(null);

  useEffect(() => {
    // Header Mask Reveal
    gsap.fromTo(".bfs-title-reveal", 
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
    const cards = gsap.utils.toArray(".bfs-card-scrub");
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
    <section className="py-20 bg-bg-primary overflow-hidden">
      <div className="section-container">
        <div className="mb-12" ref={headerRef}>
          <div className="overflow-hidden">
            <h2 className="text-3xl font-bold text-text-primary mb-2 bfs-title-reveal">Built From Scratch</h2>
          </div>
          <p className="text-text-secondary opacity-70">Every system I understand, I built from the ground up.</p>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="flex gap-8 overflow-x-auto pb-12 pt-8 snap-x no-scrollbar">
          {capabilities.map((item, i) => (
            <CapabilityCard key={i} item={item} index={i} />
          ))}
          {/* Spacer for scroll end */}
          <div className="min-w-[100px] h-full" />
        </div>
      </div>
    </section>
  )
}

const CapabilityCard = ({ item, index }) => {
  // Add slight rhythm to the layout
  const yOffset = index % 2 === 0 ? "15px" : "-15px";
  const scale = index % 3 === 0 ? 0.95 : 1;

  return (
    <div
      onMouseEnter={() => { engine.playHover(); engine.playDrag(); }}
      onClick={() => engine.playClick()}
      className="snap-center min-w-[280px] md:min-w-[320px] h-48 relative group bfs-card-scrub"
      style={{ 
        transform: `translateY(${yOffset}) scale(${scale})`,
        transition: 'transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)'
      }}
    >
      {/* Default State: Clean Title */}
      <div className="absolute inset-0 bg-bg-secondary/40 border border-border rounded-2xl flex flex-col items-center justify-center p-6 transition-all duration-500 group-hover:opacity-0 group-hover:scale-95">
        <div className="text-color-primary mb-4 opacity-50">{item.icon}</div>
        <h4 className="text-lg font-bold text-text-primary opacity-80 uppercase tracking-widest">{item.title}</h4>
      </div>

      {/* Hover State: Morph into Insight + Glow */}
      <div className="absolute inset-0 bg-color-primary/10 border border-color-primary/30 rounded-2xl opacity-0 scale-95 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105 flex flex-col items-center justify-center p-6 text-center shadow-[0_0_30px_rgba(255,184,0,0.1)]">
        <div className="text-color-primary mb-3 drop-shadow-[0_0_8px_rgba(255,184,0,0.5)]">
          {item.icon}
        </div>
        <p className="text-sm font-inter text-text-primary leading-tight font-medium">
          {item.insight}
        </p>
        
        {/* Subtle Background Graphic */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-color-primary/5 to-transparent opacity-50" />
      </div>

      {/* Amber Glow Effect */}
      <div className="absolute -inset-1 bg-color-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl -z-10" />
    </div>
  )
}

export default BuiltFromScratch;
