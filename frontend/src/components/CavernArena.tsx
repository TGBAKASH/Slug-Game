import React, { useState } from "react";
import { useGameState, ELEMENTS, BASE_STATS } from "../context/GameState";
import { soundManager } from "../context/SoundManager";
import { ArenaScene } from "./scene/environments/ArenaScene";
import { 
  Skull, 
  ShieldAlert, 
  X, 
  Trophy, 
  Zap
} from "lucide-react";

export const CavernArena: React.FC = () => {
  const {
    activeSlug,
    username,
    setActiveSlugId,
    pvpLobbies,
    activePvpLobbyOnChain,
    darkCoins,
    cavernRank,
    arenaEnergy,
    maxArenaEnergy,
    nextEnergyRefillAt,
    createPvpLobby,
    joinPvpLobby,
    revealSlug,
    cancelPvpLobby,
    executeOfflineBattle,
    slugs
  } = useGameState();

  const isActiveSlugSleeping = activeSlug ? activeSlug.sleep_until_ms > Date.now() : false;

  // Fighting States
  const [isFighting, setIsFighting] = useState(false);
  const [battleFlash, setBattleFlash] = useState(false);
  const [arenaShake, setArenaShake] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  
  const [battlePhase, setBattlePhase] = useState<"idle" | "entry" | "charging" | "launching" | "collision" | "resolution">("idle");
  const [combatWinner, setCombatWinner] = useState<"player" | "opponent" | null>(null);

  // PVP States
  const [selectedWager, setSelectedWager] = useState<number>(1);
  const [activePvpLobby, setActivePvpLobby] = useState<any | null>(null);
  const [showPvpVictory, setShowPvpVictory] = useState(false);
  const [showPvpFailure, setShowPvpFailure] = useState(false);

  // PvE Quick Battle States
  const [pveResult, setPveResult] = useState<{
    success: boolean;
    isDraw: boolean;
    playerHpLeft: number;
    enemyHpLeft: number;
    coinsEarned: number;
    battleLogs: string[];
    roundCount: number;
  } | null>(null);
  const [showPveResult, setShowPveResult] = useState(false);
  const [isPveBattling, setIsPveBattling] = useState(false);

  // PVP Duel: Join lobby (double-blind)
  const handlePvpJoin = async (lobby: any) => {
    if (!activeSlug) return;
    if (isActiveSlugSleeping) {
      alert(`STASIS LOCK: Your slug ${activeSlug.name} is sleeping. Awaken it first.`);
      return;
    }
    
    try {
      soundManager.playLaunch();
      await joinPvpLobby(lobby.id);
      alert("Joined lobby! Now reveal your slug by clicking REVEAL.");
    } catch (err) {
      alert("Failed to join lobby.");
    }
  };

  // Create Player's Wager Lobby
  const handleCreateLobby = async () => {
    if (!activeSlug) return;
    if (isActiveSlugSleeping) {
      alert(`STASIS LOCK: Your slug ${activeSlug.name} is sleeping. Awaken it first.`);
      return;
    }
    await createPvpLobby(selectedWager);
    soundManager.playLevelUp();
  };

  // Reveal slug in PvP
  const handleReveal = async (lobbyId: string) => {
    try {
      await revealSlug(lobbyId);
      soundManager.playLaunch();
      alert("Slug revealed! Waiting for opponent to reveal...");
    } catch (err) {
      alert("Reveal failed.");
    }
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
      default: return <span className="text-slate-400 font-bold font-label-caps">❓ UNKNOWN</span>;
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
          Your containment tanks are currently empty! Please navigate to the <strong>Hatchery</strong> to mint your first slug.
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
          You must lock a slug in the Arsenal before entering the Arena!
        </p>
      </div>
    );
  }

  // Find if player already has an open lobby dispatch
  const playerOpenLobby = pvpLobbies.find((l) => l.player1 === (activePvpLobbyOnChain ? activePvpLobbyOnChain.player1 : username));
  const activeLobbyId = localStorage.getItem("active_pvp_lobby");

  return (
    <div className={`tab-panel active ${arenaShake ? "animate-shake" : ""} ${glitchActive ? "animate-glitch" : ""}`}>
      <div className="panel-header">
        <div className="panel-header-inner">
          <div className="section-label">Combat Engine</div>
          <h2 className="section-title">Glazed Arena</h2>
          <p className="panel-desc">Deploy slugs in PvE training or challenge operators with blind SUI wagers. Elemental advantages deal +15% damage!</p>
        </div>
      </div>

      {/* Top Status Bar */}
      <div className="hatchery-config">
        <div className="hatchery-config-inner" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px'}}>
          <div style={{fontFamily: "'Orbitron', monospace", fontSize: "10px", letterSpacing: "2px", display: 'flex', gap: '30px', flexWrap: 'wrap', color: '#6F6F6F'}}>
             <div>RANK: <span style={{color: "#000000", fontWeight: 'bold', fontSize: "14px", marginLeft: "8px"}}>{cavernRank}</span></div>
             <div>DARK COINS: <span style={{color: "#000000", fontWeight: 'bold', fontSize: "14px", marginLeft: "8px"}}>{darkCoins}</span></div>
             <div>ENERGY: <span style={{color: arenaEnergy > 0 ? "#000000" : "#cc0000", fontWeight: 'bold', fontSize: "14px", marginLeft: "8px"}}>{arenaEnergy}/{maxArenaEnergy}</span></div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
             <div style={{fontFamily: "'Orbitron', monospace", fontSize: "10px", letterSpacing: "2px", color: '#6F6F6F'}}>ACTIVE CANISTER:</div>
             <select
               style={{background: "var(--panel-bg)", border: "1px solid rgba(0,0,0,0.15)", color: "#000000", fontFamily: "'Orbitron', monospace", fontSize: "12px", padding: "8px 12px", outline: "none", cursor: "pointer"}}
               value={activeSlug?.id || ""}
               onChange={(e) => setActiveSlugId(e.target.value)}
             >
                {slugs.filter(s => !s.sleep_until_ms || s.sleep_until_ms <= Date.now()).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Lv.{s.level} | HP:{s.hp} ATK:{s.attack})
                  </option>
                ))}
             </select>
          </div>
        </div>
      </div>

      {/* Arena Panels */}
      <div className="hatchery-layout" style={{marginTop: "20px"}}>
        
        {/* PvE Top Panel */}
        <div className="hatchery-tier-grid" style={{display: "grid", gridTemplateColumns: "1fr", gap: "20px", maxWidth: "980px", margin: "0 auto 20px"}}>
          <div className="hatchery-tier-card" style={{background: "var(--panel-bg)", border: "1px solid rgba(0, 245, 255, 0.15)", padding: "24px", clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)"}}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px"}}>
               <div style={{flex: 1, minWidth: "300px"}}>
                 <div style={{fontFamily: "'Orbitron', monospace", fontSize: "10px", fontWeight: "bold", letterSpacing: "3px", color: "var(--neon-cyan)", marginBottom: "6px"}}>PVE PROTOCOL</div>
                 <div style={{fontFamily: "'Orbitron', monospace", fontSize: "18px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "10px"}}>TRAINING GROUNDS</div>
                 <p style={{fontSize: "13px", lineHeight: 1.6, color: "var(--text-dim)", marginBottom: "0"}}>HP-based round combat vs random opponents. Win to earn dark coins (base 20-40, +15%/level). <span style={{color:"var(--neon-cyan)"}}>Water{'>'} Fire {'>'} Earth {'>'} Air {'>'} Water</span></p>
               </div>
               
               <div style={{minWidth: "250px", alignSelf: "center"}}>
                  {isPveBattling ? (
                    <div style={{padding: "12px 24px", border: "1px solid var(--neon-cyan)", color: "var(--neon-cyan)", fontFamily: "'Orbitron', monospace", fontSize: "12px", textAlign: "center", animation: "flicker 1.5s infinite"}}>BATTLE IN PROGRESS...</div>
                  ) : (
                    <>
                    <button className="hatchery-mint-btn" style={{"--card-accent": "rgba(0, 245, 255, 0.5)"} as any} onClick={async () => {
                      if (!activeSlug) return;
                      if (isActiveSlugSleeping) {
                        alert(`STASIS LOCK: ${activeSlug.name} is recovering from defeat.`);
                        return;
                      }
                      setIsPveBattling(true);
                      setPveResult(null);
                      setShowPveResult(false);
      
                      // Generate random enemy based on element base stats
                      const enemyElement = Math.floor(Math.random() * 4) + 1;
                      const baseStats = BASE_STATS[enemyElement];
                      const variance = 0.7 + Math.random() * 0.6;
                      const enemyHp = Math.floor(baseStats.hp * variance);
                      const enemyAttack = Math.floor(baseStats.attack * variance);
      
                      soundManager.playLaunch();
                      const result = await executeOfflineBattle(enemyElement, enemyHp, enemyAttack);
                      
                      setPveResult(result);
                      setIsPveBattling(false);
                      setShowPveResult(true);
                    }} disabled={isActiveSlugSleeping || arenaEnergy < 1}><span>⬡ DEPLOY TO QUICK BATTLE</span></button>
                    {arenaEnergy < 1 && (
                      <p style={{fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#cc0000", marginTop: "8px", textAlign: "center"}}>
                        No arena energy remaining. Recharges 1 per hour.
                      </p>
                    )}
                    </>
                  )}
               </div>
            </div>
          </div>
        </div>

        {showPveResult && pveResult && (
           <div style={{maxWidth: "980px", margin: "0 auto 20px", border: `1px solid ${pveResult.success ? 'var(--neon-cyan)' : pveResult.isDraw ? 'var(--text-dim)' : 'var(--neon-orange)'}`, background: "var(--panel-bg)", padding: "20px", position: "relative", clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)"}}>
              <button onClick={() => setShowPveResult(false)} style={{position: "absolute", top: "15px", right: "15px", background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer"}}><X size={18}/></button>
              <div style={{fontFamily: "'Orbitron', monospace", fontSize: "14px", fontWeight: "bold", color: pveResult.success ? "var(--neon-cyan)" : pveResult.isDraw ? "var(--text-dim)" : "var(--neon-orange)", marginBottom: "15px"}}>
                 {pveResult.success ? "VICTORY DECLARED" : pveResult.isDraw ? "DRAW — MUTUAL DESTRUCTION" : "DEFEAT DETECTED"}
              </div>
              <div style={{display: "flex", gap: "30px", marginBottom: "15px"}}>
                 <div>
                    <div style={{fontFamily: "'Orbitron', monospace", fontSize: "9px", color: "var(--text-dim)"}}>COINS CLAIMED</div>
                    <div style={{fontFamily: "'Orbitron', monospace", fontSize: "20px", color: "var(--neon-orange)"}}>+{pveResult.coinsEarned}</div>
                 </div>
                 <div>
                    <div style={{fontFamily: "'Orbitron', monospace", fontSize: "9px", color: "var(--text-dim)"}}>ROUNDS</div>
                    <div style={{fontFamily: "'Orbitron', monospace", fontSize: "20px", color: "var(--neon-cyan)"}}>{pveResult.roundCount}</div>
                 </div>
                 <div>
                    <div style={{fontFamily: "'Orbitron', monospace", fontSize: "9px", color: "var(--text-dim)"}}>YOUR HP LEFT</div>
                    <div style={{fontFamily: "'Orbitron', monospace", fontSize: "20px", color: pveResult.playerHpLeft > 0 ? "var(--neon-cyan)" : "var(--neon-orange)"}}>{pveResult.playerHpLeft}</div>
                 </div>
              </div>
              <div className="custom-scrollbar" style={{maxHeight: "100px", overflowY: "auto", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "15px"}}>
                 {pveResult.battleLogs.map((log, i) => (
                   <div key={i} style={{fontFamily: "'Orbitron', monospace", fontSize: "10px", color: "var(--text-dim)", marginBottom: "4px"}}><span style={{color: "var(--neon-cyan)", marginRight: "8px"}}>&gt;</span>{log}</div>
                 ))}
              </div>
           </div>
        )}

        <div className="hatchery-tier-grid" style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", maxWidth: "980px", margin: "0 auto"}}>
          
          {/* Competitive Matchmaking */}
          <div className="hatchery-tier-card" style={{background: "var(--panel-bg)", border: "1px solid rgba(0, 245, 255, 0.35)", padding: "24px", clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)", boxShadow: "0 0 30px rgba(0, 245, 255, 0.08)", display: "flex", flexDirection: "column"}}>
            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "9px", letterSpacing: "3px", color: "var(--neon-cyan)", marginBottom: "6px"}}>BLIND WAGER PROTOCOL</div>
            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "18px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "20px"}}>COMPETITIVE PVP</div>
            
            <div style={{background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", padding: "15px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "15px"}}>
              <div style={{flex: 1}}>
                <div style={{fontFamily: "'Orbitron', monospace", fontSize: "9px", color: "var(--text-dim)", marginBottom: "4px"}}>{ELEMENTS[activeSlug.element]?.name || "?"} • {BASE_STATS[activeSlug.element]?.tier?.toUpperCase()}</div>
                <div style={{fontFamily: "'Orbitron', monospace", fontSize: "16px", color: "var(--text-primary)", marginBottom: "4px"}}>{activeSlug.name}</div>
                <div style={{fontSize: "12px", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "10px"}}>
                  {renderDuelSlugIcon(activeSlug.element)} <span>HP: {activeSlug.hp} | ATK: {activeSlug.attack}</span>
                </div>
              </div>
              <div style={{fontSize: "24px", filter: "drop-shadow(0 0 5px rgba(255,255,255,0.2))"}}>
                {activeSlug.element === 1 ? '🔥' : activeSlug.element === 2 ? '💧' : activeSlug.element === 3 ? '🌿' : '💨'}
              </div>
            </div>

            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "9px", color: "var(--text-dim)", marginBottom: "10px"}}>SELECT ESCROW STAKE</div>
            <div style={{display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px"}}>
              {[1, 5, 10].map((wAmt) => (
                <button
                  key={wAmt}
                  onClick={() => setSelectedWager(wAmt)}
                  style={{
                    background: selectedWager === wAmt ? "rgba(0, 245, 255, 0.15)" : "transparent",
                    border: `1px solid ${selectedWager === wAmt ? "var(--neon-cyan)" : "rgba(255,255,255,0.1)"}`,
                    color: selectedWager === wAmt ? "var(--neon-cyan)" : "var(--text-dim)",
                    padding: "10px",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.3s"
                  }}
                >
                  {wAmt} SUI
                </button>
              ))}
            </div>

            <p style={{fontSize: "12px", lineHeight: 1.6, color: "var(--text-dim)", marginBottom: "25px", flex: 1}}>Double-blind commit-reveal: both players commit hash, then reveal. Neither sees the other's slug before both reveal. 3 min timeout.</p>

            <div>
              {activeLobbyId ? (
                <div style={{display: "flex", flexDirection: "column", gap: "15px"}}>
                  <div style={{border: "1px solid var(--neon-cyan)", padding: "12px", textAlign: "center"}}>
                    <div style={{fontFamily: "'Orbitron', monospace", fontSize: "10px", color: "var(--neon-cyan)", marginBottom: "4px", animation: "flicker 1.5s infinite"}}>DISPATCHED IN ESCROW</div>
                  </div>
                  {activePvpLobbyOnChain && activePvpLobbyOnChain.player2 !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? (
                    <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
                      <div style={{fontFamily: "'Orbitron', monospace", fontSize: "10px", color: "var(--neon-cyan)", textAlign: "center"}}>Opponent joined! Reveal your slug:</div>
                      <button className="hatchery-mint-btn" style={{"--card-accent": "rgba(0, 255, 100, 0.5)"} as any} onClick={() => handleReveal(activeLobbyId)}>
                        <span>⬡ REVEAL MY SLUG</span>
                      </button>
                    </div>
                  ) : (
                    <button className="hatchery-mint-btn" style={{"--card-accent": "rgba(255, 50, 50, 0.5)"} as any} onClick={() => handleCancelLobby(activeLobbyId)}>
                      <span>✕ CANCEL DISPATCH</span>
                    </button>
                  )}
                </div>
              ) : (
                <button className="hatchery-mint-btn" style={{"--card-accent": "var(--neon-cyan)"} as any} onClick={handleCreateLobby} disabled={isActiveSlugSleeping}>
                  <span>⬡ INITIALIZE WAGER DISPATCH</span>
                </button>
              )}
            </div>
          </div>

          {/* Arena Board */}
          <div className="hatchery-tier-card" style={{background: "var(--panel-bg)", border: "1px solid rgba(255, 204, 0, 0.3)", padding: "24px", clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)", display: "flex", flexDirection: "column"}}>
            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "9px", letterSpacing: "3px", color: "var(--neon-orange)", marginBottom: "6px"}}>NETWORK SCAN</div>
            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "18px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "20px"}}>ACTIVE ARENA BOARD</div>
            
            <div className="custom-scrollbar" style={{flex: 1, overflowY: "auto", maxHeight: "400px", paddingRight: "10px"}}>
                {pvpLobbies.length === 0 ? (
                  <div style={{padding: "40px 0", textAlign: "center", fontFamily: "'Orbitron', monospace", fontSize: "11px", color: "var(--text-dim)", border: "1px dashed rgba(255,255,255,0.1)"}}>
                    NO CORES DISPATCHED BY OTHERS.
                  </div>
                ) : (
                  pvpLobbies.map((lobby) => (
                      <div key={lobby.id} style={{background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,204,0,0.15)", padding: "15px", marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px"}}>
                        <div style={{flex: 1, minWidth: 0}}>
                          <div style={{fontFamily: "'Orbitron', monospace", fontSize: "13px", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "4px"}}>{lobby.player1.slice(0, 8)}...{lobby.player1.slice(-4)}</div>
                          <div style={{fontFamily: "'Orbitron', monospace", fontSize: "9px", color: "var(--text-dim)"}}>BLIND WAGER — ELEMENT HIDDEN</div>
                        </div>
                        <div style={{textAlign: "center", padding: "0 15px", borderLeft: "1px solid rgba(255,255,255,0.05)"}}>
                          <div style={{fontFamily: "'Orbitron', monospace", fontSize: "9px", color: "var(--text-dim)", marginBottom: "4px"}}>STAKE POOL</div>
                          <div style={{fontFamily: "'Orbitron', monospace", fontSize: "16px", color: "var(--neon-orange)"}}>{lobby.wagerAmount} SUI</div>
                        </div>
                        <div>
                          <button 
                            className="hatchery-mint-btn" 
                            style={{"--card-accent": "var(--neon-orange)", padding: "10px 15px"} as any}
                            onClick={() => handlePvpJoin(lobby)}
                            disabled={isActiveSlugSleeping}
                          >
                            <span style={{fontSize: "10px"}}>⬡ JOIN BLIND</span>
                          </button>
                        </div>
                      </div>
                    ))
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
