const Bottleneck = require('bottleneck');
const { logger } = require('../utils/logger/winstonConfig');

function createRateLimiter() {
  const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 1000,
    retry: {
      enabled: true,
      maxRetries: 3,
      calculateDelay: ({ error, retryCount }) => {
        const baseDelay = 1000;
        const delay = baseDelay * Math.pow(2, retryCount - 1);
        const jitter = Math.random() * 1000 - 500;
        return delay + jitter;
      }
    }
  });

  limiter.on('failed', async (error, jobInfo) => {
    const { status } = error.response || {};
    
    if (status === 403 || status === 429) {
      const retryDelay = 1000 * Math.pow(2, jobInfo.retryCount);
      if (jobInfo.retryCount < 3) {
        logger.warn(`Rate limit hit, retrying in ${retryDelay}ms (attempt ${jobInfo.retryCount + 1}/3)`);
        return retryDelay;
      }
    }
    // If we've exhausted retries or it's not a rate limit error, pass it through
    return null;
  });

  return limiter;
}

module.exports = createRateLimiter();