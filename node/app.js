const express = require('express');
const { logger } = require('./utils/logger/winstonConfig');
const dotenv = require('dotenv');
const session = require('express-session');
const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;
const cacheMiddleware = require('./redis/cacheMiddleware');
const cors = require('cors');
const repositoriesRouter = require('./routes/repositories');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Create Redis client
const redisClient = createClient();
redisClient.connect().catch(console.error);

// Session configuration
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'git',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

// Use repositories route with cache middleware
app.use('/repositories', cacheMiddleware(3600), repositoriesRouter);

module.exports = app;