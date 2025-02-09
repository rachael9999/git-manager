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
    return cacheData;
  }

  try {
    const response = await rateLimiter.schedule(() =>
      axios.get(`https://api.github.com/users/${username}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json'
      },
      proxy: false
    }));

    // Forward GitHub rate limit headers
    const rateLimitHeaders = {
      'x-ratelimit-limit': response.headers['x-ratelimit-limit'],
      'x-ratelimit-remaining': response.headers['x-ratelimit-remaining'],
      'x-ratelimit-reset': response.headers['x-ratelimit-reset']
    };

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
      data: filteredData,
      headers: rateLimitHeaders
    };
    await cache.setCacheValue(cacheKey, cacheData, CACHE_TTL.users);
    return cacheData;
  } catch (error) {
    const errorResponse = {
      status: error.response?.status || 500,
      error: error.response?.status === 404 ? 'User not found' : 
             (error.response?.status === 403 || error.response?.status === 429) ? 'Rate limit exceeded' :
             'Failed to fetch user data',
      headers: {
        'x-ratelimit-limit': error.response?.headers?.['x-ratelimit-limit'],
        'x-ratelimit-remaining': error.response?.headers?.['x-ratelimit-remaining'],
        'x-ratelimit-reset': error.response?.headers?.['x-ratelimit-reset']
      }
    };
    
    // Cache error responses but with shorter TTL
    const ttl = error.response?.status === 404 ? CACHE_TTL.negative : CACHE_TTL.error;
    await cache.setCacheValue(cacheKey, errorResponse, ttl);
    return errorResponse;
  }
}

async function fetchUserRepos(username, page = 1) {
  try {
    const cacheKey = `user_repos_${username}_${page}`;
    const maxPageKey = `user_repos_${username}_max_page`;
    
    // Check cache first
    const cachePage = await cache.getCacheValue(cacheKey);
    if (cachePage) {
      return cachePage;
    }

    const response = await rateLimiter.schedule(() => 
      axios.get(`https://api.github.com/users/${username}/repos`, {
      headers: {
        Accept: 'application/vnd.github.v3+json'
      },
      proxy: false
    }));

    // Forward GitHub rate limit headers
    const rateLimitHeaders = {
      'x-ratelimit-limit': response.headers['x-ratelimit-limit'],
      'x-ratelimit-remaining': response.headers['x-ratelimit-remaining'],
      'x-ratelimit-reset': response.headers['x-ratelimit-reset']
    };

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
    
    // Cache each valid page with rate limit headers
    for (let i = 0; i < pages.length; i++) {
      const pageKey = `user_repos_${username}_${i + 1}`;
      await cache.setCacheValue(pageKey, {
        status: 200,
        data: pages[i],
        headers: rateLimitHeaders
      }, CACHE_TTL.users);
    }

    // Cache max page number
    await cache.setCacheValue(maxPageKey, pages.length.toString(), CACHE_TTL.users);
    logger.info(`User repos fetched for ${username}, ${pages.length} pages`);

    // Handle invalid page number
    if (page > pages.length) {
      const redirectData = { 
        status: 303,
        redirect: true, 
        page: 1,
        headers: rateLimitHeaders
      };
      await cache.setCacheValue(cacheKey, redirectData, CACHE_TTL.negative);
      return redirectData;
    }

    const responseData = {
      status: 200,
      data: pages[page - 1],
      headers: rateLimitHeaders
    };
    return responseData;
  } catch (error) {
    logger.error(`User repos fetch error for ${username}:`, error);
    const errorResponse = {
      status: error.response?.status || 500,
      error: error.response?.status === 404 ? 'User not found' :
             (error.response?.status === 403 || error.response?.status === 429) ? 'Rate limit exceeded' :
             'Failed to fetch repositories',
      headers: {
        'x-ratelimit-limit': error.response?.headers?.['x-ratelimit-limit'],
        'x-ratelimit-remaining': error.response?.headers?.['x-ratelimit-remaining'],
        'x-ratelimit-reset': error.response?.headers?.['x-ratelimit-reset']
      }
    };
    
    // Cache error responses
    const ttl = error.response?.status === 404 ? CACHE_TTL.negative : CACHE_TTL.error;
    await cache.setCacheValue(`user_repos_${username}_${page}`, errorResponse, ttl);
    return errorResponse;
  }
}

module.exports = { fetchUserProfile, fetchUserRepos };