# Slugterra: Cavern Clash

A Web3 battle game on Sui where you collect, evolve, and battle elemental slugs — all on-chain.

---

## About

Slugterra lets you mint slug NFTs, level them up, and battle opponents in a PvE arena. Every slug lives on the Sui blockchain as an NFT with on-chain stats (HP, ATK, element, level, win/loss record). Elements are assigned randomly at mint time — you can't pick what you get.

There are four elements: **Fire**, **Water**, **Earth**, and **Air**. Each has strengths and weaknesses following a simple cycle: Water beats Fire, Fire beats Earth, Earth beats Air, Air beats Water. Elemental advantage gives +15% damage in battle.

Slugs can be leveled from 1 to 50 using Dark Coins (earned through battles and the Quantum Reactor). Each level up costs `current_level × 10` coins and recalculates stats on-chain.

## Game Sections

- **Dashboard** — Cinematic scroll intro with a 200-frame transformation sequence
- **Incubator** — Mint new slugs (free or premium at 0.5 SUI for better element odds)
- **Command Center** — View your slug roster, level up, manage stats
- **Cavern Arena** — PvE battles against AI opponents with elemental matchups
- **Quantum Reactor** — Daily spin (0.05 SUI) for slug drops or Dark Coin rewards
- **Leaderboard** — Your battle stats and operator metrics
- **Field Guide** — Complete game manual and mechanics reference
- **Profile** — Wallet info and account settings

## Elements

| Element | Default Name | Strong Against | Weak Against |
|---------|-------------|----------------|--------------|
| Fire | INFERNO | Earth | Water |
| Water | TIDAL | Fire | Air |
| Earth | BOULDER | Air | Fire |
| Air | ZEPHYR | Water | Earth |

## Tech Stack

- **Frontend** — React 19, TypeScript, Framer Motion, Three.js (3D slug models)
- **Backend** — Express 5, Node.js, MongoDB
- **Blockchain** — Sui (Move smart contracts)
- **Wallet** — @mysten/dapp-kit (Sui Wallet, Suiet, Ethos, Slush)
- **Hosting** — Nginx + PM2 on Ubuntu

## Setup

```bash
git clone https://github.com/TGBAKASH/Slug-Game.git
cd Slug-Game

# Install dependencies
npm run install:all

# Configure environment
cp .env.example .env
# Fill in your MongoDB URI

# Development
npm run dev:frontend    # React dev server (port 5173)
npm run dev:server      # Express API (port 3000)

# Production
npm run build
npm start
```

## Project Layout

```
frontend/
  src/components/     — All game UI (Arena, Incubator, CommandCenter, etc.)
  src/context/        — GameState (on-chain data), SceneDirector
  public/models/      — 3D slug models (.glb) for Fire, Water, Earth, Air
  public/images/      — Slug artwork
  public/sequence/    — 200 frames for the scroll animation
server/
  index.js            — Express API for Dark Coins (MongoDB-backed)
move/
  sources/            — Sui Move smart contracts
```

## Environment Variables

```
MONGODB_URI=mongodb+srv://...
DB_NAME=slugterra
PORT=3000
API_SECRET=<random-secret>
```

## Live

[blockchain-games.site](https://blockchain-games.site)
