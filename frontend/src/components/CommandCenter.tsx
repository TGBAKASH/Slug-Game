import React, { useState, useEffect } from "react";
import { useGameState, ELEMENTS, BASE_STATS, GROWTH_RATES } from "../context/GameState";
import { Shield, Flame, Droplets, Mountain, Wind, Zap, Coins, Award, Heart, Swords, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { SlugModelThumbnail } from "./SlugModelThumbnail";

export const CommandCenter: React.FC = () => {
  const {
    slugs,
    activeSlugId,
    activeSlug,
    setActiveSlugId,
    levelUpSlug,
    walletMode,
    darkCoins,
    awakenSlug,
    ascendSlug,
  } = useGameState();

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (ms: number) => {
    const totalSecs = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const [levelUpMessage, setLevelUpMessage] = useState<string | null>(null);
  const [levelingStatus, setLevelingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleLevelUp = async () => {
    if (!activeSlug) return;
    
    const coinCost = activeSlug.level * 10;

    if (darkCoins < coinCost) {
      setLevelUpMessage(`Insufficient Coins! You need ${coinCost} coins (have ${darkCoins}). Win battles to earn more.`);
      setLevelingStatus("error");
      setTimeout(() => setLevelUpMessage(null), 4000);
      return;
    }

    if (activeSlug.level >= 50) {
      setLevelUpMessage("MAX LEVEL 50 REACHED!");
      setLevelingStatus("error");
      setTimeout(() => setLevelUpMessage(null), 3000);
      return;
    }

    setLevelingStatus("loading");
    setLevelUpMessage("Synthesizing cavern energy...");

    setTimeout(async () => {
      const success = await levelUpSlug();
      if (success) {
        const growth = GROWTH_RATES[activeSlug.element];
        setLevelUpMessage(`LEVEL UP! HP +${growth?.hp ? growth.hp / 10 : 0}% | ATK +${growth?.atk ? growth.atk / 10 : 0}%`);
        setLevelingStatus("success");
      } else {
        setLevelUpMessage("Transaction declined by the network.");
        setLevelingStatus("error");
      }
      setTimeout(() => {
        setLevelUpMessage(null);
        setLevelingStatus("idle");
      }, 4000);
    }, 1500);
  };

  const getElementIcon = (elemId: number, className: string = "w-4 h-4") => {
    switch (elemId) {
      case 1: return <Flame className={`${className} text-red-500`} />;
      case 2: return <Droplets className={`${className} text-cyan-400`} />;
      case 3: return <Mountain className={`${className} text-emerald-500`} />;
      case 4: return <Wind className={`${className} text-teal-300`} />;
      default: return <Shield className={`${className} text-slate-400`} />;
    }
  };

  const renderElementBadge = (elementId: number) => {
    const el = ELEMENTS[elementId];
    if (!el) return null;
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-300 shadow-sm rounded-lg font-label-caps text-xs text-slate-800 font-black">
        {getElementIcon(elementId, "w-4 h-4")}
        <span>{el.name}</span>
      </div>
    );
  };

  const getTierColor = (element: number) => {
    const tier = BASE_STATS[element]?.tier;
    if (tier === "Very Good") return "text-yellow-600 border-yellow-300";
    if (tier === "Good") return "text-cyan-600 border-cyan-300";
    return "text-slate-600 border-slate-300";
  };

  if (slugs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface-container-low border border-outline-variant rounded-2xl text-center min-h-[500px] z-10 relative max-w-2xl mx-auto space-y-6 soft-glow-card my-10">
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-dashed border-amber-500/40 rounded-full animate-spin duration-3000"></div>
          <Shield className="w-16 h-16 text-amber-500 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h3 className="text-headline-lg font-headline-lg text-on-surface uppercase font-black tracking-tight">
            NO ACTIVE SLUGS DETECTED
          </h3>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Your biological containment inventory is currently empty! Visit the <strong>Hatchery</strong> tab to mint your first slug.
          </p>
        </div>
        <div className="border-t border-outline-variant/30 pt-4 w-full max-w-sm">
          <p className="text-xs text-primary-container font-black tracking-wider uppercase animate-pulse">
            ⚠️ SYSTEM ALIGNMENT REQUIRED // VISIT MINTING BAY
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="aethera-panel space-y-8 relative z-10 py-2" data-tick={tick}>
      
      <header 
        className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 rounded-2xl relative overflow-hidden shadow-lg"
        style={{ backgroundColor: '#f8fafc', border: '2px solid #cbd5e1', padding: '2rem', marginBottom: '2.5rem' }}
      >
        <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)' }}></div>
        
        <div className="space-y-2 pt-2">
          <h2 
            className="uppercase tracking-widest font-black leading-relaxed drop-shadow-sm"
            style={{ fontSize: '18px', color: 'var(--ink)' }}
          >
            OPERATOR COMMAND HUD
          </h2>
          <p 
            className="max-w-xl leading-relaxed"
            style={{ fontSize: '11px', color: 'var(--ink-dim)' }}
          >
            Sui Network Matrix: <span style={{ color: walletMode ? 'var(--ink)' : '#d97706', fontWeight: 900 }}>{walletMode ? "CONNECTED WALLET" : "LOCAL SIMULATOR"}</span>. Level up slugs, review stats, and prepare for arena battles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white border border-slate-300 rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50">
              <Coins className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <div className="font-label-caps text-[10px] text-slate-600 font-black">DARK COINS</div>
              <div className="font-stats-lg text-stats-lg text-slate-900 font-black">{darkCoins}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 relative z-10" style={{ gap: '2.5rem' }}>
        
        {!activeSlug ? (
          <div className="lg:col-span-7 bg-[var(--bg-secondary)] border border-slate-200 rounded-2xl flex flex-col items-center justify-center shadow-md min-h-[550px] relative overflow-hidden" style={{ padding: '2.5rem' }}>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>
            <Shield className="w-16 h-16 text-slate-400 opacity-50 mb-4" />
            <h4 className="text-2xl font-black uppercase text-black drop-shadow-sm mb-3">No Active Core Locked</h4>
            <p className="text-sm text-black font-black leading-relaxed max-w-sm text-center">
              Unlock a biological canister by choosing an active slug from your arsenal grid on the right.
            </p>
          </div>
        ) : (
        <section className="lg:col-span-7 bg-surface-container-low border border-[var(--surface-border)] rounded-2xl flex flex-col justify-between shadow-2xl min-h-[550px] relative overflow-hidden" style={{ padding: '2.5rem' }}>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40"></div>
          <div className="absolute inset-0 scanline opacity-25 z-0 pointer-events-none"></div>

          <div className="z-10 flex flex-col justify-between flex-grow space-y-6">
              
              {/* Header: Name and Element Badge */}
              <div className="flex justify-between items-center border-b border-slate-300 pb-6 w-full">
                <div className="flex items-center gap-4">
                  <h3 className="text-4xl font-black text-slate-900 drop-shadow-sm uppercase tracking-tight leading-none">
                    {activeSlug.name}
                  </h3>
                  <span className={`font-label-caps text-xs px-3 py-1 rounded-md border bg-white font-black tracking-widest shadow-sm ${getTierColor(activeSlug.element)}`}>
                    {BASE_STATS[activeSlug.element]?.tier?.toUpperCase() || "DECENT"} TIER
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {renderElementBadge(activeSlug.element)}
                </div>
              </div>

              {/* Central Stasis Containment Visualizer */}
              <div className="aspect-[16/9] w-full bg-surface-container-lowest border border-outline-variant rounded-2xl relative overflow-hidden flex items-center justify-center shadow-inner">
                <div className={`absolute w-72 h-72 rounded-full filter blur-3xl opacity-30 animate-pulse ${
                  activeSlug.element === 1 ? "bg-red-400" :
                  activeSlug.element === 2 ? "bg-cyan-500" :
                  activeSlug.element === 3 ? "bg-emerald-500" : "bg-teal-400"
                }`} />

                <div className="absolute w-64 h-64 border border-dashed border-outline-variant/30 rounded-full reticle-spin pointer-events-none"></div>
                <div className="absolute w-60 h-60 border-2 border-double border-outline-variant/15 rounded-full reticle-spin duration-3000 rotate-45 pointer-events-none"></div>

                <div className="w-56 h-56 rounded-full border-4 flex items-center justify-center transition-all duration-700 bg-surface-container-low/50 backdrop-blur-sm relative overflow-hidden border-primary-container/40">
                  <div className="absolute opacity-10 scale-125 rotate-12">
                    {getElementIcon(activeSlug.element, "w-24 h-24")}
                  </div>
                  <div className="w-full h-full z-10 relative cursor-pointer">
                    <SlugModelThumbnail element={activeSlug.element} />
                  </div>
                </div>

                <div className="absolute top-4 left-4 font-label-caps text-[9px] text-outline flex items-center gap-1 font-bold">
                  <span className="w-2 h-2 rounded-full bg-primary-container animate-ping"></span>
                  <span>TACTICAL SCANNER ENGAGED // DETECTING GENES</span>
                </div>

                {/* Sleep Recovery Overlay */}
                {activeSlug.sleep_until_ms > Date.now() && (
                  <div className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse"></div>
                      <div className="w-16 h-16 rounded-full border border-blue-500/40 flex items-center justify-center bg-blue-950/20 text-blue-400 relative">
                        <span className="text-xl font-bold animate-bounce font-label-caps">💤</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-headline-md text-sm text-blue-400 font-bold uppercase tracking-wide">STASIS DEFEAT RECOVERY</h4>
                      <p className="text-[10px] text-outline font-mono">
                        Slug is sleeping after consecutive losses. {activeSlug.consecutiveLosses} loss streak.
                      </p>
                      <div className="font-stats-lg text-lg text-cyan-400 font-black tracking-wider py-1 font-mono animate-pulse">
                        TIME REMAINING: {formatTime(activeSlug.sleep_until_ms - Date.now())}
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        const rem = activeSlug.sleep_until_ms - Date.now();
                        const mins = Math.max(1, Math.ceil(rem / 60000));
                        const cost = mins * 5;
                        if (darkCoins < cost) {
                          alert(`Insufficient Dark Coins! You need ${cost} coins, but only have ${darkCoins}.`);
                          return;
                        }
                        await awakenSlug(activeSlug.id);
                      }}
                      className="px-4 py-2 bg-blue-950/30 border border-blue-500/50 hover:bg-blue-500 hover:text-black text-blue-400 font-label-caps text-[10px] font-black rounded-lg transition-all shadow-[0_0_10px_rgba(59,130,246,0.15)] cursor-pointer flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>DISCHARGE STASIS ({Math.max(1, Math.ceil((activeSlug.sleep_until_ms - Date.now()) / 60000)) * 5} COINS)</span>
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Stats Grid: Level, HP, ATK, Wins, Coins */}
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-300 p-3.5 rounded-xl text-center space-y-1 shadow-sm">
                    <div className="font-label-caps text-[10px] text-slate-500 font-black uppercase tracking-wider">LEVEL</div>
                    <div className="font-stats-lg text-xl text-slate-800 font-black flex justify-center items-center gap-1 leading-none">
                      <Award className="w-5 h-5 text-cyan-500" />
                      <span>{activeSlug.level} / 50</span>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-300 p-3.5 rounded-xl text-center space-y-1 shadow-sm">
                    <div className="font-label-caps text-[10px] text-slate-500 font-black uppercase tracking-wider">HP</div>
                    <div className="font-stats-lg text-xl text-slate-800 font-black leading-none flex justify-center items-center gap-1">
                      <Heart className="w-5 h-5 text-red-500" />
                      <span>{activeSlug.hp}</span>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-300 p-3.5 rounded-xl text-center space-y-1 shadow-sm">
                    <div className="font-label-caps text-[10px] text-slate-500 font-black uppercase tracking-wider">ATTACK</div>
                    <div className="font-stats-lg text-xl text-slate-800 font-black leading-none flex justify-center items-center gap-1">
                      <Swords className="w-5 h-5 text-purple-500" />
                      <span>{activeSlug.attack}</span>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-300 p-3.5 rounded-xl text-center space-y-1 shadow-sm">
                    <div className="font-label-caps text-[10px] text-slate-500 font-black uppercase tracking-wider">W / L</div>
                    <div className="font-stats-lg text-xl text-slate-800 font-black flex justify-center items-center gap-1.5 leading-none">
                      <span className="text-emerald-600">{activeSlug.win_count}</span>
                      <span className="text-slate-400">/</span>
                      <span className="text-red-500">{activeSlug.loss_count}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Level Up Button */}
              <div className="border-t border-outline-variant/30 pt-4 space-y-3">
                {levelUpMessage && (
                  <div className={`p-3 rounded-xl border text-[10px] font-label-caps text-center animate-pulse ${
                    levelingStatus === "success" ? "bg-emerald-950/20 border-emerald-500/30 text-primary-container" :
                    levelingStatus === "error" ? "bg-red-950/20 border-red-500/30 text-red-400" : "bg-cyan-950/20 border-cyan-500/30 text-cyan-400"
                  }`}>
                    {levelUpMessage}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: activeSlug.level < 50 ? 1.02 : 1, filter: activeSlug.level < 50 ? "brightness(1.1)" : "brightness(1)" }}
                  whileTap={{ scale: activeSlug.level < 50 ? 0.98 : 1 }}
                  disabled={levelingStatus === "loading" || activeSlug.level >= 50}
                  onClick={handleLevelUp}
                  className="w-full bg-cyan-950/30 border border-cyan-500/50 hover:bg-cyan-500 hover:text-black font-label-caps text-label-caps font-black py-4 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex flex-col items-center justify-center leading-tight cursor-pointer"
                >
                  <span>
                    {levelingStatus === "loading" ? "SYNTHESIZING CORE..." : activeSlug.level >= 50 ? "MAX LEVEL 50 REACHED" : `LEVEL UP (HP +${(GROWTH_RATES[activeSlug.element]?.hp || 10) / 10}% | ATK +${(GROWTH_RATES[activeSlug.element]?.atk || 10) / 10}%)`}
                  </span>
                  {activeSlug.level < 50 && (
                    <span className="font-label-caps text-[9px] opacity-80 mt-1">
                      Cost: {activeSlug.level * 10} Dark Coins
                    </span>
                  )}
                </motion.button>
              </div>

              {/* Ascend (Burn) Button */}
              <div className="border-t border-red-500/20 pt-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    if (!activeSlug) return;
                    const tierCoins: Record<string, number> = { 'Very Good': 50, 'Good': 25, 'Decent': 5 };
                    const baseTier = BASE_STATS[activeSlug.element]?.tier || 'Decent';
                    const baseRefund = tierCoins[baseTier] || 5;
                    const totalSpent = Array.from({ length: activeSlug.level - 1 }, (_, i) => (i + 1) * 10).reduce((a, b) => a + b, 0);
                    const upgradeRefund = activeSlug.level > 2 ? Math.floor(totalSpent * 0.20) : 0;
                    const totalRefund = baseRefund + upgradeRefund;
                    if (confirm(`Ascend ${activeSlug.name}?\n\nThis will PERMANENTLY burn this slug.\n\nYou will receive ${totalRefund} Dark Coins:\n• Base (${baseTier}): ${baseRefund}\n${upgradeRefund > 0 ? `• 20% upgrade refund: ${upgradeRefund}` : '• No upgrade refund (level ≤ 2)'}`)) {
                      await ascendSlug(activeSlug.id);
                    }
                  }}
                  className="w-full bg-red-950/20 border border-red-500/30 hover:bg-red-600 hover:text-white font-label-caps text-[10px] font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-red-400"
                >
                  <span>🔥 ASCEND (BURN SLUG FOR COINS)</span>
                </motion.button>
              </div>

            </div>
          </section>
        )}

        {/* Right Column: Arsenal Grid */}
        <section className="lg:col-span-5 flex flex-col justify-between space-y-6">
          
          <div className="space-y-4 flex-grow">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
              <h3 className="font-label-caps text-xs text-primary-container font-black uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Canister Arsenal ({slugs.length})
              </h3>
              <span className="text-[9px] text-outline font-label-caps font-bold">SELECT TO SECURE CHAMBER</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
              {slugs.map((slug) => {
                const isActive = slug.id === activeSlugId;
                const el = ELEMENTS[slug.element];
                const stats = BASE_STATS[slug.element];

                return (
                  <motion.article
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={slug.id}
                    onClick={() => setActiveSlugId(slug.id)}
                    className={`p-4 rounded-xl border cursor-pointer bg-surface-container-high/40 backdrop-blur-sm transition-all flex items-center justify-between gap-3 group relative overflow-hidden ${
                      isActive
                        ? "border-primary-container shadow-[0_0_15px_rgba(56,189,248,0.15)] bg-surface-container-high/80"
                        : "border-outline-variant hover:border-on-surface-variant"
                    }`}
                  >
                    <div className="glass-reflection-layer"></div>
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="relative w-11 h-11 rounded-xl border overflow-hidden flex items-center justify-center transition-transform group-hover:scale-110 bg-[var(--bg-secondary)] border-[var(--surface-border)]">
                        <SlugModelThumbnail element={slug.element} />
                      </div>

                      <div className="flex flex-col">
                        <span className={`font-label-caps text-[8px] tracking-wider font-black ${
                          stats?.tier === "Very Good" ? "text-yellow-500" :
                          stats?.tier === "Good" ? "text-cyan-400" : "text-primary-container"
                        }`}>
                          {el?.name || "?"} • {stats?.tier?.toUpperCase() || "DECENT"}
                        </span>
                        <h4 className="font-headline-md text-xs font-bold text-on-surface mt-0.5 tracking-tight group-hover:text-primary-container transition-colors uppercase truncate max-w-[120px]">
                          {slug.name}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1 relative z-10">
                      <span className="font-label-caps text-[9px] bg-surface-container px-2 py-0.5 rounded border border-outline-variant">
                        LVL {slug.level}
                      </span>
                      <span className="text-[10px] text-primary-container font-black font-stats-lg">
                        HP:{slug.hp} ATK:{slug.attack}
                      </span>
                    </div>

                    {/* Sleep indicator */}
                    {slug.sleep_until_ms > Date.now() && (
                      <span className="absolute top-1.5 right-1.5 text-[8px] bg-blue-950/50 border border-blue-500/30 px-1 py-0.2 rounded font-label-caps font-bold text-blue-400 z-10">
                        💤
                      </span>
                    )}
                  </motion.article>
                );
              })}
            </div>
          </div>

        </section>

      </div>
    </div>
  );
};
