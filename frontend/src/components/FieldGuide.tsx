import React, { useState } from "react";
import { BookOpen, Shield, Flame, Droplets, Mountain, Wind, Sparkles, Coins, Zap, Heart, Swords, Clock } from "lucide-react";
import { motion } from "framer-motion";

const TiltCard = ({ children, color = "var(--surface-border)" }: { children: React.ReactNode, color?: string }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, rotateY: 10, rotateX: -5, borderColor: "var(--neon-cyan)", boxShadow: "0 20px 40px rgba(0,0,0,0.05), 0 0 20px rgba(0,245,255,0.1)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{
        background: "var(--panel-bg)",
        border: `1px solid ${color}`,
        padding: "24px",
        clipPath: "polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)",
        perspective: 1000,
        transformStyle: "preserve-3d",
        cursor: "pointer"
      }}
    >
      <div style={{ transform: "translateZ(20px)" }}>
        {children}
      </div>
    </motion.div>
  );
};

export const FieldGuide: React.FC = () => {
  const [activeChapter, setActiveChapter] = useState<number>(1);

  const chapters = [
    {
      id: 1,
      title: "Elements & Base Stats",
      short: "Slug Types & Combat Advantage",
      icon: <Flame size={16} />,
      content: (
        <div style={{display: "flex", flexDirection: "column", gap: "24px"}}>
          <p style={{fontSize: "14px", lineHeight: 1.7, color: "var(--ink)"}}>
            Each slug is assigned one of <strong>4 elements</strong> at mint time. Elements determine base HP, Attack, and combat advantage. The advantage cycle gives <strong>×1.15 damage</strong> (15% bonus) when attacking a weaker element, and <strong>×0.85 damage</strong> (15% penalty) against a stronger element. Same-element matchups deal neutral ×1.0 damage.
          </p>

          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px"}}>
            <TiltCard>
              <Flame size={32} color="#FF4500" style={{marginBottom: "12px"}} />
              <h4 style={{fontFamily: "'Orbitron', monospace", fontSize: "12px", fontWeight: "bold", color: "var(--ink)", marginBottom: "8px"}}>🔥 FIRE — Decent Tier</h4>
              <p style={{fontSize: "12px", color: "var(--ink)", lineHeight: 1.6}}>
                <strong>Base HP: 85 | Base ATK: 20</strong><br/>
                Glass cannon — lowest HP but highest ATK of all elements.<br/>
                <span style={{color: "var(--neon-cyan)"}}>Beats Earth (+15%)</span> · <span style={{color: "var(--neon-orange)"}}>Weak to Water (-15%)</span>
              </p>
              <div style={{marginTop: "8px", fontSize: "10px", fontFamily: "'Orbitron', monospace", color: "var(--ink-dim)"}}>Growth: HP +1%/lvl · ATK +4%/lvl</div>
            </TiltCard>
            <TiltCard>
              <Droplets size={32} color="#00BFFF" style={{marginBottom: "12px"}} />
              <h4 style={{fontFamily: "'Orbitron', monospace", fontSize: "12px", fontWeight: "bold", color: "var(--ink)", marginBottom: "8px"}}>💧 WATER — Very Good Tier</h4>
              <p style={{fontSize: "12px", color: "var(--ink)", lineHeight: 1.6}}>
                <strong>Base HP: 120 | Base ATK: 14</strong><br/>
                Best overall — high HP with solid attack. Hardest to obtain.<br/>
                <span style={{color: "var(--neon-cyan)"}}>Beats Fire (+15%)</span> · <span style={{color: "var(--neon-orange)"}}>Weak to Earth (-15%)</span>
              </p>
              <div style={{marginTop: "8px", fontSize: "10px", fontFamily: "'Orbitron', monospace", color: "var(--ink-dim)"}}>Growth: HP +3%/lvl · ATK +2%/lvl</div>
            </TiltCard>
            <TiltCard>
              <Mountain size={32} color="#228B22" style={{marginBottom: "12px"}} />
              <h4 style={{fontFamily: "'Orbitron', monospace", fontSize: "12px", fontWeight: "bold", color: "var(--ink)", marginBottom: "8px"}}>⛰️ EARTH — Decent Tier</h4>
              <p style={{fontSize: "12px", color: "var(--ink)", lineHeight: 1.6}}>
                <strong>Base HP: 130 | Base ATK: 10</strong><br/>
                Maximum tank — highest HP in the game but lowest ATK.<br/>
                <span style={{color: "var(--neon-cyan)"}}>Beats Air (+15%)</span> · <span style={{color: "var(--neon-orange)"}}>Weak to Fire (-15%)</span>
              </p>
              <div style={{marginTop: "8px", fontSize: "10px", fontFamily: "'Orbitron', monospace", color: "var(--ink-dim)"}}>Growth: HP +4%/lvl · ATK +1%/lvl</div>
            </TiltCard>
            <TiltCard>
              <Wind size={32} color="#20B2AA" style={{marginBottom: "12px"}} />
              <h4 style={{fontFamily: "'Orbitron', monospace", fontSize: "12px", fontWeight: "bold", color: "var(--ink)", marginBottom: "8px"}}>🌀 AIR — Good Tier</h4>
              <p style={{fontSize: "12px", color: "var(--ink)", lineHeight: 1.6}}>
                <strong>Base HP: 105 | Base ATK: 16</strong><br/>
                Well balanced — good ATK with decent HP. Solid all-rounder.<br/>
                <span style={{color: "var(--neon-cyan)"}}>Beats Water (+15%)</span> · <span style={{color: "var(--neon-orange)"}}>Weak to Earth (-15%)</span>
              </p>
              <div style={{marginTop: "8px", fontSize: "10px", fontFamily: "'Orbitron', monospace", color: "var(--ink-dim)"}}>Growth: HP +2%/lvl · ATK +3%/lvl</div>
            </TiltCard>
          </div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            style={{padding: "20px", background: "rgba(0, 245, 255, 0.05)", border: "1px solid rgba(0, 245, 255, 0.3)", clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)"}}
          >
            <h4 style={{fontFamily: "'Orbitron', monospace", fontSize: "12px", fontWeight: "bold", color: "var(--neon-cyan)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px"}}>
              <Swords size={16} /> ELEMENTAL ADVANTAGE CYCLE
            </h4>
            <p style={{fontSize: "13px", color: "var(--ink)", lineHeight: 1.6}}>
              <strong>Water → Fire → Earth → Air → Water</strong>. Each round, both slugs attack simultaneously. <strong>Damage = ATK × elemental multiplier</strong> (×1.15 advantage, ×0.85 disadvantage, ×1.0 neutral). Maximum 10 rounds — if neither is KO'd, the slug with more remaining HP wins. If HP is tied, higher ATK wins.
            </p>
          </motion.div>
        </div>
      )
    },
    {
      id: 2,
      title: "Minting & Drop Rates",
      short: "Free & Premium Hatching",
      icon: <Sparkles size={16} />,
      content: (
        <div style={{display: "flex", flexDirection: "column", gap: "24px"}}>
          <p style={{fontSize: "14px", lineHeight: 1.7, color: "var(--ink)"}}>
            Element is determined <strong>on-chain at mint time</strong> — you cannot choose which element you get. Premium minting costs <strong>0.5 SUI</strong> and gives significantly better odds for Water and Air slugs.
          </p>

          <div style={{display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px"}}>
            <TiltCard>
              <h4 style={{fontFamily: "'Orbitron', monospace", fontSize: "13px", fontWeight: "bold", color: "var(--ink)", marginBottom: "16px"}}>FREE MINT (0 SUI)</h4>
              <div style={{fontSize: "13px", color: "var(--ink)", lineHeight: 2}}>
                💧 Water <span style={{fontFamily: "'Orbitron', monospace", color: "var(--neon-cyan)", fontWeight: "bold"}}>(5%)</span> — Very rare<br/>
                🌀 Air <span style={{fontFamily: "'Orbitron', monospace", color: "var(--neon-cyan)", fontWeight: "bold"}}>(15%)</span> — Uncommon<br/>
                🔥 Fire <span style={{fontFamily: "'Orbitron', monospace", color: "var(--ink-dim)", fontWeight: "bold"}}>(40%)</span> — Common<br/>
                🌿 Earth <span style={{fontFamily: "'Orbitron', monospace", color: "var(--ink-dim)", fontWeight: "bold"}}>(40%)</span> — Common
              </div>
              <div style={{marginTop: "16px", padding: "8px 12px", background: "var(--bg-secondary)", border: "1px solid var(--surface-border)", fontSize: "11px", fontFamily: "'Orbitron', monospace", color: "var(--ink-dim)"}}>
                Getting Water is very hard, Air is hard, Fire/Earth are common
              </div>
            </TiltCard>
            <TiltCard color="var(--neon-cyan)">
              <h4 style={{fontFamily: "'Orbitron', monospace", fontSize: "13px", fontWeight: "bold", color: "var(--neon-cyan)", marginBottom: "16px"}}>PREMIUM MINT (0.5 SUI)</h4>
              <div style={{fontSize: "13px", color: "var(--ink)", lineHeight: 2}}>
                💧 Water <span style={{fontFamily: "'Orbitron', monospace", color: "var(--neon-cyan)", fontWeight: "bold"}}>(10%)</span> — Hard<br/>
                🌀 Air <span style={{fontFamily: "'Orbitron', monospace", color: "var(--neon-cyan)", fontWeight: "bold"}}>(30%)</span> — Medium<br/>
                🔥 Fire <span style={{fontFamily: "'Orbitron', monospace", color: "var(--ink-dim)", fontWeight: "bold"}}>(30%)</span> — Easy<br/>
                🌿 Earth <span style={{fontFamily: "'Orbitron', monospace", color: "var(--ink-dim)", fontWeight: "bold"}}>(30%)</span> — Easy
              </div>
              <div style={{marginTop: "16px", padding: "8px 12px", background: "rgba(0, 245, 255, 0.08)", border: "1px solid rgba(0, 245, 255, 0.2)", fontSize: "11px", fontFamily: "'Orbitron', monospace", color: "var(--neon-cyan)"}}>
                +100 Dark Coins bonus on premium mint!
              </div>
            </TiltCard>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            style={{padding: "20px", background: "rgba(0, 245, 255, 0.05)", border: "1px solid rgba(0, 245, 255, 0.3)", clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)"}}
          >
            <h4 style={{fontFamily: "'Orbitron', monospace", fontSize: "12px", fontWeight: "bold", color: "var(--neon-cyan)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px"}}>
              <Shield size={16} /> NAMING YOUR SLUG
            </h4>
            <p style={{fontSize: "13px", color: "var(--ink)", lineHeight: 1.6}}>
              You can optionally type a custom name for your slug during minting. If you leave the name blank, the contract auto-names it based on element: <strong>INFERNO</strong> (Fire), <strong>TIDAL</strong> (Water), <strong>BOULDER</strong> (Earth), <strong>ZEPHYR</strong> (Air).
            </p>
          </motion.div>
        </div>
      )
    },
    {
      id: 3,
      title: "Leveling & Economy",
      short: "Dark Coins & Stats Growth",
      icon: <Zap size={16} />,
      content: (
        <div style={{display: "flex", flexDirection: "column", gap: "24px"}}>
          <p style={{fontSize: "14px", lineHeight: 1.7, color: "var(--ink)"}}>
            Slugs level from 1 to <strong>50</strong>. Each level up recalculates HP and ATK on-chain using element-specific growth percentages. The cost to level up is <strong>current level × 10 Dark Coins</strong>.
          </p>

          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px"}}>
            <TiltCard>
              <div style={{display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px"}}>
                <div style={{width: "40px", height: "40px", borderRadius: "8px", background: "rgba(234, 179, 8, 0.1)", display: "flex", alignItems: "center", justifyContent: "center"}}>
                  <Coins size={20} color="#EAB308" />
                </div>
                <h4 style={{fontFamily: "'Orbitron', monospace", fontSize: "14px", fontWeight: "bold", color: "var(--ink)"}}>Dark Coins</h4>
              </div>
              <ul style={{fontSize: "12px", color: "var(--ink)", lineHeight: 1.8, paddingLeft: "16px", listStyleType: "disc"}}>
                <li>Start with <strong>350 coins</strong> on first load</li>
                <li>Win PvE: <strong>20–40 base coins</strong>, scales +15%/level</li>
                <li>Premium mint bonus: <strong>+100 coins</strong></li>
                <li>Quantum Spin can award <strong>50–300 coins</strong> (70% chance)</li>
                <li>Stored in browser localStorage</li>
              </ul>
            </TiltCard>
            <TiltCard>
              <div style={{display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px"}}>
                <div style={{width: "40px", height: "40px", borderRadius: "8px", background: "rgba(0, 245, 255, 0.1)", display: "flex", alignItems: "center", justifyContent: "center"}}>
                  <Zap size={20} color="#00f5ff" />
                </div>
                <h4 style={{fontFamily: "'Orbitron', monospace", fontSize: "14px", fontWeight: "bold", color: "var(--ink)"}}>Level Up Costs</h4>
              </div>
              <div style={{fontSize: "12px", color: "var(--ink)", lineHeight: 1.8}}>
                <strong>Level × 10 coins</strong> per level up:<br/>
                Lv.1→2: <strong>10</strong> coins<br/>
                Lv.5→6: <strong>50</strong> coins<br/>
                Lv.10→11: <strong>100</strong> coins<br/>
                Lv.25→26: <strong>250</strong> coins<br/>
                Lv.49→50: <strong>490</strong> coins
              </div>
            </TiltCard>
          </div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            style={{padding: "20px", background: "rgba(0, 245, 255, 0.05)", border: "1px solid rgba(0, 245, 255, 0.3)", clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)"}}
          >
            <h4 style={{fontFamily: "'Orbitron', monospace", fontSize: "12px", fontWeight: "bold", color: "var(--neon-cyan)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px"}}>
              📈 GROWTH PER LEVEL (APPLIED ON-CHAIN)
            </h4>
            <div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px"}}>
              <div style={{fontSize: "12px", color: "var(--ink)", textAlign: "center", padding: "12px", background: "var(--bg-secondary)", border: "1px solid var(--surface-border)"}}>
                🔥 <strong>Fire</strong><br/>HP +1%/lvl<br/>ATK +4%/lvl<br/><span style={{fontSize: "10px", color: "var(--ink-dim)"}}>Lv50: 127 HP / 59 ATK</span>
              </div>
              <div style={{fontSize: "12px", color: "var(--ink)", textAlign: "center", padding: "12px", background: "var(--bg-secondary)", border: "1px solid var(--surface-border)"}}>
                💧 <strong>Water</strong><br/>HP +3%/lvl<br/>ATK +2%/lvl<br/><span style={{fontSize: "10px", color: "var(--ink-dim)"}}>Lv50: 296 HP / 27 ATK</span>
              </div>
              <div style={{fontSize: "12px", color: "var(--ink)", textAlign: "center", padding: "12px", background: "var(--bg-secondary)", border: "1px solid var(--surface-border)"}}>
                ⛰️ <strong>Earth</strong><br/>HP +4%/lvl<br/>ATK +1%/lvl<br/><span style={{fontSize: "10px", color: "var(--ink-dim)"}}>Lv50: 384 HP / 14 ATK</span>
              </div>
              <div style={{fontSize: "12px", color: "var(--ink)", textAlign: "center", padding: "12px", background: "var(--bg-secondary)", border: "1px solid var(--surface-border)"}}>
                🌀 <strong>Air</strong><br/>HP +2%/lvl<br/>ATK +3%/lvl<br/><span style={{fontSize: "10px", color: "var(--ink-dim)"}}>Lv50: 207 HP / 39 ATK</span>
              </div>
            </div>
            <p style={{fontSize: "11px", color: "var(--ink-dim)", marginTop: "12px", fontStyle: "italic"}}>
              Formula: final_stat = base + (base × growth_rate × (level - 1) / 1000). Growth is calculated on-chain by the smart contract.
            </p>
          </motion.div>
        </div>
      )
    },
    {
      id: 4,
      title: "PvE Training Grounds",
      short: "Earn Coins & Level Up",
      icon: <Shield size={16} />,
      content: (
        <div style={{display: "flex", flexDirection: "column", gap: "24px"}}>
          <p style={{fontSize: "14px", lineHeight: 1.7, color: "var(--ink)"}}>
            Training Grounds lets you fight auto-generated enemies to earn Dark Coins. Battles are <strong>HP-based round combat</strong> (max 10 rounds). No SUI cost, no energy cost.
          </p>

          <TiltCard>
            <h4 style={{fontFamily: "'Orbitron', monospace", fontSize: "13px", fontWeight: "bold", color: "var(--ink)", marginBottom: "16px"}}>⚔️ HOW PVE COMBAT WORKS</h4>
            <ul style={{display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "var(--ink)", lineHeight: 1.6, paddingLeft: "20px", listStyleType: "disc"}}>
              <li>Enemy spawns with an element (Fire/Water/Earth/Air) and stats based on that element's base stats (±30% variance).</li>
              <li>Each round: <strong>Damage = ATK × elemental multiplier</strong> (×1.15 / ×0.85 / ×1.0)</li>
              <li>Both slugs attack simultaneously — damage is subtracted from HP.</li>
              <li>Combat runs for <strong>max 10 rounds</strong>. KO = instant win/loss.</li>
              <li>If both alive after 10 rounds: <strong>higher remaining HP wins</strong>. If HP tied, <strong>higher ATK wins</strong>. If both tied, it's a draw.</li>
              <li>If both hit 0 HP on the same round, it's a <strong>draw</strong> (no reward, no penalty).</li>
            </ul>
          </TiltCard>

          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px"}}>
            <TiltCard color="var(--neon-cyan)">
              <h4 style={{fontFamily: "'Orbitron', monospace", fontSize: "12px", fontWeight: "bold", color: "var(--neon-cyan)", marginBottom: "12px"}}>🏆 WIN REWARDS</h4>
              <ul style={{fontSize: "12px", color: "var(--ink)", lineHeight: 1.8, paddingLeft: "16px", listStyleType: "disc"}}>
                <li>Base: <strong>20–40 coins</strong></li>
                <li>Scaled by slug level: <strong>+15% per level</strong></li>
                <li>Lv.1: ~20–40 coins</li>
                <li>Lv.10: ~47–94 coins</li>
                <li>Lv.25: ~92–184 coins</li>
              </ul>
            </TiltCard>
            <TiltCard color="var(--neon-orange)">
              <h4 style={{fontFamily: "'Orbitron', monospace", fontSize: "12px", fontWeight: "bold", color: "var(--neon-orange)", marginBottom: "12px"}}>💤 LOSS PENALTIES (SLEEP)</h4>
              <ul style={{fontSize: "12px", color: "var(--ink)", lineHeight: 1.8, paddingLeft: "16px", listStyleType: "disc"}}>
                <li>1st consecutive loss: <strong>5 min sleep</strong></li>
                <li>2nd consecutive loss: <strong>15 min sleep</strong></li>
                <li>3rd+ consecutive loss: <strong>30 min sleep</strong></li>
                <li>Skip sleep: <strong>5 coins per minute</strong> remaining</li>
                <li>0 coins earned on loss</li>
              </ul>
            </TiltCard>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "PvP Wager Arena",
      short: "Double-Blind SUI Duels",
      icon: <BookOpen size={16} />,
      content: (
        <div style={{display: "flex", flexDirection: "column", gap: "24px"}}>
          <p style={{fontSize: "14px", lineHeight: 1.7, color: "var(--ink)"}}>
            PvP uses a <strong>double-blind commit-reveal</strong> pattern on-chain. Neither player can see the other's slug element before both players reveal. This makes element selection truly strategic.
          </p>

          <TiltCard color="var(--neon-orange)">
            <h4 style={{fontFamily: "'Orbitron', monospace", fontSize: "13px", fontWeight: "bold", color: "var(--neon-orange)", marginBottom: "16px"}}>📋 PVP STEP-BY-STEP:</h4>
            
            <ul style={{display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "var(--ink)", lineHeight: 1.6, paddingLeft: "20px", listStyleType: "decimal"}}>
              <li>
                <strong>Create Lobby:</strong> Player 1 selects a wager (<strong>1, 5, or 10 SUI</strong>), picks a slug, and submits a <strong>blake2b hash</strong> of their slug ID + a secret salt. SUI is locked in escrow on-chain.
              </li>
              <li>
                <strong>Join Lobby:</strong> Player 2 sees only the wager amount — <strong>NOT the opponent's element, stats, or slug</strong>. They submit their own hash + matching SUI wager.
              </li>
              <li>
                <strong>Reveal Phase:</strong> Both players reveal their slug ID + salt. The smart contract verifies each player's hash matches their revealed slug. Stats are read from the on-chain Slug object.
              </li>
              <li>
                <strong>On-Chain Combat:</strong> The contract runs HP-based round combat with elemental advantage (same ×1.15 / ×0.85 / ×1.0 system as PvE). Winner is determined on-chain.
              </li>
              <li>
                <strong>Winner Takes All:</strong> The entire 2× wager pool is sent to the winner's wallet. Draw = both get refunded.
              </li>
            </ul>
          </TiltCard>

          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px"}}>
            <TiltCard>
              <h4 style={{fontFamily: "'Orbitron', monospace", fontSize: "12px", fontWeight: "bold", color: "var(--ink)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px"}}>
                <Clock size={14} /> TIMEOUT PROTECTION
              </h4>
              <p style={{fontSize: "12px", color: "var(--ink)", lineHeight: 1.6}}>
                If a player doesn't reveal within <strong>3 minutes</strong> after both join, the other player can call <strong>claim_timeout</strong> to take the entire pot. This prevents griefing.
              </p>
            </TiltCard>
            <TiltCard>
              <h4 style={{fontFamily: "'Orbitron', monospace", fontSize: "12px", fontWeight: "bold", color: "var(--ink)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px"}}>
                <Shield size={14} /> CANCEL LOBBY
              </h4>
              <p style={{fontSize: "12px", color: "var(--ink)", lineHeight: 1.6}}>
                If no opponent has joined yet, Player 1 can cancel their lobby to get their SUI wager refunded in full. Once Player 2 joins, cancellation is no longer possible.
              </p>
            </TiltCard>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "Quantum Spin",
      short: "Daily Gacha — 0.05 SUI",
      icon: <Zap size={16} />,
      content: (
        <div style={{display: "flex", flexDirection: "column", gap: "24px"}}>
          <p style={{fontSize: "14px", lineHeight: 1.7, color: "var(--ink)"}}>
            The Quantum Reactor lets you spin once every <strong>24 hours</strong> for <strong>0.05 SUI</strong>. You can win slugs or Dark Coins.
          </p>

          <TiltCard color="var(--neon-cyan)">
            <h4 style={{fontFamily: "'Orbitron', monospace", fontSize: "13px", fontWeight: "bold", color: "var(--neon-cyan)", marginBottom: "16px"}}>🎰 SPIN REWARD TABLE</h4>
            <div style={{display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "var(--ink)"}}>
              <div style={{display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(0, 245, 255, 0.08)", border: "1px solid rgba(0, 245, 255, 0.15)"}}>
                <span>💧 Water Slug</span>
                <span style={{fontFamily: "'Orbitron', monospace", fontWeight: "bold", color: "var(--neon-cyan)"}}>5%</span>
              </div>
              <div style={{display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "var(--bg-secondary)", border: "1px solid var(--surface-border)"}}>
                <span>🌀 Air Slug</span>
                <span style={{fontFamily: "'Orbitron', monospace", fontWeight: "bold"}}>10%</span>
              </div>
              <div style={{display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "var(--bg-secondary)", border: "1px solid var(--surface-border)"}}>
                <span>🔥 Fire or 🌿 Earth Slug</span>
                <span style={{fontFamily: "'Orbitron', monospace", fontWeight: "bold"}}>15%</span>
              </div>
              <div style={{display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(234, 179, 8, 0.08)", border: "1px solid rgba(234, 179, 8, 0.15)"}}>
                <span>🪙 Dark Coins (50–300)</span>
                <span style={{fontFamily: "'Orbitron', monospace", fontWeight: "bold", color: "#EAB308"}}>70%</span>
              </div>
            </div>
            <p style={{fontSize: "11px", color: "var(--ink-dim)", marginTop: "12px", fontStyle: "italic"}}>
              Cooldown: 24 hours between spins. Enforced on-chain via SpinRegistry.
            </p>
          </TiltCard>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            style={{padding: "20px", background: "rgba(0, 245, 255, 0.05)", border: "1px solid rgba(0, 245, 255, 0.3)", clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)"}}
          >
            <h4 style={{fontFamily: "'Orbitron', monospace", fontSize: "12px", fontWeight: "bold", color: "var(--neon-cyan)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px"}}>
              🔥 ASCEND (BURN)
            </h4>
            <p style={{fontSize: "13px", color: "var(--ink)", lineHeight: 1.6}}>
              You can burn a slug to permanently destroy it and recover <strong>10% of the total Dark Coins</strong> you spent leveling it up. Useful for recycling unwanted slugs into resources.
            </p>
          </motion.div>
        </div>
      )
    },
  ];

  return (
    <div className="tab-panel active animate-fade-in pb-20">
      <div className="panel-header" style={{borderBottom: "none"}}>
        <div className="panel-header-inner" style={{margin: "0 auto", maxWidth: "1060px", textAlign: "center"}}>
          <div className="section-label" style={{justifyContent: "center", marginBottom: "16px"}}>
            <BookOpen size={14} style={{marginRight: "8px"}}/> OPERATOR HANDBOOK
          </div>
          <h2 className="section-title">Cavern Field Guide</h2>
          <p className="panel-desc" style={{margin: "10px auto 0", maxWidth: "600px"}}>
            Complete guide to Slugterra's mechanics — elements, minting, leveling, PvE combat, PvP wagers, and the Quantum Reactor. All values match the deployed Sui smart contract.
          </p>
        </div>
      </div>

      <div style={{maxWidth: "1060px", margin: "20px auto 0", display: "flex", flexWrap: "wrap", gap: "32px"}}>
        
        {/* Left Side: Chapter List */}
        <div style={{display: "flex", flexDirection: "column", gap: "12px", flex: "1 1 250px"}}>
          <div style={{fontFamily: "'Orbitron', monospace", fontSize: "10px", color: "var(--ink-dim)", letterSpacing: "2px", marginBottom: "4px"}}>
            TABLE OF CONTENTS
          </div>
          {chapters.map((ch) => {
            const isActive = activeChapter === ch.id;

            return (
              <motion.button
                key={ch.id}
                whileHover={{ scale: 1.03, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveChapter(ch.id)}
                style={{
                  background: isActive ? "var(--surface-border)" : "transparent",
                  border: `1px solid ${isActive ? "var(--ink)" : "var(--surface-border)"}`,
                  borderLeft: isActive ? "4px solid var(--neon-cyan)" : "1px solid var(--surface-border)",
                  padding: "16px",
                  clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.3s, border 0.3s"
                }}
              >
                <div style={{color: isActive ? "var(--neon-cyan)" : "var(--ink-dim)"}}>
                  {ch.icon}
                </div>
                <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
                  <span style={{fontFamily: "'Orbitron', monospace", fontSize: "12px", fontWeight: "bold", color: "var(--ink)"}}>
                    {ch.title}
                  </span>
                  <span style={{fontFamily: "'Orbitron', monospace", fontSize: "9px", letterSpacing: "1px", color: "var(--ink)", textTransform: "uppercase"}}>
                    {ch.short}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Right Side: Chapter Content */}
        <div className="hatchery-tier-card" style={{flex: "3 1 600px", background: "var(--panel-bg)", border: "1px solid var(--surface-border)", padding: "40px", clipPath: "polygon(16px 0%, 100% 0%, calc(100% - 16px) 100%, 0% 100%)", minHeight: "500px", display: "flex", flexDirection: "column"}}>
          <div style={{borderBottom: "1px solid var(--surface-border)", paddingBottom: "16px", marginBottom: "24px"}}>
            <h3 style={{fontFamily: "'Orbitron', monospace", fontSize: "24px", fontWeight: "900", color: "var(--ink)", marginBottom: "8px", textTransform: "uppercase"}}>
              {chapters.find((ch) => ch.id === activeChapter)?.title}
            </h3>
            <span style={{fontFamily: "'Orbitron', monospace", fontSize: "10px", letterSpacing: "3px", color: "var(--neon-cyan)", textTransform: "uppercase"}}>
              CHAPTER 0{activeChapter} DATA FILE
            </span>
          </div>

          <div style={{flexGrow: 1}}>
            <motion.div
              key={activeChapter}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {chapters.find((ch) => ch.id === activeChapter)?.content}
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  );
};
