const express = require('express');
const { fetchUserProfile, fetchUserRepos } = require('../service/fetchUser');
const { logger } = require('../utils/logger/winstonConfig');
const cacheManager = require('../middleware/redis/cacheManager');

const router = express.Router();

// Most specific routes first
router.get('/:username/repos_max_page', async (req, res) => {
  try {
    const { username } = req.params;
    const maxPage = await cacheManager.getUserRepoMaxPageCount(username);
    console.log('maxPage in user route', maxPage);
    
    if (!maxPage) {
      // If max page doesn't exist yet, fetch user repos first
      const userData = await fetchUserProfile(username);
      if (userData.status === 404) {
        return res.status(404).json({ error: 'User not found' });
      }
      // Fetch first page to trigger caching
      await fetchUserRepos(username, 1);
      // Try to get max page again
      const maxPageRetry = await cacheManager.getUserRepoMaxPageCount(username);
      if (!maxPageRetry) {
        return res.json('1'); // Default to 1 if still not found
      }
      return res.json(maxPageRetry.toString());
    }
    return res.json(maxPage.toString());
  } catch (error) {
    logger.error('Max page fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch max page' });
  }
});

router.get('/:username/repos/:page', async (req, res) => {
  try {
    const { username, page: pageParam } = req.params;
    const page = parseInt(pageParam);
    
    if (isNaN(page) || page < 1) {
      return res.status(400).json({ error: 'Invalid page number' });
    }
    
    try {
      const userData = await fetchUserProfile(username);
      if (userData.status === 404) {
        return res.status(404).json({ error: userData.error });
      }
      const repos = await fetchUserRepos(username, page);

      if (repos.status === 303) {
        return res.status(303).json(repos);
      }
      if (repos.status === 404) {
        return res.status(404).json({ error: repos.error });
      }

      return res.json(repos.data || repos);
    } catch (error) {
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'User not found' });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Repository fetch error:', error);
    return res.status(error.response?.status || 500)
      .json({ error: 'Failed to fetch user repositories' });
  }
});

// Most generic route last
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const userData = await fetchUserProfile(username);
    
    if (userData.status === 404) {
      return res.status(404).json({ error: userData.error });
    }
    
    return res.json(userData.data || userData);
  } catch (error) {
    logger.error('User fetch error:', error);
    return res.status(error.response?.status || 500)
      .json({ error: 'Failed to fetch user data' });
  }
});

module.exports = router;