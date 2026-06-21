import React, { useEffect, useRef, useState } from "react";
import { useScroll, useMotionValue, useTransform, motion } from "framer-motion";
import { TextBeat } from "./TextBeat";
import { ParticleCanvas } from "./ParticleCanvas";
import "./scrollytelling.css";

const TOTAL_FRAMES_ON_DISK = 200;
const FRAME_STEP = 2;         // load every 2nd frame to halve download
const FRAME_COUNT = Math.ceil(TOTAL_FRAMES_ON_DISK / FRAME_STEP); // 100 frames
const MAX_DPR = 1.5;
const SCRUB_EASE = 0.18;
const CONCURRENT_LOADS = 8;   // parallel image fetches

const REDUCED_MOTION =
  typeof window !== "undefined" &&
  !!window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type SequenceFrame = HTMLImageElement;

export const SlugTransformSequence: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<SequenceFrame[]>([]);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setScrollContainer(document.getElementById("app-shell"));
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    ...(scrollContainer ? { container: { current: scrollContainer } } : {}),
    offset: ["start start", "end end"],
  });

  const smoothProgress = useMotionValue(0);
  const indicatorOpacity = useTransform(smoothProgress, [0, 0.08], [1, 0]);
  const scrubberScaleY = useTransform(smoothProgress, [0, 1], [0, 1]);

  // ---- Throttled frame loader (no createImageBitmap — raw HTMLImageElement is fastest) ----
  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    const frames: SequenceFrame[] = new Array(FRAME_COUNT);

    const loadOne = (frameIdx: number, slotIdx: number): Promise<void> =>
      new Promise((resolve) => {
        if (cancelled) { resolve(); return; }
        const img = new Image();
        img.src = `/sequence/frame_${frameIdx.toString().padStart(4, "0")}.jpg`;

        const done = () => {
          if (cancelled) { resolve(); return; }
          frames[slotIdx] = img;
          loaded++;
          setLoadProgress((loaded / FRAME_COUNT) * 100);
          if (loaded === FRAME_COUNT) setIsLoaded(true);
          resolve();
        };

        img.onload = done;
        img.onerror = () => { loaded++; setLoadProgress((loaded / FRAME_COUNT) * 100); if (loaded === FRAME_COUNT) setIsLoaded(true); resolve(); };
      });

    // Build queue: every FRAME_STEP-th frame (1, 3, 5, ... or 1, 2, 3... based on step)
    const queue: { frameIdx: number; slotIdx: number }[] = [];
    for (let slot = 0; slot < FRAME_COUNT; slot++) {
      queue.push({ frameIdx: slot * FRAME_STEP + 1, slotIdx: slot });
    }
    let running = 0;
    const next = () => {
      while (running < CONCURRENT_LOADS && queue.length > 0 && !cancelled) {
        const item = queue.shift()!;
        running++;
        loadOne(item.frameIdx, item.slotIdx).then(() => { running--; next(); });
      }
    };
    next();

    framesRef.current = frames;
    return () => { cancelled = true; };
  }, []);

  // ---- Render loop (only after loaded) ----
  useEffect(() => {
    if (!isLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let raf = 0;
    let lastIdx = -1;
    let cW = 0;
    let cH = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const r = canvas.parentElement?.getBoundingClientRect() || { width: innerWidth, height: innerHeight };
      const nW = Math.round(r.width * dpr);
      const nH = Math.round(r.height * dpr);
      if (nW !== cW || nH !== cH) {
        cW = nW; cH = nH;
        canvas.width = cW; canvas.height = cH;
        canvas.style.width = `${r.width}px`;
        canvas.style.height = `${r.height}px`;
        lastIdx = -1;
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const draw = (p: number) => {
      const idx = Math.min(FRAME_COUNT - 1, Math.max(0, Math.floor(p * FRAME_COUNT)));
      if (idx === lastIdx) return;
      lastIdx = idx;

      const img = framesRef.current[idx];
      if (!img || !img.naturalWidth) return;
      const iw = img.naturalWidth; const ih = img.naturalHeight;

      const scale = Math.max(cW / iw, (cH * 1.1) / ih);
      const dw = iw * scale; const dh = ih * scale;
      const x = (cW - dw) / 2;
      const y = cH - dh + dh * 0.1;

      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, cW, cH);
      ctx.drawImage(img, x, y, dw, dh);
    };

    let current = scrollYProgress.get();
    smoothProgress.set(current);

    const loop = () => {
      const target = scrollYProgress.get();
      if (REDUCED_MOTION) { current = target; }
      else {
        current += (target - current) * SCRUB_EASE;
        if (Math.abs(target - current) < 0.0003) current = target;
      }
      smoothProgress.set(current);
      draw(current);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, [isLoaded, scrollYProgress, smoothProgress]);

  const loaderInitial = { width: 0 };
  const loaderAnimate = { width: `${loadProgress}%` };
  const loaderTransition = { ease: "easeOut", duration: 0.3 } as const;
  const scrollTrackStyle = { height: "500vh" };
  const badgeInitial = { opacity: 0, scale: 0.8, y: 10 };
  const badgeInView = { opacity: 1, scale: 1, y: 0 };
  const badgeViewport = { once: true };
  const badgeTransition = (i: number) =>
    ({ delay: i * 0.08, duration: 0.4, ease: "easeOut" }) as const;
  const btnHover = { scale: 1.05 };
  const btnTap = { scale: 0.96 };
  const btnStyle = { clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)" };
  const scrubberFillStyle = { scaleY: scrubberScaleY, transformOrigin: "top" as const };
  const indicatorStyle = { opacity: indicatorOpacity };

  return (
    <div className="w-full relative bg-[#050505] text-white/80">
      {!isLoaded && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] h-screen w-full" style={{ cursor: 'none' }}>
          <div className="flex flex-col items-center justify-center p-8">
            <h1 className="font-orbitron text-6xl sm:text-7xl font-black text-white mb-4 tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] [text-shadow:0_4px_20px_rgba(0,0,0,1)] animate-title-glow">
              SLUGTERRA
            </h1>
            <p className="font-inter text-white/50 tracking-widest text-sm uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              Entering the Caverns...
            </p>
          </div>
          <div className="w-[300px] h-[2px] bg-white/10 relative overflow-hidden rounded-full mb-4">
            <motion.div
              className="absolute top-0 left-0 h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.6)]"
              initial={loaderInitial}
              animate={loaderAnimate}
              transition={loaderTransition}
            />
          </div>
          <div className="font-orbitron text-[10px] tracking-[0.2em] text-white/30">
            LOADING SEQUENCE... {Math.floor(loadProgress)}%
          </div>
        </div>
      )}

      <div ref={containerRef} className="w-full relative" style={scrollTrackStyle}>
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#050505]">
          {/* Particles only after frames loaded — saves CPU during init */}
          {isLoaded && <ParticleCanvas />}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10" style={{ filter: 'grayscale(1) contrast(1.1)' }} />

          <div className="scrolly-grade" />

          <div className="absolute inset-0 z-20 pointer-events-none">
            {/* Beat A (0%–18%) */}
            <TextBeat progress={smoothProgress} start={0} end={0.18} position="center">
              <div className="p-8 max-w-2xl text-center flex flex-col items-center">
                <div className="font-orbitron text-[10px] sm:text-xs tracking-widest text-white/50 mb-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] inline-block">
                  // ELEMENTAL SLUG REPOSITORY v4.2 //
                </div>
                <h1 className="font-orbitron font-black text-5xl sm:text-7xl md:text-8xl text-white tracking-tighter mb-4 uppercase drop-shadow-[0_4px_30px_rgba(0,0,0,1)] [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  VELOCITY IS EVERYTHING
                </h1>
                <p className="font-inter text-base sm:text-xl text-white/85 max-w-xl mx-auto drop-shadow-[0_4px_20px_rgba(0,0,0,1)] font-medium">
                  Load your slug. Fire at velocity. Watch them transform into
                  extraordinary elemental beasts.
                </p>
              </div>
            </TextBeat>

            {/* Beat B (22%–42%) */}
            <TextBeat progress={smoothProgress} start={0.22} end={0.42} position="left">
              <div className="p-8 max-w-xl pl-12 md:pl-[12vw]">
                <h2 className="font-orbitron font-black text-4xl sm:text-6xl md:text-7xl text-white mb-4 leading-tight uppercase drop-shadow-[0_4px_10px_rgba(0,0,0,1)] [text-shadow:0_2px_8px_rgba(0,0,0,0.8),0_1px_2px_rgba(0,0,0,1)]">
                  ELEMENTAL
                  <br />
                  CORE
                </h2>
                <p className="font-inter text-base sm:text-lg text-white/90 max-w-sm mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] [text-shadow:0_2px_4px_rgba(0,0,0,0.8)] font-medium leading-relaxed">
                  Four elemental types. Each slug carries a unique genetic
                  signature — Fire, Water, Earth, Air. Master the elemental
                  cycle to dominate.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["🔥 FIRE", "💧 WATER", "🌿 EARTH", "💨 AIR"].map((element, i) => (
                    <motion.div
                      key={element}
                      initial={badgeInitial}
                      whileInView={badgeInView}
                      viewport={badgeViewport}
                      transition={badgeTransition(i)}
                      className="px-3 py-1 border border-white/30 bg-black/40 rounded-full font-orbitron text-xs text-white/80 tracking-wider shadow-lg backdrop-blur-md"
                    >
                      {element}
                    </motion.div>
                  ))}
                </div>
              </div>
            </TextBeat>

            {/* Beat C (48%–68%) */}
            <TextBeat progress={smoothProgress} start={0.48} end={0.68} position="right">
              <h2 className="font-orbitron font-black text-4xl sm:text-6xl md:text-7xl text-white mb-4 leading-tight uppercase text-right drop-shadow-[0_4px_20px_rgba(0,0,0,1)] [text-shadow:0_4px_12px_rgba(0,0,0,0.8)]">
                MINT.
                <br />
                BATTLE.
                <br />
                DOMINATE.
              </h2>
              <p className="font-inter text-base sm:text-lg text-white/85 max-w-sm mb-8 text-right flex self-end drop-shadow-[0_4px_20px_rgba(0,0,0,1)] font-medium">
                Hatch elemental slugs. Level them up. Exploit elemental
                advantages. The cavern rewards the bold.
              </p>
              <div className="flex flex-col gap-3 self-end w-full max-w-[320px] text-right pointer-events-none">
                <div className="p-4 border border-white/20 bg-black/40 backdrop-blur-md rounded-lg relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 left-0 w-1 h-full bg-white/60" />
                  <div className="font-orbitron font-bold text-white text-sm mb-1 tracking-wider drop-shadow-md">
                    PVP ESCROW WAGERS
                  </div>
                  <div className="font-inter text-xs text-white/70 leading-relaxed">
                    Double-blind commit-reveal. Stake SUI on your slug — neither
                    player sees the other's element until both reveal!
                  </div>
                </div>
                <div className="p-4 border border-white/20 bg-black/40 backdrop-blur-md rounded-lg relative overflow-hidden mt-2 shadow-lg">
                  <div className="absolute top-0 right-0 w-1 h-full bg-white/40" />
                  <div className="font-orbitron font-bold text-white text-sm mb-1 tracking-wider drop-shadow-md">
                    TRAINING GROUNDS
                  </div>
                  <div className="font-inter text-xs text-white/70 leading-relaxed">
                    Not ready for SUI wagers? Deploy to the Training Grounds to
                    fight random enemies and earn Dark Coins to level up your
                    slugs.
                  </div>
                </div>
              </div>
            </TextBeat>

            {/* Beat D (75%–95%) */}
            <TextBeat progress={smoothProgress} start={0.75} end={0.95} position="center">
              <h2 className="font-orbitron font-black text-4xl sm:text-6xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-br from-white via-white/80 to-white/50 drop-shadow-[0_4px_20px_rgba(0,0,0,1)] mb-4 uppercase">
                ENTER THE
                <br />
                GLAZED ARENA
              </h2>
              <p className="font-inter text-lg sm:text-xl text-white/85 max-w-md mx-auto mb-8 drop-shadow-[0_4px_20px_rgba(0,0,0,1)] font-medium">
                Deploy protoform canisters. Wager SUI. The winning slug claims
                everything.
              </p>
              <div className="flex flex-col items-center gap-4">
                <motion.button
                  whileHover={btnHover}
                  whileTap={btnTap}
                  onClick={() => window.dispatchEvent(new CustomEvent("switch-tab", { detail: "arena" }))}
                  className="font-orbitron font-bold text-lg tracking-wider text-white border-2 border-white/60 px-8 py-4 uppercase shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-colors duration-300 pointer-events-auto cursor-pointer hover:bg-white/10"
                  style={btnStyle}
                >
                  [ ⬡ LAUNCH PROTOCOL ]
                </motion.button>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("switch-tab", { detail: "command" }))}
                  className="font-inter text-sm text-white/40 hover:text-white/80 transition-colors pointer-events-auto cursor-pointer"
                >
                  [ View Arsenal → ]
                </button>
              </div>
            </TextBeat>
          </div>

          {/* Scroll progress scrubber */}
          <div className="absolute top-1/2 right-5 -translate-y-1/2 h-[160px] w-[2px] bg-white/10 rounded-full overflow-hidden z-30 pointer-events-none">
            <motion.div
              style={scrubberFillStyle}
              className="absolute inset-0 bg-gradient-to-b from-white via-white/70 to-white/40 shadow-[0_0_8px_rgba(255,255,255,0.3)]"
            />
          </div>

          {/* Scroll Down Indicator */}
          <motion.div
            style={indicatorStyle}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-30"
          >
            <div className="w-[1px] h-[50px] bg-gradient-to-b from-white/60 to-transparent animate-pulse-opacity" />
            <div className="font-orbitron text-[10px] tracking-widest text-white/40 uppercase">
              Scroll To Explore
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
