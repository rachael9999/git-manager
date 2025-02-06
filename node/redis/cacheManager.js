const redisClient = require('./redisClient');
const { logger } = require('../utils/logger/winstonConfig');


const CACHE_TTL = {
  repositories: 3600,    // 1 hour
  users: 7200,          // 2 hours
  issues: 1800          // 30 minutes
};

const defaultTTL = 3600;

async function getValueFromCache(redisKey) {
  const data = await redisClient.get(redisKey);
  return data ? JSON.parse(data) : null;
}


async function getSessionLastPage(redisKey) {
  const lastPage = await redisClient.get(redisKey);
  return lastPage ? lastPage : null;
}

async function setSessionLastPage(redisKey, lastPage) {
  await redisClient.setEx(redisKey, CACHE_TTL.users, lastPage);
  logger.info(`Session last page set for ${redisKey}`);
}

async function cacheValue(redisKey, data) {
  await redisClient.setEx(redisKey, 3600, JSON.stringify(data));
  logger.info(`Data cached for ${redisKey}`);
}

module.exports = {
  getValueFromCache,
  setSessionLastPage,
  getSessionLastPage,
  cacheValue
};