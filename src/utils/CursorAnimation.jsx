import React, { useEffect, useState, useRef } from "react";

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [hoveringType, setHoveringType] = useState(null);
  const [clicking, setClicking] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const outerRef = useRef({ x: -100, y: -100 });
  const animRef = useRef(null);

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    setIsTouchDevice(isTouch);
    if (isTouch) return;
    
    // Fallback initialize to center if no mouse movement captured yet
    if (pos.x === -100) {
      setPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      outerRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }

    const handleMove = (e) => setPos({ x: e.clientX, y: e.clientY });
    const handleDown = () => setClicking(true);
    const handleUp = () => setClicking(false);

    const handleOver = (e) => {
      const t = e.target;
      if (t.closest("button") || t.classList?.contains("resume-card") || t.classList?.contains("btn-primary") || t.classList?.contains("btn-secondary") || t.closest(".loader") || t.closest(".face")) {
        setHoveringType("button");
      } else if (t.closest("a") || t.classList?.contains("nav-link") || t.classList?.contains("skill-pill") || t.classList?.contains("contact-item") || t.classList?.contains("social-icon")) {
        setHoveringType("link");
      }
    };
    const handleOut = () => {
      setHoveringType(null);
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("mouseup", handleUp);
    document.addEventListener("mouseover", handleOver, { passive: true });
    document.addEventListener("mouseout", handleOut, { passive: true });

    const lerp = () => {
      outerRef.current.x += (pos.x - outerRef.current.x) * 0.12;
      outerRef.current.y += (pos.y - outerRef.current.y) * 0.12;
      const outerEl = document.getElementById("cursor-outer");
      if (outerEl) {
        let size = 32;
        if (hoveringType === "button") size = 42;
        else if (hoveringType === "link") size = 36;
        
        outerEl.style.width = size + "px";
        outerEl.style.height = size + "px";
        outerEl.style.left = outerRef.current.x - size / 2 + "px";
        outerEl.style.top = outerRef.current.y - size / 2 + "px";
      }
      animRef.current = requestAnimationFrame(lerp);
    };
    animRef.current = requestAnimationFrame(lerp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mouseup", handleUp);
      document.removeEventListener("mouseover", handleOver);
      document.removeEventListener("mouseout", handleOut);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [pos.x, pos.y, hoveringType]);

  if (isTouchDevice) return null;

  return (
    <>
      {hoveringType !== "button" && (
        <div className="custom-cursor fixed pointer-events-none rounded-full"
          style={{ width: 8, height: 8, left: pos.x - 4, top: pos.y - 4, zIndex: 10001,
            backgroundColor: "var(--color-primary)",
            boxShadow: hoveringType === "link" ? "0 0 10px var(--color-primary)" : "0 0 6px var(--color-primary)",
            transform: clicking ? "scale(0.9)" : (hoveringType === "link" ? "scale(1.2)" : "scale(1)"),
            transition: "transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }} />
      )}
      <div id="cursor-outer" className="custom-cursor fixed pointer-events-none rounded-full"
        style={{ zIndex: 10000,
          border: hoveringType === "button" ? "2px solid var(--color-primary)" : (hoveringType === "link" ? "1px solid var(--color-primary)" : "1px solid color-mix(in srgb, var(--color-primary) 50%, transparent)"),
          backgroundColor: hoveringType === "button" ? "color-mix(in srgb, var(--color-primary) 20%, transparent)" : (hoveringType === "link" ? "color-mix(in srgb, var(--color-primary) 10%, transparent)" : "transparent"),
          boxShadow: hoveringType === "button" ? "0 0 15px color-mix(in srgb, var(--color-primary) 40%, transparent)" : "none",
          transition: "width 0.2s cubic-bezier(0.16, 1, 0.3, 1), height 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, border 0.2s ease, box-shadow 0.2s ease",
          transform: clicking ? "scale(0.9)" : "scale(1)", 
          opacity: 1 }} />
    </>
  );
}
