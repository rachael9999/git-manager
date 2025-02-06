const axios = require('axios');
const {logger} = require('../utils/logger/winstonConfig');
const cache = require('../redis/cacheManager');
const { splitPage } = require('../utils/splitPage');

async function fetchRepositories(since = 0, requestedPage = 1, sessionId = null) {
  try {
    const apiPath = 'repositories';

    let sinceId = 0;

    // check if the requested page - 1 is already cached
    // if yes, get the last id from the last page
    // if not, get the last page from the session
    // get the last id from the last page
    if (requestedPage > 1) {
      const prevPageKey = `${apiPath}_page_${requestedPage - 1}`;
      const lastPage = await cache.getValueFromCache(prevPageKey);
      if (lastPage) {
        sinceId = lastPage[lastPage.length - 1].id;
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
      await cache.cacheValue(pageKey, pages[i]);
    }

    // Update session last page
    const sessionKey = `session_${sessionId}_${apiPath}_last_page`;
    await cache.setSessionLastPage(sessionKey, requestedPage);

    const currentPageKey = `${apiPath}_page_${requestedPage}`;
    return await cache.getValueFromCache(currentPageKey);
  } catch (error) {
    logger.error('Repository fetch error:', error);
    throw error;
  }
}

async function fetchRepoDetail(repoId) {
  if (!repoId) {
    logger.error('Repository detail fetch error: No repoId provided');
    return null;
  }
  try {
    const response = await axios.get(`https://api.github.com/repositories/${repoId}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      },
      proxy: false
    });

    // save the data to cache
    // const cacheKey = `detail_repo_${repoId}`;
    const cacheKey = `detail_repo_${repoId}`;
    await cache.cacheValue(cacheKey, response.data);

    return response.data;
  } catch (error) {
    logger.error('Repository detail fetch error:', error);
    throw error;
  }
}


module.exports = { fetchRepositories, fetchRepoDetail };