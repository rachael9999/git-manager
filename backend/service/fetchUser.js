const axios = require('axios');
const { logger } = require('../utils/logger/winstonConfig');
const cache = require('../redis/cacheManager');
const { splitPage } = require('../utils/splitPage');
const { CACHE_TTL } = require('../redis/constants/cache_ttl');

async function fetchUserProfile(username) {
  const cacheKey = `user_${username}`;
  // check if user is cached
  const cacheData = await cache.getCacheValue(cacheKey);
  if (cacheData) {
    const cachedData = cacheData.data;
    if (cachedData) {
      if (cachedData.redirect) {
        return cachedData;
      }
      return cachedData;
    }
  }
  try {
    const response = await axios.get(`https://api.github.com/users/${username}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json'
      },
      proxy: false
    });

    const cacheData = {
      status: 200,
      data: response.data
    };
    await cache.setCacheValue(cacheKey, cacheData, CACHE_TTL.users);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      const negativeCache = {
        status: 404,
        error: 'User not found'
      };
      await cache.setCacheValue(cacheKey, negativeCache, CACHE_TTL.negative);
    }
    throw error;
  }
}

async function fetchUserRepos(username, page = 1) {
  try {
    const cacheKey = `user_repos_${username}_${page}`;
    
    // Check if this invalid page was cached
    const cachePage = await cache.getCacheValue(cacheKey);
    if (cachePage) {
      const cachedData = cachePage.data;
      if (cachedData) {
        if (cachedData.redirect) {
          return cachedData;
        }
        return cachedData.data;
      }
    }

    const response = await axios.get(`https://api.github.com/users/${username}/repos`, {
      headers: {
        Accept: 'application/vnd.github.v3+json'
      },
      proxy: false
    });
    const pages = splitPage(response.data);
    
    // Cache each valid page
    for (let i = 0; i < pages.length; i++) {
      const pageKey = `user_repos_${username}_${i + 1}`;
      await cache.setCacheValue(pageKey, {
        status: 200,
        data: pages[i]
      }, CACHE_TTL.users);
    }

    // Cache max page number
    await cache.setUserRepoMaxPageCount(username, pages.length);
    logger.info(`User repos fetched for ${username}, ${pages.length} pages`);

    // Handle invalid page number
    if (page > pages.length) {
      const redirectData = { 
        status: 303,
        redirect: true, 
        page: 1 
      };
      await cache.setCacheValue(cacheKey, redirectData, CACHE_TTL.negative);
      return redirectData;
    }
    return pages[0];
  } catch (error) {
    logger.error(`User repos fetch error for ${username}:`, error);
    throw error;
  }



}

module.exports = { fetchUserProfile, fetchUserRepos };