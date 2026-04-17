import React from 'react'
import { motion } from 'framer-motion'
import { TbMail, TbBrandLinkedin, TbBrandGithub } from 'react-icons/tb'
import ContactCard from './ui/ContactCard'
import ResumeCard from './ui/ResumeCard'

export default function Contact() {
  return (
    <section className="section-container relative" id="contact">
      <div className="glass-card p-10 md:p-16 lg:p-20 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-color-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-color-accent/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <p className="font-mono text-xs text-color-primary tracking-[0.3em] uppercase mb-4">// INITIATE CONNECTION</p>
          <h2 className="font-cinzel text-4xl md:text-5xl lg:text-6xl text-text-primary mb-6">Ready to Automate the Impossible?</h2>
          <p className="font-inter text-text-secondary max-w-xl mx-auto leading-relaxed mb-10">
            Currently open to full-time opportunities, collaborations, and engineering discussions.
            Whether you have a question or just want to say hi, my inbox is always open.
          </p>

          <div className="mt-12 flex flex-col md:flex-row justify-center items-center gap-8 w-full">
            <ContactCard />
            <ResumeCard />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
