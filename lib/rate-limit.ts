/**
 * Simple in-memory rate limiter for serverless/edge functions.
 * In a production multi-instance environment, this would ideally use Redis (Upstash).
 */
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier) || { count: 0, lastReset: now };

  if (now - entry.lastReset > options.windowMs) {
    entry.count = 0;
    entry.lastReset = now;
  }

  if (entry.count >= options.limit) {
    return {
      success: false,
      remaining: 0,
      reset: entry.lastReset + options.windowMs,
    };
  }

  entry.count++;
  rateLimitMap.set(identifier, entry);

  return {
    success: true,
    remaining: options.limit - entry.count,
    reset: entry.lastReset + options.windowMs,
  };
}
