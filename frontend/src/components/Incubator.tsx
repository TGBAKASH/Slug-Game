import React, { useState } from "react";
import { useGameState, ELEMENTS, BASE_STATS } from "../context/GameState";
import { sanitizeSlugName } from "../utils/security";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { ReactorChamber } from "./scene/environments/ReactorChamber";

export const Incubator: React.FC = () => {
  const { mintStarterSlug, mintsToday, maxMintsPerDay } = useGameState();
  const mintsLeft = maxMintsPerDay - mintsToday;
  const account = useCurrentAccount();
  const [mintName, setMintName] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [mintedSlug, setMintedSlug] = useState<any | null>(null);
  
  const handleMint = async (tier: "free" | "premium") => {
    if (!account) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      const newSl = await mintStarterSlug(mintName, tier);
      
      setMintedSlug({
        name: newSl.name,
        element: newSl.element,
        tier,
      });
      setIsMinting(true);
      
    } catch (err: any) {
      console.error(err);
      alert(`Minting failed: ${err.message || err}`);
      setIsMinting(false);
    }
  };

  return (
    <div className="tab-panel active">
      <div className="panel-header">
        <div className="panel-header-inner">
          <div className="section-label">Elemental Stasis Hatchery</div>
          <h2 className="section-title">Stasis Canister Gateway</h2>
          <p className="panel-desc">Materialize combat-ready slugs. Element is assigned on-chain — better tiers give higher odds for rare elements. Optionally name your slug, or leave blank for auto-naming.</p>
          <div style={{fontFamily: "'Orbitron', monospace", fontSize: "10px", letterSpacing: "3px", marginTop: "10px", color: mintsLeft > 0 ? "var(--neon-cyan)" : "var(--neon-orange)"}}>
            DAILY MINTS: {mintsToday}/{maxMintsPerDay} USED {mintsLeft <= 0 ? '— LIMIT REACHED' : `— ${mintsLeft} REMAINING`}
          </div>
        </div>
      </div>
      
      {/* Name Input */}
      <div className="hatchery-config">
        <div className="hatchery-config-inner">
          <div className="hatchery-config-title">NAME YOUR SLUG (optional)</div>
          <div className="hatchery-config-row">
            <input 
              className="hatchery-name-input" 
              id="hatchery-name" 
              type="text" 
              placeholder="Leave blank for auto-name by element..." 
              maxLength={20}
              value={mintName}
              onChange={(e) => setMintName(sanitizeSlugName(e.target.value))} 
            />
          </div>
        </div>
      </div>

      {/* Element Stats Reference */}
      <div style={{maxWidth: "980px", margin: "0 auto 20px", padding: "0 16px"}}>
        <div style={{fontFamily: "'Orbitron', monospace", fontSize: "10px", letterSpacing: "4px", color: "var(--neon-cyan)", marginBottom: "10px", textTransform: "uppercase"}}>ELEMENT BASE STATS</div>
        <div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px"}}>
          {[1, 2, 3, 4].map((el) => {
            const elem = ELEMENTS[el];
            const stats = BASE_STATS[el];
            return (
              <div key={el} style={{background: "var(--panel-bg)", border: "1px solid rgba(0,245,255,0.1)", padding: "12px", textAlign: "center"}}>
                <div style={{fontFamily: "'Orbitron', monospace", fontSize: "11px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "4px"}}>{elem?.name}</div>
                <div style={{fontFamily: "'Orbitron', monospace", fontSize: "9px", color: stats?.tier === "Very Good" ? "var(--neon-orange)" : stats?.tier === "Good" ? "var(--neon-cyan)" : "var(--text-dim)", letterSpacing: "2px", marginBottom: "6px"}}>⭐ {stats?.tier?.toUpperCase()}</div>
                <div style={{fontSize: "11px", color: "var(--text-dim)"}}>HP: <span style={{color: "var(--text-primary)", fontWeight: "bold"}}>{stats?.hp}</span> | ATK: <span style={{color: "var(--text-primary)", fontWeight: "bold"}}>{stats?.attack}</span></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier Cards */}
      <div className="hatchery-layout">
        <div className="hatchery-section-label" style={{maxWidth: "980px", margin: "0 auto 16px", fontFamily: "'Orbitron', monospace", fontSize: "10px", letterSpacing: "4px", color: "var(--neon-orange)", textTransform: "uppercase"}}>SELECT MATERIALIZER TIER</div>
        <div className="hatchery-tier-grid" style={{display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px", maxWidth: "720px", margin: "0 auto"}}>
          
          {/* Free Mint */}
          <div className="hatchery-tier-card" style={{background: "var(--panel-bg)", border: "1px solid rgba(0, 245, 255, 0.15)", padding: "28px", clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)", transition: "border-color 0.3s"}}>
            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "10px", fontWeight: "bold", letterSpacing: "3px", color: "#3b82f6", marginBottom: "6px"}}>FREE MINT</div>
            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "20px", fontWeight: 900, color: "#0f172a", marginBottom: "10px"}}>STARTER CANISTER</div>
            <p style={{fontSize: "13px", lineHeight: 1.6, color: "var(--text-dim)", marginBottom: "18px"}}>Unlock a random elemental slug at zero cost. Rare elements are extremely hard to get.</p>
            <div style={{marginBottom: "20px"}}>
              <div style={{display: "flex", justifyContent: "space-between", fontFamily: "'Orbitron', monospace", fontSize: "9px", color: "var(--text-dim)", padding: "3px 0", borderBottom: "1px solid rgba(0, 245, 255, 0.06)"}}>💧 WATER (Very Good):<span style={{color: "var(--neon-orange)"}}>5%</span></div>
              <div style={{display: "flex", justifyContent: "space-between", fontFamily: "'Orbitron', monospace", fontSize: "9px", color: "var(--text-dim)", padding: "3px 0", borderBottom: "1px solid rgba(0, 245, 255, 0.06)"}}>💨 AIR (Good):<span style={{color: "var(--neon-cyan)"}}>15%</span></div>
              <div style={{display: "flex", justifyContent: "space-between", fontFamily: "'Orbitron', monospace", fontSize: "9px", color: "var(--text-dim)", padding: "3px 0", borderBottom: "1px solid rgba(0, 245, 255, 0.06)"}}>🔥 FIRE (Decent):<span style={{color: "var(--text-primary)"}}>40%</span></div>
              <div style={{display: "flex", justifyContent: "space-between", fontFamily: "'Orbitron', monospace", fontSize: "9px", color: "var(--text-dim)", padding: "3px 0"}}>🌿 EARTH (Decent):<span style={{color: "var(--text-primary)"}}>40%</span></div>
            </div>
            <button className="hatchery-mint-btn" style={{"--card-accent": "rgba(180, 220, 240, 0.5)"} as any} onClick={() => handleMint('free')} disabled={isMinting || mintsLeft <= 0}><span>{mintsLeft <= 0 ? '⬡ DAILY LIMIT REACHED' : '⬡ SPAWN STARTER (FREE)'}</span></button>
          </div>

          {/* Premium Mint */}
          <div className="hatchery-tier-card" style={{background: "var(--panel-bg)", border: "1px solid rgba(0, 245, 255, 0.35)", padding: "28px", clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)", boxShadow: "0 0 30px rgba(0, 245, 255, 0.08)", transition: "border-color 0.3s", position: "relative"}}>
            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "9px", letterSpacing: "3px", color: "var(--neon-cyan)", marginBottom: "6px"}}>+100 COINS BONUS</div>
            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "20px", fontWeight: 900, color: "#0f172a", marginBottom: "10px"}}>PREMIUM CHAMBER</div>
            <p style={{fontSize: "13px", lineHeight: 1.6, color: "var(--text-dim)", marginBottom: "18px"}}>Boosted elemental frequencies. 2x Water odds and 2x Air odds vs free tier.</p>
            <div style={{marginBottom: "20px"}}>
              <div style={{display: "flex", justifyContent: "space-between", fontFamily: "'Orbitron', monospace", fontSize: "9px", color: "var(--text-dim)", padding: "3px 0", borderBottom: "1px solid rgba(0, 245, 255, 0.06)"}}>💧 WATER (Very Good):<span style={{color: "var(--neon-orange)"}}>10%</span></div>
              <div style={{display: "flex", justifyContent: "space-between", fontFamily: "'Orbitron', monospace", fontSize: "9px", color: "var(--text-dim)", padding: "3px 0", borderBottom: "1px solid rgba(0, 245, 255, 0.06)"}}>💨 AIR (Good):<span style={{color: "var(--neon-cyan)"}}>30%</span></div>
              <div style={{display: "flex", justifyContent: "space-between", fontFamily: "'Orbitron', monospace", fontSize: "9px", color: "var(--text-dim)", padding: "3px 0", borderBottom: "1px solid rgba(0, 245, 255, 0.06)"}}>🔥 FIRE (Decent):<span style={{color: "var(--text-primary)"}}>30%</span></div>
              <div style={{display: "flex", justifyContent: "space-between", fontFamily: "'Orbitron', monospace", fontSize: "9px", color: "var(--text-dim)", padding: "3px 0"}}>🌿 EARTH (Decent):<span style={{color: "var(--text-primary)"}}>30%</span></div>
            </div>
            <button className="hatchery-mint-btn" style={{"--card-accent": "var(--neon-cyan)"} as any} onClick={() => handleMint('premium')} disabled={isMinting || mintsLeft <= 0}><span>{mintsLeft <= 0 ? '⬡ DAILY LIMIT REACHED' : '⬡ MINT 0.5 SUI'}</span></button>
          </div>

        </div>
      </div>

      {/* Minting Cinematic */}
      {isMinting && mintedSlug && (
        <ReactorChamber 
          element={mintedSlug.element} 
          rarity={1} 
          onComplete={() => {
            setIsMinting(false);
            setMintedSlug(null);
            setMintName("");
          }}
        />
      )}

    </div>
  );
};
