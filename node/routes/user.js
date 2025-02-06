const express = require('express');
const { fetchUserProfile, fetchUserRepos } = require('../service/fetchUser');
const { logger } = require('../utils/logger/winstonConfig');

const router = express.Router();

router.get('/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const userData = await fetchUserProfile(username);
        res.json(userData);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch user data' });
    }
});

router.get('/:username/repos/:page', async (req, res) => {
    try {
        const { username, page: pageParam } = req.params;
        const page = parseInt(pageParam);
        
        if (isNaN(page) || page < 1) {
            return res.status(400).json({ error: 'Invalid page number' });
        }
        
        // First fetch user to verify existence
        try {
            await fetchUserProfile(username);
        } catch (error) {
            if (error.response?.status === 404) {
                return res.status(404).json({ error: 'User not found' });
            }
            throw error;
        }

        const repos = await fetchUserRepos(username, page);
        if (repos.length === 0) {
            // ask for redirect to first page
            return res.status(303).json({ redirect: true, page: 1 });
        }
        return res.json(repos);
    } catch (error) {
        logger.error('Repository fetch error:', error);
        return res.status(error.response?.status || 500)
            .json({ error: 'Failed to fetch user repositories' });
    }
});

module.exports = router;