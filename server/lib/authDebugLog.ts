/** Verbose auth/mail logs while pre-launch — safe to dial back before public release. */
export function authDebugLog(
  scope: string,
  event: string,
  details?: Record<string, unknown>
): void {
  const label = `[${scope}] ${event}`;
  if (details && Object.keys(details).length > 0) {
    console.info(label, details);
    return;
  }
  console.info(label);
}

export function authDebugWarn(
  scope: string,
  event: string,
  details?: Record<string, unknown>
): void {
  const label = `[${scope}] ${event}`;
  if (details && Object.keys(details).length > 0) {
    console.warn(label, details);
    return;
  }
  console.warn(label);
}

export function authDebugError(
  scope: string,
  event: string,
  details?: Record<string, unknown>
): void {
  const label = `[${scope}] ${event}`;
  if (details && Object.keys(details).length > 0) {
    console.error(label, details);
    return;
  }
  console.error(label);
}
