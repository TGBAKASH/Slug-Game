import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useCurrentAccount, useSuiClientQuery, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MARKETPLACE_CONFIG_ID, SPIN_REGISTRY_ID, SLUG_TYPE, MODULE_NAME } from "../config/sui";
import { soundManager } from "./SoundManager";
import { generateSalt, computeSlugHash } from "../utils/crypto";
import { secureStore, secureRead, encryptSalt, decryptSalt, sanitizeSlugName, checkRateLimit, safeLog, createSeededRNG } from "../utils/security";
import { initCoins, earnCoins, spendCoins, getCoinsBalance } from "../api/coins";
import { getArenaEnergy, useArenaEnergy } from '../api/energy';

// Elements matching Move definitions (NO shadow)
export const ELEMENTS: Record<number, { name: string; icon: string; color: string; glow: string; desc: string }> = {
  1: { name: "FIRE", icon: "local_fire_department", color: "text-red-500", glow: "rgba(239, 68, 68, 0.45)", desc: "Glass cannon — highest attack but lowest HP." },
  2: { name: "WATER", icon: "water_drop", color: "text-cyan-400", glow: "rgba(34, 211, 238, 0.45)", desc: "Best overall — high HP with solid attack." },
  3: { name: "EARTH", icon: "landscape", color: "text-emerald-500", glow: "rgba(16, 185, 129, 0.45)", desc: "Mega tank — highest HP but lowest attack." },
  4: { name: "AIR", icon: "air", color: "text-teal-300", glow: "rgba(45, 212, 191, 0.45)", desc: "Well balanced — strong attack and decent HP." },
};

// Base stats per element (must match contract)
export const BASE_STATS: Record<number, { hp: number; attack: number; tier: string }> = {
  1: { hp: 85, attack: 20, tier: "Decent" },
  2: { hp: 120, attack: 14, tier: "Very Good" },
  3: { hp: 130, attack: 10, tier: "Decent" },
  4: { hp: 105, attack: 16, tier: "Good" },
};

// Growth rates per element (in tenths of percent per level, matching contract)
export const GROWTH_RATES: Record<number, { hp: number; atk: number }> = {
  1: { hp: 10, atk: 40 },  // Fire:  +1% HP, +4% ATK
  2: { hp: 30, atk: 20 },  // Water: +3% HP, +2% ATK
  3: { hp: 40, atk: 10 },  // Earth: +4% HP, +1% ATK
  4: { hp: 20, atk: 30 },  // Air:   +2% HP, +3% ATK
};

export interface Slug {
  id: string;
  name: string;
  element: number; // 1-4
  hp: number;
  attack: number;
  win_count: number;
  loss_count: number;
  level: number;
  sleep_until_ms: number;
  consecutiveLosses: number;
}

export interface PvpLobby {
  id: string;
  player1: string;
  wagerAmount: number; // 1, 5, or 10 SUI
  player2?: string;
  slug1Revealed?: boolean;
  slug2Revealed?: boolean;
  joinTimeMs?: number;
}

interface GameStateContextProps {
  slugs: Slug[];
  activeSlugId: string | null;
  activeSlug: Slug | null;
  walletMode: boolean;
  pvpLobbies: PvpLobby[];
  activePvpLobbyOnChain: any;
  pvpBattleResult: any;

  // Player Profile
  username: string;
  setUsername: (name: string) => void;

  // Economy
  darkCoins: number;
  cavernRank: number;
  arenaEnergy: number;
  maxArenaEnergy: number;
  nextEnergyRefillAt: string | null;
  refreshEnergy: () => Promise<void>;

  // Minting
  mintStarterSlug: (name: string, tier: "free" | "premium") => Promise<Slug>;
  mintsToday: number;
  maxMintsPerDay: number;

  // Slug Management
  levelUpSlug: () => Promise<boolean>;
  ascendSlug: (slugId: string) => Promise<boolean>;
  setActiveSlugId: (id: string) => void;

  // Battle
  executeOfflineBattle: (enemyElement: number, enemyHp: number, enemyAttack: number) => Promise<{
    success: boolean;
    isDraw: boolean;
    playerHpLeft: number;
    enemyHpLeft: number;
    coinsEarned: number;
    battleLogs: string[];
    roundCount: number;
  }>;
  awakenSlug: (slugId: string) => Promise<boolean>;

  // Quantum Spin
  quantumSpin: () => Promise<{ success: boolean; rewardType: number; amount: number; slugName?: string; slugElement?: number }>;

