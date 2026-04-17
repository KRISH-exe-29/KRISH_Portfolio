import React, { useEffect, useRef } from 'react';

const ScrollyBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const totalFrames = 240;
    const frames = [];
    
    // Set internal canvas resolution accurately mapped to window
    const resize = () => {
       canvas.width = window.innerWidth;
       canvas.height = window.innerHeight;
    };
    resize();
    
    const drawImageProp = (ctx, img, x, y, w, h, offsetX, offsetY) => {
        if (arguments.length === 2) {
            x = y = 0;
            w = ctx.canvas.width;
            h = ctx.canvas.height;
        }
        
        offsetX = typeof offsetX === "number" ? offsetX : 0.5;
        offsetY = typeof offsetY === "number" ? offsetY : 0.5;

        // keep bounds [0.0, 1.0]
        if (offsetX < 0) offsetX = 0;
        if (offsetY < 0) offsetY = 0;
        if (offsetX > 1) offsetX = 1;
        if (offsetY > 1) offsetY = 1;

        var iw = img.width,
            ih = img.height,
            r = Math.min(w / iw, h / ih),
            nw = iw * r,
            nh = ih * r,
            cx, cy, cw, ch, ar = 1;

        if (nw < w) ar = w / nw;                             
        if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;  // updated
        nw *= ar;
        nh *= ar;

        cw = iw / (nw / w);
        ch = ih / (nh / h);

        cx = (iw - cw) * offsetX;
        cy = (ih - ch) * offsetY;

        if (cx < 0) cx = 0;
        if (cy < 0) cy = 0;
        if (cw > iw) cw = iw;
        if (ch > ih) ch = ih;

        ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
    };

    let loadedCount = 0;
    
    const loadFrame = (i) => {
        const img = new Image();
        const numStr = i.toString().padStart(3, '0');
        img.src = `/scrollytelling/ezgif-frame-${numStr}.jpg`;
        img.onload = () => {
            loadedCount++;
            if (i === 1) { 
                requestAnimationFrame(() => drawImageProp(ctx, img, 0, 0, canvas.width, canvas.height));
            }
        };
        frames[i] = img;
    };

    // Load critical frames instantly
    for (let i = 1; i <= 10; i++) {
        loadFrame(i);
    }

    // Lazy load remaining frames in background to keep JS thread idle
    let nextFrameToLoad = 11;
    const lazyLoadNext = () => {
        if (nextFrameToLoad <= totalFrames) {
            loadFrame(nextFrameToLoad);
            nextFrameToLoad++;
            if ('requestIdleCallback' in window) {
                requestIdleCallback(lazyLoadNext);
            } else {
                setTimeout(lazyLoadNext, 10);
            }
        }
    };

    // Delay start of background buffer to prioritize immediate cinematic entrance
    setTimeout(() => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(lazyLoadNext);
        } else {
            setTimeout(lazyLoadNext, 50);
        }
    }, 1500);
    
    const onScroll = () => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollHeight <= 0) return;
        
        const scrollFraction = window.scrollY / scrollHeight;
        let frameIndex = Math.floor(scrollFraction * (totalFrames - 1));
        
        // clamp bounds
        if (frameIndex < 0) frameIndex = 0;
        if (frameIndex >= totalFrames) frameIndex = totalFrames - 1;
        
        const img = frames[frameIndex];
        if (img && img.complete) {
             requestAnimationFrame(() => {
                 drawImageProp(ctx, img, 0, 0, canvas.width, canvas.height); 
             });
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
        resize();
        onScroll();
    });
    
    return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', resize);
    };
  }, []);

  return (
     <canvas 
        ref={canvasRef} 
        className="fixed top-0 left-0 w-screen h-screen -z-10 mix-blend-screen opacity-50 transition-opacity duration-[2000ms]"
     />
  );
};
export default ScrollyBackground;
