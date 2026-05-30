/**
 * Simple in-memory rate limiter using a Map.
 * 30 requests per minute per IP. No external dependencies.
 * Stale entries are lazily cleaned on each call.
 */

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30;
const CLEANUP_INTERVAL_MS = 10000; // 10 seconds

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
let isCleanupScheduled = false;

function scheduleCleanup() {
  if (isCleanupScheduled) return;
  isCleanupScheduled = true;

  const timer = setTimeout(() => {
    isCleanupScheduled = false;
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Unref the timer so it doesn't block Node.js process exit
  if (typeof timer.unref === "function") {
    timer.unref();
  }
}

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

  scheduleCleanup();

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
