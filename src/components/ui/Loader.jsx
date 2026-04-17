import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import engine from '../../utils/audioEngine';



const EyeTracker = ({ mousePos, isHovering, isEntering, targetRef }) => {
  const canvasRef = useRef(null);
  const framesRef = useRef([]);
  const currentFrameRef = useRef(15); // Start at neutral
  const targetFrameRef = useRef(15);
  const requestRef = useRef();
  const idleTimeRef = useRef(0);

  // Load 30 frames progressively
  useEffect(() => {
    const totalFrames = 30;
    const loadedFrames = [];
    let loadedCount = 0;

    const loadFrame = (i) => {
       const img = new Image();
       const frameNum = String(i).padStart(3, '0');
       img.src = `/assets/Starting page frames/ezgif-frame-${frameNum}.png`;
       img.onload = () => {
         loadedCount++;
         // Assign frames to ref immediately as they load so they are available
         framesRef.current = loadedFrames;
       };
       loadedFrames[i] = img;
    };

    // 1. Force the first tier of frames for immediate visual availability
    for (let i = 1; i <= 10; i++) {
        loadFrame(i);
    }

    // 2. Queue the remaining tracking frames in the background gracefully
    let nextFrame = 11;
    const lazyLoadNext = () => {
        if (nextFrame <= totalFrames) {
            loadFrame(nextFrame);
            nextFrame++;
            setTimeout(lazyLoadNext, 20);
        }
    };
    
    // Start fetching remaining frames after a slight delay
    setTimeout(lazyLoadNext, 600);
  }, []);

  const animate = (time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const frames = framesRef.current;

    // 1. Calculate Target Frame
    let target = targetFrameRef.current;

    if (isEntering || isHovering) {
      // HEART MODE: Lock at 30
      target = 30;
    } else {
      // TRACKING MODE
      const { x, y } = mousePos;
      const baseFrame = 1 + x * 27;
      
      if (targetRef.current) {
        const rect = targetRef.current.getBoundingClientRect();
        const btnCenterX = rect.left + rect.width / 2;
        const btnCenterY = rect.top + rect.height / 2;
        
        const dx = (mousePos.x * window.innerWidth) - btnCenterX;
        const dy = (mousePos.y * window.innerHeight) - btnCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const maxDist = 450;
        if (dist < maxDist) {
          // PROXIMITY CURVE: Ease-in curve for smoother focus
          // factor goes from 0 (at maxDist) to 1 (at button)
          const linearFactor = Math.max(0, 1 - dist / maxDist);
          const easedFactor = Math.pow(linearFactor, 2); // Quadratic ease-in
          
          target = baseFrame * (1 - easedFactor) + 28 * easedFactor;
        } else {
          target = baseFrame;
        }
      } else {
        target = baseFrame;
      }

      // Add subtle Y influence
      const yShift = (y - 0.5) * 1.5;
      target += yShift;

      // IDLE ANIMATION: Subtle oscillation (15 <-> 16) if mouse hasn't moved much
      const isStill = Math.abs(currentFrameRef.current - target) < 0.05;
      if (isStill) {
        idleTimeRef.current += 0.05;
        const oscillation = Math.sin(idleTimeRef.current) * 0.5;
        target += oscillation;
      } else {
        idleTimeRef.current = 0;
      }
    }

    // Clamp
    target = Math.max(1, Math.min(30, target));
    targetFrameRef.current = target;

    // 2. Smooth Interpolation (0.08 for premium feel)
    const lerpSpeed = (isHovering || isEntering) ? 0.2 : 0.08;
    const diff = targetFrameRef.current - currentFrameRef.current;
    
    // Performance Optimization: Only update if change is significant
    if (Math.abs(diff) > 0.001) {
      if (isHovering && currentFrameRef.current > 29.9) {
        currentFrameRef.current = 30; // Freeze at 30 to avoid micro-jitter
      } else {
        currentFrameRef.current += diff * lerpSpeed;
      }
    }

    // 3. Render
    const drawFrame = Math.round(currentFrameRef.current);
    if (frames[drawFrame]) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frames[drawFrame], 0, 0, canvas.width, canvas.height);
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [mousePos, isHovering, isEntering]);

  return (
    <div className="frame-eye-tracker">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={154} 
        className="eye-canvas"
      />
    </div>
  );
};

