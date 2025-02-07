const axios = require('axios');
const { logger } = require('../utils/logger/winstonConfig');
const cache = require('../redis/cacheManager');
const { splitPage } = require('../utils/splitPage');
const { CACHE_TTL } = require('../redis/constants/cache_ttl');

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
      const lastPageData = lastPage.data;
      if (lastPageData) {
        sinceId = lastPageData[lastPageData.length - 1].id;
      } else {
        const sessionKey = `session_${sessionId}_${apiPath}_last_page`;
        const sessionPage = await cache.getSessionLastPage(sessionKey);
        if (sessionPage + 1 == requestedPage) {
          sinceId = sessionPage[sessionPage.length - 1].id;
        } else {
          return { redirect: true, page: 1 };
        }
      }
    }

    // Fetch new data
    const response = await axios.get('https://api.github.com/repositories', {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      },
      params: { since: sinceId, per_page: 100 },
      proxy: false
    });

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
      await cache.setCacheValue(pageKey, {
        status: 200,
        data: pages[i]
      }, CACHE_TTL.repositories);
    }

    // Update session last page
    const sessionKey = `session_${sessionId}_${apiPath}_last_page`;
    await cache.setSessionLastPage(sessionKey, requestedPage);
    return pages[0];
  } catch (error) {
    logger.error('Repository fetch error:', error);
    throw error;
  }
}

async function fetchRepoDetail(repoId) {
  const cacheKey = `detail_repo_${repoId}`;
  
  try {
    const response = await axios.get(`https://api.github.com/repositories/${repoId}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      },
      proxy: false
    });

    const cacheData = {
      status: 200,
      data: response.data
    };
    
    await cache.setCacheValue(cacheKey, cacheData, CACHE_TTL.repositories);
    return response.data;

  } catch (error) {
    if (error.response?.status === 404) {
      // Cache negative result
      const negativeCache = {
        status: 404,
        error: 'Repository not found'
      };
      await cache.setCacheValue(cacheKey, negativeCache, CACHE_TTL.negative || 600); // 10 minutes
    }
    throw error;
  }
}

module.exports = { fetchRepositories, fetchRepoDetail };