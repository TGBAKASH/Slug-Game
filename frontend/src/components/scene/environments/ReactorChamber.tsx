import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useGLTF, Clone, Center } from '@react-three/drei';
import { soundManager } from '../../../context/SoundManager';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════
   ReactorChamber — Slug Reveal Cinematic (Aethera Handoff v2)
   Per-element particles, glow ring, model normalization,
   easeOutBack reveal pop, gun+shell optional models.
   ═══════════════════════════════════════════════════════════════ */

// Element colors sampled from real slug model albedo textures
const ELEMENT_COLOR: Record<number, number> = {
  1: 0xe24e0a, // Fire
  2: 0x1583bb, // Water
  3: 0xb84a39, // Earth
  4: 0xd79a2c, // Air
};
const ELEMENT_ACCENT: Record<number, number> = {
  1: 0xf5a36a,
  2: 0x7fc4e2,
  3: 0xd9a88c,
  4: 0xeccf86,
};
const ELEMENT_ICONS: Record<number, string> = { 1: '🔥', 2: '💧', 3: '⛰️', 4: '🌀' };
const ELEMENT_NAMES: Record<number, string> = { 1: 'FIRE', 2: 'WATER', 3: 'EARTH', 4: 'AIR' };

const MODEL_PATHS: Record<number, string> = {
  1: '/models/fireslug.glb',
  2: '/models/waterslug.glb',
  3: '/models/earthslug.glb',
  4: '/models/airslug.glb',
};
const GUN_PATH = '/models/gunslug.glb';
const SHELL_PATH = '/models/slug_shell.glb';



type Phase = 'vortex' | 'compress' | 'flash' | 'reveal' | 'stats' | 'done';

interface ReactorChamberProps {
  element: number;
  rarity: number;
  onComplete: () => void;
}

// ── Normalize a 3D object to fit within targetSize ──
function normalizeObject(obj: THREE.Object3D, targetSize: number): number {
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3(); box.getSize(size);
  const center = new THREE.Vector3(); box.getCenter(center);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const s = targetSize / maxDim;
  obj.scale.setScalar(s);
  obj.position.sub(center.multiplyScalar(s));
  return s;
}

// ── Error boundary for GLB model loading ──
class ModelBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

// ── Procedural slug fallback ──
const ProceduralSlug: React.FC<{ element: number; visible: boolean; scale: number }> = ({ element, visible, scale }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current && visible) {
      ref.current.rotation.y += dt * 0.3;
    }
  });
  if (!visible) return null;
  return (
    <group ref={ref} scale={scale}>
      <mesh castShadow>
        <sphereGeometry args={[0.8, 64, 64]} />
        <meshStandardMaterial color={ELEMENT_COLOR[element]} roughness={0.32} metalness={0.1} />
      </mesh>
      {/* Eye */}
      <mesh position={[0, 0.34, 0.66]} castShadow>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial color={0xffffff} roughness={0.1} />
      </mesh>
      {/* Pupil */}
      <mesh position={[0, 0.34, 0.81]}>
        <sphereGeometry args={[0.085, 24, 24]} />
        <meshStandardMaterial color={0x101018} roughness={0.3} />
      </mesh>
    </group>
  );
};

