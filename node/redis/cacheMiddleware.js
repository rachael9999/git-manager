const { CACHE_TTL } = require('./constants/cache_ttl');
const redisClient = require('./redisClient');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

function cacheMiddleware(_ttl = 3600) {
  return async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const apiPath = req.path.substring(1); // remove leading slash
    const cacheKey = `${apiPath}_page_${page}`;
    const sessionId = req.session.id;

    try {
      const ttl = CACHE_TTL[apiPath] || _ttl;
      // Record session's last access for this API
      await redisClient.setEx(
        `session_${sessionId}_${apiPath}_last_page`,
        ttl,
        page.toString()
      );

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