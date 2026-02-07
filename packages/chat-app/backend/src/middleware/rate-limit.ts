/**
 * Rate Limiting Middleware
 * IP-based rate limiting for HTTP endpoints
 */

import { RateLimitError } from "../types/index.js";
import { config } from "../config/index.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = config.rateLimitWindowMs, maxRequests: number = config.rateLimitMax) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if a request should be rate limited
   * @throws {RateLimitError} if rate limit is exceeded
   */
  check(identifier: string): void {
    const now = Date.now();
    let entry = this.entries.get(identifier);

    // Reset if window has expired
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + this.windowMs };
      this.entries.set(identifier, entry);
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > this.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter
      );
    }
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemaining(identifier: string): number {
    const entry = this.entries.get(identifier);
    if (!entry || Date.now() > entry.resetAt) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries.entries()) {
      if (now > entry.resetAt) {
        this.entries.delete(key);
      }
    }
  }

  /**
   * Reset all entries (useful for testing)
   */
  reset(): void {
    this.entries.clear();
  }
}

// Express middleware factory
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return function rateLimitMiddleware(
    req: { ip?: string; headers: { "x-forwarded-for"?: string | string[] | undefined } },
    _res: unknown,
    next: (err?: unknown) => void
  ) {
    // Get IP from various sources
    const forwardedFor = req.headers["x-forwarded-for"];
    const ip =
      (typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : undefined) ||
      req.ip ||
      "unknown";

    try {
      limiter.check(ip);
      next();
    } catch (error) {
      next(error);
    }
  };
}
