import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGameState } from '../context/GameState';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, AlertTriangle } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   QuantumReactor — Aethera Daily Spin Wheel
   Variable-sized segments based on drop probability.
   Probability table on the right side.
   ═══════════════════════════════════════════════════════════════ */

interface SlugTier {
  key: string;
  name: string;
  color: string;
  chance: number;   // 0-1
  label: string;    // display %
  rarity: string;
}

const TIERS: SlugTier[] = [
  { key: 'water', name: 'WATER',  color: '#1583bb', chance: 0.05,   label: '5%',    rarity: 'Legendary' },
  { key: 'air',   name: 'AIR',    color: '#d79a2c', chance: 0.10,   label: '10%',   rarity: 'Rare' },
  { key: 'fire',  name: 'FIRE',   color: '#e24e0a', chance: 0.075,  label: '7.5%',  rarity: 'Uncommon' },
  { key: 'earth', name: 'EARTH',  color: '#b84a39', chance: 0.075,  label: '7.5%',  rarity: 'Uncommon' },
  { key: 'coins', name: 'COINS',  color: '#6f6f6f', chance: 0.70,   label: '70%',   rarity: '50–300 DC' },
];

// Build ordered segments for the wheel (angles proportional to chance)
const SEGMENTS: { key: string; name: string; color: string; startAngle: number; endAngle: number }[] = [];
{
  let angle = 0;
  for (const t of TIERS) {
    const sweep = t.chance * Math.PI * 2;
    SEGMENTS.push({ key: t.key, name: t.name, color: t.color, startAngle: angle, endAngle: angle + sweep });
    angle += sweep;
  }
}

const REWARD_TO_KEY: Record<number, string> = { 1: 'water', 2: 'air', 3: 'fire', 4: 'earth', 5: 'coins' };
const DUR = 4200;
const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4);

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mixColor(hex: string, base: [number, number, number], t: number): string {
  const c = hexToRgb(hex);
  return `rgb(${Math.round(c[0]*(1-t)+base[0]*t)},${Math.round(c[1]*(1-t)+base[1]*t)},${Math.round(c[2]*(1-t)+base[2]*t)})`;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; r: number; color: string;
}

