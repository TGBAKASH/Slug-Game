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

## Anti-Exploit & Economy Protection

We've built multiple layers of protection to keep the in-game economy fair and prevent abuse.

**Server-Side Coin Storage**
All Dark Coin balances are stored in MongoDB on the server — not in the browser. Players can't edit localStorage or tamper with their balance. Every coin earned or spent goes through server validation before being applied.

**Arena Energy System**
Players get 10 arena energy. Each PvE win costs 1 energy. Energy refills at a rate of 1 per hour. This caps coin farming to roughly 10 battles before you have to wait. The server enforces this — even if someone bypasses the frontend, the API will reject coin grants when energy is empty.

**Per-Wallet Rate Limiting**
Every API call is rate-limited to one request per 2 seconds per wallet address. This is enforced server-side using an in-memory map, preventing rapid-fire abuse of any endpoint.

**Coin Earning Cap**
A single PvE battle can award at most 200 Dark Coins. The server also enforces a hard cap of 500 coins per API call regardless of what the client sends. This prevents inflated coin injection even if someone crafts a manual API request.

**Loss Streak Sleep Penalty**
Losing consecutive PvE battles puts your slug to sleep — 5 minutes for the first loss, 15 minutes for the second, and 30 minutes for three or more in a row. Winning resets the counter. This prevents mindless battle spam and makes each fight matter.

**Server-Validated Level-Up Costs**
When leveling up a slug, the server independently calculates the expected cost using the formula `level × 10` and rejects the transaction if the amount doesn't match. You can't trick the API into accepting a cheaper level-up.

**On-Chain Ownership**
Slugs are Sui NFTs. Minting, evolution, and PvP resolution happen on-chain through Move smart contracts. You can't fake ownership or duplicate slugs — the blockchain is the source of truth.

**Reason-Locked Earning**
The earn endpoint only accepts specific reasons: `pve_win`, `spin_coins`, `premium_mint_bonus`, and `ascend_refund`. Any request with an unknown reason is rejected. This prevents arbitrary coin minting through API misuse.

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

**blockchain-games.site** — Domain is being configured and will be updated soon.

The current live build is hosted on a free-tier server, so the initial load takes longer than usual (the dashboard loads 200 animation frames on first visit). Once cached, subsequent visits are fast.

[slug-game.onrender.com](https://slug-game.onrender.com)
