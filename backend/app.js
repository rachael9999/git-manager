const express = require('express');
const { logger } = require('./utils/logger/winstonConfig');
const dotenv = require('dotenv');
const session = require('express-session');
const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;
const cacheMiddlewareRepo = require('./redis/cacheMiddlewareRepo');
const cacheMiddlewareUser = require('./redis/cacheMiddlewareUser');
const cors = require('cors');
const repositoriesRouter = require('./routes/repositories');
const userRouter = require('./routes/user');

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
app.use('/repositories', cacheMiddlewareRepo(3600), repositoriesRouter);

app.use('/user', cacheMiddlewareUser(3600), userRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

module.exports = app;