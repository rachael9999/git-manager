const express = require('express');
const { fetchUserProfile, fetchUserRepos } = require('../service/fetchUser');
const { logger } = require('../utils/logger/winstonConfig');
const cacheManager = require('../middleware/redis/cacheManager');

const router = express.Router();

router.get('/:username/repos_max_page', async (req, res) => {
  try {
    const { username } = req.params;
    const maxPage = await cacheManager.getUserRepoMaxPageCount(username);
    
    if (!maxPage) {
      try {
        const userData = await fetchUserProfile(username);
        // Forward rate limit headers
        if (userData.headers) {
          Object.entries(userData.headers).forEach(([key, value]) => {
            res.set(key, value);
          });
        }
        
        if (userData.status === 404 || userData.error) {
          return res.status(404).json({ error: 'User not found' });
        }
        if (userData.status === 403 || userData.status === 429) {
          return res.status(userData.status).json({ error: 'Rate limit exceeded' });
        }
        
        const reposResponse = await fetchUserRepos(username, 1);
        // Forward rate limit headers from repos response
        if (reposResponse.headers) {
          Object.entries(reposResponse.headers).forEach(([key, value]) => {
            res.set(key, value);
          });
        }
        
        if (reposResponse.status === 403 || reposResponse.status === 429) {
          return res.status(reposResponse.status).json({ error: 'Rate limit exceeded' });
        }

        const maxPageRetry = await cacheManager.getUserRepoMaxPageCount(username);
        return res.json((maxPageRetry || 1).toString());
      } catch (error) {
        if (error.response?.status === 403 || error.response?.status === 429) {
          // Forward any rate limit headers from error
          if (error.response?.headers) {
            ['x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset'].forEach(header => {
              if (error.response.headers[header]) {
                res.set(header, error.response.headers[header]);
              }
            });
          }
          return res.status(error.response.status).json({ error: 'Rate limit exceeded' });
        }
        throw error;
      }
    }
    return res.json(maxPage.toString());
  } catch (error) {
    logger.error('Max page fetch error:', error);
    return res.status(error.response?.status || 500)
      .json({ error: 'Failed to fetch max page' });
  }
});

router.get('/:username/repos/:page', async (req, res) => {
  try {
    const { username, page: pageParam } = req.params;
    const page = parseInt(pageParam);
    
    if (isNaN(page) || page < 1) {
      return res.status(400).json({ error: 'Invalid page number' });
    }
    
    const reposResponse = await fetchUserRepos(username, page);
    
    // Forward rate limit headers
    if (reposResponse.headers) {
      Object.entries(reposResponse.headers).forEach(([key, value]) => {
        res.set(key, value);
      });
    }
    
    if (reposResponse.error) {
      return res.status(reposResponse.status).json({ error: reposResponse.error });
    }

    return res.json(reposResponse.data);
  } catch (error) {
    logger.error('Repository fetch error:', error);
    return res.status(error.response?.status || 500)
      .json({ error: 'Failed to fetch user repositories' });
  }
});

router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const userData = await fetchUserProfile(username);
    
    // Forward rate limit headers
    if (userData.headers) {
      Object.entries(userData.headers).forEach(([key, value]) => {
        res.set(key, value);
      });
    }
    
    if (userData.error) {
      return res.status(userData.status).json({ error: userData.error });
    }
    
    return res.json(userData.data);
  } catch (error) {
    logger.error('User fetch error:', error);
    return res.status(error.response?.status || 500)
      .json({ error: 'Failed to fetch user data' });
  }
});

module.exports = router;