/* ═══════════════════════════════════════════════════════════════
   Coins API Client — replaces localStorage coin storage
   
   All coin operations go through the server API instead of
   being stored in tamper-prone localStorage.
   ═══════════════════════════════════════════════════════════════ */

const API_BASE = import.meta.env.VITE_API_URL || '';

interface CoinsResponse {
  balance: number;
  error?: string;
  spent?: number;
}

async function apiCall(endpoint: string, options?: RequestInit): Promise<CoinsResponse> {
  const res = await fetch(`${API_BASE}/api/coins${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

/** Get current coin balance for a wallet */
export async function getCoinsBalance(wallet: string): Promise<number> {
  const data = await apiCall(`/${wallet}`);
  return data.balance;
}

/** Initialize wallet (returns existing balance or creates with 350) */
export async function initCoins(wallet: string): Promise<number> {
  const data = await apiCall('/init', {
    method: 'POST',
    body: JSON.stringify({ wallet }),
  });
  return data.balance;
}

/** Earn coins — returns new balance */
export async function earnCoins(
  wallet: string,
  amount: number,
  reason: 'pve_win' | 'spin_coins' | 'premium_mint_bonus' | 'ascend_refund'
): Promise<number> {
  const data = await apiCall('/earn', {
    method: 'POST',
    body: JSON.stringify({ wallet, amount: Math.floor(amount), reason }),
  });
  return data.balance;
}

/** Spend coins — returns new balance. Throws if insufficient. */
export async function spendCoins(
  wallet: string,
  amount: number,
  reason: 'level_up' | 'awaken',
  slugLevel?: number
): Promise<number> {
  const data = await apiCall('/spend', {
    method: 'POST',
    body: JSON.stringify({ wallet, amount: Math.floor(amount), reason, slugLevel }),
  });
  return data.balance;
}
