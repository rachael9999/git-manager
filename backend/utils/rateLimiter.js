const Bottleneck = require('bottleneck');

const rateLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 1000,
  retryCount: 3,
  retryDelay: 1000,
});

rateLimiter.on('failed', async (error, jobInfo) => {
  const { status } = error.response || {};
  
  if ((status === 403 || status === 429) && jobInfo.retryCount < 3) {
    logger.warn(`Rate limit hit, retrying in ${jobInfo.retryDelay}ms (attempt ${jobInfo.retryCount + 1}/3)`);
    return jobInfo.retryCount + 1;
  }
});

rateLimiter.on('retry', (error, jobInfo) => {
  logger.info(`Retrying request after rate limit (attempt ${jobInfo.retryCount}/3)`);
});

module.exports = rateLimiter;