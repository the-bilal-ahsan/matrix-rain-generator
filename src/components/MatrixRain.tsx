import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

interface MatrixRainProps {
  color?: string;
  fontSize?: number;
  speed?: number;
  glitchIntensity?: number;
}

export const MatrixRain = forwardRef<HTMLCanvasElement, MatrixRainProps>(({
  color = '#00FF41',
  fontSize = 16,
  speed = 1,
  glitchIntensity = 0.02,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useImperativeHandle(ref, () => canvasRef.current!);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        // For "4k" feel, we use a high device pixel ratio or fixed large size
        // But for display, we'll match container and use scale
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution to 4k if possible, or just high DPI
    const dpr = window.devicePixelRatio || 1;
    // For 4k video feel, let's actually use a high resolution internal buffer
    const renderWidth = dimensions.width * dpr;
    const renderHeight = dimensions.height * dpr;
    canvas.width = renderWidth;
    canvas.height = renderHeight;

    const columns = Math.floor(renderWidth / (fontSize * dpr));
    const drops: number[] = new Array(columns).fill(1);

    let animationFrameId: number;
    let lastTime = 0;
    const fps = 30; // Matrix rain usually looks better at a slightly lower, cinematic frame rate
    const interval = 1000 / fps;

    const draw = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(draw);

      const delta = timestamp - lastTime;
      if (delta < interval) return;
      lastTime = timestamp - (delta % interval);

      // Subtle fade effect for trails
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, renderWidth, renderHeight);

      ctx.font = `${fontSize * dpr}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Randomly pick 0 or 1
        const text = Math.random() > 0.5 ? '0' : '1';
        
        // Glitch effect: occasionally change color or character
        const isGlitching = Math.random() < glitchIntensity;
        
        if (isGlitching) {
          ctx.fillStyle = '#fff'; // Bright white flash for glitch
          ctx.fillText(text, i * fontSize * dpr, drops[i] * fontSize * dpr);
          
          // Random horizontal shift for glitch
          if (Math.random() < 0.1) {
             const shift = (Math.random() - 0.5) * 20;
             ctx.drawImage(canvas, shift, 0);
          }
        } else {
          ctx.fillStyle = color;
          ctx.fillText(text, i * fontSize * dpr, drops[i] * fontSize * dpr);
        }

        // Reset drop to top if it goes off screen
        if (drops[i] * fontSize * dpr > renderHeight && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i] += speed;
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions, color, fontSize, speed, glitchIntensity]);

  return (
    <div ref={containerRef} className="w-full h-full bg-black overflow-hidden relative">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        className="opacity-90"
      />
      {/* Subtle scanline overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
    </div>
  );
});
