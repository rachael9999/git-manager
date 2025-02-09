const express = require('express');
const { fetchRepositories, fetchRepoDetail, fetchTrendingRepositories } = require('../service/fetchRepos');
const { logger } = require('../utils/logger/winstonConfig');
const cacheMiddlewareRepo = require('../middleware/redis/cacheMiddlewareRepo');

const router = express.Router();

// Apply cache middleware to all routes
router.use(cacheMiddlewareRepo());

router.get('/full', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const repositories = await fetchRepositories(undefined, page);

    // Handle redirect cases
    if (repositories?.redirect || repositories?.status === 303) {
      return res.status(303).json({ redirect: true, page: repositories.page || 1 });
    }

    // Handle nested data structures from cache or direct response
    let repoData;
    if (repositories?.status === 200 && repositories?.data) {
      repoData = repositories.data;
    } else if (repositories?.data) {
      repoData = repositories.data;
    } else if (Array.isArray(repositories)) {
      repoData = repositories;
    } else {
      throw new Error('Invalid repository data format');
    }

    if (!Array.isArray(repoData)) {
      throw new Error('Repository data must be an array');
    }

    return res.json(repoData);
  } catch (error) {
    logger.error('Repository fetch error:', error);
    return res.status(error.response?.status || 500)
      .json({ error: 'Failed to fetch repositories' });
  }
});

// Handle the detail route
router.get('/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const detail = await fetchRepoDetail(id);
    // Handle both the cached and direct response formats
    const responseData = detail?.data || detail;
    if (!responseData || typeof responseData !== 'object') {
      throw new Error('Invalid repository detail format');
    }
    return res.json(responseData);
  } catch (error) {
    logger.error('Repository detail fetch error:', error);
    return res.status(error.response?.status || 500)
      .json({ error: 'Failed to fetch repository detail' });
  }
});

router.get('/trending', async (req, res) => {
  try {
    const { period = 'day', language, page = 1 } = req.query;
    if (!['day', 'week', 'month'].includes(period)) {
      return res.status(400).json({ error: 'Invalid period. Use day, week, or month.' });
    }
    
    const requestedPage = parseInt(page);
    if (isNaN(requestedPage) || requestedPage < 1) {
      return res.status(400).json({ error: 'Invalid page number' });
    }

    const trendingRepos = await fetchTrendingRepositories(period, language, requestedPage);
    
    if (trendingRepos.redirect) {
      return res.status(303).json(trendingRepos);
    }

    return res.json(trendingRepos);
  } catch (error) {
    logger.error('Trending repositories fetch error:', error);
    return res.status(error.response?.status || 500)
      .json({ error: 'Failed to fetch trending repositories' });
  }
});

module.exports = router;