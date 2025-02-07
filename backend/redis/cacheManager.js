const redisClient = require('./redisClient');
const { logger } = require('../utils/logger/winstonConfig');
const { CACHE_TTL } = require('./constants/cache_ttl');

const defaultTTL = 3600;

async function getCacheValue(redisKey) {
  const data = await redisClient.get(redisKey);
  return data ? JSON.parse(data) : null;
}

async function setCacheValue(redisKey, data, ttl) {
  try {
    if (!redisKey || typeof redisKey !== 'string') {
      throw new Error(`Invalid redisKey: ${redisKey}`);
    }
    if (!data) {
      throw new Error('Data is required');
    }
    await redisClient.setEx(redisKey, ttl, JSON.stringify(data));
    logger.info(`Data cached for ${redisKey}`);
  } catch (error) {
    logger.error('Redis setEx error:', {
      redisKey,
      ttl,
      data,
      error
    });
    throw error;
  }
  
  
}

async function getSessionLastPage(redisKey) {
  const lastPage = await redisClient.get(redisKey);
  return lastPage ? JSON.parse(lastPage) : null;
}

async function setSessionLastPage(redisKey, page) {

  // Ensure all parameters are defined and of correct type
  if (!redisKey || typeof redisKey !== 'string') {
    throw new Error(`Invalid redisKey: ${redisKey}`);
  }

  const pageValue = String(page || 1);

  try {
    await redisClient.setEx(
      redisKey,
      CACHE_TTL.sessions, 
      pageValue
    );
    logger.info(`Session last page cached for ${redisKey}`);
  } catch (error) {
    logger.error('Redis setEx error:', {
      redisKey,
      ttl: CACHE_TTL.sessions,
      pageValue,
      error
    });
    throw error;
  }
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

    await redisClient.setEx(redisKey, defaultTTL, maxPage);
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
  return maxPage ? parseInt(maxPage) : null;
}

module.exports = {
  getCacheValue,
  setCacheValue,
  getSessionLastPage,
  setSessionLastPage,
  setUserRepoMaxPageCount,
  getUserRepoMaxPageCount
};