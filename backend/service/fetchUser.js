const axios = require('axios');
const { logger } = require('../utils/logger/winstonConfig');
const cache = require('../middleware/redis/cacheManager');
const rateLimiter = require('../middleware/rateLimiter');
const { splitPage } = require('../utils/splitPage');
const { CACHE_TTL } = require('../middleware/redis/constants/cache_ttl');

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
    const response = await rateLimiter.schedule(() =>
      axios.get(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      },
      proxy: false
    }));

    const filteredData = {
      id: response.data.id,
      login: response.data.login,
      name: response.data.name,
      avatar_url: response.data.avatar_url,
      followers: response.data.followers,
      following: response.data.following,
      location: response.data.location,
      company: response.data.company,
      email: response.data.email,
      blog: response.data.blog
    };

    const cacheData = {
      status: 200,
      data: filteredData
    };
    cache.setCacheValue(cacheKey, cacheData, CACHE_TTL.users);
    return filteredData;
  } catch (error) {
    if (error.response?.status === 404) {
      const negativeCache = {
        status: 404,
        error: 'User not found'
      };
      cache.setCacheValue(cacheKey, negativeCache, CACHE_TTL.negative);
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
        return cachedData;
      }
    }

    const response = await rateLimiter.schedule(() => 
      axios.get(`https://api.github.com/users/${username}/repos`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      },
      proxy: false
    }));

    const filteredRepos = response.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      watchers_count: repo.watchers_count,
      visibility: repo.visibility,
      archived: repo.archived,
      disabled: repo.disabled,
      owner: {
        login: repo.owner.login,
        id: repo.owner.id,
        avatar_url: repo.owner.avatar_url,
        html_url: repo.owner.html_url
      }
    }));

    const pages = splitPage(filteredRepos);
    
    // Cache each valid page
    for (let i = 0; i < pages.length; i++) {
      const pageKey = `user_repos_${username}_${i + 1}`;
      cache.setCacheValue(pageKey, {
        status: 200,
        data: pages[i]
      }, CACHE_TTL.users);
    }

    // Cache max page number
    const maxPageKey = `user_repos_${username}_max_page`;
    cache.setCacheValue(maxPageKey, pages.length.toString(), CACHE_TTL.users);
    logger.info(`User repos fetched for ${username}, ${pages.length} pages`);

    // Handle invalid page number
    if (page > pages.length) {
      const redirectData = { 
        status: 303,
        redirect: true, 
        page: 1 
      };
      cache.setCacheValue(cacheKey, redirectData, CACHE_TTL.negative);
      return redirectData;
    }

    // Return the requested page
    return pages[page - 1];
  } catch (error) {
    logger.error(`User repos fetch error for ${username}:`, error);
    throw error;
  }
}

module.exports = { fetchUserProfile, fetchUserRepos };