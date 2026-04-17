import React, { useState, useEffect, Suspense, lazy } from 'react'
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import CustomCursor from './utils/CursorAnimation'
import Loader from './components/ui/Loader'
import ScrollyBackground from './components/ScrollyBackground'
import engine from './utils/audioEngine'
import gsap from 'gsap'

// Lazy loaded non-critical sections
const About = lazy(() => import('./components/About'));
const Experience = lazy(() => import('./components/Experience'));
const Projects = lazy(() => import('./components/Projects'));
const Skills = lazy(() => import('./components/Skills'));
const Achievements = lazy(() => import('./components/Achievements'));
const SystemsBeyondCode = lazy(() => import('./components/SystemsBeyondCode'));
const BuiltFromScratch = lazy(() => import('./components/BuiltFromScratch'));
const Contact = lazy(() => import('./components/Contact'));
const Footer = lazy(() => import('./components/Footer'));
import engine from './utils/audioEngine'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [loading, setLoading] = useState(true);
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    // Audio engine is now purely lazily initialized post-interaction

    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Sync Lenis with ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // Audio triggers ONLY after entering
    let listenersAdded = false;
    
    if (!loading) {
      // 5. Audio Start Delay (300ms after transition)
      // The cinematic transition in Loader takes ~600ms, then loading becomes false.
      // We add an extra 300ms delay here.
      setTimeout(() => {
        engine.init(); // Load audio files only after click
        engine.onFirstInteraction();
      }, 300);

      const handleGlobalClick = () => {
        engine.playClick();
      };
      
      window.addEventListener('click', handleGlobalClick);
      listenersAdded = true;
    }
    
    return () => {
      lenis.destroy();
      if (listenersAdded) {
        window.removeEventListener('click', handleGlobalClick);
      }
    };
  }, [loading]);

  return (
    <>
      <CustomCursor />
      <ScrollyBackground />
      <AnimatePresence>
        {loading && (
           <motion.div 
             key="loader"
             className="fixed inset-0 z-[9999] bg-[#000] flex items-center justify-center overflow-hidden"
             exit={{ 
               opacity: 0, 
               filter: "blur(20px)",
               transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
             }}
           >
             <Loader onEnter={() => setLoading(false)} />
           </motion.div>
        )}
      </AnimatePresence>

      {!loading && (
        <motion.div className='font-inter scroll-smooth overflow-x-hidden relative'
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Subtle scroll progress indicator */}
          <motion.div
            className="fixed top-0 bottom-0 right-0 w-[2px] bg-color-primary z-[9999] origin-top opacity-60"
            style={{ scaleY }}
          />

          <Navbar />
          <Home />
          
          <Suspense fallback={null}>
            <About />
            <Experience />
            <Projects />
            <Skills />
            <Achievements />
            <SystemsBeyondCode />
            <BuiltFromScratch />
            <Contact />
            <Footer />
          </Suspense>
        </motion.div>
      )}
    </>
  )
}
