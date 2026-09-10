interface LoginAttempt {
  failures: number;
  windowStartedAt: number;
  blockedUntil: number;
}

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_TRACKED_KEYS = 10_000;

const attempts = new Map<string, LoginAttempt>();

function removeExpiredAttempts(now: number) {
  for (const [key, attempt] of attempts) {
    if (
      attempt.blockedUntil <= now &&
      attempt.windowStartedAt + WINDOW_MS <= now
    ) {
      attempts.delete(key);
    }
  }
}

export function getLoginRateLimitKey(address: string, name: string) {
  return `${address}:${name.trim().toLowerCase() || "unknown"}`;
}

export function getLoginRateLimit(key: string, now = Date.now()) {
  removeExpiredAttempts(now);
  const attempt = attempts.get(key);
  if (!attempt) return { allowed: true, retryAfterSeconds: 0 };

  if (attempt.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((attempt.blockedUntil - now) / 1000),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordLoginFailure(key: string, now = Date.now()) {
  removeExpiredAttempts(now);
  const current = attempts.get(key);
  const attempt =
    current && current.windowStartedAt + WINDOW_MS > now
      ? current
      : { failures: 0, windowStartedAt: now, blockedUntil: 0 };

  attempt.failures += 1;
  if (attempt.failures >= MAX_FAILURES) {
    attempt.blockedUntil = now + BLOCK_MS;
  }
  attempts.set(key, attempt);

  if (attempts.size > MAX_TRACKED_KEYS) removeExpiredAttempts(now);
  return Math.ceil(Math.max(0, attempt.blockedUntil - now) / 1000);
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}
