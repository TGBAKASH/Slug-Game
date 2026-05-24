import React, { useState, useEffect } from "react";
import { useGameState, ELEMENTS, RARITIES, getSlugImage } from "../context/GameState";
import { Shield, Flame, Droplets, Mountain, Wind, Skull, Zap, Coins, Award } from "lucide-react";
import { motion } from "framer-motion";

export const CommandCenter: React.FC = () => {
  const {
    slugs,
    activeSlugId,
    activeSlug,
    setActiveSlugId,
    levelUpSlug,
    regenerateEnergy,
    fusionEnergy,
    overdriveActive,
    walletMode,
    darkCoins,
    awakenSlug,
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
    
    const rarity = activeSlug.rarity || 1;
    let multiplier = 50;
    if (rarity === 2) multiplier = 100;
    if (rarity === 3) multiplier = 150;
    if (rarity === 4) multiplier = 250;

    const coinCost = multiplier;

    if (darkCoins < coinCost) {
      setLevelUpMessage(`Insufficient Coins! You need ${coinCost - darkCoins} more Coins. Beat bosses or duel other players.`);
      setLevelingStatus("error");
      setTimeout(() => setLevelUpMessage(null), 4000);
      return;
    }

    setLevelingStatus("loading");
    setLevelUpMessage("Synthesizing cavern energy and burning coins...");

    setTimeout(async () => {
      const success = await levelUpSlug();
      if (success) {
        setLevelUpMessage("LEVEL UP SUCCESSFUL! Power boosted by +5!");
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
      case 5: return <Skull className={`${className} text-purple-500`} />;
      default: return <Skull className={`${className} text-purple-400`} />;
    }
  };

  const renderElementBadge = (elementId: number) => {
    const el = ELEMENTS[elementId as keyof typeof ELEMENTS];
    if (!el) return null;

    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-caps text-[10px] text-on-surface">
        {getElementIcon(elementId, "w-3.5 h-3.5")}
        <span>{el.name}</span>
      </div>
    );
  };

  const getRarityGlowClass = (rarity: number) => {
    switch (rarity) {
      case 2: return "rarity-rare-glow border-cyan-500/50";
      case 3: return "rarity-epic-glow border-fuchsia-500/50";
      case 4: return "rarity-legendary-glow border-yellow-500/60";
      default: return "border-primary-container/40";
    }
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
            Your biological containment inventory is currently empty! Before entering laboratory upgrades or battle arenas, you must initialize your starting Protoforms inside the <strong>Incubator</strong> tab.
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
    <div className="space-y-8 relative z-10 py-2" data-tick={tick}>
      
      {/* Spacious Operational Hub Header */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-surface-container-low/40 backdrop-blur-md border border-outline-variant p-8 rounded-2xl relative overflow-hidden shadow-lg">
        <div className="absolute top-0 left-0 w-full h-[2px] energy-flow"></div>
        
        <div className="space-y-2">
          <h2 className="text-headline-lg font-headline-lg text-primary-container uppercase tracking-widest font-black leading-none">
            OPERATOR COMMAND HUD
          </h2>
          <p className="text-body-md text-on-surface-variant max-w-xl leading-relaxed">
            Sui Network Matrix: <span className={walletMode ? "text-primary-container font-black" : "text-amber-500 font-black"}>{walletMode ? "CONNECTED WALLET" : "LOCAL SIMULATOR"}</span>. Synthesize XP levels, review slug canisters, and prepare for wager arenas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-surface-container-lowest/80 border border-outline-variant rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center bg-surface-variant">
              <Zap className={`w-5 h-5 ${overdriveActive ? "text-yellow-400 animate-bounce" : "text-primary-container"}`} />
            </div>
            <div>
              <div className="font-label-caps text-[9px] text-outline font-bold">FUSION RESERVES</div>
              <div className="font-stats-lg text-stats-lg text-primary-container flex items-center gap-2 font-black">
                <span>{fusionEnergy}%</span>
                {overdriveActive && <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30 animate-pulse">FAST REGEN</span>}
              </div>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={regenerateEnergy}
            className="px-5 py-3 border-2 border-primary-container text-primary-container hover:bg-primary-container hover:text-on-primary-container font-label-caps text-label-caps rounded-xl transition-all text-xs font-black shadow-[0_0_15px_rgba(56,189,248,0.15)] cursor-pointer"
          >
            QUICK CHARGE FUEL
          </motion.button>
        </div>
      </header>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Glassmorphic Active Slug Chamber (7 Columns) */}
        <section className="lg:col-span-7 bg-surface-container-low border border-outline-variant p-8 rounded-2xl flex flex-col justify-between shadow-2xl min-h-[550px] relative overflow-hidden">
          {/* Futuristic grid background overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40"></div>
          <div className="absolute inset-0 scanline opacity-25 z-0 pointer-events-none"></div>

          {!activeSlug ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto space-y-4">
              <Shield className="w-16 h-16 text-amber-500 animate-bounce" />
              <h4 className="text-headline-md font-headline-md uppercase text-on-surface font-bold">No Active Core Locked</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Unlock a biological canister by choosing an active slug from your arsenal grid on the right.
              </p>
            </div>
          ) : (
            <div className="z-10 flex flex-col justify-between flex-grow space-y-6">
              
              {/* Header: Name, Title, and Rarity Badge */}
              <div className="flex justify-between items-start border-b border-outline-variant/30 pb-4">
                <div className="space-y-1">
                  <span className={`font-label-caps text-[9px] px-2.5 py-0.5 rounded border border-outline-variant bg-surface-container-lowest font-black tracking-wider ${
                    activeSlug.rarity === 4 ? "text-yellow-400" :
                    activeSlug.rarity === 3 ? "text-fuchsia-400" :
                    activeSlug.rarity === 2 ? "text-cyan-400" : "text-primary-container"
                  }`}>
                    {RARITIES[activeSlug.rarity as keyof typeof RARITIES]?.name || "COMMON"} GRADE
                  </span>
                  
                  <h3 className="text-headline-xl font-headline-xl text-on-surface font-black uppercase tracking-tight leading-none">
                    {activeSlug.name}
                  </h3>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  {activeSlug.is_ghouled ? (
                    <span className="font-label-caps text-[9px] bg-purple-950/30 text-purple-400 border border-purple-500/40 px-3 py-1 rounded-full flex items-center gap-1 font-bold shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                      😈 GHOUL SHADOWED
                    </span>
                  ) : (
                    <span className="font-label-caps text-[9px] bg-emerald-950/20 text-primary-container border border-primary-container/30 px-3 py-1 rounded-full flex items-center gap-1 font-bold">
                      🧬 PROTOFORM
                    </span>
                  )}
                  {renderElementBadge(activeSlug.element)}
                </div>
              </div>

              {/* Central Stasis Containment Visualizer */}
              <div className="aspect-[16/9] w-full bg-surface-container-lowest border border-outline-variant rounded-2xl relative overflow-hidden flex items-center justify-center shadow-inner">
                {/* Glow Ring based on Rarity */}
                <div className={`absolute w-48 h-48 rounded-full filter blur-3xl opacity-30 animate-pulse ${
                  activeSlug.rarity === 4 ? "bg-yellow-400 shadow-[0_0_60px_rgba(234,179,8,0.5)]" :
                  activeSlug.rarity === 3 ? "bg-fuchsia-500 shadow-[0_0_50px_rgba(217,70,239,0.4)]" :
                  activeSlug.rarity === 2 ? "bg-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.3)]" : "bg-emerald-500"
                }`} />

                {/* Tactical Diagnostics Reticle Spinning Frame */}
                <div className="absolute w-44 h-44 border border-dashed border-outline-variant/30 rounded-full reticle-spin pointer-events-none"></div>
                <div className="absolute w-40 h-40 border-2 border-double border-outline-variant/15 rounded-full reticle-spin duration-3000 rotate-45 pointer-events-none"></div>

                {/* Rotating structural background frame */}
                <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-700 bg-surface-container-low/50 backdrop-blur-sm relative overflow-hidden ${
                  activeSlug.is_ghouled ? "border-purple-500/50 bg-purple-950/10 shadow-[0_0_20px_rgba(168,85,247,0.25)]" : "border-primary-container/40 bg-emerald-950/10"
                } ${getRarityGlowClass(activeSlug.rarity)}`}>
                  {activeSlug.corruption >= 25 && <div className={`corruption-overlay corruption-overlay-${activeSlug.corruption >= 100 ? 100 : activeSlug.corruption >= 75 ? 75 : 50}`}></div>}
                  {/* Subtle Background Icon */}
                  <div className="absolute opacity-10 scale-125 rotate-12">
                    {getElementIcon(activeSlug.element, "w-16 h-16")}
                  </div>
                  
                  {/* Foreground High-Res Slug Artwork */}
                  <img 
                    src={getSlugImage(activeSlug.element, activeSlug.is_ghouled, activeSlug.fusionType)} 
                    alt={activeSlug.name} 
                    className="w-24 h-24 object-contain z-10 relative animate-pulse"
                  />
                </div>

                <div className="absolute top-4 left-4 font-label-caps text-[9px] text-outline flex items-center gap-1 font-bold">
                  <span className="w-2 h-2 rounded-full bg-primary-container animate-ping"></span>
                  <span>TACTICAL SCANNER ENGAGED // DETECTING GENES</span>
                </div>

                {/* Ultra-Premium Glassmorphic Stasis Recovery Overlay */}
                {activeSlug.recoveryUntil && activeSlug.recoveryUntil > Date.now() && (
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
                        Reactor Core is sleeping. Re-initializing biological components.
                      </p>
                      <div className="font-stats-lg text-lg text-cyan-400 font-black tracking-wider py-1 font-mono animate-pulse">
                        TIME REMAINING: {formatTime(activeSlug.recoveryUntil - Date.now())}
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        const rem = activeSlug.recoveryUntil ? activeSlug.recoveryUntil - Date.now() : 0;
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
                      <span>DISCHARGE STASIS ({Math.max(1, Math.ceil((activeSlug.recoveryUntil - Date.now()) / 60000)) * 5} COINS)</span>
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Progress Gauges: XP, Coins, Power */}
              <div className="space-y-4">
                {/* Progress Gauges removed for economy simplification */}

                {/* Info parameters: Level, Coins, Power stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-surface-container-lowest border border-outline-variant p-3.5 rounded-xl text-center space-y-1">
                    <div className="font-label-caps text-[9px] text-outline font-bold uppercase">LEVEL CAP</div>
                    <div className="font-stats-lg text-stats-lg text-cyan-400 font-black flex justify-center items-center gap-1 leading-none">
                      <Award className="w-4 h-4" />
                      <span>{activeSlug.level} / 100</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest border border-outline-variant p-3.5 rounded-xl text-center space-y-1">
                    <div className="font-label-caps text-[9px] text-outline font-bold uppercase">POWER STAT</div>
                    <div className="font-stats-lg text-stats-lg text-primary-container font-black leading-none">
                      {activeSlug.power}
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest border border-outline-variant p-3.5 rounded-xl text-center space-y-1">
                    <div className="font-label-caps text-[9px] text-outline font-bold uppercase">DARK COINS</div>
                    <div className="font-stats-lg text-stats-lg text-yellow-400 font-black flex justify-center items-center gap-1.5 leading-none">
                      <Coins className="w-4 h-4" />
                      <span>{darkCoins}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Level Up */}
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
                  whileHover={{ scale: activeSlug.level < 100 ? 1.02 : 1, filter: activeSlug.level < 100 ? "brightness(1.1)" : "brightness(1)" }}
                  whileTap={{ scale: activeSlug.level < 100 ? 0.98 : 1 }}
                  disabled={levelingStatus === "loading" || activeSlug.level >= 100}
                  onClick={handleLevelUp}
                  className="w-full bg-cyan-950/30 border border-cyan-500/50 hover:bg-cyan-500 hover:text-black font-label-caps text-label-caps font-black py-4 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex flex-col items-center justify-center leading-tight cursor-pointer"
                >
                  <span>
                    {levelingStatus === "loading" ? "SYNTHESIZING CORE..." : activeSlug.level >= 100 ? "MAX LEVEL 100 REACHED" : "LEVEL UP SLUG (+5 POWER)"}
                  </span>
                  {activeSlug.level < 100 && (
                    <span className="font-label-caps text-[9px] opacity-80 mt-1">
                      Cost: {activeSlug.rarity === 2 ? 100 : activeSlug.rarity === 3 ? 150 : activeSlug.rarity === 4 ? 250 : 50} Dark Coins
                    </span>
                  )}
                </motion.button>
              </div>

            </div>
          )}
        </section>

        {/* Right Column: Secondary Canister Grid Collection (5 Columns) */}
        <section className="lg:col-span-5 flex flex-col justify-between space-y-6">
          
          <div className="space-y-4 flex-grow">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
              <h3 className="font-label-caps text-xs text-primary-container font-black uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Canister Arsenal ({slugs.length})
              </h3>
              <span className="text-[9px] text-outline font-label-caps font-bold">SELECT TO SECURE CHAMBER</span>
            </div>

            {/* Grid display slots */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
              {slugs.map((slug) => {
                const r = RARITIES[slug.rarity as keyof typeof RARITIES] || RARITIES[1];
                const isActive = slug.id === activeSlugId;

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
                    {slug.corruption >= 25 && <div className={`corruption-overlay corruption-overlay-${slug.corruption >= 100 ? 100 : slug.corruption >= 75 ? 75 : 50}`}></div>}
                    <div className="flex items-center gap-3 relative z-10">
                      {/* Round element core visual */}
                      <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-transform group-hover:rotate-12 ${
                        slug.is_ghouled 
                          ? "border-purple-500 bg-purple-950/20 text-purple-400" 
                          : "border-primary-container/40 bg-emerald-950/20 text-primary-container"
                      }`}>
                        {getElementIcon(slug.element, "w-5 h-5")}
                      </div>

                      <div className="flex flex-col">
                        <span className={`font-label-caps text-[8px] tracking-wider font-black ${
                          slug.rarity === 4 ? "text-yellow-400" :
                          slug.rarity === 3 ? "text-fuchsia-400" :
                          slug.rarity === 2 ? "text-cyan-400" : "text-primary-container"
                        }`}>
                          {r.name}
                        </span>
                        <h4 className="font-headline-md text-xs font-bold text-on-surface mt-0.5 tracking-tight group-hover:text-primary-container transition-colors uppercase truncate max-w-[120px]">
                          {slug.name.replace("APEX PRIME ", "").replace("HYPER-ELITE ", "").replace("OVERCHARGED ", "")}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1 relative z-10">
                      <span className="font-label-caps text-[9px] bg-surface-container px-2 py-0.5 rounded border border-outline-variant">
                        LVL {slug.level}
                      </span>
                      <span className="text-[10px] text-primary-container font-black font-stats-lg">
                        P: {slug.power}
                      </span>
                    </div>

                    {/* Glitch Overlay Indicator */}
                    {slug.is_ghouled && (
                      <span className="absolute top-1.5 right-1.5 text-[8px] bg-purple-950/50 border border-purple-500/30 px-1 py-0.2 rounded font-label-caps font-bold text-purple-400 z-10">
                        😈
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
