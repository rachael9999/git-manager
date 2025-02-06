const { CACHE_TTL } = require('./constants/cache_ttl');
const redisClient = require('./redisClient');
const { logger } = require('../utils/logger/winstonConfig');
const cacheManager = require('./cacheManager');

function cacheMiddlewareUser(_ttl = 3600) {
  return async (req, res, next) => {
    const apiPath = req.baseUrl.substring(1);
    const pathParts = req.path.split('/').filter(part => part.length > 0);
    const username = pathParts[0];

    if (apiPath !== 'user') {
      return next();
    }

    // Handle user profile route
    if (pathParts.length === 2) {
      const cacheKey = `user_${username}`;
      try {
        const cachedValue = await redisClient.get(cacheKey);
        if (cachedValue) {
          const parsed = JSON.parse(cachedValue);
          logger.info(`Cache hit for ${cacheKey}`);
          
          if (parsed.status === 404) {
            return res.status(404).json({ error: parsed.error });
          }
          
          await redisClient.updateTime(cacheKey, _ttl);
          return res.json(parsed.data);
        }
        logger.info(`Cache miss for ${cacheKey}`);
        return next();
      } catch (error) {
        logger.error('Cache middleware error:', error);
        return next();
      }
    }

    // Handle user repos route with page parameter
    if (pathParts.length === 3 && pathParts[1] === 'repos') {
      const page = parseInt(pathParts[2]);
      logger.info(`Cache middleware for ${username}'s repos, page: ${page}`);
      
      if (isNaN(page) || page < 1) {
        return next();
      }

      const cacheKey = `user_repos_${username}_${page}`;
      try {
        const cachedValue = await cacheManager.getCacheValue(cacheKey);
        if (cachedValue) {
          logger.info(`Cache hit for ${cacheKey}`);
          
          // Update TTL
          await redisClient.updateTime(cacheKey, _ttl);

          // Handle different response types
          if (cachedValue.status === 303) {
            return res.status(303).json(cachedValue);
          }
          if (cachedValue.status === 404) {
            return res.status(404).json({ error: cachedValue.error });
          }
          
          return res.json(cachedValue.data);
        }
        logger.info(`Cache miss for ${cacheKey}`);
        return next();
      } catch (error) {
        logger.error('Cache middleware error:', error);
        return next();
      }
    }

    return next();
  };
}

module.exports = cacheMiddlewareUser;