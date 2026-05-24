import React, { useState } from "react";
import { BookOpen, Shield, Flame, Droplets, Mountain, Wind, Skull, Sparkles, Coins, Zap } from "lucide-react";
import { motion } from "framer-motion";

export const FieldGuide: React.FC = () => {
  const [activeChapter, setActiveChapter] = useState<number>(1);

  const chapters = [
    {
      id: 1,
      title: "Biological Affinity Wheel",
      short: "Element Interactions",
      icon: <Flame className="w-4 h-4 text-red-500" />,
      content: (
        <div className="space-y-6">
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            Every Protoform Slug possesses an **Elemental Affinity** that aligns with one of the four cardinal forces of nature. Inside the combat grid, these elements behave in a tactical **Rock-Paper-Scissors cycle**:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl text-center space-y-2">
              <Flame className="w-8 h-8 text-red-500 mx-auto" />
              <h4 className="font-label-caps text-xs font-bold text-on-surface">🔥 FIRE CORE</h4>
              <p className="text-[11px] text-outline">Consumes **Air Core** elements, gaining a **+6 Power Advantage**. Weak against **Water Core**.</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl text-center space-y-2">
              <Mountain className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="font-label-caps text-xs font-bold text-on-surface">⛰️ EARTH CORE</h4>
              <p className="text-[11px] text-outline">Absorbs **Water Core** elements, gaining a **+6 Power Advantage**. Weak against **Air Core**.</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl text-center space-y-2">
              <Droplets className="w-8 h-8 text-cyan-400 mx-auto" />
              <h4 className="font-label-caps text-xs font-bold text-on-surface">💧 WATER CORE</h4>
              <p className="text-[11px] text-outline">Extinguishes **Fire Core** elements, gaining a **+6 Power Advantage**. Weak against **Earth Core**.</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl text-center space-y-2">
              <Wind className="w-8 h-8 text-teal-300 mx-auto" />
              <h4 className="font-label-caps text-xs font-bold text-on-surface">🌀 AIR CORE</h4>
              <p className="text-[11px] text-outline">Erodes **Earth Core** elements, gaining a **+6 Power Advantage**. Weak against **Fire Core**.</p>
            </div>
          </div>

          <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-2">
            <h4 className="font-label-caps text-xs font-black text-purple-400 flex items-center gap-2">
              <Skull className="w-4 h-4" /> THE SHADOW CORRUPTED BIOME (GHOULS)
            </h4>
            <p className="text-xs text-purple-300 leading-relaxed">
              When a slug undergoes **Ghoul Metamorphosis** in the Mutation Lab by injecting Dark Water, its basic core shifts permanently into a **Shadow Core** (Shadow Fire, Shadow Earth, etc.). In addition to gaining a massive permanent `+5` base power and `+10` HP boost, **Shadow Cores completely dominate all four basic element types**, giving your slug a **+8 Shadow Power Advantage** regardless of basic counter matchups!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "RPG Level Engine",
      short: "Levels & Progression",
      icon: <Zap className="w-4 h-4 text-yellow-400" />,
      content: (
        <div className="space-y-6">
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            Every battle in the Cavern Arena awards you valuable **Dark Coins**. These resources are critical to unlocking your slug's maximum potential (Level 1 to 100).
          </p>

          <div className="grid grid-cols-1 gap-6">

            <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-950/30 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                  <Coins className="w-4 h-4 text-yellow-500" />
                </div>
                <h4 className="font-label-caps text-xs font-bold text-on-surface">Dark Coins Fuel</h4>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Dark Coins are minted directly by winning matches. These coins are burned during the level-up process.
              </p>
              <div className="bg-surface-container p-3 rounded-lg border border-outline-variant font-body-md text-[10px] text-yellow-500">
                Cost per Level: **Common: 50 | Rare: 100 | Epic: 150 | Legendary: 250** coins
              </div>
            </div>
          </div>

          <div className="p-4 bg-primary-container/10 border border-primary-container/20 rounded-xl">
            <h4 className="font-label-caps text-xs font-bold text-primary-container mb-1">💪 LEVEL UP REWARD VALUE</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              When you click **Level Up** in the CommandCenter (Dashboard) profile slot, the spent coins are burned and your slug's level increments by 1 (max level 100), rewarding a permanent **+5 base power boost**!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "SUI Gas Sponsor Engine",
      short: "Zero Gas-Fee Loans",
      icon: <Shield className="w-4 h-4 text-primary-container" />,
      content: (
        <div className="space-y-6">
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            One of the biggest hurdles of Web3 is having to buy SUI tokens just to pay for gas to mint your very first item. Slugterra solves this completely!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center bg-surface-variant mx-auto font-black text-xs text-primary-container">1</div>
              <h4 className="font-label-caps text-[10px] font-bold text-on-surface">FREE START REQUEST</h4>
              <p className="text-[10px] text-outline">You choose a Free Mint. SUI network detects an empty wallet balances slot.</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center bg-surface-variant mx-auto font-black text-xs text-primary-container">2</div>
              <h4 className="font-label-caps text-[10px] font-bold text-on-surface">SPONSORED LOAN BOX</h4>
              <p className="text-[10px] text-outline">Our backend gas sponsor pool automatically pays for the gas transaction fee in the background.</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center bg-surface-variant mx-auto font-black text-xs text-primary-container">3</div>
              <h4 className="font-label-caps text-[10px] font-bold text-on-surface">DECENTRALIZED MINT</h4>
              <p className="text-[10px] text-outline">The transaction confirms live on-chain, and your Protoform is transferred directly into your wallet!</p>
            </div>
          </div>

          <p className="text-xs text-on-surface-variant text-center font-label-caps opacity-80">
            🌟 This means *anyone* can connect their SUI wallet and start playing immediately without paying a single dime!
          </p>
        </div>
      )
    },
    {
      id: 4,
      title: "Multiplayer Wager Arenas",
      short: "On-Chain SUI Wagers",
      icon: <BookOpen className="w-4 h-4 text-cyan-400" />,
      content: (
        <div className="space-y-6">
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            For advanced operators looking for true high-stakes competition, the **PVP Matchmaker** connects players from around the world to wage real SUI tokens.
          </p>

          <div className="bg-surface-container-lowest border-2 border-primary-container/30 p-5 rounded-2xl space-y-4">
            <h4 className="font-label-caps text-xs font-black text-primary-container">Decentralized Matchmaking Logic:</h4>
            
            <ul className="space-y-3 text-xs text-on-surface-variant list-disc pl-5 leading-relaxed">
              <li>
                **Select Wager Presets:** When creating or joining a matchmaking lobby, operators select one of three preset wager levels: **1 SUI, 5 SUI, or 10 SUI**.
              </li>
              <li>
                **Shared Wager Pool:** Player 1 creates a lobby and locks their preset deposit (e.g. 1 SUI) into the contract's shared object pool.
              </li>
              <li>
                **Pool Matching:** Player 2 enters the lobby with a matching SUI wager. The shared lobby pool now aggregates **2x the SUI wager** (e.g. 2 SUI total).
              </li>
              <li>
                **Pure On-Chain Duel:** The Move smart contract immediately resolves combat inside the transaction block based on elemental power matrices.
              </li>
              <li>
                **Winner Takes All:** The total wager pool is directly sent to the winner's wallet. The winner also claims a premium combat reward of **+60 Dark Coins**!
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "Dark Water & Mutation Lab",
      short: "Corruption & Ghouls",
      icon: <Skull className="w-4 h-4 text-purple-400" />,
      content: (
        <div className="space-y-6">
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            Unleash the forbidden power of **Dark Water Corruption** inside the high-tech Mutation Lab. Transforming your slug shifts its power tier, but introduces dangerous volatility.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-950/30 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="font-label-caps text-xs font-bold text-on-surface">1. Dark Injections</h4>
              <p className="text-[11px] text-outline leading-relaxed">
                Inject Dark Water (costing SUI) to corrupt the slug by **+12% to +26%** per dose. Each bubble increases stats cleanly by **+1 Power** and **+2 Max HP** for balanced, natural scaling.
              </p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-red-950/30 border border-red-500/30 flex items-center justify-center text-red-400">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="font-label-caps text-xs font-bold text-on-surface">2. Quantum Volatility</h4>
              <p className="text-[11px] text-outline leading-relaxed">
                Crossing **50% Corruption** makes the reactor volatile, triggering active glitch chances:
                <br />• **30% Critical Surge**: Deals double damage!
                <br />• **15% Reactor Backfire**: Output drops by 30% or deals self-damage (-15 HP).
              </p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-fuchsia-950/30 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400">
                <Skull className="w-4 h-4" />
              </div>
              <h4 className="font-label-caps text-xs font-bold text-on-surface">3. Ghoul Awakening</h4>
              <p className="text-[11px] text-outline leading-relaxed">
                At **100% Corruption**, use a **Mutation Core** to permanently transform the slug into a **Ghoul (Shadow Class)**.
                <br />• Core changes permanently to a dominant **Shadow element**.
                <br />• Receives **+5 Power, +10 Max HP**, **20% Life-Steal**, and special **Shadow Finishers**.
              </p>
            </div>
          </div>

          <div className="p-4 bg-purple-950/35 border-2 border-purple-500/40 rounded-xl">
            <h4 className="font-label-caps text-xs font-bold text-purple-400 flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 animate-pulse" /> COSMIC SHADOW ADVANTAGE
            </h4>
            <p className="text-xs text-purple-200 leading-relaxed">
              Shadow elements completely ignore the basic elemental affinity wheel! A Shadow Core gains an absolute **+8 Shadow Power Advantage** against any basic core (Fire, Water, Earth, or Air) regardless of typical element counters.
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-10 relative z-10 py-4 max-w-5xl mx-auto">
      {/* View Header */}
      <header className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container/10 border border-primary-container/20 rounded-full font-label-caps text-xs text-primary-container">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Operator Handbook</span>
        </div>
        <h2 className="text-headline-xl font-headline-xl font-black uppercase tracking-tight text-on-background">
          Cavern Field Guide
        </h2>
        <p className="text-body-md text-on-surface-variant">
          Master elemental matrices, SUI gas loan mechanics, RPG leveling pathways, and secure wagering rules to dominate the deep caverns.
        </p>
      </header>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Chapter List Selection (4 columns) */}
        <aside className="lg:col-span-4 space-y-3">
          <span className="block font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest pl-1">
            HANDBOOK TABLE OF CONTENTS
          </span>
          <div className="space-y-2">
            {chapters.map((ch) => {
              const isActive = activeChapter === ch.id;

              return (
                <motion.button
                  key={ch.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveChapter(ch.id)}
                  className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all group ${
                    isActive
                      ? "bg-primary-container/10 border-primary-container text-primary-container shadow-[0_0_15px_rgba(56,189,248,0.1)] font-bold scale-102"
                      : "bg-surface-container-low border-outline-variant text-on-surface hover:text-primary-container hover:border-on-surface-variant"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {ch.icon}
                    <div className="flex flex-col">
                      <span className="font-headline-md text-xs group-hover:text-primary-container transition-colors">
                        {ch.title}
                      </span>
                      <span className="text-[9px] font-label-caps text-outline uppercase mt-0.5">
                        {ch.short}
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </aside>

        {/* Right Side: Chapter Content Display (8 columns) */}
        <main className="lg:col-span-8 bg-surface-container-low border border-outline-variant rounded-2xl p-8 shadow-xl min-h-[400px] flex flex-col">
          <div className="border-b border-outline-variant/30 pb-4 mb-6">
            <h3 className="text-headline-lg font-headline-lg uppercase text-on-surface tracking-tight">
              {chapters.find((ch) => ch.id === activeChapter)?.title}
            </h3>
            <span className="font-label-caps text-[9px] text-outline tracking-wider">
              CHAPTER 0{activeChapter} DATA FILE
            </span>
          </div>

          <div className="flex-grow">
            {chapters.find((ch) => ch.id === activeChapter)?.content}
          </div>
        </main>

      </div>
    </div>
  );
};
