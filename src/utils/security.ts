/**
 * Security and crypto helper utilities for Namaste Print
 * Adheres strictly to Section 4.1 Security Rules:
 * - PIN is stored as SHA-256 hash with salt
 * - Lockout for 15 minutes after 5 failed attempts
 * - Expiry calculations (24h for shop transfers, 7 days for customer jobs)
 */

export async function hashPin(pin: string, salt: string = 'np_salt_2026'): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}_${pin.trim()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateRandomPin(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return num.toString();
}

export function generateJobNumber(): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `NP-${randomSuffix}`;
}

export function isLockedOut(lockedUntil: string | null): { locked: boolean; remainingSeconds: number } {
  if (!lockedUntil) return { locked: false, remainingSeconds: 0 };
  const lockTime = new Date(lockedUntil).getTime();
  const now = Date.now();
  if (now < lockTime) {
    return { locked: true, remainingSeconds: Math.ceil((lockTime - now) / 1000) };
  }
  return { locked: false, remainingSeconds: 0 };
}

export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}

export function formatTimeRemaining(expiresAt: string): string {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Expired';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
