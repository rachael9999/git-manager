const { CACHE_TTL } = require('./constants/cache_ttl');
const redisClient = require('./redisClient');
const { logger } = require('../../utils/logger/winstonConfig');
const cacheManager = require('./cacheManager');
const cache = require('./cacheManager');

function cacheMiddlewareRepo(_ttl = 3600) {
  return async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const apiPath = req.baseUrl.substring(1);

    let cacheKey;
    if (apiPath !== 'repositories') {
      return next();
    }

    if (req.path.startsWith('/full')) {
      cacheKey = `repositories_page_${page}`;
    } else if (req.path.startsWith('/detail')) {
      const repoId = req.path.split('/')[2];
      cacheKey = `detail_repo_${repoId}`;
    } else if (req.path.startsWith('/trending')) {
      const period = req.query.period || 'day';
      const language = req.query.language || 'all';
      cacheKey = `trending_${period}_${language}_page_${page}`;
    }

    if (!cacheKey) {
      return next();
    }

    try {
      const ttl = CACHE_TTL.repositories || _ttl;
      const cachedData = await cacheManager.getCacheValue(cacheKey);
      
      if (cachedData) {
        // Handle special response types first
        if (cachedData.status === 404) {
          await redisClient.updateTime(cacheKey, CACHE_TTL.negative);
          return res.status(404).json({ error: cachedData.error });
        }
        if (cachedData.status === 303 || cachedData.redirect) {
          await redisClient.updateTime(cacheKey, ttl);
          return res.status(303).json(cachedData);
        }

        logger.info(`Cache hit for ${cacheKey}`);
        await redisClient.updateTime(cacheKey, ttl);

        // For regular responses, always send the actual data
        const responseData = cachedData.data || cachedData;
        if (!responseData) {
          throw new Error('Invalid cached data structure');
        }

        return res.json(responseData);
      }

      logger.info(`Cache miss for ${cacheKey}`);
      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next(error);
    }
  };
}

module.exports = cacheMiddlewareRepo;