import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useGameState, getSlugImage } from "../context/GameState";
import { Activity, Coins, Star, Trophy, Database } from "lucide-react";

export const Dashboard: React.FC = () => {
  const { slugs, darkCoins, fusionShards, cavernRank, username } = useGameState();
  const containerRef = useRef<HTMLDivElement>(null);

  // Background floating animations
  const bgProps1 = {
    animate: { y: [0, -30, 0] },
    transition: { repeat: Infinity, duration: 6, ease: "easeInOut" }
  };
  const bgProps2 = {
    animate: { y: [0, 40, 0] },
    transition: { repeat: Infinity, duration: 8, ease: "easeInOut" }
  };

  // Mouse hover tilt effect (simplified via framer-motion whileHover)
  const tiltProps = {
    whileHover: { scale: 1.05, rotateX: 5, rotateY: 5, zIndex: 10 },
    transition: { type: "spring" as const, stiffness: 300, damping: 20 }
  };

  const totalPower = slugs.reduce((acc, s) => acc + s.power, 0);
  const totalWins = slugs.reduce((acc, s) => acc + s.win_count, 0);

  return (
    <div ref={containerRef} className="w-full min-h-full p-8 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <motion.div {...bgProps1} className="absolute top-20 right-20 w-96 h-96 bg-primary-container/10 rounded-full blur-[100px] pointer-events-none" />
      <motion.div {...bgProps2} className="absolute bottom-40 left-10 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[80px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-12 relative z-10"
      >
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-container to-cyan-400 uppercase tracking-tighter">
            Operator Interface
          </h1>
          <p className="text-outline font-label-caps text-sm tracking-widest">
            Welcome back, {username}. Systems online.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div {...tiltProps} className="p-6 bg-surface-container-low border border-outline-variant rounded-2xl soft-glow-card flex flex-col gap-4 cursor-crosshair">
            <div className="flex items-center gap-3 text-cyan-400">
              <Activity className="w-6 h-6" />
              <h3 className="font-label-caps tracking-widest font-bold">Total Arsenal Power</h3>
            </div>
            <p className="text-5xl font-black text-on-surface">{totalPower}</p>
          </motion.div>

          <motion.div {...tiltProps} className="p-6 bg-surface-container-low border border-outline-variant rounded-2xl soft-glow-card flex flex-col gap-4 cursor-crosshair">
            <div className="flex items-center gap-3 text-fuchsia-400">
              <Trophy className="w-6 h-6" />
              <h3 className="font-label-caps tracking-widest font-bold">Total Victories</h3>
            </div>
            <p className="text-5xl font-black text-on-surface">{totalWins}</p>
          </motion.div>

          <motion.div {...tiltProps} className="p-6 bg-surface-container-low border border-outline-variant rounded-2xl soft-glow-card flex flex-col gap-4 cursor-crosshair">
            <div className="flex items-center gap-3 text-yellow-400">
              <Star className="w-6 h-6" />
              <h3 className="font-label-caps tracking-widest font-bold">Cavern Rank</h3>
            </div>
            <p className="text-5xl font-black text-on-surface">Rank {cavernRank}</p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12"
        >
          <div className="p-8 bg-surface-container-lowest border border-outline-variant rounded-3xl space-y-6">
            <h2 className="text-2xl font-black uppercase text-on-surface flex items-center gap-3">
              <Coins className="text-primary-container" /> Resource Vault
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-outline-variant/50 pb-2">
                <span className="text-outline font-label-caps">Dark Coins</span>
                <span className="text-xl font-bold">{darkCoins}</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant/50 pb-2">
                <span className="text-outline font-label-caps">Fusion Shards</span>
                <span className="text-xl font-bold">{fusionShards}</span>
              </div>
            </div>
          </div>

          <div className="p-8 bg-surface-container-lowest border border-outline-variant rounded-3xl space-y-6 flex flex-col">
            <h2 className="text-2xl font-black uppercase text-on-surface flex items-center gap-3">
              <Database className="text-emerald-400" /> Bio-Canister Arsenal
            </h2>
            <div className="flex-1 min-h-[200px] bg-surface-container-low border border-outline-variant/50 rounded-2xl p-4 overflow-y-auto">
              {slugs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-outline font-label-caps">
                  No canisters deployed. Hatch one in the Incubator.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {slugs.map((s, i) => (
                    <motion.div 
                      key={s.id} 
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.1, rotate: 5, filter: "brightness(1.2)" }}
                      className="aspect-square bg-surface border border-outline-variant rounded-xl p-2 flex flex-col items-center justify-center gap-2 cursor-pointer relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                      <img src={getSlugImage(s.element, false)} alt={s.name} className="w-full h-full object-contain relative z-0 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
                      <div className="absolute bottom-1 left-0 right-0 text-center z-20">
                        <span className="text-[10px] font-black uppercase tracking-wider block truncate px-1">{s.name}</span>
                        <span className="text-[8px] text-primary-container font-label-caps">LVL {s.level}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
        
        {/* Decorative footer spacer */}
        <div className="h-40" />
      </motion.div>
    </div>
  );
};
