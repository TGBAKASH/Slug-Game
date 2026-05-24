import React, { createContext, useContext, useState, useEffect } from "react";
import { useCurrentAccount, useSuiClientQuery, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MARKETPLACE_CONFIG_ID, SLUG_TYPE, MODULE_NAME } from "../config/sui";
import { soundManager } from "./SoundManager";
import { generateSalt, computeSlugHash } from "../utils/crypto";

// Elements matching Move definitions & custom Shadow class
export const ELEMENTS = {
  1: { name: "FIRE", icon: "local_fire_department", color: "text-red-500", glow: "rgba(239, 68, 68, 0.45)", desc: "Aggressive attacker. explosive critical hits and burns." },
  2: { name: "WATER", icon: "water_drop", color: "text-cyan-400", glow: "rgba(34, 211, 238, 0.45)", desc: "Defensive support. shield generator and chilling freeze." },
  3: { name: "EARTH", icon: "landscape", color: "text-emerald-500", glow: "rgba(16, 185, 129, 0.45)", desc: "Heavy tank sentinel. massive HP and tectonic stuns." },
  4: { name: "AIR", icon: "air", color: "text-teal-300", glow: "rgba(45, 212, 191, 0.45)", desc: "Speed assassin. lightning multi-hits and wind dodges." },
  5: { name: "SHADOW", icon: "dark_mode", color: "text-purple-500", glow: "rgba(168, 85, 247, 0.65)", desc: "Unstable corruption class. chaotic life-steal and bursts." },
};

// Rarities
export const RARITIES = {
  1: { name: "COMMON", bonus: 0, textClass: "text-emerald-400", borderClass: "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]", desc: "Stable cybernetic parameters." },
  2: { name: "RARE", bonus: 5, textClass: "text-cyan-400 font-bold", borderClass: "border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]", desc: "+5 Base Power boost & neon plasma outlines." },
  3: { name: "EPIC", bonus: 10, textClass: "text-fuchsia-400 font-bold", borderClass: "border-fuchsia-500/40 shadow-[0_0_20px_rgba(217,70,239,0.3)]", desc: "Unique passive class skills & high-efficiency mutation." },
  4: { name: "LEGENDARY", bonus: 15, textClass: "text-yellow-400 font-black tracking-wider animate-pulse", borderClass: "border-yellow-400/60 shadow-[0_0_30px_rgba(234,179,8,0.5)]", desc: "Exclusive combat finisher moves, dynamic gold headers & supreme fusions." },
};

export interface Slug {
  id: string;
  name: string;
  element: number; // 1-5
  power: number;
  defense: number;
  speed: number;
  maxHp: number;
  currentHp: number;
  is_ghouled: boolean; // 100% permanently transformed
  win_count: number;
  rarity: number; // 1 to 4
  level: number; // Level 1 to 100
  corruption: number; // 0% to 100% Dark Water exposure
  isFused: boolean;
  fusionType?: string; // e.g. "Plasma Storm"
  fusionComponent1?: string;
  fusionComponent2?: string;
  passiveSkill?: string;
  finisherName?: string;
  consecutiveLosses: number;
  recoveryUntil?: number; // epoch timestamp
}

export interface PvpLobby {
  id: string;
  player1: string;
  slug1Name: string;
  slug1Power: number;
  slug1Element: number;
  slug1IsGhouled: boolean;
  wagerAmount: number; // 1, 5, or 10 SUI
  player2?: string;
  slug2Id?: string;
}

interface GameStateContextProps {
  slugs: Slug[];
  activeSlugId: string | null;
  activeSlug: Slug | null;
  fusionEnergy: number;
  overdriveActive: boolean;
  walletMode: boolean;
  pvpLobbies: PvpLobby[];
  activePvpLobbyOnChain: any; // Raw on-chain data of the player's active lobby
  
  // Player Profile
  username: string;
  setUsername: (name: string) => void;
  
