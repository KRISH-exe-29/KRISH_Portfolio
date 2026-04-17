import React from 'react'
import { motion } from 'framer-motion'
import engine from '../utils/audioEngine'

const skillCategories = [
  {
    title: "Electrical Control & Automation",
    skills: ["MCC Panel Hardware Design", "Feeder Classification", "Power & Control Cable Selection", "Load Optimization", "Transformer Testing"]
  },
  {
    title: "Software & Digital Modeling",
    skills: ["MATLAB", "AutoCAD", "Proteus", "Tinkercad", "PSpice"]
  },
  {
    title: "Programming",
    skills: ["Python", "Java", "C", "JavaScript", "HTML/CSS"]
  },
  {
    title: "Core Expertise",
    skills: ["Power Electronics", "Control Systems", "Microprocessors"]
  }
];

export default function Skills() {
  return (
    <section className="section-container" id="skills">
      <div className="section-header">
         <p className="section-label">// SKILLS</p>
         <h2 className="section-title">Technical Proficiency</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
        {skillCategories.map((category, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <h3 className="font-mono text-sm tracking-widest uppercase text-color-primary mb-6 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-color-primary/30"></span>
              {category.title}
            </h3>
            <div className="flex flex-wrap gap-3">
              {category.skills.map(skill => (
                <span 
                  key={skill} 
                  onMouseEnter={() => engine.playHover()}
                  className="font-inter text-xs text-text-secondary bg-white/5 border border-white/10 px-4 py-2 hover:border-color-primary/50 hover:text-color-primary transition-colors cursor-none"
                >
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
