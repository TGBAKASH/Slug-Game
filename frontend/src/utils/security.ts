/**
 * Security utilities for Slugterra frontend.
 * Provides HMAC integrity protection for localStorage values,
 * AES encryption for PvP salts, and input sanitization.
 */

// ─── HMAC Integrity Protection ───
// Uses a per-session key derived from wallet address + app salt
// This prevents simple DevTools → localStorage edits

const APP_INTEGRITY_SALT = "slugterra_v2_integrity_2026";

async function deriveKey(walletAddress: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(walletAddress + APP_INTEGRITY_SALT),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  return keyMaterial;
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Store a value in localStorage with HMAC integrity protection.
 * Format: "value|hmac_hex"
 */
export async function secureStore(key: string, value: string, walletAddress: string): Promise<void> {
  try {
    const cryptoKey = await deriveKey(walletAddress);
    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(key + ":" + value));
    const hmac = bufToHex(signature);
    localStorage.setItem(key, `${value}|${hmac}`);
  } catch {
    // Fallback: store plain (WebCrypto not available in some contexts)
    localStorage.setItem(key, value);
  }
}

/**
 * Read a value from localStorage and verify HMAC integrity.
 * Returns null if tampered or missing.
 */
export async function secureRead(key: string, walletAddress: string): Promise<string | null> {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  // Check if it has HMAC signature
  const pipeIdx = raw.lastIndexOf('|');
  if (pipeIdx === -1) return null; // No signature = tampered or legacy

  const value = raw.substring(0, pipeIdx);
  const hmac = raw.substring(pipeIdx + 1);

  try {
    const cryptoKey = await deriveKey(walletAddress);
    const encoder = new TextEncoder();
    const valid = await crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      hexToBuf(hmac) as any,
      encoder.encode(key + ":" + value)
    );
    return valid ? value : null;
  } catch {
    return null;
  }
}

// ─── PvP Salt Encryption ───
// Encrypts salt using AES-GCM with a key derived from wallet address

async function deriveAesKey(walletAddress: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(walletAddress + "pvp_key_derive"),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: encoder.encode("slugterra_pvp_salt"), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt PvP salt before storing in localStorage.
 */
export async function encryptSalt(salt: Uint8Array, walletAddress: string): Promise<string> {
  try {
    const key = await deriveAesKey(walletAddress);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as any }, key, salt as any);
    // Store as iv_hex:encrypted_hex
    return bufToHex(iv.buffer as ArrayBuffer) + ":" + bufToHex(encrypted);
  } catch {
    // Fallback: base64
    return btoa(String.fromCharCode(...salt));
  }
}

/**
 * Decrypt PvP salt from localStorage.
 */
export async function decryptSalt(stored: string, walletAddress: string): Promise<Uint8Array> {
  try {
    if (stored.includes(':')) {
      // Encrypted format: iv_hex:encrypted_hex
      const [ivHex, encHex] = stored.split(':');
      const key = await deriveAesKey(walletAddress);
      const iv = hexToBuf(ivHex);
      const encrypted = hexToBuf(encHex);
      const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as any }, key, encrypted as any);
      return new Uint8Array(decrypted);
    }
  } catch { /* fall through */ }

  // Legacy format: comma-separated or base64
  if (stored.includes(',')) {
    return new Uint8Array(stored.split(",").map(Number));
  }
  // base64 fallback
  return new Uint8Array(atob(stored).split('').map(c => c.charCodeAt(0)));
}

// ─── Input Sanitization ───

/**
 * Sanitize user input to prevent XSS.
 * Strips HTML tags, scripts, and special characters.
 * Limits length.
 */
export function sanitizeSlugName(name: string): string {
  return name
    .replace(/<[^>]*>/g, '')          // Strip HTML tags
    .replace(/[&<>"'`\/\\]/g, '')     // Strip dangerous chars
    .replace(/javascript:/gi, '')      // Strip JS protocol
    .replace(/on\w+=/gi, '')          // Strip event handlers
    .trim()
    .substring(0, 20);                // Max 20 chars
}

/**
 * Sanitize any string for safe display (no HTML injection).
 */
export function sanitizeDisplay(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ─── Seeded PRNG for Deterministic Battle ───

/**
 * Create a seeded pseudo-random number generator.
 * Uses a simple but effective xoshiro128** algorithm.
 */
export function createSeededRNG(seed: string): () => number {
  // Hash seed to get 4 32-bit numbers
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }

  let s0 = h ^ 0x9e3779b9;
  let s1 = h ^ 0x6a09e667;
  let s2 = h ^ 0x3c6ef372;
  let s3 = h ^ 0xbb67ae85;

  return function(): number {
    const t = s1 << 9;
    let r = s0 * 5;
    r = ((r << 7) | (r >>> 25)) * 9;

    s2 ^= s0;
    s3 ^= s1;
    s1 ^= s2;
    s0 ^= s3;
    s2 ^= t;
    s3 = (s3 << 11) | (s3 >>> 21);

    return (r >>> 0) / 4294967296;
  };
}

// ─── Rate Limiter ───

const lastCallTimes: Map<string, number> = new Map();

/**
 * Check if an action is rate-limited.
 * Returns true if action is allowed, false if rate-limited.
 */
export function checkRateLimit(actionKey: string, cooldownMs: number): boolean {
  const now = Date.now();
  const lastCall = lastCallTimes.get(actionKey) || 0;
  if (now - lastCall < cooldownMs) {
    return false; // Rate limited
  }
  lastCallTimes.set(actionKey, now);
  return true;
}

// ─── Safe Logger ───

/**
 * Log errors without exposing stack traces in production.
 */
export function safeLog(context: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  } else {
    console.error(`[${context}] Operation failed`);
  }
}
