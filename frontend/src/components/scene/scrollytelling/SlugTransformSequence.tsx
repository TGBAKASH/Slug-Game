import React, { useEffect, useRef, useState } from "react";
import { useScroll, useMotionValue, useTransform, motion } from "framer-motion";
import { TextBeat } from "./TextBeat";
import { ParticleCanvas } from "./ParticleCanvas";
import "./scrollytelling.css";

const TOTAL_FRAMES_ON_DISK = 200;
const FRAME_STEP = 2;         // load every 2nd frame — 100 frames (~192MB)
const FRAME_COUNT = Math.ceil(TOTAL_FRAMES_ON_DISK / FRAME_STEP); // 100 frames
const EARLY_LOAD_THRESHOLD = 1.0;  // only show animation after ALL frames loaded
const MAX_DPR = 1.5;
const SCRUB_EASE = 0.18;
const CONCURRENT_LOADS = 12;  // aggressive parallel fetches

const REDUCED_MOTION =
  typeof window !== "undefined" &&
  !!window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type SequenceFrame = HTMLImageElement;

export const SlugTransformSequence: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<SequenceFrame[]>([]);
  const isLoadedRef = useRef(false);
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
          // Start showing animation early once threshold is met
          if (!isLoadedRef.current && loaded >= FRAME_COUNT * EARLY_LOAD_THRESHOLD) {
            isLoadedRef.current = true;
            setIsLoaded(true);
          }
          resolve();
        };

        img.onload = done;
        img.onerror = () => {
          loaded++;
          setLoadProgress((loaded / FRAME_COUNT) * 100);
          if (!isLoadedRef.current && loaded >= FRAME_COUNT * EARLY_LOAD_THRESHOLD) {
            isLoadedRef.current = true;
            setIsLoaded(true);
          }
          resolve();
        };
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

  // ---- Lock scrolling while loading ----
  useEffect(() => {
    const shell = document.getElementById('app-shell');
    if (!shell) return;
    if (!isLoaded) {
      shell.style.overflow = 'hidden';
    } else {
      shell.style.overflow = '';
    }
    return () => { shell.style.overflow = ''; };
  }, [isLoaded]);

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
      // Clamp to 80% of frames so animation freezes when arena text shows
      const clampedP = Math.min(p, 0.80);
      const idx = Math.min(FRAME_COUNT - 1, Math.max(0, Math.floor(clampedP * FRAME_COUNT)));
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
  const scrollTrackStyle = { height: "380vh" };
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
            <h1 
              className="font-orbitron text-6xl sm:text-7xl font-black mb-4 tracking-widest drop-shadow-[0_0_20px_rgba(74,222,128,0.3)] animate-title-glow"
              style={{ 
                background: 'linear-gradient(135deg, #F5C563, #5ED4D4, #C084FC, #4ADE80)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              SLUGTERRA
            </h1>
            <p className="font-inter tracking-widest text-sm uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" style={{ color: 'rgba(94, 212, 212, 0.6)' }}>
              Entering the Caverns...
            </p>
          </div>
          <div className="w-[300px] h-[2px] relative overflow-hidden rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="absolute top-0 left-0 h-full"
              style={{ background: 'linear-gradient(90deg, #F5C563, #5ED4D4, #C084FC, #4ADE80)', boxShadow: '0 0 12px rgba(94, 212, 212, 0.5)' }}
              initial={loaderInitial}
              animate={loaderAnimate}
              transition={loaderTransition}
            />
          </div>
          <div className="font-orbitron text-[10px] tracking-[0.2em]" style={{ color: 'rgba(192, 132, 252, 0.4)' }}>
            LOADING... {Math.floor(loadProgress)}%
          </div>
          <div 
            className="mt-8 px-5 py-3 rounded-lg max-w-xs text-center"
            style={{ 
              background: 'rgba(255, 255, 255, 0.04)', 
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <p className="font-inter text-[11px] leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.35)' }}>
              ⚡ First visit may take a moment while assets are cached. Subsequent loads will be instant.
            </p>
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
                <div className="font-orbitron text-[10px] sm:text-xs tracking-widest mb-4 inline-block text-white/50" style={{ textShadow: '0 0 8px rgba(255,255,255,0.2)' }}>
                  // ELEMENTAL SLUG REPOSITORY v4.2 //
                </div>
                <h1 className="font-orbitron font-black text-5xl sm:text-7xl md:text-8xl tracking-tighter mb-4 uppercase text-white" style={{ textShadow: '0 0 60px rgba(255,255,255,0.4), 0 0 120px rgba(255,255,255,0.15), 0 4px 20px rgba(0,0,0,1)' }}>
                  VELOCITY IS EVERYTHING
                </h1>
                <p className="font-inter text-base sm:text-xl max-w-xl mx-auto font-medium text-white/90" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
                  Load your slug. Fire at velocity. Watch them transform into
                  extraordinary elemental beasts.
                </p>
              </div>
            </TextBeat>

            {/* Beat B (22%–42%) */}
            <TextBeat progress={smoothProgress} start={0.22} end={0.42} position="left">
              <div className="p-8 max-w-xl pl-12 md:pl-[12vw]">
                <h2 className="font-orbitron font-black text-4xl sm:text-6xl md:text-7xl mb-4 leading-tight uppercase text-white" style={{ textShadow: '0 0 60px rgba(255,255,255,0.4), 0 0 120px rgba(255,255,255,0.15), 0 4px 10px rgba(0,0,0,1)' }}>
                  ELEMENTAL
                  <br />
                  CORE
                </h2>
                <p className="font-inter text-base sm:text-lg max-w-sm mb-6 font-medium leading-relaxed text-white/90" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
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
                      className="px-3 py-1 border border-white/30 rounded-full font-orbitron text-xs tracking-wider shadow-lg backdrop-blur-md bg-black/50 text-white/85"
                    >
                      {element}
                    </motion.div>
                  ))}
                </div>
              </div>
            </TextBeat>

            {/* Beat C (48%–68%) */}
            <TextBeat progress={smoothProgress} start={0.48} end={0.68} position="right">
              <h2 className="font-orbitron font-black text-4xl sm:text-6xl md:text-7xl mb-4 leading-tight uppercase text-right text-white" style={{ textShadow: '0 0 60px rgba(255,255,255,0.4), 0 0 120px rgba(255,255,255,0.15), 0 4px 20px rgba(0,0,0,1)' }}>
                MINT.
                <br />
                BATTLE.
                <br />
                DOMINATE.
              </h2>
              <p className="font-inter text-base sm:text-lg max-w-sm mb-8 text-right flex self-end font-medium text-white/90" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
                Hatch elemental slugs. Level them up. Exploit elemental
                advantages. The cavern rewards the bold.
              </p>
              <div className="flex flex-col gap-3 self-end w-full max-w-[320px] text-right pointer-events-none">
                <div className="p-4 backdrop-blur-md rounded-lg relative overflow-hidden border border-white/20 bg-black/50" style={{ boxShadow: '0 0 20px rgba(255,255,255,0.05)' }}>
                  <div className="absolute top-0 left-0 w-1 h-full bg-white/60" />
                  <div className="font-orbitron font-bold text-sm mb-1 tracking-wider text-white" style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
                    PVP ESCROW WAGERS
                  </div>
                  <div className="font-inter text-xs leading-relaxed text-white/70">
                    Double-blind commit-reveal. Stake SUI on your slug — neither
                    player sees the other's element until both reveal!
                  </div>
                </div>
                <div className="p-4 backdrop-blur-md rounded-lg relative overflow-hidden mt-2 border border-white/15 bg-black/50">
                  <div className="absolute top-0 right-0 w-1 h-full bg-white/40" />
                  <div className="font-orbitron font-bold text-sm mb-1 tracking-wider text-white" style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
                    TRAINING GROUNDS
                  </div>
                  <div className="font-inter text-xs leading-relaxed text-white/70">
                    Not ready for SUI wagers? Deploy to the Training Grounds to
                    fight random enemies and earn Dark Coins to level up your
                    slugs.
                  </div>
                </div>
              </div>
            </TextBeat>

            {/* Beat D (78%–100%) — final section, scroll ends here */}
            <TextBeat progress={smoothProgress} start={0.78} end={1.0} position="center">
              <h2 className="font-orbitron font-black text-4xl sm:text-6xl md:text-7xl mb-4 uppercase text-white" style={{ textShadow: '0 0 60px rgba(255,255,255,0.5), 0 0 120px rgba(255,255,255,0.2), 0 4px 20px rgba(0,0,0,1)' }}>
                ENTER THE
                <br />
                GLAZED ARENA
              </h2>
              <p className="font-inter text-lg sm:text-xl max-w-md mx-auto mb-8 font-medium text-white/90" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
                Deploy protoform canisters. Wager SUI. The winning slug claims
                everything.
              </p>
              <div className="flex flex-col items-center gap-4">
                <motion.button
                  whileHover={btnHover}
                  whileTap={btnTap}
                  onClick={() => window.dispatchEvent(new CustomEvent("switch-tab", { detail: "arena" }))}
                  className="font-orbitron font-bold text-lg tracking-wider px-8 py-4 uppercase transition-colors duration-300 pointer-events-auto cursor-pointer text-white border-2 border-white/60 hover:bg-white/10"
                  style={{ ...btnStyle, boxShadow: '0 0 30px rgba(255,255,255,0.15)' }}
                >
                  [ ⬡ ENTER ARENA ]
                </motion.button>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("switch-tab", { detail: "command" }))}
                  className="font-inter text-sm transition-colors pointer-events-auto cursor-pointer text-white/40 hover:text-white/80"
                >
                  [ View Arsenal → ]
                </button>
              </div>
            </TextBeat>
          </div>


        </div>
      </div>
    </div>
  );
};
