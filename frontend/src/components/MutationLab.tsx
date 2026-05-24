import React, { useState } from "react";
import { useGameState, getSlugImage, ELEMENTS } from "../context/GameState";
import { soundManager } from "../context/SoundManager";
import { 
  ShieldAlert, 
  FlaskConical, 
  Flame, 
  Mountain, 
  Droplets, 
  Wind, 
  Skull, 
  AlertTriangle, 
  Activity, 
  Syringe, 
  Coins, 
  Dna 
} from "lucide-react";

export const MutationLab: React.FC = () => {
  const { 
    activeSlug, 
    buyDarkWaterAndUpgrade, 
    triggerFullGhoul, 
    darkCoins, 
    mutationCores,
    slugs
  } = useGameState();

  const [selectedSlugId, setSelectedSlugId] = useState<string>("");
  const [isMutating, setIsMutating] = useState(false);
  const [fluidBubbles, setFluidBubbles] = useState(false);
  const [labLog, setLabLog] = useState<string[]>([
    "Upgrades console online. Bio-metric scanning systems engaged.",
    "Dark Water containment chamber: LOCKED & SECURE."
  ]);

  const currentSlugId = selectedSlugId || activeSlug?.id || (slugs[0] ? slugs[0].id : "");
  const selectedSlug = slugs.find((s) => s.id === currentSlugId) || activeSlug || slugs[0];

  const handleInject = async () => {
    if (!selectedSlug) return;
    if (selectedSlug.recoveryUntil && selectedSlug.recoveryUntil > Date.now()) {
      setLabLog((prev) => ["MUTATION INJECTOR SHUTDOWN: Canister is currently sleeping / in stasis recovery. Awaken it inside the Canister Arsenal HUD before conducting mutations!", ...prev]);
      return;
    }
    if (selectedSlug.is_ghouled) {
      setLabLog((prev) => ["CORE STABILITY SECURED: Subject is already in permanent Ghoul stasis!", ...prev]);
      return;
    }

    setIsMutating(true);
    setFluidBubbles(true);
    soundManager.playBubble();
    
    setLabLog((prev) => [
      `[WALLET] Requesting signature: transfer 1.0 SUI to Mutator SmartEscrow...`,
      `Initiating Dark Water molecular injection for ${selectedSlug.name}...`,
      "Synthesizing high-frequency shadow essence catalyst...",
      ...prev
    ]);

    // Create a bubbling effect chain
    const interval = setInterval(() => {
      soundManager.playBubble();
    }, 300);

    setTimeout(() => {
      clearInterval(interval);
      setFluidBubbles(false);
    }, 1500);

    setTimeout(async () => {
      const result = await buyDarkWaterAndUpgrade(selectedSlug.id);
      setIsMutating(false);
      
      if (result.success) {
        setLabLog((prev) => [
          `INJECTION SUCCESSFUL: ${selectedSlug.name} core power restructured (+1 power, +2 maxHP).`,
          `Corruption level elevated to ${result.newCorruption}%!`,
          "Affinity cells adapting to Shadow essence matrices.",
          ...prev
        ]);
        soundManager.playLevelUp();
      } else {
        setLabLog((prev) => ["ERROR: Transaction failed or wallet buffer declined.", ...prev]);
      }
    }, 2000);
  };

  // Evolution Trigger
  const handleFullGhoulEvolution = async () => {
    if (!selectedSlug || selectedSlug.corruption < 100 || selectedSlug.is_ghouled) return;
    if (selectedSlug.recoveryUntil && selectedSlug.recoveryUntil > Date.now()) {
      setLabLog((prev) => ["EVOLUTION DEPLOYMENT LOCKED: Canister is sleeping in stasis recovery. Awaken it first!", ...prev]);
      return;
    }
    if (mutationCores < 1) {
      setLabLog((prev) => ["CRITICAL: Fully unlocking Ghoul requires 1 Mutation Core canister!", ...prev]);
      return;
    }

    setIsMutating(true);
    setFluidBubbles(true);
    soundManager.playWarning();

    setLabLog((prev) => [
      "⚠️ INITIATING TOTAL MOLECULAR OVERWRITE CONSOLE...",
      "Quantum containment shields expanding to maximum bounds...",
      "Injecting highly unstable bio-organic Mutation Core...",
      ...prev
    ]);

    const interval = setInterval(() => {
      soundManager.playBubble();
    }, 250);

    setTimeout(() => {
      clearInterval(interval);
      soundManager.playLaunch();
    }, 1800);

    setTimeout(async () => {
      const success = await triggerFullGhoul(selectedSlug.id);
      setIsMutating(false);
      setFluidBubbles(false);

      if (success) {
        setLabLog((prev) => [
          `🔥 METAMORPHOSIS COMPLETE! ${selectedSlug.name} has permanently mutated into a GHOUL WEAPON!`,
          "Element shifted to permanent SHADOW class.",
          "Power limiters fully unlocked (+5 baseline multiplier, +10 maxHP boost!).",
          ...prev
        ]);
        soundManager.playVictory();
      } else {
        setLabLog((prev) => ["ERROR: Metamorphosis sequence interrupted.", ...prev]);
      }
    }, 2500);
  };

  if (slugs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-zinc-950 border border-white/20 rounded-2xl text-center min-h-[400px] z-10 relative max-w-xl mx-auto space-y-4 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
        <ShieldAlert className="w-16 h-16 text-white/80 animate-bounce" />
        <h3 className="text-headline-md font-headline-md text-white uppercase font-black tracking-wider">
          No Slugs Detected
        </h3>
        <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
          Your containment tanks are currently empty! Please navigate to the <strong>Incubator</strong> to mint your first slug and unlock the Mutation Laboratory.
        </p>
      </div>
    );
  }

  if (!selectedSlug) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-zinc-950 border border-white/20 rounded-2xl text-center min-h-[400px] z-10 relative max-w-xl mx-auto space-y-4 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
        <ShieldAlert className="w-16 h-16 text-white/80 animate-bounce" />
        <h3 className="text-headline-md font-headline-md text-white uppercase font-black tracking-wider">
          Chamber Lock Required
        </h3>
        <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
          You must lock a Protoform Slug into the CommandCenter (Dashboard) profile slot before entering the Mutation Laboratory!
        </p>
      </div>
    );
  }

  const getElementIcon = (elementId: number, className: string = "w-10 h-10") => {
    switch (elementId) {
      case 1: return <Flame className={`${className} text-red-500`} />;
      case 2: return <Droplets className={`${className} text-cyan-400`} />;
      case 3: return <Mountain className={`${className} text-emerald-500`} />;
      case 4: return <Wind className={`${className} text-teal-300`} />;
      default: return <Skull className={`${className} text-purple-400`} />;
    }
  };

  // Dynamically calculate risk profile
  const getInstabilityStats = (corr: number) => {
    if (corr >= 100) return { risk: "MAXIMUM (FULL GHOUL READY)", damage: "30 HP", color: "text-purple-400", level: "UNSTABLE OVERRUN" };
    if (corr >= 80) return { risk: "CRITICAL (65% HAZARD)", damage: "25 HP", color: "text-red-500 animate-pulse", level: "CRITICALLY UNSTABLE" };
    if (corr >= 50) return { risk: "VOLATILE (30% HAZARD)", damage: "15 HP", color: "text-yellow-500", level: "VOLATILE BURST" };
    if (corr >= 20) return { risk: "ACTIVE (10% HAZARD)", damage: "5 HP", color: "text-cyan-400", level: "ACTIVE MATRIX" };
    return { risk: "0% STABLE", damage: "0 HP", color: "text-zinc-500", level: "STABLE PROTOFORM" };
  };

  const currentRisk = getInstabilityStats(selectedSlug.corruption);
  const liquidHeight = `${Math.max(20, selectedSlug.corruption)}%`;

  return (
    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
      
      {/* Visual Containment Chamber (7 columns) */}
      <section className="lg:col-span-7 bg-zinc-950 border border-white/20 p-8 rounded-2xl flex flex-col items-center justify-between relative shadow-[0_0_50px_rgba(255,255,255,0.05)] min-h-[520px]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40"></div>
        <div className="absolute inset-0 scanline opacity-5 pointer-events-none"></div>

        {/* Header Indicator */}
        <h3 className="font-label-caps text-xs text-white/90 font-bold uppercase tracking-wider w-full border-b border-white/10 pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2 font-mono">
            <FlaskConical className="w-5 h-5 text-white animate-pulse" /> 
            CONTAINMENT VAT MATRIX
          </span>
          <span className="text-[10px] text-white font-black bg-zinc-900 px-2.5 py-0.5 rounded border border-white/10 font-mono">
            MUTATION LVL: {selectedSlug.corruption}%
          </span>
        </h3>

        {/* Bubbling Stasis Cylinder Vat */}
        <div className={`relative w-full max-w-sm h-80 my-6 bg-zinc-900 border-4 rounded-3xl overflow-hidden shadow-[0_0_35px_rgba(255,255,255,0.05)] flex flex-col items-center justify-center transition-all duration-300 ${
          selectedSlug.is_ghouled 
            ? "border-purple-500 shadow-[0_0_35px_rgba(168,85,247,0.45)]" 
            : selectedSlug.corruption >= 80 
              ? "border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse"
              : selectedSlug.corruption >= 50
                ? "border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                : "border-white/20"
        }`}>
          {/* Glass glare effect overlays */}
          <div className="absolute top-0 bottom-0 left-4 w-4 bg-white/5 pointer-events-none z-30"></div>
          <div className="absolute top-0 bottom-0 right-4 w-1 bg-white/2 pointer-events-none z-30"></div>
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-30"></div>

          {/* Liquid level layer shifting dynamically based on corruption */}
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t transition-all duration-1000 z-0 ${
              selectedSlug.is_ghouled ? "from-purple-950/40 via-purple-900/30 to-purple-800/10" :
              selectedSlug.corruption >= 80 ? "from-red-950/40 via-red-900/25 to-red-800/10" :
              selectedSlug.corruption >= 50 ? "from-yellow-950/30 via-yellow-900/20 to-yellow-800/10" :
              "from-zinc-950/40 via-zinc-900/20 to-transparent"
            }`}
            style={{ height: liquidHeight }}
          ></div>

          {/* Bubbles particle layers */}
          <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
            <div className={`bubble-element absolute bottom-[-10px] left-[15%] w-3 h-3 bg-purple-500/30 rounded-full ${isMutating || fluidBubbles ? "animate-ping" : "animate-bounce"}`} style={{ animationDuration: "1.2s", animationDelay: "0.1s" }}></div>
            <div className={`bubble-element absolute bottom-[-10px] left-[35%] w-2 h-2 bg-purple-500/50 rounded-full ${isMutating || fluidBubbles ? "animate-ping" : "animate-bounce"}`} style={{ animationDuration: "1.8s", animationDelay: "0.4s" }}></div>
            <div className={`bubble-element absolute bottom-[-10px] left-[55%] w-4 h-4 bg-purple-500/25 rounded-full ${isMutating || fluidBubbles ? "animate-ping" : "animate-bounce"}`} style={{ animationDuration: "2.2s", animationDelay: "0.2s" }}></div>
            <div className={`bubble-element absolute bottom-[-10px] left-[75%] w-2.5 h-2.5 bg-purple-500/40 rounded-full ${isMutating || fluidBubbles ? "animate-ping" : "animate-bounce"}`} style={{ animationDuration: "1.5s", animationDelay: "0.6s" }}></div>
            <div className={`bubble-element absolute bottom-[-10px] left-[90%] w-1.5 h-1.5 bg-purple-500/60 rounded-full ${isMutating || fluidBubbles ? "animate-ping" : "animate-bounce"}`} style={{ animationDuration: "1.0s", animationDelay: "0.3s" }}></div>
          </div>

          {/* Floating core containment slot */}
          <div className="z-20 flex flex-col items-center justify-center space-y-4">
            <div className={`transition-all duration-700 ${isMutating ? "scale-110 rotate-12 filter brightness-125" : ""}`}>
              <div className={`w-36 h-36 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all duration-500 bg-zinc-950/90 relative overflow-hidden ${
                selectedSlug.is_ghouled
                  ? "border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.5)] text-purple-400 animate-pulse"
                  : selectedSlug.corruption >= 80
                    ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] text-red-500 animate-pulse"
                    : selectedSlug.corruption >= 50
                      ? "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] text-yellow-500"
                      : "border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)] text-white"
              }`}>
                {/* Background Element Glow Icon */}
                <div className="absolute opacity-10 scale-150">
                  {getElementIcon(selectedSlug.element, "w-20 h-20")}
                </div>
                
                {/* Foreground High-Res Slug Artwork */}
                <img 
                  src={getSlugImage(selectedSlug.element, selectedSlug.is_ghouled, selectedSlug.fusionType)} 
                  alt={selectedSlug.name} 
                  className={`w-28 h-28 object-contain z-10 relative transition-transform duration-700 ${isMutating ? "animate-bounce" : "animate-pulse"}`}
                />
              </div>
            </div>

            {/* Cylinder HUD Stats overlay */}
            <div className="text-center px-4">
              <span className="block font-label-caps text-[9px] text-white/50 font-bold tracking-widest uppercase font-mono">
                {selectedSlug.is_ghouled ? "SHADOW GHOUL MODULE" : "CONTAINMENT CELL SPECS"}
              </span>
              <h4 className="font-headline-md text-stats-lg text-white uppercase font-black tracking-tight mt-1 truncate max-w-[280px]">
                {selectedSlug.name.replace("DARK GHOUL ", "").replace("APEX PRIME ", "").replace("HYPER-ELITE ", "").replace("OVERCHARGED ", "")}
              </h4>
            </div>
          </div>

          {/* Digital Grid Scan Line */}
          <div className="absolute top-0 bottom-0 left-0 right-0 border-y border-white/5 z-20 pointer-events-none opacity-50 bg-[linear-gradient(transparent_50%,rgba(255,255,255,0.02)_50%)] bg-[size:100%_4px]"></div>
        </div>

        <p className="font-label-caps text-[10px] text-zinc-400 text-center leading-normal max-w-sm font-mono">
          {selectedSlug.is_ghouled 
            ? "✨ GHOUL CONTAINMENT ACTIVE. Subject locked in stable dark water stasis." 
            : selectedSlug.corruption >= 100
              ? "⚡ DANGER: 100% CORRUPTION. Subject is primed for total Ghoul Evolution!"
              : "⚛️ Standard Dark Water injections can be fired into this cell below."}
        </p>
      </section>

      {/* Control Vat Panel (5 columns) */}
      <section className="lg:col-span-5 bg-zinc-950 border border-white/20 p-6 rounded-2xl flex flex-col justify-between shadow-[0_0_50px_rgba(255,255,255,0.05)] relative">
        
        <div className="space-y-5">
          {/* Header */}
          <div className="space-y-1.5 border-b border-white/10 pb-4 flex justify-between items-start">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-white font-black uppercase tracking-tight leading-none mb-1 font-mono">
                DARK WATER VAT
              </h2>
              <span className="block font-label-caps text-[9px] text-white/50 tracking-wider font-bold font-mono">
                BIOMECHANICAL MUTATOR CONSOLE
              </span>
            </div>

            <div className="flex gap-2 items-center bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-mono">
              <Coins className="w-4 h-4 text-white" />
              <span className="text-white font-black">{darkCoins}</span>
            </div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed font-mono">
            Inject volatile dark water components to override genetic limiters. Mutated subjects break elemental constraints but carry stability risks.
          </p>

          {/* ================= Target Slug Selector Dropdown ================= */}
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 space-y-2 shadow-inner">
            <label className="block font-label-caps text-[9px] text-white/60 font-bold tracking-widest uppercase font-mono">
              SELECT TARGET FOR INJECTION
            </label>
            <div className="relative">
              <select
                value={currentSlugId}
                onChange={(e) => {
                  setSelectedSlugId(e.target.value);
                  const sl = slugs.find(s => s.id === e.target.value);
                  if (sl) {
                    setLabLog((prev) => [
                      `Target locked: ${sl.name} aligned to pneumatic tubes.`,
                      ...prev
                    ]);
                    soundManager.playBubble();
                  }
                }}
                className="w-full bg-zinc-950 text-white border-2 border-white/10 rounded-xl px-4 py-3 text-xs font-bold font-mono focus:outline-none focus:border-white/40 tracking-wider appearance-none cursor-pointer hover:border-white/20 transition-all"
              >
                {slugs.map((s) => (
                  <option key={s.id} value={s.id} className="bg-zinc-950 text-white font-mono">
                    {s.name} (LVL {s.level} | {s.is_ghouled ? "GHOUL" : ELEMENTS[s.element as keyof typeof ELEMENTS]?.name || "NORMAL"})
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/60 font-bold text-[9px] font-mono">
                ▼
              </div>
            </div>
          </div>

          {/* ================= LAB MANUAL: HOW TO MUTATE ================= */}
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-4.5 space-y-3.5 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-white"></div>
            
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Dna className="w-4 h-4 text-white animate-pulse" />
              <h4 className="font-label-caps text-xs text-white font-black uppercase tracking-wider font-mono">
                MUTATOR GUIDELINES
              </h4>
            </div>
            
            <div className="space-y-3 text-[11px] leading-relaxed text-zinc-400 font-mono">
              {/* Step 1 */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center bg-zinc-950 text-white font-bold text-[9px] flex-shrink-0 mt-0.5 font-mono shadow-[0_0_8px_rgba(255,255,255,0.05)]">
                  1
                </div>
                <div className="space-y-0.5">
                  <h5 className="font-label-caps font-bold text-[9px] text-white uppercase leading-none">
                    Pneumatic Injection
                  </h5>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Inject Dark Water (1.0 SUI fee) to boost Power (+1) and HP (+2). Corruption rises by +12% to +26%. Rarity remains fixed.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center bg-zinc-950 text-white font-bold text-[9px] flex-shrink-0 mt-0.5 font-mono shadow-[0_0_8px_rgba(255,255,255,0.05)]">
                  2
                </div>
                <div className="space-y-0.5">
                  <h5 className="font-label-caps font-bold text-[9px] text-white uppercase leading-none">
                    Instability Warning
                  </h5>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Over 50% Corruption shifts the cell to volatile status. High corruption risks combat glitches (self-damage or temporary performance loss).
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center bg-zinc-950 text-white font-bold text-[9px] flex-shrink-0 mt-0.5 font-mono shadow-[0_0_8px_rgba(255,255,255,0.05)]">
                  3
                </div>
                <div className="space-y-0.5">
                  <h5 className="font-label-caps font-bold text-[9px] text-white uppercase leading-none">
                    Ghoul Metamorphosis
                  </h5>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    At 100% Corruption, inject 1 Mutation Core to permanently trigger Ghoul status, shifting element to SHADOW and unlocking stats (+5 Power, +10 HP).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Instability Telemetry Ledger */}
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-4.5 space-y-3 font-mono">
            <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
              <span className="font-label-caps text-zinc-400 font-bold flex items-center gap-1 font-mono">
                <Activity className="w-3.5 h-3.5 text-white" />
                STATUS PROFILE
              </span>
              <span className={`font-stats-lg font-bold font-label-caps ${currentRisk.color}`}>
                {currentRisk.level}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
              <span className="font-label-caps text-zinc-400 font-bold font-mono">ACTIVE HAZARD</span>
              <span className={`font-stats-lg font-bold font-label-caps ${currentRisk.color}`}>
                {currentRisk.risk}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
              <span className="font-label-caps text-zinc-400 font-bold flex items-center gap-1 font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                COMBAT BACKFIRE
              </span>
              <span className="font-stats-lg text-red-400 font-black">
                {currentRisk.damage} (self-dmg)
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="font-label-caps text-zinc-400 font-bold flex items-center gap-1 font-mono">
                <Dna className="w-3.5 h-3.5 text-white animate-pulse" />
                MUTATION CORES
              </span>
              <span className="font-stats-lg text-white font-black">
                {mutationCores} Canister
              </span>
            </div>
          </div>
        </div>

        {/* Buttons / Actions interface */}
        <div className="space-y-4 mt-6">
          {selectedSlug.corruption >= 100 && !selectedSlug.is_ghouled ? (
            /* Ghoul Evolution Button */
            <button
              onClick={handleFullGhoulEvolution}
              disabled={isMutating}
              className="w-full relative group transition-all duration-300 py-4 rounded-xl border-2 border-white bg-zinc-900 hover:bg-white hover:text-black text-white font-label-caps text-label-caps font-black flex flex-col items-center justify-center cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)] animate-bounce font-mono"
            >
              <span className="flex items-center gap-1.5 tracking-wider">
                <Syringe className="w-5 h-5 animate-pulse" />
                TRIGGER FULL GHOUL EVOLUTION
              </span>
              <span className="font-label-caps text-[9px] opacity-80 mt-1 font-mono">Requires: 1 Mutation Core (Own: {mutationCores})</span>
            </button>
          ) : (
            /* Standard Vials Injector */
            <button
              disabled={isMutating || selectedSlug.is_ghouled}
              onClick={handleInject}
              className={`w-full relative group transition-all duration-300 py-4 rounded-xl border-2 overflow-hidden active:scale-98 flex flex-col items-center justify-center cursor-pointer font-mono ${
                selectedSlug.is_ghouled
                  ? "bg-zinc-900 border-white/10 text-zinc-500 cursor-not-allowed"
                  : "bg-zinc-900 border-white/20 hover:bg-white hover:text-black text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]"
              }`}
            >
              <span className="font-label-caps text-label-caps font-black leading-none tracking-wide flex items-center gap-1.5">
                <Syringe className="w-4 h-4" />
                {isMutating 
                  ? "SYNTHESIZING CONCENTRATION..." 
                  : selectedSlug.is_ghouled 
                    ? "SHADOW INTEGRITY CODES SECURED" 
                    : "INJECT CONCENTRATED DARK WATER"}
              </span>
              {!selectedSlug.is_ghouled && (
                <span className="font-label-caps text-[9px] opacity-80 mt-1">Cost: 1.0 SUI (Sui Testnet)</span>
              )}
            </button>
          )}

          {/* Vat Telemetry Logs terminal */}
          <div className="border-t border-white/10 pt-4 space-y-2">
            <span className="block font-label-caps text-[9px] text-white/50 font-bold font-mono">CYBERNETIC STASIS CONSOLE OUTPUT</span>
            <div className="bg-zinc-950 border border-white/10 p-3 rounded-xl h-28 overflow-y-auto font-mono text-[9px] text-white/80 space-y-1.5 custom-scrollbar">
              {labLog.map((log, idx) => (
                <div key={idx} className="flex gap-1 items-start leading-normal">
                  <span className="text-white/40">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>
    </div>
  );
};
