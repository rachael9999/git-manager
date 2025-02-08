const express = require('express');
const { fetchRepositories, fetchRepoDetail } = require('../service/fetchRepos');
const rateLimiter = require('../utils/rateLimiter');
const { logger } = require('../utils/logger/winstonConfig');

const router = express.Router();

router.get('/full', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const repos = await rateLimiter.schedule(async () => {
      return await fetchRepositories(0, page, req.session.id);
    });
    
    if (repos.redirect) {
      return res.status(303).json({ redirect: true, page: repos.page });
    }
    
    res.json(repos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

router.get('/detail/:id', async (req, res) => {
  try {
    logger.info(`Fetching repo detail with id: ${req.params.id}`);
    
    if (!req.params.id) {
      logger.error('No repository ID provided');
      return res.status(400).json({ error: 'Repository ID is required' });
    }

    const repoDetail = await rateLimiter.schedule(async () => {
      return await fetchRepoDetail(req.params.id);
    });
    
    if (!repoDetail) {
      logger.error(`No repository found with id: ${req.params.id}`);
      return res.status(404).json({ error: 'Repository not found' });
    }

    res.json(repoDetail);
  } catch (error) {
    logger.error(`No repository found with id: ${req.params.id}`);
    return res.status(404).json({ error: 'Repository not found' });
  }
});

module.exports = router;