// ── Real GLB slug model ──
const SlugModel: React.FC<{ element: number; visible: boolean; targetSize: number }> = ({ element, visible, targetSize }) => {
  const ref = useRef<THREE.Group>(null);
  const path = MODEL_PATHS[element] || MODEL_PATHS[1];
  const { scene } = useGLTF(path);

  useEffect(() => {
    if (ref.current && scene) {
      scene.traverse((o: any) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      normalizeObject(ref.current, targetSize);
    }
  }, [scene, targetSize]);

  useFrame((_, dt) => {
    if (ref.current && visible) {
      ref.current.rotation.y += dt * 0.3;
    }
  });

  if (!visible) return null;
  return (
    <group ref={ref}>
      <Clone object={scene} />
    </group>
  );
};

// ── Glow sprite texture (shared) ──
function makeGlowTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// ── Particle cloud layer ──
const ParticleLayer: React.FC<{
  count: number;
  element: number;
  size: number;
  opacity: number;
  rMin: number;
  rMax: number;
  ySpread: number;
  convergence: number;
  glowTex: THREE.Texture;
}> = ({ count, element, size, opacity, rMin, rMax, ySpread, convergence, glowTex }) => {
  const ref = useRef<THREE.Points>(null);

  const { positions, home } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const hm = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = rMin + Math.random() * (rMax - rMin);
      const y = (Math.random() - 0.25) * ySpread;
      hm[i * 3] = Math.cos(a) * r;
      hm[i * 3 + 1] = y;
      hm[i * 3 + 2] = Math.sin(a) * r;
      pos[i * 3] = hm[i * 3];
      pos[i * 3 + 1] = hm[i * 3 + 1];
      pos[i * 3 + 2] = hm[i * 3 + 2];
    }
    return { positions: pos, home: hm };
  }, [count, rMin, rMax, ySpread]);

  useFrame((state) => {
    if (!ref.current) return;
    const arr = (ref.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const t = state.clock.elapsedTime;
    const k = 1 - convergence * 0.78;
    for (let i = 0; i < count; i++) {
      const hx = home[i * 3];
      const hy = home[i * 3 + 1];
      const hz = home[i * 3 + 2];
      const swirl = t * 0.22 + i;
      arr[i * 3] = hx * k + Math.cos(swirl) * 0.04;
      arr[i * 3 + 1] = hy * k + 0.4 + Math.sin(t + i) * 0.03;
      arr[i * 3 + 2] = hz * k + Math.sin(swirl) * 0.04;
    }
    (ref.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={ELEMENT_COLOR[element]}
        map={glowTex}
        size={size}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// ── Energy ring ──
const EnergyRing: React.FC<{ element: number; flash: number }> = ({ element, flash }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.z += dt * 0.25;
      ref.current.scale.setScalar(1 + flash * 0.12);
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
      <torusGeometry args={[1.45, 0.008, 16, 140]} />
      <meshBasicMaterial color={ELEMENT_COLOR[element]} transparent opacity={0.4 + flash * 0.4} />
    </mesh>
  );
};

// ── Main 3D Scene ──
const RevealScene: React.FC<{
  element: number;
  phase: Phase;
  elapsed: number;
}> = ({ element, phase, elapsed }) => {
  const glowTex = useMemo(() => makeGlowTexture(), []);
  const aberrationOffset = useMemo(() => new THREE.Vector2(0.008, 0.008), []);
  const zeroOffset = useMemo(() => new THREE.Vector2(0, 0), []);

  const DUR_IN = 0.9;

  const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
  const conv = phase === 'vortex' ? 0 :
    phase === 'compress' ? easeOut(Math.min(1, elapsed / DUR_IN)) * 0.5 :
    phase === 'flash' ? 1 :
    1;

  const isRevealed = phase === 'reveal' || phase === 'stats' || phase === 'done';
  const flash = phase === 'flash' ? 1 : 0;
  const slugVisible = isRevealed;

  // Calculate slug scale with easeOutBack
  const easeOutBack = (x: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  };

  const slugScale = slugVisible ? easeOutBack(Math.min(1, elapsed * 1.4)) : 0;

  return (
    <>
      <color attach="background" args={['#0e0e10']} />
      <fog attach="fog" args={['#0e0e10', 8, 18]} />

      {/* Studio lighting */}
      <hemisphereLight args={[0xffffff, 0xdcdcdc, 0.9]} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[4, 8, 5]}
        intensity={2.0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-5, 3, 2]} intensity={0.6} />

      {/* Accent light that flashes with element */}
      <pointLight
        position={[0, 1, 2]}
        color={ELEMENT_COLOR[element]}
        intensity={2 + flash * 10}
        distance={12}
        decay={2}
      />

      {/* Shadow plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.38, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <shadowMaterial opacity={0.32} />
      </mesh>

      {/* Energy ring */}
      <EnergyRing element={element} flash={flash} />

      {/* Particles — fine specks */}
      <ParticleLayer
        count={170} element={element} size={0.1} opacity={0.9}
        rMin={1.8} rMax={4.0} ySpread={3.0}
        convergence={conv} glowTex={glowTex}
      />
      {/* Particles — bigger motes */}
      <ParticleLayer
        count={34} element={element} size={0.17} opacity={1.0}
        rMin={1.8} rMax={3.6} ySpread={2.6}
        convergence={conv} glowTex={glowTex}
      />

      {/* Slug model */}
      <group scale={slugScale} position={[0, 0.2 + Math.sin(elapsed * 1.3) * 0.04, 0]}>
        <ModelBoundary fallback={<ProceduralSlug element={element} visible={slugVisible} scale={1} />}>
          <Suspense fallback={<ProceduralSlug element={element} visible={slugVisible} scale={1} />}>
            <SlugModel element={element} visible={slugVisible} targetSize={1.5} />
          </Suspense>
        </ModelBoundary>
      </group>

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          intensity={flash > 0 ? 10 : isRevealed ? 1.3 : 1.5}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={flash > 0 ? aberrationOffset : zeroOffset}
        />
        <Noise opacity={0.04} />
        <Vignette darkness={1.0} />
      </EffectComposer>
    </>
  );
};

// ── Animated counter ──
const AnimatedNum: React.FC<{ target: number; active: boolean }> = ({ target, active }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) { setVal(0); return; }
    let frame: number;
    const start = performance.now();
    const dur = 800;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setVal(Math.round(target * p));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active]);
  return <>{val}</>;
};

