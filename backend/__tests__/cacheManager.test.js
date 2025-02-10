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
  test('getCacheValue', async() => {
    expect(typeof cacheManager.getCacheValue).toBe('function');
    mockRedisClient.get.mockResolvedValue(JSON.stringify(sampleData));
    const result = await cacheManager.getCacheValue(sampleKey);
    expect(result).toEqual(sampleData);
  });

  test('setCacheValue', async() => {
    expect(typeof cacheManager.setCacheValue).toBe('function');
    await cacheManager.setCacheValue(sampleKey, sampleData, sampleTTL);
    expect(mockRedisClient.setEx).toHaveBeenCalledWith(sampleKey, sampleTTL, JSON.stringify(sampleData));
  });

  test('setUserRepoMaxPageCount', async() => {
    expect(typeof cacheManager.setUserRepoMaxPageCount).toBe('function');
    await cacheManager.setUserRepoMaxPageCount(sampleUsername, sampleMaxPage);
    expect(mockRedisClient.setEx).toHaveBeenCalledWith(`user_repos_${sampleUsername}_max_page`, sampleTTL, sampleMaxPage.toString());
  });

  test('getUserRepoMaxPageCount', async() => {
    expect(typeof cacheManager.getUserRepoMaxPageCount).toBe('function');
    mockRedisClient.get.mockResolvedValue(sampleMaxPage.toString());
    const result = await cacheManager.getUserRepoMaxPageCount(sampleUsername);
    expect(result).toBe(sampleMaxPage);
  });

});
