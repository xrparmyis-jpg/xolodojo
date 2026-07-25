/**
 * sessionStorage helpers that only persist when Functional consent is granted.
 * Without consent, writes are no-ops and reads return null (in-memory UI state
 * in React can still work for the current page visit).
 */

import { allowFunctionalStorage } from './cookie-consent';

export function setFunctionalSessionItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  if (!allowFunctionalStorage()) return false;
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function getFunctionalSessionItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  if (!allowFunctionalStorage()) return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function removeFunctionalSessionItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
