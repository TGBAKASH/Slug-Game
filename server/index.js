import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

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
app.use(express.json({ limit: '10kb' })); // Block oversized payloads

// Security headers (XSS, clickjacking, MIME sniffing protection)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // frontend handles CSP
}));

// Global rate limit: 100 requests per 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down' },
}));

// Stricter rate limit for state-changing API routes
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,             // 20 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'API rate limit exceeded' },
});

// CORS — only allow our frontend domains
const ALLOWED_ORIGINS = [
  'https://slugterra.akashweb333.workers.dev',
  'https://slugterra.onrender.com',
  'https://slug-game.onrender.com',
  'http://localhost:5173',
];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ─── MongoDB Connection ───
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/slugterra';
const DB_NAME = process.env.DB_NAME || 'slugterra';
const PORT = process.env.PORT || 3000;
const API_SECRET = process.env.API_SECRET || crypto.randomBytes(32).toString('hex');

let db;
let coinsCollection;
let energyCollection;

async function connectDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  coinsCollection = db.collection('coins');
  energyCollection = db.collection('energy');
  
  // Create unique index on wallet
  await coinsCollection.createIndex({ wallet: 1 }, { unique: true });
  await energyCollection.createIndex({ wallet: 1 }, { unique: true });
  console.log('[DB] Connected to MongoDB');
}

// ─── Helpers ───

const STARTING_COINS = 350;
const MAX_LEVEL = 50;
const MAX_EARN_PER_BATTLE = 500; // cap to prevent abuse
const RATE_LIMIT_MS = 2000;      // 2 seconds between requests per wallet
const MAX_ENERGY = 10;
const ENERGY_REFILL_MS = 3600000; // 1 hour per energy point

// Simple in-memory rate limiter (per wallet, supplements IP rate limit)
const lastRequest = new Map();

function walletRateLimit(wallet) {
  const now = Date.now();
  const last = lastRequest.get(wallet) || 0;
  if (now - last < RATE_LIMIT_MS) return false;
  lastRequest.set(wallet, now);
  return true;
}

// HMAC request verification — prevents API abuse from outside the app
function verifySignature(body) {
  const { _ts, _sig, ...payload } = body;
  if (!_ts || !_sig) return false;
  // Reject requests older than 30 seconds
  if (Math.abs(Date.now() - _ts) > 30000) return false;
  const message = JSON.stringify(payload) + _ts;
  const expected = crypto.createHmac('sha256', API_SECRET).update(message).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(_sig, 'hex'), Buffer.from(expected, 'hex'));
}

async function getEnergy(wallet) {
  let doc = await energyCollection.findOne({ wallet });
  if (!doc) {
    doc = { wallet, energy: MAX_ENERGY, lastRefillAt: new Date(), createdAt: new Date() };
    await energyCollection.insertOne(doc);
    return { energy: MAX_ENERGY, maxEnergy: MAX_ENERGY, nextRefillAt: null };
  }
  // Calculate refilled energy based on time elapsed
  const now = Date.now();
  const elapsed = now - doc.lastRefillAt.getTime();
  const refilled = Math.floor(elapsed / ENERGY_REFILL_MS);
  let currentEnergy = Math.min(MAX_ENERGY, doc.energy + refilled);
  
  // Update DB if any energy refilled
  if (refilled > 0 && doc.energy < MAX_ENERGY) {
    const newLastRefill = new Date(doc.lastRefillAt.getTime() + refilled * ENERGY_REFILL_MS);
    await energyCollection.updateOne({ wallet }, { $set: { energy: currentEnergy, lastRefillAt: newLastRefill } });
  }
  
  const nextRefillAt = currentEnergy < MAX_ENERGY
    ? new Date(doc.lastRefillAt.getTime() + (refilled + 1) * ENERGY_REFILL_MS).toISOString()
    : null;
  
  return { energy: currentEnergy, maxEnergy: MAX_ENERGY, nextRefillAt };
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

// GET /api/energy/:wallet — Get current arena energy
app.get('/api/energy/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: 'Invalid wallet' });
    const energy = await getEnergy(wallet);
    res.json(energy);
  } catch (err) {
    console.error('[API] GET /energy error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/energy/use — Deduct 1 energy before a PvE battle
app.post('/api/energy/use', apiLimiter, async (req, res) => {
  try {
    const { wallet, _ts, _sig } = req.body;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: 'Invalid wallet' });
    if (!verifySignature(req.body)) return res.status(403).json({ error: 'Invalid signature' });
    
    // First, apply any pending refills
    await getEnergy(wallet);
    
    // Atomically deduct 1 energy only if energy > 0
    const result = await energyCollection.findOneAndUpdate(
      { wallet, energy: { $gte: 1 } },
      { $inc: { energy: -1 } },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      // Either wallet doesn't exist or energy is 0
      const current = await getEnergy(wallet);
      return res.status(403).json({ 
        error: 'No arena energy remaining', 
        energy: current.energy, 
        maxEnergy: MAX_ENERGY, 
        nextRefillAt: current.nextRefillAt 
      });
    }
    
    // Calculate next refill time from the updated doc
    const nextRefillAt = result.energy < MAX_ENERGY
      ? new Date(result.lastRefillAt.getTime() + ENERGY_REFILL_MS).toISOString()
      : null;
    
    res.json({ energy: result.energy, maxEnergy: MAX_ENERGY, nextRefillAt });
  } catch (err) {
    console.error('[API] POST /energy/use error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

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
app.post('/api/coins/earn', apiLimiter, async (req, res) => {
  try {
    const { wallet, amount, reason, _ts, _sig } = req.body;
    
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: 'Invalid wallet' });
    if (!amount || amount <= 0 || amount > MAX_EARN_PER_BATTLE) return res.status(400).json({ error: 'Invalid amount' });
    if (!verifySignature(req.body)) return res.status(403).json({ error: 'Invalid signature' });
    if (!walletRateLimit(wallet)) return res.status(429).json({ error: 'Too fast' });
    
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
app.post('/api/coins/spend', apiLimiter, async (req, res) => {
  try {
    const { wallet, amount, reason, slugLevel, _ts, _sig } = req.body;
    
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: 'Invalid wallet' });
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (!verifySignature(req.body)) return res.status(403).json({ error: 'Invalid signature' });
    if (!walletRateLimit(wallet)) return res.status(429).json({ error: 'Too fast' });
    
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

// Compression: ONLY for text-based files (HTML, CSS, JS, JSON).
// NEVER compress images (WebP/PNG/JPG) — they're already compressed,
// and trying to gzip them wastes CPU and blocks the event loop.
app.use(compression({
  filter: (req, res) => {
    const type = res.getHeader('Content-Type');
    if (typeof type === 'string' && /image|video|audio|webp|png|jpg|jpeg|gif|woff|woff2/.test(type)) {
      return false; // skip compression for binary files
    }
    return compression.filter(req, res);
  }
}));

// Sequence frames: 30-day cache, no compression needed (WebP is already compressed)
app.use('/sequence', express.static(path.join(frontendPath, 'sequence'), {
  maxAge: '30d',
  immutable: true,
  etag: false,       // skip ETag computation for faster response
  lastModified: false // skip stat() call
}));

// Other static files: 1-day cache
app.use(express.static(frontendPath, {
  maxAge: '1d',
  etag: true
}));

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