  // PvP
  createPvpLobby: (wager: number) => Promise<void>;
  joinPvpLobby: (lobbyId: string) => Promise<void>;
  revealSlug: (lobbyId: string) => Promise<void>;
  cancelPvpLobby: (lobbyId: string) => Promise<void>;
  claimTimeout: (lobbyId: string) => Promise<void>;

  // Sound
  soundMuted: boolean;
  toggleSoundMute: () => void;
}

const GameStateContext = createContext<GameStateContextProps | undefined>(undefined);

// Procedural name lists
const prefixes = ["Pyr", "Aqua", "Terr", "Vortex", "Brim", "Cryo", "Aero", "Glim", "Obsid", "Lux"];
const suffixes = ["core", "jaw", "strike", "tide", "stalker", "fang", "tempest", "flame", "blast", "shard"];
export const generateProceduralName = () => {
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const s = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${p}${s}`.toUpperCase();
};

// Auto-name by element
const autoName = (element: number): string => {
  switch (element) {
    case 1: return "INFERNO";
    case 2: return "TIDAL";
    case 3: return "BOULDER";
    case 4: return "ZEPHYR";
    default: return "SLUG";
  }
};

export const parseSuiSlug = (suiObject: any): Slug | null => {
  if (!suiObject || !suiObject.content || suiObject.content.dataType !== 'moveObject') return null;
  const fields = suiObject.content.fields;

  return {
    id: suiObject.objectId,
    name: fields.name,
    element: parseInt(fields.element),
    hp: parseInt(fields.hp),
    attack: parseInt(fields.attack),
    win_count: parseInt(fields.win_count || "0"),
    loss_count: parseInt(fields.loss_count || "0"),
    level: parseInt(fields.level),
    sleep_until_ms: parseInt(fields.sleep_until_ms || "0"),
    consecutiveLosses: parseInt(fields.consecutive_losses || "0"),
  };
};

// Elemental advantage check: returns 1.15 for advantage, 0.85 for disadvantage, 1.0 for neutral
const getElementalMult = (attacker: number, defender: number): number => {
  // Water>Fire>Earth>Air>Water
  if (
    (attacker === 2 && defender === 1) ||
    (attacker === 1 && defender === 3) ||
    (attacker === 3 && defender === 4) ||
    (attacker === 4 && defender === 2)
  ) return 1.15;
  if (
    (defender === 2 && attacker === 1) ||
    (defender === 1 && attacker === 3) ||
    (defender === 3 && attacker === 4) ||
    (defender === 4 && attacker === 2)
  ) return 0.85;
  return 1.0;
};

export const GameStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const { data: ownedSlugsData, refetch: refetchSlugs } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address as string,
      filter: { StructType: SLUG_TYPE },
      options: { showContent: true },
    },
    { enabled: !!account }
  );

  const [slugs, setSlugs] = useState<Slug[]>([]);
  const [activeSlugId, setActiveSlugId] = useState<string | null>(null);
  const [walletMode, setWalletMode] = useState<boolean>(false);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("Operator");
  const [pvpBattleResult, setPvpBattleResult] = useState<any>(null);

  // Dark coins stored server-side in MongoDB (tamper-proof)
  const [darkCoins, setDarkCoinsState] = useState<number>(350);

  // Initialize dark coins from server API
  useEffect(() => {
    if (!account) return;
    initCoins(account.address)
      .then((balance) => setDarkCoinsState(balance))
      .catch(() => {
        // API unreachable — fallback to localStorage (read-only display)
        secureRead("slugterra_dark_coins", account.address).then((val) => {
          if (val !== null) setDarkCoinsState(Math.floor(Number(val)));
        });
      });
  }, [account]);



  // Helper: sync balance from server response
  const syncBalance = useCallback((newBalance: number) => {
    setDarkCoinsState(newBalance);
    // Also cache in localStorage as fallback display
    if (account) secureStore("slugterra_dark_coins", String(newBalance), account.address);
  }, [account]);

  const [arenaEnergy, setArenaEnergy] = useState<number>(10);
  const [maxArenaEnergy] = useState<number>(10);
  const [nextEnergyRefillAt, setNextEnergyRefillAt] = useState<string | null>(null);

  const refreshEnergy = useCallback(async () => {
    if (!account) return;
    try {
      const data = await getArenaEnergy(account.address);
      setArenaEnergy(data.energy);
      setNextEnergyRefillAt(data.nextRefillAt);
    } catch (e) {
      console.warn('[Energy] fetch failed:', e);
    }
  }, [account]);

  useEffect(() => {
    if (account) refreshEnergy();
  }, [account, refreshEnergy]);


  // Legacy setDarkCoins for any remaining direct calls (local-only, non-critical)
  const setDarkCoins = useCallback((updater: number | ((prev: number) => number)) => {
    setDarkCoinsState((prev) => {
      const next = Math.floor(typeof updater === "function" ? updater(prev) : updater);
      return Math.max(0, Math.min(next, 999999));
    });
  }, []);

  const [cavernRank] = useState<number>(1);
  const [activePvpLobbyOnChain, setActivePvpLobbyOnChain] = useState<any>(null);
  const [pvpLobbies, setPvpLobbies] = useState<PvpLobby[]>([]);

  // Sync slugs from chain
  useEffect(() => {
    if (ownedSlugsData && ownedSlugsData.data) {
      const parsedSlugs = ownedSlugsData.data
        .map((obj) => parseSuiSlug(obj.data))
        .filter((s): s is Slug => s !== null);
      // Preserve client-side sleep_until_ms and consecutiveLosses
      // (these don't exist on-chain, so chain sync would reset them to 0)
      setSlugs(prev => {
        const localState = new Map(prev.map(s => [s.id, { sleep: s.sleep_until_ms, losses: s.consecutiveLosses }]));
        return parsedSlugs.map(s => {
          const local = localState.get(s.id);
          if (local) {
            s.sleep_until_ms = local.sleep;
            s.consecutiveLosses = local.losses;
          }
          return s;
        });
      });
    } else if (!account) {
      setSlugs([]);
    }
  }, [ownedSlugsData, account]);

  // Sync wallet mode
  useEffect(() => {
    setWalletMode(!!account);
  }, [account]);

  // Poll for player's active PvP lobby state from blockchain
  useEffect(() => {
    const activeLobbyId = localStorage.getItem("active_pvp_lobby");
    if (!activeLobbyId || !account) {
      setActivePvpLobbyOnChain(null);
      return;
    }

    const pollLobby = async () => {
      try {
        const obj = await suiClient.getObject({
          id: activeLobbyId,
          options: { showContent: true }
        });
        if (obj?.data?.content && obj.data.content.dataType === 'moveObject') {
          setActivePvpLobbyOnChain((obj.data.content as any).fields);
        } else {
          localStorage.removeItem("active_pvp_lobby");
          setActivePvpLobbyOnChain(null);
        }
      } catch {
        localStorage.removeItem("active_pvp_lobby");
        setActivePvpLobbyOnChain(null);
      }
    };

    pollLobby();
    const interval = setInterval(pollLobby, 5000);
    return () => clearInterval(interval);
  }, [account, suiClient]);

  const activeSlug = slugs.find((s) => s.id === activeSlugId) || null;

  const toggleSoundMute = () => {
    const nextVal = !soundMuted;
    setSoundMuted(nextVal);
    soundManager.setMute(nextVal);
  };

  // ─── Mint Limit (5 per day) with HMAC integrity ───
  const MAX_MINTS_PER_DAY = 5;
  const getTodayKey = () => `slugterra_mints_${new Date().toISOString().slice(0, 10)}`;
  const getMintsToday = async (): Promise<number> => {
    if (!account) return 0;
    const val = await secureRead(getTodayKey(), account.address);
    return val ? parseInt(val) : 0;
  };
  const incrementMints = async () => {
    if (!account) return;
    const current = await getMintsToday();
    await secureStore(getTodayKey(), String(current + 1), account.address);
  };
  const [mintsToday, setMintsToday] = useState(0);

  // Load mint count on mount
  useEffect(() => {
    if (account) {
      getMintsToday().then(setMintsToday);
    }
  }, [account]);

  // ─── Minting ───
  const mintStarterSlug = async (name: string, tier: "free" | "premium"): Promise<Slug> => {
    if (!account) throw new Error("Connect your wallet!");
    const currentMints = await getMintsToday();
    if (currentMints >= MAX_MINTS_PER_DAY) throw new Error(`Daily mint limit reached (${MAX_MINTS_PER_DAY}/day). Try again tomorrow!`);
    if (!checkRateLimit('mint', 3000)) throw new Error('Please wait before minting again.');
    const tx = new Transaction();
    const finalName = sanitizeSlugName(name) || "";  // Sanitized + empty = auto-name on-chain

    if (tier === "premium") {
      const [coin] = tx.splitCoins(tx.gas, [500_000_000]); // 0.5 SUI
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::premium_mint`,
        arguments: [tx.object(MARKETPLACE_CONFIG_ID), tx.pure.string(finalName), tx.object("0x8"), coin],
      });
    } else {
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::free_mint`,
        arguments: [tx.pure.string(finalName), tx.object("0x8")],
      });
    }

    const response = await signAndExecute({ transaction: tx });
    const txResult = await suiClient.waitForTransaction({ digest: response.digest, options: { showEvents: true, showObjectChanges: true } });

    if (tier === "premium" && account) {
      try {
        const newBal = await earnCoins(account.address, 100, 'premium_mint_bonus');
        syncBalance(newBal);
      } catch { setDarkCoins((c) => c + 100); }
    }

    refetchSlugs();
    await incrementMints();
    const mints = await getMintsToday();
    setMintsToday(mints);

    // Find the newly created slug object from transaction results
    const createdSlug = txResult.objectChanges?.find(
      (change: any) => change.type === 'created' && change.objectType?.includes('::game::Slug')
    );

    if (createdSlug && 'objectId' in createdSlug) {
      // Fetch the actual slug data from chain
      try {
        const slugObj = await suiClient.getObject({
          id: (createdSlug as any).objectId,
          options: { showContent: true },
        });
        const parsed = parseSuiSlug(slugObj.data as any);
        if (parsed) return parsed;
      } catch (e) {
        console.warn("Could not fetch minted slug details, using fallback", e);
      }
    }

    // Fallback if we can't read the created object
    return {
      id: "pending", name: finalName || "NEW SLUG", element: 1,
      hp: 85, attack: 20, win_count: 0, loss_count: 0, level: 1,
      sleep_until_ms: 0, consecutiveLosses: 0,
    };
  };

  // ─── Level Up (server-validated coin spend) ───
  const levelUpSlug = async (): Promise<boolean> => {
    if (!activeSlug || !account) return false;
    if (!checkRateLimit('levelUp', 1000)) return false;

    const cost = activeSlug.level * 10;
    if (darkCoins < cost) return false;
    if (activeSlug.level >= 50) return false;

    // Spend coins via server API (validates cost = level * 10)
    try {
      const newBal = await spendCoins(account.address, cost, 'level_up', activeSlug.level);
      syncBalance(newBal);
    } catch (err) {
      safeLog('LevelUp spend failed', err);
      // Re-sync balance from server in case of mismatch
      try { syncBalance(await getCoinsBalance(account.address)); } catch {}
      return false;
    }

    soundManager.playLevelUp();

    // Client-side stat calculation (matches contract formula)
    const growth = GROWTH_RATES[activeSlug.element] || { hp: 10, atk: 10 };
    const hpGain = Math.max(1, Math.floor(activeSlug.hp * growth.hp / 1000));
    const atkGain = Math.max(1, Math.floor(activeSlug.attack * growth.atk / 1000));

    setSlugs((prev) =>
      prev.map((s) =>
        s.id === activeSlug.id
          ? { ...s, level: s.level + 1, hp: s.hp + hpGain, attack: s.attack + atkGain }
          : s
      )
    );
    return true;
  };

  // ─── Ascend (burn slug) ───
  const ascendSlug = async (slugId: string): Promise<boolean> => {
    if (!account) return false;
    if (!checkRateLimit('ascend', 3000)) return false;

    // Re-fetch slug data from chain to prevent client-side manipulation
    let slug: Slug | null | undefined;
    try {
      const onChainObj = await suiClient.getObject({ id: slugId, options: { showContent: true } });
      if (onChainObj?.data) {
        slug = parseSuiSlug(onChainObj as any);
      }
    } catch {
      slug = slugs.find((s) => s.id === slugId);
    }
    if (!slug) return false;

    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::ascend`,
      arguments: [tx.object(slugId)],
    });

    try {
      soundManager.playLaunch();
      await signAndExecute({ transaction: tx });

      // Tier-based refund
      const tierCoins: Record<string, number> = { 'Very Good': 50, 'Good': 25, 'Decent': 5 };
      const baseTier = BASE_STATS[slug.element]?.tier || 'Decent';
      const baseRefund = tierCoins[baseTier] || 5;

      // 20% of total upgrade coins (if level > 2)
      const totalSpent = Array.from({ length: slug.level - 1 }, (_, i) => (i + 1) * 10).reduce((a, b) => a + b, 0);
      const upgradeRefund = slug.level > 2 ? Math.floor(totalSpent * 0.20) : 0;

      try {
        const newBal = await earnCoins(account.address, baseRefund + upgradeRefund, 'ascend_refund');
        syncBalance(newBal);
      } catch { setDarkCoins((c) => c + baseRefund + upgradeRefund); }

      if (activeSlugId === slugId) setActiveSlugId(null);
      refetchSlugs();
      return true;
    } catch (e) {
      safeLog("Ascend", e);
      return false;
    }
  };

  // ─── Quantum Spin ───
  const quantumSpin = async (): Promise<{ success: boolean; rewardType: number; amount: number; slugName?: string; slugElement?: number }> => {
    if (!account) return { success: false, rewardType: 0, amount: 0 };
    if (!checkRateLimit('spin', 3000)) return { success: false, rewardType: 0, amount: 0 };

    soundManager.playBubble();
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [50_000_000]);

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::quantum_spin`,
      arguments: [
        tx.object(MARKETPLACE_CONFIG_ID),
        tx.object(SPIN_REGISTRY_ID),
        tx.object("0x6"),
        tx.object("0x8"),
        coin,
      ],
    });

    try {
      const response = await signAndExecute({ transaction: tx });
      const txDetails = await suiClient.waitForTransaction({ digest: response.digest, options: { showEvents: true } });
      refetchSlugs();

      let rewardType = 0;
      let amount = 0;
      let slugName = "";
      let slugElement = 1;

      if (txDetails.events && txDetails.events.length > 0) {
        const spinEvent = txDetails.events.find((e: any) => e.type.includes('SpinRewardEvent'));
        if (spinEvent && spinEvent.parsedJson) {
          const data = spinEvent.parsedJson as any;
          rewardType = Number(data.reward_type);
          amount = Number(data.amount);

          if (rewardType === 5) {
            try {
              const newBal = await earnCoins(account.address, amount, 'spin_coins');
              syncBalance(newBal);
            } catch { setDarkCoins((prev) => prev + amount); }
          } else if (rewardType <= 4) {
            // 1=Water, 2=Air, 3=Fire, 4=Earth
            const elementMap: Record<number, { name: string; el: number }> = {
              1: { name: "QUANTUM TIDAL", el: 2 },
              2: { name: "QUANTUM ZEPHYR", el: 4 },
              3: { name: "QUANTUM INFERNO", el: 1 },
              4: { name: "QUANTUM BOULDER", el: 3 },
            };
            const reward = elementMap[rewardType];
            if (reward) { slugName = reward.name; slugElement = reward.el; }
          }
        }
      }
      return { success: true, rewardType, amount, slugName, slugElement };
    } catch (e) {
      safeLog("QuantumSpin", e);
      return { success: false, rewardType: 0, amount: 0 };
    }
  };

  // ─── PvE Battle (HP-based rounds) ───
  const executeOfflineBattle = async (
    enemyElement: number,
    enemyHp: number,
    enemyAttack: number
  ): Promise<{
    success: boolean;
    isDraw: boolean;
    playerHpLeft: number;
    enemyHpLeft: number;
    coinsEarned: number;
    battleLogs: string[];
    roundCount: number;
  }> => {
    if (!activeSlug) {
      return { success: false, isDraw: false, playerHpLeft: 0, enemyHpLeft: 0, coinsEarned: 0, battleLogs: [], roundCount: 0 };
    }
    if (!checkRateLimit('pve_battle', 2000)) {
      return { success: false, isDraw: false, playerHpLeft: 0, enemyHpLeft: 0, coinsEarned: 0, battleLogs: ['[0.0s] Please wait before battling again.'], roundCount: 0 };
    }

    // Check if slug is sleeping
    if (activeSlug.sleep_until_ms > Date.now()) {
      return { success: false, isDraw: false, playerHpLeft: 0, enemyHpLeft: 0, coinsEarned: 0, battleLogs: ["[0.0s] SLUG IS SLEEPING. Wait for recovery."], roundCount: 0 };
    }

    // Check arena energy
    if (arenaEnergy < 1) {
      return { success: false, isDraw: false, playerHpLeft: 0, enemyHpLeft: 0, coinsEarned: 0, battleLogs: ['[0.0s] NO ARENA ENERGY. Wait for recharge (1 per hour).'], roundCount: 0 };
    }

    // Deduct 1 energy server-side BEFORE the battle (win or lose costs energy)
    if (account) {
      try {
        const energyResult = await useArenaEnergy(account.address);
        setArenaEnergy(energyResult.energy);
        setNextEnergyRefillAt(energyResult.nextRefillAt);
      } catch (err: any) {
        // Only block if it's genuinely a no-energy response (403)
        if (err?.message?.includes('No energy') || err?.message?.includes('No arena energy')) {
          setArenaEnergy(0);
          return { success: false, isDraw: false, playerHpLeft: 0, enemyHpLeft: 0, coinsEarned: 0, battleLogs: ['[0.0s] NO ARENA ENERGY. Wait for recharge (1 per hour).'], roundCount: 0 };
        }
        // For network errors or other issues, refresh energy state but let battle continue
        console.warn('[Energy] deduct failed, refreshing:', err);
        refreshEnergy();
      }
    }

    soundManager.playLaunch();
    const logs: string[] = [];
    logs.push(`[0.0s] Deploying ${activeSlug.name} (${ELEMENTS[activeSlug.element]?.name || "?"})!`);

    let pHp = activeSlug.hp;
    let eHp = enemyHp;
    const pAtk = activeSlug.attack;
    const eAtk = enemyAttack;

    const pMult = getElementalMult(activeSlug.element, enemyElement);
    const eMult = getElementalMult(enemyElement, activeSlug.element);

    if (pMult > 1) logs.push(`[0.2s] ELEMENTAL ADVANTAGE! +15% damage.`);
    else if (pMult < 1) logs.push(`[0.2s] ELEMENTAL DISADVANTAGE! -15% damage.`);

    let round = 0;
    while (round < 10 && pHp > 0 && eHp > 0) {
      round++;
      const pVariance = 0.95 + Math.random() * 0.10;
      const eVariance = 0.95 + Math.random() * 0.10;

      const pDmg = Math.floor(pAtk * pMult * pVariance);
      const eDmg = Math.floor(eAtk * eMult * eVariance);

      eHp = Math.max(0, eHp - pDmg);
      pHp = Math.max(0, pHp - eDmg);

      logs.push(`[R${round}] You deal ${pDmg} → Enemy HP: ${eHp} | Enemy deals ${eDmg} → Your HP: ${pHp}`);
    }

    let isDraw = pHp === 0 && eHp === 0;
    let success = pHp > 0 && eHp <= 0;

    // Tiebreaker after 10 rounds: whoever has more remaining HP wins. If tied, higher ATK wins.
    if (pHp > 0 && eHp > 0) {
      logs.push(`[R10] TIME UP! Tiebreaker — Your HP: ${pHp} vs Enemy HP: ${eHp}`);
      if (pHp > eHp) {
        success = true;
        logs.push(`[END] VICTORY by HP advantage! (+${pHp - eHp} HP difference)`);
      } else if (eHp > pHp) {
        success = false;
        logs.push(`[END] DEFEAT by HP advantage. Enemy had +${eHp - pHp} more HP.`);
      } else {
        // HP tied — compare ATK
        if (pAtk > enemyAttack) {
          success = true;
          logs.push(`[END] VICTORY by ATK tiebreak! (${pAtk} vs ${enemyAttack})`);
        } else if (enemyAttack > pAtk) {
          success = false;
          logs.push(`[END] DEFEAT by ATK tiebreak. (${pAtk} vs ${enemyAttack})`);
        } else {
          isDraw = true;
          logs.push(`[END] DRAW! Both HP and ATK are identical.`);
        }
      }
    } else {
      if (isDraw) logs.push(`[END] DRAW! Both slugs knocked out simultaneously.`);
      else if (success) logs.push(`[END] VICTORY! ${activeSlug.name} survives with ${pHp} HP!`);
      else logs.push(`[END] DEFEAT! ${activeSlug.name} was knocked out.`);
    }

    // Rewards: base 20-40 coins, scaled by +15% per level, CAPPED at 200
    const battleSeed = `${activeSlug.id}_${Date.now()}_${round}`;
    const seededRng = createSeededRNG(battleSeed);
    const levelScale = 1 + 0.15 * (activeSlug.level - 1);
    const baseCoins = 20 + Math.floor(seededRng() * 21); // 20-40 deterministic
    const coinsEarned = success ? Math.min(200, Math.floor(baseCoins * levelScale)) : 0;

    // Sleep penalty for losses
    if (!success && !isDraw) {
      const nextLosses = (activeSlug.consecutiveLosses || 0) + 1;
      let sleepMs = 300_000; // 5 min
      if (nextLosses === 2) sleepMs = 900_000; // 15 min
      else if (nextLosses >= 3) sleepMs = 1_800_000; // 30 min

      setSlugs((prev) =>
        prev.map((s) =>
          s.id === activeSlug.id
            ? { ...s, consecutiveLosses: nextLosses, sleep_until_ms: Date.now() + sleepMs }
            : s
        )
      );
    } else if (success) {
      setSlugs((prev) =>
        prev.map((s) =>
          s.id === activeSlug.id ? { ...s, consecutiveLosses: 0 } : s
        )
      );
    }

    setTimeout(() => {
      if (success) soundManager.playVictory();
      else soundManager.playDefeat();
    }, 1500);

    if (success && account) {
      try {
        const newBal = await earnCoins(account.address, coinsEarned, 'pve_win');
        syncBalance(newBal);
      } catch { setDarkCoins((prev) => prev + coinsEarned); }
    }

    // Refresh energy after battle (win or lose, sync real value from server)
    if (account) {
      refreshEnergy();
    }

    return { success, isDraw, playerHpLeft: pHp, enemyHpLeft: eHp, coinsEarned, battleLogs: logs, roundCount: round };
  };

  // ─── Awaken Slug ───
  const awakenSlug = async (slugId: string): Promise<boolean> => {
    const targetSlug = slugs.find((s) => s.id === slugId);
    if (!targetSlug) return false;

    const remainingMs = (targetSlug.sleep_until_ms || 0) - Date.now();
    if (remainingMs <= 0) {
      setSlugs((prev) => prev.map((s) => s.id === slugId ? { ...s, sleep_until_ms: 0, consecutiveLosses: 0 } : s));
      return true;
    }

    const minutesLeft = Math.max(1, Math.ceil(remainingMs / 60000));
    const coinCost = minutesLeft * 5;

    if (darkCoins < coinCost) return false;

    // Spend coins via server API
    if (account) {
      try {
        const newBal = await spendCoins(account.address, coinCost, 'awaken');
        syncBalance(newBal);
      } catch {
        try { syncBalance(await getCoinsBalance(account.address)); } catch {}
        return false;
      }
    }
    soundManager.playChestOpen();
    setSlugs((prev) => prev.map((s) => s.id === slugId ? { ...s, sleep_until_ms: 0, consecutiveLosses: 0 } : s));
    return true;
  };

  // ─── PvP: Create Lobby ───
  const createPvpLobby = async (wager: number) => {
    if (!activeSlug || !account) return;
    soundManager.playBubble();

    const salt = generateSalt();
    const slugHash = computeSlugHash(activeSlug.id, salt);

    const tx = new Transaction();
    const wagerAmount = wager * 1_000_000_000;
    const [coin] = tx.splitCoins(tx.gas, [wagerAmount]);
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::create_pvp_lobby`,
      arguments: [tx.pure.vector('u8', Array.from(slugHash)), coin],
    });

    try {
      const response = await signAndExecute({ transaction: tx });
      const txnResult = await suiClient.waitForTransaction({ digest: response.digest, options: { showEffects: true } });

      const createdObj = txnResult.effects?.created?.[0]?.reference?.objectId;
      const lobbyId = createdObj || `lob-${Date.now()}`;

      localStorage.setItem(`pvp_salt_${lobbyId}`, await encryptSalt(salt, account.address));
      localStorage.setItem("active_pvp_lobby", lobbyId);
      localStorage.setItem(`pvp_slug_${lobbyId}`, activeSlug.id);

      const newLobby: PvpLobby = {
        id: lobbyId,
        player1: account.address,
        wagerAmount: wager,
      };
      setPvpLobbies((prev) => [newLobby, ...prev]);
    } catch (e) {
      safeLog("CreatePvpLobby", e);
    }
  };

  // ─── PvP: Join Lobby (double-blind — P2 also commits hash) ───
  const joinPvpLobby = async (lobbyId: string) => {
    if (!activeSlug || !account) return;
    soundManager.playLaunch();

    // Generate P2's salt and hash
    const salt = generateSalt();
    const slugHash = computeSlugHash(activeSlug.id, salt);

    // Get lobby wager amount from on-chain
    const lobbyObj = await suiClient.getObject({ id: lobbyId, options: { showContent: true } });
    const lobbyFields = (lobbyObj?.data?.content as any)?.fields;
    const wagerAmount = parseInt(lobbyFields?.wager_amount || "1000000000");

    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [wagerAmount]);
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::join_pvp_lobby`,
      arguments: [tx.object(lobbyId), tx.pure.vector('u8', Array.from(slugHash)), tx.object("0x6"), coin],
    });

    try {
      await signAndExecute({ transaction: tx });
      localStorage.setItem(`pvp_salt_${lobbyId}`, await encryptSalt(salt, account.address));
      localStorage.setItem("active_pvp_lobby", lobbyId);
      localStorage.setItem(`pvp_slug_${lobbyId}`, activeSlug.id);
    } catch (e) {
      safeLog("JoinPvpLobby", e);
      throw e;
    }
  };

  // ─── PvP: Reveal Slug (works for both P1 and P2) ───
  const revealSlug = async (lobbyId: string) => {
    if (!account) return;

    const storedSalt = localStorage.getItem(`pvp_salt_${lobbyId}`) || await secureRead(`pvp_salt_${lobbyId}`, account.address);
    const slugId = localStorage.getItem(`pvp_slug_${lobbyId}`);
    if (!storedSalt || !slugId) return;

    let saltArray: Uint8Array;
    if (account) {
      saltArray = await decryptSalt(storedSalt, account.address);
    } else {
      saltArray = new Uint8Array(storedSalt.split(",").map(Number));
    }

    // Determine if caller is P1 or P2
    const lobbyObj = await suiClient.getObject({ id: lobbyId, options: { showContent: true } });
    const lobbyFields = (lobbyObj?.data?.content as any)?.fields;
    const isP1 = lobbyFields?.player1 === account.address;
    const revealFn = isP1 ? "reveal_slug_p1" : "reveal_slug_p2";

    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::${revealFn}`,
      arguments: [tx.object(lobbyId), tx.object(slugId), tx.pure.vector('u8', Array.from(saltArray)), tx.object("0x6")],
    });

    try {
      await signAndExecute({ transaction: tx });
      soundManager.playLaunch();
    } catch (e) {
      safeLog("RevealSlug", e);
    }
  };

  // ─── PvP: Cancel Lobby ───
  const cancelPvpLobby = async (lobbyId: string) => {
    soundManager.playLaunch();
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::cancel_pvp_lobby`,
      arguments: [tx.object(lobbyId)],
    });

    try {
      await signAndExecute({ transaction: tx });
      setPvpLobbies((prev) => prev.filter((l) => l.id !== lobbyId));
      localStorage.removeItem(`pvp_salt_${lobbyId}`);
      localStorage.removeItem(`pvp_slug_${lobbyId}`);
      localStorage.removeItem("active_pvp_lobby");
    } catch (e) {
      safeLog("CancelPvpLobby", e);
    }
  };

  // ─── PvP: Claim Timeout ───
  const claimTimeout = async (lobbyId: string) => {
    if (!account) return;
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::claim_timeout`,
      arguments: [tx.object(lobbyId), tx.object("0x6")],
    });
    try {
      await signAndExecute({ transaction: tx });
      setPvpLobbies((prev) => prev.filter((l) => l.id !== lobbyId));
      localStorage.removeItem(`pvp_salt_${lobbyId}`);
      localStorage.removeItem(`pvp_slug_${lobbyId}`);
      localStorage.removeItem("active_pvp_lobby");
    } catch (e) {
      safeLog("ClaimTimeout", e);
    }
  };

  return (
    <GameStateContext.Provider
      value={{
        slugs,
        activeSlugId,
        activeSlug,
        walletMode,
        pvpLobbies,
        activePvpLobbyOnChain,
        pvpBattleResult,
        username,
        setUsername,

        darkCoins,
        cavernRank,
        arenaEnergy,
        maxArenaEnergy,
        nextEnergyRefillAt,
        refreshEnergy,

        mintStarterSlug,
        mintsToday,
        maxMintsPerDay: MAX_MINTS_PER_DAY,
        levelUpSlug,
        ascendSlug,
        quantumSpin,
        executeOfflineBattle,
        createPvpLobby,
        joinPvpLobby,
        revealSlug,
        cancelPvpLobby,
        claimTimeout,
        setActiveSlugId,
        awakenSlug,
        soundMuted,
        toggleSoundMute,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error("useGameState must be used within a GameStateProvider");
  }
  return context;
};

export const getSlugImage = (element: number) => {
  switch (element) {
    case 1: return "/images/slug_fire.png";
    case 2: return "/images/slug_water.png";
    case 3: return "/images/slug_earth.png";
    case 4: return "/images/slug_air.png";
    default: return "/images/slug_fire.png";
  }
};