export const QuantumReactor: React.FC = () => {
  const { quantumSpin, darkCoins } = useGameState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [reward, setReward] = useState<{ type: number; amount: number; name?: string; element?: string } | null>(null);
  const [error, setError] = useState('');

  const rotRef = useRef(0);
  const spinState = useRef({
    spinning: false, rotFrom: 0, rotTo: 0, startTime: 0,
    pending: '', result: null as string | null, glow: 0,
    parts: [] as Particle[],
  });
  const dimRef = useRef({ W: 0, H: 0, cx: 0, cy: 0, R: 0 });
  const animRef = useRef(0);

  const spawnBurst = useCallback((hex: string) => {
    const { cx, cy, R } = dimRef.current;
    const parts: Particle[] = [];
    for (let i = 0; i < 90; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = (0.5 + Math.random() * 2.4) * R;
      const life = 0.7 + Math.random() * 0.7;
      parts.push({ x: cx, y: cy, vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd, life, max: life, r: R*(0.012+Math.random()*0.022), color: hex });
    }
    spinState.current.parts = parts;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      const W = rect.width; const H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dimRef.current = { W, H, cx: W / 2, cy: H / 2, R: Math.min(W, H) * 0.40 };
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    const drawWheel = () => {
      const { cx, cy, R } = dimRef.current;
      const bg: [number, number, number] = [247, 247, 246]; // --bg-secondary
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotRef.current);

      // Draw variable-sized segments
      for (const seg of SEGMENTS) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, R, seg.startAngle, seg.endAngle);
        ctx.closePath();
        ctx.fillStyle = mixColor(seg.color, bg, 0.78);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.stroke();
      }

      // Labels + colored dots
      for (const seg of SEGMENTS) {
        const midAngle = (seg.startAngle + seg.endAngle) / 2;
        const sweep = seg.endAngle - seg.startAngle;
        ctx.save();
        ctx.rotate(midAngle);
        // Colored dot
        ctx.beginPath();
        ctx.arc(R * 0.80, 0, R * 0.04, 0, Math.PI * 2);
        ctx.fillStyle = seg.color;
        ctx.fill();
        // Label (only if segment wide enough)
        if (sweep > 0.25) {
          ctx.translate(R * 0.52, 0);
          ctx.rotate(Math.PI / 2);
          ctx.fillStyle = '#2a2a2a';
          ctx.font = `600 ${Math.max(8, R * 0.05)}px Orbitron, monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(seg.name, 0, 0);
        }
        ctx.restore();
      }
      ctx.restore();

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.stroke();
    };

    const drawHub = (t: number) => {
      const { cx, cy, R } = dimRef.current;
      const st = spinState.current;
      const hr = R * 0.24;
      const col = st.result ? TIERS.find(t2 => t2.key === st.result)?.color || null : null;

      // Glow
      if (st.glow > 0 && col) {
        const rgb = hexToRgb(col).join(',');
        const a = st.glow * (0.4 + 0.15 * Math.sin(t * 0.005));
        const g = ctx.createRadialGradient(cx, cy, hr * 0.3, cx, cy, hr * 2.6);
        g.addColorStop(0, `rgba(${rgb},${a})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, hr * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      // Circle
      ctx.beginPath();
      ctx.arc(cx, cy, hr, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = col || 'rgba(0,0,0,0.18)';
      ctx.stroke();
      // Text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (st.result) {
        const tier = TIERS.find(t2 => t2.key === st.result);
        ctx.fillStyle = col!;
        ctx.font = `700 ${hr * 0.32}px Orbitron, monospace`;
        ctx.fillText(tier?.name || '', cx, cy - hr * 0.1);
        ctx.fillStyle = '#9a9a9a';
        ctx.font = `500 ${hr * 0.14}px Inter, sans-serif`;
        ctx.fillText(st.result === 'coins' ? 'COINS WON' : 'SLUG WON', cx, cy + hr * 0.32);
      } else {
        const pulse = st.spinning ? 0.5 + 0.5 * Math.sin(t * 0.02) : 1;
        ctx.fillStyle = `rgba(20,20,20,${(0.55 + 0.4 * pulse).toFixed(2)})`;
        ctx.font = `700 ${hr * 0.34}px Orbitron, monospace`;
        ctx.fillText('SPIN', cx, cy);
      }
    };

    const drawPointer = () => {
      const { cx, cy, R } = dimRef.current;
      ctx.save();
      ctx.translate(cx, cy - R - 4);
      ctx.beginPath();
      ctx.moveTo(-11, -14);
      ctx.lineTo(11, -14);
      ctx.lineTo(0, 7);
      ctx.closePath();
      ctx.fillStyle = '#000000';
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
      ctx.fill();
      ctx.restore();
    };

    const drawParts = (dt: number) => {
      const st = spinState.current;
      if (!st.parts.length) return;
      for (const p of st.parts) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 0.94; p.vy *= 0.94; p.life -= dt;
        const a = Math.max(0, p.life / p.max);
        const rgb = hexToRgb(p.color).join(',');
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(${rgb},${(a * 0.9).toFixed(2)})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      st.parts = st.parts.filter(p => p.life > 0);
    };

    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const st = spinState.current;
      const { W, H } = dimRef.current;
      if (st.spinning) {
        const p = Math.min(1, (t - st.startTime) / DUR);
        rotRef.current = st.rotFrom + (st.rotTo - st.rotFrom) * easeOutQuart(p);
        if (p >= 1) {
          st.spinning = false;
          st.result = st.pending;
          st.glow = 1;
          const tier = TIERS.find(t2 => t2.key === st.result);
          spawnBurst(tier?.color || '#999');
          (window as any).__qrSpinDone?.();
        }
      }
      ctx.clearRect(0, 0, W, H);
      drawWheel();
      drawParts(dt);
      drawHub(t);
      drawPointer();
      animRef.current = requestAnimationFrame(frame);
    };
    animRef.current = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, [spawnBurst]);

  const handleSpin = async () => {
    if (spinning) return;
    setSpinning(true); setReward(null); setError('');
    const st = spinState.current;
    st.result = null; st.glow = 0; st.parts = [];

    const result = await quantumSpin();
    if (!result.success) {
      setSpinning(false);
      setError('Spin failed. Cooldown active (24h) or insufficient SUI balance (0.05 SUI required).');
      return;
    }

    const targetKey = REWARD_TO_KEY[result.rewardType] || 'fire';
    // Find the segment for this key
    const seg = SEGMENTS.find(s => s.key === targetKey) || SEGMENTS[0];
    const midAngle = (seg.startAngle + seg.endAngle) / 2;

    // Target: pointer is at -PI/2 (top), so we need the midAngle to align there
    const turns = 5 + Math.floor(Math.random() * 2);
    const target = -Math.PI / 2 - midAngle;
    const k = Math.ceil((rotRef.current + turns * 2 * Math.PI - target) / (2 * Math.PI));

    st.rotFrom = rotRef.current;
    st.rotTo = target + k * 2 * Math.PI;
    st.pending = targetKey;
    st.startTime = performance.now();
    st.spinning = true;

    await new Promise<void>(resolve => { (window as any).__qrSpinDone = resolve; });
    delete (window as any).__qrSpinDone;
    setSpinning(false);

    if (result.rewardType === 5) {
      setReward({ type: 5, amount: result.amount, element: 'coins' });
    } else {
      setReward({ type: result.rewardType, amount: result.amount, name: result.slugName, element: targetKey });
    }
  };

  return (
    <div className="tab-panel active">
      <div className="panel-header">
        <div className="panel-header-inner">
          <div className="section-label">Probability Engine</div>
          <h2 className="section-title">Quantum Reactor</h2>
          <p className="panel-desc">
            Spin the reactor to claim today's slug. Each spin costs 0.05 SUI with a 24h cooldown.
            Rarer elements have smaller slices — Water is legendary at just 5%.
          </p>
        </div>
      </div>

      {/* Dark Coins */}
      <div className="hatchery-config">
        <div className="hatchery-config-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="hatchery-config-title">REACTOR STATUS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Coins size={14} style={{ color: 'var(--neon-cyan)' }} />
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '14px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '2px' }}>
              {darkCoins} DC
            </span>
          </div>
        </div>
      </div>

      {/* Two-column: Wheel + Probability Table */}
      <div className="hatchery-layout">
        <div style={{ maxWidth: '980px', margin: '0 auto 24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>

          {/* Left: Spin Wheel */}
          <div
            ref={containerRef}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--surface-border)',
              clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
              position: 'relative',
              height: '420px',
              overflow: 'hidden',
            }}
          >
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
            {!spinning && !reward && (
              <div style={{
                position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                padding: '10px 18px', background: 'var(--surface)', backdropFilter: 'blur(16px)',
                border: '1px solid var(--surface-border)', borderRadius: '100px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)', zIndex: 5,
              }}>
                <button
                  onClick={handleSpin}
                  style={{
                    background: 'var(--ink)', border: 'none', color: 'var(--bg)',
                    fontFamily: "'Orbitron', monospace", fontSize: '11px', letterSpacing: '1px',
                    fontWeight: 600, padding: '10px 26px', borderRadius: '100px', cursor: 'pointer',
                  }}
                >
                  SPIN · 0.05 SUI
                </button>
              </div>
            )}
          </div>

          {/* Right: Probability Table */}
          <div style={{
            background: 'var(--panel-bg)', border: '1px solid var(--surface-border)',
            clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
            padding: '24px 20px',
          }}>
            <div style={{
              fontFamily: "'Orbitron', monospace", fontSize: '10px', letterSpacing: '3px',
              color: 'var(--ink-dim)', marginBottom: '18px', textTransform: 'uppercase',
            }}>
              ⬡ Drop Rates
            </div>
            {TIERS.map(tier => (
              <div key={tier.key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: tier.color, flexShrink: 0,
                    boxShadow: `0 0 6px ${tier.color}40`,
                  }} />
                  <div>
                    <div style={{
                      fontFamily: "'Orbitron', monospace", fontSize: '11px', fontWeight: 700,
                      color: 'var(--ink)', letterSpacing: '1px',
                    }}>
                      {tier.name}
                    </div>
                    <div style={{
                      fontSize: '10px', color: 'var(--ink-dim)', marginTop: '1px',
                    }}>
                      {tier.rarity}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontFamily: "'Orbitron', monospace", fontSize: '13px', fontWeight: 700,
                  color: tier.color, letterSpacing: '1px',
                }}>
                  {tier.label}
                </div>
              </div>
            ))}

            {/* Visual bar chart */}
            <div style={{ marginTop: '18px' }}>
              <div style={{
                fontFamily: "'Orbitron', monospace", fontSize: '9px', letterSpacing: '2px',
                color: 'var(--ink-dim)', marginBottom: '10px', textTransform: 'uppercase',
              }}>
                Probability Distribution
              </div>
              {TIERS.map(tier => (
                <div key={tier.key + '-bar'} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px',
                }}>
                  <div style={{
                    fontSize: '9px', fontFamily: "'Orbitron', monospace", color: 'var(--ink-dim)',
                    width: '28px', textAlign: 'right', flexShrink: 0,
                  }}>
                    {tier.label}
                  </div>
                  <div style={{
                    flex: 1, height: '6px', borderRadius: '3px',
                    background: 'rgba(0,0,0,0.04)', overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${tier.chance * 100}%`, height: '100%', borderRadius: '3px',
                      background: tier.color,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Result / Error */}
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ maxWidth: '980px', margin: '0 auto' }}>
              <div style={{
                background: 'var(--panel-bg)', border: '1px solid rgba(200,50,50,0.3)',
                padding: '20px 24px', clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <AlertTriangle size={20} style={{ color: '#c03030', flexShrink: 0 }} />
                <p style={{ fontFamily: "'Orbitron', monospace", fontSize: '11px', color: 'var(--ink-dim)', letterSpacing: '1px' }}>{error}</p>
              </div>
            </motion.div>
          ) : reward ? (
            <motion.div key="reward" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 100 }} style={{ maxWidth: '980px', margin: '0 auto' }}>
              <div style={{
                background: 'var(--panel-bg)',
                border: `1px solid ${TIERS.find(t => t.key === reward.element)?.color || 'var(--ink-faint)'}`,
                padding: '24px 28px',
                clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
                textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: "'Orbitron', monospace", fontSize: '10px', letterSpacing: '4px',
                  color: TIERS.find(t => t.key === reward.element)?.color || 'var(--ink-dim)',
                  marginBottom: '8px',
                }}>
                  ⬡ {reward.type === 5 ? 'RESOURCE CACHE' : (TIERS.find(t => t.key === reward.element)?.rarity || '').toUpperCase() + ' DROP'}
                </div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '18px', fontWeight: 900, color: 'var(--ink)', marginBottom: '6px' }}>
                  {reward.type === 5 ? `+${reward.amount} DARK COINS` : reward.name || 'SLUG'}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                  {reward.type === 5 ? 'Energy converted to Dark Coins.' : `Element: ${TIERS.find(t => t.key === reward.element)?.name || 'Unknown'}`}
                </p>
                <button
                  onClick={() => { setReward(null); setError(''); }}
                  style={{
                    marginTop: '16px', background: 'var(--ink)', border: 'none', color: 'var(--bg)',
                    fontFamily: "'Orbitron', monospace", fontSize: '10px', letterSpacing: '1.5px',
                    padding: '10px 28px', borderRadius: '100px', cursor: 'pointer',
                  }}
                >
                  SPIN AGAIN
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};
