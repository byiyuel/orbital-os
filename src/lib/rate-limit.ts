/**
 * Simple in-memory rate limiter using a Map.
 * 30 requests per minute per IP. No external dependencies.
 * Stale entries are lazily cleaned on each call.
 */

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30;

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
let nextCleanupTime = Date.now() + 10000;

/**
 * Check rate limit for a given IP address.
 * Returns { success, remaining, resetIn } or throws nothing — always returns.
 */
export function checkRateLimit(ip: string): {
  success: boolean;
  remaining: number;
  resetIn: number;
} {
  const now = Date.now();

  // Async lazy cleanup to avoid blocking the request thread
  if (now > nextCleanupTime) {
    nextCleanupTime = now + 10000; // Schedule next cleanup in 10s
    setTimeout(() => {
      const cleanupTime = Date.now();
      for (const [key, entry] of rateLimitMap) {
        if (cleanupTime > entry.resetTime) {
          rateLimitMap.delete(key);
        }
      }
    }, 0);
  }

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { success: true, remaining: MAX_REQUESTS - 1, resetIn: WINDOW_MS };
  }

  if (entry.count >= MAX_REQUESTS) {
    return {
      success: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  entry.count++;
  return {
    success: true,
    remaining: MAX_REQUESTS - entry.count,
    resetIn: entry.resetTime - now,
  };
}

/**
 * Helper to create a 429 response with proper headers.
 */
export function rateLimitResponse(resetIn: number): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": Math.ceil(resetIn / 1000).toString(),
      },
    }
  );
}
