const express = require('express');
const { fetchRepositories, fetchRepoDetail } = require('../service/fetchRepos');
const { logger } = require('../utils/logger/winstonConfig');
const cacheManager = require('../middleware/redis/cacheManager');

const router = express.Router();

router.get('/full', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const repositories = await fetchRepositories(undefined, page);

    if (repositories.redirect) {
      return res.status(303).json(repositories);
    }
    if (repositories.status === 303) {
      return res.status(303).json(repositories);
    }

    return res.json(repositories.data || repositories);
  } catch (error) {
    logger.error('Repository fetch error:', error);
    return res.status(error.response?.status || 500)
      .json({ error: 'Failed to fetch repositories' });
  }
});

router.get('/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const detail = await fetchRepoDetail(id);
    return res.json(detail.data || detail);
  } catch (error) {
    logger.error('Repository detail fetch error:', error);
    return res.status(error.response?.status || 500)
      .json({ error: 'Failed to fetch repository detail' });
  }
});

router.get('/trending', async (req, res) => {
  try {
    const { period = 'week', language } = req.query;
    const trendingRepos = await fetchTrendingRepositories(period, language);
    return res.json(trendingRepos);
  } catch (error) {
    logger.error('Trending repositories fetch error:', error);
    return res.status(error.response?.status || 500)
      .json({ error: 'Failed to fetch trending repositories' });
  }
});

module.exports = router;