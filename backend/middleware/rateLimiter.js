const Bottleneck = require('bottleneck');
const { logger } = require('../utils/logger/winstonConfig');

function createRateLimiter() {
  const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 1000,
  });

  limiter.on('failed', async (error, jobInfo) => {
    const { status } = error.response || {};
    
    if ((status === 403 || status === 429) && jobInfo.retryCount < 3) {
      logger.warn(`Rate limit hit, retrying in ${jobInfo.retryDelay}ms (attempt ${jobInfo.retryCount + 1}/3)`);
      return jobInfo.retryDelay;
    }
    return null;
  });

  limiter.on('retry', (error, jobInfo) => {
    logger.info(`Retrying request after rate limit (attempt ${jobInfo.retryCount}/3)`);
  });

  return limiter;
}

module.exports = createRateLimiter();