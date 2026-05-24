import React, { useState } from "react";
import { SuiWalletProvider } from "./components/WalletProvider";
import { GameStateProvider, useGameState } from "./context/GameState";
import { CommandCenter } from "./components/CommandCenter";
import { Incubator } from "./components/Incubator";
import { MutationLab } from "./components/MutationLab";
import { FusionChamber } from "./components/FusionChamber";
import { CavernArena } from "./components/CavernArena";
import { FieldGuide } from "./components/FieldGuide";
import { Leaderboard } from "./components/Leaderboard";
import { ProfileModal } from "./components/ProfileModal";
import { Dashboard } from "./components/Dashboard";
import { ConnectButton, useSuiClientContext } from "@mysten/dapp-kit";
import { Radar, Swords, HelpCircle, Shield, Menu, X, Wallet, Sparkles, BookOpen, FlaskConical, Layers, Volume2, VolumeX, User, Trophy, LayoutDashboard } from "lucide-react";

const MainAppContent: React.FC = () => {
  const { soundMuted, toggleSoundMute } = useGameState();
  const [activeTab, setActiveTab] = useState<"dashboard" | "command" | "incubator" | "mutation" | "fusion" | "arena" | "leaderboard" | "guide">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const { network } = useSuiClientContext();

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, desc: "Operator Overview" },
    { id: "command", label: "Canister Arsenal", icon: <Radar className="w-5 h-5" />, desc: "Blueprints & Levels" },
    { id: "incubator", label: "Canister Hatchery", icon: <Sparkles className="w-5 h-5" />, desc: "Chest Materializer" },
    { id: "mutation", label: "Mutation Lab", icon: <FlaskConical className="w-5 h-5" />, desc: "Dark Water Bubbler" },
    { id: "fusion", label: "Fusion Chamber", icon: <Layers className="w-5 h-5" />, desc: "Element Fusions" },
    { id: "arena", label: "Cavern Arena", icon: <Swords className="w-5 h-5" />, desc: "Wagers & Clans" },
    { id: "leaderboard", label: "Leaderboard", icon: <Trophy className="w-5 h-5" />, desc: "Global Ranks" },
    { id: "guide", label: "Field Guide", icon: <BookOpen className="w-5 h-5" />, desc: "How to Clash Guide" },
  ];

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Application Bar */}
      <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-8 h-20 border-b border-outline-variant bg-surface-container-high/60 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2.5 hover:bg-surface-variant rounded-xl transition-colors text-on-surface z-50"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 bg-primary-container rounded-sm shadow-[0_0_12px_rgba(56,189,248,0.6)] animate-pulse"></span>
            <div>
              <h1 className="text-headline-md font-headline-md font-black tracking-tighter text-primary-container uppercase select-none text-lg md:text-2xl leading-none">
                SLUGTERRA
              </h1>
              <span className="text-[9px] font-label-caps text-outline tracking-widest font-bold">COMBAT LABORATORY METAMORPHOSIS</span>
            </div>
          </div>
        </div>

        {/* Cyberpunk Wallet container & Sound manager controller */}
        <div className="flex items-center gap-4">
          {/* Sound Synthesizer toggle */}
          <button
            onClick={toggleSoundMute}
            className="p-3 bg-surface-container-lowest border border-outline-variant hover:border-primary-container rounded-xl text-primary-container transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            title={soundMuted ? "Unmute Lab Synth" : "Mute Lab Synth"}
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-error" /> : <Volume2 className="w-4 h-4 text-primary-container animate-pulse" />}
            <span className="hidden sm:inline font-label-caps text-[9px] font-black">SYNTH</span>
          </button>

          {/* Profile Modal Trigger */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="p-3 bg-surface-container-lowest border border-outline-variant hover:border-primary-container rounded-xl text-on-surface transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <User className="w-4 h-4 text-yellow-500" />
            <span className="hidden sm:inline font-label-caps text-[9px] font-black">PROFILE</span>
          </button>

          <div className="custom-wallet-parent flex items-center bg-surface-container-lowest/80 backdrop-blur-sm border border-outline-variant rounded-xl overflow-hidden font-label-caps text-xs">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 border-r border-outline-variant text-on-surface-variant font-bold">
              <Wallet className="w-3.5 h-3.5 text-primary-container" />
              <span>{network.toUpperCase()} SUI</span>
            </div>
            <div className="px-2 py-1 bg-surface-container-lowest">
              <ConnectButton 
                connectText="CONNECT ENGINE" 
                style={{
                  background: "transparent",
                  color: "#38bdf8",
                  border: "none",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  fontWeight: "bold",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 pt-20 relative">
        
        {/* Navigation Sidebar (Desktop & Mobile) */}
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)}></div>
            <aside className="fixed left-0 top-20 bottom-0 w-68 flex flex-col py-8 px-4 border-r border-outline-variant bg-surface-container-low/95 backdrop-blur-xl select-none z-40 transition-transform duration-300">
              <div className="px-4 pb-6 border-b border-outline-variant/30 mb-6 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary-container" />
                  <h2 className="font-label-caps text-xs text-primary-container font-black tracking-wide">METAMORPH CONTROL</h2>
                </div>
                <p className="text-[9px] font-label-caps text-outline font-bold">SUI BIO-CANISTER GRID</p>
              </div>

              <nav className="flex-1 space-y-2">
                {navigationItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-left transition-all ${
                        isActive
                          ? "bg-primary-container/10 border border-primary-container text-primary-container shadow-[0_0_20px_rgba(56,189,248,0.15)] font-bold scale-102"
                          : "text-on-surface-variant hover:text-primary-container border border-transparent hover:border-outline-variant/30 hover:bg-surface-variant/20"
                      }`}
                    >
                      {item.icon}
                      <div className="flex flex-col leading-none">
                        <span className="font-headline-md text-xs tracking-tight">{item.label}</span>
                        <span className="text-[8px] font-label-caps text-outline uppercase mt-1">{item.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-auto px-4 space-y-4">
                <div className="flex gap-4 pt-4 border-t border-outline-variant/30 text-outline">
                  <button 
                    onClick={() => { setActiveTab("guide"); setSidebarOpen(false); }}
                    className="hover:text-primary-container transition-colors flex items-center gap-1 text-[10px] font-label-caps"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Field Handbook</span>
                  </button>
                </div>
              </div>
            </aside>
          </>
        )}

        {/* Main Content Area */}
        <main className={`flex-1 ${sidebarOpen ? "lg:ml-68" : ""} p-8 md:p-12 cavern-texture min-h-[calc(100vh-80px)] relative overflow-x-hidden overflow-y-auto`}>
          {/* Decorative Glowing Pipes Background Layer */}
          <div className="absolute top-0 right-0 w-[1px] bg-primary-container/10 h-full blur-[2px]"></div>
          <div className="absolute top-1/4 -right-10 w-48 h-1 bg-primary-container/20 blur-[4px] rotate-45"></div>
          <div className="absolute bottom-10 left-0 w-64 h-2 bg-primary-container/5 blur-[12px]"></div>

          <div className="animate-fade-in transition-all duration-300">
            {activeTab === "dashboard" && <Dashboard />}
            {activeTab === "command" && <CommandCenter />}
            {activeTab === "incubator" && <Incubator />}
            {activeTab === "mutation" && <MutationLab />}
            {activeTab === "fusion" && <FusionChamber />}
            {activeTab === "arena" && <CavernArena />}
            {activeTab === "leaderboard" && <Leaderboard />}
            {activeTab === "guide" && <FieldGuide />}
          </div>
        </main>

        {/* Profile Modal Rendering */}
        {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}

      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <SuiWalletProvider>
      <GameStateProvider>
        <MainAppContent />
      </GameStateProvider>
    </SuiWalletProvider>
  );
};

export default App;
