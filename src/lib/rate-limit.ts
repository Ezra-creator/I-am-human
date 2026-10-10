/**
 * In-memory sliding-window rate limiter keyed by client IP address.
 * 
 * BEST-EFFORT NOTICE:
 * In serverless environments (e.g. Vercel, AWS Lambda), this rate limiter
 * operates within the memory space of each warm serverless function instance.
 * It provides effective, best-effort per-instance throttling to prevent abuse
 * without requiring an external database or Redis connection. Memory is strictly
 * bounded so old entries are pruned and cannot grow without bound.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const WINDOW_MINUTE_MS = 60 * 1000;
const WINDOW_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_IP_ENTRIES = 5000;

export const RATE_LIMIT_MINUTE = 8;
export const RATE_LIMIT_DAY = 60;

const ipStore = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  success: boolean;
  retryAfterSeconds?: number;
  remainingMinute?: number;
  remainingDay?: number;
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const cutoffDay = now - WINDOW_DAY_MS;
  const cutoffMinute = now - WINDOW_MINUTE_MS;

  // Bound memory: if cache size exceeds limit, prune stale entries
  if (ipStore.size > MAX_IP_ENTRIES) {
    for (const [storedIp, rec] of ipStore.entries()) {
      rec.timestamps = rec.timestamps.filter((ts) => ts > cutoffDay);
      if (rec.timestamps.length === 0) {
        ipStore.delete(storedIp);
      }
    }
    // If still oversized after pruning, remove the oldest map entries
    if (ipStore.size > MAX_IP_ENTRIES) {
      const keysToDelete = Array.from(ipStore.keys()).slice(0, 500);
      for (const k of keysToDelete) {
        ipStore.delete(k);
      }
    }
  }

  // Retrieve or initialize IP record
  let record = ipStore.get(ip);
  if (!record) {
    record = { timestamps: [] };
    ipStore.set(ip, record);
  }

  // Prune timestamps older than 24 hours
  record.timestamps = record.timestamps.filter((ts) => ts > cutoffDay);

  // Check 1-minute window (limit: 8)
  const minuteTimestamps = record.timestamps.filter((ts) => ts > cutoffMinute);
  if (minuteTimestamps.length >= RATE_LIMIT_MINUTE) {
    const oldestInMinute = minuteTimestamps[0];
    const retryAfter = Math.ceil((oldestInMinute + WINDOW_MINUTE_MS - now) / 1000);
    return {
      success: false,
      retryAfterSeconds: Math.max(1, retryAfter),
      remainingMinute: 0,
      remainingDay: Math.max(0, RATE_LIMIT_DAY - record.timestamps.length),
    };
  }

  // Check 24-hour window (limit: 60)
  if (record.timestamps.length >= RATE_LIMIT_DAY) {
    const oldestInDay = record.timestamps[0];
    const retryAfter = Math.ceil((oldestInDay + WINDOW_DAY_MS - now) / 1000);
    return {
      success: false,
      retryAfterSeconds: Math.max(1, retryAfter),
      remainingMinute: Math.max(0, RATE_LIMIT_MINUTE - minuteTimestamps.length),
      remainingDay: 0,
    };
  }

  // Record this request
  record.timestamps.push(now);

  return {
    success: true,
    remainingMinute: RATE_LIMIT_MINUTE - (minuteTimestamps.length + 1),
    remainingDay: RATE_LIMIT_DAY - record.timestamps.length,
  };
}

// Periodically prune stale IP records from memory to prevent memory leaks
if (typeof setInterval !== "undefined") {
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    const cutoffDay = now - WINDOW_DAY_MS;
    for (const [ip, record] of ipStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > cutoffDay);
      if (record.timestamps.length === 0) {
        ipStore.delete(ip);
      }
    }
  }, 10 * 60 * 1000);

  // Allow Node process to exit cleanly without keeping the timer open
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}