// ── Main component ──
export const ReactorChamber: React.FC<ReactorChamberProps> = ({ element, rarity, onComplete }) => {
  const [phase, setPhase] = useState<Phase>('vortex');
  const [elapsed, setElapsed] = useState(0);
  const [shake, setShake] = useState({ x: 0, y: 0 });
  const startRef = useRef(Date.now());
  const phaseStartRef = useRef(Date.now());

  const color = ELEMENT_COLOR[element] || 0xe24e0a;
  const colorHex = '#' + color.toString(16).padStart(6, '0');
  const elName = ELEMENT_NAMES[element] || 'FIRE';
  const elIcon = ELEMENT_ICONS[element] || '🔥';

  // Phase machine
  useEffect(() => {
    const timings: Record<Phase, number> = {
      vortex: 1500,
      compress: 1200,
      flash: 300,
      reveal: 2500,
      stats: 3000,
      done: 0,
    };
    const order: Phase[] = ['vortex', 'compress', 'flash', 'reveal', 'stats', 'done'];
    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;

    const advance = () => {
      if (idx >= order.length - 1) {
        onComplete();
        return;
      }
      idx++;
      setPhase(order[idx]);
      phaseStartRef.current = Date.now();
      setElapsed(0);
      if (order[idx] === 'flash') {
        soundManager.playImpact(element);
        // Screen shake during flash
        const shakeInterval = setInterval(() => {
          setShake({ x: (Math.random() - 0.5) * 12, y: (Math.random() - 0.5) * 8 });
        }, 30);
        setTimeout(() => {
          clearInterval(shakeInterval);
          setShake({ x: 0, y: 0 });
        }, 300);
      }
      if (order[idx] !== 'done') {
        timer = setTimeout(advance, timings[order[idx]]);
      }
    };

    timer = setTimeout(advance, timings[order[0]]);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Elapsed tracker per phase
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((Date.now() - phaseStartRef.current) / 1000);
    }, 16);
    return () => clearInterval(id);
  }, [phase]);

  const showStats = phase === 'stats' || phase === 'done';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#0e0e10',
        transform: `translate(${shake.x}px, ${shake.y}px)`,
        transition: shake.x === 0 ? 'transform 0.15s ease-out' : 'none',
      }}
    >
      {/* Three.js Canvas */}
      <Suspense fallback={
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Orbitron', monospace", fontSize: '12px', letterSpacing: '3px' }}>
          CHANNELING ENERGY...
        </div>
      }>
        <Canvas
          camera={{ position: [0, 0.6, 5.8], fov: 38 }}
          shadows
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <RevealScene element={element} phase={phase} elapsed={elapsed} />
        </Canvas>
      </Suspense>

      {/* Phase flash overlay */}
      {phase === 'flash' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.95), transparent 70%)`,
          pointerEvents: 'none',
          animation: 'fadeOut 0.3s ease-out forwards',
        }} />
      )}

      {/* Stats overlay */}
      {showStats && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
          paddingBottom: '80px',
          background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.7))',
          animation: 'fadeIn 0.6s ease-out',
          pointerEvents: 'auto',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <div style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: '10px',
              letterSpacing: '4px',
              color: colorHex,
              marginBottom: '8px',
              opacity: 0.9,
            }}>
              {elIcon} {elName} ELEMENT
            </div>
            <div style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: '42px',
              color: '#f0ede8',
              lineHeight: 1.1,
              marginBottom: '16px',
            }}>
              Slug <em style={{ color: colorHex, fontStyle: 'italic' }}>revealed</em>
            </div>

            {/* Stats row */}
            <div style={{
              display: 'flex', gap: '24px', justifyContent: 'center', marginBottom: '24px',
            }}>
              {[
                { label: 'POWER', val: 42 + element * 8 },
                { label: 'SPEED', val: 38 + element * 5 },
                { label: 'HP', val: 100 + element * 15 },
              ].map(({ label, val }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '9px', letterSpacing: '2px', color: 'rgba(240,237,232,0.5)', marginBottom: '4px' }}>
                    {label}
                  </div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '22px', fontWeight: 700, color: colorHex }}>
                    <AnimatedNum target={val} active={showStats} />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onComplete}
              style={{
                background: 'transparent',
                border: `1px solid ${colorHex}`,
                color: colorHex,
                fontFamily: "'Orbitron', monospace",
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '2px',
                padding: '12px 36px',
                borderRadius: '100px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}

      {/* Inline keyframe styles */}
      <style>{`
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};
