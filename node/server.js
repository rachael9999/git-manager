const express = require('express');
const { logger } = require('./logger/winstonConfig');
const dotenv = require('dotenv');
const session = require('express-session');
const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;
const cacheMiddleware = require('./redis/cacheMiddleware');
const fetchRepositories = require('./api/fetchRepos');

dotenv.config();

const app = express();
app.use(express.json());

// Create Redis client
const redisClient = createClient();
redisClient.connect().catch(console.error);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

// Route to fetch repositories
app.get('/repositories', cacheMiddleware(), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const repos = await fetchRepositories(0, page, req.session.id);
    
    if (repos.redirect) {
      return res.status(303).json({ redirect: true, page: repos.page });
    }
    
    res.json(repos);
  } catch (error) {
    logger.error('Error fetching repositories:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});