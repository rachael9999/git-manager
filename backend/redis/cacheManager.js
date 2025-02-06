const redisClient = require('./redisClient');
const { logger } = require('../utils/logger/winstonConfig');
const { CACHE_TTL } = require('./constants/cache_ttl');

const defaultTTL = 3600;

async function getCacheValue(redisKey) {
  const data = await redisClient.get(redisKey);
  return data ? JSON.parse(data) : null;
}

async function setCacheValue(redisKey, data, ttl) {
  await redisClient.setEx(redisKey, ttl, JSON.stringify(data));
  logger.info(`Data cached for ${redisKey}`);
}

async function getSessionLastPage(redisKey) {
  const lastPage = await redisClient.get(redisKey);
  return lastPage ? JSON.parse(lastPage) : null;
}

async function setSessionLastPage(redisKey, page) {
  await redisClient.setEx(redisKey, CACHE_TTL.sessions, JSON.stringify(page));
  logger.info(`Session last page cached for ${redisKey}`);
}

async function setUserRepoMaxPageCount(username, maxPage) {
  const redisKey = `user_repos_${username}_max_page`;
  await redisClient.setEx(redisKey, defaultTTL, maxPage);
  logger.info(`Max page count cached for ${redisKey}`);
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