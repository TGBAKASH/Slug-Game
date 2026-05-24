import React, { useState } from "react";
import { useGameState, RARITIES, getSlugImage } from "../context/GameState";
import { soundManager } from "../context/SoundManager";
import { 
  Swords, 
  Skull, 
  ShieldAlert, 
  Coins, 
  Plus, 
  X, 
  Flame, 
  Droplets, 
  Mountain, 
  Wind, 
  Trophy, 
  Zap, 
  Lock
} from "lucide-react";
import { motion } from "framer-motion";

export const CavernArena: React.FC = () => {
  const {
    activeSlug,
    username,
    setActiveSlugId,
    fusionEnergy,
    pvpLobbies,
    activePvpLobbyOnChain,
    darkCoins,
    cavernRank,
    createPvpLobby,
    joinPvpLobby,
    cancelPvpLobby,
    resolvePvpLobby,
    executeOfflineBattle,
    slugs
  } = useGameState();

  const isActiveSlugSleeping = activeSlug?.recoveryUntil ? activeSlug.recoveryUntil > Date.now() : false;

  // Fighting States
  const [isFighting, setIsFighting] = useState(false);
  const [battleFlash, setBattleFlash] = useState(false);
  const [arenaShake, setArenaShake] = useState(false);
  
  // Telemetry duel logs & details
  const [duelLogs, setDuelLogs] = useState<string[]>([]);
  const [glitchActive, setGlitchActive] = useState(false);

  // Cinematic battle phases & overlay states
  const [battlePhase, setBattlePhase] = useState<"idle" | "entry" | "charging" | "launching" | "collision" | "resolution">("idle");
  const [combatWinner, setCombatWinner] = useState<"player" | "opponent" | null>(null);
  const [combatFloatingText, setCombatFloatingText] = useState<string | null>(null);

  // PVP States
  const pvpResultRef = React.useRef<boolean>(false);
  const [selectedWager, setSelectedWager] = useState<number>(1);
  const [activePvpLobby, setActivePvpLobby] = useState<any | null>(null);
  const [showPvpVictory, setShowPvpVictory] = useState(false);
  const [showPvpFailure, setShowPvpFailure] = useState(false);
  const [pvpDetails, setPvpDetails] = useState<{
    winnerName: string;
    winAmount: number;
    coinsEarned: number;
    playerWins: boolean;
  } | null>(null);

  // PvE Quick Battle States
  const [pveResult, setPveResult] = useState<{
    success: boolean;
    playerPower: number;
    enemyPower: number;
    coinsEarned: number;
    shardsEarned: number;
    battleLogs: string[];
  } | null>(null);
  const [showPveResult, setShowPveResult] = useState(false);
  const [isPveBattling, setIsPveBattling] = useState(false);

  // PVP Duel Trigger
  const handlePvpFight = async (lobby: any) => {
    if (!activeSlug) return;
    if (activeSlug.recoveryUntil && activeSlug.recoveryUntil > Date.now()) {
      alert(`STASIS LOCK: Your active slug ${activeSlug.name} is sleeping / recovering from defeat and cannot enter combat! Awaken it in the Canister Arsenal HUD first.`);
      return;
    }
    
    pvpResultRef.current = false;

    setCombatWinner(null);
    setCombatFloatingText(null);
    setIsFighting(true);
    setBattlePhase("entry");
    setArenaShake(false);
    setBattleFlash(false);
    setGlitchActive(false);
    setActivePvpLobby(lobby);

    setDuelLogs([
      `[0.0s] Arena darkens. PVP MODE DETECTED. Warning sirens ACTIVE.`,
      `[0.2s] Staking preset wagers: ${lobby.wagerAmount} SUI to SmartEscrow vault.`,
      `[0.4s] Opponent locked: Operator ${lobby.player1} deploying cloaked bio-canister.`
    ]);

    soundManager.playLaunch();

    // Trigger PVP duel resolution early
    const resultPromise = joinPvpLobby(lobby.id);

    // Timeline phase 2 (1.0s): Charging energy. Both cards glow.
    setTimeout(() => {
      setBattlePhase("charging");
      setDuelLogs((prev) => [
        ...prev,
        `[1.0s] DUAL PROTOFORM BLASTERS PEAKING RESONANCE.`,
        `[1.2s] SUI SmartEscrow balance verified. Escrow contract locked.`
      ]);
      soundManager.playWarning();
    }, 1000);

    // Timeline phase 3 (2.2s): Launching!
    setTimeout(() => {
      setBattlePhase("launching");
      setDuelLogs((prev) => [
        ...prev,
        `[2.2s] NITRO-CHAMBER BLASTERS DISCHARGED! High speed velocity peaks!`,
        `[2.4s] Both combat cores launched at high-frequency trajectory.`
      ]);
      soundManager.playLaunch();
    }, 2200);

    // Timeline phase 4 (2.7s): Collision! (And De-Cloaking Impact)
    setTimeout(async () => {
      setBattlePhase("collision");
      setBattleFlash(true);
      setArenaShake(true);
      soundManager.playImpact(activeSlug.element);
      soundManager.playImpact(lobby.slug1Element);

      let pvpResult;
      try {
        pvpResult = await resultPromise;
        setPvpDetails(pvpResult);
      } catch (err) {
        setIsFighting(false);
        setBattlePhase("idle");
        alert("Lobby not found or already challenged.");
        return;
      }

      const playerWon = pvpResult.playerWins;
      pvpResultRef.current = playerWon;
      setCombatWinner(playerWon ? "player" : "opponent");

      let floatText = "💥 WAGER CLASH! 💥";
      if (activeSlug.is_ghouled && lobby.slug1IsGhouled) {
        floatText = "😈 VOID RESONANCE CLASH! 😈";
      } else if (activeSlug.is_ghouled || lobby.slug1IsGhouled) {
        floatText = "😈 CORRUPTION OVERLOAD! 😈";
      } else if (activeSlug.element === 2 && lobby.slug1Element === 1) {
        floatText = "💧 WATER COUNTERS FIRE! 💧";
      } else if (activeSlug.element === 1 && lobby.slug1Element === 4) {
        floatText = "🔥 FIRE COUNTERS AIR! 🔥";
      } else if (activeSlug.element === 4 && lobby.slug1Element === 3) {
        floatText = "🌀 AIR COUNTERS EARTH! 🌀";
      } else if (activeSlug.element === 3 && lobby.slug1Element === 2) {
        floatText = "⛰️ EARTH COUNTERS WATER! ⛰️";
      }
      setCombatFloatingText(floatText);

      if (activeSlug.corruption >= 50 || lobby.slug1IsGhouled) {
        setGlitchActive(true);
        soundManager.playWarning();
        setTimeout(() => setGlitchActive(false), 800);
      }

      setDuelLogs((prev) => [
        ...prev,
        `[2.7s] 💥 MASSIVE COVALENT ESCROW COLLISION!`,
        `[2.8s] 🔒 DE-CLOAK GLITCH ENGAGED. Challenger profile decrypted!`,
        `[2.9s] ${floatText}`,
        `[3.1s] Escrow match determined. Winner is: ${pvpResult.winnerName}!`
      ]);

      setTimeout(() => {
        setBattleFlash(false);
      }, 150);

    }, 2700);

    // Timeline phase 5 (3.7s): Resolution phase
    setTimeout(() => {
      setBattlePhase("resolution");
      setArenaShake(false);
      
      const won = pvpResultRef.current;
      setDuelLogs((prev) => [
        ...prev,
        won 
          ? `[3.7s] VICTORY SIGNATURE DETECTED. Releasing double wager stakes to wallet.` 
          : `[3.7s] DEFEAT DETECTED. Escrow wager transferred to victorious challenger.`
      ]);
    }, 3700);

    // Timeline phase 6 (5.0s): Finish
    setTimeout(() => {
      setIsFighting(false);
      setBattlePhase("idle");
      
      if (pvpResultRef.current) {
        setShowPvpVictory(true);
      } else {
        setShowPvpFailure(true);
      }
    }, 5000);
  };

  // Create Player's Wager Lobby
  const handleCreateLobby = async () => {
    if (!activeSlug) return;
    if (activeSlug.recoveryUntil && activeSlug.recoveryUntil > Date.now()) {
      alert(`STASIS LOCK: Your active slug ${activeSlug.name} is sleeping / recovering from defeat and cannot create combat dispatches! Awaken it in the Canister Arsenal HUD first.`);
      return;
    }
    await createPvpLobby(selectedWager);
    soundManager.playLevelUp();
  };

  // Cancel Player's Lobby
  const handleCancelLobby = async (lobbyId: string) => {
    await cancelPvpLobby(lobbyId);
  };

  const renderDuelSlugIcon = (elementId: number) => {
    switch (elementId) {
      case 1: return <span className="text-red-500 font-bold font-label-caps">🔥 FIRE</span>;
      case 2: return <span className="text-cyan-400 font-bold font-label-caps">💧 WATER</span>;
      case 3: return <span className="text-emerald-500 font-bold font-label-caps">⛰️ EARTH</span>;
      case 4: return <span className="text-teal-300 font-bold font-label-caps">🌀 AIR</span>;
      default: return <span className="text-purple-400 font-bold font-label-caps">😈 SHADOW</span>;
    }
  };

  if (slugs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface-container-low border border-outline-variant rounded-2xl text-center min-h-[400px] z-10 relative max-w-xl mx-auto space-y-4 soft-glow-card">
        <ShieldAlert className="w-16 h-16 text-amber-500 animate-bounce" />
        <h3 className="text-headline-md font-headline-md text-on-surface uppercase font-black">
          No Slugs Detected
        </h3>
        <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
          Your containment tanks are currently empty! Please navigate to the <strong>Incubator</strong> to mint your first slug and unlock the Cavern Arena.
        </p>
      </div>
    );
  }

  if (!activeSlug) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface-container-low border border-outline-variant rounded-2xl text-center min-h-[400px] z-10 relative max-w-xl mx-auto space-y-4 soft-glow-card">
        <ShieldAlert className="w-16 h-16 text-amber-500 animate-bounce" />
        <h3 className="text-headline-md font-headline-md text-on-surface uppercase font-black">
          Containment Locked
        </h3>
        <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
          You must lock a Protoform Slug into the CommandCenter (Dashboard) profile slot before entering the Cavern Arena!
        </p>
      </div>
    );
  }

  // Find if player already has an open lobby dispatch
  const playerOpenLobby = pvpLobbies.find((l) => l.player1 === username);
  const isCloaked = ["entry", "charging", "launching"].includes(battlePhase);

  return (
    <div className={`space-y-8 relative z-10 transition-all duration-300 ${arenaShake ? "animate-shake" : ""} ${glitchActive ? "animate-glitch" : ""}`}>
      {/* Cinematic Flash & Glitch Filter Overlay */}
      {battleFlash && (
        <div className="fixed inset-0 z-[100] bg-white pointer-events-none opacity-40 duration-100"></div>
      )}
      {glitchActive && (
        <div className="fixed inset-0 z-[100] bg-purple-950/20 mix-blend-color-dodge pointer-events-none animate-pulse"></div>
      )}

      {/* Header Panel */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b border-outline-variant pb-4 gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-primary-container uppercase tracking-widest flex items-center gap-3">
            <Swords className="w-8 h-8 text-primary-container animate-pulse" />
            PVP GLAZED ARENA
          </h2>
          <p className="text-body-md text-on-surface-variant text-xs mt-1">
            Pure PvP matchmaking engine. Deploy your protoform canisters and challenge other operators blindly for SUI stakes.
          </p>
        </div>

        {/* Global Stats HUD */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant px-3 py-1.5 rounded-lg text-xs font-label-caps">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-outline">RANK:</span>
            <span className="text-on-surface font-bold">Lvl {cavernRank}</span>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant px-3 py-1.5 rounded-lg text-xs font-label-caps">
            <Coins className="w-4 h-4 text-cyan-400" />
            <span className="text-outline">DARK COINS:</span>
            <span className="text-primary-container font-black">{darkCoins}</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-label-caps">
            <span className="text-outline">REACTOR FUEL:</span>
            <span className={fusionEnergy < 10 ? "text-error font-bold" : "text-primary-container font-bold"}>
              {fusionEnergy} / 100
            </span>
            <div className="w-16 h-2 bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
              <div className="h-full bg-primary-container transition-all" style={{ width: `${fusionEnergy}%` }}></div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-label-caps">
            <span className="text-outline">ACTIVE:</span>
            <select
              className="bg-surface-container border border-outline-variant rounded-lg px-2 py-1.5 text-primary-container font-bold cursor-pointer outline-none focus:border-primary-container max-w-[150px] truncate"
              value={activeSlug?.id || ""}
              onChange={(e) => setActiveSlugId(e.target.value)}
            >
              {slugs.filter(s => !s.recoveryUntil || s.recoveryUntil <= Date.now()).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Lv.{s.level})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* ================= PVE TRAINING GROUNDS ================= */}
      <section className="bg-surface-container-low border border-outline-variant p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-30"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h3 className="font-headline-md text-headline-md text-primary-container uppercase font-black tracking-tight leading-none">
              Training Grounds
            </h3>
            <p className="text-[10px] text-on-surface-variant max-w-md leading-relaxed font-body-md">
              Deploy your active slug against randomly generated opponents. Earn dark coins and fusion shards without wagering SUI. Costs 12 Reactor Fuel per battle.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {isPveBattling ? (
              <div className="px-6 py-3 bg-surface-container border border-primary-container/30 rounded-xl font-label-caps text-xs text-primary-container animate-pulse flex items-center gap-2">
                <Zap className="w-4 h-4 animate-bounce" />
                <span>BATTLE IN PROGRESS...</span>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05, filter: "brightness(1.2)" }}
                whileTap={{ scale: 0.96 }}
                onClick={async () => {
                  if (!activeSlug) return;
                  if (isActiveSlugSleeping) {
                    alert(`STASIS LOCK: ${activeSlug.name} is recovering from defeat.`);
                    return;
                  }
                  if (fusionEnergy < 12) {
                    alert("INSUFFICIENT REACTOR FUEL. Need at least 12 energy.");
                    return;
                  }
                  setIsPveBattling(true);
                  setPveResult(null);
                  setShowPveResult(false);

                  const enemyElement = Math.floor(Math.random() * 4) + 1;
                  const enemyPower = Math.floor(activeSlug.power * (0.7 + Math.random() * 0.6));
                  const enemyHp = 100 + Math.floor(Math.random() * 50);

                  soundManager.playLaunch();

                  const result = await executeOfflineBattle(enemyElement, enemyPower, enemyHp);
                  
                  setPveResult(result);
                  setIsPveBattling(false);
                  setShowPveResult(true);
                }}
                disabled={isActiveSlugSleeping || fusionEnergy < 12}
                className="px-6 py-3 bg-primary-container/10 border border-primary-container/40 hover:bg-primary-container/20 text-primary-container font-label-caps text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Swords className="w-4 h-4" />
                <span>DEPLOY TO QUICK BATTLE</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* PvE Battle Result */}
        {showPveResult && pveResult && (
          <div className={`mt-6 p-5 rounded-xl border ${pveResult.success ? "border-emerald-500/30 bg-emerald-950/20" : "border-red-500/30 bg-red-950/20"}`}>
            <div className="flex justify-between items-center mb-3">
              <span className={`font-headline-md text-sm font-black uppercase ${pveResult.success ? "text-emerald-400" : "text-red-400"}`}>
                {pveResult.success ? "⚡ VICTORY" : "💀 DEFEAT"}
              </span>
              <button onClick={() => setShowPveResult(false)} className="text-outline hover:text-on-surface transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center p-2 bg-surface-container rounded-lg">
                <span className="block text-[9px] font-label-caps text-outline">COINS</span>
                <span className="font-stats-lg text-sm text-yellow-400 font-black">+{pveResult.coinsEarned}</span>
              </div>
              <div className="text-center p-2 bg-surface-container rounded-lg">
                <span className="block text-[9px] font-label-caps text-outline">SHARDS</span>
                <span className="font-stats-lg text-sm text-purple-400 font-black">+{pveResult.shardsEarned}</span>
              </div>
            </div>
            <div className="max-h-32 overflow-y-auto custom-scrollbar">
              {pveResult.battleLogs.map((log, i) => (
                <p key={i} className="text-[9px] font-mono text-on-surface-variant leading-relaxed">{log}</p>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ================= PVP WAGER ARENA MODE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left: Dispatch Wager Panel (5 columns) */}
        <section className="lg:col-span-5 bg-surface-container-low border border-outline-variant p-6 rounded-2xl flex flex-col justify-between shadow-2xl relative">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40"></div>
          
          <div className="space-y-6 z-10 relative">
            <div className="border-b border-outline-variant/30 pb-4">
              <h3 className="font-headline-md text-headline-md text-purple-400 uppercase font-black tracking-tight leading-none mb-1">
                Glazed Wager Dispatch
              </h3>
              <span className="font-label-caps text-[9px] text-outline font-bold">DEPLOY PROTOFORM TO GLAZED ARENA</span>
            </div>

            {/* Active Slug Preview */}
            <div className={`p-4 rounded-xl border bg-surface-container-lowest flex items-center justify-between ${
              activeSlug.is_ghouled ? "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]" : "border-outline-variant"
            } relative overflow-hidden`}>
              <div className="glass-reflection-layer"></div>
              {activeSlug.corruption >= 25 && <div className={`corruption-overlay corruption-overlay-${activeSlug.corruption >= 100 ? 100 : activeSlug.corruption >= 75 ? 75 : 50}`}></div>}
              <div className="space-y-1 relative z-10">
                <span className={`text-[9px] font-black font-label-caps px-2 py-0.5 rounded ${
                  RARITIES[activeSlug.rarity as keyof typeof RARITIES].textClass
                } bg-surface-container-low border border-outline-variant`}>
                  {RARITIES[activeSlug.rarity as keyof typeof RARITIES].name}
                </span>
                <h4 className="font-stats-lg text-on-surface font-bold uppercase truncate max-w-[180px] mt-1.5">
                  {activeSlug.name}
                </h4>
                <div className="flex gap-2 items-center text-xs mt-1">
                  {renderDuelSlugIcon(activeSlug.element)}
                  <span className="text-outline font-label-caps">POWER: {activeSlug.power}</span>
                </div>
              </div>

              <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center ${
                activeSlug.is_ghouled ? "border-purple-500 bg-purple-950/20 text-purple-400" : "border-primary-container bg-emerald-950/20 text-primary-container"
              }`}>
                {activeSlug.element === 1 && <Flame className="w-6 h-6" />}
                {activeSlug.element === 2 && <Droplets className="w-6 h-6" />}
                {activeSlug.element === 3 && <Mountain className="w-6 h-6" />}
                {activeSlug.element === 4 && <Wind className="w-6 h-6" />}
                {activeSlug.element === 5 && <Skull className="w-6 h-6 text-purple-400" />}
              </div>
            </div>

            {/* Wager Presets Selector */}
            <div className="space-y-3">
              <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                SELECT SUI ESCROW STAKE
              </label>
              <div className="grid grid-cols-3 gap-3 relative z-10">
                {[1, 5, 10].map((wAmt) => (
                  <motion.button
                    key={wAmt}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedWager(wAmt)}
                    className={`py-3 rounded-xl border-2 font-label-caps text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      selectedWager === wAmt
                        ? "border-purple-400 bg-purple-950/20 text-purple-400 font-bold shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                        : "border-outline-variant text-outline hover:text-on-surface bg-surface-container-lowest"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{wAmt} SUI</span>
                  </motion.button>
                ))}
              </div>
              <p className="text-[10px] text-outline leading-tight font-mono">
                Staked wagers are compiled in testnet code. The winning slug claims double SUI and premium dark coin rewards!
              </p>
            </div>
          </div>

          {/* Launch dispatch button */}
          <div className="pt-6 border-t border-outline-variant/30 mt-6 space-y-4">
            {playerOpenLobby ? (
              <div className="space-y-3">
                <div className="bg-purple-950/10 border border-purple-500/20 rounded-xl p-3.5 text-center font-mono">
                  <span className="block font-label-caps text-[9px] text-purple-400 font-black tracking-widest animate-pulse">
                    ⚡ CANISTER DISPATCHED IN LOBBY Escrow ⚡
                  </span>
                  <span className="text-[10px] text-outline block mt-1">Wager Active: {playerOpenLobby.wagerAmount} SUI</span>
                </div>
                {activePvpLobbyOnChain && activePvpLobbyOnChain.player2 !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? (
                  <motion.button
                    whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
                    whileTap={{ scale: 0.96 }}
                    onClick={async () => {
                      await resolvePvpLobby(playerOpenLobby.id);
                      alert("Battle Resolved! Winner received the double escrow pot.");
                    }}
                    className="w-full py-3 border-2 border-emerald-500 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-500 hover:text-black font-label-caps text-label-caps font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    <Trophy className="w-5 h-5" />
                    <span>CHALLENGER JOINED: RESOLVE BATTLE</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleCancelLobby(playerOpenLobby.id)}
                    className="w-full py-3 border border-error text-error hover:bg-error hover:text-on-error font-label-caps text-label-caps font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    <span>CANCEL DISPATCH CANISTER</span>
                  </motion.button>
                )}
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
                whileTap={{ scale: 0.96 }}
                onClick={handleCreateLobby}
                disabled={isActiveSlugSleeping}
                className="w-full py-4 bg-purple-950/30 border-2 border-purple-500 hover:bg-purple-500 hover:text-black text-purple-400 font-label-caps text-label-caps font-black rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-950/30 disabled:hover:text-purple-400"
              >
                <Plus className="w-5 h-5" />
                <span>INITIALIZE WAGER DISPATCH</span>
              </motion.button>
            )}
          </div>
        </section>

        {/* Right: Board Matchmaker Coremates (7 columns) */}
        <section className="lg:col-span-7 bg-surface-container-low border border-outline-variant p-6 rounded-2xl flex flex-col justify-between shadow-2xl relative min-h-[460px]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40"></div>
          
          <div className="space-y-4 w-full z-10 relative flex-grow flex flex-col">
            <div className="border-b border-outline-variant/30 pb-4">
              <h3 className="font-headline-md text-headline-md text-on-surface uppercase font-black tracking-tight leading-none mb-1">
                Glazed Arena Board
              </h3>
              <span className="font-label-caps text-[9px] text-outline font-bold">CHALLENGE ENCRYPTED CORES BLINDLY</span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1 flex-grow custom-scrollbar">
              {pvpLobbies.filter(l => l.player1 !== "0xYOU...ADDR").length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-outline-variant rounded-xl text-center h-48 space-y-2">
                  <ShieldAlert className="w-8 h-8 text-outline animate-pulse" />
                  <span className="font-label-caps text-[10px] text-outline uppercase font-bold">
                    NO CORES DISPATCHED BY OTHERS.
                  </span>
                  <p className="text-[10px] text-outline/70 max-w-xs leading-normal font-mono">
                    Dispatch your own canister above, or wait for others to join the network.
                  </p>
                </div>
              ) : (
                pvpLobbies
                  .filter((l) => l.player1 !== "0xYOU...ADDR")
                  .map((lobby) => (
                    <article
                      key={lobby.id}
                      className="p-4 bg-surface-container rounded-xl border border-outline-variant flex justify-between items-center hover:border-purple-500/40 transition-all group"
                    >
                      <div className="space-y-2 text-left">
                        <span className="font-label-caps text-[9px] bg-purple-950/20 text-purple-400 border border-purple-500/20 px-3 py-1 rounded font-black tracking-wider">
                          CHALLENGER: {lobby.player1}
                        </span>
                        <div className="text-[10px] text-outline font-mono uppercase tracking-wide">
                          🔒 READY FOR INTRUDER CLASH MATCH
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="block font-label-caps text-[9px] text-outline">STAKE POOL</span>
                          <span className="font-stats-lg text-stats-lg text-yellow-400 font-black">{lobby.wagerAmount} SUI</span>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.05, filter: "brightness(1.2)" }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePvpFight(lobby)}
                          disabled={isActiveSlugSleeping}
                          className="px-4 py-3 bg-purple-950/30 border border-purple-500/50 hover:bg-purple-500 hover:text-black text-purple-400 font-label-caps text-[10px] font-black rounded-xl transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Swords className="w-3.5 h-3.5" />
                          <span>JOIN & FIGHT</span>
                        </motion.button>
                      </div>
                    </article>
                  ))
              )}
            </div>
          </div>
        </section>

      </div>

      {/* ================= HOLOGRAPHIC COMBAT SIMULATION OVERLAY ================= */}
      {isFighting && (
        <div className={`fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in select-none overflow-hidden ${
          battlePhase === "entry" ? "animate-siren-overlay" : ""
        } ${glitchActive ? "glitch-overlay-active" : ""}`}>
          
          {/* Neon grid backdrop */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.015)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none opacity-40"></div>
          <div className="absolute inset-0 scanline z-0 pointer-events-none opacity-30"></div>

          {/* Glitch filter layer */}
          {glitchActive && (
            <div className="fixed inset-0 z-40 bg-purple-950/20 mix-blend-color-dodge pointer-events-none animate-pulse"></div>
          )}

          {/* Top laboratory header */}
          <div className="max-w-4xl w-full text-center space-y-6 z-10 relative">
            <div className="text-center font-label-caps text-xs text-purple-400 bg-purple-950/30 px-6 py-2 border border-purple-500/20 rounded-full inline-flex items-center gap-2 animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.15)]">
              <Zap className="w-4 h-4 text-purple-400 animate-bounce" />
              <span className="tracking-widest">HOLOGRAPHIC CLOAKED DUEL EMULATOR</span>
            </div>

            {/* Duel Grid Stage */}
            <div className={`relative min-h-[380px] w-full flex items-center justify-between gap-12 py-10 px-8 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest/40 backdrop-blur-md overflow-hidden ${
              arenaShake ? "animate-heavy-shake" : ""
            }`}>
              
              {/* Splitting blast effect lines in center */}
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent z-0 opacity-40 animate-pulse"></div>

              {/* Concentrate Shockwave expanders at center screen collision */}
              {battlePhase === "collision" && (
                <>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-8 border-cyan-400 animate-impact-shockwave z-30 pointer-events-none"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-8 border-purple-500 animate-impact-shockwave z-30 pointer-events-none" style={{ animationDelay: "0.15s" }}></div>
                </>
              )}

              {/* Floating 3D combat banners exactly at center-screen collision */}
              {battlePhase === "collision" && combatFloatingText && (
                <div className="absolute top-[15%] left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-float-combat-log">
                  <div className="px-8 py-4 rounded-2xl bg-surface-container border-2 border-primary-container text-primary-container font-black tracking-widest text-stats-lg shadow-[0_0_40px_rgba(56,189,248,0.45)] uppercase scale-110">
                    {combatFloatingText}
                  </div>
                </div>
              )}

              {/* ================= LEFT SIDE: PLAYER SLUG CARD ================= */}
              <div className={`w-[240px] p-6 rounded-2xl border-2 bg-surface-container/90 flex flex-col items-center text-center transition-all duration-500 z-10 ${
                battlePhase === "entry" ? "animate-slide-in-left" : ""
              } ${
                battlePhase === "charging" ? `charging-glow-trail ${
                  activeSlug.element === 1 ? "soft-glow-fire" :
                  activeSlug.element === 2 ? "soft-glow-water" :
                  activeSlug.element === 3 ? "soft-glow-earth" :
                  activeSlug.element === 4 ? "soft-glow-air" : "soft-glow-shadow"
                }` : ""
              } ${
                battlePhase === "launching" ? "animate-launch-left-to-center" : ""
              } ${
                battlePhase === "resolution" && combatWinner === "opponent" ? "animate-destabilize-fade" : ""
              } ${
                battlePhase === "resolution" && combatWinner === "player" ? "border-primary-container shadow-[0_0_35px_rgba(56,189,248,0.5)] scale-110" : "border-outline-variant"
              }`}>
                <span className="text-[10px] text-outline font-label-caps font-bold tracking-widest">PLAYER DISPATCH</span>
                
                {/* High-res image reveal */}
                <div className="my-4 relative">
                  <div className={`absolute inset-0 rounded-full filter blur-xl opacity-35 animate-pulse ${
                    activeSlug.element === 1 ? "bg-red-500" :
                    activeSlug.element === 2 ? "bg-cyan-400" :
                    activeSlug.element === 3 ? "bg-emerald-500" :
                    activeSlug.element === 4 ? "bg-teal-300" : "bg-purple-500"
                  }`}></div>
                  <img 
                    src={getSlugImage(activeSlug.element, activeSlug.is_ghouled, activeSlug.fusionType)} 
                    alt={activeSlug.name} 
                    className="w-28 h-28 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform"
                  />
                </div>

                <div className="font-stats-lg text-stats-lg font-black text-on-surface uppercase tracking-tight truncate w-full">
                  {activeSlug.name}
                </div>
                <div className="my-2">{renderDuelSlugIcon(activeSlug.element)}</div>
                <div className={`font-stats-lg text-headline-md font-black ${
                  activeSlug.is_ghouled ? "text-purple-400" : "text-primary-container"
                }`}>
                  POWER: {activeSlug.power}
                </div>
              </div>


              {/* VS LOGO OR CORE ENERGY SPARK */}
              {battlePhase !== "collision" && battlePhase !== "resolution" && (
                <div className="w-16 h-16 rounded-full border border-outline-variant bg-surface-container flex items-center justify-center z-10 shadow-xl animate-pulse">
                  <span className="font-stats-lg text-stats-lg text-outline font-black tracking-widest">VS</span>
                </div>
              )}


              {/* ================= RIGHT SIDE: OPPONENT SLUG CARD (CLOAKED SCANNING DETAILED MECHANICS) ================= */}
              <div className={`w-[240px] p-6 rounded-2xl border-2 bg-surface-container/90 flex flex-col items-center text-center transition-all duration-500 z-10 relative overflow-hidden ${
                battlePhase === "entry" ? "animate-slide-in-right" : ""
              } ${
                battlePhase === "charging" ? `charging-glow-trail ${
                  isCloaked
                    ? "soft-glow-shadow"
                    : (activePvpLobby?.slug1Element || 1) === 1 ? "soft-glow-fire" :
                      (activePvpLobby?.slug1Element || 1) === 2 ? "soft-glow-water" :
                      (activePvpLobby?.slug1Element || 1) === 3 ? "soft-glow-earth" :
                      (activePvpLobby?.slug1Element || 1) === 4 ? "soft-glow-air" : "soft-glow-shadow"
                }` : ""
              } ${
                battlePhase === "launching" ? "animate-launch-right-to-center" : ""
              } ${
                battlePhase === "resolution" && combatWinner === "player" ? "animate-destabilize-fade" : ""
              } ${
                battlePhase === "resolution" && combatWinner === "opponent" ? "border-purple-500 shadow-[0_0_35px_rgba(168,85,247,0.5)] scale-110" : "border-outline-variant"
              }`}>
                {/* Active scanline visual sweep when cloaked */}
                {isCloaked && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/15 to-transparent animate-scanline pointer-events-none z-20"></div>
                )}

                <span className="text-[10px] text-outline font-label-caps font-bold tracking-widest z-10">CHALLENGER TARGET</span>
                
                {isCloaked ? (
                  <>
                    {/* Glowing padlock scan hologram */}
                    <div className="my-6 relative z-10 flex items-center justify-center w-28 h-28 rounded-full border border-purple-500/40 bg-purple-950/20 text-purple-400 animate-pulse">
                      <div className="absolute inset-0 rounded-full bg-purple-500/5 blur-md animate-ping" style={{ animationDuration: "2s" }}></div>
                      <Lock className="w-12 h-12 text-purple-400 animate-pulse" />
                    </div>

                    <div className="font-stats-lg text-[10px] font-black text-purple-400 mt-2 uppercase tracking-widest w-full z-10 animate-pulse font-mono">
                      🔒 SCANNING CHALLENGER MATRIX...
                    </div>
                    
                    <div className="my-3 font-label-caps text-[9px] text-outline bg-purple-950/30 border border-purple-500/20 px-2.5 py-1 rounded z-10 font-mono">
                      ELEMENT: 🔒 MASKED
                    </div>

                    <div className="font-stats-lg text-xs text-purple-400/80 font-bold z-10 font-mono tracking-wide">
                      POWER: 🔒 ENCRYPTED
                    </div>
                  </>
                ) : (
                  <>
                    {/* True properties revealed! */}
                    <div className="my-4 relative z-10 animate-glitch">
                      <div className={`absolute inset-0 rounded-full filter blur-xl opacity-35 animate-pulse ${
                        (activePvpLobby?.slug1Element || 1) === 1 ? "bg-red-500" :
                        (activePvpLobby?.slug1Element || 1) === 2 ? "bg-cyan-400" :
                        (activePvpLobby?.slug1Element || 1) === 3 ? "bg-emerald-500" :
                        (activePvpLobby?.slug1Element || 1) === 4 ? "bg-teal-300" : "bg-purple-500"
                      }`}></div>
                      <img 
                        src={getSlugImage(activePvpLobby?.slug1Element || 1, activePvpLobby?.slug1IsGhouled || false)} 
                        alt={activePvpLobby?.slug1Name} 
                        className="w-28 h-28 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform"
                      />
                    </div>

                    <div className="font-stats-lg text-stats-lg font-black text-purple-400 mt-2 uppercase tracking-tight truncate w-full z-10">
                      {activePvpLobby?.slug1Name}
                    </div>
                    <div className="my-2 z-10">{renderDuelSlugIcon(activePvpLobby?.slug1Element || 1)}</div>
                    <div className="font-stats-lg text-headline-md text-purple-400 font-black z-10">
                      POWER: {activePvpLobby?.slug1Power}
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* Scrolling Duel Logs */}
            <div className="w-full bg-surface-container-lowest/80 border border-outline-variant/40 p-5 rounded-2xl font-body-md text-xs text-left text-primary-container space-y-2 h-44 overflow-y-auto custom-scrollbar shadow-inner relative">
              <div className="absolute top-2 right-4 flex items-center gap-1.5 font-label-caps text-[8px] text-outline font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
                LIVE DIAGNOSTIC DATA READOUT
              </div>
              {duelLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2 items-start leading-normal transition-all duration-300">
                  <span className="text-outline">&gt;</span>
                  <span className="font-mono tracking-tight">{log}</span>
                </div>
              ))}
            </div>

            {/* Central status sweep */}
            <div className="text-center font-label-caps text-[10px] text-outline tracking-wider animate-pulse uppercase font-bold">
              SYSTEM EMULATION: {battlePhase.toUpperCase()} PHASE // MATRIX ALIGNED
            </div>
          </div>
        </div>
      )}

      {/* ================= RESULT OVERLAYS ================= */}

      {/* PVP Wager Victory Overlay */}
      {showPvpVictory && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="max-w-md w-full bg-surface-container-high border-2 border-yellow-500 p-8 rounded-2xl text-center shadow-[0_0_50px_rgba(234,179,8,0.25)] space-y-6">
            <div className="w-20 h-20 rounded-full border-2 border-yellow-500 flex items-center justify-center bg-yellow-950/20 text-yellow-500 mx-auto shadow-[0_0_20px_rgba(234,179,8,0.3)] animate-pulse">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>
            
            <div className="space-y-1">
              <h2 className="font-headline-xl text-headline-xl text-yellow-500 uppercase tracking-widest font-black">
                WAGER DUEL WON!
              </h2>
              <p className="text-body-md text-on-surface-variant text-xs max-w-sm mx-auto font-mono">
                Escrow stakes resolved. You defeated the active challenger in combat!
              </p>
            </div>

            {pvpDetails && (
              <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl text-left font-label-caps text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-outline">DUEL WINNER:</span>
                  <span className="text-yellow-400 font-bold">{pvpDetails.winnerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">SUI RECLAIMED POOL:</span>
                  <span className="text-yellow-400 font-bold">{pvpDetails.winAmount} SUI</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-outline">DARK COINS GAINED:</span>
                  <span className="text-primary-container">+{pvpDetails.coinsEarned} Coins</span>
                </div>
              </div>
            )}

            <button
              onClick={() => { setShowPvpVictory(false); setPvpDetails(null); }}
              className="w-full py-4 bg-yellow-500 text-black font-label-caps text-label-caps font-black rounded-xl hover:brightness-110 active:scale-98 transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)] cursor-pointer"
            >
              COLLECT SUI & COINS
            </button>
          </div>
        </div>
      )}

      {/* PVP Wager Defeat Overlay */}
      {showPvpFailure && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="max-w-md w-full bg-surface-container-high border-2 border-error p-8 rounded-2xl text-center shadow-[0_0_50px_rgba(255,180,171,0.2)] space-y-6">
            <div className="w-20 h-20 rounded-full border-2 border-error flex items-center justify-center bg-red-950/20 text-error mx-auto shadow-[0_0_20px_rgba(255,180,171,0.3)] animate-pulse">
              <Skull className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h2 className="font-headline-xl text-headline-xl text-error uppercase tracking-widest font-black">
                WAGER DUEL LOST
              </h2>
              <p className="text-body-md text-on-surface-variant text-xs max-w-sm mx-auto font-mono">
                Challenger defeated your active slug. The escrow stakes of {activePvpLobby?.wagerAmount} SUI have been transferred.
              </p>
            </div>

            {pvpDetails && (
              <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl text-left font-label-caps text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-outline">DUEL WINNER:</span>
                  <span className="text-error font-bold">{pvpDetails.winnerName}</span>
                </div>
                <div className="border-t border-outline-variant/30 my-2 pt-2 flex justify-between font-black text-xs font-mono">
                  <span className="text-outline">CONSOLATION REWARDS:</span>
                  <span className="text-primary-container">+{pvpDetails.coinsEarned} Dark Coins</span>
                </div>
              </div>
            )}

            <button
              onClick={() => { setShowPvpFailure(false); setPvpDetails(null); }}
              className="w-full py-4 border-2 border-error text-error hover:bg-error hover:text-on-error font-label-caps text-label-caps font-black rounded-xl transition-all shadow-[0_0_15px_rgba(255,180,171,0.15)] cursor-pointer"
            >
              DISMISS COMBAT CONSOLE
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
