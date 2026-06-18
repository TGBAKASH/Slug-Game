import React, { useState } from "react";
import { useGameState } from "../context/GameState";
import { X, User, Coins, Wallet, Save } from "lucide-react";
import { motion } from "framer-motion";

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { username, setUsername, darkCoins, walletMode } = useGameState();
  const [tempName, setTempName] = useState(username);

  const handleSave = () => {
    if (tempName.trim().length > 0) {
      setUsername(tempName.trim().substring(0, 15));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-md w-full bg-surface-container-high border border-outline-variant p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-headline-sm font-headline-sm text-primary-container uppercase font-black tracking-widest flex items-center gap-3">
            <User className="w-6 h-6 text-primary-container" />
            OPERATOR PROFILE
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Identity Section */}
          <div className="space-y-2">
            <label className="text-xs font-label-caps text-outline font-bold">OPERATOR CALLSIGN</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                maxLength={15}
                className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary-container transition-colors font-mono font-bold uppercase"
                placeholder="ENTER CALLSIGN"
              />
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                className="px-4 py-3 bg-primary-container text-on-primary-container rounded-xl hover:brightness-110 transition-all flex items-center gap-2 font-label-caps font-black text-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                SAVE
              </motion.button>
            </div>
            <p className="text-[10px] text-on-surface-variant opacity-80">This callsign is used in PVP matchmaking and leaderboards.</p>
          </div>

          {/* Connection Status */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className={`w-5 h-5 ${walletMode ? "text-emerald-400" : "text-amber-500"}`} />
              <div>
                <div className="font-label-caps text-[10px] text-outline font-bold">CONNECTION STATUS</div>
                <div className={`text-xs font-mono font-bold ${walletMode ? "text-emerald-400" : "text-amber-500"}`}>
                  {walletMode ? "SUI TESTNET CONNECTED" : "LOCAL SIMULATOR"}
                </div>
              </div>
            </div>
          </div>

          {/* Resource Inventory */}
          <div className="space-y-2">
            <label className="text-xs font-label-caps text-outline font-bold">RESOURCE INVENTORY</label>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-label-caps text-on-surface">DARK COINS</span>
                </div>
                <span className="font-stats-lg text-yellow-400 font-black">{darkCoins}</span>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
