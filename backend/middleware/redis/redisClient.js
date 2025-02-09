const redis = require('redis');
const { logger } = require('../../utils/logger/winstonConfig');

// Redis configuration
const REDIS_CONFIG = {
  maxMemoryPolicy: 'allkeys-lru',
  maxmemory: '5gb'
};

class RedisWrapper {
  constructor() {
    this.client = null;
    this.isInitialized = false;
  }

  async initRedis() {
    if (this.isInitialized) return;

    this.client = redis.createClient({
      socket: {
        host: 'localhost',
        port: 6379
      }
    });

    this.client.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    await this.client.connect();
    await this.client.configSet('maxmemory-policy', REDIS_CONFIG.maxMemoryPolicy);
    await this.client.configSet('maxmemory', REDIS_CONFIG.maxmemory);
    this.isInitialized = true;
    logger.info('Redis initialized with LRU policy');
  }

  async updateTime(key, ttl) {
    try {
      await this.client.expire(key, ttl);
      logger.info(`Updated TTL for ${key}`);
    } catch (error) {
      logger.error(`Failed to update TTL for ${key}:`, error);
      throw error;
    }
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
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

  async set(...args) {
    return this.client.set(...args);
  }

  async setEx(...args) {
    return this.client.setEx(...args);
  }

  async expire(...args) {
    return this.client.expire(...args);
  }
}

const redisWrapper = new RedisWrapper();

// Initialize Redis when the module is imported
redisWrapper.initRedis().catch(err => {
  logger.error('Redis initialization failed:', err);
});

module.exports = redisWrapper;