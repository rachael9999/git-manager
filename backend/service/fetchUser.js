const axios = require('axios');
const { logger } = require('../utils/logger/winstonConfig');
const cache = require('../redis/cacheManager');
const { splitPage } = require('../utils/splitPage');

async function fetchUserProfile(username) {
    try {
        const cacheKey = `user_${username}`;
        const cachedData = await cache.getValueFromCache(cacheKey);
        if (cachedData) return cachedData;

        const response = await axios.get(`https://api.github.com/users/${username}`, {
            headers: {
                Accept: 'application/vnd.github.v3+json'
            },
            proxy: false
        });

        await cache.cacheValue(cacheKey, response.data);
        return response.data;
    } catch (error) {
        logger.error(`User fetch error for ${username}:`, error);
        throw error;
    }
}

async function fetchUserRepos(username, page = 1) {
    try {
        logger.debug(`Fetching user repos for ${username}, page ${page}`);
        const cacheKey = `user_repos_${username}_${page}`;
        
        // Check if requested page is cached
        const cachedData = await cache.getValueFromCache(cacheKey);
        if (cachedData) return cachedData;

        if (page > 1) {
            const maxPage = await cache.getValueFromCache(`user_repos_${username}_max`);
            // if page is greater than max page, return redirect
            if (page > maxPage) {
                return { redirect: true, page: 1 };
            }
        }

        // Fetch all repos
        const response = await axios.get(`https://api.github.com/users/${username}/repos`, {
            headers: {
                Accept: 'application/vnd.github.v3+json'
            },
            params: {
                sort: 'updated'
            },
            proxy: false
        });

        // Split into pages of 10
        const pages = splitPage(response.data);
        
        // Cache each page
        for (let i = 0; i < pages.length; i++) {
            const pageKey = `user_repos_${username}_${i + 1}`;
            await cache.cacheValue(pageKey, pages[i]);
        }
        // cache max page number
        await cache.cacheValue(`user_repos_${username}_max`, pages.length);
        logger.info(`User repos fetched for ${username}, ${pages.length} pages`);

        if (page > pages.length) {
            return { redirect: true, page: 1 };
        }

        // Return requested page
        return pages[page - 1] || [];
    } catch (error) {
        logger.error(`User repos fetch error for ${username}:`, error);
        throw error;
    }


}

module.exports = { fetchUserProfile, fetchUserRepos };