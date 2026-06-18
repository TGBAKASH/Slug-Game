import React, { useState, useEffect } from "react";
import { useGameState } from "../context/GameState";
import { User, Coins, Wallet, Save, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export const ProfileTab: React.FC = () => {
  const { username, setUsername, darkCoins, walletMode } = useGameState();
  const [tempName, setTempName] = useState(username);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.body.getAttribute("data-theme") === "dark");
  }, []);

  const handleSave = () => {
    if (tempName.trim().length > 0) {
      setUsername(tempName.trim().substring(0, 15));
    }
  };

  const toggleTheme = () => {
    const isDark = document.body.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.body.removeAttribute("data-theme");
      setIsDarkMode(false);
    } else {
      document.body.setAttribute("data-theme", "dark");
      setIsDarkMode(true);
    }
  };

  return (
    <div className="tab-panel active animate-fade-in pb-20">
      <div className="panel-header" style={{borderBottom: "none"}}>
        <div className="panel-header-inner" style={{margin: "0 auto", maxWidth: "980px", textAlign: "center"}}>
          <div className="section-label" style={{justifyContent: "center"}}>OPERATOR SYSTEM</div>
          <h2 className="section-title">Profile Settings</h2>
          <p className="panel-desc" style={{margin: "10px auto 0"}}>Manage your on-chain identity and interface preferences.</p>
        </div>
      </div>

      <div className="hatchery-layout" style={{marginTop: "20px"}}>
        <div className="hatchery-tier-card" style={{background: "var(--panel-bg)", border: "1px solid rgba(0,0,0,0.15)", padding: "40px", clipPath: "polygon(16px 0%, 100% 0%, calc(100% - 16px) 100%, 0% 100%)", display: "flex", flexDirection: "column", gap: "32px"}}>
          
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(0,0,0,0.1)", paddingBottom: "16px"}}>
            <h3 style={{fontFamily: "'Orbitron', monospace", fontSize: "20px", fontWeight: "900", color: "var(--ink)", display: "flex", alignItems: "center", gap: "12px"}}>
              <User size={24} color="var(--neon-cyan)" /> OPERATOR PROFILE
            </h3>
          </div>

          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px"}}>
            
            {/* Identity Settings */}
            <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
              <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                <label style={{fontFamily: "'Orbitron', monospace", fontSize: "10px", letterSpacing: "2px", color: "var(--ink-dim)", fontWeight: "bold"}}>OPERATOR CALLSIGN</label>
                <div style={{display: "flex", gap: "8px"}}>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    maxLength={15}
                    style={{
                      flex: 1, background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.15)", borderRadius: "8px", padding: "12px 16px", color: "var(--ink)", outline: "none", fontFamily: "'Orbitron', monospace", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase"
                    }}
                    placeholder="ENTER CALLSIGN"
                  />
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    style={{
                      padding: "0 24px", background: "var(--ink)", color: "var(--bg)", borderRadius: "8px", border: "none", cursor: "pointer", fontFamily: "'Orbitron', monospace", fontSize: "11px", fontWeight: "bold", letterSpacing: "2px", display: "flex", alignItems: "center", gap: "8px"
                    }}
                  >
                    <Save size={14} /> SAVE
                  </motion.button>
                </div>
                <p style={{fontSize: "11px", color: "var(--ink-dim)"}}>This callsign is used in PVP matchmaking and leaderboards.</p>
              </div>

              {/* Theme Toggle */}
              <div style={{display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px"}}>
                <label style={{fontFamily: "'Orbitron', monospace", fontSize: "10px", letterSpacing: "2px", color: "var(--ink-dim)", fontWeight: "bold"}}>INTERFACE THEME</label>
                <div 
                  onClick={toggleTheme}
                  style={{
                    background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.15)", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "background 0.3s"
                  }}
                >
                  <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                    {isDarkMode ? <Moon size={20} color="#BF00FF" /> : <Sun size={20} color="#FF6B00" />}
                    <div style={{display: "flex", flexDirection: "column"}}>
                      <span style={{fontFamily: "'Orbitron', monospace", fontSize: "12px", fontWeight: "bold", color: "var(--ink)"}}>
                        {isDarkMode ? "DARK MATTER" : "AETHERA LIGHT"}
                      </span>
                      <span style={{fontSize: "10px", color: "var(--ink-dim)"}}>Toggle high-contrast environment</span>
                    </div>
                  </div>
                  
                  {/* Animated Toggle Switch */}
                  <div style={{width: "48px", height: "24px", borderRadius: "12px", background: isDarkMode ? "var(--neon-purple)" : "var(--neon-orange)", position: "relative", transition: "background 0.3s"}}>
                    <motion.div 
                      layout
                      animate={{ x: isDarkMode ? 24 : 0 }}
                      style={{
                        width: "20px", height: "20px", borderRadius: "50%", background: "#FFF", position: "absolute", top: "2px", left: "2px", boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Connection and Stats */}
            <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
              {/* Connection Status */}
              <div style={{background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.15)", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "12px"}}>
                <div style={{width: "40px", height: "40px", borderRadius: "8px", background: walletMode ? "rgba(57, 255, 20, 0.1)" : "rgba(255, 107, 0, 0.1)", display: "flex", alignItems: "center", justifyContent: "center"}}>
                  <Wallet size={20} color={walletMode ? "#39FF14" : "#FF6B00"} />
                </div>
                <div>
                  <div style={{fontFamily: "'Orbitron', monospace", fontSize: "10px", color: "var(--ink-dim)", letterSpacing: "2px", fontWeight: "bold"}}>CONNECTION STATUS</div>
                  <div style={{fontFamily: "'Orbitron', monospace", fontSize: "12px", fontWeight: "bold", color: walletMode ? "#39FF14" : "#FF6B00", marginTop: "4px"}}>
                    {walletMode ? "SUI TESTNET CONNECTED" : "LOCAL SIMULATOR"}
                  </div>
                </div>
              </div>

              {/* Resource Inventory */}
              <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                <label style={{fontFamily: "'Orbitron', monospace", fontSize: "10px", letterSpacing: "2px", color: "var(--ink-dim)", fontWeight: "bold"}}>RESOURCE INVENTORY</label>
                
                <div style={{background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.15)", borderRadius: "12px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                  <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                    <Coins size={16} color="#FFD700" />
                    <span style={{fontFamily: "'Orbitron', monospace", fontSize: "11px", fontWeight: "bold", color: "var(--ink)"}}>DARK COINS</span>
                  </div>
                  <span style={{fontFamily: "'Orbitron', monospace", fontSize: "16px", fontWeight: "900", color: "#FFD700"}}>{darkCoins}</span>
                </div>

              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
