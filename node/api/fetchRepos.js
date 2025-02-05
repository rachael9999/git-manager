const axios = require('axios');
const {logger} = require('../logger/winstonConfig');
const cache = require('../redis/cacheManager');
const { splitPage } = require('../splitPage');

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
      const lastPage = await cache.getPageFromCache(prevPageKey);
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

    // Split and cache pages
    const pages = splitPage(response.data);
    const startPage = requestedPage;
    
    for (let i = 0; i < pages.length; i++) {
      const pageKey = `${apiPath}_page_${startPage + i}`;
      await cache.cachePage(pageKey, pages[i]);
    }

    // Update session last page
    const sessionKey = `session_${sessionId}_${apiPath}_last_page`;
    await cache.setSessionLastPage(sessionKey, requestedPage);

    const currentPageKey = `${apiPath}_page_${requestedPage}`;
    return await cache.getPageFromCache(currentPageKey);
  } catch (error) {
    logger.error('Repository fetch error:', error);
    throw error;
  }
}

module.exports = fetchRepositories;