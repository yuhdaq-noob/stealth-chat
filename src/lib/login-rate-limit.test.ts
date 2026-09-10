import { describe, expect, it } from "vitest";
import {
  clearLoginFailures,
  getLoginRateLimit,
  getLoginRateLimitKey,
  recordLoginFailure,
} from "./login-rate-limit";

describe("login rate limit", () => {
  it("blocks after five failures and reports a retry delay", () => {
    const key = getLoginRateLimitKey("127.0.0.1", "Yuhda");
    const now = 1_000_000;

    for (let attempt = 1; attempt < 5; attempt += 1) {
      expect(recordLoginFailure(key, now)).toBe(0);
    }
    expect(recordLoginFailure(key, now)).toBe(900);

    expect(getLoginRateLimit(key, now)).toEqual({
      allowed: false,
      retryAfterSeconds: 900,
    });
  });

  it("allows a successful login to reset the failure counter", () => {
    const key = getLoginRateLimitKey("127.0.0.2", "Ratih");
    const now = 2_000_000;

    recordLoginFailure(key, now);
    clearLoginFailures(key);

    expect(getLoginRateLimit(key, now)).toEqual({
      allowed: true,
      retryAfterSeconds: 0,
    });
  });

  it("allows another attempt after the failure window expires", () => {
    const key = getLoginRateLimitKey("127.0.0.3", "Unknown");
    const now = 3_000_000;

    recordLoginFailure(key, now);
    expect(getLoginRateLimit(key, now + 15 * 60 * 1000 + 1)).toEqual({
      allowed: true,
      retryAfterSeconds: 0,
    });
  });
});