  // Wallet Currencies & Rank
  darkCoins: number;
  fusionShards: number;
  mutationCores: number;
  cavernRank: number;

  // Actions
  mintStarterSlug: (name: string, element: number, tier: "free" | "basic" | "premium") => Promise<Slug>;
  buyDarkWaterAndUpgrade: (slugId?: string) => Promise<{success: boolean; newCorruption: number}>;
  triggerFullGhoul: (slugId?: string) => Promise<boolean>;
  levelUpSlug: () => Promise<boolean>;
  fuseSlugs: (id1: string, id2: string) => Promise<Slug | null>;
  openChest: (tier: "cargo" | "quantum") => Promise<{ success: boolean; coins?: number; shards?: number; cores?: number; slug?: Slug; msg: string }>;
  executeOfflineBattle: (enemyElement: number, enemyPower: number, enemyHp: number) => Promise<{
    success: boolean;
    playerPower: number;
    enemyPower: number;
    coinsEarned: number;
    shardsEarned: number;
    battleLogs: string[];
  }>;
  createPvpLobby: (wager: number) => Promise<void>;
  joinPvpLobby: (lobbyId: string) => Promise<{ winnerName: string; winAmount: number; coinsEarned: number; playerWins: boolean }>;
  cancelPvpLobby: (lobbyId: string) => Promise<void>;
  resolvePvpLobby: (lobbyId: string) => Promise<void>;
  claimTimeout: (lobbyId: string) => Promise<void>;
  setActiveSlugId: (id: string) => void;
  activateOverdrive: () => void;
  regenerateEnergy: () => void;
  awakenSlug: (slugId: string) => Promise<boolean>;
  soundMuted: boolean;
  toggleSoundMute: () => void;
}

const GameStateContext = createContext<GameStateContextProps | undefined>(undefined);

