const redisClient = require('../middleware/redis/redisClient');
const cacheManager = require('../middleware/redis/cacheManager');
const { logger } = require('../utils/logger/winstonConfig');

jest.mock('../middleware/redis/redisClient');
jest.mock('../utils/logger/winstonConfig');

const mockRedisClient = redisClient;

const sampleData = { key: 'value' };
const sampleKey = 'sampleKey';
const sampleTTL = 3600;
const sampleUsername = 'testUser';
const sampleMaxPage = 5;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('cacheManager', () => {
  test('should have a function named getCacheValue', () => {
    expect(typeof cacheManager.getCacheValue).toBe('function');
  });

  test('should have a function named setCacheValue', () => {
    expect(typeof cacheManager.setCacheValue).toBe('function');
  });

  test('should have a function named setUserRepoMaxPageCount', () => {
    expect(typeof cacheManager.setUserRepoMaxPageCount).toBe('function');
  });

  test('should have a function named getUserRepoMaxPageCount', () => {
    expect(typeof cacheManager.getUserRepoMaxPageCount).toBe('function');
  });

  test('getCacheValue should return parsed data from redis', async () => {
    mockRedisClient.get.mockResolvedValue(JSON.stringify(sampleData));
    const result = await cacheManager.getCacheValue(sampleKey);
    expect(result).toEqual(sampleData);
  });

  test('setCacheValue should set data in redis with TTL', async () => {
    await cacheManager.setCacheValue(sampleKey, sampleData, sampleTTL);
    expect(mockRedisClient.setEx).toHaveBeenCalledWith(sampleKey, sampleTTL, JSON.stringify(sampleData));
  });

  test('setUserRepoMaxPageCount should set max page count in redis', async () => {
    await cacheManager.setUserRepoMaxPageCount(sampleUsername, sampleMaxPage);
    expect(mockRedisClient.setEx).toHaveBeenCalledWith(`user_repos_${sampleUsername}_max_page`, sampleTTL, sampleMaxPage);
  });

  test('getUserRepoMaxPageCount should return max page count from redis', async () => {
    mockRedisClient.get.mockResolvedValue(sampleMaxPage.toString());
    const result = await cacheManager.getUserRepoMaxPageCount(sampleUsername);
    expect(result).toBe(sampleMaxPage);
  });
});

describe('Cache Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get cache value', async () => {
    const mockData = { key: 'value' };
    redisClient.get.mockResolvedValue(JSON.stringify(mockData));

    const result = await cacheManager.getCacheValue('testKey');
    expect(result).toEqual(mockData);
    expect(redisClient.get).toHaveBeenCalledWith('testKey');
  });

  test('should set cache value', async () => {
    await cacheManager.setCacheValue('testKey', { key: 'value' }, 3600);

    expect(redisClient.setEx).toHaveBeenCalledWith('testKey', 3600, JSON.stringify({ key: 'value' }));
    expect(logger.info).toHaveBeenCalledWith('Data cached for testKey');
  });

  test('should set user repo max page count', async () => {
    await cacheManager.setUserRepoMaxPageCount('testUser', 5);

    expect(redisClient.setEx).toHaveBeenCalledWith('user_repos_testUser_max_page', 3600, 5);
    expect(logger.info).toHaveBeenCalledWith('Max page count cached for user_repos_testUser_max_page');
  });

  test('should get user repo max page count', async () => {
    redisClient.get.mockResolvedValue('5');

    const result = await cacheManager.getUserRepoMaxPageCount('testUser');
    expect(result).toBe(5);
    expect(redisClient.get).toHaveBeenCalledWith('user_repos_testUser_max_page');
  });
});