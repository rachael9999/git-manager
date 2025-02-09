const redisClient = require('./redisClient');
const { logger } = require('../../utils/logger/winstonConfig');
const { CACHE_TTL } = require('./constants/cache_ttl');

const defaultTTL = 3600; // 1 hour in seconds

async function getCacheValue(redisKey) {
  const data = await redisClient.get(redisKey);
  return data ? JSON.parse(data) : null;
}

async function setCacheValue(redisKey, data, ttl = defaultTTL) {
  // Create a promise for the cache operation
  const cachePromise = new Promise(async (resolve) => {
    try {
      if (!redisKey || typeof redisKey !== 'string') {
        logger.error(`Invalid redisKey: ${redisKey}`);
        return resolve(false);
      }
      if (!data) {
        logger.error('Data is required');
        return resolve(false);
      }
      
      // Use the provided TTL or default, but don't extend it
      await redisClient.setEx(redisKey, ttl, JSON.stringify(data));
      logger.info(`Data cached for ${redisKey}`);
      resolve(true);
    } catch (error) {
      logger.error('Redis setEx error:', {
        redisKey,
        ttl,
        error
      });
      resolve(false);
    }
  });

  // Fire and forget - don't await the promise
  cachePromise.finally(() => {
    logger.debug(`Cache operation completed for ${redisKey}`);
  });

  return cachePromise;
}

async function setUserRepoMaxPageCount(username, maxPage) {
  const redisKey = `user_repos_${username}_max_page`;

  try {
    if (!username || typeof username !== 'string') {
      throw new Error(`Invalid username: ${username}`);
    }
    if (!maxPage || typeof maxPage !== 'number') {
      throw new Error(`Invalid maxPage: ${maxPage}`);
    }

    await redisClient.setEx(redisKey, defaultTTL, maxPage.toString());
    logger.info(`Max page count cached for ${redisKey}`);
  } catch (error) {
    logger.error('Redis setEx error:', {
      redisKey,
      ttl: defaultTTL,
      maxPage,
      error
    });
    throw error;
  }
}

async function getUserRepoMaxPageCount(username) {
  const redisKey = `user_repos_${username}_max_page`;
  const maxPage = await redisClient.get(redisKey);

  logger.info(`Retrieved maxPage value from Redis: ${maxPage}`);
  
  if (!maxPage) {
    logger.info(`No maxPage found in cache for ${redisKey}`);
    return null;
  }

  // Remove extra quotes before parsing
  const cleanedMaxPage = maxPage.replace(/^"|"$/g, '').trim();
  const parsedValue = parseInt(cleanedMaxPage);
  
  if (isNaN(parsedValue)) {
    logger.error(`Failed to parse maxPage value: "${maxPage}"`);
    return null;
  }

  logger.info(`Successfully retrieved and parsed maxPage: ${parsedValue}`);
  return parsedValue;
}

module.exports = {
  getCacheValue,
  setCacheValue,
  setUserRepoMaxPageCount,
  getUserRepoMaxPageCount
};