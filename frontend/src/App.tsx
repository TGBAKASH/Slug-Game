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
import { ConnectButton, useSuiClientContext, useCurrentAccount } from "@mysten/dapp-kit";
import { Radar, Swords, Sparkles, BookOpen, Trophy, LayoutDashboard, User, Zap, Wallet, X } from "lucide-react";

const MainAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "command" | "incubator" | "arena" | "leaderboard" | "guide" | "profile" | "quantum">("dashboard");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWalletGate, setShowWalletGate] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);

  const account = useCurrentAccount();
  const isConnected = !!account;

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

  // ─── Wallet Gate: intercept all tab switches ───
  const switchTab = (tab: string) => {
    // Dashboard (scroll animation) is always accessible
    if (tab === "dashboard") {
      setActiveTab("dashboard");
      return;
    }

    // All other tabs require wallet connection
    if (!isConnected) {
      setPendingTab(tab);
      setShowWalletGate(true);
      return;
    }

    setActiveTab(tab as any);
  };

  // When wallet connects while gate is open, auto-navigate to pending tab
  useEffect(() => {
    if (isConnected && pendingTab) {
      setShowWalletGate(false);
      setActiveTab(pendingTab as any);
      setPendingTab(null);
    }
  }, [isConnected, pendingTab]);

  // Listen for custom switch-tab events (from scroll animation buttons)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const tabMap: Record<string, string> = {
        'hatchery': 'incubator',
        'command': 'command',
      };
      const tab = tabMap[detail] || detail;
      switchTab(tab);
    };
    window.addEventListener('switch-tab', handler);
    return () => window.removeEventListener('switch-tab', handler);
  }, [isConnected]); // re-bind when connection status changes

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
      {/* Skip heavy 3D/particle systems on Dashboard — the scroll animation has its own visuals */}
      {activeTab !== "dashboard" && <BackgroundParticles />}
      {activeTab !== "dashboard" && <GlobalCanvas activeTab={activeTab} />}
      
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
                onClick={() => switchTab(item.id)}
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

      {/* ═══════════ Wallet Gate Modal ═══════════ */}
      {showWalletGate && (
        <div 
          className="wallet-gate fixed inset-0 z-[99999] flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)', cursor: 'auto' }}
        >
          <div 
            className="relative max-w-md w-full mx-4 animate-fade-in"
            style={{
              background: '#0a0a0a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              clipPath: 'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)',
              padding: '48px 40px',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => { setShowWalletGate(false); setPendingTab(null); }}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer', padding: '4px',
              }}
            >
              <X size={18} />
            </button>

            {/* Icon */}
            <div style={{
              width: '64px', height: '64px', margin: '0 auto 24px',
              border: '2px solid rgba(255, 255, 255, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
              background: 'rgba(255, 255, 255, 0.03)',
            }}>
              <Wallet size={28} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
            </div>

            {/* Title */}
            <div style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: '10px',
              letterSpacing: '4px',
              color: 'rgba(255, 255, 255, 0.35)',
              textAlign: 'center',
              marginBottom: '8px',
            }}>
              AUTHENTICATION REQUIRED
            </div>
            <div style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: '20px',
              fontWeight: 900,
              color: '#ffffff',
              textAlign: 'center',
              marginBottom: '16px',
            }}>
              CONNECT WALLET
            </div>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
              lineHeight: 1.7,
              color: 'rgba(255, 255, 255, 0.45)',
              textAlign: 'center',
              marginBottom: '32px',
            }}>
              A Sui wallet connection is required to access the Slugterra protocol. 
              Connect your wallet to deploy slugs, enter the arena, and interact with the network.
            </p>

            {/* Connect Button */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ConnectButton 
                connectText="⬡ INITIALIZE CONNECTION"
                style={{
                  background: 'transparent',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  color: '#ffffff',
                  fontFamily: "'Orbitron', monospace",
                  fontSize: '12px',
                  fontWeight: 'bold',
                  letterSpacing: '2px',
                  padding: '14px 32px',
                  cursor: 'pointer',
                  clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                  transition: 'all 0.3s',
                }}
              />
            </div>

            {/* Footer hint */}
            <p style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: '9px',
              letterSpacing: '2px',
              color: 'rgba(255, 255, 255, 0.2)',
              textAlign: 'center',
              marginTop: '24px',
            }}>
              SUPPORTED: SUI WALLET • SUIET • ETHOS • NIGHTLY
            </p>
          </div>
        </div>
      )}
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
