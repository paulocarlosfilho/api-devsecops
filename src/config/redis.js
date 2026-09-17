const Redis = require('ioredis');
const env = require('./env');
const logger = require('./logger');

let redis = null;

const createRedisClient = () => {
  if (env.isTest()) {
    return null;
  }

  const client = new Redis({
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password,
    db: env.redis.db,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      logger.warn(`Redis connection retry #${times}, next attempt in ${delay}ms`);
      return delay;
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  client.on('connect', () => {
    logger.info('Redis connected');
  });

  client.on('error', (err) => {
    logger.error('Redis error', { error: err.message });
  });

  client.on('close', () => {
    logger.warn('Redis connection closed');
  });

  return client;
};

const getRedis = () => {
  if (!redis) {
    redis = createRedisClient();
  }
  return redis;
};

const connectRedis = async () => {
  const client = getRedis();
  if (client) {
    try {
      await client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis', { error: error.message });
    }
  }
};

const disconnectRedis = async () => {
  if (redis) {
    await redis.quit();
    redis = null;
  }
};

module.exports = { getRedis, connectRedis, disconnectRedis };
