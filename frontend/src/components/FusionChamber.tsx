import React, { useState } from "react";
import { useGameState, ELEMENTS, getSlugImage } from "../context/GameState";
import type { Slug } from "../context/GameState";
import { Layers, Flame, Droplets, Mountain, Wind, Sparkles, Zap, ShieldAlert, Award } from "lucide-react";

export const FusionChamber: React.FC = () => {
  const { slugs, fusionShards, fuseSlugs } = useGameState();

  const [id1, setId1] = useState<string>("");
  const [id2, setId2] = useState<string>("");
  const [isFusing, setIsFusing] = useState(false);
  const [fusedResult, setFusedResult] = useState<Slug | null>(null);

  // Eligible slugs (not already fused and not in stasis sleep recovery)
  const eligibleSlugs = slugs.filter((s) => !s.isFused && !(s.recoveryUntil && s.recoveryUntil > Date.now()));
  const s1 = slugs.find((s) => s.id === id1);
  const s2 = slugs.find((s) => s.id === id2);

  // Filter second slug to ensure different elements
  const secondEligibleSlugs = eligibleSlugs.filter((s) => s.id !== id1 && (!s1 || s.element !== s1.element));

  const getElementIcon = (elemId: number, className: string = "w-4 h-4") => {
    switch (elemId) {
      case 1: return <Flame className={`${className} text-red-500`} />;
      case 2: return <Droplets className={`${className} text-cyan-400`} />;
      case 3: return <Mountain className={`${className} text-emerald-500`} />;
      case 4: return <Wind className={`${className} text-teal-300`} />;
      case 5: return <Sparkles className={`${className} text-purple-400`} />;
      default: return <Sparkles className={`${className} text-outline`} />;
    }
  };

  const getFusionOutcome = () => {
    if (!s1 || !s2) return null;
    const e1 = Math.min(s1.element, s2.element);
    const e2 = Math.max(s1.element, s2.element);
    
    let classType = "Elemental Alloy";
    let desc = "A basic molecular metallic elemental compound.";
    
    if (e1 === 1 && e2 === 4) {
      classType = "Plasma Storm";
      desc = "Aggressive lightning chain attacks. Speeds are hypercharged, granting rapid critical damage spikes.";
    } else if (e1 === 1 && e2 === 2) {
      classType = "Steam Phantom";
      desc = "Tactical hybrid visibility core. Combines gaseous dashes with visual evasion and critical steam bursts.";
    } else if (e1 === 1 && e2 === 3) {
      classType = "Magma Titan";
      desc = "Ultimate thermal shield core. Ignites lava cracks on impact, burning target while blocking heavy strikes.";
    } else if (e1 === 2 && e2 === 4) {
      classType = "Frost Vortex";
      desc = "Glacial locking vortex. Freezes targets permanently, granting massive shield absorption metrics.";
    } else if (e1 === 2 && e2 === 3) {
      classType = "Toxic Mud";
      desc = "Corrosive muddy sludge core. Poison puddles rot and melt enemy defense parameters continuously.";
    } else if (e1 === 3 && e2 === 4) {
      classType = "Sand Tempest";
      desc = "Blinding abrasive sandstorm. Creates wind hazards, decreasing target speed and accuracy parameters.";
    } else if (e1 === 1 && e2 === 5) {
      classType = "Inferno Ghoul";
      desc = "Unstable dark chaotic pyre. Enters berserk mode, multiplying critical explosion outputs at high speeds.";
    } else if (e1 === 2 && e2 === 5) {
      classType = "Abyss Tide";
      desc = "Dark vortex suction wave. Absorbs target barrier reserves and converts it to pure core HP.";
    } else if (e1 === 4 && e2 === 5) {
      classType = "Void Storm";
      desc = "Dimensional slash teleport. Hyper speed movements that bypass enemy block defenses instantly.";
    } else if (e1 === 3 && e2 === 5) {
      classType = "Necro Core";
      desc = "Shadow structural armor. Passive resurrection matrix triggers auto-revival at 1 HP when defeated.";
    }

    return { classType, desc };
  };

  const outcome = getFusionOutcome();
  const shardsCost = 30;
  const isCompatible = s1 && s2 && s1.element !== s2.element && fusionShards >= shardsCost;

  const handleFuse = async () => {
    if (!isCompatible || !s1 || !s2) return;

    setIsFusing(true);
    setFusedResult(null);

    // Cinematic Laboratory delay
    setTimeout(async () => {
      const result = await fuseSlugs(s1.id, s2.id);
      if (result) {
        setFusedResult(result);
        setId1("");
        setId2("");
      } else {
        alert("FUSION FAILED: Incompatible elements, insufficient shards, or one slug is already fused. Check your slug selection and try again.");
      }
      setIsFusing(false);
    }, 2800);
  };

  if (slugs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface-container-low border border-outline-variant rounded-2xl text-center min-h-[400px] z-10 relative max-w-xl mx-auto space-y-4 soft-glow-card my-10">
        <ShieldAlert className="w-16 h-16 text-amber-500 animate-bounce" />
        <h3 className="text-headline-md font-headline-md text-on-surface uppercase font-black">
          No Slugs Detected
        </h3>
        <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
          Your biological containment tanks are currently empty! Please navigate to the <strong>Incubator</strong> to mint your first slug and unlock the Molecular Fusion Chamber.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 relative z-10 py-4 max-w-6xl mx-auto">
      {/* Page Header */}
      <header className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-950/20 border border-purple-500/30 rounded-full font-label-caps text-xs text-purple-400">
          <Layers className="w-3.5 h-3.5 animate-pulse" />
          <span>Cobalt Elemental Fusion Reactor</span>
        </div>
        <h2 className="text-headline-xl font-headline-xl font-black uppercase tracking-tight text-on-background">
          Molecular Fusion Chamber
        </h2>
        <p className="text-body-md text-on-surface-variant leading-relaxed">
          Forge advanced biological hybrid classes. Select two canisters of different element profiles and combine their genomes to materialize an elite fused super-slug.
        </p>
      </header>

      {/* Main split dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left columns: Select Canisters & preview specs (8 Columns) */}
        <section className="lg:col-span-8 space-y-6">
          <div className="bg-surface-container-low border border-outline-variant p-6 rounded-2xl shadow-xl space-y-8">
            <h3 className="font-label-caps text-xs text-purple-400 font-bold uppercase tracking-wider text-center border-b border-outline-variant/30 pb-3">
              Containment Loading Bays
            </h3>

            {/* Twin Selector Canisters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Load Canister 1 */}
              <div className="space-y-3">
                <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                  CANISTER CORE-A (Base Element)
                </label>
                <select
                  value={id1}
                  onChange={(e) => { setId1(e.target.value); setId2(""); }}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-body-md text-on-surface font-label-caps focus:outline-none focus:border-purple-500 transition-all cursor-pointer"
                >
                  <option value="">-- UNLOADED --</option>
                  {eligibleSlugs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (LV.{s.level} {ELEMENTS[s.element as keyof typeof ELEMENTS]?.name})
                    </option>
                  ))}
                </select>

                {s1 ? (
                  <div className="p-4 bg-surface-container-lowest border border-outline-variant/50 rounded-xl space-y-3 relative overflow-hidden flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border border-purple-500/30 flex items-center justify-center bg-surface-container-low overflow-hidden relative flex-shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                      <img src={getSlugImage(s1.element, s1.is_ghouled, s1.fusionType)} alt={s1.name} className="w-12 h-12 object-contain relative z-10" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-center border-b border-outline-variant/20 pb-1.5 mb-1.5">
                        <span className="font-headline-md text-xs font-bold text-on-surface uppercase truncate max-w-[120px]">{s1.name}</span>
                        {getElementIcon(s1.element, "w-4 h-4")}
                      </div>
                      <div className="font-label-caps text-[9px] text-outline grid grid-cols-2 gap-x-2">
                        <div>POWER: <span className="text-primary-container font-bold">{s1.power}</span></div>
                        <div>DEFENSE: <span>{s1.defense}</span></div>
                        <div>HP: <span>{s1.maxHp}</span></div>
                        <div>SPEED: <span>{s1.speed}</span></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-surface-container-lowest/50 border border-dashed border-outline-variant/40 rounded-xl text-center font-label-caps text-[9px] text-outline">
                    AWAITING CANISTER CORE-A INSERTION
                  </div>
                )}
              </div>

              {/* Load Canister 2 */}
              <div className="space-y-3">
                <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                  CANISTER CORE-B (Catalyst Element)
                </label>
                <select
                  value={id2}
                  disabled={!id1}
                  onChange={(e) => setId2(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-body-md text-on-surface font-label-caps focus:outline-none focus:border-purple-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- UNLOADED --</option>
                  {secondEligibleSlugs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (LV.{s.level} {ELEMENTS[s.element as keyof typeof ELEMENTS]?.name})
                    </option>
                  ))}
                </select>

                {s2 ? (
                  <div className="p-4 bg-surface-container-lowest border border-outline-variant/50 rounded-xl space-y-3 relative overflow-hidden flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border border-purple-500/30 flex items-center justify-center bg-surface-container-low overflow-hidden relative flex-shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                      <img src={getSlugImage(s2.element, s2.is_ghouled, s2.fusionType)} alt={s2.name} className="w-12 h-12 object-contain relative z-10" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-center border-b border-outline-variant/20 pb-1.5 mb-1.5">
                        <span className="font-headline-md text-xs font-bold text-on-surface uppercase truncate max-w-[120px]">{s2.name}</span>
                        {getElementIcon(s2.element, "w-4 h-4")}
                      </div>
                      <div className="font-label-caps text-[9px] text-outline grid grid-cols-2 gap-x-2">
                        <div>POWER: <span className="text-primary-container font-bold">{s2.power}</span></div>
                        <div>DEFENSE: <span>{s2.defense}</span></div>
                        <div>HP: <span>{s2.maxHp}</span></div>
                        <div>SPEED: <span>{s2.speed}</span></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-surface-container-lowest/50 border border-dashed border-outline-variant/40 rounded-xl text-center font-label-caps text-[9px] text-outline">
                    AWAITING CANISTER CORE-B INSERTION
                  </div>
                )}
              </div>
            </div>

            {/* Projected Hybrid Outcome Canister */}
            {outcome && s1 && s2 && (
              <div className="bg-purple-950/10 border-2 border-purple-500/30 p-6 rounded-2xl relative overflow-hidden shadow-2xl animate-fade-in flex flex-col md:flex-row gap-6 items-center">
                <div className="scanline opacity-20 z-0"></div>
                
                {/* High-res Image Preview */}
                <div className="w-28 h-28 rounded-2xl bg-surface-container-lowest/90 border border-purple-500/30 flex items-center justify-center relative overflow-hidden flex-shrink-0 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                  <div className="absolute inset-0 border-2 border-double border-purple-500/25 rounded-2xl animate-pulse"></div>
                  <img 
                    src={getSlugImage(s1.element === 5 || s2.element === 5 ? 5 : s1.element, s1.is_ghouled || s2.is_ghouled, outcome.classType)} 
                    alt={outcome.classType} 
                    className="w-20 h-20 object-contain z-10 relative animate-bounce" 
                    style={{ animationDuration: '4s' }}
                  />
                </div>

                <div className="relative z-10 space-y-4 flex-grow">
                  <div className="flex items-center gap-2 text-purple-400 font-label-caps text-xs font-bold uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
                    <span>Projected Fusion Hybrid</span>
                  </div>
                  <div>
                    <h4 className="text-headline-lg font-headline-lg font-black text-purple-300 uppercase leading-none tracking-tight">
                      {outcome.classType}
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-2 leading-relaxed font-body-md max-w-xl">
                      {outcome.desc}
                    </p>
                  </div>

                  {/* Calculated Stat gains preview */}
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="bg-surface-container-lowest p-3 border border-outline-variant rounded-xl text-center">
                      <div className="font-label-caps text-[8px] text-on-surface-variant">HYBRID POWER</div>
                      <div className="font-stats-lg text-stats-lg text-purple-400 font-black">
                        {Math.floor(Math.max(s1.power, s2.power) * 0.8) + 5}
                      </div>
                    </div>
                    <div className="bg-surface-container-lowest p-3 border border-outline-variant rounded-xl text-center">
                      <div className="font-label-caps text-[8px] text-on-surface-variant">HYBRID DEFENSE</div>
                      <div className="font-stats-lg text-stats-lg text-cyan-400 font-black">
                        {Math.max(s1.defense, s2.defense) + 8}
                      </div>
                    </div>
                    <div className="bg-surface-container-lowest p-3 border border-outline-variant rounded-xl text-center">
                      <div className="font-label-caps text-[8px] text-on-surface-variant">HYBRID SPEED</div>
                      <div className="font-stats-lg text-stats-lg text-teal-300 font-black">
                        {Math.max(s1.speed, s2.speed) + 8}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right column: Costs & Reactor activations (4 Columns) */}
        <section className="lg:col-span-4">
          <div className="bg-surface-container-low border border-outline-variant p-6 rounded-2xl shadow-xl flex flex-col justify-between min-h-[380px] relative overflow-hidden group">
            <div className="scanline z-0 opacity-10"></div>
            
            <div className="relative z-10 space-y-6">
              <h3 className="font-label-caps text-xs text-purple-400 font-bold uppercase tracking-wider text-center border-b border-outline-variant/30 pb-3">
                Reactor Diagnostics
              </h3>

              {/* Resource requirement check */}
              <div className="space-y-4">
                <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl space-y-3 font-label-caps text-xs">
                  <div className="flex justify-between items-center text-outline">
                    <span>FUSION SHARDS HELD:</span>
                    <span className="font-bold text-on-surface">{fusionShards}</span>
                  </div>
                  <div className="flex justify-between items-center text-outline">
                    <span>SHARDS REQUIRED:</span>
                    <span className="font-bold text-purple-400">{shardsCost}</span>
                  </div>
                </div>

                {s1 && s2 && s1.element === s2.element && (
                  <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-[10px] font-label-caps text-red-400">
                    <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                    <span>Incompatible elements. Core element A and core element B must represent different elemental profiles.</span>
                  </div>
                )}

                {fusionShards < shardsCost && (
                  <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-[10px] font-label-caps text-amber-400">
                    <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                    <span>Insufficient Shards. Battle cavern boss nodes to collect necessary Fusion Shards.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative z-10 pt-6 mt-auto">
              <button
                disabled={!isCompatible || isFusing}
                onClick={handleFuse}
                className={`w-full py-4 font-label-caps font-black text-label-caps tracking-wider rounded-xl transition-all shadow-lg select-none cursor-pointer flex justify-center items-center gap-2 ${
                  isCompatible && !isFusing
                    ? "bg-purple-600 hover:bg-purple-500 text-white border border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-98"
                    : "bg-surface-container-highest border border-outline-variant text-outline cursor-not-allowed opacity-60"
                }`}
              >
                <Layers className="w-4 h-4 animate-spin-slow" />
                <span>IGNITE FUSION CORE</span>
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* ================= CYBER FUSION PROCESS OVERLAY ================= */}
      {isFusing && s1 && s2 && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="max-w-md w-full text-center space-y-8">
            <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
              {/* Double containment rotating rings */}
              <div className="absolute inset-0 border-4 border-double border-purple-500 rounded-full animate-spin duration-3000"></div>
              <div className="absolute inset-4 border-2 border-dashed border-cyan-400 rounded-full animate-spin duration-1500 rotate-90"></div>
              <div className="absolute inset-8 border border-dotted border-yellow-400 rounded-full animate-spin duration-1000 rotate-180"></div>
              
              {/* Dual element sparks jumping */}
              <div className="absolute top-2 w-8 h-8 rounded-full border-2 border-red-500 bg-red-950/40 flex items-center justify-center animate-ping">
                {getElementIcon(s1.element, "w-4 h-4")}
              </div>
              <div className="absolute bottom-2 w-8 h-8 rounded-full border-2 border-teal-400 bg-teal-950/40 flex items-center justify-center animate-ping">
                {getElementIcon(s2.element, "w-4 h-4")}
              </div>

              {/* Core fusion reactor container */}
              <div className="w-24 h-24 rounded-full border-4 border-purple-500 bg-purple-950/30 shadow-[0_0_40px_rgba(168,85,247,0.6)] flex items-center justify-center z-10 animate-bounce">
                <Layers className="w-12 h-12 text-purple-400 animate-spin-slow" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-headline-lg text-headline-lg text-purple-400 uppercase tracking-widest font-black animate-pulse">
                MOLECULAR SYNAPSES OVERFLOWING...
              </h3>
              <p className="font-label-caps text-xs text-on-surface-variant">
                Synthesizing double elements // Stabilizing alloy structures
              </p>
            </div>

            <div className="w-full bg-surface-container-lowest border border-outline-variant p-4 rounded-xl font-body-md text-[10px] text-left text-purple-400 space-y-1.5 max-w-sm mx-auto shadow-inner">
              <div>&gt; Securing genome structure: {s1.name}...</div>
              <div>&gt; Infusing catalyst properties: {s2.name}...</div>
              <div>&gt; Activating cobalt radiation cells...</div>
              <div>&gt; Stabilizing compound element: {outcome?.classType}...</div>
            </div>
          </div>
        </div>
      )}

      {/* ================= FUSION REVEAL OVERLAY ================= */}
      {fusedResult && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-surface-container-high border-2 border-purple-500 p-8 rounded-2xl text-center shadow-[0_0_50px_rgba(168,85,247,0.4)] space-y-6">
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-950/20 border border-purple-500/30 rounded-full font-label-caps text-[10px] text-purple-400">
              <Award className="w-3.5 h-3.5 text-yellow-400" />
              <span>HYBRID FORGED</span>
            </div>

            <div className="aspect-[4/3] w-full bg-surface-container-lowest border border-outline-variant rounded-xl relative overflow-hidden flex items-center justify-center shadow-inner">
              {/* Multi glowing background gradients */}
              <div className="absolute w-36 h-36 rounded-full bg-purple-500 filter blur-2xl opacity-20 animate-pulse" />
              
              <div className="w-32 h-32 rounded-full border-4 border-purple-500 bg-purple-950/20 flex items-center justify-center z-10 relative overflow-hidden shadow-[0_0_25px_rgba(168,85,247,0.3)]">
                <img 
                  src={getSlugImage(fusedResult.element, fusedResult.is_ghouled, fusedResult.fusionType)} 
                  alt={fusedResult.name} 
                  className="w-24 h-24 object-contain z-20 relative animate-bounce"
                />
              </div>
              
              <div className="absolute inset-0 scanline opacity-40"></div>
            </div>

            <div className="space-y-2">
              <span className="font-label-caps text-[9px] px-2.5 py-0.5 rounded border border-purple-500/50 bg-purple-950/25 text-purple-400 font-black tracking-wider">
                {fusedResult.fusionType?.toUpperCase()} CLASS
              </span>

              <h3 className="font-headline-lg text-headline-lg font-black tracking-tight text-on-surface uppercase mt-2">
                {fusedResult.name}
              </h3>
              <p className="text-xs text-on-surface-variant font-label-caps mt-1 flex justify-center items-center gap-1">
                <span>Core Genome Alignment:</span>
                <span className="font-bold text-purple-400 uppercase">{fusedResult.fusionType}</span>
              </p>
            </div>

            {/* Fused specifications ledger */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface-container-lowest rounded-xl p-3 border border-outline-variant text-center">
                <div className="font-label-caps text-[8px] text-on-surface-variant">POWER</div>
                <div className="font-stats-lg text-stats-lg text-purple-400 font-black">
                  {fusedResult.power}
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-3 border border-outline-variant text-center">
                <div className="font-label-caps text-[8px] text-on-surface-variant">DEFENSE</div>
                <div className="font-stats-lg text-stats-lg text-cyan-400 font-black">
                  {fusedResult.defense}
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-3 border border-outline-variant text-center">
                <div className="font-label-caps text-[8px] text-on-surface-variant">SPEED</div>
                <div className="font-stats-lg text-stats-lg text-teal-300 font-black">
                  {fusedResult.speed}
                </div>
              </div>
            </div>

            <button
              onClick={() => setFusedResult(null)}
              className="w-full py-4 bg-purple-600 text-white font-label-caps text-label-caps font-black rounded-xl hover:bg-purple-500 active:scale-98 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer"
            >
              TRANSFER TO CANISTER ARSENAL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
