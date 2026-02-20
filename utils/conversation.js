import NodeCache from 'node-cache';
import logger from './logger.js';

const MAX_HISTORY = parseInt(process.env.MAX_HISTORY_LENGTH) || 20;
const RATE_LIMIT_COUNT = parseInt(process.env.RATE_LIMIT_PER_USER) || 10;
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000;

// Cache for conversation histories (24hr TTL)
const historyCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

// Cache for rate limiting (window-based)
const rateLimitCache = new NodeCache({ stdTTL: Math.ceil(RATE_LIMIT_WINDOW / 1000), checkperiod: 10 });

/**
 * Get conversation history for a channel/thread context.
 * Key can be channelId or `dm-{userId}` for DMs.
 */
export function getHistory(contextKey) {
  return historyCache.get(contextKey) || [];
}

/**
 * Append a message to the conversation history.
 */
export function appendHistory(contextKey, role, content) {
  const history = getHistory(contextKey);
  history.push({ role, content });

  // Trim to max length (keep most recent)
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }

  historyCache.set(contextKey, history);
  logger.debug(`History for ${contextKey}: ${history.length} messages`);
}

/**
 * Clear history for a context.
 */
export function clearHistory(contextKey) {
  historyCache.del(contextKey);
  logger.info(`Cleared history for ${contextKey}`);
}

/**
 * Check rate limit for a user. Returns true if allowed, false if limited.
 */
export function checkRateLimit(userId) {
  const key = `rl-${userId}`;
  const current = rateLimitCache.get(key) || 0;

  if (current >= RATE_LIMIT_COUNT) {
    return false;
  }

  rateLimitCache.set(key, current + 1);
  return true;
}

/**
 * Get remaining requests for a user.
 */
export function getRemainingRequests(userId) {
  const key = `rl-${userId}`;
  const current = rateLimitCache.get(key) || 0;
  return Math.max(0, RATE_LIMIT_COUNT - current);
}

/**
 * Get all active conversation keys (for stats).
 */
export function getActiveConversations() {
  return historyCache.keys().length;
}
