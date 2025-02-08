const express = require('express');
jest.mock('../middleware/redis/cacheManager');
jest.mock('../middleware/redis/redisClient');
jest.mock('../utils/logger/winstonConfig');

const app = express();
app.use(express.json());