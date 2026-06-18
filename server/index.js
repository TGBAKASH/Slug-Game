import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

/* ═══════════════════════════════════════════════════════════════
   Slugterra Server — Single Render Service
   
   Serves:
   1. REST API for Dark Coins (MongoDB-backed)
   2. Built React frontend (static files)
   
   All in one process = one Render free-tier service.
   ═══════════════════════════════════════════════════════════════ */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ─── MongoDB Connection ───
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/slugterra';
const DB_NAME = process.env.DB_NAME || 'slugterra';
const PORT = process.env.PORT || 3000;
const API_SECRET = process.env.API_SECRET || crypto.randomBytes(32).toString('hex');

let db;
let coinsCollection;

async function connectDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  coinsCollection = db.collection('coins');
  
  // Create unique index on wallet
  await coinsCollection.createIndex({ wallet: 1 }, { unique: true });
  console.log('[DB] Connected to MongoDB');
}

// ─── Helpers ───

const STARTING_COINS = 350;
const MAX_LEVEL = 50;
const MAX_EARN_PER_BATTLE = 500; // cap to prevent abuse
const RATE_LIMIT_MS = 2000;      // 2 seconds between requests per wallet

// Simple in-memory rate limiter
const lastRequest = new Map();

function rateLimit(wallet) {
  const now = Date.now();
  const last = lastRequest.get(wallet) || 0;
  if (now - last < RATE_LIMIT_MS) return false;
  lastRequest.set(wallet, now);
  return true;
}

// Get or initialize wallet balance
async function getBalance(wallet) {
  let doc = await coinsCollection.findOne({ wallet });
  if (!doc) {
    doc = { wallet, balance: STARTING_COINS, totalEarned: 0, totalSpent: 0, createdAt: new Date() };
    await coinsCollection.insertOne(doc);
  }
  return doc;
}

// ─── API Routes ───

// GET /api/coins/:wallet — Get balance
app.get('/api/coins/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: 'Invalid wallet' });
    
    const doc = await getBalance(wallet);
    res.json({ balance: doc.balance });
  } catch (err) {
    console.error('[API] GET /coins error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/coins/earn — Earn coins (PvE win, spin, premium mint bonus)
app.post('/api/coins/earn', async (req, res) => {
  try {
    const { wallet, amount, reason } = req.body;
    
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: 'Invalid wallet' });
    if (!amount || amount <= 0 || amount > MAX_EARN_PER_BATTLE) return res.status(400).json({ error: 'Invalid amount' });
    if (!rateLimit(wallet)) return res.status(429).json({ error: 'Too fast' });
    
    // Validate reason
    const validReasons = ['pve_win', 'spin_coins', 'premium_mint_bonus', 'ascend_refund'];
    if (!validReasons.includes(reason)) return res.status(400).json({ error: 'Invalid reason' });
    
    const result = await coinsCollection.findOneAndUpdate(
      { wallet },
      { 
        $inc: { balance: Math.floor(amount), totalEarned: Math.floor(amount) },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true, returnDocument: 'after' }
    );
    
    res.json({ balance: result.balance });
  } catch (err) {
    console.error('[API] POST /coins/earn error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/coins/spend — Spend coins (level up, awaken)
app.post('/api/coins/spend', async (req, res) => {
  try {
    const { wallet, amount, reason, slugLevel } = req.body;
    
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: 'Invalid wallet' });
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (!rateLimit(wallet)) return res.status(429).json({ error: 'Too fast' });
    
    // Validate level-up cost matches formula
    if (reason === 'level_up') {
      const expectedCost = (slugLevel || 1) * 10;
      if (amount !== expectedCost) {
        return res.status(400).json({ error: `Cost mismatch: expected ${expectedCost}, got ${amount}` });
      }
      if (slugLevel >= MAX_LEVEL) {
        return res.status(400).json({ error: 'Already max level' });
      }
    }
    
    // Validate awaken cost
    if (reason === 'awaken') {
      // awakenCost = remainingMinutes * 5
      if (amount > 150) { // max 30 min * 5 = 150
        return res.status(400).json({ error: 'Awaken cost too high' });
      }
    }
    
    // Atomic deduction — only succeeds if balance >= amount
    const result = await coinsCollection.findOneAndUpdate(
      { wallet, balance: { $gte: Math.floor(amount) } },
      { $inc: { balance: -Math.floor(amount), totalSpent: Math.floor(amount) } },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      // Either wallet doesn't exist or insufficient balance
      const doc = await getBalance(wallet);
      return res.status(400).json({ error: 'Insufficient coins', balance: doc.balance });
    }
    
    res.json({ balance: result.balance, spent: amount });
  } catch (err) {
    console.error('[API] POST /coins/spend error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/coins/init — Initialize wallet (idempotent)
app.post('/api/coins/init', async (req, res) => {
  try {
    const { wallet } = req.body;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: 'Invalid wallet' });
    
    const doc = await getBalance(wallet);
    res.json({ balance: doc.balance });
  } catch (err) {
    console.error('[API] POST /coins/init error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/health — Health check for Render
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ─── Serve Frontend (built React app) ───
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendPath));

// SPA fallback — all non-API routes serve index.html
app.get('{*path}', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ─── Start ───
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[Server] Slugterra running on port ${PORT}`);
    console.log(`[Server] Frontend: ${frontendPath}`);
  });
}

start().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
