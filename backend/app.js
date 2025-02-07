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
const path = require('path');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

app.use('/repositories', cacheMiddlewareRepo(3600), repositoriesRouter);

app.use('/user', cacheMiddlewareUser(3600), userRouter);

// Static file serving
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  // Handle client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app;