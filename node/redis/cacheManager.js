const redisClient = require('./redisClient');
const { logger } = require('../logger/winstonConfig');


const CACHE_TTL = {
  repositories: 3600,    // 1 hour
  users: 7200,          // 2 hours
  issues: 1800          // 30 minutes
};

const defaultTTL = 3600;

async function getPageFromCache(redisKey) {
  const data = await redisClient.get(redisKey);
  return data ? JSON.parse(data) : null;
}


async function getSessionLastPage(redisKey) {
  const lastPage = await redisClient.get(redisKey);
  return lastPage ? lastPage : null;
}

async function setSessionLastPage(redisKey, lastPage) {
  await redisClient.setEx(redisKey, CACHE_TTL.users, lastPage);
}

async function cachePage(redisKey, data) {
  await redisClient.setEx(redisKey, 3600, JSON.stringify(data));
}

module.exports = {
  getPageFromCache,
  setSessionLastPage,
  getSessionLastPage,
  cachePage
};