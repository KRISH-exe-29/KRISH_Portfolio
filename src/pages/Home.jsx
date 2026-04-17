import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { TbDownload, TbChevronDown } from "react-icons/tb";
import SplashButton from "../components/ui/SplashButton";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import engine from "../utils/audioEngine";

gsap.registerPlugin(ScrollTrigger);

const RollingNumber = ({ n, suffix = "" }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      if (current < n) {
        current += Math.ceil(n / 20) || 1; 
        if (current >= n) {
          current = n;
          clearInterval(interval);
        }
        setCount(current);
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [n]);
  return <>{count}{suffix}</>;
};

export default function Home() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouse = (e) => {
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      setMousePos({ x: (e.clientX - cx) * 0.015, y: (e.clientY - cy) * 0.015 });
    };
    window.addEventListener("mousemove", handleMouse);

    // GSAP Scroll Animations
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#hero",
        start: "top top",
        end: "+=60%",
        scrub: 0.5,
        pin: true,
        pinSpacing: true
      }
    });

    tl.to(".hero-main-content", {
      opacity: 0,
      y: -80,
      scale: 0.95,
      filter: "blur(20px)",
      ease: "power2.inOut"
    }, 0);

    // Mask Reveal for Heading
    gsap.fromTo(".reveal-text", 
      { y: "110%", rotateX: "10deg" },
      { 
        y: "0%", 
        rotateX: "0deg",
        duration: 1.2, 
        ease: "power4.out",
        stagger: 0.1,
        delay: 0.5
      }
    );

    return () => {
      window.removeEventListener("mousemove", handleMouse);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section className="min-h-screen flex items-center relative overflow-hidden" id="hero">
      <div className="pcb-bg" />
      <div className="flex justify-between items-center px-5 lg:px-28 w-full max-w-7xl mx-auto lg:flex-row flex-col-reverse gap-8 lg:gap-0">
        {/* LEFT — Text */}
        <motion.div className="lg:w-[55%] w-full"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 2.2 }}>

          <p className="hero-preheading mb-4">
            <span className="accent">&lt;</span> EEE <span className="accent">·</span> Automation <span className="accent">·</span> IoT <span className="accent">/&gt;</span>
          </p>

          <div className="hero-main-content">
            <h1 className="font-cinzel tracking-tight leading-[1] text-5xl md:text-7xl lg:text-8xl font-bold text-text-primary mb-4">
              <div className="overflow-hidden">
                <span className="reveal-text block">KRISHNA</span>
              </div>
              <div className="overflow-hidden mt-2">
                <span className="reveal-text block">RAJU S</span>
              </div>
            </h1>
          </div>

          <div className="hero-typewriter mt-6 text-color-accent">
            <TypeAnimation
              sequence={["Electrical Engineer", 2000, "Automation Developer", 2000, "IoT Systems Architect", 2000, "Patent Holder", 2000]}
              wrapper="span" speed={45} repeat={Infinity}
            />
          </div>

          <p className="hero-tagline mt-4 opacity-90 font-light">Engineering the Invisible. Automating the Impossible.</p>

          <div className="flex gap-4 mt-10 flex-wrap">
            <SplashButton as="a" href="#projects">View My Work</SplashButton>
          </div>

          <div className="hero-stats mt-12">
            <span><strong><RollingNumber n={5} suffix="+" /></strong> Industry Roles</span><span className="sep">|</span>
            <span><strong><RollingNumber n={1} /></strong> Patent Published</span><span className="sep">|</span>
            <span>Top <strong><RollingNumber n={7} /></strong> IIT Bombay NEC</span>
          </div>
        </motion.div>

        {/* RIGHT — Video Element replacing illustration */}
        <motion.div className="lg:w-[45%] w-full flex justify-center items-center"
          initial={{ opacity: 0, x: 50, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)`, transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          
          <div className="relative w-full max-w-[420px] aspect-video shadow-[-10px_10px_40px_rgba(0,0,0,0.6)] flex items-center justify-center bg-[#000]">
             <video 
                src="/assets/pics and videos/Background video 2.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen"
             />
             <div className="absolute inset-0 bg-gradient-radial from-transparent to-bg-primary opacity-60 pointer-events-none" />
          </div>

        </motion.div>
      </div>

      <motion.div className="scroll-chevrons flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }}>
        <TbChevronDown className="chevron-bounce" size={20} />
      </motion.div>
    </section>
  );
}
