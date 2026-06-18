import React from "react";
import { useGameState, ELEMENTS, BASE_STATS } from "../context/GameState";
import { Trophy, Swords, Heart, Zap, Shield } from "lucide-react";

export const Leaderboard: React.FC = () => {
  const { slugs, cavernRank, darkCoins, username } = useGameState();

  // Real stats computed from the player's actual on-chain slugs
  const totalWins = slugs.reduce((sum, s) => sum + (s.win_count || 0), 0);
  const totalLosses = slugs.reduce((sum, s) => sum + (s.loss_count || 0), 0);
  const winRate = totalWins + totalLosses > 0
    ? Math.round((totalWins / (totalWins + totalLosses)) * 100)
    : 0;
  const bestSlug = slugs.length > 0
    ? slugs.reduce((best, s) => (s.attack > best.attack ? s : best), slugs[0])
    : null;
  const avgLevel = slugs.length > 0
    ? Math.round(slugs.reduce((sum, s) => sum + s.level, 0) / slugs.length)
    : 0;

  return (
    <div className="tab-panel active animate-fade-in">
      <div className="panel-header" style={{borderBottom: "none"}}>
        <div className="panel-header-inner" style={{margin: "0 auto", maxWidth: "980px", textAlign: "center"}}>
          <div className="section-label" style={{justifyContent: "center"}}>OPERATOR METRICS</div>
          <h2 className="section-title">Rankings</h2>
          <p className="panel-desc" style={{margin: "10px auto 0"}}>Your combat performance across the Slugterra ecosystem.</p>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div style={{maxWidth: "980px", margin: "20px auto 24px", padding: "16px 24px", border: "1px solid var(--surface-border)", background: "var(--bg-secondary)", clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)", textAlign: "center"}}>
        <div style={{fontFamily: "'Orbitron', monospace", fontSize: "10px", letterSpacing: "3px", color: "var(--ink-dim)", marginBottom: "4px"}}>NETWORK SCAN</div>
        <div style={{fontFamily: "'Orbitron', monospace", fontSize: "14px", fontWeight: 900, color: "var(--ink)"}}>GLOBAL LEADERBOARD — COMING SOON</div>
        <p style={{fontSize: "12px", color: "var(--ink-dim)", marginTop: "8px", lineHeight: 1.6}}>
          On-chain global rankings will be enabled in a future update. Below are your real operator metrics from your deployed slugs.
        </p>
      </div>

      {/* Player Stats Grid */}
      <div className="hatchery-layout" style={{marginTop: "0"}}>
        <div style={{maxWidth: "980px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px"}}>

          {/* Cavern Rank */}
          <div className="hatchery-tier-card" style={{background: "var(--panel-bg)", border: "1px solid var(--surface-border)", padding: "24px", clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)", textAlign: "center"}}>
            <Trophy size={24} style={{color: "#EAB308", marginBottom: "12px"}} />
            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "9px", letterSpacing: "2px", color: "var(--ink-dim)", marginBottom: "6px"}}>CAVERN RANK</div>
            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "32px", fontWeight: 900, color: "var(--ink)"}}>{cavernRank}</div>
          </div>

          {/* Win Rate */}
          <div className="hatchery-tier-card" style={{background: "var(--panel-bg)", border: "1px solid var(--surface-border)", padding: "24px", clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)", textAlign: "center"}}>
            <Swords size={24} style={{color: "var(--ink)", marginBottom: "12px"}} />
            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "9px", letterSpacing: "2px", color: "var(--ink-dim)", marginBottom: "6px"}}>WIN RATE</div>
            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "32px", fontWeight: 900, color: winRate >= 50 ? "#16a34a" : "var(--ink)"}}>{winRate}%</div>
            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "10px", color: "var(--ink-dim)", marginTop: "4px"}}>{totalWins}W / {totalLosses}L</div>
          </div>

          {/* Total Slugs */}
          <div className="hatchery-tier-card" style={{background: "var(--panel-bg)", border: "1px solid var(--surface-border)", padding: "24px", clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)", textAlign: "center"}}>
            <Shield size={24} style={{color: "var(--ink)", marginBottom: "12px"}} />
            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "9px", letterSpacing: "2px", color: "var(--ink-dim)", marginBottom: "6px"}}>SLUG ARSENAL</div>
            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "32px", fontWeight: 900, color: "var(--ink)"}}>{slugs.length}</div>
            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "10px", color: "var(--ink-dim)", marginTop: "4px"}}>AVG LV. {avgLevel}</div>
          </div>

          {/* Dark Coins */}
          <div className="hatchery-tier-card" style={{background: "var(--panel-bg)", border: "1px solid var(--surface-border)", padding: "24px", clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)", textAlign: "center"}}>
            <Zap size={24} style={{color: "#EAB308", marginBottom: "12px"}} />
            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "9px", letterSpacing: "2px", color: "var(--ink-dim)", marginBottom: "6px"}}>DARK COINS</div>
            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "32px", fontWeight: 900, color: "var(--ink)"}}>{darkCoins}</div>
          </div>
        </div>

        {/* Slug Roster Table */}
        {slugs.length > 0 && (
          <div className="hatchery-tier-card" style={{maxWidth: "980px", margin: "20px auto 0", background: "var(--panel-bg)", border: "1px solid var(--surface-border)", padding: "24px", clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)", overflowX: "auto"}}>
            <div style={{fontFamily: "'Orbitron', monospace", fontSize: "10px", letterSpacing: "2px", color: "var(--ink-dim)", marginBottom: "16px"}}>DEPLOYED ROSTER</div>
            <table style={{width: "100%", textAlign: "center", borderCollapse: "collapse"}}>
              <thead>
                <tr style={{borderBottom: "1px solid var(--surface-border)"}}>
                  <th style={{padding: "12px", fontFamily: "'Orbitron', monospace", fontSize: "10px", color: "var(--ink-dim)", letterSpacing: "2px", fontWeight: "bold"}}>NAME</th>
                  <th style={{padding: "12px", fontFamily: "'Orbitron', monospace", fontSize: "10px", color: "var(--ink-dim)", letterSpacing: "2px", fontWeight: "bold"}}>ELEMENT</th>
                  <th style={{padding: "12px", fontFamily: "'Orbitron', monospace", fontSize: "10px", color: "var(--ink-dim)", letterSpacing: "2px", fontWeight: "bold"}}>LEVEL</th>
                  <th style={{padding: "12px", fontFamily: "'Orbitron', monospace", fontSize: "10px", color: "var(--ink-dim)", letterSpacing: "2px", fontWeight: "bold"}}>HP / ATK</th>
                  <th style={{padding: "12px", fontFamily: "'Orbitron', monospace", fontSize: "10px", color: "var(--ink-dim)", letterSpacing: "2px", fontWeight: "bold"}}>W / L</th>
                </tr>
              </thead>
              <tbody>
                {slugs.map((slug) => {
                  const el = ELEMENTS[slug.element];
                  const elementEmoji = slug.element === 1 ? "🔥" : slug.element === 2 ? "💧" : slug.element === 3 ? "🌿" : "💨";
                  return (
                    <tr key={slug.id} style={{borderBottom: "1px solid rgba(0,0,0,0.05)"}}>
                      <td style={{padding: "14px", fontFamily: "'Orbitron', monospace", fontSize: "13px", fontWeight: "bold", color: "var(--ink)"}}>{slug.name}</td>
                      <td style={{padding: "14px", fontFamily: "'Orbitron', monospace", fontSize: "12px", color: "var(--ink)"}}>{elementEmoji} {el?.name || "?"}</td>
                      <td style={{padding: "14px", fontFamily: "'Orbitron', monospace", fontSize: "14px", fontWeight: "bold", color: "var(--ink)"}}>{slug.level}</td>
                      <td style={{padding: "14px", fontFamily: "'Orbitron', monospace", fontSize: "12px", color: "var(--ink)"}}>
                        <span style={{display: "inline-flex", alignItems: "center", gap: "4px"}}><Heart size={12} /> {slug.hp}</span>
                        <span style={{margin: "0 8px", color: "var(--ink-dim)"}}>/</span>
                        <span style={{display: "inline-flex", alignItems: "center", gap: "4px"}}><Swords size={12} /> {slug.attack}</span>
                      </td>
                      <td style={{padding: "14px", fontFamily: "'Orbitron', monospace", fontSize: "12px", color: (slug.win_count || 0) >= (slug.loss_count || 0) ? "#16a34a" : "var(--ink)"}}>
                        {slug.win_count || 0} / {slug.loss_count || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
