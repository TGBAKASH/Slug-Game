import React from "react";
import { useGameState } from "../context/GameState";
import { Trophy, Swords, Medal } from "lucide-react";

export const Leaderboard: React.FC = () => {
  const { username, cavernRank, activeSlug } = useGameState();

  // Procedural dummy leaderboard data
  const dummyPlayers = [
    { name: "APEX PREDATOR", rank: 14, power: 1250, winRate: "88%", isCurrentPlayer: false },
    { name: "VOID_WALKER", rank: 12, power: 1050, winRate: "76%", isCurrentPlayer: false },
    { name: "SUI_WHALE", rank: 10, power: 980, winRate: "71%", isCurrentPlayer: false },
    { name: "METAMORPH_X", rank: 8, power: 840, winRate: "65%", isCurrentPlayer: false },
    { name: "SLUG_BARON", rank: 7, power: 720, winRate: "60%", isCurrentPlayer: false },
    { name: "NEOPHYTE_99", rank: 5, power: 550, winRate: "52%", isCurrentPlayer: false },
  ];

  // Inject current player into leaderboard based on rank/power
  const currentPlayer = {
    name: username.toUpperCase(),
    rank: cavernRank,
    power: activeSlug ? activeSlug.power : 0,
    winRate: activeSlug ? `${Math.max(10, Math.floor((activeSlug.win_count / (activeSlug.win_count + (activeSlug.consecutiveLosses || 0) + 1)) * 100))}%` : "0%",
    isCurrentPlayer: true
  };

  const combinedLeaderboard = [...dummyPlayers, currentPlayer].sort((a, b) => {
    if (b.rank !== a.rank) return b.rank - a.rank;
    return b.power - a.power;
  });

  return (
    <div className="space-y-8 relative z-10 animate-fade-in">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b border-outline-variant pb-4 gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-primary-container uppercase tracking-widest flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500 animate-pulse" />
            GLOBAL LEADERBOARD
          </h2>
          <p className="text-body-md text-on-surface-variant text-xs mt-1">
            Top ranked operators across the Slugterra testnet ecosystem. 
          </p>
        </div>
      </header>

      <section className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant">
                <th className="px-6 py-4 font-label-caps text-xs text-outline font-bold">RANK</th>
                <th className="px-6 py-4 font-label-caps text-xs text-outline font-bold">OPERATOR</th>
                <th className="px-6 py-4 font-label-caps text-xs text-outline font-bold">CAVERN LVL</th>
                <th className="px-6 py-4 font-label-caps text-xs text-outline font-bold">PEAK POWER</th>
                <th className="px-6 py-4 font-label-caps text-xs text-outline font-bold">WIN RATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {combinedLeaderboard.map((player, index) => (
                <tr 
                  key={index} 
                  className={`transition-colors ${player.isCurrentPlayer ? "bg-primary-container/10 border-l-4 border-l-primary-container" : "hover:bg-surface-container/50"}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Medal className="w-5 h-5 text-yellow-400" />}
                      {index === 1 && <Medal className="w-5 h-5 text-gray-400" />}
                      {index === 2 && <Medal className="w-5 h-5 text-amber-700" />}
                      <span className={`font-stats-lg text-sm font-black ${index < 3 ? "text-on-surface" : "text-outline"}`}>
                        #{index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold text-sm ${player.isCurrentPlayer ? "text-primary-container" : "text-on-surface"}`}>
                        {player.name}
                      </span>
                      {player.isCurrentPlayer && (
                        <span className="bg-primary-container text-on-primary-container text-[8px] font-black px-1.5 py-0.5 rounded uppercase">YOU</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-stats-lg text-sm text-yellow-500 font-bold">
                    {player.rank}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 font-stats-lg text-sm text-cyan-400 font-bold">
                      <Swords className="w-3.5 h-3.5" />
                      {player.power}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-stats-lg text-sm text-emerald-400 font-bold">
                    {player.winRate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