// Procedural name lists
const prefixes = ["Pyr", "Aqua", "Terr", "Vortex", "Teneb", "Brim", "Cryo", "Aero", "Glim", "Obsid", "Lux", "Void"];
const suffixes = ["core", "jaw", "strike", "tide", "stalker", "fang", "tempest", "flame", "blast", "glitch", "wraith", "shard"];
export const generateProceduralName = () => {
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const s = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${p}${s}`.toUpperCase();
};

export const parseSuiSlug = (suiObject: any): Slug => {
  if (!suiObject || !suiObject.content || suiObject.content.dataType !== 'moveObject') return null as any;
  const fields = suiObject.content.fields;
  
  const element = parseInt(fields.element);
  const rarity = parseInt(fields.rarity);
  const power = parseInt(fields.power);
  const level = parseInt(fields.level);
  
  return {
    id: suiObject.objectId,
    name: fields.name,
    element: element,
    power: power,
    defense: 8 + (level * 2),
    speed: 10 + (level * 2),
    maxHp: 100 + (level * 10),
    currentHp: 100 + (level * 10),
    is_ghouled: fields.is_ghouled,
    win_count: parseInt(fields.win_count),
    rarity: rarity,
    level: level,
    corruption: fields.is_ghouled ? 100 : 0,
    isFused: fields.is_hybrid,
    consecutiveLosses: 0,
  };
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

  useEffect(() => {
    if (ownedSlugsData && ownedSlugsData.data) {
      const parsedSlugs = ownedSlugsData.data.map((obj) => parseSuiSlug(obj.data)).filter(Boolean);
      setSlugs((prev) => {
        return parsedSlugs.map((ps) => {
          const existing = prev.find((p) => p.id === ps.id);
          if (existing) {
            return { ...ps, consecutiveLosses: existing.consecutiveLosses, recoveryUntil: existing.recoveryUntil };
          }
          return ps;
        });
      });
    } else if (!account) {
      setSlugs([]);
    }
  }, [ownedSlugsData, account]);

  const [slugs, setSlugs] = useState<Slug[]>([]);
  const [activeSlugId, setActiveSlugId] = useState<string | null>(null);
  const [fusionEnergy, setFusionEnergy] = useState<number>(100);
  const [overdriveActive, setOverdriveActive] = useState<boolean>(false);
  const [walletMode, setWalletMode] = useState<boolean>(false);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("Operator");

  // Player economies
  const [darkCoins, setDarkCoins] = useState<number>(350);
  const [fusionShards, setFusionShards] = useState<number>(20);
  const [mutationCores, setMutationCores] = useState<number>(1);
  const [cavernRank] = useState<number>(1);
  const [activePvpLobbyOnChain, setActivePvpLobbyOnChain] = useState<any>(null);

  // Matchmaking lobbies board
  const [pvpLobbies, setPvpLobbies] = useState<PvpLobby[]>([
    {
      id: "lob-1",
      player1: "0x3d7b...4fa9",
      slug1Name: "HYPER-ELITE GLIMSHARD",
      slug1Power: 38,
      slug1Element: 2, // Water
      slug1IsGhouled: false,
      wagerAmount: 1,
    },
    {
      id: "lob-2",
      player1: "0x12a8...fe03",
      slug1Name: "APEX PRIME VOIDFANG",
      slug1Power: 65,
      slug1Element: 5, // Shadow
      slug1IsGhouled: true,
      wagerAmount: 5,
    }
  ]);

  // Sync wallet mode
  useEffect(() => {
    if (account) {
      setWalletMode(true);
    } else {
      setWalletMode(false);
    }
  }, [account]);

  // Passive stamina energy regen
  useEffect(() => {
    const timer = setInterval(() => {
      setFusionEnergy((prev) => {
        if (prev >= 100) return 100;
        return Math.min(100, prev + 1);
      });
    }, 60000);
    return () => clearInterval(timer);
  }, [overdriveActive]);

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
        if (obj && obj.data && obj.data.content && obj.data.content.dataType === 'moveObject') {
          setActivePvpLobbyOnChain(obj.data.content.fields);
        } else {
          // If object is deleted (resolved or cancelled), clean up
          localStorage.removeItem("active_pvp_salt");
          localStorage.removeItem("active_pvp_lobby");
          localStorage.removeItem("active_pvp_slug");
          setActivePvpLobbyOnChain(null);
        }
      } catch (e) {
        // Assume deleted
        localStorage.removeItem("active_pvp_salt");
        localStorage.removeItem("active_pvp_lobby");
        localStorage.removeItem("active_pvp_slug");
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

  // Chest Cargo Openers
  const openChest = async (tier: "cargo" | "quantum"): Promise<{ success: boolean; coins?: number; shards?: number; cores?: number; slug?: Slug; msg: string }> => {
    if (tier === "cargo") {
      if (darkCoins < 50) {
        return { success: false, msg: "Insufficient Dark Coins. Requires 50." };
      }
      soundManager.playChestOpen();
      setDarkCoins((c) => c - 50);

      // Roll rewards
      const rolledCoins = Math.floor(Math.random() * 60) + 20;
      const rolledShards = Math.floor(Math.random() * 8) + 2;
      setDarkCoins((c) => c + rolledCoins);
      setFusionShards((s) => s + rolledShards);

      // 30% chance to drop common/rare slug
      if (Math.random() < 0.35) {
        const elem = Math.floor(Math.random() * 4) + 1;
        const newSl = await mintStarterSlug(generateProceduralName(), elem, "free");
        return {
          success: true,
          coins: rolledCoins,
          shards: rolledShards,
          slug: newSl,
          msg: `Cargo crate opened successfully! Unlocked ${newSl.name}!`,
        };
      }

      return {
        success: true,
        coins: rolledCoins,
        shards: rolledShards,
        msg: `Cargo crate contains resources! Raw energy and core components retrieved.`,
      };
    } else {
      // Quantum Core Cache
      if (darkCoins < 150 && fusionShards < 10) {
        return { success: false, msg: "Requires 150 Dark Coins or 10 Fusion Shards." };
      }
      soundManager.playChestOpen();
      if (darkCoins >= 150) {
        setDarkCoins((c) => c - 150);
      } else {
        setFusionShards((s) => s - 10);
      }

      const rolledShards = Math.floor(Math.random() * 20) + 8;
      const rolledCores = Math.random() < 0.4 ? 1 : 0;
      setFusionShards((s) => s + rolledShards);
      if (rolledCores > 0) setMutationCores((c) => c + rolledCores);

      // 60% chance to drop high-tier rare/epic/legendary slug
      if (Math.random() < 0.65) {
        const elem = Math.floor(Math.random() * 5) + 1; // can be shadow!
        const tierRoll = Math.random() < 0.15 ? "premium" : "basic";
        const newSl = await mintStarterSlug(generateProceduralName(), elem, tierRoll as any);
        return {
          success: true,
          shards: rolledShards,
          cores: rolledCores,
          slug: newSl,
          msg: `Quantum Cache unlocked! High-frequency materials and a specialized ${newSl.name} slug materializer secured!`,
        };
      }

      return {
        success: true,
        shards: rolledShards,
        cores: rolledCores,
        msg: `High-frequency reactor core data decrypted! Quantum shards and fusions assets stored.`,
      };
    }
  };

  // Mint canisters
  const mintStarterSlug = async (name: string, element: number, tier: "free" | "basic" | "premium"): Promise<Slug> => {
    if (!account) throw new Error("Connect your wallet!");
    const tx = new Transaction();
    const finalName = name.trim().toUpperCase() || generateProceduralName();
    
    if (tier === "premium") {
      const [coin] = tx.splitCoins(tx.gas, [1000000000]); // 1 SUI
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::premium_mint`,
        arguments: [tx.object(MARKETPLACE_CONFIG_ID), tx.pure.string(finalName), tx.pure.u8(element), tx.object("0x8"), coin],
      });
    } else {
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::free_mint`,
        arguments: [tx.pure.string(finalName), tx.pure.u8(element), tx.object("0x8")],
      });
    }

    const response = await signAndExecute({ transaction: tx });
    await suiClient.waitForTransaction({ digest: response.digest });
    refetchSlugs();
    
    return { id: "pending", name: finalName, element, power: 10, defense: 10, speed: 10, maxHp: 100, currentHp: 100, is_ghouled: false, win_count: 0, rarity: 1, level: 1, corruption: 0, isFused: false, consecutiveLosses: 0 } as Slug;
  };

  // Inject Dark Water Corruption upgrade (Costs 1.0 SUI)
  const buyDarkWaterAndUpgrade = async (slugId?: string): Promise<{success: boolean; newCorruption: number}> => {
    const targetId = slugId || activeSlugId;
    if (!targetId || !account) return {success: false, newCorruption: 0};

    soundManager.playBubble();
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [1000000000]); // 1 SUI
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::buy_dark_water_and_upgrade`,
      arguments: [tx.object(MARKETPLACE_CONFIG_ID), tx.object(targetId), coin],
    });

    try {
      const response = await signAndExecute({ transaction: tx });
      await suiClient.waitForTransaction({ digest: response.digest });
      refetchSlugs();
      soundManager.playWarning();
      return {success: true, newCorruption: 100};
    } catch (e) {
      console.error(e);
      return {success: false, newCorruption: 0};
    }
  };

  // Perform full ghoul transformation at 100% (Merged into buyDarkWaterAndUpgrade on-chain)
  const triggerFullGhoul = async (): Promise<boolean> => {
    return false;
  };

  // Merge compatible elements inside the Fusion containment grids
  const fuseSlugs = async (id1: string, id2: string): Promise<Slug | null> => {
    if (!account) return null;
    soundManager.playChestOpen();
    const tx = new Transaction();
    
    // In our backend, hybrid_name is passed as a string.
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::fuse_slugs`,
      arguments: [tx.object(id1), tx.object(id2), tx.pure.string("HYBRID PRIME")],
    });
    
    try {
      const response = await signAndExecute({ transaction: tx });
      await suiClient.waitForTransaction({ digest: response.digest });
      refetchSlugs();
      
      // Temporary stub to prevent UI crash while refetch completes
      return { id: "pending", name: "HYBRID PRIME", element: 1, power: 50, defense: 50, speed: 50, maxHp: 500, currentHp: 500, is_ghouled: false, win_count: 0, rarity: 4, level: 1, corruption: 0, isFused: true, consecutiveLosses: 0 } as Slug;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  // RPG Level Up Slug via PTB
  const levelUpSlug = async (): Promise<boolean> => {
    if (!activeSlug || !account) return false;
    
    soundManager.playLevelUp();
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::level_up`,
      arguments: [tx.object(activeSlug.id), tx.object("0x6")],
    });

    try {
      const response = await signAndExecute({ transaction: tx });
      await suiClient.waitForTransaction({ digest: response.digest });
      refetchSlugs();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Overhauled battle algorithm applying element attributes and playstyles
  const executeOfflineBattle = async (
    enemyElement: number,
    enemyPower: number,
    enemyHp: number
  ): Promise<{
    success: boolean;
    playerPower: number;
    enemyPower: number;
    coinsEarned: number;
    shardsEarned: number;
    battleLogs: string[];
  }> => {
    if (!activeSlug) {
      return { success: false, playerPower: 0, enemyPower, coinsEarned: 0, shardsEarned: 0, battleLogs: [] };
    }
    if (fusionEnergy < 12) {
      return { success: false, playerPower: 0, enemyPower, coinsEarned: 0, shardsEarned: 0, battleLogs: ["[0.0s] INSUFFICIENT FUSION ENERGY. Recharge required before combat deployment."] };
    }

    soundManager.playLaunch();
    setFusionEnergy((prev) => Math.max(0, prev - 12));

    const logs: string[] = [];
    logs.push(`[0.0s] Blaster bay loaded. Launching ${activeSlug.name}! Target HP is ${enemyHp} units.`);

    // Extract stats
    let pPower = activeSlug.power;
    let pDef = activeSlug.defense;
    let pSpd = activeSlug.speed;
    let pMaxHp = activeSlug.maxHp;
    
    let ePower = enemyPower;
    let eSpd = Math.floor(enemyPower * 0.5);

    // Apply Elemental playstyles & counters
    logs.push(`[0.3s] Elemental scan: Player Core is ${ELEMENTS[activeSlug.element as keyof typeof ELEMENTS].name}. Enemy is ${ELEMENTS[enemyElement as keyof typeof ELEMENTS].name}.`);

    // Water > Fire > Air > Earth > Water
    const pEl = activeSlug.element;
    const eEl = enemyElement;
    if ((pEl === 2 && eEl === 1) || (pEl === 1 && eEl === 4) || (pEl === 4 && eEl === 3) || (pEl === 3 && eEl === 2)) {
      pPower += 6;
      logs.push(`[0.6s] TACTICAL ADVANTAGE! Elemental counters active: Player power +6.`);
    } else if ((eEl === 2 && pEl === 1) || (eEl === 1 && pEl === 4) || (eEl === 4 && pEl === 3) || (eEl === 3 && pEl === 2)) {
      ePower += 6;
      logs.push(`[0.6s] WARNING: Target countering active core. Enemy power +6.`);
    }

    // Ghouled/Shadow elements dominate
    if (activeSlug.is_ghouled || activeSlug.element === 5) {
      pPower += 8;
      logs.push(`[0.8s] Void shadow waves bypass basic counters! +8 Corruption damage.`);
    }

    // Apply special visual playstyles
    let burnDmg = 0;
    let freezeChance = false;
    let hasShield = false;
    let stunTrigger = false;
    let dodgeTrigger = false;

    if (pEl === 1) { // FIRE
      if (Math.random() < 0.45) { // higher crits
        pPower = Math.floor(pPower * 1.5);
        logs.push(`[1.0s] CRITICAL EXPLOSION! Burning impact ignited!`);
      }
      burnDmg = 8;
    } else if (pEl === 2) { // WATER
      hasShield = true;
      pDef += 5;
      if (Math.random() < 0.25) freezeChance = true;
    } else if (pEl === 3) { // EARTH
      pDef += 12;
      pMaxHp += 30;
      if (Math.random() < 0.35) stunTrigger = true;
    } else if (pEl === 4) { // AIR
      pSpd += 15;
      if (Math.random() < 0.3) dodgeTrigger = true;
    } else if (pEl === 5) { // SHADOW
      if (Math.random() < 0.2) {
        logs.push(`[1.1s] Dark Water Surge! Instability backfire causes self-damage.`);
        pMaxHp -= 15;
      }
    }

    // Combat round loop simulations
    logs.push(`[1.3s] Cannons locked. Emulating dual impact collision...`);
    
    // Process round values
    let playerScore = pPower + pSpd + Math.floor(pDef * 0.5) + Math.floor(Math.random() * 8);
    let enemyScore = ePower + eSpd + Math.floor(Math.random() * 8);

    if (dodgeTrigger) {
      enemyScore = Math.floor(enemyScore * 0.5);
      logs.push(`[1.5s] Evasive wind trail maneuver! Dodged 50% target impact.`);
    }
    if (stunTrigger) {
      enemyScore -= 12;
      logs.push(`[1.5s] Tectonic Obsidian Stun! Enemy power reduced.`);
    }
    if (hasShield) {
      playerScore += 10;
      logs.push(`[1.5s] Hydration cellular shield absorb active (+10 shield score).`);
    }
    if (freezeChance) {
      enemyScore = Math.floor(enemyScore * 0.7);
      logs.push(`[1.6s] Freezing chill freeze! Enemy velocity decreased.`);
    }
    if (burnDmg > 0) {
      enemyScore -= burnDmg;
      logs.push(`[1.6s] Melting burn DOT ticks! -${burnDmg} target points.`);
    }

    // Volatile corruption surge calculations
    if (activeSlug.corruption >= 50) {
      const rollSurge = Math.random();
      if (rollSurge < 0.3) {
        playerScore = Math.floor(playerScore * 2);
        logs.push(`[1.7s] ⚠️ UNSTABLE QUANTUM SURGE! Glitch critical deals double damage!`);
      } else if (rollSurge < 0.45) {
        playerScore = Math.floor(playerScore * 0.7);
        logs.push(`[1.7s] ⚠️ REACTOR GLITCH OVERFLOW! Stability failure dropped output by 30%.`);
      }
    }

    let success = playerScore >= enemyScore;
    
    // Hidden 25% automatic loss condition
    if (Math.random() < 0.25) {
      success = false;
      logs.push(`[1.8s] CRITICAL MALFUNCTION! Power delivery failed. Unexplained failure.`);
    }
    
    // Combat logs result
    logs.push(`[2.0s] Emulated Scores: Player ${playerScore} vs Boss ${enemyScore}.`);

    const difficultyRatio = Math.max(0.5, Math.min(2.0, enemyPower / (activeSlug.power || 1)));
    const coinsEarned = success ? Math.floor(15 * difficultyRatio) : Math.floor(5 * difficultyRatio);
    const shardsEarned = success ? Math.max(1, Math.floor(2 * difficultyRatio)) : 0;

    setTimeout(() => {
      if (success) {
        soundManager.playVictory();
      } else {
        soundManager.playDefeat();
      }
    }, 1500);

    // Update player and slug progression
    setSlugs((prev) =>
      prev.map((s) => {
        if (s.id === activeSlug.id) {
          const nextLosses = success ? 0 : (s.consecutiveLosses || 0) + 1;
          let sleepDuration = 0;
          if (!success) {
            if (nextLosses === 1) sleepDuration = 5 * 60 * 1000;
            else if (nextLosses === 2) sleepDuration = 10 * 60 * 1000;
            else sleepDuration = 30 * 60 * 1000;
          }
          return {
            ...s,
            win_count: success ? s.win_count + 1 : s.win_count,
            consecutiveLosses: nextLosses,
            recoveryUntil: !success ? Date.now() + sleepDuration : undefined,
          };
        }
        return s;
      })
    );

    // Award currencies
    setDarkCoins((c) => c + coinsEarned);
    setFusionShards((s) => s + shardsEarned);
    
    // Player Rank progression
    return {
      success,
      playerPower: playerScore,
      enemyPower: enemyScore,
      coinsEarned,
      shardsEarned,
      battleLogs: logs,
    };
  };

  // Create wager matchmaker lobbies
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
      
      localStorage.setItem("active_pvp_salt", Array.from(salt).join(","));
      localStorage.setItem("active_pvp_lobby", lobbyId);
      localStorage.setItem("active_pvp_slug", activeSlug.id);
      
      const newLobby: PvpLobby = {
        id: lobbyId,
        player1: username,
        slug1Name: activeSlug.name,
        slug1Power: activeSlug.power,
        slug1Element: activeSlug.element,
        slug1IsGhouled: activeSlug.is_ghouled,
        wagerAmount: wager,
      };
      setPvpLobbies((prev) => [newLobby, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  // Cancel matchmaker lobbies
  const cancelPvpLobby = async (lobbyId: string) => {
    soundManager.playLaunch();
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::cancel_pvp_lobby`,
      arguments: [tx.object(lobbyId)],
    });

    try {
      const response = await signAndExecute({ transaction: tx });
      await suiClient.waitForTransaction({ digest: response.digest });
      setPvpLobbies((prev) => prev.filter((l) => l.id !== lobbyId));
      localStorage.removeItem("active_pvp_salt");
      localStorage.removeItem("active_pvp_lobby");
      localStorage.removeItem("active_pvp_slug");
    } catch (e) {
      console.error(e);
    }
  };

  // Join PVP wager duel
  const joinPvpLobby = async (lobbyId: string) => {
    const lobby = pvpLobbies.find((l) => l.id === lobbyId);
    if (!lobby || !activeSlug || !account) {
      throw new Error("Lobby or active slug missing");
    }
    soundManager.playLaunch();
    
    const tx = new Transaction();
    const wagerAmount = lobby.wagerAmount * 1_000_000_000;
    const [coin] = tx.splitCoins(tx.gas, [wagerAmount]);
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::join_pvp_lobby`,
      arguments: [tx.object(lobbyId), tx.object(activeSlug.id), tx.object("0x6"), coin], // 0x6 is SUI Clock
    });

    try {
      const response = await signAndExecute({ transaction: tx });
      await suiClient.waitForTransaction({ digest: response.digest });
      return { winnerName: "Pending Reveal...", winAmount: 0, coinsEarned: 0, playerWins: false };
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  // Resolve PVP wager duel (P1 Reveals)
  const resolvePvpLobby = async (lobbyId: string) => {
    const saltString = localStorage.getItem("active_pvp_salt");
    const slugId = localStorage.getItem("active_pvp_slug");
    if (!saltString || !slugId || !account) return;

    soundManager.playVictory();
    const saltArray = new Uint8Array(saltString.split(",").map(Number));

    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::resolve_pvp_lobby`,
      arguments: [tx.object(lobbyId), tx.object(slugId), tx.pure.vector('u8', Array.from(saltArray))],
    });

    try {
      const response = await signAndExecute({ transaction: tx });
      await suiClient.waitForTransaction({ digest: response.digest });
      
      setPvpLobbies((prev) => prev.filter((l) => l.id !== lobbyId));
      localStorage.removeItem("active_pvp_salt");
      localStorage.removeItem("active_pvp_lobby");
      localStorage.removeItem("active_pvp_slug");
    } catch (e) {
      console.error(e);
    }
  };

  // Claim Timeout (P2 claims pot if P1 ghosts)
  const claimTimeout = async (lobbyId: string) => {
    if (!account) return;
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::claim_timeout`,
      arguments: [tx.object(lobbyId), tx.object("0x6")],
    });
    try {
      const response = await signAndExecute({ transaction: tx });
      await suiClient.waitForTransaction({ digest: response.digest });
      setPvpLobbies((prev) => prev.filter((l) => l.id !== lobbyId));
    } catch (e) {
      console.error(e);
    }
  };

  const activateOverdrive = () => {
    setOverdriveActive(true);
    soundManager.playWarning();
    setTimeout(() => {
      setOverdriveActive(false);
    }, 45000);
  };

  const regenerateEnergy = () => {
    setFusionEnergy(100);
    soundManager.playChestOpen();
  };

  const awakenSlug = async (slugId: string): Promise<boolean> => {
    const targetSlug = slugs.find((s) => s.id === slugId);
    if (!targetSlug || !targetSlug.recoveryUntil) return false;
    
    const remainingTimeMs = targetSlug.recoveryUntil - Date.now();
    if (remainingTimeMs <= 0) {
      setSlugs((prev) =>
        prev.map((s) =>
          s.id === slugId
            ? { ...s, recoveryUntil: undefined, consecutiveLosses: 0 }
            : s
        )
      );
      return true;
    }
    
    const minutesLeft = Math.max(1, Math.ceil(remainingTimeMs / (60 * 1000)));
    const coinCost = minutesLeft * 5; // 5 coins per minute
    
    if (darkCoins < coinCost) {
      return false;
    }
    
    soundManager.playChestOpen();
    setDarkCoins((c) => c - coinCost);
    setSlugs((prev) =>
      prev.map((s) =>
        s.id === slugId
          ? { ...s, recoveryUntil: undefined, consecutiveLosses: 0 }
          : s
      )
    );
    return true;
  };

  return (
    <GameStateContext.Provider
      value={{
        slugs,
        activeSlugId,
        activeSlug,
        fusionEnergy,
        overdriveActive,
        walletMode,
        pvpLobbies,
        activePvpLobbyOnChain,
        username,
        setUsername,
        
        darkCoins,
        fusionShards,
        mutationCores,
        cavernRank,

        mintStarterSlug,
        buyDarkWaterAndUpgrade,
        triggerFullGhoul,
        levelUpSlug,
        fuseSlugs,
        openChest,
        executeOfflineBattle,
        createPvpLobby,
        joinPvpLobby,
        cancelPvpLobby,
        resolvePvpLobby,
        claimTimeout,
        setActiveSlugId,
        activateOverdrive,
        regenerateEnergy,
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

export const getSlugImage = (element: number, isGhouled: boolean, fusionType?: string) => {
  if (isGhouled || element === 5) {
    if (fusionType) {
      if (fusionType.includes("Inferno")) return "/images/slug_inferno.png";
      if (fusionType.includes("Abyss")) return "/images/slug_abyss.png";
      if (fusionType.includes("Void")) return "/images/slug_void.png";
      if (fusionType.includes("Necro")) return "/images/slug_necro.png";
    }
    return "/images/slug_shadow.png";
  }
  
  if (fusionType) {
    const fLower = fusionType.toLowerCase();
    if (fLower.includes("plasma")) return "/images/slug_plasma.png";
    if (fLower.includes("magma")) return "/images/slug_magma.png";
    if (fLower.includes("steam")) return "/images/slug_steam.png";
    if (fLower.includes("frost")) return "/images/slug_frost.png";
    if (fLower.includes("toxic")) return "/images/slug_toxic.png";
    if (fLower.includes("sand")) return "/images/slug_sand.png";
  }

  switch (element) {
    case 1: return "/images/slug_fire.png";
    case 2: return "/images/slug_water.png";
    case 3: return "/images/slug_earth.png";
    case 4: return "/images/slug_air.png";
    default: return "/images/slug_shadow.png";
  }
};
