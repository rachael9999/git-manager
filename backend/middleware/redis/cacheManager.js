const redisClient = require('./redisClient');
const { logger } = require('../../utils/logger/winstonConfig');
const { CACHE_TTL } = require('./constants/cache_ttl');

const defaultTTL = 3600; // 1 hour in seconds

async function getCacheValue(redisKey) {
  try {
    const data = await redisClient.get(redisKey);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    // Don't return cached rate limit errors
    if (parsed.status === 403 || parsed.status === 429) {
      await redisClient.del(redisKey);
      return null;
    }
    return parsed;
  } catch (error) {
    logger.error('Redis get error:', { redisKey, error });
    return null;
  }
}

async function setCacheValue(redisKey, data, ttl = CACHE_TTL.users) {
  try {
    if (!redisKey || typeof redisKey !== 'string') {
      logger.error(`Invalid redisKey: ${redisKey}`);
      return false;
    }
    if (!data) {
      logger.error('Data is required');
      return false;
    }
    
    // Don't cache rate limit errors
    if (data.status === 403 || data.status === 429) {
      return true;
    }
    
    await redisClient.setEx(redisKey, ttl, JSON.stringify(data));
    logger.info(`Data cached for ${redisKey}`);
    return true;
  } catch (error) {
    logger.error('Redis setEx error:', { redisKey, ttl, error });
    return false;
  }
}

async function setUserRepoMaxPageCount(username, maxPage) {
  try {
    const redisKey = `user_repos_${username}_max_page`;
    
    if (!username || typeof username !== 'string') {
      throw new Error(`Invalid username: ${username}`);
    }
    if (typeof maxPage !== 'number' || maxPage < 1) {
      throw new Error(`Invalid maxPage: ${maxPage}`);
    }

    await redisClient.setEx(redisKey, CACHE_TTL.users, maxPage.toString());
    logger.info(`Max page count cached for ${username}: ${maxPage}`);
    return true;
  } catch (error) {
    logger.error('Error setting max page count:', { username, maxPage, error });
    return false;
  }
}

async function getUserRepoMaxPageCount(username) {
  try {
    const redisKey = `user_repos_${username}_max_page`;
    const maxPage = await redisClient.get(redisKey);
    
    if (!maxPage) {
      logger.info(`No maxPage found in cache for ${redisKey}`);
      return null;
    }

    // Remove any quotes and parse
    const cleanedMaxPage = maxPage.replace(/^"|"$/g, '').trim();
    const parsedValue = parseInt(cleanedMaxPage);
    
    if (isNaN(parsedValue)) {
      logger.error(`Invalid maxPage value: "${maxPage}"`);
      await redisClient.del(redisKey);
      return null;
    }

    return parsedValue;
  } catch (error) {
    logger.error('Error getting max page count:', { username, error });
    return null;
  }
}

module.exports = {
  getCacheValue,
  setCacheValue,
  setUserRepoMaxPageCount,
  getUserRepoMaxPageCount
};