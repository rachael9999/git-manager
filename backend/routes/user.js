const express = require('express');
const { fetchUserProfile, fetchUserRepos } = require('../service/fetchUser');
const rateLimiter = require('../utils/rateLimiter');
const { logger } = require('../utils/logger/winstonConfig');

const router = express.Router();

router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const userData = await rateLimiter.schedule(async () => {
      return await fetchUserProfile(username);
    });
    
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

router.get('/:username/repos/:page', async (req, res) => {
  try {
    const { username, page: pageParam } = req.params;
    const page = parseInt(pageParam);
    
    if (isNaN(page) || page < 1) {
      return res.status(400).json({ error: 'Invalid page number' });
    }
    
    try {
      const userData = await rateLimiter.schedule(async () => {
        return await fetchUserProfile(username);
      });
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

module.exports = router;