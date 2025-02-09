const request = require('supertest');
const express = require('express');
const cacheMiddlewareRepo = require('../middleware/redis/cacheMiddlewareRepo');
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
app.use('/repositories', cacheMiddlewareRepo(3600), (req, res) => {
  res.status(200).json({ message: 'Success' });
});
app.use('/user/profile', (req, res) => {
  res.status(200).json({ message: 'Success' });
});

const sampleData = { data: { key: 'value' } };
const sample404Data = { status: 404, error: 'Not found' };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('cacheMiddlewareRepo', () => {
  test('should return cached data for repository page', async () => {
    cacheManager.getCacheValue.mockResolvedValue(sampleData);
    redisClient.updateTime.mockResolvedValue(true);

    const response = await request(app).get('/repositories/full?page=1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(sampleData.data);
    expect(cacheManager.getCacheValue).toHaveBeenCalledWith('repositories_page_1');
    expect(redisClient.updateTime).toHaveBeenCalledWith('repositories_page_1', 3600);
  });

  test('should proceed to next middleware on cache miss for repository page', async () => {
    cacheManager.getCacheValue.mockResolvedValue(null);

    const response = await request(app).get('/repositories/full?page=1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Success' });
    expect(cacheManager.getCacheValue).toHaveBeenCalledWith('repositories_page_1');
  });

  test('should return cached data for repository detail', async () => {
    cacheManager.getCacheValue.mockResolvedValue(sampleData);
    redisClient.updateTime.mockResolvedValue(true);

    const response = await request(app).get('/repositories/detail/123');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(sampleData.data);
    expect(cacheManager.getCacheValue).toHaveBeenCalledWith('detail_repo_123');
    expect(redisClient.updateTime).toHaveBeenCalledWith('detail_repo_123', 3600);
  });

  test('should proceed to next middleware on cache miss for repository detail', async () => {
    cacheManager.getCacheValue.mockResolvedValue(null);

    const response = await request(app).get('/repositories/detail/123');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Success' });
    expect(cacheManager.getCacheValue).toHaveBeenCalledWith('detail_repo_123');
  });

  test('should return 404 for cached 404 status', async () => {
    cacheManager.getCacheValue.mockResolvedValue(sample404Data);
    redisClient.updateTime.mockResolvedValue(true);

    const response = await request(app).get('/repositories/detail/123');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not found' });
    expect(cacheManager.getCacheValue).toHaveBeenCalledWith('detail_repo_123');
    expect(redisClient.updateTime).toHaveBeenCalledWith('detail_repo_123', 600);
  });

  test('should bypass middleware for non-repository routes', async () => {
    const response = await request(app).get('/user/profile');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Success' });
    expect(cacheManager.getCacheValue).not.toHaveBeenCalled();
  });
});
