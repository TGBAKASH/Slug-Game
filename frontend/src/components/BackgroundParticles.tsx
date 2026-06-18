import React, { useEffect, useRef } from "react";

/**
 * Fixed-position background canvas with floating sparks and chevron arrows.
 * Matches the Aethera theme — uses dark ink colors on light backgrounds.
 * Increased count (250) and higher alpha for better visibility.
 */
export const BackgroundParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let drawW = 0;
    let drawH = 0;

    const COUNT = 250;
    const xs = new Float32Array(COUNT);
    const ys = new Float32Array(COUNT);
    const vxs = new Float32Array(COUNT);
    const vys = new Float32Array(COUNT);
    const sizes = new Float32Array(COUNT);
    const alphas = new Float32Array(COUNT);
    const pulses = new Float32Array(COUNT);
    const pulseSpeeds = new Float32Array(COUNT);
    const types = new Uint8Array(COUNT); // 0=dot, 1=chevron
    const colors: string[] = [];

    const initParticles = (w: number, h: number) => {
      for (let i = 0; i < COUNT; i++) {
        xs[i] = Math.random() * w;
        ys[i] = Math.random() * h;
        vxs[i] = (Math.random() - 0.5) * 0.2;
        vys[i] = -(Math.random() * 0.35 + 0.08);
        sizes[i] = Math.random() * 2.2 + 0.5;
        alphas[i] = Math.random() * 0.25 + 0.08;
        pulses[i] = Math.random() * Math.PI * 2;
        pulseSpeeds[i] = 0.012 + Math.random() * 0.018;
        types[i] = Math.random() > 0.85 ? 1 : 0;
        // Aethera palette: mostly dark ink, some warm brown accent
        const r = Math.random();
        colors[i] = r > 0.7 ? "92,74,50" : r > 0.5 ? "111,111,111" : "0,0,0";
      }
    };

    const resize = () => {
      drawW = window.innerWidth;
      drawH = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = drawW * dpr;
      canvas.height = drawH * dpr;
      canvas.style.width = `${drawW}px`;
      canvas.style.height = `${drawH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles(drawW, drawH);
    };

    window.addEventListener("resize", resize);
    resize();

    const render = () => {
      ctx.clearRect(0, 0, drawW, drawH);

      for (let i = 0; i < COUNT; i++) {
        xs[i] += vxs[i];
        ys[i] += vys[i];
        pulses[i] += pulseSpeeds[i];
        if (ys[i] < -10) ys[i] = drawH + 10;
        if (xs[i] < -10) xs[i] = drawW + 10;
        if (xs[i] > drawW + 10) xs[i] = -10;

        const a = alphas[i] * (0.6 + 0.4 * Math.sin(pulses[i]));
        ctx.globalAlpha = a;

        if (types[i] === 1) {
          const s = sizes[i] * 4;
          ctx.strokeStyle = `rgba(${colors[i]},1)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(xs[i] - s, ys[i] + s * 0.4);
          ctx.lineTo(xs[i], ys[i] - s * 0.4);
          ctx.lineTo(xs[i] + s, ys[i] + s * 0.4);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(${colors[i]},1)`;
          ctx.beginPath();
          ctx.arc(xs[i], ys[i], sizes[i], 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="particle-canvas"
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none',
      }}
    />
  );
};
