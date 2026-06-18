import React, { useState, useEffect, useRef } from "react";
import { SuiWalletProvider } from "./components/WalletProvider";
import { GameStateProvider } from "./context/GameState";
import { SceneDirectorProvider } from "./context/SceneDirector";
import { CommandCenter } from "./components/CommandCenter";
import { Incubator } from "./components/Incubator";

import { CavernArena } from "./components/CavernArena";
import { FieldGuide } from "./components/FieldGuide";
import { Leaderboard } from "./components/Leaderboard";
import { ProfileTab } from "./components/ProfileTab";
import { ProfileModal } from "./components/ProfileModal";
import { QuantumReactor } from "./components/QuantumReactor";
import { Dashboard } from "./components/Dashboard";
import { BackgroundParticles } from "./components/BackgroundParticles";
import { GlobalCanvas } from "./components/scene/environments/GlobalCanvas";
import { ConnectButton, useSuiClientContext } from "@mysten/dapp-kit";
import { Radar, Swords, Sparkles, BookOpen, Trophy, LayoutDashboard, User, Zap } from "lucide-react";

const MainAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "command" | "incubator" | "arena" | "leaderboard" | "guide" | "profile" | "quantum">("dashboard");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = document.getElementById('cursor');
    const cursorRing = document.getElementById('cursor-ring');
    if (!cursor || !cursorRing) return;

    let mx = -200, my = -200, rx = -200, ry = -200;
    let visible = false;
    cursor.style.opacity = '0';
    cursorRing.style.opacity = '0';

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (!visible) { visible = true; cursor.style.opacity = '1'; cursorRing.style.opacity = '1'; }
    };

    const animate = () => {
      rx += (mx - rx) * 0.15;
      ry += (my - ry) * 0.15;
      cursor.style.left = mx + 'px';
      cursor.style.top = my + 'px';
      cursorRing.style.left = rx + 'px';
      cursorRing.style.top = ry + 'px';
      requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', onMove);
    const frame = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const tabMap: Record<string, string> = {
        'hatchery': 'incubator',
        'command': 'command',
      };
      const tab = tabMap[detail] || detail;
      setActiveTab(tab as any);
    };
    window.addEventListener('switch-tab', handler);
    return () => window.removeEventListener('switch-tab', handler);
  }, []);

  const { network } = useSuiClientContext();

  const navigationItems = [
        { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "command", label: "Arsenal", icon: <Radar className="w-5 h-5" /> },
    { id: "incubator", label: "Hatchery", icon: <Sparkles className="w-5 h-5" /> },

    { id: "quantum", label: "Reactor", icon: <Zap className="w-5 h-5 text-yellow-400" /> },
    { id: "arena", label: "Arena", icon: <Swords className="w-5 h-5" /> },
    { id: "leaderboard", label: "Ranks", icon: <Trophy className="w-5 h-5" /> },
    { id: "guide", label: "Guide", icon: <BookOpen className="w-5 h-5" /> },
    { id: "profile", label: "Profile", icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="bg-transparent text-on-background font-body-md h-screen w-screen overflow-hidden flex flex-col selection:bg-primary-container selection:text-on-primary-container relative">
      <div id="cursor" ref={cursorRef}></div>
      <div id="cursor-ring" ref={cursorRingRef}></div>
      <BackgroundParticles />
      <GlobalCanvas activeTab={activeTab} />
      
      {/* Top Floating HUD: Aethera Style */}
      <header id="app-header">
        <div className="hdr-left">
          <div className="hdr-logo-mark"></div>
          <div className="hdr-brand">
            <div className="hdr-brand-sub">MISSION PROTOCOL</div>
            <div className="hdr-brand-name">SLUG<span>TERRA</span></div>
          </div>
        </div>
        <div className="hdr-center">
          <div className="hdr-status"><div className="status-dot"></div>SYS ONLINE</div>
        </div>
        <div className="hdr-right">
          <div className="hdr-network">{network ? network.charAt(0).toUpperCase() + network.slice(1) : ''}</div>
          <ConnectButton 
            connectText="CONNECT ENGINE" 
            style={{
              background: "transparent",
              color: "var(--neon-cyan)",
              border: "none",
              fontFamily: "'Orbitron', monospace",
              fontSize: "11px",
              fontWeight: "bold",
              letterSpacing: "2px",
              cursor: "pointer"
            }}
          />
        </div>
      </header>

      {/* Main Content Area - Aethera Shell */}
      <div id="app-shell">
        <div key={activeTab} className="tab-panel active animate-fade-in transition-all duration-300">
                    {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "command" && <CommandCenter />}
          {activeTab === "incubator" && <Incubator />}

          {activeTab === "quantum" && <QuantumReactor />}
          {activeTab === "arena" && <CavernArena />}
          {activeTab === "leaderboard" && <Leaderboard />}
          {activeTab === "guide" && <FieldGuide />}
          {activeTab === "profile" && <ProfileTab />}
        </div>
      </div>

      {/* Bottom Floating HUD Navigation */}
      <nav id="bottom-nav">
        {navigationItems.map((item, index) => {
          const isActive = activeTab === item.id;
          return (
            <React.Fragment key={item.id}>
              <button
                onClick={() => setActiveTab(item.id as any)}
                className={`bnav-btn ${isActive ? 'active' : ''}`}
                data-tab={item.id}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
              {index < navigationItems.length - 1 && <div className="bnav-sep"></div>}
            </React.Fragment>
          );
        })}
      </nav>

      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <SuiWalletProvider>
      <GameStateProvider>
        <SceneDirectorProvider>
          <MainAppContent />
        </SceneDirectorProvider>
      </GameStateProvider>
    </SuiWalletProvider>
  );
};

export default App;