const Loader = ({ onEnter }) => {
  const [isEntering, setIsEntering] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [isHoveringButton, setIsHoveringButton] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const buttonRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      setMousePos({ x: clientX / innerWidth, y: clientY / innerHeight });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleEnterClick = () => {
    // Phase 1 (0ms): Eye locks to heart state — holds for ~300ms
    setIsEntering(true);

    // Phase 2 (300ms): Background layers fade + zoom begins
    setTimeout(() => {
      setIsFading(true);
    }, 300);

    // Phase 3 (550ms): Audio activation — 250ms after fade starts
    setTimeout(() => {
      if (engine.ctx && engine.ctx.state !== 'running') {
        engine.ctx.resume().catch(() => {});
      }
    }, 550);

    // Phase 4 (1100ms): Complete transition — main content appears
    setTimeout(() => {
      onEnter();
    }, 1100);
  };

  return (
    <StyledWrapper ref={containerRef} $isEntering={isEntering} $isFading={isFading}>
      {/* 1. Geometric Background Pattern (Lowest Layer) */}
      <div className="pattern-bg" />

      {/* 2. Space Travel Motion Layer (Background Layer) */}
      <div className="travel-layer">
        <div className="longfazers">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="clouds">
          <div className="cloud cloud1" />
          <div className="cloud cloud2" />
          <div className="cloud cloud3" />
          <div className="cloud cloud4" />
          <div className="cloud cloud5" />
        </div>
      </div>

      <div className="content">
        {/* 3. Eye Frame Animation (Main Focus) */}
        <div className="eyes-container">
          <EyeTracker 
            mousePos={mousePos} 
            isHovering={isHoveringButton} 
            isEntering={isEntering}
            targetRef={buttonRef}
          />
        </div>

        {/* 4. Text + Button (Top Layer) */}
        <div className="headline-group">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: isFading ? 0 : 1, 
              y: isFading ? -15 : 0,
              filter: isFading ? 'blur(6px)' : 'blur(0px)'
            }}
            transition={{ 
              duration: isFading ? 0.5 : 1.2, 
              delay: isFading ? 0 : 0.5, 
              ease: [0.16, 1, 0.3, 1] 
            }}
            className="main-text font-bodoni"
          >
            Not everything here is obvious.
          </motion.h1>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: isFading ? 0 : 1, 
              y: isFading ? -15 : 0,
              filter: isFading ? 'blur(6px)' : 'blur(0px)'
            }}
            transition={{ 
              duration: isFading ? 0.5 : 1.2, 
              delay: isFading ? 0.05 : 0.9, 
              ease: [0.16, 1, 0.3, 1] 
            }}
            className="main-text text-color-primary font-bodoni"
          >
            That's the point.
          </motion.h1>
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: isFading ? 0 : 0.3,
            filter: isFading ? 'blur(4px)' : 'blur(0px)'
          }}
          transition={{ 
            duration: isFading ? 0.4 : 1.2, 
            delay: isFading ? 0 : 1.4 
          }}
          className="subtext font-mono"
        >
          Look closer.
        </motion.p>

        <motion.button 
          ref={buttonRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: isEntering ? 0 : 1, 
            scale: isEntering ? 0.95 : 1,
            filter: isEntering ? 'blur(4px)' : 'blur(0px)'
          }}
          transition={{ 
            duration: isEntering ? 0.5 : 0.8, 
            delay: isEntering ? 0 : 1.8,
            ease: [0.16, 1, 0.3, 1]
          }}
          whileTap={{ scale: 0.97 }}
          onMouseEnter={() => setIsHoveringButton(true)}
          onMouseLeave={() => setIsHoveringButton(false)}
          onClick={handleEnterClick}
          className="enter-btn"
        >
          Enter System →
        </motion.button>
      </div>

      {/* 5. Foreground Space Element (Above Text) */}
      <div className="foreground-travel-layer">
        <div className="loader">
          <span>
            <span />
            <span />
            <span />
            <span />
          </span>
          <div className="base"><span /></div>
          <div className="face" />
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  width: 100vw;
  height: 100vh;
  background: #000;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s ease;
  ${props => props.$isFading && `
    transform: scale(1.05);
    opacity: 0;
  `}

  .font-bodoni {
    font-family: 'Bodoni Moda', serif;
  }

  /* 1. Geometric Pattern (Lowest) */
  .pattern-bg {
    position: absolute;
    inset: 0;
    z-index: 1;
    --s: 82px;
    --c1: #0a0a0a;
    --c2: #1a1a1a;
    --c3: #111111;

    --_g: var(--c3) 0 120deg, #0000 0;
    background: conic-gradient(from -60deg at 50% calc(100% / 3), var(--_g)),
      conic-gradient(from 120deg at 50% calc(200% / 3), var(--_g)),
      conic-gradient(
        from 60deg at calc(200% / 3),
        var(--c3) 60deg,
        var(--c2) 0 120deg,
        #0000 0
      ),
      conic-gradient(from 180deg at calc(100% / 3), var(--c1) 60deg, var(--_g)),
      linear-gradient(
        90deg,
        var(--c1) calc(100% / 6),
        var(--c2) 0 50%,
        var(--c1) 0 calc(500% / 6),
        var(--c2) 0
      );
    background-size: calc(1.732 * var(--s)) var(--s);
    opacity: 0.05;
    transition: opacity 0.5s ease;
    ${props => props.$isFading && `opacity: 0;`}
  }

  /* 2. Space Travel Layer (Background Atmosphere) */
  .travel-layer, .foreground-travel-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    transition: opacity 0.5s ease;
    ${props => props.$isFading && `opacity: 0;`}
  }

  .travel-layer {
    z-index: 2;
  }

  .foreground-travel-layer {
    z-index: 5;

    .loader {
      position: absolute;
      top: 35%;
      left: 50%;
      margin-left: -50px;
      animation: speeder 0.4s linear infinite;
      transform: scale(0.9);
      opacity: 0.35;
      filter: brightness(1.1) blur(1px);
    }

    .loader > span {
      width: 35px;
      background: #EAEAEA;
      position: absolute;
      top: -19px;
      left: 60px;
      border-radius: 2px 10px 1px 0;
    }

    .base span {
      position: absolute;
      width: 0;
      height: 0;
      border-top: 6px solid transparent;
      border-right: 100px solid #EAEAEA;
      border-bottom: 6px solid transparent;
    }

    .base span:before {
      content: "";
      height: 22px;
      width: 22px;
      border-radius: 50%;
      background: #EAEAEA;
      position: absolute;
      right: -110px;
      top: -16px;
    }

    .base span:after {
      content: "";
      position: absolute;
      width: 0;
      height: 0;
      border-top: 0 solid transparent;
      border-right: 55px solid #EAEAEA;
      border-bottom: 16px solid transparent;
      top: -16px;
      right: -98px;
    }

    .face {
      position: absolute;
      height: 12px;
      width: 20px;
      background: #EAEAEA;
      border-radius: 20px 20px 0 0;
      transform: rotate(-40deg);
      right: -125px;
      top: -15px;
    }

    .face:after {
      content: "";
      height: 12px;
      width: 12px;
      background: var(--color-primary); /* Use brand Amber */
      right: 4px;
      top: 7px;
      position: absolute;
      transform: rotate(40deg);
      transform-origin: 50% 50%;
      border-radius: 0 0 2px 2px;
    }

    .loader > span > span {
      width: 30px;
      height: 1px;
      background: #EAEAEA;
      position: absolute;
    }

    /* Slowed animations by ~40% */
    .loader > span > span:nth-child(1) { animation: fazer1 0.2s linear infinite; }
    .loader > span > span:nth-child(2) { top: 3px; animation: fazer2 0.4s linear infinite; }
    .loader > span > span:nth-child(3) { top: 1px; animation: fazer3 0.4s linear infinite; animation-delay: -1s; }
    .loader > span > span:nth-child(4) { top: 4px; animation: fazer4 1s linear infinite; animation-delay: -1s; }

    .longfazers {
      position: absolute;
      width: 100%;
      height: 100%;
    }

    .longfazers span {
      position: absolute;
      height: 2px;
      width: 20%;
      background: #EAEAEA;
      opacity: 0.10;
      filter: blur(1.5px);
    }

    .longfazers span:nth-child(1) { top: 20%; animation: lf 0.6s linear infinite; animation-delay: -5s; }
    .longfazers span:nth-child(2) { top: 40%; animation: lf2 0.8s linear infinite; animation-delay: -1s; }
    .longfazers span:nth-child(3) { top: 60%; animation: lf3 0.6s linear infinite; }
    .longfazers span:nth-child(4) { top: 80%; animation: lf4 0.5s linear infinite; animation-delay: -3s; }

    .clouds {
      position: absolute;
      width: 100%;
      height: 100%;
      z-index: -1;
      overflow: hidden;
    }

    .cloud {
      position: absolute;
      background: #EAEAEA;
      border-radius: 50%;
      filter: blur(2px);
      animation: moveClouds linear infinite;
    }

    .cloud::before, .cloud::after {
      content: "";
      position: absolute;
      background: #EAEAEA;
      border-radius: 50%;
    }

    .cloud::before { width: 60%; height: 60%; top: -30%; left: 10%; }
    .cloud::after { width: 40%; height: 40%; top: -20%; left: 50%; }

    /* Foreground clouds */
    .cloud1 { width: 100px; height: 60px; top: 15%; left: 1400px; animation-duration: 2s; opacity: 0.22; filter: blur(1.5px); }
    .cloud2 { width: 150px; height: 80px; top: 35%; left: 1600px; animation-duration: 3s; opacity: 0.20; filter: blur(2px); }
    
    /* Background clouds */
    .cloud3 { width: 80px; height: 50px; top: 20%; left: 2000px; animation-duration: 4s; opacity: 0.12; filter: blur(3px); }
    
    /* Mid clouds */
    .cloud4 { width: 100px; height: 80px; top: 70%; left: 1100px; animation-duration: 3s; opacity: 0.16; filter: blur(2.5px); }
    
    /* Foreground clouds */
    .cloud5 { width: 170px; height: 50px; top: 80%; left: 1500px; animation-duration: 2s; opacity: 0.22; filter: blur(1px); }
  }

  @keyframes fazer1 { 0% { left: 0; } 100% { left: -80px; opacity: 0; } }
  @keyframes fazer2 { 0% { left: 0; } 100% { left: -100px; opacity: 0; } }
  @keyframes fazer3 { 0% { left: 0; } 100% { left: -50px; opacity: 0; } }
  @keyframes fazer4 { 0% { left: 0; } 100% { left: -150px; opacity: 0; } }

  @keyframes speeder {
    0% { transform: translate(2px, 1px) rotate(0deg); }
    10% { transform: translate(-1px, -3px) rotate(-1deg); }
    20% { transform: translate(-2px, 0px) rotate(1deg); }
    30% { transform: translate(1px, 2px) rotate(0deg); }
    40% { transform: translate(1px, -1px) rotate(1deg); }
    50% { transform: translate(-1px, 3px) rotate(-1deg); }
    60% { transform: translate(-1px, 1px) rotate(0deg); }
    70% { transform: translate(3px, 1px) rotate(-1deg); }
    80% { transform: translate(-2px, -1px) rotate(1deg); }
    90% { transform: translate(2px, 1px) rotate(0deg); }
    100% { transform: translate(1px, -2px) rotate(-1deg); }
  }

  @keyframes lf { 0% { left: 200%; } 100% { left: -200%; opacity: 0; } }
  @keyframes lf2 { 0% { left: 200%; } 100% { left: -200%; opacity: 0; } }
  @keyframes lf3 { 0% { left: 200%; } 100% { left: -100%; opacity: 0; } }
  @keyframes lf4 { 0% { left: 200%; } 100% { left: -100%; opacity: 0; } }
  @keyframes moveClouds { 0% { transform: translateX(0); } 100% { transform: translateX(-2000px); } }

  /* 4. Content (Top Layer) */
  .content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    text-align: center;
  }

  .eyes-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 2rem;
    height: 154px;
    z-index: 11;
  }

  .frame-eye-tracker {
    width: 300px;
    height: 150px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .eye-canvas {
    width: 300px;
    height: 154px;
    object-fit: contain;
    filter: drop-shadow(0 0 30px rgba(255, 255, 255, 0.15));
  }

  .headline-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .main-text {
    font-size: clamp(2rem, 5vw, 4rem);
    font-weight: 500; /* Bodoni looks better at medium weight */
    letter-spacing: -0.01em;
    line-height: 1.1;
    text-shadow: 0 0 20px rgba(0,0,0,0.5);
  }

  .subtext {
    font-size: 0.7rem;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    margin-top: 1rem;
    opacity: 0.4;
  }

  .enter-btn {
    margin-top: 3rem;
    padding: 14px 40px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 30px;
    color: #fff;
    font-size: 0.8rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
    cursor: pointer;
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.03);

    &:hover {
      background: var(--color-primary);
      color: #000;
      transform: scale(1.05);
      box-shadow: 0 0 30px rgba(255, 184, 0, 0.4);
      border-color: var(--color-primary);
    }
  }
`;

export default Loader;
