import type { AuthUser } from '../lib/authApi';

export function truncateWalletAddress(address: string): string {
  const a = address.trim();
  if (a.length <= 14) return a;
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

export function accountDisplayLabel(user: AuthUser): string {
  const name = user.name?.trim();
  if (name) return name;
  const un = user.username?.trim();
  if (un) return un;
  const em = user.email?.trim();
  if (em) return em.split('@')[0] || em;
  return 'Account';
}
