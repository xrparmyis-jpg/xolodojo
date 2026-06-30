/** Verbose client auth logs while pre-launch — dial back before public release. */
export function authClientDebugLog(
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

export function authClientDebugWarn(
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

export function authClientDebugError(
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
