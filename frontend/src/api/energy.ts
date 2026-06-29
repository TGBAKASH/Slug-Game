const API_BASE = import.meta.env.VITE_API_URL || '';

export interface EnergyResponse {
  energy: number;
  maxEnergy: number;
  nextRefillAt: string | null;
}

export async function getArenaEnergy(wallet: string): Promise<EnergyResponse> {
  const res = await fetch(`${API_BASE}/api/energy/${wallet}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}
