const redis = require('redis');
const { logger } = require('../../utils/logger/winstonConfig');

// Redis configuration
const REDIS_CONFIG = {
  maxMemoryPolicy: 'allkeys-lru',
  maxmemory: '5gb',
  retryAttempts: 10,
  retryDelay: 1000 // 1 second
};

class RedisWrapper {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.connectAttempts = 0;
  }

  async initRedis() {
    if (this.isInitialized) return;

    const url = process.env.REDIS_URL || 'redis://redis:6379';
    logger.info(`Initializing Redis with URL: ${url}`);

    this.client = redis.createClient({
      url: url,
      socket: {
        reconnectStrategy: (retries) => {
          this.connectAttempts = retries;
          if (retries >= REDIS_CONFIG.retryAttempts) {
            logger.error(`Max Redis connection attempts (${REDIS_CONFIG.retryAttempts}) reached`);
            return new Error('Max connection attempts reached');
          }
          logger.info(`Attempting to reconnect to Redis (attempt ${retries + 1})`);
          return REDIS_CONFIG.retryDelay;
        }
      }
    });

    this.client.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    this.client.on('connect', () => {
      logger.info('Connected to Redis');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('reconnecting', () => {
      logger.info('Reconnecting to Redis...');
    });

    try {
      await this.client.connect();
      await this.client.configSet('maxmemory-policy', REDIS_CONFIG.maxMemoryPolicy);
      await this.client.configSet('maxmemory', REDIS_CONFIG.maxmemory);
      this.isInitialized = true;
      logger.info('Redis initialized with LRU policy');
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  async updateTime(key, ttl) {
    try {
      if (!this.isInitialized) {
        await this.initRedis();
      }
      await this.client.expire(key, ttl);
      logger.info(`Updated TTL for ${key}`);
    } catch (error) {
      logger.error(`Failed to update TTL for ${key}:`, error);
      throw error;
    }
  }

  async get(key) {
    try {
      if (!this.isInitialized) {
        await this.initRedis();
      }
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
    if (!this.isInitialized) {
      await this.initRedis();
    }
    return this.client.set(...args);
  }

  async setEx(...args) {
    if (!this.isInitialized) {
      await this.initRedis();
    }
    return this.client.setEx(...args);
  }

  async expire(...args) {
    if (!this.isInitialized) {
      await this.initRedis();
    }
    return this.client.expire(...args);
  }
}

const redisWrapper = new RedisWrapper();

// Initialize Redis when the module is loaded
redisWrapper.initRedis().catch(err => {
  logger.error('Redis initialization failed:', err);
});

module.exports = redisWrapper;