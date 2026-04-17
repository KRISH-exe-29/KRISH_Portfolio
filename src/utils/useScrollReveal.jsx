import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * SectionTitle — Animated section header with underline reveal
 */
export function SectionTitle({ text }) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { setRevealed(true); obs.unobserve(el); }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const letters = text.split("");

  return (
    <h2 ref={ref} className={`section-title mb-10 ${revealed ? "revealed" : ""}`}>
      {letters.map((char, i) => (
        <span key={i} className="title-letter" style={{ transitionDelay: `${i * 50}ms` }}>
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </h2>
  );
}

/**
 * useCountUp — Counts from 0 to target value on scroll
 */
export function useCountUp(end, duration = 1800) {
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !counted.current) {
            counted.current = true;
            const numStr = String(end).replace(/[^0-9]/g, "");
            const target = parseInt(numStr, 10);
            const prefix = String(end).startsWith("Top") ? "Top " : "";
            const suffix = String(end).includes("+") ? "+" : String(end).includes("%") ? "%" : "";

            if (isNaN(target)) { el.textContent = end; obs.unobserve(el); return; }

            const startTime = performance.now();
            function update(now) {
              const progress = Math.min((now - startTime) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              el.textContent = prefix + Math.round(target * eased) + suffix;
              if (progress < 1) requestAnimationFrame(update);
            }
            requestAnimationFrame(update);
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);

  return ref;
}

/**
 * useScrollReveal — Triggers when scrolled into view
 */
export default function useScrollReveal(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (entry.target) observer.unobserve(entry.target);
        }
      },
      { threshold }
    );
    const currentRef = ref.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [threshold]);

  return { ref, isVisible };
}
