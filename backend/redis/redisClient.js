const redis = require('redis');
const { logger } = require('../utils/logger/winstonConfig');

// Redis configuration
const REDIS_CONFIG = {
  maxMemoryPolicy: 'allkeys-lru',
  maxmemory: '2gb'
};

const redisClient = redis.createClient({
  socket: {
    host: 'localhost',
    port: 6379
  }
});

// Initialize Redis with LRU config
async function initRedis() {
  await redisClient.connect();
  await redisClient.configSet('maxmemory-policy', REDIS_CONFIG.maxMemoryPolicy);
  await redisClient.configSet('maxmemory', REDIS_CONFIG.maxmemory);
  logger.info('Redis initialized with LRU policy');
}

// Update TTL for a key
async function updateTime(key, ttl) {
  try {
    await redisClient.expire(key, ttl);
    logger.info(`Updated TTL for ${key}`);
  } catch (error) {
    logger.error(`Failed to update TTL for ${key}:`, error);
    throw error;
  }
}

async function get(key) {
  try {
    const value = await redisClient.get(key);
    if (value) {
      logger.debug(`Retrieved value for ${key}`);
      return value;
    }
    logger.debug(`No value found for ${key}`);
    return null;
  } catch (error) {
    logger.error(`Failed to get value for ${key}:`, error);
    throw error;
  }
}

redisClient.on('error', (err) => {
  logger.error('Redis error:', err);
});

initRedis().catch(err => {
  logger.error('Redis initialization failed:', err);
});

module.exports = {
  get,
  updateTime,
  set: redisClient.set.bind(redisClient),
  setEx: redisClient.setEx.bind(redisClient),
  expire: redisClient.expire.bind(redisClient)
};