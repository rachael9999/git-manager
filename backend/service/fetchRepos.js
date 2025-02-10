const axios = require('axios');
const { logger } = require('../utils/logger/winstonConfig');
const cache = require('../middleware/redis/cacheManager');
const rateLimiter = require('../middleware/rateLimiter');
const { splitPage } = require('../utils/splitPage');
const { CACHE_TTL } = require('../middleware/redis/constants/cache_ttl');

async function fetchRepositories(since = 0, requestedPage = 1, sessionId = null) {
  try {
    const apiPath = 'repositories';

    let sinceId = 0;

    if (requestedPage === undefined || requestedPage === null) {
      console.warn("requestedPage is undefined or null in fetchRepositories.  Defaulting to 1.");
      requestedPage = 1; 
    }

    // check if the requested page - 1 is already cached
    // if yes, get the last id from the last page
    // if not, get the last page from the session
    // get the last id from the last page
    if (requestedPage > 1) {

      const prevPageKey = `${apiPath}_page_${requestedPage - 1}`;
      const lastPage = await cache.getCacheValue(prevPageKey);
      if (!lastPage) {
        console.warn("Requested page is not cached.  Defaulting to 1.");
        // return status and redirect
        return { redirect: true, page: 1 };
      }
      const lastPageData = lastPage.data;
      sinceId = lastPageData[lastPageData.length - 1].id;
    }

    // Fetch new data
    const response = await rateLimiter.schedule(() =>
      axios.get('https://api.github.com/repositories', {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      },
      params: { since: sinceId, per_page: 100 },
      proxy: false
    }));

    const filteredData = response.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      owner: {
        login: repo.owner.login,
        id: repo.owner.id,
        avatar_url: repo.owner.avatar_url,
        html_url: repo.owner.html_url
      },
      html_url: repo.html_url,
      description: repo.description,
      url: repo.url
    }));

    // Split and cache pages
    const pages = splitPage(filteredData);
    const startPage = requestedPage;
    
    for (let i = 0; i < pages.length; i++) {
      const pageKey = `${apiPath}_page_${startPage + i}`;
      cache.setCacheValue(pageKey, {
        status: 200,
        data: pages[i]
      }, CACHE_TTL.repositories);
    }

    return pages[0];
  } catch (error) {
    logger.error('Repository fetch error:', error);
    throw error;
  }
}

async function fetchRepoDetail(repoId) {
  const cacheKey = `detail_repo_${repoId}`;
  
  try {
    // Check cache first
    const cachedData = await cache.getCacheValue(cacheKey);
    if (cachedData) {
      return cachedData.data;
    }

    const response = await rateLimiter.schedule(() =>
      axios.get(`https://api.github.com/repositories/${repoId}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      },
      proxy: false
    }));

    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Invalid repository data received');
    }

    const filteredData = {
      id: response.data.id,
      name: response.data.name,
      full_name: response.data.full_name,
      description: response.data.description,
      html_url: response.data.html_url,
      language: response.data.language,
      stargazers_count: response.data.stargazers_count,
      forks_count: response.data.forks_count,
      subscribers_count: response.data.subscribers_count,
      visibility: response.data.visibility,
      archived: response.data.archived,
      disabled: response.data.disabled,
      license: response.data.license ? {
        name: response.data.license.name,
        spdx_id: response.data.license.spdx_id
      } : null,
      owner: response.data.owner ? {
        login: response.data.owner.login,
        id: response.data.owner.id,
        avatar_url: response.data.owner.avatar_url,
        html_url: response.data.owner.html_url
      } : null
    };

    const cacheData = {
      status: 200,
      data: filteredData
    };
    
    await cache.setCacheValue(cacheKey, cacheData, CACHE_TTL.REPO_DETAIL);
    return filteredData;

  } catch (error) {
    if (error.response?.status === 404) {
      // Cache negative result
      const negativeCache = {
        status: 404,
        error: 'Repository not found'
      };
      await cache.setCacheValue(cacheKey, negativeCache, CACHE_TTL.negative || 600);
    }
    throw error;
  }
}

async function fetchTrendingRepositories(period = 'day', language, requestedPage = 1) {
  const cacheKey = `trending_${period}_${language || 'all'}_page_${requestedPage}`;

  try {
    // Check cache first
    const cachedData = await cache.getCacheValue(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const response = await rateLimiter.schedule(() =>
      axios.get('https://api.github.com/search/repositories', {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
          Accept: 'application/vnd.github.v3+json'
        },
        params: {
          q: `created:>${getDate(period)}${language ? ` language:${language}` : ''}`,
          sort: 'stars',
          order: 'desc',
          per_page: 100
        },
        proxy: false
      })
    );

    const filteredData = response.data.items.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      owner: {
        login: repo.owner.login,
        id: repo.owner.id,
        avatar_url: repo.owner.avatar_url,
        html_url: repo.owner.html_url
      },
      html_url: repo.html_url,
      description: repo.description,
      url: repo.url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language
    }));

    // Split and cache pages
    const pages = splitPage(filteredData);
    const startPage = requestedPage;

    if (requestedPage > pages.length) {
      return { status: 303, redirect: true, page: 1 };
    }

    for (let i = 0; i < pages.length; i++) {
      const pageKey = `trending_${period}_${language || 'all'}_page_${startPage + i}`;
      cache.setCacheValue(pageKey, {
        status: 200,
        data: pages[i],
        total_pages: pages.length
      }, CACHE_TTL.repositories);
    }

    return {
      status: 200,
      data: pages[requestedPage - 1],
      total_pages: pages.length
    };
  } catch (error) {
    logger.error('Trending repositories fetch error:', error);
    throw error;
  }
}

function getDate(period) {
  const now = new Date();
  switch (period) {
    case 'day':
      now.setDate(now.getDate() - 1);
      break;
    case 'month':
      now.setMonth(now.getMonth() - 1);
      break;
    case 'week':
    default:
      now.setDate(now.getDate() - 7);
      break;
  }
  return now.toISOString().split('T')[0];
}

module.exports = { fetchRepositories, fetchRepoDetail, fetchTrendingRepositories };