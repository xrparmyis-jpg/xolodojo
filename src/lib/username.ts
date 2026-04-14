/**
 * Shared username rules: 3–30 chars, letters/digits/._- only, must start with letter or digit.
 * Stored lowercase in the database.
 */

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

/** Allowed: alphanumeric, period, underscore, hyphen (no spaces). */
export const USERNAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,29}$/;

export type UsernameResult =
  | { ok: true; normalized: string }
  | { ok: false; error: string };

export function validateUsername(raw: string): UsernameResult {
  const s = raw.trim();
  if (!s) {
    return { ok: false, error: 'Username is required' };
  }
  if (s.length < USERNAME_MIN_LENGTH) {
    return {
      ok: false,
      error: `Username must be at least ${USERNAME_MIN_LENGTH} characters`,
    };
  }
  if (s.length > USERNAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Username must be at most ${USERNAME_MAX_LENGTH} characters`,
    };
  }
  if (!USERNAME_PATTERN.test(s)) {
    return {
      ok: false,
      error:
        'Username can only use letters, numbers, and . _ - (no spaces). It must start with a letter or number.',
    };
  }
  return { ok: true, normalized: s.toLowerCase() };
}

const DISPLAY_NAME_MAX = 255;

export function validateDisplayName(raw: string): UsernameResult {
  const s = raw.trim();
  if (!s) {
    return { ok: false, error: 'Name is required' };
  }
  if (s.length > DISPLAY_NAME_MAX) {
    return { ok: false, error: 'Name is too long' };
  }
  return { ok: true, normalized: s };
}
