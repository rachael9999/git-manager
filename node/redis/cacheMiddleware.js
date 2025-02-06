const { CACHE_TTL } = require('./constants/cache_ttl');
const redisClient = require('./redisClient');
const {logger} = require('../utils/logger/winstonConfig');

function cacheMiddleware(_ttl = 3600) {
  return async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const apiPath = req.baseUrl.substring(1); // remove leading slash

    // repositories/full: key: const cacheKey = `detail_repo_${repoId}`;
    // repositories/details/id key: const cacheKey = `repositories_page_${page}`;
    // console.log(req.path);
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
      const ttl = CACHE_TTL[apiPath] || _ttl;
      // Record session's last access for this API
      if (req.path.startsWith('/full')) {
        await redisClient.setEx(
          `session_${sessionId}_${apiPath}_last_page`,
          ttl,
          page.toString()
        );
      }

      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        logger.info(`Cache hit for ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }

      logger.info(`Cache miss for ${cacheKey}`);
      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next(error);
    }
  };
}

module.exports = cacheMiddleware;