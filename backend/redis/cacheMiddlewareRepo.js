const { CACHE_TTL } = require('./constants/cache_ttl');
const redisClient = require('./redisClient');
const { logger } = require('../utils/logger/winstonConfig');
const cacheManager = require('./cacheManager');
const cache = require('./cacheManager');

function cacheMiddlewareRepo(_ttl = 3600) {
  return async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const apiPath = req.baseUrl.substring(1); // remove leading slash

    let cacheKey;
    let sessionId = req.session.id;
    if (apiPath !== 'repositories') {
      return next();
    } else if (req.path.startsWith('/full')) {
      cacheKey = `repositories_page_${page}`;
    } else if (req.path.startsWith('/detail')) {
      const repoId = req.path.split('/')[2];
      cacheKey = `detail_repo_${repoId}`;
    }

    try {
      const ttl = CACHE_TTL.users || _ttl;
      // Record session's last access for this API
      if (req.path.startsWith('/full')) {
        await cache.setSessionLastPage(
          `session_${sessionId}_${apiPath}_last_page`,
          page
        );
      }

      const cachedData = await cacheManager.getCacheValue(cacheKey);
      if (cachedData) {
        logger.info(`Cache hit for ${cacheKey}`);
        if (cachedData.status === 404) {
          return res.status(404).json({ error: cachedData.error });
        }
        return res.json(cachedData.data);
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