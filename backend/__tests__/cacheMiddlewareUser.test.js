const request = require('supertest');
const express = require('express');
const cacheMiddlewareUser = require('../middleware/redis/cacheMiddlewareUser');
const cacheManager = require('../middleware/redis/cacheManager');
const redisClient = require('../middleware/redis/redisClient');
const { logger } = require('../utils/logger/winstonConfig');
const session = require('express-session');

jest.mock('../middleware/redis/cacheManager');
jest.mock('../middleware/redis/redisClient');
jest.mock('../utils/logger/winstonConfig');

const app = express();
app.use(express.json());
app.use(session({
  secret: 'testSecret',
  resave: false,
  saveUninitialized: true
}));
app.use('/user', cacheMiddlewareUser(7200), (req, res) => {
  res.status(200).json({ message: 'Success' });
});

const sampleData = { data: { key: 'value' } };
const sample404Data = { status: 404, error: 'Not found' };
const sample303Data = { status: 303, redirect: true, page: 1 };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('cacheMiddlewareUser', () => {
  test('return cached data for user profile', async () => {
    cacheManager.getCacheValue.mockResolvedValue(sampleData);
    redisClient.updateTime.mockResolvedValue(true);

    const response = await request(app).get('/user/testUser');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(sampleData.data);
    expect(cacheManager.getCacheValue).toHaveBeenCalledWith('user_testUser');
    expect(redisClient.updateTime).toHaveBeenCalledWith('user_testUser', 7200);
  });

  test('proceed to next on cache miss for user detail', async () => {
    cacheManager.getCacheValue.mockResolvedValue(null);

    const response = await request(app).get('/user/testUser');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Success' });
    expect(cacheManager.getCacheValue).toHaveBeenCalledWith('user_testUser');
  });

  test('return cached data for user repos', async () => {
    cacheManager.getCacheValue.mockResolvedValue(sampleData);
    redisClient.updateTime.mockResolvedValue(true);

    const response = await request(app).get('/user/testUser/repos/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(sampleData.data);
    expect(cacheManager.getCacheValue).toHaveBeenCalledWith('user_repos_testUser_1');
    expect(redisClient.updateTime).toHaveBeenCalledWith('user_repos_testUser_1', 7200);
  });

  test('proceed to next on cache miss for user repos', async () => {
    cacheManager.getCacheValue.mockResolvedValue(null);

    const response = await request(app).get('/user/testUser/repos/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Success' });
    expect(cacheManager.getCacheValue).toHaveBeenCalledWith('user_repos_testUser_1');
  });

  test('return 404 for cached 404 status', async () => {
    cacheManager.getCacheValue.mockResolvedValue(sample404Data);
    redisClient.updateTime.mockResolvedValue(true);

    const response = await request(app).get('/user/testUser');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not found' });
    expect(cacheManager.getCacheValue).toHaveBeenCalledWith('user_testUser');
    expect(redisClient.updateTime).toHaveBeenCalledWith('user_testUser', 600);
  });

  test('return 303 for cached 303 status', async () => {
    cacheManager.getCacheValue.mockResolvedValue(sample303Data);
    redisClient.updateTime.mockResolvedValue(true);

    const response = await request(app).get('/user/testUser/repos/1');

    expect(response.status).toBe(303);
    expect(response.body).toEqual(sample303Data);
    expect(cacheManager.getCacheValue).toHaveBeenCalledWith('user_repos_testUser_1');
    expect(redisClient.updateTime).toHaveBeenCalledWith('user_repos_testUser_1', 7200);
  });
});
