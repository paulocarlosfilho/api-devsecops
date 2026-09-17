const { getRedis } = require('../config/redis');
const logger = require('../config/logger');

/** Default TTLs in seconds per resource type */
const DEFAULT_TTL = {
  product: 300,       // 5 minutes
  products_list: 120, // 2 minutes
  category: 600,      // 10 minutes
  categories_list: 600,
  order: 60,          // 1 minute
  customer: 300,      // 5 minutes
};

class CacheService {
  /**
   * Get a cached value by key.
   * Returns null if key doesn't exist or Redis is unavailable.
   * @param {string} key
   * @returns {Promise<*|null>}
   */
  async get(key) {
    try {
      const redis = getRedis();
      if (!redis) return null;

      const data = await redis.get(key);
      if (data) {
        logger.debug(`Cache HIT: ${key}`);
        return JSON.parse(data);
      }

      logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      logger.warn('Cache get failed, falling back to database', {
        key,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Set a value in cache with TTL.
   * @param {string} key
   * @param {*} value - Will be JSON-serialized
   * @param {number} [ttl] - Time to live in seconds
   */
  async set(key, value, ttl) {
    try {
      const redis = getRedis();
      if (!redis) return;

      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }

      logger.debug(`Cache SET: ${key} (TTL: ${ttl || 'none'}s)`);
    } catch (error) {
      logger.warn('Cache set failed', { key, error: error.message });
    }
  }

  /**
   * Delete a specific key from cache.
   * @param {string} key
   */
  async del(key) {
    try {
      const redis = getRedis();
      if (!redis) return;

      await redis.del(key);
      logger.debug(`Cache DEL: ${key}`);
    } catch (error) {
      logger.warn('Cache del failed', { key, error: error.message });
    }
  }

  /**
   * Invalidate all keys matching a pattern.
   * Uses SCAN to avoid blocking Redis.
   * @param {string} pattern - e.g., 'products:*'
   */
  async invalidatePattern(pattern) {
    try {
      const redis = getRedis();
      if (!redis) return;

      let cursor = '0';
      let totalDeleted = 0;

      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;

        if (keys.length > 0) {
          await redis.del(...keys);
          totalDeleted += keys.length;
        }
      } while (cursor !== '0');

      if (totalDeleted > 0) {
        logger.debug(`Cache INVALIDATE: ${pattern} (${totalDeleted} keys deleted)`);
      }
    } catch (error) {
      logger.warn('Cache invalidatePattern failed', { pattern, error: error.message });
    }
  }

  /**
   * Get the default TTL for a resource type.
   * @param {string} type
   * @returns {number}
   */
  getTTL(type) {
    return DEFAULT_TTL[type] || 300;
  }
}

module.exports = new CacheService();
