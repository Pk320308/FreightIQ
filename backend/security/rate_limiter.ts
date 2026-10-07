/**
 * API Rate Limiter (Sliding Window Algorithm)
 * Prevents DDoS attacks and API abuse on prediction/simulation endpoints.
 */

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitStore>();

// Clean up stale IP records every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((value, key) => {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    });
  }, 300000);
}

export function checkRateLimit(
  identifier: string,
  limit: number = 60, // 60 requests
  windowMs: number = 60000 // per 1 minute
): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, reset: now + windowMs };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, reset: record.resetTime };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count, reset: record.resetTime };
}
